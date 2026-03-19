'use client';
import React, { useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

// my hooks
import { useValidGovVotes } from '@/src/hooks/contracts/useLOVE20Stake';
import { useCurrentRound, useVotesNumByAccountByActionId, useVote } from '@/src/hooks/contracts/useLOVE20Vote';
import { useVotesNumByAccount } from '@/src/hooks/contracts/useLOVE20Vote';
// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import { formatTokenAmount } from '@/src/lib/format';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

interface ActionPanelForVoteProps {
  actionId: bigint;
  onRoundChange: (currentRound: bigint) => void;
}

const ActionPanelForVote: React.FC<ActionPanelForVoteProps> = ({ actionId, onRoundChange }) => {
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const router = useRouter();

  // 获取当前轮次, 并设置状态给父组件
  const { currentRound, isPending: isPendingCurrentRound, error: errCurrentRound } = useCurrentRound();
  useEffect(() => {
    if (onRoundChange && typeof onRoundChange === 'function') {
      onRoundChange(currentRound);
    }
  }, [currentRound, onRoundChange]);

  // 我的治理票&总有效票数
  const {
    validGovVotes,
    isPending: isPendingValidGovVotes,
    error: errValidGovVotes,
  } = useValidGovVotes(token?.address as `0x${string}`, account as `0x${string}`);

  // 获取我对actionId的投票数
  const {
    votesNumByAccountByActionId,
    isPending: isPendingVotesNumByAccountByActionId,
    error: errVotesNumByAccountByActionId,
  } = useVotesNumByAccountByActionId(token?.address as `0x${string}`, currentRound, account as `0x${string}`, actionId);

  // 我的总投票数
  const {
    votesNumByAccount,
    isPending: isPendingVotesNumByAccount,
    error: errorVotesNumByAccount,
  } = useVotesNumByAccount((token?.address as `0x${string}`) || '', currentRound, (account as `0x${string}`) || '');

  // 投票
  const isLoading = isPendingValidGovVotes || isPendingVotesNumByAccount || isPendingVotesNumByAccountByActionId;
  const myLeftVotes = isLoading ? BigInt(0) : validGovVotes - votesNumByAccount;

  const {
    vote,
    isPending: isWritingVote,
    isConfirming: isConfirmingVote,
    isConfirmed: isConfirmedVote,
    writeError: errorVote,
  } = useVote();
  const handleVote = () => {
    if (isWritingVote || isConfirmingVote) {
      return;
    }
    vote(token?.address as `0x${string}`, [actionId], [myLeftVotes]);
  };

  // 提交成功
  useEffect(() => {
    if (isConfirmedVote && !errorVote) {
      toast.success('提交成功', {
        duration: 2000, // 2秒
      });
      setTimeout(() => {
        router.push(`/vote/actions/?symbol=${token?.symbol}`);
      }, 2000);
    }
  }, [isConfirmedVote, errorVote]);

  return (
    <>
      <div className="flex flex-col items-center space-y-3 p-4 mb-2">
        <div className="stats w-full border grid grid-cols-2 divide-x-0 mb-2">
          <div className="stat place-items-center">
            <div className="stat-title">我已投本行动票数</div>
            <div className="stat-value text-2xl">
              {isPendingVotesNumByAccountByActionId ? <LoadingIcon /> : formatTokenAmount(votesNumByAccountByActionId)}
            </div>
          </div>
          <div className="stat place-items-center">
            <div className="stat-title">我的剩余票数</div>
            <div className="stat-value text-2xl">{isLoading ? <LoadingIcon /> : formatTokenAmount(myLeftVotes)}</div>
          </div>
        </div>

        {!isPendingVotesNumByAccountByActionId && myLeftVotes > BigInt(10) ? (
          <Button className="w-1/2" onClick={handleVote} disabled={isWritingVote || isConfirmingVote}>
            {isWritingVote || isConfirmingVote ? <LoadingIcon /> : '将100%票投给此行动'}
          </Button>
        ) : (
          <Button className="w-1/2" disabled>
            {isLoading ? <LoadingIcon /> : '没有剩余票数'}
          </Button>
        )}
        {!isPendingValidGovVotes && (
          <div className="text-sm text-greyscale-500 text-center">
            提示: 每轮最大可投票数，等于您的治理票数 ({formatTokenAmount(validGovVotes)})
          </div>
        )}
      </div>

      <LoadingOverlay
        isLoading={isWritingVote || isConfirmingVote}
        text={isWritingVote ? '提交交易...' : '确认交易...'}
      />
    </>
  );
};

export default ActionPanelForVote;
