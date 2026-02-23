import React, { useContext, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// my funcs
import { formatTokenAmount } from '@/src/lib/format';
import { safeToBigInt } from '@/src/lib/clientUtils';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useVotesNumByAccount } from '@/src/hooks/contracts/useLOVE20Vote';
import { useScoreByVerifier } from '@/src/hooks/contracts/useLOVE20Verify';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';
import RoundLite from '@/src/components/Common/RoundLite';

interface MyVerifingPanelProps {
  currentRound: bigint;
  showBtn?: boolean;
}

const MyVerifingPanel: React.FC<MyVerifingPanelProps> = ({ currentRound, showBtn = true }) => {
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取我的投票数(即最大验证票数)
  const {
    votesNumByAccount,
    isPending: isPendingVotesNumByAccount,
    error: isVotesNumByAccountError,
  } = useVotesNumByAccount(token?.address as `0x${string}`, currentRound, (account as `0x${string}`) || '');

  // 获取我的已验证票数
  const {
    scoreByVerifier,
    isPending: isPendingScoreByVerifier,
    error: isScoreByVerifierError,
  } = useScoreByVerifier(token?.address as `0x${string}`, currentRound, (account as `0x${string}`) || '');

  // 计算剩余验证票数
  const remainingVotes = (() => {
    if (isPendingVotesNumByAccount || isPendingScoreByVerifier) {
      return BigInt(0);
    }

    const votes = safeToBigInt(votesNumByAccount);
    const score = safeToBigInt(scoreByVerifier);

    try {
      return votes >= score ? votes - score : BigInt(0);
    } catch (error) {
      console.error('计算剩余验证票数出错:', error);
      return BigInt(0);
    }
  })();

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (isVotesNumByAccountError) {
      handleContractError(isVotesNumByAccountError, 'vote');
    }
    if (isScoreByVerifierError) {
      handleContractError(isScoreByVerifierError, 'verify');
    }
  }, [isVotesNumByAccountError, isScoreByVerifierError]);

  if (!token) {
    return <LoadingIcon />;
  }
  if (!account) {
    return (
      <>
        <div className="flex-col items-center px-4 pt-6 pb-2">
          <LeftTitle title="行动验证" />
          <div className="text-sm mt-4 text-greyscale-500 text-center">请先连接钱包</div>
        </div>
      </>
    );
  }

  return (
    <div className="flex-col items-center px-0 pb-2">
      <div className="flex justify-between items-center mb-2">
        <LeftTitle title="我的验证" />
        {showBtn && currentRound >= BigInt(1) && (
          <Button variant="link" className="text-secondary border-secondary underline" asChild>
            <Link href={`/verify/actions/?symbol=${token?.symbol}`}>验证中的行动 &gt;&gt;</Link>
          </Button>
        )}
      </div>
      <div className="stats w-full grid grid-cols-2 divide-x-0 mt-2">
        <div className="stat place-items-center pt-1 pb-2">
          <div className="stat-title text-sm">已验证票数</div>
          <div className={`stat-value text-xl ${!showBtn ? 'text-secondary' : ''}`}>
            {isPendingScoreByVerifier ? <LoadingIcon /> : formatTokenAmount(safeToBigInt(scoreByVerifier))}
          </div>
        </div>
        <div className="stat place-items-center pt-0 pb-2">
          <div className="stat-title text-sm">未验证票数</div>
          <div className={`stat-value text-xl ${!showBtn ? 'text-secondary' : ''}`}>
            {isPendingVotesNumByAccount || isPendingScoreByVerifier ? (
              <LoadingIcon />
            ) : (
              formatTokenAmount(remainingVotes)
            )}
          </div>
        </div>
      </div>
      {showBtn && (
        <div className="flex justify-center">
          {isPendingVotesNumByAccount || isPendingScoreByVerifier ? (
            <LoadingIcon />
          ) : remainingVotes > BigInt(5) && safeToBigInt(votesNumByAccount) > safeToBigInt(scoreByVerifier) ? (
            <Button className="w-1/2" asChild>
              <Link href={`/verify?symbol=${token.symbol}`}>去验证</Link>
            </Button>
          ) : (
            <Button disabled className="w-1/2">
              {safeToBigInt(scoreByVerifier) > BigInt(0) ? '已验证' : '未投票，无需验证'}
            </Button>
          )}
        </div>
      )}
      <div className="flex justify-center mt-2">
        <RoundLite currentRound={currentRound} roundType="verify" />
      </div>
    </div>
  );
};

export default MyVerifingPanel;
