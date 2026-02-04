import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatTokenAmount, formatRoundForDisplay } from '@/src/lib/format';
import toast from 'react-hot-toast';

// 导入铸造 hooks
import { useClaimReward } from '@/src/hooks/extension/base/contracts/useIReward';

/**
 * 激励数据结构
 */
export interface RewardItem {
  round: bigint;
  /** 铸造激励 */
  mintReward: bigint;
  /** 销毁激励 */
  burnReward: bigint;
  /** 是否已领取 */
  claimed: boolean;
}

/**
 * 链群服务行动激励列表组件属性
 */
export interface GroupServiceRewardsListProps {
  /** 激励数据列表 */
  rewards: RewardItem[];
  /** 扩展合约地址 */
  extensionAddress: `0x${string}`;
  /** Token 数据（用于格式化显示） */
  tokenData: any;
  /** 行动ID（用于构建跳转链接） */
  actionId: bigint;
  /** Token 符号（用于构建跳转链接） */
  tokenSymbol: string;
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
 * 链群服务行动激励列表组件
 *
 * 显示列：轮次、溢出激励、可铸造激励（可点击跳转到公示页）、操作
 */
export const GroupServiceRewardsList: React.FC<GroupServiceRewardsListProps> = ({
  rewards,
  extensionAddress,
  tokenData,
  actionId,
  tokenSymbol,
  onMintStart,
  onMintEnd,
  onMintSuccess,
  isLoading = false,
}) => {
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

  // ========== 构建跳转链接 ==========
  const buildPublicLink = (round: bigint) => {
    return `/action/info/?id=${actionId}&symbol=${tokenSymbol}&tab=public&round=${round}`;
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
            <th className="text-center">溢出激励</th>
            <th className="text-center">可铸造激励</th>
            <th className="text-center">操作</th>
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
              const isLocallyClaimed = locallyMinted.has(item.round.toString());
              const displayClaimed = isLocallyClaimed || item.claimed;
              // 溢出激励 = burnReward，可铸造激励 = mintReward
              const burnReward = item.burnReward || BigInt(0);
              const mintReward = item.mintReward || BigInt(0);

              return (
                <tr
                  key={`reward-${item.round.toString()}`}
                  className={index === rewards.length - 1 ? 'border-none' : 'border-b border-gray-100'}
                >
                  <td>{formatRoundForDisplay(item.round, tokenData).toString()}</td>
                  {/* 溢出激励 = burnReward */}
                  <td className="text-center">
                    <Link href={buildPublicLink(item.round)} className="text-secondary underline hover:opacity-70">
                      {formatTokenAmount(burnReward)}
                    </Link>
                  </td>
                  {/* 可铸造激励 = mintReward */}
                  <td className="text-center">
                    <Link href={buildPublicLink(item.round)} className="text-secondary underline hover:opacity-70">
                      {formatTokenAmount(mintReward)}
                    </Link>
                  </td>
                  <td className="text-center">
                    {mintReward > BigInt(0) && !displayClaimed ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-secondary border-secondary"
                        onClick={() => handleMint(item.round)}
                        disabled={isPending || isConfirming}
                      >
                        铸造
                      </Button>
                    ) : displayClaimed ? (
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
