import React from 'react';
import { useRouter } from 'next/router';
import LeftTitle from '@/src/components/Common/LeftTitle';

export interface ActionRewardsPageHeaderProps {
  tokenSymbol?: string;
}

/**
 * 行动激励页面头部组件
 *
 * 功能：
 * 1. 显示页面标题
 * 2. 提供查看已退出行动激励的链接
 */
export const ActionRewardsPageHeader: React.FC<ActionRewardsPageHeaderProps> = ({ tokenSymbol }) => {
  const router = useRouter();

  return (
    <div className="flex justify-between items-center">
      <LeftTitle title="铸造行动激励" />
      <button
        onClick={() => router.push(`/my/queryaction?symbol=${tokenSymbol}`)}
        className="text-secondary hover:text-secondary/80 text-sm bg-transparent border-none cursor-pointer"
      >
        查看已退出行动激励&nbsp;&gt;&gt;
      </button>
    </div>
  );
};
