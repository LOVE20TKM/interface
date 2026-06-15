'use client';
import React, { useContext } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ChevronRight, HandHelping } from 'lucide-react';

import { Card, CardHeader, CardContent } from '@/components/ui/card';

// my utils
import { calculateActionAPY } from '@/src/lib/domainUtils';
import { formatPercentage } from '@/src/lib/format';
import type { ActingPageJoinableAction } from '@/src/hooks/composite/useActingPageData';
// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import RoundLite from '@/src/components/Common/RoundLite';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

interface JoiningActionListProps {
  currentRound: bigint;
  joinableActions: ActingPageJoinableAction[] | undefined;
  isPendingActions: boolean;
  isPendingExtension?: boolean;
  expectedReward: bigint | undefined;
  isPendingReward: boolean;
}

const JoiningActionList: React.FC<JoiningActionListProps> = ({
  currentRound,
  joinableActions,
  isPendingActions,
  isPendingExtension = false,
  expectedReward,
  isPendingReward,
}) => {
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 计算所有 joinableActions 的总票数，用于计算投票占比
  const totalVotes = joinableActions?.reduce((acc, action) => acc + action.votesNum, BigInt(0)) || BigInt(0);
  // 只有 hasReward 的行动会进入行动激励分配，未达标行动的票数不应稀释奖励份额。
  const totalRewardVotes =
    joinableActions?.reduce((acc, action) => (action.hasReward ? acc + action.votesNum : acc), BigInt(0)) ||
    BigInt(0);

  return (
    <div className="px-4 py-6">
      <LeftTitle title="本轮可参与的行动：" />
      <RoundLite currentRound={currentRound} roundType="act" />
      {!account && <div className="text-sm mt-4 text-greyscale-500 text-center">请先连接钱包</div>}
      {account && isPendingActions && (
        <div className="p-4 flex justify-center items-center">
          <LoadingIcon />
        </div>
      )}
      {account && !isPendingActions && !joinableActions?.length && (
        <div className="text-sm mt-4 text-greyscale-500 text-center">本轮暂无行动</div>
      )}
      {!isPendingActions && joinableActions && joinableActions.length > 0 && (
        <div className="mt-2 space-y-4">
          {joinableActions
            ?.sort((a, b) => {
              // 首先按有无激励排序，有激励的排在前面
              if (a.hasReward && !b.hasReward) return -1;
              if (!a.hasReward && b.hasReward) return 1;

              // 然后按照 votesNum 从大到小排序（票数大的显示在上面）
              const votesA = Number(a.votesNum);
              const votesB = Number(b.votesNum);
              return votesB - votesA;
            })
            .map((actionDetail: ActingPageJoinableAction) => {
              // 计算投票占比
              const voteRatio =
                Number(totalVotes) > 0 ? Number(actionDetail.votesNum || BigInt(0)) / Number(totalVotes) : 0;

              // 根据是否已加入，设置不同的链接
              const href = `/action/info?id=${actionDetail.action.head.id}&symbol=${token?.symbol}`;

              // 根据是否有激励设置背景色
              const cardClassName = actionDetail.hasReward ? 'shadow-none' : 'shadow-none bg-gray-50';

              const actionExpectedReward =
                actionDetail.hasReward && totalRewardVotes > BigInt(0) && expectedReward
                  ? (expectedReward * actionDetail.votesNum) / totalRewardVotes
                  : BigInt(0);

              const actionCost = actionDetail.joinedAmount;
              return (
                <Card key={actionDetail.action.head.id} className={cardClassName}>
                  <Link href={href} className="relative block">
                    <CardHeader className="px-3 pt-2 pb-1 flex-row justify-between items-baseline">
                      <div className="flex items-baseline">
                        <span className="text-greyscale-400 text-sm">{`No.`}</span>
                        <span className="text-secondary text-xl font-bold mr-2">
                          {String(actionDetail.action.head.id)}
                        </span>
                        <span
                          className={`font-bold ${
                            actionDetail.hasReward ? 'text-greyscale-800' : 'text-greyscale-400'
                          }`}
                        >{`${actionDetail.action.body.title}`}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pt-1 pb-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center">
                          <HandHelping className="text-greyscale-400 mr-1 h-3 w-3" />
                          <span className="text-greyscale-400">
                            <AddressWithCopyButton address={actionDetail.submitter} showCopyButton={false} />
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          <span className="text-greyscale-400 text-xs mr-1">投票占</span>
                          <span className="text-secondary text-xs">{formatPercentage(voteRatio * 100)}</span>
                        </span>
                        {!actionDetail.hasReward ? (
                          <span className="flex justify-between text-error text-sm">无铸币激励</span>
                        ) : (
                          <span>
                            <span className="text-greyscale-400 text-xs mr-1">APY</span>
                            <span className="text-secondary text-xs">
                              {isPendingReward || isPendingExtension || actionDetail.isExtensionAmountPending ? (
                                <LoadingIcon />
                              ) : (
                                calculateActionAPY(actionExpectedReward, actionCost)
                              )}
                            </span>
                          </span>
                        )}
                      </div>
                    </CardContent>
                    <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-greyscale-400 pointer-events-none" />
                  </Link>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default JoiningActionList;
