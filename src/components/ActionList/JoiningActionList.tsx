'use client';
import React, { useContext, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ChevronRight, UserPen } from 'lucide-react';

import { JoinableAction } from '@/src/types/love20types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

// my utils
import { calculateActionAPY, calculateExpectedActionReward } from '@/src/lib/domainUtils';
import { formatPercentage, formatTokenAmount } from '@/src/lib/format';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useRewardAvailable } from '@/src/hooks/contracts/useLOVE20Mint';

// my components
import RoundLite from '@/src/components/Common/RoundLite';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

interface JoiningActionListProps {
  currentRound: bigint;
  joinableActions: JoinableAction[] | undefined;
  getJoinedAmount: (index: number) => bigint;
  isPendingActions: boolean;
}

const JoiningActionList: React.FC<JoiningActionListProps> = ({
  currentRound,
  joinableActions,
  getJoinedAmount,
  isPendingActions,
}) => {
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取奖励可用额度
  const {
    rewardAvailable,
    isPending: isPendingRewardAvailable,
    error: errorRewardAvailable,
  } = useRewardAvailable((token?.address as `0x${string}`) || '');

  // 计算所有 joinableActions 的总票数，用于计算投票占比
  const totalVotes = joinableActions?.reduce((acc, action) => acc + action.votesNum, BigInt(0)) || BigInt(0);

  // 计算预计新增铸币
  const displayRound = token ? currentRound - BigInt(token.initialStakeRound) + BigInt(1) : BigInt(0);
  const expectedReward = calculateExpectedActionReward(rewardAvailable, displayRound);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorRewardAvailable) {
      handleContractError(errorRewardAvailable, 'mint');
    }
  }, [errorRewardAvailable]);

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
            .map((actionDetail: JoinableAction, index: number) => {
              // 获取参与代币数（考虑扩展协议）
              const joinedAmount = getJoinedAmount(index);

              // 计算投票占比
              const voteRatio =
                Number(totalVotes) > 0 ? Number(joinableActions[index].votesNum || BigInt(0)) / Number(totalVotes) : 0;

              // 根据是否已加入，设置不同的链接
              const href = `/action/info?id=${actionDetail.action.head.id}&symbol=${token?.symbol}`;

              // 根据是否有激励设置背景色
              const cardClassName = actionDetail.hasReward ? 'shadow-none' : 'shadow-none bg-gray-50';

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
                          <UserPen className="text-greyscale-400 mr-1 h-3 w-3" />
                          {/* <span className="text-greyscale-400 text-xs mr-1">创建人</span> */}
                          <span className="text-greyscale-400">
                            <AddressWithCopyButton
                              address={joinableActions[index].action.head.author as `0x${string}`}
                              showCopyButton={false}
                              // colorClassName2="text-secondary"
                            />
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          <span className="text-greyscale-400 text-xs mr-1">投票占</span>
                          <span className="text-secondary text-xs">{formatPercentage(voteRatio * 100)}</span>
                        </span>
                        <span>
                          <span className="text-greyscale-400 text-xs mr-1">参与代币</span>
                          <span className="text-secondary text-xs">{formatTokenAmount(joinedAmount)}</span>
                        </span>
                        {!actionDetail.hasReward ? (
                          <span className="flex justify-between text-error text-sm">无铸币激励</span>
                        ) : (
                          <span>
                            <span className="text-greyscale-400 text-xs mr-1">APY</span>
                            <span className="text-secondary text-xs">
                              {isPendingRewardAvailable ? (
                                <LoadingIcon />
                              ) : (
                                calculateActionAPY(
                                  BigInt(Math.floor(Number(expectedReward || BigInt(0)) * voteRatio)),
                                  joinedAmount,
                                )
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
