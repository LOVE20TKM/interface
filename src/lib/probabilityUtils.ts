/**
 * 概率计算工具函数
 * 用于计算行动参与的概率相关信息
 */

/**
 * 【新加入新动】计算达到100%被抽中概率所需的最少代币数（不考虑已有代币）
 *
 * 要达到100%概率: myAmount / totalAmount = 1 / maxRandomAccounts
 *
 * @param totalAmount 行动的总代币数
 * @param maxRandomAccounts 最大随机抽取人数
 * @returns 达到100%概率所需的最少代币数
 */
export function calculateTokensFor100Percent(totalAmount: bigint, maxRandomAccounts: number): bigint {
  if (maxRandomAccounts <= 0 || totalAmount <= BigInt(0) || maxRandomAccounts === 1) {
    return BigInt(0);
  }

  const requiredAmount = totalAmount / (BigInt(maxRandomAccounts) - BigInt(1));
  return requiredAmount;
}
/**
 * 【追加参与代币】计算还需要多少代币才能达到100%被抽中概率
 *
 * @param myAmount 我当前持有的代币数
 * @param totalAmount 行动的总代币数
 * @param maxRandomAccounts 最大随机抽取人数
 * @returns 还需要的代币数，如果已经达到100%则返回0
 */
export function calculateTokensNeededFor100Percent(
  myAmount: bigint,
  totalAmount: bigint,
  maxRandomAccounts: number,
): bigint {
  // 边界情况处理
  if (maxRandomAccounts <= 0 || totalAmount <= BigInt(0)) {
    return BigInt(0);
  }

  // 如果 maxRandomAccounts == 1，任何参与都是100%
  if (maxRandomAccounts === 1) {
    return BigInt(0);
  }

  // 计算分子: totalAmount - myAmount * maxRandomAccounts
  const numerator = totalAmount - myAmount * BigInt(maxRandomAccounts);

  // 如果分子 <= 0，说明已经达到或超过100%
  if (numerator <= BigInt(0)) {
    return BigInt(0);
  }

  // 向上取整：(numerator + denominator - 1) / denominator
  const needed = numerator / BigInt(maxRandomAccounts - 1);

  return needed > BigInt(0) ? needed : BigInt(0);
}

/**
 * 计算当前的被抽中概率（百分比）
 *
 * @param myAmount 我当前持有的代币数
 * @param totalAmount 行动的总代币数
 * @param maxRandomAccounts 最大随机抽取人数
 * @returns 被抽中的概率（0-100）
 */
export function calculateProbability(myAmount: bigint, totalAmount: bigint, maxRandomAccounts: number): number {
  if (totalAmount <= BigInt(0) || maxRandomAccounts <= 0 || myAmount <= BigInt(0)) {
    return 0;
  }

  const participationRatio = (Number(myAmount) / Number(totalAmount)) * 100;
  const probability = Math.min(participationRatio * maxRandomAccounts, 100);

  return probability;
}
