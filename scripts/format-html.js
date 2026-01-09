import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取原始 HTML
const inputFile = join(__dirname, '../index-static.txt');
const outputFile = join(__dirname, '../index-static-formatted.html');

const html = fs.readFileSync(inputFile, 'utf-8');

/**
 * 简单的 HTML 格式化函数
 * 添加换行和缩进，但不修改任何内容
 */
function formatHTML(html) {
  let formatted = '';
  let indent = 0;
  const indentSize = 2; // 每层缩进 2 个空格
  
  // 自闭合标签
  const selfClosingTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);
  
  // 内联元素（不换行）
  const inlineTags = new Set([
    'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data',
    'dfn', 'em', 'i', 'kbd', 'mark', 'q', 's', 'samp', 'small',
    'span', 'strong', 'sub', 'sup', 'time', 'u', 'var'
  ]);
  
  // 提取所有标签和文本节点
  const tokens = [];
  let lastIndex = 0;
  const tagRegex = /<\/?[a-z][a-z0-9]*[^>]*>/gi;
  let match;
  
  while ((match = tagRegex.exec(html)) !== null) {
    // 添加标签前的文本
    if (match.index > lastIndex) {
      const text = html.substring(lastIndex, match.index);
      if (text.trim()) {
        tokens.push({ type: 'text', content: text.trim() });
      }
    }
    
    // 添加标签
    const tag = match[0];
    const tagName = tag.match(/<\/?([a-z][a-z0-9]*)/i)?.[1]?.toLowerCase();
    const isClosing = tag.startsWith('</');
    const isSelfClosing = tag.endsWith('/>') || selfClosingTags.has(tagName);
    
    tokens.push({
      type: 'tag',
      content: tag,
      tagName,
      isClosing,
      isSelfClosing,
      isInline: inlineTags.has(tagName)
    });
    
    lastIndex = match.index + tag.length;
  }
  
  // 添加最后的文本
  if (lastIndex < html.length) {
    const text = html.substring(lastIndex).trim();
    if (text) {
      tokens.push({ type: 'text', content: text });
    }
  }
  
  // 格式化输出
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1];
    
    if (token.type === 'text') {
      formatted += ' '.repeat(indent * indentSize) + token.content;
      if (nextToken && !nextToken.isInline) {
        formatted += '\n';
      }
    } else if (token.type === 'tag') {
      // 闭合标签：先减少缩进再输出
      if (token.isClosing && !token.isInline) {
        indent = Math.max(0, indent - 1);
      }
      
      // 输出标签
      if (!token.isInline || i === 0 || tokens[i - 1].type === 'tag') {
        formatted += ' '.repeat(indent * indentSize);
      }
      formatted += token.content;
      
      // 换行判断
      const shouldBreak = !token.isInline && 
                         (!nextToken || 
                          nextToken.type === 'tag' || 
                          (nextToken.type === 'text' && !token.isInline));
      
      if (shouldBreak) {
        formatted += '\n';
      }
      
      // 开始标签：输出后增加缩进
      if (!token.isClosing && !token.isSelfClosing && !token.isInline) {
        indent++;
      }
    }
  }
  
  return formatted;
}

console.log('🔄 正在格式化 HTML...');
const formatted = formatHTML(html);

fs.writeFileSync(outputFile, formatted, 'utf-8');

console.log('✅ 格式化完成！');
console.log(`📁 输入文件: ${inputFile}`);
console.log(`📁 输出文件: ${outputFile}`);
console.log(`📊 原始长度: ${html.length} 字符`);
console.log(`📊 格式化后长度: ${formatted.length} 字符`);
console.log(`📊 原始行数: ${html.split('\n').length} 行`);
console.log(`📊 格式化后行数: ${formatted.split('\n').length} 行`);
