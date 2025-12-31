// components/Extension/Plugins/Group/_MyGroups.tsx
// 我的链群列表组件

'use client';

// React
import React, { useContext } from 'react';

// Next.js
import Link from 'next/link';

// 第三方库
import { ChevronRight } from 'lucide-react';

// UI 组件
import { Button } from '@/components/ui/button';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { AccountGroupInfo } from '@/src/hooks/extension/plugins/group/composite';

// 工具函数
import { formatPercentage, formatTokenAmount } from '@/src/lib/format';

// 组件
import LeftTitle from '@/src/components/Common/LeftTitle';

interface MyGroupsProps {
  groups: AccountGroupInfo[];
  actionId: bigint;
  onManageClick: (groupId: bigint) => void;
}

/**
 * 我的链群列表组件
 *
 * 功能：
 * 1. 显示账号的所有链群（数据通过 props 传入）
 * 2. 显示每个链群的基本信息
 * 3. 容量使用百分比计算：分子使用 totalJoinedAmount（参与量）
 */
const _MyGroups: React.FC<MyGroupsProps> = ({ groups, actionId, onManageClick }) => {
  const { token } = useContext(TokenContext) || {};

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <LeftTitle title={`我的链群 (${groups.length})`} />
        <Link
          href={`/extension/group_op?actionId=${actionId.toString()}&op=activate`}
          className="text-sm text-secondary hover:text-secondary/80 transition-colors"
        >
          激活链群 &gt;&gt;
        </Link>
      </div>

      {groups.length > 0 ? (
        <div className="space-y-3 mt-4">
          {groups.map((group) => (
            <MyGroupItem key={group.groupId.toString()} group={group} onManageClick={onManageClick} token={token} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">暂无链群</div>
      )}
    </div>
  );
};

// 链群项组件
interface MyGroupItemProps {
  group: AccountGroupInfo;
  onManageClick: (groupId: bigint) => void;
  token: any;
}

const MyGroupItem: React.FC<MyGroupItemProps> = ({ group, onManageClick, token }) => {
  // 计算容量使用百分比：参与量 / 容量上限
  const capacityRatio = group.maxCapacity > BigInt(0) ? Number(group.totalJoinedAmount) / Number(group.maxCapacity) : 0;
  const percentage = capacityRatio * 100;

  // 根据用量设置百分比颜色
  const percentageColorClass =
    percentage > 95 ? 'text-red-600' : percentage >= 90 ? 'text-yellow-600' : 'text-gray-500';

  return (
    <div
      onClick={() => onManageClick(group.groupId)}
      className="border border-gray-200 rounded-lg py-3 pl-3 pr-0 hover:border-secondary hover:bg-secondary/5 cursor-pointer transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-gray-800 mb-2">
            <span className="text-gray-500 text-xs">#</span>
            <span className="text-secondary text-base font-semibold ">{group.groupId.toString()}</span>{' '}
            <span className="font-semibold">{group.groupName}</span>
          </div>

          <div className="flex items-center justify-between text-xs mt-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">参与量: </span>
              <span className={percentageColorClass}>
                {formatTokenAmount(group.totalJoinedAmount, 2)} / {formatTokenAmount(group.maxCapacity, 2)} (
                {formatPercentage(percentage)})
              </span>
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
};

export default _MyGroups;
