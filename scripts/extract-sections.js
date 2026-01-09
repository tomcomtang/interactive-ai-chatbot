import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取格式化后的 HTML
const inputFile = join(__dirname, '../index-static-formatted.html');
const html = fs.readFileSync(inputFile, 'utf-8');

console.log('🔍 开始提取内容...\n');

/**
 * 提取指定 id 或 class 的内容
 */
function extractContent(html, selector, type = 'id') {
  let regex;
  
  if (type === 'id') {
    // 匹配 id="selector" 的开始标签
    regex = new RegExp(`<div id="${selector}"[^>]*>`, 'i');
  } else {
    // 匹配 class 包含 selector 的开始标签
    regex = new RegExp(`<[^>]+class="[^"]*${selector}[^"]*"[^>]*>`, 'i');
  }
  
  const match = html.match(regex);
  
  if (!match) {
    console.log(`❌ 未找到 ${type}="${selector}"`);
    return null;
  }
  
  const startIndex = match.index;
  const startTag = match[0];
  
  // 提取标签名
  const tagName = startTag.match(/<(\w+)/)[1];
  
  // 从开始位置查找匹配的闭合标签
  let depth = 1;
  let currentIndex = startIndex + startTag.length;
  const tagRegex = new RegExp(`</?${tagName}[^>]*>`, 'gi');
  
  let tagMatch;
  tagRegex.lastIndex = currentIndex;
  
  while ((tagMatch = tagRegex.exec(html)) !== null && depth > 0) {
    if (tagMatch[0].startsWith('</')) {
      depth--;
    } else if (!tagMatch[0].endsWith('/>')) {
      depth++;
    }
    
    if (depth === 0) {
      // 找到匹配的闭合标签
      const endIndex = tagMatch.index + tagMatch[0].length;
      const content = html.substring(startIndex, endIndex);
      return content;
    }
  }
  
  console.log(`❌ 未找到 ${type}="${selector}" 的闭合标签`);
  return null;
}

// 1. 提取 __content
console.log('📦 提取 id="__content" 的内容...');
const contentSection = extractContent(html, '__content', 'id');

if (contentSection) {
  const outputFile1 = join(__dirname, '../extracted-__content.html');
  fs.writeFileSync(outputFile1, contentSection, 'utf-8');
  console.log(`✅ 已保存到: extracted-__content.html`);
  console.log(`   长度: ${contentSection.length} 字符\n`);
} else {
  console.log('⚠️  跳过 __content\n');
}

// 2. 提取 footer (包含 module__rnk_JG__footer 的元素)
console.log('📦 提取 class 包含 "module__.*__footer" 的内容...');

// 先尝试查找所有可能的 footer class
const footerClassMatch = html.match(/<[^>]+class="[^"]*module__[^"]*__footer[^"]*"[^>]*>/i);

if (footerClassMatch) {
  // 提取完整的 class 名称
  const fullClass = footerClassMatch[0].match(/class="([^"]*)"/)[1];
  console.log(`   找到 class: "${fullClass}"`);
  
  // 提取特定的 module class (例如: module__rnk_JG__footer)
  const moduleClass = fullClass.split(' ').find(cls => cls.includes('module__') && cls.includes('__footer'));
  
  if (moduleClass) {
    console.log(`   提取 class="${moduleClass}" 的内容...`);
    const footerSection = extractContent(html, moduleClass.replace(/\$/g, '\\$'), 'class');
    
    if (footerSection) {
      const outputFile2 = join(__dirname, '../extracted-footer.html');
      fs.writeFileSync(outputFile2, footerSection, 'utf-8');
      console.log(`✅ 已保存到: extracted-footer.html`);
      console.log(`   长度: ${footerSection.length} 字符\n`);
    }
  }
} else {
  console.log('⚠️  未找到 footer 元素\n');
}

console.log('🎉 提取完成！');
