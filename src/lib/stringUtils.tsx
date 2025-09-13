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
          // 如果URL不安全，显示为普通文本
          return (
            <span key={i} className="text-red-500">
              [不安全的链接已被屏蔽]
            </span>
          );
        }

        return (
          <a
            key={i}
            href={url}
            onClick={(e) => {
              e.preventDefault();
              // 再次确认URL安全性
              if (isUrlSafe(url)) {
                NavigationUtils.handleExternalLink(url);
              } else {
                alert('此链接已被识别为不安全链接，无法打开');
              }
            }}
            className="text-blue-500 underline hover:text-blue-700 break-words break-all whitespace-normal"
            target="_blank"
            rel="noopener noreferrer"
            title={`外部链接: ${url}`}
          >
            {url}
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
