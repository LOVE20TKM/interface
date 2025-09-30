/**
 * 验证者打分相关的工具函数
 */

/**
 * 将原始分数缩放到0-100的整数范围
 * @param scores 原始分数映射 { address: bigint }
 * @returns 缩放后的分数映射 { address: string }
 */
export function scaleScoresToPercentage(scores: { [address: string]: bigint }): { [address: string]: string } {
  const scoreValues = Object.values(scores);
  console.log('scoreValues', scoreValues);
  // 如果没有分数，返回空对象
  if (scoreValues.length === 0) {
    return {};
  }

  // 找到最大分数
  const maxScore = scoreValues.reduce((max, score) => (score > max ? score : max), BigInt(0));

  // 如果最大分数为0，所有分数都设为0
  if (maxScore === BigInt(0)) {
    const result: { [address: string]: string } = {};
    Object.keys(scores).forEach((address) => {
      result[address] = '0';
    });
    return result;
  }

  // 按比例缩放到0-100，使用 BigInt 运算保持精度
  const scaledScores: { [address: string]: string } = {};
  Object.entries(scores).forEach(([address, score]) => {
    // 使用 BigInt 进行精确的四舍五入计算
    // 计算商和余数，判断是否需要进位
    const quotient = (score * BigInt(1000)) / maxScore;
    const remainder = (score * BigInt(1000)) % maxScore;

    // 如果 remainder * 2 >= maxScore，则需要进位（四舍五入）
    const scaledValue = remainder * BigInt(2) >= maxScore ? Number(quotient) + 1 : Number(quotient);

    scaledScores[address] = scaledValue.toString();
  });

  return scaledScores;
}

/**
 * 为验证者打分添加0地址（弃权票）
 * @param accounts 原始账户数组
 * @returns 包含0地址的账户数组
 */
export function addAbstentionAddress(accounts: `0x${string}`[]): `0x${string}`[] {
  const result = [...accounts];
  const abstentionAddress = '0x0000000000000000000000000000000000000000' as `0x${string}`;

  // 避免重复添加
  if (!result.includes(abstentionAddress)) {
    result.push(abstentionAddress);
  }

  return result;
}

/**
 * 从分数映射中提取弃权票分数
 * @param scoresMap 分数映射
 * @returns 弃权票分数（字符串格式）
 */
export function extractAbstentionScore(scoresMap: { [address: string]: string }): string {
  const abstentionAddress = '0x0000000000000000000000000000000000000000';
  return scoresMap[abstentionAddress] || '0';
}

/**
 * 从分数映射中移除弃权票，返回只包含真实地址的分数映射
 * @param scoresMap 包含弃权票的分数映射
 * @returns 不包含弃权票的分数映射
 */
export function removeAbstentionFromScores(scoresMap: { [address: string]: string }): { [address: string]: string } {
  const result = { ...scoresMap };
  delete result['0x0000000000000000000000000000000000000000'];
  return result;
}
