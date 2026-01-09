/**
 * 显示 public/index.html 的 head 内容
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

console.log('=== HEAD CONTENT ===');
console.log(headContent.substring(0, 2000)); // 只显示前2000个字符
console.log('\n=== TOTAL LENGTH ===');
console.log(headContent.length, 'characters');
