// pages/extension/group_op.tsx
// 链群操作页面主路由

import React, { useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useActionInfo } from '@/src/hooks/contracts/useLOVE20Submit';
import { useExtensionContractInfo } from '@/src/hooks/extension/base/composite/useExtensionBaseData';
import { useOwnerOf, useGroupNameOf } from '@/src/hooks/extension/base/contracts/useLOVE20Group';
import { useContractError } from '@/src/errors/useContractError';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import Header from '@/src/components/Header';
import _GroupOPActivate from '@/src/components/Extension/Plugins/Group/_GroupOPActivate';
import _GroupOPDeactivate from '@/src/components/Extension/Plugins/Group/_GroupOPDeactivate';
import _GroupOPUpdate from '@/src/components/Extension/Plugins/Group/_GroupOPUpdate';
import _GroupOPSetDelegated from '@/src/components/Extension/Plugins/Group/_GroupOPSetDelegated';
import _GroupOPVerify from '@/src/components/Extension/Plugins/Group/_GroupOPVerify';

type OpType = 'activate' | 'deactivate' | 'update' | 'set_delegated' | 'verify';

const ActionGroupOpPage: React.FC = () => {
  const router = useRouter();
  const { op, groupId } = router.query;
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 从 query 获取必要参数
  const actionId = router.query.actionId ? BigInt(router.query.actionId as string) : undefined;
  const groupIdBigInt = groupId ? BigInt(groupId as string) : undefined;

  // 当 op 为 activate 时，不需要 groupId，因为会从用户的 group NFT 中选择
  const isActivate = op === 'activate';

  // 获取行动信息
  const {
    actionInfo,
    isPending: isPendingAction,
    error: errorAction,
  } = useActionInfo(token?.address as `0x${string}`, actionId || BigInt(0));

  // 获取扩展合约地址
  const {
    contractInfo,
    isPending: isPendingExtension,
    error: errorExtension,
  } = useExtensionContractInfo({
    tokenAddress: token?.address as `0x${string}`,
    actionInfo,
  });
  const extensionAddress = contractInfo?.extension;

  // 获取链群所有者（activate 操作不需要，因为会从用户的 group NFT 中选择）
  const {
    owner: groupOwner,
    isPending: isPendingOwner,
    error: errorOwner,
  } = useOwnerOf(!isActivate && groupIdBigInt ? groupIdBigInt : BigInt(0));

  // 获取链群名称（verify 操作需要）
  const {
    groupName,
    isPending: isPendingGroupName,
    error: errorGroupName,
  } = useGroupNameOf(op === 'verify' && groupIdBigInt ? groupIdBigInt : BigInt(0));

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorAction) handleError(errorAction);
    if (errorExtension) handleError(errorExtension);
    if (!isActivate && errorOwner) handleError(errorOwner);
    if (op === 'verify' && errorGroupName) handleError(errorGroupName);
  }, [errorAction, errorExtension, errorOwner, errorGroupName, handleError, isActivate, op]);

  // 获取页面标题
  const getPageTitle = () => {
    switch (op as OpType) {
      case 'activate':
        return '激活链群';
      case 'deactivate':
        return '停用链群';
      case 'update':
        return '更新链群';
      case 'set_delegated':
        return '设置委托';
      case 'verify':
        return '验证链群';
      default:
        return '链群操作';
    }
  };

  // 参数校验
  if (!extensionAddress || !op) {
    return (
      <>
        <Header title="链群操作" showBackButton={true} />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <p className="text-red-500">缺少必要参数</p>
              <p className="text-sm text-gray-600 mt-2">需要: actionId (行动ID), op (操作类型)</p>
            </div>
          </div>
        </main>
      </>
    );
  }
  if (!isActivate && !groupIdBigInt) {
    return (
      <>
        <Header title={getPageTitle()} showBackButton={true} />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <p className="text-red-500">缺少必要参数</p>
              <p className="text-sm text-gray-600 mt-2">需要: groupId</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  // activate 操作不需要等待 groupOwner 加载
  // verify 操作需要等待 groupName 加载
  if (
    isPendingAction ||
    isPendingExtension ||
    (!isActivate && isPendingOwner) ||
    (op === 'verify' && isPendingGroupName)
  ) {
    return (
      <>
        <Header title={getPageTitle()} showBackButton={true} />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col items-center py-12">
              <LoadingIcon />
              <p className="mt-4 text-gray-600">加载信息...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!actionInfo) {
    return (
      <>
        <Header title={getPageTitle()} showBackButton={true} />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <p className="text-red-500">未找到行动信息</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  // // 验证权限（activate 操作不需要验证，因为会从用户的 group NFT 中选择）
  // if (!isActivate && (!account || !groupOwner || groupOwner.toLowerCase() !== account.toLowerCase())) {
  //   return (
  //     <>
  //       <Header title={getPageTitle()} showBackButton={true} />
  //       <main className="flex-grow">
  //         <div className="container mx-auto px-4 py-8">
  //           <div className="text-center py-12">
  //             <p className="text-red-500 mb-2">无操作权限</p>
  //             <p className="text-sm text-gray-600">只有链群所有者才能进行此操作</p>
  //           </div>
  //         </div>
  //       </main>
  //     </>
  //   );
  // }

  // 根据操作类型渲染不同组件
  const renderOperation = () => {
    const baseProps = {
      actionId,
      actionInfo,
      extensionAddress,
    };

    switch (op as OpType) {
      case 'activate':
        return <_GroupOPActivate {...baseProps} />;
      case 'deactivate':
        return <_GroupOPDeactivate {...baseProps} groupId={groupIdBigInt!} />;
      case 'update':
        return <_GroupOPUpdate {...baseProps} groupId={groupIdBigInt!} />;
      case 'set_delegated':
        return <_GroupOPSetDelegated {...baseProps} groupId={groupIdBigInt!} />;
      case 'verify':
        return <_GroupOPVerify {...baseProps} groupId={groupIdBigInt!} groupName={groupName || ''} />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-red-500">未知的操作类型: {op}</p>
          </div>
        );
    }
  };

  return (
    <>
      <Header title={getPageTitle()} showBackButton={true} />
      <main className="flex-grow p-4">
        <div className="pt-0 pb-3 max-w-3xl mx-auto">{renderOperation()}</div>
      </main>
    </>
  );
};

export default ActionGroupOpPage;
