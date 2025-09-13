/**
 * 业务逻辑相关的计算工具函数
 */

import { formatPercentage } from './format';
import { safeToBigInt } from './clientUtils';

/**
 * 计算治理质押的预计年化收益率(APY)
 * @param rewardForPhase 本轮治理激励总量
 * @param tokenAmountForSl 流动性质押的代币数量
 * @param stAmount 代币质押的数量
 * @returns 格式化后的APY字符串，如"12.5%"
 */
export const calculateAPY = (
  rewardForPhase: bigint | undefined,
  tokenAmountForSl: bigint | undefined,
  stAmount: bigint | undefined,
): string => {
  if (!rewardForPhase || !tokenAmountForSl) return '0%';

  // 年区块数 = 365天 * 86400秒/天 / 每个区块的秒数
  const blocksPerYear = (365 * 86400 * 1000) / Number(process.env.NEXT_PUBLIC_BLOCK_TIME_MS || 0);
  // 一个阶段的区块数
  const phaseBlocks = safeToBigInt(process.env.NEXT_PUBLIC_PHASE_BLOCKS || '0');
  if (blocksPerYear === 0 || phaseBlocks === BigInt(0)) {
    console.error('配置错误: NEXT_PUBLIC_BLOCK_TIME_MS 或 NEXT_PUBLIC_PHASE_BLOCKS 未设置');
    return '0%';
  }

  // 所有质押资产总和
  const totalStaked = (tokenAmountForSl * BigInt(2) || BigInt(0)) + (stAmount || BigInt(0));
  // 避免除以零
  if (totalStaked === BigInt(0)) {
    return '0%';
  }

  // 计算APY: (reward / totalStaked) / (phaseBlocks / blocksPerYear) * 100%
  const apy = (Number(rewardForPhase) / Number(totalStaked) / (Number(phaseBlocks) / blocksPerYear)) * 100;

  // 格式化APY，显示整数加2位小数，如果小数最后是0，则去掉
  return formatPercentage(apy);
};

/**
 * 计算行动激励的年化收益率(APY)
 * @param expectedReward 当轮行动激励
 * @param joinedAmount 参与行动代币
 * @returns 格式化后的APY百分比字符串
 */
export const calculateActionAPY = (expectedReward?: bigint, joinedAmount?: bigint): string => {
  // 如果没有数据，返回0%
  if (!expectedReward || !joinedAmount || joinedAmount === BigInt(0)) return '∞';

  // 年区块数 = 365天 * 86400秒/天 / 每个区块的秒数
  const blocksPerYear = (365 * 86400 * 1000) / Number(process.env.NEXT_PUBLIC_BLOCK_TIME_MS || 0);
  // 一个阶段的区块数
  const phaseBlocks = safeToBigInt(process.env.NEXT_PUBLIC_PHASE_BLOCKS || '0');

  if (blocksPerYear === 0 || phaseBlocks === BigInt(0)) {
    console.error('配置错误: BLOCK_TIME 或 PHASE_BLOCKS 未设置或为0');
    return '0%';
  }

  // 计算APY: 当轮行动激励 / 参与行动代币 / (一个阶段区块数/年区块数) * 100%
  const apy = (Number(expectedReward) / Number(joinedAmount) / (Number(phaseBlocks) / blocksPerYear)) * 100;

  // 格式化APY，显示整数加2位小数，如果小数最后是0，则去掉
  return formatPercentage(apy);
};

/**
 * 格式化阶段显示文本
 * @param phases 阶段数
 * @returns 格式化后的阶段文本，如"4阶段（1,000区块，约7天）"
 */
export const formatPhaseText = (phases: number, onlyBlockTime = false): string => {
  // 从环境变量获取配置
  const PHASE_BLOCKS = Number(process.env.NEXT_PUBLIC_PHASE_BLOCKS) || 0;
  const BLOCK_TIME = Number(process.env.NEXT_PUBLIC_BLOCK_TIME_MS) || 0; // 单位：百分之一秒

  // 计算总区块数
  const totalBlocks = phases * PHASE_BLOCKS;

  // 计算总时间（秒）
  const totalSeconds = Math.ceil((totalBlocks * BLOCK_TIME) / 1000);

  // 计算时间显示
  let timeDisplay: string;

  if (totalSeconds >= 24 * 60 * 60) {
    // 超过1天，显示天数
    const days = Math.ceil(totalSeconds / (24 * 60 * 60));
    timeDisplay = `${days}天`;
  } else if (totalSeconds >= 60 * 60) {
    // 超过1小时但不够1天，显示小时数
    const hours = Math.ceil(totalSeconds / (60 * 60));
    timeDisplay = `${hours}小时`;
  } else {
    // 不够1小时，显示分钟数
    const minutes = Math.ceil(totalSeconds / 60);
    timeDisplay = `${minutes}分钟`;
  }

  let result = `${totalBlocks.toLocaleString()}区块，约${timeDisplay}`;
  if (!onlyBlockTime) {
    result = `${phases}个阶段（${result})`;
  }
  return result;
};

/**
 * 计算行动激励的预期激励
 * @param rewardAvailable 可用激励总量
 * @param displayRound 显示的轮次（从1开始）
 * @returns 计算得出的预期激励数量
 */
export const calculateExpectedActionReward = (rewardAvailable: bigint | undefined, displayRound: bigint): bigint => {
  if (!rewardAvailable) {
    return BigInt(0);
  }

  // 计算剩余激励比例
  const rewardLeftRatio =
    BigInt(1000) -
    safeToBigInt(process.env.NEXT_PUBLIC_ROUND_REWARD_GOV_PER_THOUSAND || '5') -
    safeToBigInt(process.env.NEXT_PUBLIC_ROUND_REWARD_ACTION_PER_THOUSAND || '5');

  let expectedReward = BigInt(0);

  if (displayRound <= BigInt(1)) {
    // 第1轮：rewardAvailable * 0.01 / 2 (or 5 / 1000)
    expectedReward =
      (rewardAvailable * safeToBigInt(process.env.NEXT_PUBLIC_ROUND_REWARD_ACTION_PER_THOUSAND || '0')) / BigInt(1000);
  } else {
    // >=第2轮：rewardAvailable * 0.99 * 0.01 / 2 (or 99 * 5 / 1000000)
    expectedReward =
      (rewardAvailable *
        rewardLeftRatio *
        safeToBigInt(process.env.NEXT_PUBLIC_ROUND_REWARD_ACTION_PER_THOUSAND || '0')) /
      BigInt(1000000);
  }

  return expectedReward;
};

/**
 * 计算治理激励的预期激励
 * @param rewardAvailable 可用激励总量
 * @param displayRound 显示的轮次（从1开始）
 * @returns 计算得出的预期激励数量
 */
export const calculateExpectedGovReward = (rewardAvailable: bigint | undefined, displayRound: bigint): bigint => {
  if (!rewardAvailable) {
    return BigInt(0);
  }

  // 计算剩余激励比例
  const rewardLeftRatio =
    BigInt(1000) -
    safeToBigInt(process.env.NEXT_PUBLIC_ROUND_REWARD_GOV_PER_THOUSAND || '5') -
    safeToBigInt(process.env.NEXT_PUBLIC_ROUND_REWARD_ACTION_PER_THOUSAND || '5');

  let expectedReward = BigInt(0);

  if (displayRound === BigInt(1)) {
    // 第1轮：rewardAvailable * 0.01 / 2 (or 5 / 1000)
    expectedReward =
      (rewardAvailable * safeToBigInt(process.env.NEXT_PUBLIC_ROUND_REWARD_GOV_PER_THOUSAND || '0')) / BigInt(1000);
  } else if (displayRound === BigInt(2)) {
    // 第2轮：rewardAvailable * 0.99 * 0.01 / 2 (or 99 * 5 / 1000000)
    expectedReward =
      (rewardAvailable * rewardLeftRatio * safeToBigInt(process.env.NEXT_PUBLIC_ROUND_REWARD_GOV_PER_THOUSAND || '0')) /
      BigInt(1000000);
  } else {
    // >=第3轮：rewardAvailable * 0.99 * 0.99 * 0.01 / 2 (or 99 * 99 * 5 / 1000000000)
    expectedReward =
      (rewardAvailable *
        rewardLeftRatio *
        rewardLeftRatio *
        safeToBigInt(process.env.NEXT_PUBLIC_ROUND_REWARD_GOV_PER_THOUSAND || '0')) /
      BigInt(1000000000);
  }

  return expectedReward;
};
