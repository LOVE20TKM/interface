// components/Extension/Plugins/Group/_GroupJoinSelect.tsx
// 第一步：选择要加入的链群

'use client';

import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ChevronRight } from 'lucide-react';
import { TokenContext } from '@/src/contexts/TokenContext';
import { ActionInfo } from '@/src/types/love20types';
import { useExtensionGroupsOfAction } from '@/src/hooks/extension/plugins/group/composite';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatTokenAmount } from '@/src/lib/format';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

interface GroupJoinSelectProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
}

const _GroupJoinSelect: React.FC<GroupJoinSelectProps> = ({ actionId, actionInfo, extensionAddress }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};

  // 获取链群列表
  const { groups, isPending, error } = useExtensionGroupsOfAction({
    extensionAddress,
    tokenAddress: token?.address,
    actionId,
  });

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (error) {
      handleContractError(error, 'extension');
    }
  }, [error, handleContractError]);

  // 处理选择链群
  const handleSelectGroup = (groupId: bigint) => {
    router.push(
      `/acting/join?tab=join&groupId=${groupId.toString()}&id=${actionId.toString()}&symbol=${token?.symbol}`,
    );
  };

  if (isPending) {
    return (
      <div className="flex flex-col items-center px-4 pt-6">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载链群列表...</p>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 pt-6">
        <LeftTitle title="选择要加入的链群" />
        <div className="text-center py-8 text-gray-500">
          <p>暂无可加入的链群</p>
          <p className="text-sm mt-2">请等待链群服务者激活链群</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-6 pt-6 pb-4">
      <LeftTitle title="选择要加入的链群" />

      {/* 链群列表 */}
      <div className="space-y-3 mt-4">
        {groups.map((group) => (
          <div
            key={group.groupId.toString()}
            onClick={() => handleSelectGroup(group.groupId)}
            className="border border-gray-200 rounded-lg p-4 hover:border-secondary hover:bg-secondary/5 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {/* 第一行：链群ID/名称，服务者 */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800">
                    #{group.groupId.toString()} {group.groupName}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600">服务者:</span>
                  <AddressWithCopyButton address={group.owner} showCopyButton={true} />
                </div>

                {/* 第二行：参与代币范围 */}
                <div className="text-sm text-gray-600">
                  <span className="text-gray-500">参与代币范围：</span>
                  <span className="font-medium text-secondary">{formatTokenAmount(group.actualMinJoinAmount)}</span>
                  <span className="mx-1">~</span>
                  <span className="font-medium text-secondary">
                    {group.actualMaxJoinAmount > BigInt(0) ? `${formatTokenAmount(group.actualMaxJoinAmount)}` : '不限'}
                  </span>
                </div>

                {/* 第三行：参与情况 */}
                <div className="text-xs text-gray-500 mt-1">
                  <span>地址: {group.accountCount.toString()} 个</span>
                  <span className="mx-1">•</span>
                  <span>参与代币: {formatTokenAmount(group.totalJoinedAmount)}</span>
                  <span className="mx-1">•</span>
                  <span>剩余容量: {formatTokenAmount(group.capacity - group.totalJoinedAmount)}</span>
                </div>
              </div>

              {/* 右侧箭头 */}
              <div className="ml-4">
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 提示信息 */}
      <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
        <div className="font-medium text-gray-700 mb-1">💡 温馨提示</div>
        <div className="space-y-1 text-gray-600">
          <div>• 选择一个链群后，您需要提供参与代币数量</div>
          <div>• 参与代币数量必须在链群设定的范围内</div>
          <div>• 加入后，您的激励将基于链群服务者的验证打分</div>
        </div>
      </div>
    </div>
  );
};

export default _GroupJoinSelect;
