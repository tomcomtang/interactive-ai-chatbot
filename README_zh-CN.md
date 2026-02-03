# AI 驱动的交互式 UI 生成器

一个现代化的 Web 应用程序，通过自然语言对话与 AI 生成动态、交互式的用户界面。使用 Astro 和 React 构建，具有精美的玻璃拟态设计和实时 UI 渲染功能。

## 特性

- ✅ **自然语言转 UI**：描述您想要的内容，AI 将生成交互式 UI 组件
- ✅ **流式 AI 响应**：实时流式响应，即时反馈
- ✅ **组件化架构**：丰富的 UI 组件集（卡片、按钮、表单、列表、图表等）
- ✅ **现代设计**：玻璃拟态效果，紫色主题和暗色背景
- ✅ **响应式布局**：完全响应式设计，适用于所有设备
- ✅ **类型安全**：使用 TypeScript 构建，提供更好的开发体验

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在项目根目录创建 `.env` 或 `.env.local` 文件：

```env
DEEPSEEK_API_KEY=your_api_key_here
```

API 密钥请在 [DeepSeek 控制台](https://platform.deepseek.com) 获取。部署到 EdgeOne Pages 时，请在 EdgeOne 控制台的环境变量中配置 `DEEPSEEK_API_KEY`。

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:4321

### 4. 构建生产版本

```bash
npm run build
npm run preview
```

## 部署

[![Deploy with EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?template=interactive-ai-chatbot)

## 项目结构

```
├── src/
│   ├── components/
│   │   ├── chat/          # 聊天 UI 组件（React）
│   │   └── ...            # 其他 Astro 组件
│   ├── lib/
│   │   ├── a2ui/          # UI 渲染器和组件工厂
│   │   └── a2ui-renderer.ts
│   ├── pages/
│   │   ├── api/
│   │   │   └── chat.ts    # AI API 端点
│   │   ├── index.astro    # 首页
│   │   └── chat.astro     # 聊天界面
│   └── styles/
│       ├── a2ui.css       # UI 组件样式
│       └── chat.css       # 聊天页面样式
└── package.json
```

## 工作原理

1. **用户输入**：用户输入自然语言请求（例如："显示一个顶级网站列表"）
2. **AI 处理**：请求被发送到 DeepSeek API，带有结构化输出约束
3. **UI 生成**：AI 返回描述 UI 组件的 JSON 结构
4. **渲染**：渲染器解析 JSON 并创建交互式 React 组件
5. **交互**：用户可以与生成的组件交互（按钮、表单等）
6. **操作处理**：用户操作作为结构化消息发送回 AI 进行进一步处理

## 支持的组件

- **基础组件**：文本、图片、按钮、分隔线
- **布局组件**：行、列、列表、卡片
- **表单组件**：文本输入框、复选框
- **数据组件**：图表、进度条、徽章、统计
- **媒体组件**：视频、音频、画廊
- **高级组件**：日历、时间线、树形结构、轮播图

## 技术栈

- **框架**：Astro 4.x（SSR 模式）
- **UI 库**：React 19
- **语言**：TypeScript
- **AI**：DeepSeek API
- **样式**：CSS 玻璃拟态效果

## 开发

### 添加新组件

1. 在 `src/lib/a2ui/components/` 中创建组件工厂函数
2. 在 `src/styles/a2ui.css` 中添加组件样式
3. 在 `src/lib/a2ui/component-factory.ts` 中注册组件

### 自定义样式

修改 `src/styles/a2ui.css` 以自定义组件外观。设计使用：

- 玻璃拟态效果（backdrop-filter、透明度）
- 紫色配色方案（#6432e6, #e62e8b）
- 暗色背景（#0a0a0a）

## 许可证

MIT

## 致谢

本项目受到 A2UI 协议规范的启发，用于 AI 生成的用户界面。实现遵循通过自然语言处理进行结构化 UI 生成的类似方法。
