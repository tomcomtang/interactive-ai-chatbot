/**
 * 提取 public/index.html 的 head 内容并生成原生 Astro 组件
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
  jsonLd: '',
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
    groups.jsonLd = headContent.substring(scriptStart, scriptEnd);
  }
  else if (tag.includes('rel="stylesheet"')) groups.cssStylesheet.push(tag);
  else if (tag.includes('<noscript')) groups.noscript.push(tag);
  else if (tag.includes('<script') && !tag.includes('application/ld+json')) groups.scripts.push(tag);
});

// 格式化 JSON-LD
let formattedJsonLd = '';
if (groups.jsonLd) {
  formattedJsonLd = groups.jsonLd
    .replace(/<script type="application\/ld\+json" data-next-head="">/, '<script type="application/ld+json" data-next-head="">\n    ')
    .replace(/<\/script>/, '\n  </script>')
    .replace(/\{/g, '{\n    ')
    .replace(/\}/g, '\n  }')
    .replace(/,"/g, ',\n    "')
    .replace(/\["/g, '[\n      "')
    .replace(/"\]/g, '"\n    ]');
}

// 生成 Astro 组件（直接写 HTML）
const astroComponent = `---
/**
 * EvervaultHead 组件
 * 
 * 包含从 Evervault 原始 HTML 中提取的所有 head 内容
 * （CSS、JS、meta 标签等）
 */
---

<!-- Charset and Viewport -->
${groups.charset.join('\n')}
${groups.viewport.join('\n')}

<!-- Title and Description -->
${groups.title.join('\n')}
${groups.description.join('\n')}

<!-- Favicon and Theme -->
${groups.favicon.join('\n')}

<!-- Preconnect -->
${groups.preconnect.join('\n')}

<!-- Open Graph -->
${groups.opengraph.join('\n')}

<!-- Twitter Card -->
${groups.twitter.join('\n')}

<!-- Font Preload -->
${groups.fontPreload.join('\n')}

<!-- CSS Preload -->
${groups.cssPreload.join('\n')}

<!-- Structured Data (JSON-LD) -->
<script type="application/ld+json" data-next-head="" is:inline>
${groups.jsonLd.replace(/<script[^>]*>/, '').replace(/<\/script>/, '')}
</script>

<!-- CSS Stylesheets -->
${groups.cssStylesheet.join('\n')}

<!-- Noscript -->
<noscript data-n-css=""></noscript>

<!-- JavaScript Bundles -->
${groups.scripts.map(s => {
  // 为所有 script 标签添加 is:inline 并确保有闭合标签
  let tag = s.replace('<script ', '<script is:inline ').replace(' defer=""', ' defer');
  // 如果没有 </script>，添加它
  if (!tag.includes('</script>')) {
    tag += '</script>';
  }
  return tag;
}).join('\n')}
`;

// 写入文件
const outputPath = path.join(__dirname, '../src/components/EvervaultHead.astro');
fs.writeFileSync(outputPath, astroComponent, 'utf-8');

console.log('✅ EvervaultHead.astro 已生成（原生 HTML 版本）！');
console.log(`📁 位置: ${outputPath}`);
console.log(`📊 标签统计:`);
console.log(`   - Meta 标签: ${groups.charset.length + groups.viewport.length + groups.description.length + groups.favicon.length + groups.opengraph.length + groups.twitter.length}`);
console.log(`   - Link 标签: ${groups.preconnect.length + groups.fontPreload.length + groups.cssPreload.length + groups.cssStylesheet.length}`);
console.log(`   - Script 标签: ${groups.scripts.length + 1}`);
