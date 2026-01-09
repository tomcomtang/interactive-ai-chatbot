/**
 * 将处理后的 Evervault HTML "烘焙"到 .astro 文件
 * 
 * 运行: node scripts/bake-html.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. 读取原始 HTML
const htmlPath = path.join(__dirname, '../public/index.html');
const html = fs.readFileSync(htmlPath, 'utf-8');

// 2. 提取 head 和 body
const headMatch = html.match(/<head[^>]*>([\s\S]*)<\/head>/i);
const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);

let headContent = headMatch ? headMatch[1] : '';
let bodyContent = bodyMatch ? bodyMatch[1] : '';

// 3. 处理 body: 只保留 main 下的 header
function keepOnlyHeaderInMain(html) {
  const mainStart = html.indexOf('<main');
  const mainEnd = html.indexOf('</main>');
  
  if (mainStart === -1 || mainEnd === -1) return html;
  
  const beforeMain = html.substring(0, mainStart);
  const mainSection = html.substring(mainStart, mainEnd + 7);
  const afterMain = html.substring(mainEnd + 7);
  
  const headerEnd = mainSection.indexOf('</header>');
  
  if (headerEnd !== -1) {
    const keepPart = mainSection.substring(0, headerEnd + 9);
    const newMain = keepPart + '</main>';
    return beforeMain + newMain + afterMain;
  }
  
  return html;
}

bodyContent = keepOnlyHeaderInMain(bodyContent);
bodyContent = bodyContent.replace(/Evervault/g, 'EdgeOne');

// 4. 生成 .astro 文件
const astroTemplate = `---
/**
 * A2UI 电商助手 - 烘焙版本
 * 
 * ⚠️ 此文件由 scripts/bake-html.js 自动生成，请勿手动编辑
 * 如需更新，修改 public/index.html 后重新运行: node scripts/bake-html.js
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
  
  <!-- Evervault 原始资源（CSS + JS） -->
  <Fragment set:html={\`${headContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`} />
</head>

<body>
  <!-- Evervault 页面内容（已处理：只保留 header，品牌替换） -->
  <Fragment set:html={\`${bodyContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`} />

  <!-- A2UI 聊天组件 -->
  <A2UIChat />

  <!-- A2UI 聊天逻辑 -->
  <script src="../scripts/a2ui-chat.js"></script>
</body>
</html>
`;

// 5. 写入文件
const outputPath = path.join(__dirname, '../src/pages/index-baked.astro');
fs.writeFileSync(outputPath, astroTemplate, 'utf-8');

console.log('✅ HTML 已烘焙到:', outputPath);
console.log('📊 统计:');
console.log('  - Head 内容:', headContent.length, '字符');
console.log('  - Body 内容:', bodyContent.length, '字符');
