/**
 * 提取 public/index.html 的 head 内容并优化格式
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取 HTML
const html = fs.readFileSync(
  path.join(__dirname, '../public/index.html'),
  'utf-8'
);

// 提取 head 内容
const headMatch = html.match(/<head[^>]*>([\s\S]*)<\/head>/i);
let headContent = headMatch ? headMatch[1] : '';

// 将内容分割成独立的标签
const tags = headContent
  .replace(/></g, '>\n<')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

// 分组标签
const groups = {
  charset: [],
  viewport: [],
  title: [],
  description: [],
  favicon: [],
  preconnect: [],
  opengraph: [],
  twitter: [],
  fontPreload: [],
  cssPreload: [],
  jsonLd: [],
  cssStylesheet: [],
  noscript: [],
  scripts: []
};

tags.forEach(tag => {
  if (tag.includes('charSet')) groups.charset.push(tag);
  else if (tag.includes('viewport')) groups.viewport.push(tag);
  else if (tag.startsWith('<title')) groups.title.push(tag);
  else if (tag.includes('name="description"')) groups.description.push(tag);
  else if (tag.includes('theme-color') || tag.includes('favicon') || tag.includes('icon') || tag.includes('apple-touch-icon') || tag.includes('manifest')) groups.favicon.push(tag);
  else if (tag.includes('preconnect')) groups.preconnect.push(tag);
  else if (tag.includes('property="og:')) groups.opengraph.push(tag);
  else if (tag.includes('name="twitter:')) groups.twitter.push(tag);
  else if (tag.includes('as="font"')) groups.fontPreload.push(tag);
  else if (tag.includes('as="style"')) groups.cssPreload.push(tag);
  else if (tag.includes('application/ld+json')) {
    // 找到完整的 script 标签（包括内容）
    const scriptStart = headContent.indexOf('<script type="application/ld+json"');
    const scriptEnd = headContent.indexOf('</script>', scriptStart) + 9;
    const fullScript = headContent.substring(scriptStart, scriptEnd);
    groups.jsonLd.push(fullScript);
  }
  else if (tag.includes('rel="stylesheet"')) groups.cssStylesheet.push(tag);
  else if (tag.includes('<noscript')) groups.noscript.push(tag);
  else if (tag.includes('<script') && !tag.includes('application/ld+json')) groups.scripts.push(tag);
});

// 生成格式化的内容
let formattedContent = '';

if (groups.charset.length) {
  formattedContent += '  <!-- Charset and Viewport -->\n';
  formattedContent += groups.charset.map(t => '  ' + t).join('\n') + '\n';
  formattedContent += groups.viewport.map(t => '  ' + t).join('\n') + '\n\n';
}

if (groups.title.length || groups.description.length) {
  formattedContent += '  <!-- Title and Description -->\n';
  formattedContent += groups.title.map(t => '  ' + t).join('\n') + '\n';
  formattedContent += groups.description.map(t => '  ' + t).join('\n') + '\n\n';
}

if (groups.favicon.length) {
  formattedContent += '  <!-- Favicon and Theme -->\n';
  formattedContent += groups.favicon.map(t => '  ' + t).join('\n') + '\n\n';
}

if (groups.preconnect.length) {
  formattedContent += '  <!-- Preconnect -->\n';
  formattedContent += groups.preconnect.map(t => '  ' + t).join('\n') + '\n\n';
}

if (groups.opengraph.length) {
  formattedContent += '  <!-- Open Graph -->\n';
  formattedContent += groups.opengraph.map(t => '  ' + t).join('\n') + '\n\n';
}

if (groups.twitter.length) {
  formattedContent += '  <!-- Twitter Card -->\n';
  formattedContent += groups.twitter.map(t => '  ' + t).join('\n') + '\n\n';
}

if (groups.fontPreload.length) {
  formattedContent += '  <!-- Font Preload -->\n';
  formattedContent += groups.fontPreload.map(t => '  ' + t).join('\n') + '\n\n';
}

if (groups.cssPreload.length) {
  formattedContent += '  <!-- CSS Preload -->\n';
  formattedContent += groups.cssPreload.map(t => '  ' + t).join('\n') + '\n\n';
}

if (groups.jsonLd.length) {
  formattedContent += '  <!-- Structured Data (JSON-LD) -->\n';
  formattedContent += '  ' + groups.jsonLd[0].replace(/\n/g, '\n  ') + '\n\n';
}

if (groups.cssStylesheet.length) {
  formattedContent += '  <!-- CSS Stylesheets -->\n';
  formattedContent += groups.cssStylesheet.map(t => '  ' + t).join('\n') + '\n\n';
}

if (groups.noscript.length) {
  formattedContent += '  <!-- Noscript -->\n';
  formattedContent += '  <noscript data-n-css=""></noscript>\n\n';
}

if (groups.scripts.length) {
  formattedContent += '  <!-- JavaScript Bundles -->\n';
  formattedContent += groups.scripts.map(t => '  ' + t.replace('></script>', ' />').replace(/<script ([^>]+)><\/script>/, '<script $1 />')).join('\n') + '\n';
}

// 生成 Astro 组件
const astroComponent = `---
/**
 * EvervaultHead 组件
 * 
 * 包含从 Evervault 原始 HTML 中提取的所有 head 内容
 * （CSS、JS、meta 标签等）
 * 
 * 使用 Fragment set:html 来正确处理 JSON-LD 和其他特殊标签
 */

const headContent = \`
${formattedContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
---

<Fragment set:html={headContent} />
`;

// 写入文件
const outputPath = path.join(__dirname, '../src/components/EvervaultHead.astro');
fs.writeFileSync(outputPath, astroComponent, 'utf-8');

console.log('✅ EvervaultHead.astro 已生成（优化格式版本）！');
console.log(`📁 位置: ${outputPath}`);
console.log(`📊 标签统计:`);
console.log(`   - Meta 标签: ${groups.charset.length + groups.viewport.length + groups.description.length + groups.favicon.length + groups.opengraph.length + groups.twitter.length}`);
console.log(`   - Link 标签: ${groups.preconnect.length + groups.fontPreload.length + groups.cssPreload.length + groups.cssStylesheet.length}`);
console.log(`   - Script 标签: ${groups.scripts.length + groups.jsonLd.length}`);
