/**
 * 分析 bodyContent 的内容
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const content = fs.readFileSync(
  path.join(__dirname, '../src/pages/body-content.txt'),
  'utf-8'
);

console.log('=== bodyContent 的完整内容分析 ===\n');
console.log('📏 总长度:', content.length, '字符\n');

console.log('🔍 标签统计:');
console.log('- <link> 标签:', (content.match(/<link/g) || []).length);
console.log('- <div> 标签:', (content.match(/<div/g) || []).length);
console.log('- <main> 标签:', (content.match(/<main/g) || []).length);
console.log('- <header> 标签:', (content.match(/<header/g) || []).length);
console.log('- "EdgeOne" 出现次数:', (content.match(/EdgeOne/g) || []).length);
console.log('- "Evervault" 残留次数:', (content.match(/Evervault/g) || []).length);

console.log('\n📍 关键标签位置:');
const mainStart = content.indexOf('<main');
const mainEnd = content.indexOf('</main>');
const headerStart = content.indexOf('<header');
const headerEnd = content.indexOf('</header>');

console.log('- <main> 开始:', mainStart);
console.log('- <header> 开始:', headerStart);
console.log('- </header> 结束:', headerEnd);
console.log('- </main> 结束:', mainEnd);

console.log('\n✂️ keepOnlyHeaderInMain 效果:');
console.log('- main 标签内容长度:', mainEnd - mainStart, '字符');
console.log('- 原始 main 应该很长，现在只保留了 header 部分');

console.log('\n📝 前 1500 字符预览:');
console.log('─'.repeat(80));
console.log(content.substring(0, 1500));
console.log('─'.repeat(80));

console.log('\n📝 <main> 标签内容（处理后）:');
console.log('─'.repeat(80));
const mainContent = content.substring(mainStart, mainEnd + 7);
console.log(mainContent.substring(0, 2000)); // 只显示前 2000 字符
console.log('─'.repeat(80));
