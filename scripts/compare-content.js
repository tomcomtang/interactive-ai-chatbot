import fs from 'fs';

// 1. 读取 index-static.txt (真实的 bodyContent)
const realBodyContent = fs.readFileSync('index-static.txt', 'utf-8');

// 2. 读取 index-static.html 并提取 <pre> 内的内容
const htmlFile = fs.readFileSync('index-static.html', 'utf-8');
const preMatch = htmlFile.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
const escapedContent = preMatch ? preMatch[1] : '';

// 3. 将转义的内容还原
const unescapedContent = escapedContent
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"');

// 4. 对比
console.log('📊 对比结果:\n');
console.log('真实 bodyContent 长度:', realBodyContent.length);
console.log('index-static.html <pre> 内容长度 (转义后):', escapedContent.length);
console.log('还原后的长度:', unescapedContent.length);
console.log('\n✅ 内容是否一致:', realBodyContent === unescapedContent);

// 5. 展示前 200 字符对比
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📝 真实 bodyContent (index-static.txt) 前 200 字符:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(realBodyContent.substring(0, 200));

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📝 index-static.html <pre> 内容 (转义后) 前 200 字符:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(escapedContent.substring(0, 200));

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📝 还原后的内容前 200 字符:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(unescapedContent.substring(0, 200));

// 6. 关键区别示例
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 关键区别示例:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n真实 bodyContent 中的标签:');
console.log('  <link rel="preload" as="image" href="/images/logo-white.svg"/>');
console.log('\nindex-static.html <pre> 中的转义版本:');
console.log('  &lt;link rel="preload" as="image" href="/images/logo-white.svg"/&gt;');
console.log('\n💡 区别: &lt; 和 &gt; 是转义字符，用于在浏览器中显示而不是执行');
