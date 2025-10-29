'use client';
import React from 'react';

// my components
import { formatTokenAmount } from '@/src/lib/format';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

// my utils
import { calculateActionAPY } from '@/src/lib/domainUtils';

interface ActDataPanelProps {
  totalJoinedAmount: bigint;
  expectedReward: bigint | undefined;
  isPendingJoinedAmount: boolean;
  isPendingReward: boolean;
}

const ActDataPanel: React.FC<ActDataPanelProps> = ({
  totalJoinedAmount,
  expectedReward,
  isPendingJoinedAmount,
  isPendingReward,
}) => {
  return (
    <div className="px-4">
      <div className="w-full border rounded-lg p-0">
        <div className="stats w-full grid grid-cols-2 divide-x-0">
          <div className="stat place-items-center pb-2">
            <div className="stat-title text-sm pb-1">参与行动代币总数</div>
            <div className="stat-value text-xl text-secondary">
              {isPendingJoinedAmount ? <LoadingIcon /> : formatTokenAmount(totalJoinedAmount)}
            </div>
          </div>
          <div className="stat place-items-center pb-2">
            <div className="stat-title text-sm pb-1">预计新增铸币</div>
            <div className="stat-value text-xl text-secondary">
              {isPendingReward ? <LoadingIcon /> : formatTokenAmount(expectedReward ?? BigInt(0))}
            </div>
          </div>
        </div>
        <div className="text-center text-xs mb-2 text-greyscale-500">
          预估年化收益率（APY）：
          {isPendingJoinedAmount || isPendingReward ? (
            <LoadingIcon />
          ) : (
            calculateActionAPY(expectedReward, totalJoinedAmount)
          )}
        </div>
      </div>
    </div>
  );
};

export default ActDataPanel;
