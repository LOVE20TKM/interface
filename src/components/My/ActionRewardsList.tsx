import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatTokenAmount, formatRoundForDisplay } from '@/src/lib/format';
import toast from 'react-hot-toast';

// 导入铸造 hooks
import { useMintActionReward } from '@/src/hooks/contracts/useLOVE20Mint';

/**
 * 激励数据结构
 */
export interface RewardItem {
  round: bigint;
  reward: bigint;
  isMinted: boolean;
}

/**
 * 普通行动激励列表组件属性
 */
export interface ActionRewardsListProps {
  /** 激励数据列表 */
  rewards: RewardItem[];
  /** Token 地址 */
  tokenAddress: `0x${string}`;
  /** 行动 ID */
  actionId: bigint;
  /** Token 数据（用于格式化显示） */
  tokenData: any;
  /** 铸造开始回调 */
  onMintStart?: () => void;
  /** 铸造结束回调（成功或失败） */
  onMintEnd?: () => void;
  /** 铸造成功回调 */
  onMintSuccess?: (round: bigint) => void;
  /** 是否正在加载 */
  isLoading?: boolean;
}

/**
 * 普通行动激励列表组件
 *
 * 功能：
 * 1. 展示普通行动的激励列表
 * 2. 支持铸造激励
 *
 * 注意：扩展行动请使用专有组件：
 * - 链群行动：GroupActionRewardsList
 * - LP行动：LpActionRewardsList
 * - 链群服务：GroupServiceRewardsList
 */
export const ActionRewardsList: React.FC<ActionRewardsListProps> = ({
  rewards,
  tokenAddress,
  actionId,
  tokenData,
  onMintStart,
  onMintEnd,
  onMintSuccess,
  isLoading = false,
}) => {
  // ========== 铸造 Hook ==========
  const { mintActionReward, isPending, isConfirming, isConfirmed, hash } = useMintActionReward();

  // ========== 状态管理 ==========
  const [mintingTarget, setMintingTarget] = useState<bigint | null>(null);
  const [locallyMinted, setLocallyMinted] = useState<Set<string>>(new Set());
  const [mintingHash, setMintingHash] = useState<`0x${string}` | undefined>(undefined);

  // ========== 铸造成功处理 ==========
  useEffect(() => {
    if (isConfirmed && mintingTarget !== null && hash && hash === mintingHash) {
      toast.success('铸造成功');
      setLocallyMinted((prev) => new Set(prev).add(mintingTarget.toString()));
      onMintSuccess?.(mintingTarget);
      onMintEnd?.();
      setMintingTarget(null);
      setMintingHash(undefined);
    }
  }, [isConfirmed, mintingTarget, hash, mintingHash, onMintSuccess, onMintEnd]);

  // ========== 铸造处理函数 ==========
  const handleMint = async (round: bigint) => {
    setMintingTarget(round);
    onMintStart?.();

    try {
      const txHash = await mintActionReward(tokenAddress, round, actionId);
      if (txHash) {
        setMintingHash(txHash);
      }
    } catch (error) {
      console.error('铸造失败:', error);
      setMintingTarget(null);
      setMintingHash(undefined);
      onMintEnd?.();
    }
  };

  // ========== 渲染 ==========
  if (rewards.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="mb-4">
      <table className="table w-full table-auto">
        <thead>
          <tr className="border-b border-gray-100">
            <th>轮次</th>
            <th className="text-center">可铸造激励</th>
            <th className="text-center">操作</th>
          </tr>
        </thead>
        <tbody>
          {rewards.length === 0 && isLoading ? (
            <tr>
              <td colSpan={3} className="text-center text-sm text-gray-500 py-4">
                加载中...
              </td>
            </tr>
          ) : rewards.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center text-sm text-gray-500 py-4">
                该行动在指定轮次范围内没有获得激励
              </td>
            </tr>
          ) : (
            rewards.map((item, index) => {
              const isLocallyMinted = locallyMinted.has(item.round.toString());
              const displayIsMinted = isLocallyMinted || item.isMinted;

              return (
                <tr
                  key={`reward-${item.round.toString()}`}
                  className={index === rewards.length - 1 ? 'border-none' : 'border-b border-gray-100'}
                >
                  <td>{formatRoundForDisplay(item.round, tokenData).toString()}</td>
                  <td className="text-center">{formatTokenAmount(item.reward || BigInt(0))}</td>
                  <td className="text-center">
                    {item.reward > BigInt(0) && !displayIsMinted ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-secondary border-secondary"
                        onClick={() => handleMint(item.round)}
                        disabled={isPending || isConfirming}
                      >
                        铸造
                      </Button>
                    ) : displayIsMinted ? (
                      <span className="text-greyscale-500">已铸造</span>
                    ) : (
                      <span className="text-greyscale-500">-</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
