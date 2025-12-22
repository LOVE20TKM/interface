// components/Extension/Plugins/Group/_GroupDetail.tsx
// 链群详情 - 显示详细信息和规则

'use client';

// React
import React, { useContext, useEffect } from 'react';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite';
import { useAccountsByGroupIdCount } from '@/src/hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupAction';

// 工具函数
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatPercentage, formatTokenAmount } from '@/src/lib/format';

// 组件
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

interface GroupDetailProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupId: bigint;
}

const _GroupDetail: React.FC<GroupDetailProps> = ({ actionId, actionInfo, extensionAddress, groupId }) => {
  const { token } = useContext(TokenContext) || {};

  // 获取链群详情
  const { groupDetail, isPending, error } = useExtensionGroupDetail({
    extensionAddress,
    actionId,
    groupId,
  });

  // 获取参与人数
  const {
    count: accountsCount,
    isPending: isPendingAccountsCount,
    error: errorAccountsCount,
  } = useAccountsByGroupIdCount(extensionAddress, groupId);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (error) handleContractError(error, 'extension');
    if (errorAccountsCount) handleContractError(errorAccountsCount, 'extension');
  }, [error, errorAccountsCount, handleContractError]);

  if (isPending || isPendingAccountsCount) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="flex flex-col items-center py-8">
          <LoadingIcon />
          <p className="mt-4 text-gray-600">加载链群详情...</p>
        </div>
      </div>
    );
  }

  if (!groupDetail) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="text-center py-12">
          <p className="text-red-500">未找到链群详情</p>
        </div>
      </div>
    );
  }

  // 计算容量比例
  const capacityRatio =
    groupDetail.maxCapacity > BigInt(0) ? Number(groupDetail.totalJoinedAmount) / Number(groupDetail.maxCapacity) : 0;
  const remainingCapacityRatio =
    groupDetail.remainingCapacity > BigInt(0)
      ? Number(groupDetail.remainingCapacity) / Number(groupDetail.maxCapacity)
      : 0;
  return (
    <div>
      <div className="space-y-6">
        {/* 链群描述 */}
        <div className="mt-6">
          <div className="text-sm mb-2">链群描述:</div>
          <div className="leading-loose bg-gray-50 p-2 rounded-md">
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{groupDetail.description || '无'}</p>
          </div>
        </div>

        {/* 容量信息 */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <div className="flex items-center justify-between md:max-w-xs">
              <span className="text-sm">链群服务者:</span>
              <span>
                <AddressWithCopyButton address={groupDetail.owner} showCopyButton={true} />
              </span>
            </div>
            <div className="flex items-center justify-between md:max-w-xs">
              <span className="text-sm">最大容量:</span>
              <span className="font-mono">{formatTokenAmount(groupDetail.maxCapacity)}</span>
            </div>

            <div className="flex items-center justify-between md:max-w-xs">
              <span className="text-sm">剩余容量:</span>
              <span className="font-mono">
                <span className="">{formatTokenAmount(groupDetail.remainingCapacity)} </span>
                <span className="text-sm text-gray-500">({formatPercentage(remainingCapacityRatio * 100)})</span>
              </span>
            </div>
            <div className="flex items-center justify-between md:max-w-xs">
              <span className="text-sm">已参与代币:</span>
              <span className="font-mono">
                <span className="">{formatTokenAmount(groupDetail.totalJoinedAmount)} </span>
                <span className="text-sm text-gray-500">({formatPercentage(capacityRatio * 100)})</span>
              </span>
            </div>
            {/* <div className="flex items-center justify-between md:max-w-xs">
              <span className="text-sm">总参与地址:</span>
              <span className="font-mono">{accountsCount?.toString() || '0'}</span>
            </div> */}
          </div>
        </div>

        {/* 参与规则 */}
        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between md:max-w-xs">
              <span className="text-sm">最小参与代币数:</span>
              <span className="font-mono ">{formatTokenAmount(groupDetail.actualMinJoinAmount, 4, 'ceil')}</span>
            </div>

            <div className="flex items-center justify-between md:max-w-xs">
              <span className="text-sm">最大参与代币数:</span>
              <span className="font-mono">{formatTokenAmount(groupDetail.actualMaxJoinAmount)}</span>
            </div>
          </div>
        </div>

        {/* 说明 */}
        {/* <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 小贴士</div>
          <div className="space-y-1 text-gray-600">
            <div>• 容量上限取决于服务者的治理票和质押量</div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default _GroupDetail;
