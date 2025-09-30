import { toast } from 'react-hot-toast';

export interface CopyResult {
  success: boolean;
  method: 'clipboard' | 'execCommand' | 'manual';
  error?: string;
}

/**
 * 尝试复制文本到剪贴板，支持多种降级方案
 * @param text 要复制的文本
 * @returns 复制结果
 */
export const copyToClipboard = async (text: string): Promise<CopyResult> => {
  // 方法1：尝试使用现代 Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, method: 'clipboard' };
    } catch (clipboardError) {
      console.warn('Clipboard API 失败，尝试降级方案:', clipboardError);
    }
  }

  // 方法2：降级到 execCommand（兼容性更好）
  try {
    // 创建临时文本区域
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('readonly', '');

    document.body.appendChild(textArea);

    // 选择文本
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);

    // 尝试复制
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (successful) {
      return { success: true, method: 'execCommand' };
    }
  } catch (execCommandError) {
    console.warn('execCommand 复制失败:', execCommandError);
  }

  // 方法3：都失败了，需要手动复制
  return {
    success: false,
    method: 'manual',
    error: '浏览器不支持自动复制，需要手动复制',
  };
};

/**
 * 复制文本并显示相应的提示消息
 * @param text 要复制的文本
 * @param successMessage 成功消息
 * @param onManualCopy 需要手动复制时的回调函数
 */
export const copyWithToast = async (
  text: string,
  successMessage: string,
  onManualCopy?: (text: string) => void,
): Promise<void> => {
  const result = await copyToClipboard(text);

  if (result.success) {
    toast.success(successMessage);
  } else {
    // 如果提供了手动复制回调，调用它
    if (onManualCopy) {
      onManualCopy(text);
    } else {
      toast.error(result.error || '复制失败，请手动复制');
    }
  }
};
