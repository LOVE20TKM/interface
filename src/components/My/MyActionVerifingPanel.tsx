import React, { useContext, useEffect } from 'react';
import { useAccount } from 'wagmi';

// my hooks
import { useVotesNumByAccountByActionId } from '@/src/hooks/contracts/useLOVE20Vote';
import { useScoreByVerifierByActionId } from '@/src/hooks/contracts/useLOVE20Verify';
// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my funcs
import { formatTokenAmount } from '@/src/lib/format';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';

interface MyActionVerifingPanelProps {
  currentRound: bigint;
  actionId: bigint;
  onRemainingVotesChange?: (votes: bigint) => void;
}

const MyActionVerifingPanel: React.FC<MyActionVerifingPanelProps> = ({
  currentRound,
  actionId,
  onRemainingVotesChange,
}) => {
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取我的投票数(即最大验证票数)
  const {
    votesNumByAccountByActionId,
    isPending: isPendingVotesNumByAccount,
    error: isVotesNumByAccountError,
  } = useVotesNumByAccountByActionId(
    token?.address as `0x${string}`,
    currentRound,
    (account as `0x${string}`) || '',
    actionId,
  );

  // 获取我的已验证票数
  const {
    scoreByVerifierByActionId,
    isPending: isPendingScoreByVerifier,
    error: isScoreByVerifierError,
  } = useScoreByVerifierByActionId(
    token?.address as `0x${string}`,
    currentRound,
    (account as `0x${string}`) || '',
    actionId,
  );

  // 计算剩余验证票数,并传递给上层组件
  const remainingVotes =
    !isPendingVotesNumByAccount && !isPendingScoreByVerifier
      ? votesNumByAccountByActionId - scoreByVerifierByActionId
      : BigInt(0);

  useEffect(() => {
    if (!isPendingVotesNumByAccount && !isPendingScoreByVerifier) {
      console.log('remainingVotes', remainingVotes);
      console.log('isPendingVotesNumByAccount', isPendingVotesNumByAccount);
      console.log('isPendingScoreByVerifier', isPendingScoreByVerifier);
      onRemainingVotesChange?.(remainingVotes);
    }
  }, [remainingVotes, isPendingVotesNumByAccount, isPendingScoreByVerifier]);

  if (remainingVotes <= 0) {
    return <></>;
  }

  return (
    <div className="px-4">
      <div className="text-center bg-greyscale-100 p-4 rounded-lg">
        <span className="text-greyscale-800 text-base">
          我的剩余验证票数：
          {isPendingVotesNumByAccount || isPendingScoreByVerifier ? (
            <LoadingIcon />
          ) : (
            <span className="text-secondary">{formatTokenAmount(remainingVotes)}</span>
          )}
        </span>
        <div className="mt-2 text-sm text-greyscale-500 text-center">
          {/* 提示: 最大可验证票数，等于您本轮对该行动的投票数 */}
          提示: 您的验证票，将按“打分比例”分配给行动参与者
        </div>
      </div>
    </div>
  );
};

export default MyActionVerifingPanel;
