// components/Extension/Plugins/Group/_GroupParticipationStats.tsx
// 链群参与统计组件 - 显示"我的参与"和"还可追加"（内部组件）

'use client';

// React
import React, { useContext, useEffect } from 'react';

// 第三方库
import { useAccount } from 'wagmi';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useExtensionActionConstCache, useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite';
import { useJoinInfo } from '@/src/hooks/extension/plugins/group/contracts/useGroupJoin';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';
import { formatPercentage, formatTokenAmount } from '@/src/lib/format';

// 组件
import LoadingIcon from '@/src/components/Common/LoadingIcon';

interface _GroupParticipationStatsProps {
  actionId: bigint;
  extensionAddress: `0x${string}`;
  groupId: bigint;
}

/**
 * 链群参与统计组件（内部组件）
 * 显示用户的参与数量和还可以追加的代币数量
 */
const _GroupParticipationStats: React.FC<_GroupParticipationStatsProps> = ({ actionId, extensionAddress, groupId }) => {
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};

  // 获取扩展常量数据（包括 joinTokenAddress 和 joinTokenSymbol）
  const {
    constants,
    isPending: isPendingConstants,
    error: errorConstants,
  } = useExtensionActionConstCache({ extensionAddress, actionId });

  const joinTokenSymbol = constants?.joinTokenSymbol;

  // 获取加入信息
  const {
    amount: joinedAmount,
    isPending: isPendingJoinInfo,
    error: errorJoinInfo,
  } = useJoinInfo(extensionAddress, account as `0x${string}`);

  // 获取链群详情
  const {
    groupDetail,
    isPending: isPendingDetail,
    error: errorDetail,
  } = useExtensionGroupDetail({
    extensionAddress,
    actionId,
    groupId,
  });

  // 计算还可以追加的代币数（考虑链群剩余容量）
  // additionalAllowed = min(actualMaxJoinAmount - joinedAmount, remainingCapacity)
  const additionalAllowed =
    groupDetail && joinedAmount
      ? (() => {
          const maxByLimit = groupDetail.actualMaxJoinAmount - joinedAmount;
          const maxByCapacity = groupDetail.remainingCapacity;
          return maxByLimit < maxByCapacity ? maxByLimit : maxByCapacity;
        })()
      : BigInt(0);

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorJoinInfo) handleError(errorJoinInfo);
    if (errorDetail) handleError(errorDetail);
    if (errorConstants) handleError(errorConstants);
  }, [errorJoinInfo, errorDetail, errorConstants, handleError]);

  // 加载中状态
  if (isPendingJoinInfo || isPendingDetail || isPendingConstants) {
    return (
      <div className="w-full py-4">
        <LoadingIcon />
      </div>
    );
  }

  // 数据加载失败
  if (!groupDetail || !joinedAmount) {
    return null;
  }

  return (
    <div className="stats w-full grid grid-cols-2 divide-x-0 gap-4 mb-2">
      {/* 我的参与 */}
      <div className="stat place-items-center flex flex-col justify-center">
        <div className="stat-title">我的参与</div>
        <div className="stat-value text-2xl text-secondary">{formatTokenAmount(joinedAmount || BigInt(0))}</div>
        <div className="stat-desc text-sm mt-2 whitespace-normal break-words text-center">
          占链群{' '}
          {groupDetail?.totalJoinedAmount && groupDetail.totalJoinedAmount > BigInt(0)
            ? formatPercentage((Number(joinedAmount || BigInt(0)) * 100) / Number(groupDetail.totalJoinedAmount))
            : '0.00%'}
        </div>
      </div>

      {/* 还可追加 */}
      <div className="stat place-items-center flex flex-col justify-center">
        <div className="stat-title">还可追加</div>
        <div className="stat-value text-2xl text-secondary">{formatTokenAmount(additionalAllowed)}</div>
        <div className="stat-desc text-sm mt-2 whitespace-normal break-words text-center">
          {joinTokenSymbol || token?.symbol || ''}
        </div>
      </div>
    </div>
  );
};

export default _GroupParticipationStats;
