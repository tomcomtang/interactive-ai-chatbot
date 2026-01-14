# A2UI Schema 集成指南

## 概述

本项目完全遵循 A2UI v0.9 标准协议，只是在前端渲染样式上有所定制。AI 生成的 JSON 格式完全符合 Google A2UI 规范。

## 文件说明

### 1. `a2ui-schema.json`
- **用途**: 完整的 A2UI v0.9 JSON Schema 定义
- **基于**: Google A2UI 官方 `server_to_client.json` + `standard_catalog.json`
- **作用**: 供 AI 系统参考，确保生成正确格式的 JSON

### 2. `a2ui-system-prompt.md`  
- **用途**: AI 系统提示词模板
- **内容**: 包含 schema 定义 + 使用示例 + 设计模式
- **作用**: 指导 AI 生成丰富的 UI 而不是纯文本

## AI 集成方式

### 方法 1: 嵌入系统提示词
将 `a2ui-system-prompt.md` 的内容作为 AI 的系统提示词：

```typescript
const systemPrompt = await fs.readFile('src/lib/a2ui-system-prompt.md', 'utf-8');

const response = await ai.chat({
  system: systemPrompt,
  messages: [
    { role: 'user', content: 'Show me 3 websites of China' }
  ]
});
```

### 方法 2: 结构化输出 (推荐)
使用 schema 约束 AI 输出格式：

```typescript
const schema = await fs.readFile('src/lib/a2ui-schema.json', 'utf-8');

const response = await ai.chat({
  messages: [...],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "a2ui_response",
      schema: JSON.parse(schema)
    }
  }
});
```

### 方法 3: 提示词 + Schema 组合
```typescript
const systemPrompt = `
You are an A2UI assistant. Generate structured UI using this schema:

${await fs.readFile('src/lib/a2ui-schema.json', 'utf-8')}

Always respond with JSON array format containing createSurface and updateComponents messages.
For lists and collections, use Card components within List containers.
`;
```

## 预期输出格式

AI 应该生成这样的 JSON：

```json
[
  {
    "createSurface": {
      "surfaceId": "main",
      "catalogId": "standard-catalog"
    }
  },
  {
    "updateComponents": {
      "surfaceId": "main",
      "components": [
        {
          "id": "root",
          "component": "Column",
          "children": ["title", "website-list"]
        },
        {
          "id": "title", 
          "component": "Text",
          "variant": "h1",
          "text": "Top 3 Websites in China"
        },
        {
          "id": "website-list",
          "component": "List", 
          "direction": "vertical",
          "children": ["site1-card", "site2-card", "site3-card"]
        },
        {
          "id": "site1-card",
          "component": "Card",
          "children": ["site1-content"]
        },
        {
          "id": "site1-content",
          "component": "Column", 
          "children": ["site1-name", "site1-desc", "site1-url"]
        },
        {
          "id": "site1-name",
          "component": "Text",
          "variant": "h2", 
          "text": "Baidu"
        },
        {
          "id": "site1-desc",
          "component": "Text",
          "variant": "body",
          "text": "China's leading search engine"
        },
        {
          "id": "site1-url", 
          "component": "Text",
          "variant": "caption",
          "text": "www.baidu.com"
        }
        // ... 更多组件
      ]
    }
  }
]
```

## 关键差异

### ❌ 当前问题 (简单文本列表)
```json
{
  "id": "list",
  "component": "List",
  "children": ["text1", "text2", "text3"]
}
```

### ✅ 正确做法 (卡片列表)
```json
{
  "id": "list", 
  "component": "List",
  "children": ["card1", "card2", "card3"]
},
{
  "id": "card1",
  "component": "Card", 
  "children": ["card1-content"]
},
{
  "id": "card1-content",
  "component": "Column",
  "children": ["title", "desc", "link"]
}
```

## 验证方法

1. **Schema 验证**: 使用 `a2ui-schema.json` 验证 AI 输出
2. **结构检查**: 确保有 `createSurface` + `updateComponents`
3. **组件层次**: 检查是否使用了 Card + Column/Row 结构
4. **根组件**: 确保有 `id="root"` 的组件

## 调试技巧

1. **检查 AI 输出**: 确保返回的是 JSON 数组而不是对象
2. **验证组件 ID**: 所有 children 引用的 ID 都必须存在
3. **检查组件类型**: 确保使用了正确的 component 名称
4. **层次结构**: 确保使用了合适的布局组件 (Row/Column/List/Card)

通过正确集成这些文件，AI 将能够生成符合 A2UI 标准的丰富 UI 界面！