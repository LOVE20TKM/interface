import React from 'react';
import { Button } from '@/components/ui/button';
import { ActionReward } from '@/src/types/love20types';
import { formatTokenAmount, formatRoundForDisplay } from '@/src/lib/format';

export interface CoreRewardsListProps {
  rewards: ActionReward[];
  actionId: bigint;
  tokenData: any;
  showTitle?: boolean;
  isPending: boolean;
  isConfirming: boolean;
  onClaim: (round: bigint, actionId: bigint) => void;
}

/**
 * 普通行动激励列表组件
 *
 * 功能：
 * 1. 展示普通行动的激励列表
 * 2. 提供铸造（mintActionReward）操作
 * 3. 显示已铸造状态
 */
export const CoreRewardsList: React.FC<CoreRewardsListProps> = ({
  rewards,
  actionId,
  tokenData,
  showTitle = false,
  isPending,
  isConfirming,
  onClaim,
}) => {
  if (rewards.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      {showTitle && <div className="text-sm text-greyscale-600 mb-2">普通激励</div>}
      <table className="table w-full table-auto">
        <thead>
          <tr className="border-b border-gray-100">
            <th>轮次</th>
            <th className="text-center">可铸造激励</th>
            <th className="text-center">结果</th>
          </tr>
        </thead>
        <tbody>
          {rewards.map((item, index) => (
            <tr
              key={`${actionId.toString()}-${item.round.toString()}`}
              className={index === rewards.length - 1 ? 'border-none' : 'border-b border-gray-100'}
            >
              <td>{formatRoundForDisplay(item.round, tokenData).toString()}</td>
              <td className="text-center">{formatTokenAmount(item.reward || BigInt(0))}</td>
              <td className="text-center">
                {item.reward > BigInt(0) && !item.isMinted ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-secondary border-secondary"
                    onClick={() => onClaim(item.round, actionId)}
                    disabled={isPending || isConfirming}
                  >
                    铸造
                  </Button>
                ) : item.isMinted ? (
                  <span className="text-greyscale-500">已铸造</span>
                ) : (
                  <span className="text-greyscale-500">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
