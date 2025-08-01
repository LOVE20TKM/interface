'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React, { useContext, useEffect } from 'react';
import { Info } from 'lucide-react';

// my hooks
import { useGovData } from '@/src/hooks/contracts/useLOVE20DataViewer';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
// import Round from '@/src/components/Common/Round';

// my utils
import { calculateAPY } from '@/src/lib/domainUtils';
import { formatTokenAmount } from '@/src/lib/format';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { calculateExpectedGovReward } from '@/src/lib/domainUtils';

const GovernanceDataPanel: React.FC<{ currentRound: bigint }> = ({ currentRound }) => {
  const { token } = useContext(TokenContext) || {};

  // 使用 useGovData 获取治理数据
  const { govData, isPending, error } = useGovData(token?.address as `0x${string}`);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (error) {
      handleContractError(error, 'govData');
    }
  }, [error]);

  if (!token) {
    return <LoadingIcon />;
  }

  // 计算预计新增铸币
  const displayRound = currentRound - BigInt(token.initialStakeRound) + 1n;

  // 根据轮次计算预计新增铸币
  let expectedReward = calculateExpectedGovReward(govData?.rewardAvailable, displayRound);

  return (
    <div className="mb-2">
      <div className="border rounded-lg p-0">
        <div className="stats w-full grid grid-cols-2 divide-x-0">
          <div className="stat place-items-center pb-2 pl-1">
            <div className="stat-title text-sm pb-1">总治理票数</div>
            <div className="stat-value text-secondary text-xl">
              {isPending ? <LoadingIcon /> : formatTokenAmount(govData?.govVotes || BigInt(0))}
            </div>
          </div>
          <div className="stat place-items-center pb-2 pl-1">
            <div className="stat-title text-sm pb-1">预计新增铸币</div>
            <div className="stat-value text-secondary text-xl">
              {isPending ? <LoadingIcon /> : formatTokenAmount(expectedReward)}
            </div>
          </div>
        </div>
        <div className="text-center text-xs mx-8 text-greyscale-500 border-b border-greyscale-200 pb-2">
          预估年化收益率（APY）：{calculateAPY(govData?.rewardAvailable, govData?.tokenAmountForSl, govData?.stAmount)}
        </div>

        <div className="stats w-full grid grid-cols-2 divide-x-0 mt-2">
          <div className="stat place-items-center pb-0 pt-0 pl-1">
            <div className="stat-title text-sm">流动性质押凭证SL代币</div>
            <div className="stat-value text-lg text-gray-600">
              {isPending ? (
                <LoadingIcon />
              ) : (
                <Link
                  href={`/gov/liquid?symbol=${token?.symbol}`}
                  className="flex items-center hover:text-secondary-focus"
                >
                  <span className="cursor-pointer">{formatTokenAmount(govData?.slAmount || BigInt(0))}</span>
                  <Info size={16} className="ml-1 text-secondary cursor-pointer" />
                </Link>
              )}
            </div>
            <div className="stat-desc text-xs">
              <Button variant="link" className="text-secondary font-normal border-secondary pt-0" asChild>
                <Link href={`/gov/stakelp/?symbol=${token.symbol}`}>质押 获取治理票&nbsp;&gt;&gt;</Link>
              </Button>
            </div>
          </div>
          <div className="stat place-items-center pb-0 pt-0 pl-1">
            <div className="stat-title text-sm">代币质押凭证ST代币</div>
            <div className="stat-value text-lg text-gray-600">
              {isPending ? <LoadingIcon /> : formatTokenAmount(govData?.stAmount || BigInt(0))}
            </div>
            <div className="stat-desc text-xs">
              <Button variant="link" className="text-secondary font-normal border-secondary pt-0" asChild>
                <Link href={`/gov/staketoken?symbol=${token.symbol}`}>质押 增加治理收益&nbsp;&gt;&gt;</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernanceDataPanel;
