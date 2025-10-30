import React from 'react';
import { useRouter } from 'next/router';
import { JoinedAction, ActionReward } from '@/src/types/love20types';
import { ActionExtensionInfo } from '@/src/hooks/composite/useActionsExtensionInfo';
import { StakeLpReward } from '@/src/hooks/composite/useStakeLpRewardsByLastRounds';
import { CoreRewardsList } from './CoreRewardsList';
import { StakeLpRewardsList } from '@/src/components/ActionExtension/StakeLpRewardsList';

const EXTENSION_FACTORY_STAKELP = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_STAKELP as `0x${string}`;

export interface ActionRewardCardProps {
  action: JoinedAction;
  coreRewards: ActionReward[];
  extensionInfo?: ActionExtensionInfo;
  stakeLpRewards?: StakeLpReward[];
  tokenData: any;
  locallyMinted: Set<string>;
  lastRounds: bigint;
  isPending: boolean;
  isConfirming: boolean;
  onClaimCoreReward: (round: bigint, actionId: bigint) => void;
  onExtensionMintSuccess: (extensionAddress: string, round: string) => void;
}

/**
 * 行动激励卡片组件
 *
 * 功能：
 * 1. 展示单个行动的激励信息
 * 2. 支持普通激励和扩展激励
 * 3. 根据扩展类型展示不同的激励组件
 */
export const ActionRewardCard: React.FC<ActionRewardCardProps> = ({
  action,
  coreRewards,
  extensionInfo,
  stakeLpRewards,
  tokenData,
  locallyMinted,
  lastRounds,
  isPending,
  isConfirming,
  onClaimCoreReward,
  onExtensionMintSuccess,
}) => {
  const router = useRouter();

  const isExtension = extensionInfo?.isExtension;
  const isStakeLpExtension =
    isExtension && extensionInfo?.factoryAddress?.toLowerCase() === EXTENSION_FACTORY_STAKELP?.toLowerCase();

  // 判断是否有激励
  const hasRewards = coreRewards.length > 0 || (stakeLpRewards && stakeLpRewards.length > 0);

  // 获取扩展行动的类型名称
  const getExtensionTypeName = (): string => {
    if (!extensionInfo?.isExtension || !extensionInfo.factoryAddress) return '';
    if (extensionInfo.factoryAddress.toLowerCase() === EXTENSION_FACTORY_STAKELP?.toLowerCase()) {
      return '质押LP行动';
    }
    return '扩展行动';
  };

  return (
    <div className="border border-gray-100 rounded-lg p-4 shadow-sm">
      {/* 行动标题 */}
      <div className="flex items-center mb-3">
        <div className="flex items-baseline mr-2">
          <span className="text-greyscale-500">No.</span>
          <span className="text-secondary text-xl font-bold mr-2">{String(action.action.head.id)}</span>
          <span className="font-bold text-greyscale-800">{action.action.body.title}</span>
          {isExtension && (
            <span className="ml-2 text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
              {getExtensionTypeName()}
            </span>
          )}
        </div>
      </div>

      {/* 激励列表 */}
      {hasRewards ? (
        <>
          {/* 普通行动激励 */}
          {coreRewards.length > 0 && (
            <CoreRewardsList
              rewards={coreRewards}
              actionId={action.action.head.id}
              tokenData={tokenData}
              showTitle={isExtension}
              isPending={isPending}
              isConfirming={isConfirming}
              onClaim={onClaimCoreReward}
            />
          )}

          {/* 质押LP扩展激励 */}
          {isStakeLpExtension && extensionInfo?.extensionAddress && stakeLpRewards && (
            <div>
              {coreRewards.length > 0 && <div className="text-sm text-greyscale-600 mb-2">质押LP激励</div>}
              <StakeLpRewardsList
                extensionAddress={extensionInfo.extensionAddress}
                rewards={stakeLpRewards}
                tokenData={tokenData}
                locallyMinted={locallyMinted}
                onMintSuccess={onExtensionMintSuccess}
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-greyscale-500 py-4">该行动最近 {lastRounds.toString()} 轮没有获得激励</div>
      )}

      {/* 查看更多按钮 */}
      <div className="text-center mt-4">
        <button
          onClick={() => router.push(`/my/rewardsofaction?id=${action.action.head.id}`)}
          className="text-secondary hover:text-secondary/80 underline text-sm bg-transparent border-none cursor-pointer"
        >
          查看更多激励 &gt;&gt;
        </button>
      </div>
    </div>
  );
};
