/**
 * A2UI-compatible API route using Google Gemini API
 * Follows the exact same approach as A2UI official implementation
 * Reference: A2UI/a2a_agents/python/a2ui_extension/src/a2ui/send_a2ui_to_client_toolset.py
 */

import type { APIRoute } from 'astro';
import { readFileSync } from 'fs';
import { join } from 'path';
import { convertToModelMessages, type UIMessage } from 'ai';
import { GoogleGenAI, Type } from '@google/genai';

// Load A2UI Schema (already wrapped as array in the JSON file, like A2UI)
const getA2UISchema = () => {
  try {
    const schemaPath = join(process.cwd(), 'src/lib/a2ui-schema.json');
    const schemaContent = readFileSync(schemaPath, 'utf-8');
    return JSON.parse(schemaContent);
  } catch (error) {
    console.error('Failed to load A2UI schema:', error);
    throw new Error('A2UI schema not found');
  }
};

// Create A2UI system prompt (exactly like A2UI)
const createA2UISystemPrompt = (a2uiSchema: any) => {
  return `You are an A2UI v0.9 compliant UI generator. When the user requests to create, show, display, or build any UI interface, you MUST call the send_a2ui_json_to_client function.

## CRITICAL: When to Use A2UI
If the user asks to:
- create, make, build, show, display any UI, website, page, interface, card, button, form
- show rankings, lists, top items

You MUST call the send_a2ui_json_to_client function. DO NOT respond with plain text.

## CRITICAL: Response Format
You MUST call the send_a2ui_json_to_client function with a valid A2UI JSON array. Each message in the array is an object with exactly ONE key: createSurface, updateComponents, updateDataModel, or deleteSurface.

## A2UI JSON Schema Reference:
---BEGIN A2UI JSON SCHEMA---
${JSON.stringify(a2uiSchema, null, 2)}
---END A2UI JSON SCHEMA---

## IMPORTANT RULES:
1. ALWAYS return a JSON array, not a single object
2. createSurface MUST have "surfaceId" (not "id") and "catalogId" (use "standard-catalog")
3. updateComponents MUST be an object with "surfaceId" and "components" array (not a direct array)
4. Components MUST use "component" field (not "type"), and properties directly (not in "props" object)
5. Component "id" field is REQUIRED
6. Component "children" is an array of component IDs (strings), not nested objects
7. Text component uses "text" and "variant" (h1, h2, h3, h4, h5, body, caption)
8. Row/Column use "justify" and "align" properties (not "justifyContent", "alignItems")
9. Button uses "action" object, not "actions" array
10. One component MUST have id="root"

## COMPONENT USAGE GUIDELINES:
- Use Card component to group related content (images, text, buttons) together. Cards provide visual separation and structure.
- Use Row component to arrange items horizontally (e.g., multiple cards side by side, buttons in a row).
- Use Column component to arrange items vertically (e.g., stacking cards, vertical lists).
- When showing multiple items (like buildings, products, etc.), wrap each item in a Card, then place Cards in a Row.
- Example structure for displaying multiple items:
  * Root: Column (vertical layout)
    * Row (horizontal layout for multiple items)
      * Card (item 1: Image + Text + Button)
      * Card (item 2: Image + Text + Button)
      * Card (item 3: Image + Text + Button)

## CHART COMPONENT GUIDELINES:
- Use Chart component to display data visualizations (line charts, bar charts, pie charts, etc.)
- Chart data format:
  * For line/bar charts: data array with [{x: 'Label', y: number}] or [{label: 'Label', value: number}]
  * For pie/doughnut charts: data array with [{label: 'Label', value: number}]
  * For radar/polarArea charts: data array with [{label: 'Label', value: number}]
- Chart types: 'line' (line chart), 'bar' (bar chart), 'pie' (pie chart), 'doughnut' (doughnut chart), 'radar' (radar chart), 'polarArea' (polar area chart)
- Always provide a title for the chart to help users understand what data is being displayed
- For line/bar charts, provide xLabel and yLabel to describe the axes
- Example Chart component:
  {
    "id": "sales_chart",
    "component": "Chart",
    "type": "bar",
    "title": "Monthly Sales",
    "xLabel": "Month",
    "yLabel": "Sales ($)",
    "data": [
      {"x": "Jan", "y": 1000},
      {"x": "Feb", "y": 1500},
      {"x": "Mar", "y": 1200}
    ]
  }

## IMAGE URL GUIDELINES:
- When using Image components, ONLY use URLs from reliable sources that are likely to exist:
  * Wikimedia Commons: https://upload.wikimedia.org/wikipedia/commons/...
  * Unsplash: https://images.unsplash.com/... or https://unsplash.com/photos/...
  * Pexels: https://images.pexels.com/...
  * Placeholder services: https://via.placeholder.com/... or https://picsum.photos/...
- DO NOT use URLs from:
  * Random websites you don't know exist
  * URLs that might be outdated or broken
  * URLs from your training data that you're not certain are still valid
- If you cannot find a reliable image URL, you can omit the Image component and use only Text components to describe the item.
- When in doubt about image availability, prefer text-only content over potentially broken image URLs.

## For non-UI requests (general questions, explanations), respond with normal text only.`;
};

// Check if request is UI generation request
const isUIRequest = (messageText: string): boolean => {
  // Check for explicit UI keywords
  if (/create|make|build|show|card|button|form|website|page|interface|top|richest|ranking|list/.test(messageText.toLowerCase())) {
    return true;
  }
  
  // Check if message contains A2UI Action (button click) - this should trigger UI response
  if (messageText.includes('A2UI Action:') || messageText.includes('"action"')) {
    try {
      // Try to extract and parse A2UI Action JSON
      const actionMatch = messageText.match(/A2UI Action:\s*(\{[\s\S]*\})/);
      if (actionMatch) {
        const actionJson = JSON.parse(actionMatch[1]);
        if (actionJson.action && actionJson.action.name) {
          console.log('✅ Detected A2UI Action in message, treating as UI request');
          console.log('📋 Action details:', JSON.stringify(actionJson, null, 2));
          return true;
        }
      }
    } catch (e) {
      // If parsing fails, still check for action keyword
      console.log('⚠️ Failed to parse A2UI Action, but action keyword found');
    }
  }
  
  return false;
};

// Check if content is A2UI JSON (should not be sent as conversation history)
const isA2UIJSON = (content: string): boolean => {
  if (!content || typeof content !== 'string') return false;
  
  const trimmed = content.trim();
  
  // Check for A2UI JSON array pattern
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Check if it contains A2UI message structure
        return parsed.some((msg: any) => 
          msg.createSurface || msg.updateComponents || msg.updateDataModel || msg.deleteSurface ||
          msg.beginRendering || msg.surfaceUpdate || msg.dataModelUpdate // backward compatibility
        );
      }
    } catch (e) {
      // Not valid JSON, continue checking
    }
  }
  
  // Check for A2UI JSON pattern in string (escaped JSON)
  const jsonArrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (jsonArrayMatch) {
    try {
      const parsed = JSON.parse(jsonArrayMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.some((msg: any) => 
          msg.createSurface || msg.updateComponents || msg.updateDataModel || msg.deleteSurface
        );
      }
    } catch (e) {
      // Not valid JSON
    }
  }
  
  return false;
};

// Validate A2UI JSON (similar to A2UI source code)
const validateA2UIJSON = (jsonStr: string, schema: any): any[] => {
  try {
    console.log('Validating A2UI JSON, input length:', jsonStr.length);
    
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
      console.log('Parsed JSON successfully, type:', typeof parsed, 'Is array:', Array.isArray(parsed));
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError.message);
      throw new Error(`Invalid JSON string: ${parseError.message}`);
    }

    // If parsed object contains a2ui_json field, extract it
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) && parsed.a2ui_json) {
      console.log('Found a2ui_json field, extracting...');
      try {
        parsed = typeof parsed.a2ui_json === 'string' 
          ? JSON.parse(parsed.a2ui_json) 
          : parsed.a2ui_json;
      } catch (e) {
        console.error('Failed to parse a2ui_json field:', e);
        throw new Error('Failed to parse a2ui_json field');
      }
    }

    // Must be an array
    if (!Array.isArray(parsed)) {
      console.error('Parsed result is not an array:', typeof parsed, parsed);
      throw new Error(`A2UI JSON must be an array of messages, got ${typeof parsed}`);
    }
    
    // Check for A2UI message structure
    const hasA2UIStructure = parsed.some(msg => 
      msg.createSurface || msg.updateComponents || msg.updateDataModel || msg.deleteSurface
    );
    if (!hasA2UIStructure) {
      console.error('No valid A2UI message structure found in array');
      throw new Error('No valid A2UI message structure found');
    }

    console.log('Validation passed, returning', parsed.length, 'messages');
    return parsed;
  } catch (error: any) {
    console.error('Validation error:', error);
    throw new Error(`Invalid A2UI JSON: ${error.message || error}`);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🚀 Google Gemini API called (A2UI原理)');
    
    const { messages }: { messages: UIMessage[] } = await request.json();
    console.log('📨 Received messages:', messages);

    // Convert message format
    const modelMessages = await convertToModelMessages(messages);

    // Get last user message
    const lastMessage = messages[messages.length - 1];
    const lastMessageText = lastMessage?.parts
      ?.filter((part: any) => part.type === 'text')
      ?.map((part: any) => part.text)
      ?.join('') || '';
    
    const isUI = isUIRequest(lastMessageText);
    console.log('🎯 Is UI request:', isUI);

    const apiKey = process.env.GEMINI_API_KEY 
      || process.env.Gemini_Api_Key
      || import.meta.env.GEMINI_API_KEY 
      || import.meta.env.Gemini_Api_Key;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found. Please set GEMINI_API_KEY or Gemini_Api_Key in .env.local');
    }

    // Initialize Google GenAI
    const genAI = new GoogleGenAI({ apiKey });

    // Build message list
    const apiMessages: any[] = [];
    
    if (isUI) {
      // UI request: Use Function Calling (exactly like A2UI)
      const a2uiSchema = getA2UISchema();
      const systemPrompt = createA2UISystemPrompt(a2uiSchema);
      
      // Add history messages
      modelMessages.slice(0, -1).forEach((msg: any, index: number) => {
        console.log(`📝 Processing history message ${index}:`, { role: msg.role, hasContent: !!msg.content });
        
        // Handle all possible role values: 'user', 'assistant', 'model', 'system'
        if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'model') {
          let msgContent = '';
          if (typeof msg.content === 'string') {
            msgContent = msg.content;
          } else if (Array.isArray(msg.content)) {
            const textPart = msg.content.find((part: any) => part.type === 'text') as { type: 'text'; text: string } | undefined;
            msgContent = textPart?.text || '';
          }
          
          // Skip A2UI JSON responses - they are for UI rendering, not conversation history
          if (msgContent && isA2UIJSON(msgContent)) {
            console.log(`⏭️ Skipping A2UI JSON response (not part of conversation history)`);
            return; // Skip this message
          }
          
          if (msgContent) {
            // Google Gemini API only accepts 'user' or 'model', not 'assistant'
            const geminiRole = (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user';
            console.log(`✅ Adding message with role: ${geminiRole} (original: ${msg.role})`);
            apiMessages.push({
              role: geminiRole,
              parts: [{ text: msgContent }]
            });
          }
        } else {
          console.warn(`⚠️ Skipping message with unknown role: ${msg.role}`);
        }
      });
      
      console.log(`📊 Total history messages added: ${apiMessages.length}`);

      // Add current user message
      const currentUserMsg = modelMessages[modelMessages.length - 1];
      if (currentUserMsg && currentUserMsg.role === 'user') {
        let userContent = '';
        if (typeof currentUserMsg.content === 'string') {
          userContent = currentUserMsg.content;
        } else if (Array.isArray(currentUserMsg.content)) {
          const textPart = currentUserMsg.content.find((part: any) => part.type === 'text') as { type: 'text'; text: string } | undefined;
          userContent = textPart?.text || '';
        }
        
        // Extract and log A2UI Action if present
        if (userContent && userContent.includes('A2UI Action:')) {
          try {
            const actionMatch = userContent.match(/A2UI Action:\s*(\{[\s\S]*\})/);
            if (actionMatch) {
              const a2uiAction = JSON.parse(actionMatch[1]);
              console.log('🎯 A2UI Action extracted from user message:', JSON.stringify(a2uiAction, null, 2));
              console.log('📋 Action name:', a2uiAction.action?.name);
              console.log('📋 Action context:', JSON.stringify(a2uiAction.action?.context, null, 2));
            }
          } catch (e) {
            console.warn('⚠️ Failed to parse A2UI Action from message:', e);
          }
        }
        
        if (userContent) {
          apiMessages.push({
            role: 'user',
            parts: [{ text: userContent }]
          });
        }
      }

      // Define Function Tool (exactly like A2UI)
      const tools: any[] = [
        {
          functionDeclarations: [
            {
              name: 'send_a2ui_json_to_client',
              description: 'Sends A2UI JSON to the client to render rich UI for the user. This tool can be called multiple times in the same call to render multiple UI surfaces. Args: a2ui_json: Valid A2UI JSON Schema to send to the client. The A2UI JSON Schema definition is between ---BEGIN A2UI JSON SCHEMA--- and ---END A2UI JSON SCHEMA--- in the system instructions.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  a2ui_json: {
                    type: Type.STRING,
                    description: 'valid A2UI JSON Schema to send to the client.'
                  }
                },
                required: ['a2ui_json']
              }
            }
          ]
        }
      ];

      console.log('📋 Using Function Calling mode (A2UI原理)');
      console.log('📤 Final apiMessages to send:', JSON.stringify(apiMessages.map(m => ({ role: m.role, textLength: m.parts?.[0]?.text?.length || 0 })), null, 2));
      
      // Print full JSON content being sent to AI
      console.log('🎨 ========== JSON Content Sent to AI ==========');
      console.log(JSON.stringify(apiMessages, null, 2));
      console.log('🎨 ==============================================');

      // Validate all messages have valid roles before sending
      const invalidMessages = apiMessages.filter(m => m.role !== 'user' && m.role !== 'model');
      if (invalidMessages.length > 0) {
        console.error('❌ Invalid message roles found:', invalidMessages);
        throw new Error(`Invalid message roles: ${invalidMessages.map(m => m.role).join(', ')}. Only 'user' and 'model' are allowed.`);
      }

      // Call Gemini API (exactly like A2UI)
      const model = genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: apiMessages,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.05,
          tools: tools,
        }
      });

      const response = await model;
      console.log('✅ Gemini API response received');

      // Process function call response (exactly like A2UI)
      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error('No candidates in response');
      }

      const candidate = candidates[0];
      const functionCalls = candidate.content?.parts?.filter((part: any) => part.functionCall) || [];

      if (functionCalls.length > 0) {
        // Found function call
        const a2uiFunctionCall = functionCalls.find((fc: any) => 
          fc.functionCall?.name === 'send_a2ui_json_to_client'
        );

              if (a2uiFunctionCall?.functionCall?.args?.a2ui_json) {
                const a2uiJsonStr = a2uiFunctionCall.functionCall.args.a2ui_json;
                console.log('✅ Found A2UI function call, validating...');

                const a2uiMessages = validateA2UIJSON(String(a2uiJsonStr), a2uiSchema);
                console.log('✅ Validated A2UI messages:', a2uiMessages.length, 'messages');
                
                // Print final AI JSON configuration to console
                console.log('🎨 ========== Final AI JSON Configuration ==========');
                console.log(JSON.stringify(a2uiMessages, null, 2));
                console.log('🎨 =================================================');

                const finalContent = JSON.stringify(a2uiMessages);
          
          // Return as AI SDK format
          return new Response(
            `0:${JSON.stringify({ type: 'text', text: finalContent })}\n`,
            {
              headers: {
                'Content-Type': 'text/plain; charset=utf-8',
              },
            }
          );
        }
      }

      // No function call, return text content
      const textContent = candidate.content?.parts
        ?.filter((part: any) => part.text)
        ?.map((part: any) => part.text)
        ?.join('') || '';

      return new Response(
        `0:${JSON.stringify({ type: 'text', text: textContent })}\n`,
        {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        }
      );

    } else {
      // Non-UI request: Normal conversation
      modelMessages.forEach((msg: any, index: number) => {
        console.log(`📝 Processing message ${index}:`, { role: msg.role, hasContent: !!msg.content });
        
        // Handle all possible role values: 'user', 'assistant', 'model', 'system'
        if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'model') {
          let msgContent = '';
          if (typeof msg.content === 'string') {
            msgContent = msg.content;
          } else if (Array.isArray(msg.content)) {
            const textPart = msg.content.find((part: any) => part.type === 'text') as { type: 'text'; text: string } | undefined;
            msgContent = textPart?.text || '';
          }
          
          // Skip A2UI JSON responses - they are for UI rendering, not conversation history
          if (msgContent && isA2UIJSON(msgContent)) {
            console.log(`⏭️ Skipping A2UI JSON response (not part of conversation history)`);
            return; // Skip this message
          }
          
          if (msgContent) {
            // Google Gemini API only accepts 'user' or 'model', not 'assistant'
            const geminiRole = (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user';
            console.log(`✅ Adding message with role: ${geminiRole} (original: ${msg.role})`);
            apiMessages.push({
              role: geminiRole,
              parts: [{ text: msgContent }]
            });
          }
        } else {
          console.warn(`⚠️ Skipping message with unknown role: ${msg.role}`);
        }
      });
      
      console.log(`📊 Total messages added: ${apiMessages.length}`);
      console.log('📤 Final apiMessages to send:', JSON.stringify(apiMessages.map(m => ({ role: m.role, textLength: m.parts?.[0]?.text?.length || 0 })), null, 2));

      // Validate all messages have valid roles before sending
      const invalidMessages = apiMessages.filter(m => m.role !== 'user' && m.role !== 'model');
      if (invalidMessages.length > 0) {
        console.error('❌ Invalid message roles found:', invalidMessages);
        throw new Error(`Invalid message roles: ${invalidMessages.map(m => m.role).join(', ')}. Only 'user' and 'model' are allowed.`);
      }

      const model = genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: apiMessages,
        config: {
          temperature: 0.7,
        }
      });

      const response = await model;
      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error('No candidates in response');
      }

      const textContent = candidates[0].content?.parts
        ?.filter((part: any) => part.text)
        ?.map((part: any) => part.text)
        ?.join('') || '';

      return new Response(
        `0:${JSON.stringify({ type: 'text', text: textContent })}\n`,
        {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        }
      );
    }

        } catch (error: any) {
          console.error('❌ Chat API error:', error);
          console.error('❌ Error details:', JSON.stringify(error, null, 2));

          // Extract detailed error from Google GenAI
          const apiError = error?.error || error?.response?.error || error;
          const apiErrorMessage = apiError?.message || error?.message || String(error);
          const apiErrorCode = apiError?.code || error?.status || error?.statusCode || 500;

          // Determine status code based on error code
          let statusCode = 500;
          if (apiErrorCode === 403 || apiErrorCode === 401) {
            statusCode = 401;
          } else if (apiErrorCode === 400) {
            statusCode = 400;
          } else if (apiErrorCode === 429) {
            statusCode = 429;
          }

          // Extract retry delay for quota errors
          let retryDelay: number | undefined;
          let quotaInfo: string | undefined;
          if (apiErrorCode === 429 || apiErrorMessage?.includes('quota') || apiErrorMessage?.includes('Quota exceeded')) {
            // Try to extract retry delay from error details
            const retryInfo = apiError?.details?.find((d: any) => d['@type']?.includes('RetryInfo'));
            if (retryInfo?.retryDelay) {
              retryDelay = parseInt(retryInfo.retryDelay) || undefined;
            }
            
            // Extract quota information
            const quotaFailure = apiError?.details?.find((d: any) => d['@type']?.includes('QuotaFailure'));
            if (quotaFailure?.violations?.[0]) {
              const violation = quotaFailure.violations[0];
              quotaInfo = `Limit: ${violation.quotaValue || 'unknown'}, Metric: ${violation.quotaMetric || 'unknown'}`;
            }
          }

          // Return the REAL error message, not a hardcoded one
          return new Response(JSON.stringify({
            error: 'API Error',
            message: apiErrorMessage, // Return the actual error message
            details: {
              apiError: apiError,
              code: apiErrorCode,
              status: apiError?.status,
              fullError: error,
              // Include helpful info based on error type
              suggestion: (apiErrorCode === 403 || apiErrorCode === 401 || apiErrorMessage?.includes('API key'))
                ? 'Please check your GEMINI_API_KEY at https://aistudio.google.com/'
                : (apiErrorCode === 429 || apiErrorMessage?.includes('quota'))
                ? `Quota exceeded. ${quotaInfo ? `(${quotaInfo})` : ''} ${retryDelay ? `Please retry in ${Math.ceil(retryDelay)} seconds.` : 'Please wait and try again later.'} Free tier limit: 20 requests per day. Upgrade at https://ai.google.dev/pricing`
                : undefined,
              retryDelay: retryDelay,
              quotaInfo: quotaInfo
            }
          }), {
            status: statusCode,
            headers: { 'Content-Type': 'application/json' },
          });
        }
};
