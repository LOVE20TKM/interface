// components/Extension/Plugins/Group/_ManagerDataPanel.tsx
// 服务者数据面板组件

'use client';

import React, { useContext } from 'react';
import { TokenContext } from '@/src/contexts/TokenContext';
import { formatTokenAmount, formatPercentage } from '@/src/lib/format';
import { AccountGroupInfo } from '@/src/hooks/extension/plugins/group/composite';
import LeftTitle from '@/src/components/Common/LeftTitle';

interface ManagerDataPanelProps {
  groups: AccountGroupInfo[];
  currentCapacity: bigint | undefined;
  maxCapacity: bigint | undefined;
  currentStake: bigint | undefined;
  maxStake: bigint | undefined;
}

/**
 * 服务者数据面板组件
 *
 * 功能：
 * 1. 显示服务者的容量和质押数据
 * 2. 显示行动者参与总量（从所有链群汇总）
 * 3. 计算各项数据的百分比
 */
const _ManagerDataPanel: React.FC<ManagerDataPanelProps> = ({
  groups,
  currentCapacity,
  maxCapacity,
  currentStake,
  maxStake,
}) => {
  const { token } = useContext(TokenContext) || {};

  // 计算行动者参与总量（所有链群的 totalJoinedAmount 之和）
  const totalJoinedAmount = groups.reduce((sum, group) => sum + group.totalJoinedAmount, BigInt(0));

  // 计算占最大容量比率
  const totalJoinedToCapacityRatio =
    currentCapacity && currentCapacity > BigInt(0) ? Number(totalJoinedAmount) / Number(currentCapacity) : 0;

  // 计算百分比
  const capacityRatio =
    maxCapacity && maxCapacity > BigInt(0) ? Number(currentCapacity || BigInt(0)) / Number(maxCapacity) : 0;
  const stakeRatio = maxStake && maxStake > BigInt(0) ? Number(currentStake || BigInt(0)) / Number(maxStake) : 0;

  return (
    <div>
      <LeftTitle title="服务者数据" />

      {/* 行动者参与总量 - 参考 LaunchStatus 样式 */}
      <div className="stats w-full mt-4 grid grid-cols-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
        <div className="stat place-items-center p-2">
          <div className="stat-title text-sm">行动者参与总量</div>
          <div className="stat-value">
            <span className="text-2xl text-secondary">{formatTokenAmount(totalJoinedAmount)}</span>
          </div>
          <div className="text-xs text-greyscale-500 mt-1">{token?.symbol}</div>
        </div>
        <div className="stat place-items-center p-2">
          <div className="stat-title text-sm">最大容量使用率</div>
          <div className="stat-value">
            <span className="text-2xl text-secondary">{formatPercentage(totalJoinedToCapacityRatio * 100)}</span>
          </div>
          <div className="text-xs text-greyscale-500 mt-1">
            {formatTokenAmount(totalJoinedAmount, 2)} / {formatTokenAmount(currentCapacity || BigInt(0), 2)}
          </div>
        </div>
      </div>

      {/* 容量和质押数据网格 */}
      <div className="stats w-full grid grid-cols-2 px-2 divide-x-0 ">
        {/* 当前容量 */}
        <div className="stat place-items-center px-2 pb-1">
          <div className="stat-title text-sm">当前最大容量</div>
          <div className="stat-value leading-4">
            <span className="text-base">{formatTokenAmount(currentCapacity || BigInt(0), 2)}</span>
          </div>
          <div className="text-xs text-greyscale-500 mt-2">
            已达 <span className="text-secondary">{formatPercentage(capacityRatio * 100)}</span>
          </div>
        </div>

        {/* 当前质押 */}
        <div className="stat place-items-center px-2 pb-1">
          <div className="stat-title text-sm">当前实际质押</div>
          <div className="stat-value leading-4">
            <span className="text-base">{formatTokenAmount(currentStake || BigInt(0))}</span>
          </div>
          <div className="text-xs text-greyscale-500 mt-1">
            已达 <span className="text-secondary">{formatPercentage(stakeRatio * 100)}</span>
          </div>
        </div>
      </div>
      <div className="stats w-full grid grid-cols-2 px-2 divide-x-0">
        {/* 最大容量 */}
        <div className="stat place-items-center px-2">
          <div className="stat-title text-sm">理论最大容量</div>
          <div className="stat-value leading-4">
            <span className="text-sm text-gray-600">{formatTokenAmount(maxCapacity || BigInt(0))}</span>
          </div>
          <div className="text-xs text-greyscale-500 mt-1">{token?.symbol}</div>
        </div>

        {/* 最大质押 */}
        <div className="stat place-items-center px-2">
          <div className="stat-title text-sm">最大可质押量</div>
          <div className="stat-value leading-4">
            <span className="text-sm text-gray-600">{formatTokenAmount(maxStake || BigInt(0))}</span>
          </div>
          <div className="text-xs text-greyscale-500 mt-1">{token?.symbol}</div>
        </div>
      </div>
    </div>
  );
};

export default _ManagerDataPanel;
