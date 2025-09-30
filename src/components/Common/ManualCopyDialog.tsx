import React, { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface ManualCopyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  title?: string;
  description?: string;
  autoCloseDelay?: number; // 自动关闭延迟（毫秒），0表示不自动关闭
}

const ManualCopyDialog: React.FC<ManualCopyDialogProps> = ({
  isOpen,
  onClose,
  text,
  title = '请手动复制',
  description = '自动复制功能不可用，请手动选择并复制以下内容：',
  autoCloseDelay = 30000, // 默认30秒后自动关闭
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 处理ESC键关闭和自动关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);

      // 自动聚焦并选择文本
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
          textareaRef.current.setSelectionRange(0, textareaRef.current.value.length);
        }
      }, 100);

      // 设置自动关闭
      let autoCloseTimer: NodeJS.Timeout | null = null;
      if (autoCloseDelay > 0) {
        autoCloseTimer = setTimeout(() => {
          onClose();
        }, autoCloseDelay);
      }

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        if (autoCloseTimer) {
          clearTimeout(autoCloseTimer);
        }
      };
    }
  }, [isOpen, onClose, autoCloseDelay]);

  // 全选文本
  const handleSelectAll = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      textareaRef.current.setSelectionRange(0, textareaRef.current.value.length);
      toast.success('已全选文本，请按 Ctrl+C 复制');
    }
  };

  // 处理背景点击关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-5"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md text-center shadow-xl">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>

        <p className="text-sm text-gray-600 mb-4 leading-relaxed">{description}</p>

        <textarea
          ref={textareaRef}
          value={text}
          readOnly
          className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none mb-4 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />

        <div className="flex gap-3 justify-center">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-[#1e3a8a] text-white rounded-md hover:bg-gray-500/90 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
          >
            全选文本
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
          >
            关闭
          </button>
        </div>

        {autoCloseDelay > 0 && (
          <p className="text-xs text-gray-500 mt-3">{Math.round(autoCloseDelay / 1000)} 秒后自动关闭</p>
        )}
      </div>
    </div>
  );
};

export default ManualCopyDialog;
