/**
 * A2UI-compatible API route using DeepSeek API (OpenAI-compatible)
 * Same request/response contract as before; only the backing model is switched from Gemini to DeepSeek.
 * Reference: A2UI/a2a_agents/python/a2ui_extension/src/a2ui/send_a2ui_to_client_toolset.py
 */

import type { APIRoute } from 'astro';
import { convertToModelMessages, type UIMessage } from 'ai';
import OpenAI from 'openai';
import a2uiSchema from '../../lib/a2ui-schema.json';

// Load A2UI Schema (already wrapped as array in the JSON file, like A2UI)
const getA2UISchema = () => {
  return a2uiSchema;
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
9. One component MUST have id="root"

## BUTTON ACTION RULES (A2UI v0.9 Standard):
Button actions have TWO types - use the correct one:

1. **For opening external URLs** (Visit Website, Go to Link, Open URL):
   Use "functionCall" with "openUrl" - this runs on client, no server round-trip:
   \`\`\`json
   "action": {
     "functionCall": {
       "call": "openUrl",
       "args": { "url": "https://example.com" }
     }
   }
   \`\`\`

2. **For showing details/next level content** (View Details, Learn More, Show Info):
   Use "event" - this sends to server, AI generates new UI:
   \`\`\`json
   "action": {
     "event": {
       "name": "viewDetails",
       "context": { "itemId": "123", "title": "Item Name" }
     }
   }
   \`\`\`

NEVER use the old format: \`"action": { "name": "...", "context": {...} }\` - this is WRONG!

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
  
  // Check if message is A2UI v0.9 userAction JSON
  // Format: { "userAction": { "name": "...", "surfaceId": "...", "sourceComponentId": "...", "timestamp": "...", "context": {...} } }
  if (messageText.trim().startsWith('{') && messageText.includes('"userAction"')) {
    try {
      const parsed = JSON.parse(messageText.trim());
      if (parsed.userAction && parsed.userAction.name && parsed.userAction.surfaceId) {
        return true;
      }
    } catch (e) {
      // Not valid JSON, continue checking
    }
  }
  
  // Legacy format support: { "action": { ... } }
  if (messageText.trim().startsWith('{') && messageText.includes('"action"')) {
    try {
      const parsed = JSON.parse(messageText.trim());
      if (parsed.action && parsed.action.name && parsed.action.surfaceId && parsed.action.sourceComponentId) {
        return true;
      }
    } catch (e) {
      // Not valid JSON, continue checking
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
const validateA2UIJSON = (jsonStr: string, _schema: any): any[] => {
  try {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError.message);
      throw new Error(`Invalid JSON string: ${parseError.message}`);
    }

    // If parsed object contains a2ui_json field, extract it
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) && parsed.a2ui_json) {
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

    return parsed;
  } catch (error: any) {
    console.error('Validation error:', error);
    throw new Error(`Invalid A2UI JSON: ${error.message || error}`);
  }
};

// CORS headers helper
const getCORSHeaders = (origin?: string | null) => {
  const allowedOrigins = [
    'https://uibot-builder.edgeone.cool',
    'http://localhost:4321',
    'http://localhost:3000',
  ];
  
  const requestOrigin = origin || '';
  const allowOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
};

// Handle OPTIONS preflight request
export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = request.headers.get('Origin');
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders(origin),
  });
};

export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get('Origin');
  const corsHeaders = getCORSHeaders(origin);
  
  try {
    const requestBody = await request.json();
    const messages: UIMessage[] = requestBody.messages ?? [];
    const userAction = requestBody.userAction ?? null;

    console.log('📥 前端提交给接口的JSON数据:');
    console.log(JSON.stringify(requestBody, null, 2));

    // A2UI-style: when client sends userAction (e.g. Details click), we do not use full history as "current" message
    const modelMessages = messages.length ? await convertToModelMessages(messages) : [];
    const lastMessage = messages[messages.length - 1];
    const lastMessageText = lastMessage?.parts
      ?.filter((part: any) => part.type === 'text')
      ?.map((part: any) => part.text)
      ?.join('') || '';

    const isUI = userAction ? true : isUIRequest(lastMessageText);

    // Try multiple ways to get API key (support different deployment environments)
    const apiKey = process.env.DEEPSEEK_API_KEY || import.meta.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      console.error('❌ DEEPSEEK_API_KEY not found. Available env vars:', {
        'process.env.DEEPSEEK_API_KEY': !!process.env.DEEPSEEK_API_KEY,
        'import.meta.env.DEEPSEEK_API_KEY': !!import.meta.env.DEEPSEEK_API_KEY
      });
      return new Response(JSON.stringify({
        error: 'Insufficient Balance',
        message: 'Insufficient balance. Unable to call AI service. Please check your account balance.',
        details: {
          code: 402,
          suggestion: 'Please set DEEPSEEK_API_KEY (e.g. at https://platform.deepseek.com) and ensure you have sufficient credits.'
        }
      }), {
        status: 402,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const client = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com' });

    // Build message list for OpenAI/DeepSeek: { role, content }[]
    const openaiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
    
    if (isUI) {
      const a2uiSchema = getA2UISchema();
      let systemPrompt = createA2UISystemPrompt(a2uiSchema);

      if (userAction) {
        const { name, surfaceId, context } = userAction;
        const actionPrompt = `The user clicked a button. userAction: name="${name}", surfaceId="${surfaceId}". context: ${JSON.stringify(context || {})}.

You MUST respond with an A2UI JSON array of two messages: (1) createSurface with surfaceId "${surfaceId}" and catalogId "standard-catalog", (2) updateComponents for surfaceId "${surfaceId}" with a DETAIL VIEW ONLY: one root Column containing one Card with the full description text from context (use context.description or context.fullDescription or context.full_description) and a Button "Back" or "Close". Do NOT return the full list. The components array must have id "root" and only the detail content.`;
        systemPrompt += `\n\n## When the request is a button action (viewDetails, showFullDescription, etc.):\n${actionPrompt}`;
        openaiMessages.push({ role: 'user', content: actionPrompt });
      } else {
        modelMessages.slice(0, -1).forEach((msg: any) => {
          if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'model') {
            let msgContent = '';
            if (typeof msg.content === 'string') msgContent = msg.content;
            else if (Array.isArray(msg.content)) {
              const textPart = msg.content.find((part: any) => part.type === 'text') as { type: 'text'; text: string } | undefined;
              msgContent = textPart?.text || '';
            }
            if (msgContent && isA2UIJSON(msgContent)) return;
            if (msgContent) {
              const role = (msg.role === 'assistant' || msg.role === 'model') ? 'assistant' : 'user';
              openaiMessages.push({ role, content: msgContent });
            }
          }
        });
        const currentUserMsg = modelMessages[modelMessages.length - 1];
        if (currentUserMsg?.role === 'user') {
          let userContent = '';
          if (typeof currentUserMsg.content === 'string') userContent = currentUserMsg.content;
          else if (Array.isArray(currentUserMsg.content)) {
            const textPart = currentUserMsg.content.find((part: any) => part.type === 'text') as { type: 'text'; text: string } | undefined;
            userContent = textPart?.text || '';
          }
          if (userContent) openaiMessages.push({ role: 'user', content: userContent });
        }
      }

      const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
        {
          type: 'function',
          function: {
            name: 'send_a2ui_json_to_client',
            description: 'Sends A2UI JSON to the client to render rich UI for the user. This tool can be called multiple times in the same call to render multiple UI surfaces. Args: a2ui_json: Valid A2UI JSON Schema to send to the client. The A2UI JSON Schema definition is between ---BEGIN A2UI JSON SCHEMA--- and ---END A2UI JSON SCHEMA--- in the system instructions.',
            parameters: {
              type: 'object',
              properties: {
                a2ui_json: { type: 'string', description: 'Valid A2UI JSON Schema to send to the client.' },
              },
              required: ['a2ui_json'],
            },
          },
        },
      ];

      const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...openaiMessages,
      ];

      const response = await client.chat.completions.create({
        model: 'deepseek-reasoner',
        messages: chatMessages,
        temperature: 0.05,
        tools,
        tool_choice: 'auto',
      });

      const choice = response.choices?.[0];
      if (!choice?.message) {
        throw new Error('No message in DeepSeek response');
      }

      const toolCalls = choice.message.tool_calls;
      const a2uiCall = toolCalls?.find((tc: any) => tc.function?.name === 'send_a2ui_json_to_client');

      if (a2uiCall?.function?.arguments) {
        let args: { a2ui_json?: string };
        try {
          args = typeof a2uiCall.function.arguments === 'string'
            ? JSON.parse(a2uiCall.function.arguments)
            : a2uiCall.function.arguments;
        } catch (e) {
          throw new Error('Failed to parse send_a2ui_json_to_client arguments');
        }
        const a2uiJsonStr = args.a2ui_json;
        if (a2uiJsonStr) {
          const a2uiMessages = validateA2UIJSON(String(a2uiJsonStr), a2uiSchema);
          const finalContent = JSON.stringify(a2uiMessages);
          console.log('📤 AI返回给前端的JSON数据 (A2UI):');
          console.log(JSON.stringify(a2uiMessages, null, 2));
          return new Response(`0:${JSON.stringify({ type: 'text', text: finalContent })}\n`, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders },
          });
        }
      }

      const textContent = choice.message.content ?? '';
      console.log('📤 AI返回给前端的数据 (文本):');
      console.log(textContent);
      return new Response(`0:${JSON.stringify({ type: 'text', text: textContent })}\n`, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders },
      });
    } else {
      // Non-UI request: normal conversation (no tools)
      modelMessages.forEach((msg: any) => {
        if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'model') {
          let msgContent = '';
          if (typeof msg.content === 'string') msgContent = msg.content;
          else if (Array.isArray(msg.content)) {
            const textPart = msg.content.find((part: any) => part.type === 'text') as { type: 'text'; text: string } | undefined;
            msgContent = textPart?.text || '';
          }
          if (msgContent && isA2UIJSON(msgContent)) return;
          if (msgContent) {
            const role = (msg.role === 'assistant' || msg.role === 'model') ? 'assistant' : 'user';
            openaiMessages.push({ role, content: msgContent });
          }
        } else {
          console.warn(`⚠️ Skipping message with unknown role: ${msg.role}`);
        }
      });

      const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [...openaiMessages];
      const response = await client.chat.completions.create({
        model: 'deepseek-reasoner',
        messages: chatMessages,
        temperature: 0.7,
      });

      const choice = response.choices?.[0];
      if (!choice?.message) {
        throw new Error('No message in DeepSeek response');
      }
      const textContent = choice.message.content ?? '';

      console.log('📤 AI返回给前端的数据 (普通对话):');
      console.log(textContent);
      return new Response(`0:${JSON.stringify({ type: 'text', text: textContent })}\n`, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders },
      });
    }

        } catch (error: any) {
          console.error('❌ Chat API error:', error);
          console.error('❌ Error stack:', error?.stack);
          console.error('❌ Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

          const apiError = error?.error || error?.response?.error || error;
          let apiErrorMessage = apiError?.message || error?.message || String(error);
          const apiErrorCode = apiError?.code || error?.status || error?.statusCode || 500;
          
          if (apiErrorMessage.includes('DEEPSEEK_API_KEY') || apiErrorMessage.includes('API key') || apiErrorMessage.includes('api_key')) {
            apiErrorMessage = 'Insufficient balance or invalid API key. Unable to call AI service. Please check DEEPSEEK_API_KEY and balance.';
          } else if (apiErrorMessage.includes('schema')) {
            apiErrorMessage = `Schema loading error: ${apiErrorMessage}. Please ensure a2ui-schema.json exists in src/lib/`;
          } else if (apiErrorMessage.includes('ENOENT')) {
            apiErrorMessage = `File not found: ${apiErrorMessage}. This might be a deployment issue.`;
          }

          // Determine status code based on error code
          let statusCode = 500;
          if (apiErrorCode === 403 || apiErrorCode === 401) {
            statusCode = 401;
          } else if (apiErrorCode === 400) {
            statusCode = 400;
          } else if (apiErrorCode === 429) {
            statusCode = 429;
          } else if (apiErrorCode === 503 || apiErrorCode === 'UNAVAILABLE') {
            statusCode = 503;
          }

          // Extract retry delay for quota errors and service unavailable errors
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
          } else if (apiErrorCode === 503 || apiErrorMessage?.includes('overloaded') || apiErrorMessage?.includes('UNAVAILABLE')) {
            // Extract retry delay for service unavailable errors
            const retryInfo = apiError?.details?.find((d: any) => d['@type']?.includes('RetryInfo'));
            if (retryInfo?.retryDelay) {
              retryDelay = parseInt(retryInfo.retryDelay) || undefined;
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
                ? 'Please set DEEPSEEK_API_KEY (get key at https://platform.deepseek.com) and ensure you have sufficient credits.'
                : (apiErrorCode === 429 || apiErrorMessage?.includes('quota'))
                ? `Quota exceeded. ${quotaInfo ? `(${quotaInfo})` : ''} ${retryDelay ? `Please retry in ${Math.ceil(retryDelay)} seconds.` : 'Please wait and try again later.'}`
                : (apiErrorCode === 503 || apiErrorMessage?.includes('overloaded') || apiErrorMessage?.includes('UNAVAILABLE'))
                ? `Service temporarily unavailable. The AI model is currently overloaded. ${retryDelay ? `Please retry in ${Math.ceil(retryDelay)} seconds.` : 'Please wait a moment and try again.'}`
                : undefined,
              retryDelay: retryDelay,
              quotaInfo: quotaInfo
            }
          }), {
            status: statusCode,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
};
