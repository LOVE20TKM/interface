// components/Extension/Plugins/Group/_GroupsTab.tsx
// 链群列表Tab

'use client';

// React
import React, { useContext, useEffect, useMemo } from 'react';

// Next.js
import { useRouter } from 'next/router';

// 第三方库
import { ChevronRight, User } from 'lucide-react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';
import { useExtensionGroupInfosOfAction } from '@/src/hooks/extension/plugins/group/composite';
import { useJoinInfo } from '@/src/hooks/extension/plugins/group/contracts/useGroupJoin';

// 工具函数
import { formatPercentage, formatTokenAmount } from '@/src/lib/format';

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
  const { address: account } = useAccount();

  // 获取当前加入轮次
  const { currentRound } = useCurrentRound();

  // 获取链群列表
  const { groups, isPending, error } = useExtensionGroupInfosOfAction({
    extensionAddress,
    round: currentRound,
  });

  // 获取当前用户加入的链群信息
  const {
    groupId: joinedGroupId,
    isPending: isPendingJoinInfo,
    error: errorJoinInfo,
  } = useJoinInfo(extensionAddress, currentRound || BigInt(0), account as `0x${string}`);

  // 错误处理

  // 按参与代币数从高到低排序
  const sortedGroups = useMemo(() => {
    if (!groups || groups.length === 0) return [];
    return [...groups].sort((a, b) => (b.totalJoinedAmount > a.totalJoinedAmount ? 1 : b.totalJoinedAmount < a.totalJoinedAmount ? -1 : 0));
  }, [groups]);

  // 跳转到链群服务者页
  const handleGroupClick = (groupId: bigint) => {
    router.push(
      `/extension/group?groupId=${groupId.toString()}&actionId=${actionId.toString()}&symbol=${token?.symbol}`,
    );
  };

  if (isPending || isPendingJoinInfo) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载链群列表...</p>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500 mb-2">暂无被激活的链群</p>
        <div className="">
          <Button asChild className="w-1/2 text-secondary border-secondary" variant="outline">
            <Link href={`/extension/group_op?actionId=${actionId.toString()}&op=activate`}>去激活链群 &gt;&gt;</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <LeftTitle title={`链群列表 (${groups.length})`} />
        <Link
          href={`/extension/group_op?actionId=${actionId.toString()}&op=activate`}
          className="text-sm text-secondary hover:text-secondary/80 ml-2"
        >
          激活链群 &gt;&gt;
        </Link>
      </div>

      {/* 链群列表 */}
      <div className="space-y-3">
        {sortedGroups.map((group) => {
          // 判断是否为我的链群（我激活的或我参与的）
          const isMyActivated = account && group.owner.toLowerCase() === account.toLowerCase();
          const isMyJoined = joinedGroupId !== undefined && group.groupId === joinedGroupId;

          return (
            <div
              key={group.groupId.toString()}
              onClick={() => handleGroupClick(group.groupId)}
              className="border border-gray-200 rounded-lg py-3 pl-3 pr-0 hover:border-secondary hover:bg-secondary/5 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-gray-800 mb-2 flex items-center justify-between">
                    <div className="flex items-center items-baseline">
                      <span className="text-gray-500 text-xs">#</span>
                      <span className="text-secondary text-base font-semibold">{group.groupId.toString()}</span>{' '}
                      <span className="font-semibold ml-1">{group.groupName}</span>
                      {isMyActivated ? (
                        <span className="text-secondary text-xs ml-1">(我的)</span>
                      ) : isMyJoined ? (
                        <span className="text-secondary text-xs ml-1">(我参与)</span>
                      ) : null}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <User className="text-greyscale-400 h-3 w-3" />
                      <span className="text-greyscale-400">
                        <AddressWithCopyButton address={group.owner} showCopyButton={false} />
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    <span>单地址代币限制: </span>
                    <span>
                      {formatTokenAmount(group.actualMinJoinAmount)} ~&nbsp;
                      {group.actualMaxJoinAmount > BigInt(0)
                        ? formatTokenAmount(group.actualMaxJoinAmount)
                        : '不限'}{' '}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">参与代币数:</span>
                      {/* 容量百分比显示 */}
                      {(() => {
                        // 如果 maxCapacity <= 0，链群没有容量限制，不显示百分比
                        if (group.maxCapacity <= BigInt(0)) {
                          return <span className="text-gray-500">{formatTokenAmount(group.totalJoinedAmount)}</span>;
                        }
                        const capacityRatio = Number(group.totalJoinedAmount) / Number(group.maxCapacity);
                        const percentage = capacityRatio * 100;
                        const colorClass =
                          percentage > 95 ? 'text-red-600' : percentage >= 90 ? 'text-yellow-600' : 'text-gray-500';
                        return (
                          <span className={colorClass}>
                            {formatTokenAmount(group.totalJoinedAmount)} ({formatPercentage(percentage)})
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">参与地址数:</span>
                      <span className="text-gray-500">{group.accountCount.toString()}</span>
                    </div>
                  </div>
                </div>

                {/* 右侧箭头 */}
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 说明 */}
      <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
        <div className="font-medium text-gray-700 mb-1">💡 小贴士</div>
        <div className="space-y-1 text-gray-600">
          <div>• 每个链群，由所属服务者对成员进行验证和打分</div>
          <div>• 加入链群后，您的激励将基于服务者的验证打分</div>
        </div>
      </div>
    </div>
  );
};

export default _GroupsTab;
