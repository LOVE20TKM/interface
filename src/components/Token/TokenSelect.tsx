'use client';

import { ReactNode } from 'react';

import AddToMetamask from '@/src/components/Common/AddToMetamask';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TokenOption } from '@/src/lib/tokenOptions';

export const CUSTOM_TOKEN_VALUE = 'CUSTOM_TOKEN';

interface TokenSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  tokens: TokenOption[];
  selectedToken?: TokenOption;
  customTokenAddress?: string;
  onCustomTokenAddressChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  showNativeAddress?: boolean;
  showCustomToken?: boolean;
  showAddToMetamask?: boolean;
  renderDecoration?: (token: TokenOption) => ReactNode;
  customTokenDetails?: ReactNode;
}

export default function TokenSelect({
  value,
  onValueChange,
  tokens,
  selectedToken,
  customTokenAddress = '',
  onCustomTokenAddressChange,
  disabled = false,
  placeholder = '请选择代币',
  showNativeAddress = true,
  showCustomToken = true,
  showAddToMetamask = false,
  renderDecoration,
  customTokenDetails,
}: TokenSelectProps) {
  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {tokens.map((token) => (
            <SelectItem key={token.address} value={token.address} decoration={renderDecoration?.(token)}>
              <span className="font-mono font-medium">{token.symbol}</span>
            </SelectItem>
          ))}
          {showCustomToken && <SelectItem value={CUSTOM_TOKEN_VALUE}>自定义代币</SelectItem>}
        </SelectContent>
      </Select>

      {value === CUSTOM_TOKEN_VALUE && onCustomTokenAddressChange && (
        <div>
          <div className="mb-2 text-sm font-semibold text-greyscale-800">代币合约地址</div>
          <Input value={customTokenAddress} onChange={(event) => onCustomTokenAddressChange(event.target.value.trim())} />
          {customTokenDetails ? <div className="mt-2">{customTokenDetails}</div> : null}
        </div>
      )}

      {selectedToken && value !== CUSTOM_TOKEN_VALUE && (
        <div className="text-xs text-gray-600">
          <div className="mb-1 font-semibold text-greyscale-500">代币合约地址</div>
          {selectedToken.address === 'NATIVE' ? (
            showNativeAddress ? <span>原生代币，无合约地址</span> : null
          ) : (
            <div className="flex items-center gap-1 min-w-0">
              <AddressWithCopyButton
                address={selectedToken.address}
                showAddress={true}
                showCopyButton={true}
                colorClassName="text-gray-600"
              />
              {showAddToMetamask && (
                <AddToMetamask
                  tokenAddress={selectedToken.address}
                  tokenSymbol={selectedToken.symbol}
                  tokenDecimals={selectedToken.decimals}
                  isUniswapV2Lp={selectedToken.isLp}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
