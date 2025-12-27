import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatTokenAmount, formatRoundForDisplay } from '@/src/lib/format';
import toast from 'react-hot-toast';

// 导入铸造 hooks
import { useMintActionReward } from '@/src/hooks/contracts/useLOVE20Mint';
import { useClaimRewardFromExtension } from '@/src/hooks/extension/base/contracts';

/**
 * 激励数据结构（兼容普通和扩展）
 */
export interface RewardItem {
  round: bigint;
  reward: bigint;
  isMinted: boolean;
}

/**
 * 统一的行动激励列表组件属性
 */
export interface ActionRewardsListProps {
  /** 激励数据列表 */
  rewards: RewardItem[];
  /** Token 地址（普通行动需要） */
  tokenAddress?: `0x${string}`;
  /** 行动 ID（普通行动需要） */
  actionId?: bigint;
  /** 扩展合约地址（扩展行动需要） */
  extensionAddress?: `0x${string}`;
  /** Token 数据（用于格式化显示） */
  tokenData: any;
  /** 是否为扩展行动 */
  isExtension?: boolean;
  /** 铸造开始回调 */
  onMintStart?: () => void;
  /** 铸造结束回调（成功或失败） */
  onMintEnd?: () => void;
  /** 铸造成功回调 */
  onMintSuccess?: (round: bigint) => void;
  /** 是否显示标题 */
  showTitle?: boolean;
  /** 自定义标题 */
  title?: string;
  /** 是否正在加载 */
  isLoading?: boolean;
  /** 外部传入的 pending 状态（用于共享铸造状态） */
  externalIsPending?: boolean;
  /** 外部传入的 confirming 状态（用于共享铸造状态） */
  externalIsConfirming?: boolean;
}

/**
 * 统一的行动激励列表组件
 *
 * 功能：
 * 1. 支持普通行动和扩展行动的激励展示
 * 2. 根据行动类型自动选择对应的铸造方法
 * 3. 统一的 UI 展示和交互逻辑
 *
 * 使用场景：
 * - 普通行动：传入 tokenAddress 和 actionId，isExtension=false
 * - 扩展行动：传入 extensionAddress，isExtension=true
 */
export const ActionRewardsList: React.FC<ActionRewardsListProps> = ({
  rewards,
  tokenAddress,
  actionId,
  extensionAddress,
  tokenData,
  isExtension = false,
  onMintStart,
  onMintEnd,
  onMintSuccess,
  showTitle = false,
  title,
  isLoading = false,
  externalIsPending,
  externalIsConfirming,
}) => {
  // ========== 普通行动铸造 Hook ==========
  const {
    mintActionReward,
    isPending: corePending,
    isConfirming: coreConfirming,
    isConfirmed: coreConfirmed,
    hash: coreHash,
  } = useMintActionReward();

  // ========== 扩展行动铸造 Hook ==========
  const {
    claimReward: extensionClaimReward,
    isPending: extensionPending,
    isConfirming: extensionConfirming,
    isConfirmed: extensionConfirmed,
    hash: extensionHash,
  } = useClaimRewardFromExtension(extensionAddress);

  // ========== 统一状态管理 ==========
  const [mintingTarget, setMintingTarget] = useState<bigint | null>(null);
  const [locallyMinted, setLocallyMinted] = useState<Set<string>>(new Set());
  const [mintingHash, setMintingHash] = useState<`0x${string}` | undefined>(undefined);

  // 使用外部状态或内部状态
  const isPending = externalIsPending !== undefined ? externalIsPending : isExtension ? extensionPending : corePending;
  const isConfirming =
    externalIsConfirming !== undefined ? externalIsConfirming : isExtension ? extensionConfirming : coreConfirming;
  const isConfirmed = isExtension ? extensionConfirmed : coreConfirmed;
  const hash = isExtension ? extensionHash : coreHash;

  // ========== 铸造成功处理 ==========
  useEffect(() => {
    // 增加 hash 匹配检查：只有当前交易的 hash 匹配时才处理
    if (isConfirmed && mintingTarget !== null && hash && hash === mintingHash) {
      toast.success('铸造成功');
      // 更新本地已铸造状态
      setLocallyMinted((prev) => new Set(prev).add(mintingTarget.toString()));
      // 通知父组件铸造成功
      if (onMintSuccess) {
        onMintSuccess(mintingTarget);
      }
      // 通知父组件铸造结束
      if (onMintEnd) {
        onMintEnd();
      }
      // 清空状态
      setMintingTarget(null);
      setMintingHash(undefined);
    }
  }, [isConfirmed, mintingTarget, hash, mintingHash, onMintSuccess, onMintEnd]);

  // ========== 铸造处理函数 ==========
  const handleMint = async (round: bigint) => {
    setMintingTarget(round);

    // 通知父组件铸造开始
    if (onMintStart) {
      onMintStart();
    }

    try {
      let txHash: `0x${string}` | undefined;

      if (isExtension) {
        // 扩展行动：使用 claimReward
        if (!extensionAddress) {
          toast.error('扩展合约地址未提供');
          setMintingTarget(null);
          if (onMintEnd) {
            onMintEnd();
          }
          return;
        }
        txHash = await extensionClaimReward(round);
      } else {
        // 普通行动：使用 mintActionReward
        if (!tokenAddress) {
          toast.error('Token 地址或行动 ID 未提供');
          setMintingTarget(null);
          if (onMintEnd) {
            onMintEnd();
          }
          return;
        }
        txHash = await mintActionReward(tokenAddress, round, actionId ?? BigInt(0));
      }

      // 记录当前交易的 hash
      if (txHash) {
        setMintingHash(txHash);
      }
    } catch (error) {
      console.error('铸造失败:', error);
      setMintingTarget(null);
      setMintingHash(undefined);
      // 通知父组件铸造结束
      if (onMintEnd) {
        onMintEnd();
      }
    }
  };

  // ========== 渲染 ==========
  if (rewards.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="mb-4">
      {showTitle && (
        <div className="text-sm text-greyscale-600 mb-2">{title || (isExtension ? '扩展激励' : '普通激励')}</div>
      )}
      <table className="table w-full table-auto">
        <thead>
          <tr className="border-b border-gray-100">
            <th>轮次</th>
            <th className="text-center">可铸造激励</th>
            <th className="text-center">结果</th>
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
