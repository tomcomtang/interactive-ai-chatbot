/**
 * 提取 public/index.html 的 head 内容并生成 Astro 组件
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
const headContent = headMatch ? headMatch[1] : '';

// 生成 Astro 组件内容
const astroComponent = `---
/**
 * EvervaultHead 组件
 * 
 * 包含从 Evervault 原始 HTML 中提取的所有 head 内容
 * （CSS、JS、meta 标签等）
 */
---

${headContent}
`;

// 写入到组件文件
const outputPath = path.join(__dirname, '../src/components/EvervaultHead.astro');
fs.writeFileSync(outputPath, astroComponent, 'utf-8');

console.log('✅ EvervaultHead.astro 已生成！');
console.log(`📁 位置: ${outputPath}`);
console.log(`📊 内容长度: ${headContent.length} 字符`);
