'use client';

import { useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';

// my hooks
import { useActionDetailData } from '@/src/hooks/composite/useActionDetailData';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import Header from '@/src/components/Header';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import ActionHeader from '@/src/components/Action/ActionHeader';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import ExtensionMyParticipation from '@/src/components/Extension/Base/Action/ExtensionMyParticipation';
import ActionPanelForJoin from '@/src/components/ActionDetail/ActionPanelForJoin';

const ActRewardsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const actionId = id ? BigInt(id as string) : undefined;
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};

  // 获取页面数据
  const {
    actionInfo,
    participantCount,
    totalAmount,
    convertedTotalAmount,
    joinedAmountTokenSymbol,
    joinedAmountTokenIsLP,
    isJoined,
    isExtensionAction,
    isPending,
    error,
  } = useActionDetailData({
    tokenAddress: token?.address,
    actionId,
    account,
  });

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (error) {
      handleContractError(error, 'submit');
    }
  }, [error]);

  // 如果没有actionId，显示错误
  if (actionId === undefined) {
    return (
      <>
        <Header title="行动激励" showBackButton={true} />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-red-500">参数错误：缺少行动ID参数</div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="行动激励" showBackButton={true} />
      <main className="flex-grow">
        <div className="px-4 pt-0 pb-3">
          {/* 头部信息 */}
          {actionInfo && (
            <ActionHeader
              actionInfo={actionInfo}
              participantCount={participantCount}
              totalAmount={totalAmount}
              convertedTotalAmount={convertedTotalAmount}
              joinedAmountTokenSymbol={joinedAmountTokenSymbol}
              joinedAmountTokenIsLP={joinedAmountTokenIsLP}
              isJoined={isJoined}
              isPending={isPending}
              showActionButtons={false}
            />
          )}

          {/* 主要内容 */}
          {isPending ? (
            <div className="bg-white rounded-lg p-8">
              <div className="text-center">
                <LoadingIcon />
                <p className="mt-4 text-gray-600">加载数据中...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg p-8">
              <div className="text-center text-red-500">
                加载失败：{error.message || '获取行动信息失败，请稍后重试'}
              </div>
            </div>
          ) : actionInfo ? (
            isExtensionAction ? (
              <ExtensionMyParticipation
                actionId={actionId}
                actionInfo={actionInfo}
                tokenAddress={token?.address as `0x${string}`}
              />
            ) : (
              <ActionPanelForJoin actionId={actionId} actionInfo={actionInfo} />
            )
          ) : (
            <div className="bg-white rounded-lg p-8">
              <div className="text-center text-yellow-600">行动不存在：找不到指定的行动信息</div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default ActRewardsPage;
