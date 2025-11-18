'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React, { useContext, useEffect } from 'react';

// my hooks
import { formatTokenAmount } from '@/src/lib/format';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { useGovData } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useTokenAmounts } from '@/src/hooks/contracts/useLOVE20SLToken';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

interface StakedLiquidDataPanelProps {}

const StakedLiquidDataPanel: React.FC<StakedLiquidDataPanelProps> = ({}) => {
  const { token } = useContext(TokenContext) || {};

  // 获取数据
  const {
    tokenAmount,
    parentTokenAmount,
    feeTokenAmount,
    feeParentTokenAmount,
    isPending: isPendingTokenAmount,
    error: errorTokenAmount,
  } = useTokenAmounts(token?.slTokenAddress as `0x${string}`, true);
  const { govData, isPending: isPendingGovData, error: errorGovData } = useGovData(token?.address as `0x${string}`);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorTokenAmount) {
      handleContractError(errorTokenAmount, 'slToken');
    }
    if (errorGovData) {
      handleContractError(errorGovData, 'govData');
    }
  }, [errorTokenAmount, errorGovData]);

  if (isPendingTokenAmount || isPendingGovData) {
    return <LoadingIcon />;
  }

  return (
    <div className="flex-col items-center px-6">
      <LeftTitle title="流动性质押数据" />
      <div className="border rounded-lg my-4">
        <div className="stats w-full">
          <div className="stat place-items-center pb-0">
            <div className="stat-title">流动性质押凭证 sl{token?.symbol} 总数</div>
            <div className="stat-value text-secondary text-2xl">
              {isPendingGovData ? <LoadingIcon /> : formatTokenAmount(govData?.slAmount || BigInt(0))}
            </div>
          </div>
        </div>
        <div className="stats rounded-lg w-full grid grid-cols-2 divide-x-0 mt-2">
          <div className="stat place-items-center pt-3 ">
            <div className="stat-title text-sm">对应 {token?.symbol} 质押数</div>
            <div className="stat-value text-xl">{formatTokenAmount(tokenAmount || BigInt(0))}</div>
          </div>
          <div className="stat place-items-center pt-3 ">
            <div className="stat-title text-sm">对应 {token?.parentTokenSymbol} 质押数</div>
            <div className="stat-value text-xl">{formatTokenAmount(parentTokenAmount || BigInt(0))}</div>
          </div>
        </div>
      </div>

      <LeftTitle title="待分配手续费" />
      <div className="stats border rounded-lg w-full grid grid-cols-2 divide-x-0 mt-2 mb-6">
        <div className="stat place-items-center pt-3">
          <div className="stat-title text-sm">待分配 {token?.symbol} 总数</div>
          <div className="stat-value text-xl">{formatTokenAmount(feeTokenAmount || BigInt(0))}</div>
        </div>
        <div className="stat place-items-center pt-3">
          <div className="stat-title text-sm">待分配 {token?.parentTokenSymbol} 总数</div>
          <div className="stat-value text-xl">{formatTokenAmount(feeParentTokenAmount || BigInt(0))}</div>
        </div>
      </div>
      <div className="flex justify-center">
        <Button variant="outline" className="w-1/2 text-secondary border-secondary" asChild>
          <Link href={`/stake/stakelp/?symbol=${token?.symbol}`}>质押获取治理票 &gt;&gt;</Link>
        </Button>
      </div>
    </div>
  );
};

export default StakedLiquidDataPanel;
