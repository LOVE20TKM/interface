import React, { useMemo } from 'react';
import Link from 'next/link';

import { useAccountStakeStatus } from '@/src/hooks/contracts/useLOVE20Stake';
import { useTokenAmountsBySlAmount } from '@/src/hooks/contracts/useLOVE20SLToken';
import { formatTokenAmount } from '@/src/lib/format';
import { GOV_RATIO_PRECISION, estimateRequiredSlAmount } from './liquidityStakeOverflowMath';

export { GOV_RATIO_PRECISION };

const MAX_WAITING_PHASES = BigInt(Number(process.env.NEXT_PUBLIC_PROMISED_WAITING_PHASES_MAX) || 12);

const emptyAddress = '' as `0x${string}`;

interface LiquidityStakeOverflowHintProps {
  tokenAddress: `0x${string}` | undefined;
  slTokenAddress: `0x${string}` | undefined;
  symbol: string | undefined;
  parentTokenSymbol: string | undefined;
  account: `0x${string}` | undefined;
  targetRatio: bigint;
  userGovVotes: bigint;
  totalGovVotes: bigint;
  govRatioMultiplier: bigint;
  isGovDataPending?: boolean;
  className?: string;
}

const LiquidityStakeOverflowHint: React.FC<LiquidityStakeOverflowHintProps> = ({
  tokenAddress,
  slTokenAddress,
  symbol,
  parentTokenSymbol,
  account,
  targetRatio,
  userGovVotes,
  totalGovVotes,
  govRatioMultiplier,
  isGovDataPending = false,
  className = '',
}) => {
  const {
    slAmount,
    govVotes,
    promisedWaitingPhases,
    isPending: isStakeStatusPending,
  } = useAccountStakeStatus(
    tokenAddress || emptyAddress,
    account || emptyAddress,
  );

  const waitingPhases = useMemo(() => {
    if (promisedWaitingPhases > MAX_WAITING_PHASES) return promisedWaitingPhases;
    return MAX_WAITING_PHASES;
  }, [promisedWaitingPhases]);

  const isVoteDataPending = isStakeStatusPending || isGovDataPending;
  const recordedGovVotes = govVotes || BigInt(0);
  const hasInvalidStakeReceipts = !isVoteDataPending && recordedGovVotes > userGovVotes;

  const requiredSlAmount = useMemo(
    () => {
      if (isVoteDataPending || hasInvalidStakeReceipts) return BigInt(0);

      return estimateRequiredSlAmount({
        targetRatio,
        userGovVotes,
        totalGovVotes,
        govRatioMultiplier,
        slAmount: slAmount || BigInt(0),
        waitingPhases,
      });
    },
    [
      govRatioMultiplier,
      hasInvalidStakeReceipts,
      isVoteDataPending,
      slAmount,
      targetRatio,
      totalGovVotes,
      userGovVotes,
      waitingPhases,
    ],
  );

  const tokenAmountsSlAddress = requiredSlAmount && requiredSlAmount > BigInt(0) ? slTokenAddress || emptyAddress : emptyAddress;
  const {
    tokenAmountsBySlAmount,
    isPending: isTokenAmountsPending,
  } = useTokenAmountsBySlAmount(tokenAmountsSlAddress, requiredSlAmount || BigInt(0));

  if (!tokenAddress || !slTokenAddress || !account || !symbol || !parentTokenSymbol) return null;
  if (isVoteDataPending) return null;

  if (hasInvalidStakeReceipts && targetRatio > BigInt(0) && govRatioMultiplier > BigInt(0)) {
    return (
      <div className={`text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 w-full ${className}`}>
        <div className="font-medium">预计激励会溢出</div>
        <div className="mt-1">当前质押凭证不足，治理票暂不可用。请先找回 SL/ST 凭证，再追加流动性质押。</div>
      </div>
    );
  }

  if (requiredSlAmount === BigInt(0)) return null;

  if (requiredSlAmount === undefined) {
    return (
      <div className={`text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 w-full ${className}`}>
        <div className="font-medium">预计激励会溢出</div>
        <div className="mt-1">当前治理票占比倍数不足，追加流动性质押也无法完全消除溢出。</div>
      </div>
    );
  }

  if (isStakeStatusPending || isTokenAmountsPending || !tokenAmountsBySlAmount) {
    return null;
  }

  return (
    <div className={`text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 w-full ${className}`}>
      <div className="font-medium">预计激励会溢出</div>
      <div className="mt-1">
        按最长 {waitingPhases.toString()} 轮解锁期估算，追加流动性质押约{' '}
        <span className="font-semibold">
          {formatTokenAmount(tokenAmountsBySlAmount.parentTokenAmount, 6, 'ceil')} {parentTokenSymbol}
        </span>{' '}
        和{' '}
        <span className="font-semibold">
          {formatTokenAmount(tokenAmountsBySlAmount.tokenAmount, 6, 'ceil')} {symbol}
        </span>{' '}
        可消除溢出。
      </div>
      <Link href={`/stake/stakelp/?symbol=${symbol}`} className="mt-1 inline-block text-secondary hover:underline">
        去追加流动性质押 &gt;&gt;
      </Link>
    </div>
  );
};

export default LiquidityStakeOverflowHint;
