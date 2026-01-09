/**
 * 提取 body 内容并生成原生 Astro 组件
 */

const fs = require('fs');
const path = require('path');

// 从 evervault-content.ts 复制的逻辑
function loadEvervaultHTML() {
  const htmlPath = path.join(__dirname, '../public/index.html');
  return fs.readFileSync(htmlPath, 'utf-8');
}

function extractBodyContent(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : '';
}

function keepOnlyHeaderInMain(html) {
  const mainStart = html.indexOf('<main');
  const mainEnd = html.indexOf('</main>');
  
  if (mainStart === -1 || mainEnd === -1) return html;
  
  const beforeMain = html.substring(0, mainStart);
  const mainSection = html.substring(mainStart, mainEnd + 7);
  const afterMain = html.substring(mainEnd + 7);
  
  // 在 main section 中找到 </header>
  const headerEnd = mainSection.indexOf('</header>');
  
  if (headerEnd !== -1) {
    // 保留从 <main 到 </header> 的内容，删除 </header> 到 </main> 之间的所有内容
    const keepPart = mainSection.substring(0, headerEnd + 9); // +9 是 '</header>' 的长度
    const newMain = keepPart + '</main>';
    
    return beforeMain + newMain + afterMain;
  }
  
  return html;
}

function replaceText(content, pattern, replacement) {
  return content.replace(pattern, replacement);
}

// 获取内容
const evervaultHtml = loadEvervaultHTML();
let bodyContent = extractBodyContent(evervaultHtml);
bodyContent = keepOnlyHeaderInMain(bodyContent);
bodyContent = replaceText(bodyContent, /Evervault/g, 'EdgeOne');

// 格式化 HTML（添加缩进）
function formatHTML(html) {
  // 简单的格式化：每个标签一行，保持基本缩进
  let formatted = html
    .replace(/>\s+</g, '>\n<')  // 标签之间换行
    .trim();
  
  // 添加基本缩进
  const lines = formatted.split('\n');
  let indent = 0;
  const indentSize = 2;
  
  return lines.map(line => {
    const trimmed = line.trim();
    
    // 如果是闭合标签，先减少缩进
    if (trimmed.startsWith('</')) {
      indent = Math.max(0, indent - indentSize);
    }
    
    const indented = ' '.repeat(indent) + trimmed;
    
    // 如果是开始标签（不是自闭合，不是闭合标签），增加缩进
    if (trimmed.startsWith('<') && 
        !trimmed.startsWith('</') && 
        !trimmed.endsWith('/>') &&
        !trimmed.match(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/)) {
      indent += indentSize;
    }
    
    return indented;
  }).join('\n');
}

// 生成组件内容
const componentContent = `---
/**
 * EvervaultBody 组件
 * 
 * 包含 EdgeOne 页面的 body 内容（只保留 header 部分）
 */

interface Props {
  brandName?: string;  // 预留：未来可能支持品牌名称替换
}

const { brandName = 'EdgeOne' } = Astro.props;
---

<!-- EdgeOne Page Body Content (Header Only) -->
${formatHTML(bodyContent)}
`;

// 写入文件
const outputPath = path.join(__dirname, '../src/components/EvervaultBody.astro');
fs.writeFileSync(outputPath, componentContent, 'utf-8');

console.log('✅ EvervaultBody.astro 生成成功！');
console.log(`📊 Body 内容长度: ${bodyContent.length} 字符`);
