/**
 * 提取导航栏（Header-module__arFiJq__header）并生成独立的 Astro 组件
 */

const fs = require('fs');
const path = require('path');
const prettier = require('prettier');

// 读取 public/index.html
const htmlPath = path.join(__dirname, '../public/index.html');
const html = fs.readFileSync(htmlPath, 'utf-8');

// 提取 body 内容
const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
if (!bodyMatch) {
  console.error('❌ 未找到 body 标签');
  process.exit(1);
}

let bodyContent = bodyMatch[1];

// 提取 Header-module__arFiJq__header 部分
const headerMatch = bodyContent.match(/<header[^>]*class="[^"]*Header-module__arFiJq__header[^"]*"[^>]*>[\s\S]*?<\/header>/i);

if (!headerMatch) {
  console.error('❌ 未找到 Header-module__arFiJq__header 元素');
  process.exit(1);
}

let headerContent = headerMatch[0];

// 替换品牌名称
headerContent = headerContent.replace(/Evervault/g, 'EdgeOne');

// 为所有 script 标签添加 is:inline（如果有的话）
headerContent = headerContent.replace(/<script /g, '<script is:inline ');

// 使用 prettier 格式化 HTML
async function formatAndSave() {
  try {
    // 格式化 HTML
    const formattedHeader = await prettier.format(headerContent, {
      parser: 'html',
      printWidth: 100,
      tabWidth: 2,
      useTabs: false,
      htmlWhitespaceSensitivity: 'ignore',
    });

    // 生成组件内容
    const componentContent = `---
/**
 * EvervaultHeader 组件
 * 
 * EdgeOne 页面的顶部导航栏
 */

interface Props {
  brandName?: string;  // 预留：未来可能支持品牌名称替换
}

const { brandName = 'EdgeOne' } = Astro.props;
---

<!-- EdgeOne Page Header (Navigation Bar) -->
${formattedHeader}
`;

    // 写入文件
    const outputPath = path.join(__dirname, '../src/components/EvervaultHeader.astro');
    fs.writeFileSync(outputPath, componentContent, 'utf-8');

    console.log('✅ EvervaultHeader.astro 生成成功！');
    
    // 统计信息
    const lines = formattedHeader.split('\n').length;
    console.log(`📊 格式化后行数: ${lines} 行`);
    console.log(`📊 内容长度: ${formattedHeader.length} 字符`);

    // 现在更新 EvervaultBody.astro，移除 header 部分
    console.log('\n开始更新 EvervaultBody.astro...');
    const bodyPath = path.join(__dirname, '../src/components/EvervaultBody.astro');
    let bodyFileContent = fs.readFileSync(bodyPath, 'utf-8');
    
    // 从 EvervaultBody 中移除 header 部分
    bodyFileContent = bodyFileContent.replace(
      /<header[^>]*class="[^"]*Header-module__arFiJq__header[^"]*"[^>]*>[\s\S]*?<\/header>/i,
      ''
    );

    // 写回文件
    fs.writeFileSync(bodyPath, bodyFileContent, 'utf-8');
    console.log('✅ EvervaultBody.astro 已更新（移除 header 部分）');

  } catch (error) {
    console.error('❌ 处理失败:', error.message);
    process.exit(1);
  }
}

formatAndSave();
