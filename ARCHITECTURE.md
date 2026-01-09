# 项目架构说明

## 🎯 目标

将 `public/index.html` 的内容拆解为模块化组件，同时**保持 Next.js 动画效果完全一致**。

## 🚨 关键发现

### 动画依赖 Next.js JavaScript

原始页面的 FileStream 动画效果是由 **Next.js 打包的 JavaScript 文件**驱动的，而不是纯 CSS。这些 JS 文件包含：

- 动画状态管理（React 组件）
- 滚动触发逻辑
- Intersection Observer
- 动画时间轴控制

### 重要的 JS 文件

```html
<script src="/_next/static/chunks/[hash].js" defer></script>
<!-- 共 30+ 个 JS 文件 -->
```

这些文件会查找特定的 CSS 类名（如 `styles-module__Wsd3JG__fileStream`）并操作 DOM 元素。

## ✅ 正确的拆解方案

### 方案 1：保留原始结构（推荐） ⭐

**策略：** 保留原始 HTML 结构，确保 Next.js 的 JavaScript 能够正常工作。

```
index.astro (当前使用)
├── 加载 public/index.html
├── 提取 head 内容（CSS + JS）
├── 提取 body 内容
├── 服务端处理（删除不需要的元素）
└── 输出完整 HTML
```

**优点：**
- ✅ 动画效果 100% 保留
- ✅ 代码简洁
- ✅ 易于维护

**缺点：**
- ❌ 不够模块化
- ❌ 难以复用 FileStream 组件

### 方案 2：混合方案（可选）

**策略：** 提取可复用的组件，但保留关键的动画结构。

```
index-new.astro
├── EvervaultLayout.astro (加载 head 资源)
├── EvervaultHero.astro (Hero 结构)
│   └── FileStreamHTML.astro (FileStream HTML 片段)
├── A2UIChat.astro (聊天组件)
└── 自定义脚本
```

**优点：**
- ✅ 更模块化
- ✅ 组件可复用
- ⚠️ 动画效果需要测试

**缺点：**
- ❌ 可能破坏 Next.js 的 JS 逻辑
- ❌ 需要精确匹配 DOM 结构

### 方案 3：React 重写（不推荐） ❌

**策略：** 用 React 组件重写 FileStream 动画逻辑。

**为什么不推荐：**
- ❌ 需要完全重写动画逻辑（工作量大）
- ❌ 很难 100% 还原原始效果
- ❌ 维护成本高

## 📁 当前文件结构

### 工作中的文件（方案 1）

```
src/pages/index.astro           ✅ 正常工作，动画完整
src/utils/evervault-loader.ts  ✅ 工具函数
src/components/A2UIChat.astro   ✅ 聊天组件
src/scripts/a2ui-chat.js        ✅ 聊天逻辑
src/styles/a2ui-chat.css        ✅ 聊天样式
```

### 实验性文件（方案 2）

```
src/pages/index-new.astro          🔄 测试中
src/layouts/EvervaultLayout.astro  🔄 布局组件
src/components/EvervaultHero.astro 🔄 Hero 组件
src/components/FileStreamHTML.astro🔄 FileStream HTML
src/styles/filestream.css          ℹ️ 提取的样式
```

### 废弃文件（方案 3）

```
src/components/FileStream.tsx   ❌ React 组件，动画不工作
```

## 🎨 FileStream 动画原理

### DOM 结构

```html
<div class="styles-module__Wsd3JG__fileStream">
  <div class="styles-module__Wsd3JG__horizon" data-active="false">
    <!-- 光线动画 -->
  </div>
  <div class="styles-module__Wsd3JG__mask" data-position="left">
    <!-- 左侧内容（解密后） -->
  </div>
  <div class="styles-module__Wsd3JG__mask" data-position="right">
    <!-- 右侧内容（加密中） -->
  </div>
</div>
```

### JavaScript 控制

Next.js 的 JavaScript 会：

1. **查找元素**
   ```javascript
   const horizon = document.querySelector('.styles-module__Wsd3JG__horizon');
   ```

2. **监听滚动**
   ```javascript
   const observer = new IntersectionObserver(callback);
   observer.observe(fileStream);
   ```

3. **更新状态**
   ```javascript
   horizon.setAttribute('data-active', 'true');
   horizon.style.opacity = '1';
   ```

4. **触发动画**
   - CSS transition 被触发
   - 光线从左到右扫描
   - 元素淡入淡出

### CSS 动画

```css
.horizon[data-active="true"] {
  opacity: 1;
  transition: opacity 0.3s;
}

.horizon[data-active="true"]:after {
  transform: scaleX(1);
  transition: transform 0.9s;
}
```

## 💡 推荐方案

### 对于完整页面：使用方案 1

保持当前的 `index.astro`，因为它：
- ✅ 动画效果完美
- ✅ 代码简洁
- ✅ 易于维护

### 对于可复用组件：创建独立的组件

如果需要在其他页面复用 FileStream 动画：

```astro
---
// src/components/FileStreamSection.astro
import fs from 'fs';
import path from 'path';

// 读取原始 HTML 并提取 FileStream 部分
const html = fs.readFileSync('public/index.html', 'utf-8');
const fileStreamMatch = html.match(
  /<div class="styles-module__Wsd3JG__fileStream">[\s\S]*?<\/div>/
);
const fileStreamHTML = fileStreamMatch ? fileStreamMatch[0] : '';
---

<!-- 直接插入原始 HTML，保留 Next.js 动画逻辑 -->
<Fragment set:html={fileStreamHTML} />
```

但要注意：
- ⚠️ 需要确保页面加载了所有必要的 JS 文件
- ⚠️ 需要确保 DOM 结构符合 Next.js 的期望

## 📊 对比测试

| 页面 | 动画效果 | 模块化 | 推荐 |
|------|---------|--------|------|
| `index.astro` | ✅ 完美 | ⚠️ 一般 | ⭐⭐⭐⭐⭐ |
| `index-new.astro` | 🔄 测试中 | ✅ 好 | 🔄 待验证 |
| React 组件 | ❌ 不工作 | ✅ 很好 | ❌ 不推荐 |

## 🔄 迁移建议

### 短期（当前）

继续使用 `index.astro`，因为它稳定可靠。

### 中期（优化）

如果需要更好的模块化：

1. 测试 `index-new.astro` 确保动画正常
2. 提取常用的 HTML 片段为组件
3. 保持原始 CSS 类名和结构

### 长期（重构）

如果有时间和资源：

1. 分析 Next.js 的动画逻辑
2. 用纯 Astro + 原生 JS 重写动画
3. 创建完全独立的组件系统

但**目前不推荐**，因为投入产出比低。

## 🎯 结论

**最佳实践：** 保留原始 HTML 结构，在其基础上做最小化修改。

```astro
<!-- ✅ 推荐 -->
<Fragment set:html={originalHTML} />

<!-- ❌ 避免 -->
<CustomReactComponent client:load />
```

这样可以确保：
- ✅ 动画效果完全一致
- ✅ 代码稳定可靠
- ✅ 易于维护和调试

---

**记住：** 不要为了模块化而牺牲功能性！先让功能正常工作，再考虑优化架构。
