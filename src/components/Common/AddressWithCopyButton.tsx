'use client';

import { useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

import { abbreviateAddress } from '@/src/lib/format';

interface AddressWithCopyButtonProps {
  address: `0x${string}`;
  word?: string;
  showCopyButton?: boolean;
  showCopyLast4Button?: boolean;
  showAddress?: boolean;
  colorClassName?: string;
  colorClassName2?: string;
}

const AddressWithCopyButton: React.FC<AddressWithCopyButtonProps> = ({
  address,
  word,
  showCopyButton = true,
  showCopyLast4Button = false,
  showAddress = true,
  colorClassName = '',
  colorClassName2 = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedLast4, setCopiedLast4] = useState(false);

  // 当地址变化时重置复制状态
  useEffect(() => {
    setCopied(false);
    setCopiedLast4(false);
  }, [address]);

  const handleCopy = (text: string, result: boolean) => {
    if (result) {
      setCopied(true);
      // 2秒后自动重置状态
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('复制失败');
    }
  };

  const handleCopyLast4 = (text: string, result: boolean) => {
    if (result) {
      setCopiedLast4(true);
      toast.success('已复制后4位');
      // 2秒后自动重置状态
      setTimeout(() => setCopiedLast4(false), 2000);
    } else {
      toast.error('复制失败');
    }
  };

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault(); // 阻止默认行为
    event.stopPropagation(); // 阻止事件冒泡
  };

  return (
    <span className="inline-flex items-center space-x-2">
      {word && <span className="text-xs">{word}</span>}
      {showAddress && !colorClassName2 && (
        <span className={`font-mono text-xs ${colorClassName ?? 'text-greyscale-500'}`}>
          {abbreviateAddress(address)}
        </span>
      )}
      {showAddress && colorClassName2 && (
        <span className="text-[0px]">
          <span className={`font-mono text-xs ${colorClassName ?? 'text-greyscale-500'}`}>{`${address.substring(
            0,
            6,
          )}...`}</span>
          <span className={`font-mono text-xs ${colorClassName2}`}>{`${address.substring(address.length - 4)}`}</span>
        </span>
      )}
      {showCopyButton && (
        // @ts-ignore
        <CopyToClipboard text={address} onCopy={handleCopy}>
          <button
            className="flex items-center justify-center p-1 rounded focus:outline-none active:bg-gray-200 md:hover:bg-gray-200"
            onClick={handleClick}
            aria-label="复制地址"
            style={{
              WebkitTapHighlightColor: 'transparent',
              WebkitAppearance: 'none',
              appearance: 'none',
              background: 'transparent',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
            }}
          >
            {copied ? (
              <Check className={`h-4 w-4 ${colorClassName ?? 'text-greyscale-500'}`} />
            ) : (
              <Copy className={`h-4 w-4 ${colorClassName ?? 'text-greyscale-500'}`} />
            )}
          </button>
        </CopyToClipboard>
      )}
      {showCopyLast4Button && (
        // @ts-ignore
        <CopyToClipboard text={address.substring(address.length - 4)} onCopy={handleCopyLast4}>
          <button
            className="text-xs px-2 py-1 rounded border border-gray-300 focus:outline-none active:bg-gray-200 md:hover:bg-gray-100 transition-colors"
            onClick={handleClick}
            aria-label="复制地址后4位"
            style={{
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {copiedLast4 ? (
              <span className={`${colorClassName ?? 'text-greyscale-500'}`}>已复制</span>
            ) : (
              <span className={`${colorClassName ?? 'text-greyscale-500'}`}>后4位</span>
            )}
          </button>
        </CopyToClipboard>
      )}
    </span>
  );
};

export default AddressWithCopyButton;
