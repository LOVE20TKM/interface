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

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useExtensionGroupInfosOfAction } from '@/src/hooks/extension/plugins/group/composite';
import { useJoinInfo } from '@/src/hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupAction';

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
  const { address: account } = useAccount();

  // 获取链群列表
  const { groups, isPending, error } = useExtensionGroupInfosOfAction({
    extensionAddress,
    tokenAddress: token?.address,
    actionId,
  });

  // 获取当前用户加入的链群信息
  const {
    groupId: joinedGroupId,
    isPending: isPendingJoinInfo,
    error: errorJoinInfo,
  } = useJoinInfo(extensionAddress, account as `0x${string}`);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (error) {
      handleContractError(error, 'extension');
    }
    if (errorJoinInfo) {
      handleContractError(errorJoinInfo, 'extension');
    }
  }, [error, errorJoinInfo, handleContractError]);

  // 对链群进行分类和排序
  const sortedGroups = useMemo(() => {
    if (!groups || groups.length === 0) return [];

    // 分类：我激活的、我参与的、其他
    const myActivatedGroups = groups.filter((g) => account && g.owner.toLowerCase() === account.toLowerCase());
    const myJoinedGroups = groups.filter(
      (g) =>
        joinedGroupId !== undefined &&
        g.groupId === joinedGroupId &&
        !(account && g.owner.toLowerCase() === account.toLowerCase()),
    );
    const otherGroups = groups.filter(
      (g) =>
        !(account && g.owner.toLowerCase() === account.toLowerCase()) &&
        !(joinedGroupId !== undefined && g.groupId === joinedGroupId),
    );

    // 随机打乱 otherGroups
    const shuffledOtherGroups = [...otherGroups].sort(() => Math.random() - 0.5);

    // 合并：我激活的 -> 我参与的 -> 其他（随机）
    return [...myActivatedGroups, ...myJoinedGroups, ...shuffledOtherGroups];
  }, [groups, account, joinedGroupId]);

  // 跳转到链群主页
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
        <p className="text-gray-500 mb-2">暂无链群参与本行动</p>
        <div className="">
          <Link
            href={`/extension/group_op?actionId=${actionId.toString()}&op=activate`}
            className="text-sm text-secondary hover:text-secondary/80 transition-colors"
          >
            激活链群 &gt;&gt;
          </Link>
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
          const isMyGroup = isMyActivated || isMyJoined;

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
                      {isMyGroup && <span className="text-secondary text-xs ml-1">(我的)</span>}
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

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="">参与代币数:</span>
                      <span className="">{formatTokenAmount(group.totalJoinedAmount)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">参与地址数:</span>
                      <span className="">{group.accountCount.toString()}</span>
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
