'use client';
import React, { useContext, useEffect, useMemo } from 'react';

// my hooks
import { useHandleContractError } from '@/src/lib/errorUtils';
import { useBalanceOf } from '@/src/hooks/contracts/useLOVE20Token';
import { useEstimatedActionRewardOfCurrentRound } from '@/src/hooks/contracts/useLOVE20MintViewer';
import { useAction19PoolValue } from '@/src/hooks/composite/useAction19PoolValue';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import { formatTokenAmount } from '@/src/lib/format';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

// my utils
import { calculateActionAPY } from '@/src/lib/domainUtils';

const JOIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN as `0x${string}`;

interface ActDataPanelProps {
  currentRound: bigint;
}

const ActDataPanel: React.FC<ActDataPanelProps> = ({ currentRound }) => {
  const { token } = useContext(TokenContext) || {};

  // 获取数据
  const {
    balance: joinedAmount,
    isPending: isPendingJoinedAmount,
    error: errorJoinedAmount,
  } = useBalanceOf((token?.address as `0x${string}`) || '', JOIN_CONTRACT_ADDRESS);

  const {
    reward: expectedReward,
    isPending: isPendingEstimatedActionReward,
    error: errorEstimatedActionReward,
  } = useEstimatedActionRewardOfCurrentRound((token?.address as `0x${string}`) || '');

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
    return (joinedAmount ?? BigInt(0)) + action19PoolValue;
  }, [joinedAmount, action19PoolValue]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorJoinedAmount) {
      handleContractError(errorJoinedAmount, 'join');
    }
    if (errorEstimatedActionReward) {
      handleContractError(errorEstimatedActionReward, 'dataViewer');
    }
    if (errorAction19Pool) {
      handleContractError(errorAction19Pool, 'join');
    }
  }, [errorJoinedAmount, errorEstimatedActionReward, errorAction19Pool]);

  return (
    <div className="px-4">
      <div className="w-full border rounded-lg p-0">
        <div className="stats w-full grid grid-cols-2 divide-x-0">
          <div className="stat place-items-center pb-2">
            <div className="stat-title text-sm pb-1">参与行动代币总数</div>
            <div className="stat-value text-xl text-secondary">
              {isPendingJoinedAmount ? <LoadingIcon /> : formatTokenAmount(joinedAmount ?? BigInt(0))}
            </div>
          </div>
          <div className="stat place-items-center pb-2">
            <div className="stat-title text-sm pb-1">预计新增铸币</div>
            <div className="stat-value text-xl text-secondary">
              {isPendingEstimatedActionReward ? <LoadingIcon /> : formatTokenAmount(expectedReward ?? BigInt(0))}
            </div>
          </div>
        </div>
        <div className="text-center text-xs mb-2 text-greyscale-500">
          预估年化收益率（APY）：
          {isPendingJoinedAmount || isPendingEstimatedActionReward || isLoadingAction19Pool ? (
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
