// components/Extension/Plugins/Group/_GroupManagement.tsx
// 链群管理操作组件

'use client';

// React
import React, { useContext } from 'react';

// Next.js
import { useRouter } from 'next/router';

// 第三方库
import { Edit, UserCog, XCircle, Eye, ArrowRight } from 'lucide-react';

import { TokenContext } from '@/src/contexts/TokenContext';
import _GroupSetRecipientsTrigger from './_GroupSetRecipientsTrigger';

interface GroupManagementProps {
  /** 行动ID */
  actionId: bigint;
  /** 链群NFT */
  groupId: bigint;
  /** 是否显示"查看链群"选项 */
  showViewGroup?: boolean;
}

/**
 * 链群管理操作组件
 *
 * 提供链群服务者的常用管理操作入口：
 * - 查看链群（可选）
 * - 更新信息
 * - 设置激励分配
 * - 设置打分代理
 * - 关闭链群
 */
const _GroupManagement: React.FC<GroupManagementProps> = ({
  actionId,
  groupId,
  showViewGroup = false,
}) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};

  // 跳转到操作页面
  const handleNavigateToOp = (op: string) => {
    router.push(`/extension/group_op/?actionId=${actionId}&groupId=${groupId.toString()}&op=${op}`);
  };

  // 跳转到链群详情页
  const handleViewGroup = () => {
    router.push(`/extension/group/?actionId=${actionId}&groupId=${groupId.toString()}`);
  };

  return (
    <div className="bg-white rounded-lg px-4 py-2 space-y-3">
      {showViewGroup && (
        <div
          onClick={handleViewGroup}
          className="flex items-center justify-between py-3 px-4 border border-greyscale-200 rounded-lg hover:border-secondary hover:bg-secondary/5 transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-secondary" />
            <div>
              <div className="text-base font-medium">查看链群</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-greyscale-400 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
        </div>
      )}
      <div
        onClick={() => handleNavigateToOp('update')}
        className="flex items-center justify-between py-3 px-4 border border-greyscale-200 rounded-lg hover:border-secondary hover:bg-secondary/5 transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <Edit className="w-5 h-5 text-secondary" />
          <div>
            <div className="text-base font-medium">更新信息</div>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-greyscale-400 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
      </div>
      {token?.address && <_GroupSetRecipientsTrigger tokenAddress={token.address} actionId={actionId} groupId={groupId} />}
      <div
        onClick={() => handleNavigateToOp('set_delegated')}
        className="flex items-center justify-between py-3 px-4 border border-greyscale-200 rounded-lg hover:border-secondary hover:bg-secondary/5 transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <UserCog className="w-5 h-5 text-secondary" />
          <div>
            <div className="text-base font-medium">设置打分代理</div>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-greyscale-400 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
      </div>
      <div
        onClick={() => handleNavigateToOp('deactivate')}
        className="flex items-center justify-between py-3 px-4 border border-greyscale-200 rounded-lg transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <XCircle className="w-5 h-5 text-secondary" />
          <div>
            <div className="text-base font-medium">关闭链群</div>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-greyscale-400" />
      </div>
    </div>
  );
};

export default _GroupManagement;
