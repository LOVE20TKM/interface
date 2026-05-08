import React, { useContext } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatTokenAmount, formatRoundForDisplay } from '@/src/lib/format';
import { TokenContext } from '@/src/contexts/TokenContext';

// 导入铸造 hooks
import { useClaimReward, useClaimRewards } from '@/src/hooks/extension/base/contracts/useIReward';
import {
  BatchMintControls,
  BatchSelectionCell,
  useRewardMinting,
} from '@/src/components/Extension/Plugins/common/rewardMinting';

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
 * LP行动激励列表组件属性
 */
export interface LpActionRewardsListProps {
  /** 激励数据列表 */
  rewards: RewardItem[];
  /** 扩展合约地址 */
  extensionAddress: `0x${string}`;
  /** Token 数据（用于格式化显示） */
  tokenData: any;
  /** 行动 ID（用于跳转） */
  actionId?: bigint;
  /** 铸造开始回调 */
  onMintStart?: (message?: string) => void;
  /** 铸造结束回调 */
  onMintEnd?: () => void;
  /** 铸造成功回调 */
  onMintSuccess?: (round: bigint) => void;
  /** 批量铸造成功回调 */
  onBatchMintSuccess?: (rounds: bigint[]) => void;
  /** 是否启用批量铸造 */
  enableBatchMint?: boolean;
  /** 是否正在加载 */
  isLoading?: boolean;
}

/**
 * LP行动激励列表组件
 *
 * 显示列：轮次、溢出激励、可铸造激励、结果
 */
export const LpActionRewardsList: React.FC<LpActionRewardsListProps> = ({
  rewards,
  extensionAddress,
  tokenData,
  actionId,
  onMintStart,
  onMintEnd,
  onMintSuccess,
  onBatchMintSuccess,
  enableBatchMint = false,
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
    writeError,
  } = useClaimReward(extensionAddress);
  const {
    claimRewards: extensionClaimRewards,
    isPending: isBatchPending,
    isConfirming: isBatchConfirming,
    isConfirmed: isBatchConfirmed,
    hash: batchHash,
    writeError: batchWriteError,
  } = useClaimRewards(extensionAddress);

  const {
    columnCount,
    selectedRoundKeys,
    selectedClaimableRounds,
    allClaimableSelected,
    isMintBusy,
    isSelectAllDisabled,
    isBatchMintDisabled,
    handleMint,
    handleBatchMint,
    toggleAllClaimable,
    toggleRoundSelection,
    isRewardClaimed,
    isRewardClaimable,
  } = useRewardMinting({
    rewards,
    enableBatchMint,
    singleTx: { isPending, isConfirming, isConfirmed, hash, error: writeError },
    batchTx: {
      isPending: isBatchPending,
      isConfirming: isBatchConfirming,
      isConfirmed: isBatchConfirmed,
      hash: batchHash,
      error: batchWriteError,
    },
    claimReward: extensionClaimReward,
    claimRewards: extensionClaimRewards,
    onMintStart,
    onMintEnd,
    onMintSuccess,
    onBatchMintSuccess,
  });

  // ========== 渲染 ==========
  if (rewards.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="mb-4">
      <BatchMintControls
        enabled={enableBatchMint}
        isSelectAllDisabled={isSelectAllDisabled}
        isBatchMintDisabled={isBatchMintDisabled}
        allClaimableSelected={allClaimableSelected}
        selectedCount={selectedClaimableRounds.length}
        onToggleAll={toggleAllClaimable}
        onBatchMint={handleBatchMint}
      />
      <table className="table w-full table-auto">
        <thead>
          <tr className="border-b border-gray-100">
            {enableBatchMint && <th className="w-10 text-center">选择</th>}
            <th>轮次</th>
            <th className="text-center">溢出激励</th>
            <th className="text-center">可铸造激励</th>
            <th className="text-center">结果</th>
          </tr>
        </thead>
        <tbody>
          {rewards.length === 0 && isLoading ? (
            <tr>
              <td colSpan={columnCount} className="text-center text-sm text-gray-500 py-4">
                加载中...
              </td>
            </tr>
          ) : rewards.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="text-center text-sm text-gray-500 py-4">
                该行动在指定轮次范围内没有获得激励
              </td>
            </tr>
          ) : (
            rewards.map((item, index) => {
              const displayClaimed = isRewardClaimed(item);
              // 溢出激励 = burnReward，可铸造激励 = mintReward
              const burnReward = item.burnReward || BigInt(0);
              const mintReward = item.mintReward || BigInt(0);

              // 判断是否可以跳转（需要 actionId 和 token symbol）
              const canNavigate =
                actionId !== undefined && token?.symbol && typeof token.symbol === 'string' && token.symbol.length > 0;

              // 构建跳转链接
              const rewardHref = canNavigate
                ? `/action/info/?symbol=${
                    token.symbol
                  }&id=${actionId.toString()}&tab=public&tab2=history&round=${item.round.toString()}`
                : undefined;

              return (
                <tr
                  key={`reward-${item.round.toString()}`}
                  className={index === rewards.length - 1 ? 'border-none' : 'border-b border-gray-100'}
                >
                  {enableBatchMint && (
                    <BatchSelectionCell
                      isClaimable={isRewardClaimable(item)}
                      checked={selectedRoundKeys.has(item.round.toString())}
                      disabled={isMintBusy}
                      onChange={(checked) => toggleRoundSelection(item.round, checked)}
                    />
                  )}
                  <td>{formatRoundForDisplay(item.round, tokenData).toString()}</td>
                  {/* 溢出激励 = burnReward */}
                  <td className="text-center">
                    {rewardHref ? (
                      <Link
                        href={rewardHref}
                        className="text-secondary hover:text-secondary/80 underline underline-offset-2"
                      >
                        {formatTokenAmount(burnReward)}
                      </Link>
                    ) : (
                      formatTokenAmount(burnReward)
                    )}
                  </td>
                  {/* 可铸造激励 = mintReward */}
                  <td className="text-center">
                    {rewardHref ? (
                      <Link
                        href={rewardHref}
                        className="text-secondary hover:text-secondary/80 underline underline-offset-2"
                      >
                        {formatTokenAmount(mintReward)}
                      </Link>
                    ) : (
                      formatTokenAmount(mintReward)
                    )}
                  </td>
                  <td className="text-center">
                    {mintReward > BigInt(0) && !displayClaimed ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-secondary border-secondary"
                        onClick={() => handleMint(item.round)}
                        disabled={isMintBusy}
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
