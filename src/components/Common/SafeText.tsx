/**
 * 安全文本显示组件 - 防止XSS攻击
 */
import React from 'react';
import { escapeHtml, smartSanitizeText, hasLineBreaks } from '@/src/lib/securityUtils';

interface SafeTextProps {
  text: string | undefined;
  className?: string;
  maxLength?: number;
  showWarning?: boolean;
  preserveLineBreaks?: boolean; // 是否保留换行符
}

/**
 * 安全地显示用户输入的文本
 * 自动转义HTML特殊字符，防止XSS攻击
 * 可选择保留换行符
 */
export const SafeText: React.FC<SafeTextProps> = ({
  text,
  className = '',
  maxLength,
  showWarning = false,
  preserveLineBreaks = false,
}) => {
  if (!text) return null;

  // 截断长文本
  let displayText = text;
  if (maxLength && text.length > maxLength) {
    displayText = text.substring(0, maxLength) + '...';
  }

  // 使用智能文本处理
  const safeText = smartSanitizeText(displayText, preserveLineBreaks);

  // 检查是否原文本包含潜在危险内容
  const hasDangerousContent =
    text !== displayText || /<[^>]*>/g.test(text) || /script|javascript|onclick|onerror|onload/gi.test(text);

  return (
    <span className={className}>
      <span dangerouslySetInnerHTML={{ __html: safeText }} />
      {showWarning && hasDangerousContent && <span className="text-yellow-500 text-xs ml-1">⚠️ 内容已被安全过滤</span>}
    </span>
  );
};

export default SafeText;
