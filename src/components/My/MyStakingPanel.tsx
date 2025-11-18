import React, { useContext, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// my funcs
import { formatTokenAmount } from '@/src/lib/format';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useAccountStakeStatus } from '@/src/hooks/contracts/useLOVE20Stake';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

const MyStakingPanel: React.FC = () => {
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  const {
    govVotes,
    stAmount,
    isPending: isPendingAccountStakeStatus,
    error: errorAccountStakeStatus,
  } = useAccountStakeStatus((token?.address as `0x${string}`) || '', (account as `0x${string}`) || '');

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorAccountStakeStatus) {
      handleContractError(errorAccountStakeStatus, 'stake');
    }
  }, [errorAccountStakeStatus]);

  if (!token) {
    return '';
  }

  if (!account) {
    return (
      <>
        <div className="flex-col items-center px-4 py-2">
          <LeftTitle title="我的质押" />
          <div className="text-sm mt-4 text-greyscale-500 text-center">请先连接钱包</div>
        </div>
      </>
    );
  }

  return (
    <div className="flex-col items-center px-4 pt-2 pb-0">
      <LeftTitle title="我的质押" />
      <div className="stats w-full grid grid-cols-2 divide-x-0">
        <div className="stat place-items-center py-1">
          <div className="stat-title text-sm">我的治理票数</div>
          <div className="stat-value text-xl">
            {isPendingAccountStakeStatus ? <LoadingIcon /> : formatTokenAmount(govVotes || BigInt(0))}
          </div>
          <div className="stat-actions w-full my-0">
            <Button variant="link" size="sm" className="w-full text-secondary" asChild>
              <Link href={`/stake/stakelp/?symbol=${token.symbol}`}>去获取</Link>
            </Button>
          </div>
        </div>
        <div className="stat place-items-center py-1">
          <div className="stat-title text-sm">我的质押代币数</div>
          <div className="stat-value text-xl">
            {isPendingAccountStakeStatus ? <LoadingIcon /> : formatTokenAmount(stAmount || BigInt(0))}
          </div>
          <div className="stat-actions w-full my-0">
            <Button variant="link" size="sm" className="w-full text-secondary" asChild>
              <Link href={`/stake/staketoken?symbol=${token.symbol}`}>去质押</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyStakingPanel;
