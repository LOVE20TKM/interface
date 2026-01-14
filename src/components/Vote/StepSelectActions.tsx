'use client';

import { useState, useEffect, useContext } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { UserPen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Link from 'next/link';

// my hooks
import { useVotingActions, useGovData } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my types & functions
import { VotingAction } from '@/src/types/love20types';
import { formatTokenAmount, formatPercentage } from '@/src/lib/format';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LeftTitle from '@/src/components/Common/LeftTitle';

/**
 * 步骤1: 选择要投票的行动列表
 */
export interface StepSelectActionsProps {
  currentRound: bigint;
  onNext: (selectedIds: bigint[]) => void;
}

const StepSelectActions: React.FC<StepSelectActionsProps> = ({ currentRound, onNext }) => {
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const [selectedActions, setSelectedActions] = useState<Set<bigint>>(new Set());

  // 获取所有投票中的行动
  const { votingActions, isPending, error } = useVotingActions(
    (token?.address as `0x${string}`) || '',
    currentRound,
    account as `0x${string}`,
  );

  // 获取总治理票数
  const { govData, isPending: isPendingGovData } = useGovData((token?.address as `0x${string}`) || '');

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (error) {
      handleContractError(error, 'vote');
    }
  }, [error, handleContractError]);

  // 选择复选框
  const handleCheckboxChange = (actionId: bigint) => {
    setSelectedActions((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(actionId)) {
        newSelected.delete(actionId);
      } else {
        newSelected.add(actionId);
      }
      return newSelected;
    });
  };

  // 计算投票总数
  const totalVotes = votingActions.reduce((acc, votingAction) => acc + votingAction.votesNum, BigInt(0));

  // 计算最小投票比例阈值（以百分比为单位）
  const minVotePercentage = Number(process.env.NEXT_PUBLIC_ACTION_REWARD_MIN_VOTE_PER_THOUSAND ?? 0) / 10;

  // 提交选择
  const handleSubmit = () => {
    const selectedIds = Array.from(selectedActions);
    if (selectedIds.length === 0) {
      toast.error('请选择行动');
      return;
    }
    onNext(selectedIds);
  };

  // 加载中
  if (isPending || isPendingGovData || !token) {
    return (
      <div className="p-4 flex justify-center items-center">
        <LoadingIcon />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <LeftTitle title="投票中的行动" />
        {token && (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="text-secondary border-secondary" asChild>
              <Link href="/extension/factories/">推举新行动</Link>
            </Button>
            <Button variant="outline" size="sm" className="text-secondary border-secondary" asChild>
              <Link href={`/submit/actions?symbol=${token?.symbol}`}>推举历史行动</Link>
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {votingActions.length > 0 ? (
          <>
            {votingActions
              .sort((a, b) => Number(b.votesNum - a.votesNum))
              .map((votingAction: VotingAction) => {
                const action = votingAction.action;

                // 计算占总治理票比例
                const govPercentage =
                  !govData?.govVotes || govData.govVotes === BigInt(0)
                    ? 0
                    : (Number(votingAction.votesNum) * 100) / Number(govData.govVotes);

                // 判断是否低于最小比例阈值
                const isBelowMinThreshold = govPercentage < minVotePercentage;

                return (
                  <Card
                    key={action.head.id}
                    className={`shadow-none flex items-center ${isBelowMinThreshold ? 'border-red-500 border-2' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="checkbox accent-secondary ml-2"
                      checked={selectedActions.has(BigInt(action.head.id))}
                      onChange={() => handleCheckboxChange(BigInt(action.head.id))}
                    />
                    <Link
                      href={`/vote/single?id=${action.head.id}&symbol=${token?.symbol}`}
                      key={action.head.id}
                      className="w-full"
                    >
                      <CardHeader className="px-1 pt-2 pb-1 flex-row justify-start items-baseline">
                        <span className="text-greyscale-400 text-sm mr-1">{`No.`}</span>
                        <span className="text-secondary text-xl font-bold mr-2">{String(action.head.id)}</span>
                        <span className="font-bold text-greyscale-800">{`${action.body.title}`}</span>
                      </CardHeader>
                      <CardContent className="px-1 pt-1 pb-2">
                        <div className="flex justify-between mt-1 text-sm">
                          {/* <span className="flex items-center">
                            <UserPen className="text-greyscale-400 mr-1 h-3 w-3" />
                            <span className="text-greyscale-400">
                              <AddressWithCopyButton
                                address={action.head.author as `0x${string}`}
                                showCopyButton={false}
                              />
                            </span>
                          </span> */}
                          <span>
                            <span className="text-greyscale-400 mr-1">投票数</span>
                            <span className="text-secondary">{formatTokenAmount(votingAction.votesNum)}</span>
                          </span>
                        </div>
                        <div className="flex justify-between gap-0 mt-1 text-sm">
                          <span>
                            <span className="text-greyscale-400 mr-1">占已投票</span>
                            <span className="text-secondary">
                              {totalVotes === BigInt(0)
                                ? '-'
                                : formatPercentage((Number(votingAction.votesNum) * 100) / Number(totalVotes))}
                            </span>
                          </span>
                          <span>
                            <span className={`${isBelowMinThreshold ? 'text-red-500' : 'text-secondary'} mr-1`}>
                              占总治理票
                            </span>
                            <span className={isBelowMinThreshold ? 'text-red-500' : 'text-secondary'}>
                              {!govData?.govVotes || govData.govVotes === BigInt(0)
                                ? '-'
                                : formatPercentage(govPercentage)}
                            </span>
                          </span>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                );
              })}
            <div className="flex justify-center mt-4">
              <Button variant="outline" className="w-1/2 text-secondary border-secondary" onClick={handleSubmit}>
                给选中的行动投票
              </Button>
            </div>
            <div className="mt-2 text-sm text-greyscale-500 text-center">提示: 每轮最大可投票数，等于您的治理票数</div>
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

export default StepSelectActions;
