// components/Extension/Plugins/Group/_GroupsTab.tsx
// 链群列表Tab

'use client';

// React
import React, { useContext, useEffect } from 'react';

// Next.js
import { useRouter } from 'next/router';

// 第三方库
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useExtensionGroupInfosOfAction } from '@/src/hooks/extension/plugins/group/composite';

// 工具函数
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatTokenAmount } from '@/src/lib/format';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

interface GroupsTabProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
}

const _GroupsTab: React.FC<GroupsTabProps> = ({ actionId, actionInfo, extensionAddress }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};

  // 获取链群列表
  const { groups, isPending, error } = useExtensionGroupInfosOfAction({
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

  // 跳转到链群主页
  const handleGroupClick = (groupId: bigint) => {
    router.push(
      `/extension/group?groupId=${groupId.toString()}&actionId=${actionId.toString()}&symbol=${token?.symbol}`,
    );
  };

  if (isPending) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载链群列表...</p>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-2">暂无链群参与本行动</p>
        <div className="">
          <Link
            href={`/extension/group_op?actionId=${actionId.toString()}&op=activate`}
            className="text-sm text-secondary hover:text-secondary/80 transition-colors"
          >
            新增链群 &gt;&gt;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LeftTitle title={`参与本行动的链群 (${groups.length})`} />

      {/* 链群列表 */}
      <div className="space-y-3">
        {groups.map((group) => (
          <div
            key={group.groupId.toString()}
            onClick={() => handleGroupClick(group.groupId)}
            className="border border-gray-200 rounded-lg p-4 hover:border-secondary hover:bg-secondary/5 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-gray-800 mb-2">
                  #{group.groupId.toString()} {group.groupName}
                </div>

                <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                  <span className="text-gray-500">服务者:</span>
                  <AddressWithCopyButton address={group.owner} showCopyButton={true} />
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  <span>参与代币范围: </span>
                  <span>
                    {formatTokenAmount(group.actualMinJoinAmount)} ~
                    {group.actualMaxJoinAmount > BigInt(0) ? formatTokenAmount(group.actualMaxJoinAmount) : '不限'}{' '}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 ">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">地址数:</span>
                    <span className="">{group.accountCount.toString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="">代币数:</span>
                    <span className="">
                      {formatTokenAmount(group.totalJoinedAmount)} {token?.symbol}
                    </span>
                  </div>
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

      {/* 说明 */}
      <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
        <div className="font-medium text-gray-700 mb-1">💡 关于链群</div>
        <div className="space-y-1 text-gray-600">
          <div>• 每个链群由一个服务者管理，负责验证成员的行动完成情况</div>
          <div>• 加入链群后，您的激励将基于服务者的验证打分</div>
          <div>• 点击链群可查看详细信息和历史数据</div>
        </div>
      </div>
    </div>
  );
};

export default _GroupsTab;
