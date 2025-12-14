// components/Extension/Plugins/Group/_GroupDetail.tsx
// 链群详情 - 显示详细信息和规则

'use client';

import React, { useContext, useEffect } from 'react';
import { TokenContext } from '@/src/contexts/TokenContext';
import { ActionInfo } from '@/src/types/love20types';
import { useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite';
import { useAccountsByGroupIdCount } from '@/src/hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupAction';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatTokenAmount, formatPercentage } from '@/src/lib/format';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';

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
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载链群详情...</p>
      </div>
    );
  }

  if (!groupDetail) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">未找到链群详情</p>
      </div>
    );
  }

  // 计算容量比例
  const capacityRatio =
    groupDetail.capacity > BigInt(0) ? Number(groupDetail.totalJoinedAmount) / Number(groupDetail.capacity) : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-6">
        {/* 容量信息 */}
        <div>
          <LeftTitle title="容量信息" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* 当前容量 */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="text-sm text-gray-600 mb-1">当前容量</div>
              <div className="text-xl font-bold text-green-800">
                {formatTokenAmount(groupDetail.totalJoinedAmount, 2)}
              </div>
              <div className="text-xs text-green-600 mt-1">{formatPercentage(capacityRatio)} 使用率</div>
            </div>

            {/* 最大容量 */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">最大容量</div>
              <div className="text-xl font-bold text-blue-800">{formatTokenAmount(groupDetail.capacity, 2)}</div>
              <div className="text-xs text-blue-600 mt-1">{token?.symbol}</div>
            </div>

            {/* 质押金额 */}
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div className="text-sm text-gray-600 mb-1">质押金额</div>
              <div className="text-xl font-bold text-purple-800">{formatTokenAmount(groupDetail.stakedAmount, 2)}</div>
              <div className="text-xs text-purple-600 mt-1">{token?.symbol}</div>
            </div>

            {/* 参与人数 */}
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <div className="text-sm text-gray-600 mb-1">参与人数</div>
              <div className="text-xl font-bold text-orange-800">{accountsCount?.toString() || '0'}</div>
              <div className="text-xs text-orange-600 mt-1">人</div>
            </div>
          </div>
        </div>

        {/* 参与规则 */}
        <div>
          <LeftTitle title="参与规则" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* 单次最小参与 */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">单次最小参与</div>
              <div className="font-medium text-gray-800">
                {formatTokenAmount(groupDetail.actualMinJoinAmount, 2)} {token?.symbol}
              </div>
              {groupDetail.groupMinJoinAmount > BigInt(0) &&
                groupDetail.groupMinJoinAmount != groupDetail.actualMinJoinAmount && (
                  <div className="text-xs text-gray-500 mt-1">
                    (链群设置: {formatTokenAmount(groupDetail.groupMinJoinAmount, 2)})
                  </div>
                )}
            </div>

            {/* 单次最大参与 */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">单次最大参与</div>
              <div className="font-medium text-gray-800">
                {formatTokenAmount(groupDetail.actualMaxJoinAmount, 2)} {token?.symbol}
              </div>
              {groupDetail.groupMaxJoinAmount > BigInt(0) &&
                groupDetail.groupMaxJoinAmount != groupDetail.actualMaxJoinAmount && (
                  <div className="text-xs text-gray-500 mt-1">
                    (链群设置: {formatTokenAmount(groupDetail.groupMaxJoinAmount, 2)})
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* 链群描述 */}
        {groupDetail.description && (
          <div>
            <LeftTitle title="链群描述" />
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{groupDetail.description}</p>
            </div>
          </div>
        )}

        {/* 说明 */}
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 关于链群</div>
          <div className="space-y-1 text-gray-600">
            <div>• 链群是由服务者创建并管理的行动参与组</div>
            <div>• 容量上限取决于服务者的治理票和质押量</div>
            <div>• 参与者的激励根据治理者对链群的打分决定</div>
            <div>• 加入链群需要满足最小/最大参与金额限制</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default _GroupDetail;
