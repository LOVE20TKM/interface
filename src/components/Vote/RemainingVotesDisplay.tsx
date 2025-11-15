'use client';

import Link from 'next/link';
import { formatTokenAmount } from '@/src/lib/format';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

/**
 * 剩余票数展示组件
 */
export interface RemainingVotesDisplayProps {
  validGovVotes: bigint;
  votesNumByAccount: bigint;
  isPendingValidGovVotes: boolean;
  isPendingVotesNumByAccount: boolean;
  tokenSymbol?: string;
}

const RemainingVotesDisplay: React.FC<RemainingVotesDisplayProps> = ({
  validGovVotes,
  votesNumByAccount,
  isPendingValidGovVotes,
  isPendingVotesNumByAccount,
  tokenSymbol,
}) => {
  return (
    <div className="stats w-full">
      <div className="stat place-items-center">
        <div className="stat-title text-sm">我的剩余票数</div>
        <div className="stat-value text-secondary mt-2">
          {isPendingValidGovVotes || isPendingVotesNumByAccount ? (
            <LoadingIcon />
          ) : (
            formatTokenAmount(validGovVotes - votesNumByAccount || BigInt(0))
          )}
        </div>
        <div className="stat-desc text-sm mt-2">
          如需更多票数，请先{' '}
          <Link href={`/gov/stakelp/?symbol=${tokenSymbol}`} className="text-secondary">
            获取治理票
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RemainingVotesDisplay;
