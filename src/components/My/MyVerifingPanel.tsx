import React, { useContext, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';

import { useVotesNumByAccount } from '../../hooks/contracts/useLOVE20Vote';
import { useScoreByVerifier } from '../../hooks/contracts/useLOVE20Verify';

import { TokenContext } from '../../contexts/TokenContext';
import { formatTokenAmount } from '../../utils/format';
import Loading from '../Common/Loading';

interface MyVerifingPanelProps {
  currentRound: bigint;
  showBtn?: boolean;
}

const MyVerifingPanel: React.FC<MyVerifingPanelProps> = ({ currentRound, showBtn = true }) => {
  const { token } = useContext(TokenContext) || {};
  const { address: accountAddress } = useAccount();

  // 获取我的投票数(即最大验证票数)
  const {
    votesNumByAccount,
    isPending: isPendingVotesNumByAccount,
    error: isVotesNumByAccountError,
  } = useVotesNumByAccount(token?.address as `0x${string}`, currentRound, (accountAddress as `0x${string}`) || '');

  // 获取我的已验证票数
  const {
    scoreByVerifier,
    isPending: isPendingScoreByVerifier,
    error: isScoreByVerifierError,
  } = useScoreByVerifier(token?.address as `0x${string}`, currentRound, (accountAddress as `0x${string}`) || '');

  // 计算剩余验证票数
  const remainingVotes =
    !isPendingVotesNumByAccount && !isPendingScoreByVerifier ? votesNumByAccount - scoreByVerifier : BigInt(0);

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-base-100">
      <h1 className="text-base text-center">
        验证轮（第 <span className="text-red-500">{Number(currentRound)}</span> 轮）
      </h1>

      <div className="flex w-full justify-center space-x-20">
        <div className="flex flex-col items-center">
          <span className="text-sm text-gray-500">我的已投验证票</span>
          <span className="text-2xl font-bold text-orange-400">
            {isPendingScoreByVerifier ? <Loading /> : formatTokenAmount(scoreByVerifier || BigInt(0))}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm text-gray-500">我的剩余验证票</span>
          <span className="text-2xl font-bold text-orange-400">
            {isPendingVotesNumByAccount || isPendingScoreByVerifier ? <Loading /> : formatTokenAmount(remainingVotes)}
          </span>
        </div>
      </div>

      {showBtn &&
        (isPendingVotesNumByAccount || isPendingScoreByVerifier ? (
          <Loading />
        ) : votesNumByAccount > scoreByVerifier ? (
          <Link href="/verify" className="btn-primary btn w-1/2">
            去验证
          </Link>
        ) : (
          <span className="text-gray-500 text-sm">无剩余验证票</span>
        ))}
    </div>
  );
};

export default MyVerifingPanel;
