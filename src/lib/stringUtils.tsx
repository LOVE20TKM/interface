import React from 'react';
import { NavigationUtils } from './navigationUtils';
import { isUrlSafe, escapeHtml, smartSanitizeText } from './securityUtils';

/**
 * 将文本中的URL转换为可点击的链接（安全版本）
 * @param text 可能包含URL的文本
 * @param preserveLineBreaks 是否保留换行符
 * @returns React元素，其中安全的URL被转换为链接
 */
export const renderTextWithLinks = (text: string, preserveLineBreaks: boolean = false): React.ReactNode => {
  if (!text) return text;

  // URL的正则表达式匹配模式
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  if (!urlRegex.test(text)) {
    // 如果没有URL，使用智能文本处理
    const safeText = smartSanitizeText(text, preserveLineBreaks);
    return <span dangerouslySetInnerHTML={{ __html: safeText }} />;
  }

  // 将文本拆分，URL部分转为链接
  const parts = text.split(urlRegex);
  const matches = text.match(urlRegex) || [];

  return (
    <>
      {parts.map((part, i) => {
        // 偶数索引表示普通文本
        if (i % 2 === 0) {
          // 使用智能文本处理
          const safeText = smartSanitizeText(part, preserveLineBreaks);
          return <span key={i} dangerouslySetInnerHTML={{ __html: safeText }} />;
        }
        // 奇数索引是URL，检查安全性后再转换为链接
        const url = matches[(i - 1) / 2];

        // 验证URL安全性
        if (!isUrlSafe(url)) {
          // 如果URL包含危险内容，显示警告信息
          return (
            <span key={i} className="text-red-500 font-semibold">
              [危险链接已被拦截]
            </span>
          );
        }

        return (
          <a
            key={i}
            href={url}
            onClick={(e) => {
              // 必须先阻止默认行为！
              e.preventDefault();
              e.stopPropagation();

              // 安全检查
              const isSafe = isUrlSafe(url);
              if (!isSafe) {
                alert(`链接安全检查失败: ${url.substring(0, 50)}...`);
                return false;
              }

              // 调用我们的处理逻辑
              NavigationUtils.handleExternalLink(url);

              // 返回 false 确保不会触发默认行为
              return false;
            }}
            className="text-blue-500 underline hover:text-blue-700 break-words break-all whitespace-normal"
            title={`外部链接: ${url}`}
            // 添加这些属性防止默认行为
            rel="noopener noreferrer"
            target="_self"
          >
            {url.length > 32 ? `${url.substring(0, 29)}...` : url}
          </a>
        );
      })}
    </>
  );
};

/**
 * 将文本中的URL转换为可点击的链接的组件包装器
 */
export const LinkIfUrl: React.FC<{ text: string; preserveLineBreaks?: boolean }> = ({
  text,
  preserveLineBreaks = false,
}) => {
  return <>{renderTextWithLinks(text, preserveLineBreaks)}</>;
};
