// components/Extension/Plugins/Group/_GroupActionTips.tsx
// 小贴士说明组件 - 共用组件

'use client';

// React
import React from 'react';

// 工具函数
import { formatTokenAmount, formatPercentage } from '@/src/lib/format';

interface GroupActionTipsProps {
  activationMinGovRatio?: bigint;
  maxJoinAmountRatio?: bigint;
  joinMaxAmount?: bigint;
  groupActivationStakeAmount?: bigint;
}

const _GroupActionTips: React.FC<GroupActionTipsProps> = ({
  activationMinGovRatio,
  maxJoinAmountRatio,
  joinMaxAmount,
  groupActivationStakeAmount,
}) => {
  // 将 wei 格式的比例转换为百分比显示 (wei / 1e18 = 比例)
  const minGovRatioDisplay = activationMinGovRatio
    ? formatPercentage((Number(activationMinGovRatio) * 100) / 1e18)
    : '0%';

  return (
    <div className="text-sm text-greyscale-600 bg-greyscale-50 border border-greyscale-200 rounded px-3 py-2">
      <div className="flex items-center gap-2 text-sm font-bold text-status-info">💡小贴士</div>
      <div className="flex flex-col space-y-2 text-greyscale-700 ">
        <div className="text-sm text-status-info pt-3">激活要求：</div>
        <div>
          激活链群需质押代币数量：<b>{formatTokenAmount(groupActivationStakeAmount || BigInt(0), 4, 'ceil')}</b>
        </div>
        <div>
          激活链群最小治理票比例：<b>{minGovRatioDisplay}</b>
        </div>
        <div className="text-sm text-status-info pt-3">参与代币：</div>
        <div>
          <b>行动最大参与代币量</b> = 已铸造代币总量 × 最大参与代币占比 × 该行动投票率
        </div>
      </div>
    </div>
  );
};

export default _GroupActionTips;
