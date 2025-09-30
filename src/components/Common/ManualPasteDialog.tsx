import React, { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface ManualPasteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (text: string) => void;
  title?: string;
  description?: string;
  placeholder?: string;
}

const ManualPasteDialog: React.FC<ManualPasteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '粘贴分数数据',
  description = '请将复制的分数数据粘贴到下方文本框中（每行一个数字）',
  placeholder = '请粘贴分数数据...',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 处理ESC键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // 自动聚焦到文本框
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // 处理确认粘贴
  const handleConfirm = () => {
    const inputText = textareaRef.current?.value.trim() || '';
    if (inputText) {
      onConfirm(inputText);
      onClose();
    } else {
      toast.error('请输入分数数据');
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
          placeholder={placeholder}
          className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />

        <div className="flex gap-3 justify-center">
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-[#1e3a8a] text-white rounded-md hover:bg-gray-500/90 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
          >
            确认粘贴
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualPasteDialog;
