'use client';

import { useState, useEffect, useContext } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// my hooks
import { useVotesNumByAccount, useVote } from '@/src/hooks/contracts/useLOVE20Vote';
import { useValidGovVotes } from '@/src/hooks/contracts/useLOVE20Stake';
import { useActionInfosByIds } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my types
import { ActionInfo } from '@/src/types/love20types';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import RemainingVotesDisplay from './RemainingVotesDisplay';

/**
 * 步骤2: 投票提交
 */
export interface StepVoteSubmitProps {
  selectedIds: bigint[];
  currentRound: bigint;
  onBack: () => void;
  onSuccess: () => void;
}

const StepVoteSubmit: React.FC<StepVoteSubmitProps> = ({ selectedIds, currentRound, onBack, onSuccess }) => {
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();
  const [percentages, setPercentages] = useState<{ [key: string]: number }>({});

  // 初始化百分比
  useEffect(() => {
    if (selectedIds.length > 0 && Object.keys(percentages).length === 0) {
      if (selectedIds.length === 1) {
        setPercentages({ [selectedIds[0].toString()]: 100 });
      } else {
        const initialPercentages: { [key: string]: number } = {};
        const equalPercentage = Math.floor(100 / selectedIds.length);
        selectedIds.forEach((id, index) => {
          if (index === selectedIds.length - 1) {
            initialPercentages[id.toString()] = 100 - equalPercentage * (selectedIds.length - 1);
          } else {
            initialPercentages[id.toString()] = equalPercentage;
          }
        });
        setPercentages(initialPercentages);
      }
    }
  }, [selectedIds, percentages]);

  // 处理百分比变化
  const handlePercentageChange = (actionId: string, value: number) => {
    if (selectedIds.length === 1) {
      setPercentages({ [actionId]: value });
      return;
    }

    const updatedPercentages = { ...percentages, [actionId]: value };
    const otherIds = selectedIds.slice(0, -1).map((id) => id.toString());
    const total = otherIds.reduce((sum, id) => sum + (updatedPercentages[id] || 0), 0);

    if (total > 100) {
      toast.error('投票百分比之和不能超过100%');
      return;
    }

    const lastId = selectedIds[selectedIds.length - 1].toString();
    updatedPercentages[lastId] = 100 - total;

    setPercentages(updatedPercentages);
  };

  // 获取剩余票数
  const {
    validGovVotes,
    isPending: isPendingValidGovVotes,
    error: errorValidGovVotes,
  } = useValidGovVotes(token?.address as `0x${string}`, account as `0x${string}`);

  const {
    votesNumByAccount,
    isPending: isPendingVotesNumByAccount,
    error: errorVotesNumByAccount,
  } = useVotesNumByAccount(token?.address as `0x${string}`, currentRound, account as `0x${string}`);

  // 获取行动列表
  const {
    actionInfos,
    isPending: isPendingActionInfosByIds,
    error: errorActionInfosByIds,
  } = useActionInfosByIds(token?.address as `0x${string}`, selectedIds);

  // 提交投票
  const { vote, isPending, isConfirming, isConfirmed, writeError: submitVoteError } = useVote();

  // 检查输入
  const checkInput = () => {
    if (validGovVotes - votesNumByAccount < BigInt(2)) {
      toast.error('剩余票数不足，不能投票');
      return false;
    }

    const totalPercentage = Object.values(percentages).reduce((sum, percentage) => sum + percentage, 0);
    if (selectedIds.length > 1 && totalPercentage !== 100) {
      toast.error('百分比之和必须为100');
      return false;
    }
    return true;
  };

  // 提交投票
  const handleSubmit = async () => {
    if (!checkInput()) {
      return;
    }

    const actionIds = selectedIds;
    const votes = selectedIds.map((id) => {
      const percentage = percentages[id.toString()] || 0;
      return (BigInt(percentage) * (validGovVotes - votesNumByAccount)) / BigInt(100);
    });

    try {
      await vote(token?.address as `0x${string}`, actionIds, votes);
    } catch (error) {
      console.error('投票提交失败:', error);
      toast.error('提交失败，请重试');
    }
  };

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (submitVoteError) {
      handleContractError(submitVoteError, 'vote');
    }
    if (errorVotesNumByAccount) {
      handleContractError(errorVotesNumByAccount, 'vote');
    }
    if (errorActionInfosByIds) {
      handleContractError(errorActionInfosByIds, 'submit');
    }
    if (errorValidGovVotes) {
      handleContractError(errorValidGovVotes, 'stake');
    }
  }, [submitVoteError, errorActionInfosByIds, errorValidGovVotes, errorVotesNumByAccount]);

  // 提交成功
  useEffect(() => {
    if (isConfirmed && !submitVoteError) {
      toast.success('提交成功', {
        duration: 2000,
      });
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }
  }, [isConfirmed, submitVoteError, onSuccess]);

  // 失焦处理
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  if (!token || isPendingActionInfosByIds) {
    return (
      <div className="p-4 flex justify-center items-center">
        <LoadingIcon />
      </div>
    );
  }

  return (
    <>
      <RemainingVotesDisplay
        validGovVotes={validGovVotes}
        votesNumByAccount={votesNumByAccount}
        isPendingValidGovVotes={isPendingValidGovVotes}
        isPendingVotesNumByAccount={isPendingVotesNumByAccount}
        tokenSymbol={token?.symbol}
      />

      <div className="px-0">
        <div className="space-y-4">
          {actionInfos?.map((action: ActionInfo, index: number) => {
            const isLast = index === actionInfos.length - 1;
            const otherIds = selectedIds.slice(0, -1).map((id) => id.toString());
            const total = otherIds.reduce((sum, id) => sum + (percentages[id] || 0), 0);
            const lastValue = 100 - total;

            const displayPercentage =
              selectedIds.length === 1
                ? percentages[action.head.id.toString()] || 100
                : isLast
                ? lastValue
                : percentages[action.head.id.toString()] || 0;

            return (
              <div key={action.head.id} className="p-4 rounded-lg mb-4 flex justify-between items-center">
                <Link href={`/vote/single?id=${action.head.id}&symbol=${token?.symbol}`} className="flex-grow">
                  <div className="font-semibold mb-2">
                    <span className="text-greyscale-400 text-sm mr-1">{`No.${action.head.id}`}</span>
                    <span className="text-greyscale-900">{`${action.body.title}`}</span>
                  </div>
                </Link>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={displayPercentage || ''}
                    onChange={(e) => handlePercentageChange(action.head.id.toString(), Number(e.target.value))}
                    className="p-2 border rounded w-16"
                    disabled={selectedIds.length > 1 && isLast}
                    placeholder=""
                  />
                  %
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <Button
            variant="outline"
            className="w-1/4"
            onClick={onBack}
            disabled={isPending || isConfirming || isConfirmed}
          >
            返回
          </Button>
          <Button
            className="w-1/2 focus:outline-none focus:ring-0"
            onFocus={(e) => e.currentTarget.blur()}
            onClick={handleSubmit}
            disabled={isPending || isConfirming || isConfirmed}
          >
            {isPending ? '提交中...' : isConfirming ? '确认中...' : isConfirmed ? '已提交' : '提交投票'}
          </Button>
        </div>
      </div>

      {/* 投票注意事项 */}
      <div className="flex flex-col w-full p-4 mt-4">
        <div className="bg-gray-100 text-greyscale-500 rounded-lg p-4 mb-8 text-sm">
          <div className="text-base font-bold text-greyscale-700 pb-1">注意：</div>
          <div className="text-sm text-greyscale-500 pb-1">1、每轮最大可投票数，等于您的治理票数；</div>
          <div className="text-sm text-greyscale-500 pb-1">2、前端会帮您自动计算并提交100%票数；</div>
          <div className="text-sm text-greyscale-500 pb-1">
            3、投票时需持有完整数量的质押资产凭证：SL 类(流动性质押)、ST 类(代币质押)。
          </div>
        </div>
      </div>

      <LoadingOverlay isLoading={isPending || isConfirming} text={isPending ? '提交交易...' : '确认交易...'} />
    </>
  );
};

export default StepVoteSubmit;
