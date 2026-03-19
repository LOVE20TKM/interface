import React, { useContext } from 'react';
import { useAccount } from 'wagmi';
// my funcs
import { formatTokenAmount } from '@/src/lib/format';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useBalanceOf } from '@/src/hooks/contracts/useLOVE20STToken';
// my components
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import AddToMetamask from '@/src/components/Common/AddToMetamask';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

export default function StTokenTab() {
  const { token } = useContext(TokenContext) || {};
  const { address } = useAccount();
  // 获取已铸币量
  const {
    balance,
    isPending: isBalancePending,
    error: balanceError,
  } = useBalanceOf(
    (token?.stTokenAddress as `0x${string}`) || '',
    address || '0x0000000000000000000000000000000000000000',
  );

  if (!token?.stTokenAddress) {
    return <LoadingIcon />;
  }

  return (
    <div className="px-4 pt-0 pb-6">
      <div className="bg-gray-100 rounded-lg p-4 text-sm mt-4">
        <div className="flex items-center">
          <div className="mr-2">
            <div className="flex items-center">
              <span className="font-bold text-2xl mr-2 font-mono">st{token.symbol}</span>
              <AddressWithCopyButton address={token.stTokenAddress as `0x${string}`} />
              <AddToMetamask
                tokenAddress={token.stTokenAddress as `0x${string}`}
                tokenSymbol={token.symbol || ''}
                tokenDecimals={token.decimals || 0}
              />
            </div>
          </div>
        </div>
        <div className="mt-1 flex items-center">
          <span className="text-sm text-greyscale-500 mr-1">我持有:</span>
          <span className="text-sm text-secondary">
            {isBalancePending ? <LoadingIcon /> : formatTokenAmount(balance || BigInt(0))}
          </span>
        </div>
      </div>
    </div>
  );
}
