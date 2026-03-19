// components/Extension/Plugins/Group/_GroupDistrustVoteSelect.tsx
// 投不信任票 - 第一步：选择服务者

'use client';

// React
import React, { useEffect, useMemo } from 'react';

// UI 组件
import { Button } from '@/components/ui/button';

// hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';
import { useExtensionGroupInfosOfAction } from '@/src/hooks/extension/plugins/group/composite';

// 工具函数

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

interface GroupDistrustVoteSelectProps {
  extensionAddress: `0x${string}`;
  onSelectOwner: (owner: `0x${string}`) => void;
  onCancel: () => void;
}

const _GroupDistrustVoteSelect: React.FC<GroupDistrustVoteSelectProps> = ({
  extensionAddress,
  onSelectOwner,
  onCancel,
}) => {
  // 获取当前加入轮次
  const { currentRound } = useCurrentRound();

  // 获取链群列表
  const { groups, isPending, error } = useExtensionGroupInfosOfAction({
    extensionAddress,
    round: currentRound,
  });

  // 错误处理

  // 按服务者分组链群
  const ownerGroups = useMemo(() => {
    if (!groups) return [];

    const groupMap = new Map<string, { owner: `0x${string}`; groups: typeof groups }>();

    groups.forEach((group) => {
      const ownerKey = group.owner.toLowerCase();
      if (!groupMap.has(ownerKey)) {
        groupMap.set(ownerKey, {
          owner: group.owner,
          groups: [],
        });
      }
      groupMap.get(ownerKey)!.groups.push(group);
    });

    return Array.from(groupMap.values());
  }, [groups]);

  if (isPending) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载服务者列表...</p>
      </div>
    );
  }

  if (!ownerGroups || ownerGroups.length === 0) {
    return (
      <div className="space-y-4">
        <LeftTitle title="选择不信任的服务者：" />
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">暂无可投票的服务者</p>
          <Button variant="outline" onClick={onCancel}>
            返回
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LeftTitle title="选择不信任的服务者：" />

      {/* 服务者列表 */}
      <div className="space-y-3">
        {ownerGroups.map((ownerGroup, index) => (
          <div
            key={`${ownerGroup.owner}-${index}`}
            onClick={() => onSelectOwner(ownerGroup.owner)}
            className="border border-gray-200 rounded-lg p-4 hover:border-secondary hover:bg-secondary/5 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3">
              {/* 单选框样式 */}
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-transparent" />
              </div>

              <div className="flex-1">
                {/* 服务者地址 */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500">服务者:</span>
                  <AddressWithCopyButton address={ownerGroup.owner} showCopyButton={true} />
                </div>

                {/* 管理的链群列表 */}
                <div className="text-sm text-gray-600">
                  <span className="text-gray-500">链群: </span>
                  {ownerGroup.groups.map((group, idx) => (
                    <span key={group.groupId.toString()}>
                      #{group.groupId.toString()} {group.groupName}
                      {idx < ownerGroup.groups.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 取消按钮 */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={onCancel} className="w-1/2">
          取消
        </Button>
      </div>

      {/* 说明 */}
      <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
        <div className="font-medium text-gray-700 mb-1">💡 投票说明</div>
        <div className="space-y-1 text-gray-600">
          <div>• 只有给本行动投过票的治理者才能投不信任票</div>
          <div>• 不信任票不能超过您对本行动投的验证票数</div>
          <div>• 投票时需要说明不信任的原因</div>
        </div>
      </div>
    </div>
  );
};

export default _GroupDistrustVoteSelect;
