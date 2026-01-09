/**
 * 从 public/index.html 重新提取 head 内容并恢复 EvervaultHead.astro
 */

const fs = require('fs');
const path = require('path');

const publicHtmlPath = path.join(__dirname, '../public/index.html');
const publicHtml = fs.readFileSync(publicHtmlPath, 'utf-8');

// 提取 head 内容
function extractHead(html) {
  const headMatch = html.match(/<head[^>]*>([\s\S]*)<\/head>/i);
  return headMatch ? headMatch[1] : '';
}

const headContent = extractHead(publicHtml);

// 生成 EvervaultHead.astro
const astroContent = `---
/**
 * EvervaultHead 组件
 * 
 * 包含从 Evervault 原始 HTML 中提取的所有 head 内容
 * （CSS、JS、meta 标签等）
 */
---

${headContent}
`;

const headComponentPath = path.join(__dirname, '../src/components/EvervaultHead.astro');
fs.writeFileSync(headComponentPath, astroContent, 'utf-8');

console.log('✅ EvervaultHead.astro 已恢复！');
console.log('📝 文件大小:', astroContent.length, 'bytes');
