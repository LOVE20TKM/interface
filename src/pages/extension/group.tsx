// pages/extension/group.tsx
// 链群详情页面主路由

import React, { useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useActionInfo } from '@/src/hooks/contracts/useLOVE20Submit';
import { useExtensionAddressOfAction } from '@/src/hooks/extension/base/composite/useExtensionAddressOfAction';
import { useHandleContractError } from '@/src/lib/errorUtils';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import _GroupHeader from '@/src/components/Extension/Plugins/Group/_GroupHeader';
import _GroupDetail from '@/src/components/Extension/Plugins/Group/_GroupDetail';
import _GroupScores from '@/src/components/Extension/Plugins/Group/_GroupScores';
import _GroupRewards from '@/src/components/Extension/Plugins/Group/_GroupRewards';

const ActionGroupPage: React.FC = () => {
  const router = useRouter();
  const { groupId } = router.query;
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 从 query 获取必要参数
  const actionId = router.query.id ? BigInt(router.query.id as string) : undefined;
  const groupIdBigInt = groupId ? BigInt(groupId as string) : undefined;

  // 获取行动信息
  const {
    actionInfo,
    isPending: isPendingAction,
    error: errorAction,
  } = useActionInfo(token?.address as `0x${string}`, actionId || BigInt(0));

  // 获取扩展合约地址
  const {
    extensionAddress,
    isPending: isPendingExtension,
    error: errorExtension,
  } = useExtensionAddressOfAction(token?.address as `0x${string}`, actionId, actionInfo);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorAction) handleContractError(errorAction, 'submit');
    if (errorExtension) handleContractError(errorExtension, 'extension');
  }, [errorAction, errorExtension, handleContractError]);

  // 参数校验
  if (!actionId || !extensionAddress || !groupIdBigInt) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-500">缺少必要参数</p>
          <p className="text-sm text-gray-600 mt-2">需要: id (actionId), groupId</p>
        </div>
      </div>
    );
  }

  if (isPendingAction || isPendingExtension) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center py-12">
          <LoadingIcon />
          <p className="mt-4 text-gray-600">加载行动信息...</p>
        </div>
      </div>
    );
  }

  if (!actionInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-500">未找到行动信息</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="space-y-6">
        {/* 链群头部 */}
        <_GroupHeader
          actionId={actionId}
          actionInfo={actionInfo}
          extensionAddress={extensionAddress}
          groupId={groupIdBigInt}
          account={account}
        />

        {/* 链群详情 */}
        <_GroupDetail
          actionId={actionId}
          actionInfo={actionInfo}
          extensionAddress={extensionAddress}
          groupId={groupIdBigInt}
        />

        {/* 历史打分记录 */}
        <_GroupScores
          actionId={actionId}
          actionInfo={actionInfo}
          extensionAddress={extensionAddress}
          groupId={groupIdBigInt}
        />

        {/* 历史激励记录 */}
        <_GroupRewards
          actionId={actionId}
          actionInfo={actionInfo}
          extensionAddress={extensionAddress}
          groupId={groupIdBigInt}
        />
      </div>
    </div>
  );
};

export default ActionGroupPage;
