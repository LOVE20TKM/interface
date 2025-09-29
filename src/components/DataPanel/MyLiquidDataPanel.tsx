'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React, { useContext, useEffect } from 'react';
import { useAccount } from 'wagmi';

// my hooks
import { formatTokenAmount } from '@/src/lib/format';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { useAccountStakeStatus } from '@/src/hooks/contracts/useLOVE20Stake';
import { useTokenAmountsBySlAmount } from '@/src/hooks/contracts/useLOVE20SLToken';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

interface MyLiquidDataPanelProps {}

const MyLiquidDataPanel: React.FC<MyLiquidDataPanelProps> = ({}) => {
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取用户的质押状态，包含 sl 数量
  const {
    slAmount,
    isPending: isPendingStakeStatus,
    error: errorStakeStatus,
  } = useAccountStakeStatus((token?.address as `0x${string}`) || '', (account as `0x${string}`) || '');

  // 根据 sl 数量获取可以换回的代币数量
  const {
    tokenAmountsBySlAmount,
    isPending: isPendingTokenAmounts,
    error: errorTokenAmounts,
  } = useTokenAmountsBySlAmount((token?.slTokenAddress as `0x${string}`) || '', slAmount || BigInt(0));

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorStakeStatus) {
      handleContractError(errorStakeStatus, 'stake');
    }
    if (errorTokenAmounts) {
      handleContractError(errorTokenAmounts, 'slToken');
    }
  }, [errorStakeStatus, errorTokenAmounts]);

  if (!account) {
    return (
      <div className="flex-col items-center px-6">
        <LeftTitle title="我的流动性质押" />
        <div className="text-sm mt-4 text-greyscale-500 text-center">请先连接钱包</div>
      </div>
    );
  }

  // 只有在真正需要等待数据时才显示加载状态
  // 如果stake状态正在加载，显示加载
  // 如果有sl代币且正在查询token amounts，显示加载
  if (isPendingStakeStatus || (slAmount && slAmount > BigInt(0) && isPendingTokenAmounts)) {
    return <LoadingIcon />;
  }

  return (
    <div className="flex-col items-center px-6">
      <LeftTitle title="我的流动性质押" />
      <div className="border rounded-lg my-4">
        <div className="stats w-full">
          <div className="stat place-items-center pb-0">
            <div className="stat-title">我的流动性质押凭证 sl{token?.symbol} 数量</div>
            <div className="stat-value text-secondary text-2xl">{formatTokenAmount(slAmount || BigInt(0))}</div>
          </div>
        </div>
        <div className="stats rounded-lg w-full grid grid-cols-2 divide-x-0 mt-2">
          <div className="stat place-items-center pt-3 ">
            <div className="stat-title text-sm">可换回 {token?.symbol} 数量</div>
            <div className="stat-value text-xl">
              {formatTokenAmount(tokenAmountsBySlAmount?.tokenAmount || BigInt(0))}
            </div>
          </div>
          <div className="stat place-items-center pt-3 ">
            <div className="stat-title text-sm">可换回 {token?.parentTokenSymbol} 数量</div>
            <div className="stat-value text-xl">
              {formatTokenAmount(tokenAmountsBySlAmount?.parentTokenAmount || BigInt(0))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button variant="outline" className="w-1/2 text-secondary border-secondary" asChild>
          <Link href={`/gov/stakelp/?symbol=${token?.symbol}`}>质押获取治理票 &gt;&gt;</Link>
        </Button>
      </div>
    </div>
  );
};

export default MyLiquidDataPanel;
