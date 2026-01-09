/**
 * Evervault 内容处理工具
 * 
 * 从 index-static-formatted.html 加载并处理内容
 * 提供可配置的内容提取和转换功能
 */

import {
  loadEvervaultHTML,
  extractHeadContent,
  extractBodyContent,
  keepOnlyHeaderInMain,
  replaceText,
} from './evervault-loader';

export interface EvervaultContentOptions {
  brandName?: string;           // 品牌名称替换，默认为 'EdgeOne'
  keepFullContent?: boolean;    // 是否保留完整内容，默认为 false（只保留 header）
}

export interface EvervaultContent {
  headContent: string;
  bodyContent: string;
}

/**
 * 获取处理后的 Evervault 内容
 * 
 * @param options 配置选项
 * @returns 包含 headContent 和 bodyContent 的对象
 */
export function getEvervaultContent(options: EvervaultContentOptions = {}): EvervaultContent {
  const { 
    brandName = 'EdgeOne', 
    keepFullContent = false 
  } = options;

  // 加载 Evervault HTML
  const evervaultHtml = loadEvervaultHTML();
  const headContent = extractHeadContent(evervaultHtml);
  let bodyContent = extractBodyContent(evervaultHtml);

  // 根据配置处理内容
  if (!keepFullContent) {
    bodyContent = keepOnlyHeaderInMain(bodyContent);
  }

  // 品牌名称替换
  bodyContent = replaceText(bodyContent, /Evervault/g, brandName);

  return {
    headContent,
    bodyContent,
  };
}
