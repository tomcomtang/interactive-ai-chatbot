/**
 * 将 bodyContent 格式化为 HTML 文件
 * 运行: node scripts/format-body-html.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 读取 bodyContent
const bodyContent = fs.readFileSync(
  path.join(__dirname, '../src/pages/body-content.txt'),
  'utf-8'
);

// 简单的 HTML 格式化函数
function formatHTML(html) {
  let formatted = html;
  let indent = 0;
  let result = '';
  
  // 将所有标签分离出来
  const tokens = formatted.match(/<\/?[^>]+>|[^<>]+/g) || [];
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].trim();
    if (!token) continue;
    
    // 自闭合标签
    if (token.match(/<[^>]+\/>/)) {
      result += '  '.repeat(indent) + token + '\n';
    }
    // 结束标签
    else if (token.startsWith('</')) {
      indent = Math.max(0, indent - 1);
      result += '  '.repeat(indent) + token + '\n';
    }
    // 开始标签
    else if (token.startsWith('<')) {
      result += '  '.repeat(indent) + token + '\n';
      // 非自闭合标签增加缩进
      if (!token.match(/<(img|br|hr|input|meta|link)/i)) {
        indent++;
      }
    }
    // 文本内容
    else {
      result += '  '.repeat(indent) + token + '\n';
    }
  }
  
  return result;
}

// 创建完整的 HTML 文档
const htmlDoc = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>bodyContent - 格式化预览</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
      font-family: monospace;
    }
    .info {
      background: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .content {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div class="info">
    <h1>🎯 bodyContent 内容预览</h1>
    <p><strong>总长度:</strong> ${bodyContent.length.toLocaleString()} 字符</p>
    <p><strong>处理说明:</strong></p>
    <ul>
      <li>✅ 已提取 body 标签内的内容</li>
      <li>✅ 已执行 keepOnlyHeaderInMain() - 只保留 main 下的 header</li>
      <li>✅ 已执行 replaceText() - Evervault → EdgeOne</li>
    </ul>
  </div>
  
  <div class="content">
    <h2>📄 原始内容（未格式化）</h2>
    <pre style="white-space: pre-wrap; word-break: break-all; font-size: 12px; line-height: 1.6; max-height: 80vh; overflow: auto;">${bodyContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
  </div>
</body>
</html>
`;

// 写入文件
const outputPath = path.join(__dirname, '../index-static.html');
fs.writeFileSync(outputPath, htmlDoc, 'utf-8');

console.log('✅ 已生成格式化的 HTML 文件:', outputPath);
console.log('📊 文件大小:', Math.round(htmlDoc.length / 1024), 'KB');
console.log('\n💡 打开文件即可查看 bodyContent 的完整内容');
