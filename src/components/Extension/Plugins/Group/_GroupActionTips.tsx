// components/Extension/Plugins/Group/_GroupActionTips.tsx
// 小贴士说明组件 - 共用组件

'use client';

// React
import React from 'react';

// 工具函数
import { formatTokenAmount } from '@/src/lib/format';

interface GroupActionTipsProps {
  verifyCapacityMultiplier?: bigint;
  maxJoinAmountMultiplier?: bigint;
  joinMaxAmount?: bigint;
  groupActivationStakeAmount?: bigint;
}

const _GroupActionTips: React.FC<GroupActionTipsProps> = ({
  verifyCapacityMultiplier,
  maxJoinAmountMultiplier,
  joinMaxAmount,
  groupActivationStakeAmount,
}) => {
  return (
    <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
      <div className="flex items-center gap-2 text-sm font-bold text-blue-800">💡小贴士</div>
      <div className="flex flex-col space-y-2 text-gray-700 ">
        <div className="text-sm text-blue-700 pt-3">激活要求：</div>
        <div>
          1. 激活链群需质押代币数量：<b>{formatTokenAmount(groupActivationStakeAmount || BigInt(0), 4, 'ceil')}</b>
        </div>
        <div className="text-sm text-blue-700 pt-3">容量与质押量：</div>
        <div>
          1. <b>链群最大容量</b> = (已铸造代币量 - 流动性质押量 - 加速激励质押量) × 治理票占比 × 验证容量倍数（为{' '}
          {verifyCapacityMultiplier?.toString()}）
        </div>
        <div className="text-sm text-blue-700 pt-3">参与代币：</div>
        <div>
          1. <b>行动最大参与代币量</b> = 已铸造代币总量 / 最大参与代币倍数（为 {maxJoinAmountMultiplier?.toString()}）×
          该行动投票率= {formatTokenAmount(joinMaxAmount || BigInt(0))}
        </div>
      </div>
    </div>
  );
};

export default _GroupActionTips;
