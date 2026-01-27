import React, { useEffect, useState, useMemo, useContext } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatTokenAmount, formatRoundForDisplay } from '@/src/lib/format';
import toast from 'react-hot-toast';
import { TokenContext } from '@/src/contexts/TokenContext';

// 导入铸造 hooks
import { useClaimReward } from '@/src/hooks/extension/base/contracts/useIReward';
// 导入额外数据 hook
import { useGroupActionRewardsExtra } from '@/src/hooks/extension/plugins/group/composite/useGroupActionRewardsExtra';

/**
 * 激励数据结构
 */
export interface RewardItem {
  round: bigint;
  reward: bigint;
  isMinted: boolean;
}

/**
 * 链群行动激励列表组件属性
 */
export interface GroupActionRewardsListProps {
  /** 激励数据列表 */
  rewards: RewardItem[];
  /** 扩展合约地址 */
  extensionAddress: `0x${string}`;
  /** Token 数据（用于格式化显示） */
  tokenData: any;
  /** 行动 ID（用于跳转） */
  actionId?: bigint;
  /** 铸造开始回调 */
  onMintStart?: () => void;
  /** 铸造结束回调 */
  onMintEnd?: () => void;
  /** 铸造成功回调 */
  onMintSuccess?: (round: bigint) => void;
  /** 是否正在加载 */
  isLoading?: boolean;
}

/**
 * 链群行动激励列表组件
 *
 * 显示列：轮次、得分、可铸造激励、结果
 */
export const GroupActionRewardsList: React.FC<GroupActionRewardsListProps> = ({
  rewards,
  extensionAddress,
  tokenData,
  actionId,
  onMintStart,
  onMintEnd,
  onMintSuccess,
  isLoading = false,
}) => {
  const { token } = useContext(TokenContext) || {};

  // ========== 铸造 Hook ==========
  const {
    claimReward: extensionClaimReward,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  } = useClaimReward(extensionAddress);

  // ========== 状态管理 ==========
  const [mintingTarget, setMintingTarget] = useState<bigint | null>(null);
  const [locallyMinted, setLocallyMinted] = useState<Set<string>>(new Set());
  const [mintingHash, setMintingHash] = useState<`0x${string}` | undefined>(undefined);

  // ========== 获取额外数据（得分和链群ID）==========
  const rounds = useMemo(() => rewards.map((r) => r.round), [rewards]);

  const {
    scoreMap,
    groupIdMap,
    isPending: isScorePending,
  } = useGroupActionRewardsExtra({
    extensionAddress,
    rounds,
    enabled: rewards.length > 0,
  });

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
      const txHash = await extensionClaimReward(round);
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
            <th className="text-center">得分</th>
            <th className="text-center">可铸造激励</th>
            <th className="text-center">结果</th>
          </tr>
        </thead>
        <tbody>
          {rewards.length === 0 && isLoading ? (
            <tr>
              <td colSpan={4} className="text-center text-sm text-gray-500 py-4">
                加载中...
              </td>
            </tr>
          ) : rewards.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-sm text-gray-500 py-4">
                该行动在指定轮次范围内没有获得激励
              </td>
            </tr>
          ) : (
            rewards.map((item, index) => {
              const isLocallyMinted = locallyMinted.has(item.round.toString());
              const displayIsMinted = isLocallyMinted || item.isMinted;
              const score = scoreMap.get(item.round.toString());
              const groupId = groupIdMap.get(item.round.toString());

              // 判断是否可以跳转（需要 actionId、groupId 和 token symbol）
              const canNavigate =
                actionId !== undefined &&
                groupId !== undefined &&
                groupId > BigInt(0) &&
                token?.symbol &&
                typeof token.symbol === 'string' &&
                token.symbol.length > 0;

              // 构建跳转链接
              const rewardHref = canNavigate
                ? `/extension/group/?groupId=${groupId.toString()}&actionId=${actionId.toString()}&symbol=${
                    token.symbol
                  }&tab=rewards&round=${item.round.toString()}`
                : undefined;

              return (
                <tr
                  key={`reward-${item.round.toString()}`}
                  className={index === rewards.length - 1 ? 'border-none' : 'border-b border-gray-100'}
                >
                  <td>{item.round.toString()}</td>
                  <td className="text-center">
                    {isScorePending ? (
                      <span className="text-greyscale-400">...</span>
                    ) : score !== undefined ? (
                      score.toString()
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="text-center">
                    {rewardHref ? (
                      <Link
                        href={rewardHref}
                        className="text-secondary hover:text-secondary/80 underline underline-offset-2"
                      >
                        {formatTokenAmount(item.reward || BigInt(0))}
                      </Link>
                    ) : (
                      formatTokenAmount(item.reward || BigInt(0))
                    )}
                  </td>
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
