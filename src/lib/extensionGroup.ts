// src/lib/extensionGroup.ts
// 链群参与限制计算工具

import { formatTokenAmount } from './format';
import { GroupDetailInfo } from '@/src/hooks/extension/plugins/group/composite/useExtensionGroupDetail';

/**
 * 参与量计算结果接口
 */
export interface JoinAmountResult {
  amount: bigint; // 可参与的最大代币量
  reason: string; // 限制原因描述（包含格式化的数值）
}

/**
 * 获取新用户的最大参与量
 *
 * 限制条件（取最小值）：
 * 1. maxJoinAmount: 群设置最大参与量（为0时表示无限制，不参与计算）
 * 2. actionMaxJoinAmount: 行动最大参与代币量
 * 3. remainingCapacity: 链群剩余容量（maxCapacity为0时表示无限制，不参与计算）
 * 4. ownerRemainingCapacity: 链群服务者剩余验证容量
 *
 * @param groupDetail 链群详情信息
 * @returns 最大参与量和限制原因
 */
export const getMaxJoinAmount = (groupDetail: GroupDetailInfo): JoinAmountResult => {
  // 收集所有限制条件
  const limits: Array<{ amount: bigint; reason: string }> = [];

  // 1. 群设置最大参与量（为0时表示无限制，不添加）
  if (groupDetail.maxJoinAmount > BigInt(0)) {
    limits.push({
      amount: groupDetail.maxJoinAmount,
      reason: `链群最大参与代币 ${formatTokenAmount(groupDetail.maxJoinAmount)}`,
    });
  }

  // 2. 行动最大参与代币量（为0时表示无限制，不添加）
  if (groupDetail.actionMaxJoinAmount > BigInt(0)) {
    limits.push({
      amount: groupDetail.actionMaxJoinAmount,
      reason: `行动参与代币上限 ${formatTokenAmount(groupDetail.actionMaxJoinAmount)}`,
    });
  }

  // 3. 链群剩余容量（maxCapacity为0时表示无限制，不添加）
  if (groupDetail.maxCapacity > BigInt(0)) {
    limits.push({
      amount: groupDetail.remainingCapacity,
      reason: `链群剩余容量 ${formatTokenAmount(groupDetail.remainingCapacity)}`,
    });
  }

  // 找出最小限制（确保最小值为0，不能为负）
  let minLimit = limits[0];
  for (const limit of limits) {
    if (limit.amount < minLimit.amount) {
      minLimit = limit;
    }
  }

  return {
    amount: minLimit.amount > BigInt(0) ? minLimit.amount : BigInt(0),
    reason: minLimit.reason,
  };
};

/**
 * 获取老用户的最大追加量
 *
 * 限制条件（取最小值）：
 * 1. maxJoinAmount - oldAmount: 群设置最大参与量减去已参与量（maxJoinAmount为0时表示无限制，不参与计算）
 * 2. actionMaxJoinAmount - oldAmount: 行动最大参与代币量减去已参与量
 * 3. remainingCapacity: 链群剩余容量（maxCapacity为0时表示无限制，不参与计算）
 * 4. ownerRemainingCapacity: 链群服务者剩余验证容量
 *
 * @param groupDetail 链群详情信息
 * @param oldAmount 已参与的代币量
 * @returns 最大追加量和限制原因
 */
export const getMaxIncreaseAmount = (groupDetail: GroupDetailInfo, oldAmount: bigint): JoinAmountResult => {
  // 收集所有限制条件
  const limits: Array<{ amount: bigint; reason: string }> = [];

  // 1. 群设置最大参与量减去已参与量（maxJoinAmount为0时表示无限制，不添加）
  if (groupDetail.maxJoinAmount > BigInt(0)) {
    const maxJoinRemaining = groupDetail.maxJoinAmount - oldAmount;
    limits.push({
      amount: maxJoinRemaining,
      reason: `链群最大参与代币 ${formatTokenAmount(groupDetail.maxJoinAmount)}`,
    });
  }

  // 2. 行动最大参与代币量减去已参与量
  const actionMaxJoinRemaining = groupDetail.actionMaxJoinAmount - oldAmount;
  limits.push({
    amount: actionMaxJoinRemaining,
    reason: `行动参与代币上限 ${formatTokenAmount(groupDetail.actionMaxJoinAmount)}`,
  });

  // 3. 链群剩余容量（maxCapacity为0时表示无限制，不添加）
  if (groupDetail.maxCapacity > BigInt(0)) {
    limits.push({
      amount: groupDetail.remainingCapacity,
      reason: `链群剩余容量 ${formatTokenAmount(groupDetail.remainingCapacity)}`,
    });
  }

  // 找出最小限制（确保最小值为0，不能为负）
  let minLimit = limits[0];
  for (const limit of limits) {
    if (limit.amount < minLimit.amount) {
      minLimit = limit;
    }
  }

  return {
    amount: minLimit.amount > BigInt(0) ? minLimit.amount : BigInt(0),
    reason: minLimit.reason,
  };
};
