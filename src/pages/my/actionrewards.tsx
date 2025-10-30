'use client';

import React, { useContext, useEffect } from 'react';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useActionRewardsData } from '@/src/hooks/composite/useActionRewardsData';

// my components
import Header from '@/src/components/Header';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import { ActionRewardsPageHeader } from '@/src/components/My/ActionRewardsPageHeader';
import { ActionRewardCard } from '@/src/components/My/ActionRewardCard';

const LAST_ROUNDS = BigInt(30);

const ActRewardsPage: React.FC = () => {
  const { token } = useContext(TokenContext) || {};

  // 获取行动激励数据
  const {
    displayedGroups,
    isLoading,
    isPending,
    isConfirming,
    handleClaimCoreReward,
    locallyMinted,
    handleExtensionMintSuccess,
    errors,
  } = useActionRewardsData({
    tokenAddress: token?.address as `0x${string}`,
    lastRounds: LAST_ROUNDS,
  });

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errors.coreRewards) handleContractError(errors.coreRewards, 'dataViewer');
    if (errors.actions) handleContractError(errors.actions, 'dataViewer');
    if (errors.extensionInfo) handleContractError(errors.extensionInfo, 'dataViewer');
    if (errors.stakeLpRewards) handleContractError(errors.stakeLpRewards, 'dataViewer');
    if (errors.mint) handleContractError(errors.mint, 'mint');
  }, [errors, handleContractError]);

  return (
    <>
      <Header title="行动激励" showBackButton={true} />
      <main className="flex-grow">
        {!token ? (
          <LoadingIcon />
        ) : (
          <div className="flex flex-col space-y-6 p-4">
            <ActionRewardsPageHeader tokenSymbol={token.symbol} />

            {isLoading ? (
              <LoadingIcon />
            ) : displayedGroups.length > 0 ? (
              displayedGroups.map((group) => (
                <ActionRewardCard
                  key={group.action.action.head.id}
                  action={group.action}
                  coreRewards={group.coreRewards}
                  extensionInfo={group.extensionInfo}
                  stakeLpRewards={group.stakeLpRewards}
                  tokenData={token}
                  locallyMinted={locallyMinted}
                  lastRounds={LAST_ROUNDS}
                  isPending={isPending}
                  isConfirming={isConfirming}
                  onClaimCoreReward={handleClaimCoreReward}
                  onExtensionMintSuccess={handleExtensionMintSuccess}
                />
              ))
            ) : (
              <div className="text-center text-greyscale-500 py-8">没有参与任何行动</div>
            )}
          </div>
        )}
        <LoadingOverlay isLoading={isPending || isConfirming} text={isPending ? '提交交易...' : '确认交易...'} />
      </main>
    </>
  );
};

export default ActRewardsPage;
