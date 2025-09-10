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
  colorClassName2?: string;
}

const AddressWithCopyButton: React.FC<AddressWithCopyButtonProps> = ({
  address,
  word,
  showCopyButton = true,
  showAddress = true,
  colorClassName = '',
  colorClassName2 = '',
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
    </span>
  );
};

export default AddressWithCopyButton;
