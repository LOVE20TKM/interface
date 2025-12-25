'use client';

import React from 'react';
import Link from 'next/link';

import { useEstimateAccountScoreByActionRound } from '@/src/hooks/composite/useEstimateAccountScoresByActionIdsByRounds';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

interface ActionRewardScoreCellProps {
  account: `0x${string}`;
  tokenAddress: `0x${string}`;
  actionId: bigint;
  round: bigint;
  symbol: string;
  score: string | null;
  isScoreLoading: boolean;
  needManualLoad: boolean;
  isManualLoading: boolean;
  notSelected: boolean;
  onManualLoad: () => void;
}

const ActionRewardScoreCell: React.FC<ActionRewardScoreCellProps> = ({
  account,
  tokenAddress,
  actionId,
  round,
  symbol,
  score,
  isScoreLoading,
  needManualLoad,
  isManualLoading,
  notSelected,
  onManualLoad,
}) => {
  // 使用单个按需加载 hook（仅在手动触发时启用）
  const { score: loadedScore, isLoading: isHookLoading } = useEstimateAccountScoreByActionRound({
    account,
    tokenAddress,
    actionId,
    round,
    enabled: isManualLoading,
  });

  // 优先使用传入的 score，其次使用 hook 加载的 score
  const displayScore = score ?? loadedScore;
  const isLoading = isScoreLoading || (isManualLoading && isHookLoading);

  if (notSelected) {
    return <span className="text-greyscale-500">-</span>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center">
        <LoadingIcon />
      </div>
    );
  }

  if (displayScore !== null && parseFloat(displayScore) >= 0) {
    return (
      <Link
        href={`/verify/detail?symbol=${symbol}&id=${actionId.toString()}&round=${round.toString()}`}
        rel="noopener noreferrer"
        className="text-secondary hover:text-secondary/80 underline text-sm"
      >
        {displayScore}
      </Link>
    );
  }

  if (needManualLoad && !isManualLoading) {
    return (
      <button
        onClick={onManualLoad}
        className="text-secondary hover:text-secondary/80 text-sm bg-transparent px-2 py-0.5 cursor-pointer"
      >
        加载
      </button>
    );
  }

  return <span className="text-greyscale-500">-</span>;
};

export default ActionRewardScoreCell;
