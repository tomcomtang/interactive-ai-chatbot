import type { APIRoute } from 'astro';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';

// A2UI System Prompt - Official Standard Format
const A2UI_SYSTEM_PROMPT = `You are an A2UI v0.8 compliant JSON generator.

## TRIGGER WORDS (use A2UI format):
创建, 制作, 生成, 设计, 显示, 展示, create, make, build, show, card, button, form, website, page, interface, 卡片, 按钮, 表单, 网站, 页面, 界面, top, richest, ranking, list, 排行, 榜单

## A2UI STANDARD: Return ONLY valid JSON array with exactly these 3 message types:

1. beginRendering
2. surfaceUpdate  
3. dataModelUpdate

## EXACT JSON FORMAT:
[
  {"beginRendering":{"surfaceId":"ID","root":"main","styles":{"primaryColor":"#COLOR"}}},
  {"surfaceUpdate":{"surfaceId":"ID","components":[{"id":"main","component":{"Card":{"child":"content"}}},{"id":"content","component":{"Column":{"children":{"explicitList":["item1","item2"]},"alignment":"start"}}},{"id":"item1","component":{"Text":{"text":{"literalString":"TEXT"},"usageHint":"h2"}}},{"id":"item2","component":{"Text":{"text":{"literalString":"TEXT"},"usageHint":"body"}}}]}},
  {"dataModelUpdate":{"surfaceId":"ID","path":"/","contents":[{"key":"source","valueString":"VALUE"}]}}
]

## COMPONENTS:
- Text: {"Text":{"text":{"literalString":"VALUE"},"usageHint":"h1|h2|h3|body"}}
- Card: {"Card":{"child":"CHILD_ID"}}
- Button: {"Button":{"child":"TEXT_ID","primary":true,"action":{"name":"ACTION"}}}
- Row: {"Row":{"children":{"explicitList":["ID1","ID2"]},"alignment":"center"}}
- Column: {"Column":{"children":{"explicitList":["ID1","ID2"]},"alignment":"start"}}

## CRITICAL RULES:
1. Response MUST start with [ and end with ]
2. NO text before or after JSON
3. NO explanations or comments
4. ALWAYS exactly 3 JSON objects
5. Valid JSON syntax only

For non-UI requests, respond normally with text.`;

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🚀 Chat API called');
    console.log('🔑 API Key available (import.meta):', !!import.meta.env.DEEPSEEK_API_KEY);
    console.log('🔑 API Key available (process.env):', !!process.env.DEEPSEEK_API_KEY);
    
    const { messages }: { messages: UIMessage[] } = await request.json();
    console.log('📨 Received messages:', messages);

    const modelMessages = await convertToModelMessages(messages);
    console.log('🔄 Converted messages:', modelMessages);

    // Add system prompt for A2UI generation
    const messagesWithSystem = [
      { role: 'system' as const, content: A2UI_SYSTEM_PROMPT },
      ...modelMessages
    ];

    console.log('🎯 Sending to AI with system prompt');
    
    // Create DeepSeek client with API key
    const deepseekClient = createDeepSeek({
      apiKey: process.env.DEEPSEEK_API_KEY || import.meta.env.DEEPSEEK_API_KEY,
    });
    
    const result = await streamText({
      model: deepseekClient('deepseek-chat'),
      messages: messagesWithSystem,
      temperature: 0.05, // Even lower temperature for strict format
    });

    console.log('✅ AI response created, streaming...');
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('❌ Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};