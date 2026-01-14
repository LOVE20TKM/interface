import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// my funcs
import { formatTokenAmount } from '@/src/lib/format';

// my contexts
import { Token } from '@/src/contexts/TokenContext';

// my hooks
import { useBalanceOf } from '@/src/hooks/contracts/useLOVE20Token';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import AddToMetamask from '@/src/components/Common/AddToMetamask';

const MyTokenPanel: React.FC<{ token: Token | null | undefined }> = ({ token }) => {
  const { address: account } = useAccount();

  // 获取代币余额
  const {
    balance,
    isPending: isPendingBalance,
    error: errorBalance,
  } = useBalanceOf(token?.address as `0x${string}`, account as `0x${string}`);

  // 获取父币余额
  const {
    balance: parentTokenBalance,
    isPending: isPendingParentTokenBalance,
    error: errorParentTokenBalance,
  } = useBalanceOf(token?.parentTokenAddress as `0x${string}`, account as `0x${string}`);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorBalance) {
      handleContractError(errorBalance, 'token');
    }
    if (errorParentTokenBalance) {
      handleContractError(errorParentTokenBalance, 'token');
    }
  }, [errorBalance, errorParentTokenBalance]);

  if (!token) {
    return <LoadingIcon />;
  }
  if (!account) {
    return (
      <>
        <div className="flex-col items-center px-4 py-2">
          <LeftTitle title="我的代币" />
          <div className="text-sm mt-4 text-greyscale-500 text-center">请先连接钱包</div>
        </div>
      </>
    );
  }

  return (
    <div className="flex-col items-center px-4 py-2">
      <div className="flex justify-between items-center">
        <LeftTitle title="我的代币" />
        <Button variant="link" className="text-secondary border-secondary" asChild>
          <Link href={`/token/transfer?symbol=${token.symbol}`}>转账</Link>
        </Button>
      </div>
      <div className="stats bg-gray-100 w-full grid grid-cols-2 divide-x-0">
        <div className="stat place-items-center pb-3">
          <div className="stat-title text-sm flex items-center font-mono">
            持有 {token?.symbol}
            <AddToMetamask
              tokenAddress={token.address as `0x${string}`}
              tokenSymbol={token.symbol}
              tokenDecimals={token.decimals}
            />
          </div>
          <div className="stat-value text-xl">
            {isPendingBalance ? <LoadingIcon /> : formatTokenAmount(balance || BigInt(0))}
          </div>
          <div className="stat-desc mt-0 text-xs text-greyscale-400 font-light">不包含治理质押和行动参与</div>
        </div>
        <div className="stat place-items-center pb-3">
          <div className="stat-title text-sm flex items-center font-mono">
            持有 {token?.parentTokenSymbol}
            <AddToMetamask
              tokenAddress={token.parentTokenAddress as `0x${string}`}
              tokenSymbol={token.parentTokenSymbol}
              tokenDecimals={token.decimals}
            />
          </div>
          <div className="stat-value text-xl">
            {isPendingParentTokenBalance ? <LoadingIcon /> : formatTokenAmount(parentTokenBalance || BigInt(0))}
          </div>
          <div className="stat-desc mt-0 text-xs text-greyscale-400 font-light"></div>
        </div>
      </div>
    </div>
  );
};

export default MyTokenPanel;
