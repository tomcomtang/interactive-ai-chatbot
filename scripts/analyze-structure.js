const fs = require('fs');

const bodyContent = fs.readFileSync('index-static.txt', 'utf-8');

console.log('🏗️ bodyContent 结构深度解析\n');
console.log('='.repeat(80));

// 1. 顶层结构分析
console.log('\n📦 第 1 层：顶层容器\n');

const topLevel = bodyContent.match(/^<(\w+)[^>]*>/);
console.log(`  根元素: <${topLevel?.[1] || 'unknown'}>`);

// 提取所有第一层子元素
const linkPreloads = (bodyContent.match(/<link[^>]*rel="preload"[^>]*>/g) || []).length;
console.log(`  - <link rel="preload">: ${linkPreloads} 个（预加载资源）`);

// 2. 主要区域分割
console.log('\n📦 第 2 层：主要区域划分\n');

const sections = [
  { name: '预加载区块', regex: /<link rel="preload"/g },
  { name: '__next 容器', regex: /<div id="__next">/g },
  { name: 'page-wrapper', regex: /<div id="page-wrapper"/g },
  { name: 'toaster 组件', regex: /<div id="_rht_toaster"/g },
  { name: 'banner 区块', regex: /<div class="[^"]*banner[^"]*">/g },
  { name: 'navigation 导航', regex: /<div class="[^"]*navigation[^"]*">/g },
  { name: 'header 头部', regex: /<header[^>]*>/g },
  { name: 'main 主内容', regex: /<main[^>]*>/g },
];

sections.forEach(section => {
  const matches = bodyContent.match(section.regex);
  if (matches) {
    console.log(`  ✓ ${section.name}: ${matches.length} 个`);
  }
});

// 3. Header 内容分析
console.log('\n📦 第 3 层：Header（顶部导航栏）内容\n');

const headerMatch = bodyContent.match(/<header[^>]*>([\s\S]*?)<\/header>/);
if (headerMatch) {
  const headerContent = headerMatch[1];
  console.log('  结构：');
  console.log(`    - Logo: ${(headerContent.match(/<img[^>]*logo/gi) || []).length} 个`);
  console.log(`    - 按钮组: ${(headerContent.match(/<button/gi) || []).length} 个`);
  console.log(`    - 链接: ${(headerContent.match(/<a /gi) || []).length} 个`);
  
  // 提取按钮文本
  const buttons = headerContent.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || [];
  buttons.forEach((btn, i) => {
    const text = btn.replace(/<[^>]+>/g, '').trim();
    if (text) console.log(`    - 按钮 ${i + 1}: "${text}"`);
  });
}

// 4. Main 内容分析（FileStream 动画区）
console.log('\n📦 第 4 层：Main（FileStream 动画区）内容\n');

const mainMatch = bodyContent.match(/<main[^>]*>([\s\S]*?)<\/main>/);
if (mainMatch) {
  const mainContent = mainMatch[1];
  
  // 提取 header.hero
  const heroMatch = mainContent.match(/<header class="[^"]*hero[^"]*">/);
  if (heroMatch) {
    console.log('  ✓ Hero Section (GradientHero):');
    
    // gradient 容器
    const gradientMatch = mainContent.match(/<div class="[^"]*gradient[^"]*" data-id="gradient">/);
    if (gradientMatch) {
      console.log('    ├─ Gradient 容器 (data-id="gradient")');
      
      // content 区域
      const contentMatch = mainContent.match(/<div class="[^"]*content[^"]*" data-id="content">([\s\S]*?)<\/div>\s*<\/div>/);
      if (contentMatch) {
        console.log('    │  ├─ Content 区域:');
        
        // 提取文本内容
        const h1 = contentMatch[1].match(/<h1[^>]*>(.*?)<\/h1>/)?.[1];
        const h2 = contentMatch[1].match(/<h2[^>]*>(.*?)<\/h2>/)?.[1];
        const p = contentMatch[1].match(/<p[^>]*>(.*?)<\/p>/)?.[1];
        
        if (h1) console.log(`    │  │  ├─ 标题: "${h1}"`);
        if (h2) console.log(`    │  │  ├─ 副标题: "${h2}"`);
        if (p) console.log(`    │  │  ├─ 描述: "${p.substring(0, 60)}..."`);
        console.log(`    │  │  └─ CTA 按钮: "Talk to an Expert"`);
      }
      
      // background (FileStream 动画)
      const bgMatch = mainContent.match(/<div class="[^"]*background[^"]*"/);
      if (bgMatch) {
        console.log('    │  └─ Background (FileStream 动画):');
        
        // 统计卡片
        const cards = mainContent.match(/<div class="[^"]*card[^"]*" data-variant="(\w+)">/g) || [];
        const variants = {};
        cards.forEach(card => {
          const variant = card.match(/data-variant="(\w+)"/)?.[1];
          if (variant) variants[variant] = (variants[variant] || 0) + 1;
        });
        
        console.log(`    │     ├─ 总卡片数: ${cards.length} 张`);
        Object.entries(variants).forEach(([variant, count]) => {
          console.log(`    │     │  └─ ${variant}: ${count} 张`);
        });
        
        // 统计 SVG
        const svgCount = (mainContent.match(/<svg/g) || []).length;
        console.log(`    │     └─ SVG 元素: ${svgCount} 个`);
      }
    }
  }
}

// 5. 导航菜单分析
console.log('\n📦 第 5 层：导航菜单（Navigation）\n');

const navMatch = bodyContent.match(/<nav[^>]*aria-label="Main"[^>]*>([\s\S]*?)<\/nav>/);
if (navMatch) {
  const navContent = navMatch[1];
  const navItems = navContent.match(/<li>[\s\S]*?<\/li>/g) || [];
  
  console.log(`  导航项总数: ${navItems.length}`);
  
  navItems.forEach((item, i) => {
    const linkText = item.match(/<span>(.*?)<\/span>/)?.[1];
    const isButton = item.includes('<button');
    if (linkText) {
      console.log(`    ${i + 1}. ${linkText} ${isButton ? '(下拉菜单)' : ''}`);
    }
  });
}

// 6. 卡片详细信息
console.log('\n📦 第 6 层：信用卡详细信息\n');

const cardMatches = bodyContent.matchAll(/<div class="[^"]*card[^"]*" data-variant="(\w+)">([\s\S]*?)<span class="[^"]*number[^"]*">(.*?)<\/span>/g);
const cardsInfo = [...cardMatches];

console.log(`  检测到 ${cardsInfo.length} 张卡片（前 5 张）:\n`);

cardsInfo.slice(0, 5).forEach((match, i) => {
  const variant = match[1];
  const number = match[3];
  
  // 提取品牌
  const cardHtml = match[0];
  let brand = 'Unknown';
  if (cardHtml.includes('viewBox="0 0 24 24"')) brand = 'Visa';
  else if (cardHtml.includes('viewBox="0 0 16 10"')) brand = 'Mastercard';
  else if (cardHtml.includes('viewBox="0 0 201 219"')) brand = 'Evervault';
  
  console.log(`    卡片 ${i + 1}:`);
  console.log(`      ├─ 样式: ${variant}`);
  console.log(`      ├─ 品牌: ${brand}`);
  console.log(`      └─ 卡号: ${number}`);
});

// 7. 文件大小统计
console.log('\n📊 统计信息\n');
console.log(`  总字符数: ${bodyContent.length.toLocaleString()}`);
console.log(`  总字节数: ${Buffer.from(bodyContent).length.toLocaleString()} bytes`);
console.log(`  压缩前大小: ${(Buffer.from(bodyContent).length / 1024).toFixed(2)} KB`);

// 8. 关键 CSS 类名分析
console.log('\n🎨 关键 CSS 模块类名\n');

const cssModules = bodyContent.match(/class="([^"]*)"/g) || [];
const moduleNames = new Set();

cssModules.forEach(cls => {
  const match = cls.match(/class="([a-zA-Z_-]+)-module__/);
  if (match) {
    moduleNames.add(match[1]);
  }
});

console.log(`  检测到 ${moduleNames.size} 个 CSS 模块:`);
[...moduleNames].slice(0, 10).forEach(name => {
  console.log(`    - ${name}-module__*`);
});

console.log('\n' + '='.repeat(80));
console.log('✅ 解析完成！\n');
