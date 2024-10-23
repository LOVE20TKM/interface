import React, { useContext, useEffect } from 'react';
import { useAccount } from 'wagmi';

import { useVotesNumByAccountByActionId } from '../../hooks/contracts/useLOVE20Vote';
import { useScoreByVerifierByActionId } from '../../hooks/contracts/useLOVE20Verify';

import { TokenContext } from '../../contexts/TokenContext';
import { formatTokenAmount } from '../../utils/format';
import Loading from '../Common/Loading';

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
  const { address: accountAddress } = useAccount();

  // 获取我的投票数(即最大验证票数)
  const {
    votesNumByAccountByActionId,
    isPending: isPendingVotesNumByAccount,
    error: isVotesNumByAccountError,
  } = useVotesNumByAccountByActionId(
    token?.address as `0x${string}`,
    currentRound,
    (accountAddress as `0x${string}`) || '',
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
    (accountAddress as `0x${string}`) || '',
    actionId,
  );

  // 计算剩余验证票数,并传递给上层组件
  const remainingVotes =
    !isPendingVotesNumByAccount && !isPendingScoreByVerifier
      ? votesNumByAccountByActionId - scoreByVerifierByActionId
      : BigInt(0);
  useEffect(() => {
    if (!isPendingVotesNumByAccount && !isPendingScoreByVerifier) {
      onRemainingVotesChange?.(remainingVotes);
    }
  }, [remainingVotes]);

  // console.log('votesNumByAccount', isPendingVotesNumByAccount);
  // console.log('scoreByVerifier', scoreByVerifierByActionId);
  // console.log('remainingVotes', remainingVotes);

  return (
    <div className="mb-4 text-center">
      <span className="font-semibold">
        我的剩余验证票数：
        {isPendingVotesNumByAccount || isPendingScoreByVerifier ? (
          <Loading />
        ) : (
          <span className="text-orange-500">{formatTokenAmount(remainingVotes)}</span>
        )}
      </span>
    </div>
  );
};

export default MyActionVerifingPanel;
