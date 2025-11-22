'use client';
import React from 'react';
import { formatTokenAmount } from '@/src/lib/format';

interface LpStatsCardProps {
  stakedAmount: bigint;
  lpRatioStr: string;
  userScore: bigint;
  totalScore: bigint;
  userGovVotes: bigint;
  totalGovVotes: bigint;
}

/**
 * StakeLp 扩展统计信息卡片组件
 *
 * 功能：
 * 1. 显示用户质押的 LP 数量
 * 2. 显示激励占比（LP占比 + 治理票占比 + 实际激励占比）
 *
 * 使用场景：
 * - 在"我的行动"页面显示质押统计
 * - 在"参与行动"页面显示当前质押信息
 */
const LpStatsCard: React.FC<LpStatsCardProps> = ({
  stakedAmount,
  lpRatioStr,
  userScore,
  totalScore,
  userGovVotes,
  totalGovVotes,
}) => {
  // 计算实际激励占比
  const actualRatio = totalScore > BigInt(0) ? (Number(userScore) / Number(totalScore)) * 100 : 0;
  const actualRatioStr = actualRatio.toFixed(2) + '%';

  // 计算治理票占比
  const govVotesRatio = totalGovVotes > BigInt(0) ? (Number(userGovVotes) / Number(totalGovVotes)) * 100 : 0;
  const govVotesRatioStr = govVotesRatio.toFixed(2) + '%';

  return (
    <div className="w-full space-y-3 bg-gray-50 rounded-lg p-2">
      {/* 主要数据：我质押的LP数量 和 激励占比 */}
      <div className="w-full grid grid-cols-2 gap-0">
        {/* LP 数量 */}
        <div className="flex flex-col items-center justify-center min-h-[100px] bg-white p-4">
          <div className="text-sm text-gray-500 mb-2">我质押的LP</div>
          <div className="text-2xl font-bold text-secondary">{formatTokenAmount(stakedAmount || BigInt(0), 4)}</div>
        </div>

        {/* 激励占比 */}
        <div className="flex flex-col items-center justify-center min-h-[100px] bg-white p-4">
          <div className="text-sm text-gray-500 mb-2">我的激励占比</div>
          <div className="text-2xl font-bold text-secondary">{actualRatioStr}</div>
        </div>
      </div>

      {/* 辅助数据：4格布局 */}
      <div className="bg-gray-50 rounded-lg p-2">
        <div className="grid grid-cols-2 gap-1">
          {/* LP占比 */}
          <div className="flex items-center justify-between px-1 py-1">
            <span className="text-xs text-gray-500">LP占比:</span>
            <span className="text-sm font-semibold text-secondary pr-4">{lpRatioStr}</span>
          </div>

          {/* 治理票占比 */}
          <div className="flex items-center justify-between px-1 py-1">
            <span className="text-xs text-gray-500">治理票占比:</span>
            <span className="text-sm font-semibold text-secondary">{govVotesRatioStr}</span>
          </div>

          {/* 我的得分 */}
          <div className="flex items-center justify-between px-1 py-1">
            <span className="text-xs text-gray-500">我的得分:</span>
            <span className="text-sm font-semibold text-secondary pr-4">{formatTokenAmount(userScore, 2)}</span>
          </div>

          {/* 总得分 */}
          <div className="flex items-center justify-between px-1 py-1">
            <span className="text-xs text-gray-500">总得分:</span>
            <span className="text-sm font-semibold text-secondary">{formatTokenAmount(totalScore, 2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LpStatsCard;
