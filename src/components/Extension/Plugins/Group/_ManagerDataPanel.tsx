// components/Extension/Plugins/Group/_ManagerDataPanel.tsx
// 服务者数据面板组件

'use client';

// React
import React, { useContext } from 'react';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { AccountGroupInfo } from '@/src/hooks/extension/plugins/group/composite';

// 工具函数
import { formatPercentage, formatTokenAmount } from '@/src/lib/format';

// 组件
import LeftTitle from '@/src/components/Common/LeftTitle';

interface ManagerDataPanelProps {
  groups: AccountGroupInfo[];
  maxVerifyCapacity: bigint | undefined;
}

/**
 * 服务者数据面板组件
 *
 * 功能：
 * 1. 显示服务者的最大容量上限
 * 2. 显示行动者参与总量（从所有链群汇总）
 * 3. 显示链群数量
 */
const _ManagerDataPanel: React.FC<ManagerDataPanelProps> = ({ groups, maxVerifyCapacity }) => {
  const { token } = useContext(TokenContext) || {};

  // 计算行动者参与总量（所有链群的 totalJoinedAmount 之和）
  const totalJoinedAmount = groups.reduce((sum, group) => sum + group.totalJoinedAmount, BigInt(0));

  // 计算所有链群的容量总和
  const totalCapacity = groups.reduce((sum, group) => sum + group.maxCapacity, BigInt(0));

  // 最大容量使用率（百分比数值，如 95 表示 95%）
  const maxCapacityUsagePercent =
    maxVerifyCapacity && maxVerifyCapacity > BigInt(0)
      ? (Number(totalJoinedAmount) * 100) / Number(maxVerifyCapacity)
      : 0;

  // > 90% 橙色警告，>= 100% 红色警告
  const maxCapacityUsageWarnClass =
    maxCapacityUsagePercent >= 100 ? 'text-red-600' : maxCapacityUsagePercent > 90 ? 'text-yellow-600' : '';
  const maxCapacityUsageValueClass = maxCapacityUsageWarnClass || 'text-secondary';
  const maxCapacityUsageLabelClass = maxCapacityUsageWarnClass || 'text-greyscale-500';

  return (
    <div>
      <LeftTitle title="我的服务数据" />

      {/* 行动者参与总量 */}
      <div className="stats w-full mt-2 grid grid-cols-2 bg-gray-50 rounded-lg pt-2 pb-1 border border-gray-200">
        <div className="stat place-items-center p-1">
          <div className="stat-title text-sm">行动者参与总量</div>
          <div className="stat-value h-6 flex items-center">
            <span className="text-xl text-secondary">{formatTokenAmount(totalJoinedAmount)}</span>
          </div>
          <div className="text-xs text-greyscale-500 mt-1">{token?.symbol}</div>
        </div>
        <div className="stat place-items-center p-1">
          <div className={`stat-title text-sm ${maxCapacityUsageWarnClass}`}>最大容量使用率</div>
          <div className="stat-value h-6 flex items-center">
            <span className={`text-xl ${maxCapacityUsageValueClass}`}>
              {maxVerifyCapacity && maxVerifyCapacity > BigInt(0)
                ? formatPercentage((Number(totalJoinedAmount) * 100) / Number(maxVerifyCapacity))
                : '0%'}
            </span>
          </div>
          <div className={`text-xs mt-1 ${maxCapacityUsageLabelClass}`}>
            最大容量: {formatTokenAmount(maxVerifyCapacity || BigInt(0))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default _ManagerDataPanel;
