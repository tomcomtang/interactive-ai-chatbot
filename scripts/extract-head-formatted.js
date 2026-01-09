/**
 * 提取 public/index.html 的 head 内容并格式化生成 Astro 组件
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

// 简单格式化：在每个标签后添加换行
headContent = headContent
  .replace(/></g, '>\n<')  // 在标签之间添加换行
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0)
  .join('\n');

// 生成 Astro 组件内容
// 注意：使用 Fragment set:html 来避免 JSON script 标签解析问题
const astroComponent = `---
/**
 * EvervaultHead 组件
 * 
 * 包含从 Evervault 原始 HTML 中提取的所有 head 内容
 * （CSS、JS、meta 标签等）
 * 
 * 使用 Fragment set:html 来正确处理 JSON-LD 和其他特殊标签
 */

const headContent = \`${headContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
---

<Fragment set:html={headContent} />
`;

// 写入到组件文件
const outputPath = path.join(__dirname, '../src/components/EvervaultHead.astro');
fs.writeFileSync(outputPath, astroComponent, 'utf-8');

console.log('✅ EvervaultHead.astro 已生成（Fragment 版本）！');
console.log(`📁 位置: ${outputPath}`);
console.log(`📊 原始内容: ${headContent.length} 字符`);
console.log(`📊 行数: ${headContent.split('\n').length} 行`);
