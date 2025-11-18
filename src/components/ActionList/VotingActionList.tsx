'use client';
/**
 * 列表：显示正在投票中的行动
 */

import { useRouter } from 'next/router';
import { ChevronRight, UserPen } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Link from 'next/link';
import React, { useContext, useEffect } from 'react';

// my hooks
import { VotingAction } from '@/src/types/love20types';
import { useVotingActions } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

// my lib
import { formatPercentage, formatTokenAmount } from '@/src/lib/format';

interface VotingActionListProps {
  currentRound: bigint;
}

const VotingActionList: React.FC<VotingActionListProps> = ({ currentRound }) => {
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const router = useRouter();

  // 获取所有投票中的行动
  const { votingActions, isPending, error } = useVotingActions(
    (token?.address as `0x${string}`) || '',
    currentRound,
    account as `0x${string}`,
  );

  // 计算投票总数： 累计
  const totalVotes = votingActions.reduce((acc, votingAction) => acc + votingAction.votesNum, BigInt(0));

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (error) {
      handleContractError(error, 'vote');
    }
  }, [error, handleContractError]);

  // 加载中
  if (isPending) {
    return (
      <div className="p-4 flex justify-center items-center">
        <LoadingIcon />
      </div>
    );
  }

  if (!token) {
    return <LoadingIcon />;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <LeftTitle title="投票中的行动" />
        {token && (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="text-secondary border-secondary" asChild>
              <Link href={`/submit/actions?symbol=${token?.symbol}`}>推举其他行动</Link>
            </Button>
            <Button variant="outline" size="sm" className="text-secondary border-secondary" asChild>
              <Link href={`/gov?symbol=${token?.symbol}`}>返回治理</Link>
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {votingActions.length > 0 ? (
          <>
            {votingActions
              .sort((a, b) => Number(b.votesNum - a.votesNum)) // 按投票数倒序排序
              ?.map((votingAction: VotingAction, index: number) => {
                const action = votingAction.action;
                // const submitter = votingAction.submitter;

                return (
                  <Card key={action.head.id} className="shadow-none flex items-center relative">
                    <Link
                      href={`/vote/single?id=${action.head.id}&symbol=${token?.symbol}`}
                      key={action.head.id}
                      className="w-full"
                    >
                      <CardHeader className="px-3 pt-2 pb-1 flex-row justify-start items-baseline">
                        <span className="text-greyscale-400 text-sm">No.</span>
                        <span className="text-secondary text-xl font-bold mr-2">{String(action.head.id)}</span>
                        <span className="font-bold text-greyscale-800">{`${action.body.title}`}</span>
                      </CardHeader>
                      <CardContent className="px-3 pt-1 pb-2">
                        <div className="flex justify-between gap-0 mt-1 text-sm">
                          <span className="flex items-center">
                            <UserPen className="text-greyscale-400 mr-1 h-3 w-3 -translate-y-0.5" />
                            <span className="text-greyscale-400">
                              <AddressWithCopyButton
                                address={action.head.author as `0x${string}`}
                                showCopyButton={false}
                                colorClassName2="text-secondary"
                              />
                            </span>
                          </span>
                          <span>
                            <span className="text-greyscale-400 mr-1">投票数</span>
                            <span className="text-secondary">{formatTokenAmount(votingAction.votesNum)}</span>
                          </span>
                          <span>
                            <span className="text-greyscale-400 mr-1">占比</span>
                            <span className="text-secondary">
                              {totalVotes === BigInt(0)
                                ? '-'
                                : formatPercentage((Number(votingAction.votesNum) * 100) / Number(totalVotes))}
                            </span>
                          </span>
                        </div>
                      </CardContent>
                      <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-greyscale-400 pointer-events-none" />
                    </Link>
                  </Card>
                );
              })}
          </>
        ) : (
          <div className="text-center mt-8">
            <div className="text-base text-greyscale-500 mb-4">还没有推举行动，请先推举！</div>
            <Button asChild>
              <Link href={`/submit/actions?symbol=${token?.symbol}`}>去推举行动</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingActionList;
