// components/Extension/Plugins/Group/_GroupActionTips.tsx
// 小贴士说明组件 - 共用组件

'use client';

import React from 'react';
import { formatTokenAmount, formatPercentage } from '@/src/lib/format';

interface GroupActionTipsProps {
  minGovVoteRatioBps?: bigint;
  capacityMultiplier?: bigint;
  stakingMultiplier?: bigint;
  minJoinAmount?: bigint;
  maxJoinAmountMultiplier?: bigint;
  joinMaxAmount?: bigint;
}

const _GroupActionTips: React.FC<GroupActionTipsProps> = ({
  minGovVoteRatioBps,
  capacityMultiplier,
  stakingMultiplier,
  minJoinAmount,
  maxJoinAmountMultiplier,
  joinMaxAmount,
}) => {
  return (
    <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
      <div className="flex items-center gap-2 text-sm font-bold text-blue-800">💡小贴士</div>
      <div className="flex flex-col space-y-2 text-gray-700 ">
        <div className="text-sm text-blue-700 pt-3">权限：</div>
        <div>
          1. 要激活链群，链群服务者的治理票占比需 ≥ {formatPercentage(Number(minGovVoteRatioBps || BigInt(0)) / 100)}
        </div>
        <div className="text-sm text-blue-700 pt-3">容量与质押量：</div>
        <div>
          1. <b>链群服务者"最大"链群容量</b> = 已铸造代币总量 × 链群服务者治理票占比 × 容量倍数( 为
          {capacityMultiplier?.toString()})
        </div>
        <div>
          2. <b>链群服务者"实际"链群容量</b> = 质押量 × 质押倍数( 为{stakingMultiplier?.toString()})
        </div>
        <div>
          3. <b>链群服务者"最大"质押量</b> = 链群服务者"最大"链群容量 / 质押倍数( 为{stakingMultiplier?.toString()})
        </div>
        <div className="text-sm text-blue-700 pt-3">参与代币：</div>
        <div>
          1. <b>行动最小参与代币量</b> = {formatTokenAmount(minJoinAmount || BigInt(0))}
        </div>
        <div>
          2. <b>行动最大参与代币量</b> = 已铸造代币总量 / 最大参与代币倍数( 为{maxJoinAmountMultiplier?.toString()}) ={' '}
          {formatTokenAmount(joinMaxAmount || BigInt(0))}
        </div>
      </div>
    </div>
  );
};

export default _GroupActionTips;
