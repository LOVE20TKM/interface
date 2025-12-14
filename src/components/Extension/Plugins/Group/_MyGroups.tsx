// components/Extension/Plugins/Group/_MyGroups.tsx
// 我的链群列表组件

'use client';

import React, { useContext } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TokenContext } from '@/src/contexts/TokenContext';
import { formatTokenAmount, formatPercentage } from '@/src/lib/format';
import { AccountGroupInfo } from '@/src/hooks/extension/plugins/group/composite';
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
    <div>
      <div className="flex items-center justify-between">
        <LeftTitle title={`我的链群 (${groups.length})`} />
        <Link
          href={`/extension/group_op?actionId=${actionId.toString()}&op=activate`}
          className="text-sm text-secondary hover:text-secondary/80 transition-colors"
        >
          新增链群 &gt;&gt;
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
  // 计算容量使用百分比：参与量 / 容量
  const capacityRatio = group.capacity > BigInt(0) ? Number(group.totalJoinedAmount) / Number(group.capacity) : 0;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-secondary hover:bg-secondary/5 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-semibold text-gray-800 mb-2">
            #{group.groupId.toString()} {group.groupName}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>
              <span className="text-gray-500">参与量: </span>
              <span className="font-medium">
                {formatTokenAmount(group.totalJoinedAmount, 2)} / {formatTokenAmount(group.capacity, 2)} (
                {formatPercentage(capacityRatio * 100)})
              </span>
            </div>
            <div>
              <span className="text-gray-500">质押量: </span>
              <span className="font-medium">
                {formatTokenAmount(group.stakedAmount, 2)} {token?.symbol}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => onManageClick(group.groupId)} className="ml-4">
          管理
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default _MyGroups;
