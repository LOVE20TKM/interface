import React, { useContext, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// my funcs
import { formatTokenAmount } from '@/src/lib/format';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useVotesNumByAccount } from '@/src/hooks/contracts/useLOVE20Vote';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';
import RoundLite from '@/src/components/Common/RoundLite';

interface MyVotingPanelProps {
  currentRound: bigint;
  validGovVotes?: bigint; // 可选参数，如果父组件传入则使用，否则自行获取
  isPendingValidGovVotes?: boolean; // 可选参数，表示是否正在加载治理票数
}

const MyVotingPanel: React.FC<MyVotingPanelProps> = ({
  currentRound,
  validGovVotes: externalValidGovVotes,
  isPendingValidGovVotes: externalIsPendingValidGovVotes,
}) => {
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 我的投票数
  const {
    votesNumByAccount,
    isPending: isPendingVotesNumByAccount,
    error: errorVotesNumByAccount,
  } = useVotesNumByAccount((token?.address as `0x${string}`) || '', currentRound, (account as `0x${string}`) || '');

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorVotesNumByAccount) {
      handleContractError(errorVotesNumByAccount, 'vote');
    }
  }, [errorVotesNumByAccount]);

  if (!token) {
    return '';
  }
  if (!account) {
    return (
      <>
        <div className="flex-col items-center px-4 py-2">
          <LeftTitle title="我的投票" />
          <div className="text-sm mt-4 text-greyscale-500 text-center">请先连接钱包</div>
        </div>
      </>
    );
  }
  const isPendingValidGovVotes = externalIsPendingValidGovVotes || false;
  const validGovVotes = externalValidGovVotes || BigInt(0);

  return (
    <div className="flex-col items-center px-0 py-2">
      <div className="flex justify-between items-center mb-2">
        <LeftTitle title="我的投票" />
        <Button variant="link" className="text-secondary border-secondary" asChild>
          <Link href={`/vote/actions/?symbol=${token?.symbol}`}>投票中的行动</Link>
        </Button>
      </div>
      <div className="stats w-full grid grid-cols-2 divide-x-0">
        <div className="stat place-items-center pt-1 pb-2">
          <div className="stat-title text-sm">我的已投票数</div>
          <div className="stat-value text-xl">
            {isPendingVotesNumByAccount ? <LoadingIcon /> : formatTokenAmount(votesNumByAccount || BigInt(0))}
          </div>
        </div>
        <div className="stat place-items-center pt-0 pb-2">
          <div className="stat-title text-sm">我的未投票数</div>
          <div className="stat-value text-xl">
            {isPendingValidGovVotes || isPendingVotesNumByAccount ? (
              <LoadingIcon />
            ) : validGovVotes ? (
              formatTokenAmount(validGovVotes - votesNumByAccount || BigInt(0))
            ) : (
              '0'
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        {isPendingValidGovVotes || isPendingVotesNumByAccount ? (
          <LoadingIcon />
        ) : validGovVotes > votesNumByAccount + BigInt(10) ? (
          <Button className="w-1/2" asChild>
            <Link href={`/vote?symbol=${token.symbol}`}>去投票</Link>
          </Button>
        ) : (
          <Button disabled className="w-1/2">
            {validGovVotes > 0 ? '已投票' : '无治理票，不能投票'}
          </Button>
        )}
      </div>
      <div className="flex justify-center mt-2">
        <RoundLite currentRound={currentRound} roundType="vote" />
      </div>
    </div>
  );
};

export default MyVotingPanel;
