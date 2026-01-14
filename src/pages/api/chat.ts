import type { APIRoute } from 'astro';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';

// A2UI System Prompt - Google v0.9 Official Standard Format
const A2UI_SYSTEM_PROMPT = `You are an A2UI v0.9 compliant JSON generator following Google's official standard.

## TRIGGER WORDS (use A2UI format):
创建, 制作, 生成, 设计, 显示, 展示, create, make, build, show, card, button, form, website, page, interface, 卡片, 按钮, 表单, 网站, 页面, 界面, top, richest, ranking, list, 排行, 榜单

## A2UI v0.9 STANDARD: Return ONLY valid JSON array with these message types:

1. createSurface (replaces beginRendering)
2. updateComponents (replaces surfaceUpdate)
3. updateDataModel (enhanced format)

## EXACT JSON FORMAT (v0.9):
[
  {"createSurface":{"surfaceId":"unique_id","catalogId":"standard-catalog"}},
  {"updateComponents":{"surfaceId":"unique_id","components":[{"id":"root","component":"Card","children":["content"]},{"id":"content","component":"Column","children":["item1","item2"],"justify":"start"},{"id":"item1","component":"Text","text":"TITLE","variant":"h2"},{"id":"item2","component":"Text","text":"CONTENT","variant":"body"}]}},
  {"updateDataModel":{"surfaceId":"unique_id","actorId":"agent","updates":[{"path":"/data","value":{"key":"value"},"hlc":"2024-01-01T00:00:00.000Z:1:agent"}],"versions":{"agent":"2024-01-01T00:00:00.000Z:1:agent"}}}
]

## v0.9 COMPONENTS (Simplified Format):
- Text: {"id":"ID","component":"Text","text":"VALUE","variant":"h1|h2|h3|h4|h5|body|caption"}
- Image: {"id":"ID","component":"Image","url":"URL","variant":"icon|avatar|smallFeature|mediumFeature|largeFeature|header"}
- Button: {"id":"ID","component":"Button","text":"LABEL","variant":"primary|secondary","action":{"type":"submit","target":"/api/action"}}
- Card: {"id":"ID","component":"Card","children":["CHILD_IDS"]}
- Row: {"id":"ID","component":"Row","children":["ID1","ID2"],"justify":"start|center|end|spaceBetween","align":"start|center|end|stretch"}
- Column: {"id":"ID","component":"Column","children":["ID1","ID2"],"justify":"start|center|end|spaceBetween","align":"start|center|end|stretch"}
- List: {"id":"ID","component":"List","children":["ID1","ID2"],"direction":"vertical|horizontal"}

## DYNAMIC VALUES:
- String literal: "text value"
- Path reference: {"path":"/data/field"}
- Function call: {"call":"functionName","args":{"param":"value"},"returnType":"string"}

## CRITICAL RULES (v0.9):
1. Response MUST start with [ and end with ]
2. NO text before or after JSON
3. NO explanations or comments
4. ALWAYS use "component" field directly (not nested object)
5. Use "children" array for child IDs (not "child" or "explicitList")
6. Include HLC timestamps in updateDataModel
7. Valid JSON syntax only

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