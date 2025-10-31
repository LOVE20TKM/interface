import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useClaimReward } from '@/src/hooks/contracts/useLOVE20ExtensionStakeLp';
import { ExtensionActionReward } from '@/src/hooks/composite/useExtensionActionRewardsByRounds';
import { formatTokenAmount, formatRoundForDisplay } from '@/src/lib/format';
import toast from 'react-hot-toast';

const EXTENSION_FACTORY_STAKELP = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_STAKELP as `0x${string}`;

export interface ExtensionRewardsListProps {
  extensionAddress: `0x${string}`;
  factoryAddress: `0x${string}`;
  rewards: ExtensionActionReward[];
  tokenData: any;
  onMintSuccess?: (round: bigint) => void;
  isLoading?: boolean;
}

/**
 * 扩展行动激励列表组件
 *
 * 功能：
 * 1. 根据扩展类型展示不同的激励列表
 * 2. 提供对应的领取操作
 * 3. 易于扩展：新增扩展类型时只需添加新的渲染分支
 */
export const ExtensionRewardsList: React.FC<ExtensionRewardsListProps> = ({
  extensionAddress,
  factoryAddress,
  rewards,
  tokenData,
  onMintSuccess,
  isLoading = false,
}) => {
  // 判断扩展类型
  const extensionType = React.useMemo(() => {
    if (factoryAddress.toLowerCase() === EXTENSION_FACTORY_STAKELP?.toLowerCase()) {
      return 'STAKE_LP';
    }
    // 未来可以在这里添加其他扩展类型的判断
    return 'UNKNOWN';
  }, [factoryAddress]);

  // 根据扩展类型渲染不同的组件
  switch (extensionType) {
    case 'STAKE_LP':
      return (
        <StakeLpExtensionRewardsList
          extensionAddress={extensionAddress}
          rewards={rewards}
          tokenData={tokenData}
          onMintSuccess={onMintSuccess}
          isLoading={isLoading}
        />
      );

    // 未来可以在这里添加其他扩展类型的渲染逻辑
    // case 'OTHER_TYPE':
    //   return <OtherTypeExtensionRewardsList ... />;

    default:
      return <div className="text-center text-greyscale-500 py-4">未知的扩展类型，无法展示激励</div>;
  }
};

/**
 * 质押LP扩展行动激励列表子组件
 */
interface StakeLpExtensionRewardsListProps {
  extensionAddress: `0x${string}`;
  rewards: ExtensionActionReward[];
  tokenData: any;
  onMintSuccess?: (round: bigint) => void;
  isLoading?: boolean;
}

const StakeLpExtensionRewardsList: React.FC<StakeLpExtensionRewardsListProps> = ({
  extensionAddress,
  rewards,
  tokenData,
  onMintSuccess,
  isLoading = false,
}) => {
  const { claimReward, isPending, isConfirming, isConfirmed, writeError } = useClaimReward(extensionAddress);

  const [mintingTarget, setMintingTarget] = useState<bigint | null>(null);
  const [locallyMinted, setLocallyMinted] = useState<Set<string>>(new Set());

  // 处理领取成功
  useEffect(() => {
    if (isConfirmed && mintingTarget !== null) {
      toast.success('领取成功');
      // 更新本地已领取状态
      setLocallyMinted((prev) => new Set(prev).add(mintingTarget.toString()));
      // 通知父组件
      if (onMintSuccess) {
        onMintSuccess(mintingTarget);
      }
      setMintingTarget(null);
    }
  }, [isConfirmed, mintingTarget, onMintSuccess]);

  const handleClaim = async (round: bigint) => {
    setMintingTarget(round);
    await claimReward(round);
  };

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
        {rewards.length === 0 && !isLoading ? (
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
                key={`${extensionAddress}-${item.round.toString()}`}
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
          })
        )}
      </tbody>
    </table>
  );
};

/**
 * 未来可以在这里添加其他扩展类型的子组件
 *
 * 例如：
 * const OtherTypeExtensionRewardsList: React.FC<OtherTypeExtensionRewardsListProps> = ({ ... }) => {
 *   // 实现其他扩展类型的激励列表展示
 * };
 */
