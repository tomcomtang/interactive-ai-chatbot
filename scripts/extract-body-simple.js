/**
 * 简单地从 getEvervaultContent 获取 body 内容并写入组件
 */

const fs = require('fs');
const path = require('path');

// 直接读取 public/index.html
const htmlPath = path.join(__dirname, '../public/index.html');
const html = fs.readFileSync(htmlPath, 'utf-8');

// 提取 body 内容
const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
if (!bodyMatch) {
  console.error('❌ 未找到 body 标签');
  process.exit(1);
}

let bodyContent = bodyMatch[1];

// 保留 main 标签下只有 header
const mainStart = bodyContent.indexOf('<main');
const mainEnd = bodyContent.indexOf('</main>');

if (mainStart !== -1 && mainEnd !== -1) {
  const beforeMain = bodyContent.substring(0, mainStart);
  const mainSection = bodyContent.substring(mainStart, mainEnd + 7);
  const afterMain = bodyContent.substring(mainEnd + 7);
  
  const headerEnd = mainSection.indexOf('</header>');
  
  if (headerEnd !== -1) {
    const keepPart = mainSection.substring(0, headerEnd + 9);
    const newMain = keepPart + '</main>';
    bodyContent = beforeMain + newMain + afterMain;
  }
}

// 替换品牌名称
bodyContent = bodyContent.replace(/Evervault/g, 'EdgeOne');

// 为所有 script 标签添加 is:inline
bodyContent = bodyContent.replace(/<script /g, '<script is:inline ');

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
${bodyContent}
`;

// 写入文件
const outputPath = path.join(__dirname, '../src/components/EvervaultBody.astro');
fs.writeFileSync(outputPath, componentContent, 'utf-8');

console.log('✅ EvervaultBody.astro 生成成功！');
console.log(`📊 Body 内容长度: ${bodyContent.length} 字符`);
