'use client';

import { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

import { abbreviateAddress } from '@/src/lib/format';

interface AddressWithCopyButtonProps {
  address: `0x${string}`;
  word?: string;
  showCopyButton?: boolean;
  showAddress?: boolean;
  colorClassName?: string;
}

const AddressWithCopyButton: React.FC<AddressWithCopyButtonProps> = ({
  address,
  word,
  showCopyButton = true,
  showAddress = true,
  colorClassName = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string, result: boolean) => {
    if (result) {
      setCopied(true);
    } else {
      toast.error('复制失败');
    }
  };

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault(); // 阻止默认行为
    event.stopPropagation(); // 阻止事件冒泡
  };

  return (
    <span className="flex items-center space-x-2">
      {word && <span className="text-xs">{word}</span>}
      {showAddress && (
        <span className={`text-xs ${colorClassName ?? 'text-greyscale-500'}`}>{abbreviateAddress(address)}</span>
      )}
      {showCopyButton && (
        <CopyToClipboard text={address} onCopy={handleCopy}>
          <button
            className="flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none"
            onClick={handleClick}
            aria-label="复制地址"
          >
            {copied ? (
              <Check className={`h-4 w-4 ${colorClassName ?? 'text-greyscale-500'}`} />
            ) : (
              <Copy className={`h-4 w-4 ${colorClassName ?? 'text-greyscale-500'}`} />
            )}
          </button>
        </CopyToClipboard>
      )}
    </span>
  );
};

export default AddressWithCopyButton;
