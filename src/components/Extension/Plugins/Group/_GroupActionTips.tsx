// components/Extension/Plugins/Group/_GroupActionTips.tsx
// 小贴士说明组件 - 共用组件

'use client';

// React
import React from 'react';

// 工具函数
import { formatTokenAmount, formatPercentage } from '@/src/lib/format';
import { formatEther } from 'viem';

interface GroupActionTipsProps {
  maxVerifyCapacityFactor?: bigint;
  maxJoinAmountRatio?: bigint;
  joinMaxAmount?: bigint;
  groupActivationStakeAmount?: bigint;
}

const _GroupActionTips: React.FC<GroupActionTipsProps> = ({
  maxVerifyCapacityFactor,
  maxJoinAmountRatio,
  joinMaxAmount,
  groupActivationStakeAmount,
}) => {
  // 比例分母常量 (10^16)
  const RATIO_DENOMINATOR = BigInt('10000000000000000');

  // 将 wei 格式的系数转换为实数显示
  const capacityFactorDisplay = maxVerifyCapacityFactor ? formatEther(maxVerifyCapacityFactor) : '0';

  // 将 wei 格式的比例转换为百分比显示 (wei / 1e18 * 100 = %)
  // 先转换为 Number 再除法，避免 BigInt 整数除法截断小数部分
  const ratioPercentageDisplay = maxJoinAmountRatio
    ? formatPercentage(Number(maxJoinAmountRatio) / Number(RATIO_DENOMINATOR))
    : '0%';

  return (
    <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
      <div className="flex items-center gap-2 text-sm font-bold text-blue-800">💡小贴士</div>
      <div className="flex flex-col space-y-2 text-gray-700 ">
        <div className="text-sm text-blue-700 pt-3">激活要求：</div>
        <div>
          激活链群需质押代币数量：<b>{formatTokenAmount(groupActivationStakeAmount || BigInt(0), 4, 'ceil')}</b>
        </div>
        <div className="text-sm text-blue-700 pt-3">容量与质押量：</div>
        <div>
          <b>理论最大容量</b> = 治理票占比 × 已铸造代币量 × 验证容量系数
        </div>
        <div className="text-sm text-blue-700 pt-3">参与代币：</div>
        <div>
          <b>行动最大参与代币量</b> = 已铸造代币总量 × 最大参与代币占比 × 该行动投票率
        </div>
      </div>
    </div>
  );
};

export default _GroupActionTips;
