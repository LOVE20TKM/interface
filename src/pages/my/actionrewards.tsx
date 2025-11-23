'use client';

import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useActionsLatestRewards } from '@/src/hooks/composite/useActionsLatestRewards';

// my components
import Header from '@/src/components/Header';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import { ActionRewardsPageHeader } from '@/src/components/My/ActionRewardsPageHeader';
import { ActionRewardsList } from '@/src/components/My/ActionRewardsList';

const LAST_ROUNDS = BigInt(30);

const ActRewardsPage: React.FC = () => {
  const router = useRouter();
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
  } = useActionsLatestRewards({
    tokenAddress: token?.address as `0x${string}`,
    lastRounds: LAST_ROUNDS,
  });

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errors.coreRewards) handleContractError(errors.coreRewards, 'dataViewer');
    if (errors.actions) handleContractError(errors.actions, 'dataViewer');
    if (errors.extensionInfo) handleContractError(errors.extensionInfo, 'dataViewer');
    if (errors.extensionRewards) handleContractError(errors.extensionRewards, 'dataViewer');
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
              displayedGroups.map((group) => {
                const action = group.action;
                const coreRewards = group.coreRewards;
                const extensionInfo = group.extensionInfo;
                const extensionRewards = group.extensionRewards;
                const isExtension = extensionInfo?.isExtension;
                const hasRewards = coreRewards.length > 0 || (extensionRewards && extensionRewards.length > 0);

                return (
                  <div key={action.action.head.id} className="border border-gray-100 rounded-lg p-4 shadow-sm">
                    {/* 行动标题 */}
                    <div className="flex items-center mb-3">
                      <div className="flex items-baseline mr-2">
                        <span className="text-greyscale-500">No.</span>
                        <span className="text-secondary text-xl font-bold mr-2">{String(action.action.head.id)}</span>
                        <span className="font-bold text-greyscale-800">{action.action.body.title}</span>
                      </div>
                    </div>

                    {/* 激励列表 */}
                    {hasRewards ? (
                      <>
                        {/* 普通行动激励 */}
                        {coreRewards.length > 0 && (
                          <ActionRewardsList
                            rewards={coreRewards}
                            tokenAddress={token?.address as `0x${string}`}
                            actionId={action.action.head.id}
                            tokenData={token}
                            isExtension={false}
                            showTitle={isExtension}
                            title="普通激励"
                            externalIsPending={isPending}
                            externalIsConfirming={isConfirming}
                            onMintSuccess={(round) => handleClaimCoreReward(round, action.action.head.id)}
                          />
                        )}

                        {/* 扩展激励 */}
                        {isExtension && extensionInfo?.extension && extensionRewards && extensionRewards.length > 0 && (
                          <ActionRewardsList
                            rewards={extensionRewards}
                            extensionAddress={extensionInfo.extension}
                            tokenData={token}
                            isExtension={true}
                            showTitle={coreRewards.length > 0}
                            title="扩展激励"
                            onMintSuccess={(round) =>
                              handleExtensionMintSuccess(extensionInfo.extension!, round.toString())
                            }
                          />
                        )}
                      </>
                    ) : (
                      <div className="text-center text-greyscale-500 py-4">
                        该行动最近 {LAST_ROUNDS.toString()} 轮没有获得激励
                      </div>
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
              })
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
