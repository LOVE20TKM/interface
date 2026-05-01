// src/lib/extensionGroup.ts
// 链群参与限制计算工具

import { formatTokenAmount } from './format';
import type { GroupDetailInfo } from '@/src/hooks/extension/plugins/group/composite/useExtensionGroupDetail';

/**
 * 参与量计算结果接口
 */
export interface JoinAmountResult {
  amount: bigint; // 可参与的最大代币量
  reason: string; // 限制原因描述（包含格式化的数值）
}

export interface ActionJoinLimitDetail {
  actionMaxJoinAmount: bigint;
  actionVotes: bigint;
  joinTokenTotalSupply: bigint;
  maxJoinAmountRatio: bigint;
  round: bigint;
  totalVotes: bigint;
}

const formatLimitAmount = (amount: bigint): string =>
  amount < BigInt(0) ? `-${formatTokenAmount(-amount)}` : formatTokenAmount(amount);
const formatUnlimited = (amount: bigint): string =>
  amount > BigInt(0) ? formatLimitAmount(amount) : '不限';
const formatRemainingAmount = (amount: bigint): string =>
  amount > BigInt(0) ? formatLimitAmount(amount) : `${formatLimitAmount(amount)}（已达到或超过上限，追加余量按 0 处理）`;
const PRECISION = BigInt('1000000000000000000');
const PERCENT_DECIMAL_SCALE = BigInt(10000);

const formatPercentByRatio = (numerator: bigint, denominator: bigint): string => {
  if (denominator <= BigInt(0)) return '0%';
  const scaled = (numerator * BigInt(100) * PERCENT_DECIMAL_SCALE) / denominator;
  const integerPart = scaled / PERCENT_DECIMAL_SCALE;
  const fractionalPart = scaled % PERCENT_DECIMAL_SCALE;
  const fractionalText = fractionalPart.toString().padStart(4, '0').replace(/0+$/, '');
  return `${integerPart.toString()}${fractionalText ? `.${fractionalText}` : ''}%`;
};
const formatRatio = (ratio: bigint): string => formatPercentByRatio(ratio, PRECISION);
const formatVoteRatio = (actionVotes: bigint, totalVotes: bigint): string =>
  formatPercentByRatio(actionVotes, totalVotes);

const buildActionMaxJoinAmountLine = (actionLimitDetail?: ActionJoinLimitDetail): string => {
  if (!actionLimitDetail) return '';

  if (actionLimitDetail.totalVotes <= BigInt(0)) {
    return `行动单地址上限 = 0；当前第 ${actionLimitDetail.round.toString()} 轮总投票为 0，因此不参与最小值计算。`;
  }

  if (actionLimitDetail.actionVotes <= BigInt(0)) {
    return `行动单地址上限 = 0；当前第 ${actionLimitDetail.round.toString()} 轮该行动投票为 0，总投票为 ${formatLimitAmount(
      actionLimitDetail.totalVotes,
    )}，因此不参与最小值计算。`;
  }

  return [
    `行动单地址上限 = 已铸造参与代币总量 × 最大参与代币占比 × 行动投票占比。`,
    `= ${formatLimitAmount(actionLimitDetail.joinTokenTotalSupply)} × ${formatRatio(
      actionLimitDetail.maxJoinAmountRatio,
    )} × ${formatVoteRatio(actionLimitDetail.actionVotes, actionLimitDetail.totalVotes)}`,
    `其中行动投票占比 = ${formatLimitAmount(actionLimitDetail.actionVotes)} / ${formatLimitAmount(
      actionLimitDetail.totalVotes,
    )}。`,
    `所以行动单地址上限 = ${formatLimitAmount(actionLimitDetail.actionMaxJoinAmount)}。`,
  ].join('\n');
};

/**
 * 生成新用户参与上限的详细计算说明。
 */
export const getMaxJoinAmountDetail = (
  groupDetail: GroupDetailInfo,
  result: JoinAmountResult,
  actionLimitDetail?: ActionJoinLimitDetail,
): string => {
  const actionMaxJoinAmountDetail = buildActionMaxJoinAmountLine(actionLimitDetail);
  const actionMaxJoinAmountLine = actionMaxJoinAmountDetail || `行动单地址上限：${formatUnlimited(groupDetail.actionMaxJoinAmount)}`;
  const actionMaxJoinAmountSuffix =
    !actionMaxJoinAmountDetail && groupDetail.actionMaxJoinAmount <= BigInt(0) ? '，不参与最小值计算' : '';
  const lines = [
    '参与代币上限取以下有效限制中的最小值：',
    `1. 链群单地址上限：${formatUnlimited(groupDetail.maxJoinAmount)}${
      groupDetail.maxJoinAmount > BigInt(0) ? '' : '，不参与最小值计算'
    }`,
    `2. ${actionMaxJoinAmountLine}${actionMaxJoinAmountSuffix}`,
    `3. 链群剩余容量：${
      groupDetail.maxCapacity > BigInt(0)
        ? `${formatLimitAmount(groupDetail.maxCapacity)} - ${formatLimitAmount(groupDetail.totalJoinedAmount)} = ${formatLimitAmount(groupDetail.remainingCapacity)}`
        : '不限，不参与最小值计算'
    }`,
    '',
  ];

  if (result.amount > BigInt(0)) {
    lines.push(`所以当前参与代币上限 = ${formatLimitAmount(result.amount)}。`);
    lines.push(`当前生效限制：${result.reason}。`);
  } else if (result.reason === '无限制') {
    lines.push('所以当前没有参与代币上限。');
  } else {
    lines.push(`所以当前参与代币上限 = 0。`);
    lines.push(`当前生效限制：${result.reason}。`);
  }

  lines.push(`参与代币下限 = ${formatLimitAmount(groupDetail.actualMinJoinAmount)}。`);
  return lines.join('\n');
};

/**
 * 生成老用户追加上限的详细计算说明。
 */
export const getMaxIncreaseAmountDetail = (
  groupDetail: GroupDetailInfo,
  oldAmount: bigint,
  result: JoinAmountResult,
  actionLimitDetail?: ActionJoinLimitDetail,
): string => {
  const actionMaxJoinAmountLine =
    buildActionMaxJoinAmountLine(actionLimitDetail) || `行动单地址上限：${formatLimitAmount(groupDetail.actionMaxJoinAmount)}`;
  const lines = [
    '还可追加数量只限制新增追加，不影响已参与代币有效性。',
    '可追加数量取以下剩余额度中的最小值：',
    `1. 链群单地址剩余：${
      groupDetail.maxJoinAmount > BigInt(0)
        ? `${formatLimitAmount(groupDetail.maxJoinAmount)} - ${formatLimitAmount(oldAmount)} = ${formatRemainingAmount(
            groupDetail.maxJoinAmount - oldAmount,
          )}`
        : '不限，不参与最小值计算'
    }`,
    `2. ${actionMaxJoinAmountLine}\n行动单地址剩余：${formatLimitAmount(groupDetail.actionMaxJoinAmount)} - ${formatLimitAmount(
      oldAmount,
    )} = ${formatRemainingAmount(groupDetail.actionMaxJoinAmount - oldAmount)}`,
    `3. 链群剩余容量：${
      groupDetail.maxCapacity > BigInt(0)
        ? `${formatLimitAmount(groupDetail.maxCapacity)} - ${formatLimitAmount(groupDetail.totalJoinedAmount)} = ${formatLimitAmount(groupDetail.remainingCapacity)}`
        : '不限，不参与最小值计算'
    }`,
    '',
  ];

  if (result.amount > BigInt(0)) {
    lines.push(`所以当前还可追加 = ${formatLimitAmount(result.amount)}。`);
    lines.push(`当前最小剩余额度来自：${result.reason}。`);
  } else {
    lines.push('所以当前还可追加 = 0。');
    if (result.reason) lines.push(`不能继续追加的原因：${result.reason}。`);
  }

  lines.push(`我的当前参与 = ${formatLimitAmount(oldAmount)}，已参与代币仍有效。`);
  return lines.join('\n');
};

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

  // 如果没有任何限制条件，说明全部"无限制"
  if (limits.length === 0) {
    return { amount: BigInt(0), reason: '无限制' };
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
      reason:
        maxJoinRemaining > BigInt(0)
          ? `链群最大参与代币 ${formatTokenAmount(groupDetail.maxJoinAmount)}`
          : `已参与代币仍有效；当前已达到或超过链群最大参与代币 ${formatTokenAmount(
              groupDetail.maxJoinAmount,
            )}，不能继续追加`,
    });
  }

  // 2. 行动最大参与代币量减去已参与量
  const actionMaxJoinRemaining = groupDetail.actionMaxJoinAmount - oldAmount;
  limits.push({
    amount: actionMaxJoinRemaining,
    reason:
      actionMaxJoinRemaining > BigInt(0)
        ? `行动参与代币上限 ${formatTokenAmount(groupDetail.actionMaxJoinAmount)}`
        : `已参与代币仍有效；当前已达到或超过行动参与代币上限 ${formatTokenAmount(
            groupDetail.actionMaxJoinAmount,
          )}，不能继续追加`,
  });

  // 3. 链群剩余容量（maxCapacity为0时表示无限制，不添加）
  if (groupDetail.maxCapacity > BigInt(0)) {
    limits.push({
      amount: groupDetail.remainingCapacity,
      reason: `链群剩余容量 ${formatTokenAmount(groupDetail.remainingCapacity)}`,
    });
  }

  // 如果没有任何限制条件，说明全部"无限制"
  if (limits.length === 0) {
    return { amount: BigInt(0), reason: '无限制' };
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
