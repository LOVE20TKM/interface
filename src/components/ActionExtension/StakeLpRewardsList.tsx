import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useClaimReward } from '@/src/hooks/contracts/useLOVE20ExtensionStakeLp';
import { StakeLpReward } from '@/src/hooks/composite/useStakeLpRewardsByLastRounds';
import { formatTokenAmount, formatRoundForDisplay } from '@/src/lib/format';
import toast from 'react-hot-toast';

export interface StakeLpRewardsListProps {
  extensionAddress: `0x${string}`;
  rewards: StakeLpReward[];
  tokenData: any; // TokenInfo from context
  locallyMinted: Set<string>;
  onMintSuccess: (extensionAddress: string, round: string) => void;
}

/**
 * 质押LP扩展行动激励列表组件
 *
 * 功能：
 * 1. 展示质押LP行动的激励列表
 * 2. 提供领取（claimReward）操作
 * 3. 处理本地已领取状态
 */
export const StakeLpRewardsList: React.FC<StakeLpRewardsListProps> = ({
  extensionAddress,
  rewards,
  tokenData,
  locallyMinted,
  onMintSuccess,
}) => {
  const { claimReward, isPending, isConfirming, isConfirmed, writeError } = useClaimReward(extensionAddress);

  const [currentMintingRound, setCurrentMintingRound] = useState<bigint | null>(null);

  // 处理领取成功
  useEffect(() => {
    if (isConfirmed && currentMintingRound !== null) {
      toast.success('领取成功');
      onMintSuccess(extensionAddress, currentMintingRound.toString());
      setCurrentMintingRound(null);
    }
  }, [isConfirmed, currentMintingRound, extensionAddress, onMintSuccess]);

  const handleClaim = async (round: bigint) => {
    setCurrentMintingRound(round);
    await claimReward(round);
  };

  if (rewards.length === 0) {
    return null;
  }

  return (
    <table className="table w-full table-auto">
      <thead>
        <tr className="border-b border-gray-100">
          <th>轮次</th>
          <th className="text-center">可铸造激励</th>
          <th className="text-center">结果</th>
        </tr>
      </thead>
      <tbody>
        {rewards.map((item, index) => {
          const key = `${extensionAddress}-${item.round.toString()}`;
          const isLocallyMinted = locallyMinted.has(key);
          const displayIsMinted = isLocallyMinted || item.isMinted;

          return (
            <tr key={key} className={index === rewards.length - 1 ? 'border-none' : 'border-b border-gray-100'}>
              <td>{formatRoundForDisplay(item.round, tokenData).toString()}</td>
              <td className="text-center">{formatTokenAmount(item.reward || BigInt(0))}</td>
              <td className="text-center">
                {item.reward > BigInt(0) && !displayIsMinted ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-secondary border-secondary"
                    onClick={() => handleClaim(item.round)}
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
        })}
      </tbody>
    </table>
  );
};
