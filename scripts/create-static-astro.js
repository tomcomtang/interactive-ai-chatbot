/**
 * 创建静态版本的 .astro 文件（bodyContent 直接嵌入）
 * 运行: node scripts/create-static-astro.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. 读取处理后的 bodyContent
const bodyContent = fs.readFileSync(
  path.join(__dirname, '../src/pages/body-content.txt'),
  'utf-8'
);

// 2. 读取 headContent
const htmlPath = path.join(__dirname, '../public/index.html');
const html = fs.readFileSync(htmlPath, 'utf-8');
const headMatch = html.match(/<head[^>]*>([\s\S]*)<\/head>/i);
let headContent = headMatch ? headMatch[1] : '';

// 品牌替换
headContent = headContent.replace(/Evervault/g, 'EdgeOne');

// 3. 转义模板字符串中的特殊字符
function escapeForTemplate(str) {
  return str.replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

// 4. 创建 .astro 文件内容
const astroContent = `---
/**
 * A2UI 电商助手 - 静态版本
 * 
 * ⚠️ 此文件由 scripts/create-static-astro.js 自动生成
 * bodyContent 和 headContent 已直接嵌入，无需运行时处理
 */

import A2UIChat from '../components/A2UIChat.astro';
import '../styles/a2ui-chat.css';
---

<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EdgeOne - A2UI 电商助手</title>
  
  <!-- EdgeOne 原始资源（CSS + JS） -->
  <Fragment set:html={\`${escapeForTemplate(headContent)}\`} />
</head>

<body>
  <!-- EdgeOne 页面内容（已处理：只保留 header，品牌替换） -->
  <Fragment set:html={\`${escapeForTemplate(bodyContent)}\`} />

  <!-- A2UI 聊天组件 -->
  <A2UIChat />

  <!-- A2UI 聊天逻辑 -->
  <script src="../scripts/a2ui-chat.js"></script>
</body>
</html>
`;

// 5. 写入文件
const outputPath = path.join(__dirname, '../src/pages/index-static.astro');
fs.writeFileSync(outputPath, astroContent, 'utf-8');

console.log('✅ 已生成:', outputPath);
console.log('📊 统计:');
console.log('  - Head 内容:', headContent.length, '字符');
console.log('  - Body 内容:', bodyContent.length, '字符');
console.log('  - 总文件大小:', astroContent.length, '字符');
