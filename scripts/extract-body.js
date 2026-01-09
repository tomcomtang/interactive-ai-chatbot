/**
 * 提取 bodyContent 的实际内容
 * 运行: node scripts/extract-body.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. 读取原始 HTML
const htmlPath = path.join(__dirname, '../public/index.html');
const html = fs.readFileSync(htmlPath, 'utf-8');

// 2. 提取 body 内容
const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
let bodyContent = bodyMatch ? bodyMatch[1] : '';

// 3. 处理：keepOnlyHeaderInMain
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

// 4. 替换品牌
bodyContent = bodyContent.replace(/Evervault/g, 'EdgeOne');

// 5. 输出到文件
const outputPath = path.join(__dirname, '../src/pages/body-content.txt');
fs.writeFileSync(outputPath, bodyContent, 'utf-8');

console.log('✅ bodyContent 已提取到:', outputPath);
console.log('📊 内容长度:', bodyContent.length, '字符');
console.log('\n前 500 字符预览:');
console.log(bodyContent.substring(0, 500));
