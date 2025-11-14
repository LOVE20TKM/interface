'use client';
import React, { useContext, useEffect, useMemo } from 'react';

// my hooks
import { useHandleContractError } from '@/src/lib/errorUtils';
import { useAction19PoolValue } from '@/src/hooks/composite/useAction19PoolValue';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

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
  const { token } = useContext(TokenContext) || {};

  // 获取19号行动的u池资产价值
  const {
    totalPoolValue: action19PoolValue,
    isLoading: isLoadingAction19Pool,
    error: errorAction19Pool,
  } = useAction19PoolValue({
    tokenAddress: token?.address as `0x${string}`,
    enabled: !!token?.address,
  });

  // 计算总成本：参与代币 + 19号行动的u池资产
  const totalCost = useMemo(() => {
    return (totalJoinedAmount ?? BigInt(0)) + action19PoolValue;
  }, [totalJoinedAmount, action19PoolValue]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorAction19Pool) {
      handleContractError(errorAction19Pool, 'join');
    }
  }, [errorAction19Pool]);

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
          {isPendingJoinedAmount || isPendingReward || isLoadingAction19Pool ? (
            <LoadingIcon />
          ) : (
            calculateActionAPY(expectedReward, totalCost)
          )}
        </div>
      </div>
    </div>
  );
};

export default ActDataPanel;
