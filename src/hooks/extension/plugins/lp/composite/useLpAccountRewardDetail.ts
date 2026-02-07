// hooks/extension/plugins/lp/composite/useLpAccountRewardDetail.ts
// 获取LP激励计算详情数据

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { ExtensionLpAbi } from '@/src/abis/ExtensionLp';
import { LOVE20JoinAbi } from '@/src/abis/LOVE20Join';
import { safeToBigInt } from '@/src/lib/clientUtils';

const JOIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN as `0x${string}`;

const PRECISION = BigInt(1e18);

export interface LpAccountRewardDetailData {
  // 原始数据
  totalReward: bigint; // 总激励
  userReward: bigint; // 用户实际激励（mintReward）
  userBurnReward: bigint; // 用户销毁激励
  userLp: bigint; // 用户LP（参与LP代币数量）
  totalLp: bigint; // 总参与LP代币数量
  phaseBlocks: bigint; // 轮次区块数
  originBlocks: bigint; // 起始区块
  govRatioMultiplier: bigint; // 治理票占比倍数

  // 当轮扣除数据
  totalDeduction: bigint; // 当轮扣除量（当前用户）
  roundTotalDeduction: bigint; // 当轮总扣除量（所有用户）
  joinBlocks: bigint[]; // 当轮各次加入的区块号
  joinAmounts: bigint[]; // 当轮各次加入的代币数量

  // 计算结果
  lpRatioPercent: number; // LP占比（%）
  govRatioPercent: number; // 实际治理票占比（%，未乘以倍数）
  effectiveLp: bigint; // 有效LP代币数量 = userLp - totalDeduction
  totalEffectiveLp: bigint; // 总有效LP代币数量 = totalLp - roundTotalDeduction
  effectiveLpRatioPercent: number; // 有效LP占比（%）= effectiveLp / totalEffectiveLp
  theoreticalReward: bigint; // 理论激励/锁定激励 = totalReward × 有效LP占比
  hasGovShortage: boolean; // 是否因治理票不足导致销毁（考虑了精度容差）

  // 区块详情
  roundStartBlock: bigint; // 本轮起始区块
}

export interface UseLpAccountRewardDetailParams {
  extensionAddress: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
  account: `0x${string}` | undefined;
  round: bigint | undefined;
  enabled?: boolean;
}

export interface UseLpAccountRewardDetailResult {
  data: LpAccountRewardDetailData | null;
  isPending: boolean;
  error: any;
}

/**
 * Hook: 获取LP激励计算详情数据
 *
 * 批量获取所有必要数据，直接从合约获取治理票占比
 *
 * @param extensionAddress LP扩展合约地址
 * @param tokenAddress Token地址
 * @param account 用户地址
 * @param round 轮次
 * @param enabled 是否启用查询
 * @returns 激励详情数据、加载状态和错误信息
 */
export const useLpAccountRewardDetail = ({
  extensionAddress,
  tokenAddress,
  account,
  round,
  enabled = true,
}: UseLpAccountRewardDetailParams): UseLpAccountRewardDetailResult => {
  // 构建合约调用数组（10个调用）
  const contracts = useMemo(() => {
    if (!extensionAddress || !tokenAddress || !account || round === undefined || !enabled) {
      return [];
    }

    return [
      // 0: 总激励
      {
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'reward',
        args: [round],
      },
      // 1: 用户实际激励详情 (mintReward, burnReward, isClaimed)
      {
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'rewardByAccount',
        args: [round, account],
      },
      // 2: 用户LP (按轮次)
      {
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'joinedAmountByAccountByRound',
        args: [account, round],
      },
      // 3: 总LP (按轮次)
      {
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'joinedAmountByRound',
        args: [round],
      },
      // 4: 治理票占比倍数
      {
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'GOV_RATIO_MULTIPLIER',
        args: [],
      },
      // 5: phaseBlocks
      {
        address: JOIN_CONTRACT_ADDRESS,
        abi: LOVE20JoinAbi,
        functionName: 'phaseBlocks',
        args: [],
      },
      // 6: originBlocks
      {
        address: JOIN_CONTRACT_ADDRESS,
        abi: LOVE20JoinAbi,
        functionName: 'originBlocks',
        args: [],
      },
      // 7: 当轮扣除量及加入记录 (totalDeduction, joinBlocks[], joinAmounts[])
      {
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'deduction',
        args: [round, account],
      },
      // 8: 用户的实际治理票占比 (ratio, claimed)
      {
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'govRatio',
        args: [round, account],
      },
      // 9: 当轮总扣除量（所有用户）
      {
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'totalDeduction',
        args: [round],
      },
    ];
  }, [extensionAddress, tokenAddress, account, round, enabled]);

  const {
    data: contractData,
    isPending,
    error,
  } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: contracts.length > 0,
    },
  });

  // 解析和计算数据
  const result = useMemo(() => {
    if (!contractData || contractData.length === 0) {
      return null;
    }

    // 提取原始数据
    const totalReward = contractData[0]?.result ? safeToBigInt(contractData[0].result) : BigInt(0);
    const rewardInfo = contractData[1]?.result as [bigint, bigint, boolean] | undefined;
    const userReward = rewardInfo ? safeToBigInt(rewardInfo[0]) : BigInt(0);
    // 忽略很小的 burnReward 值（小于 1e11 时认为是 0，避免精度误差）
    const rawBurnReward = rewardInfo ? safeToBigInt(rewardInfo[1]) : BigInt(0);
    const userBurnReward = rawBurnReward < BigInt(1e11) ? BigInt(0) : rawBurnReward;

    const userLp = contractData[2]?.result ? safeToBigInt(contractData[2].result) : BigInt(0);
    const totalLp = contractData[3]?.result ? safeToBigInt(contractData[3].result) : BigInt(0);
    const govRatioMultiplier = contractData[4]?.result ? safeToBigInt(contractData[4].result) : BigInt(0);
    const phaseBlocks = contractData[5]?.result ? safeToBigInt(contractData[5].result) : BigInt(0);
    const originBlocks = contractData[6]?.result ? safeToBigInt(contractData[6].result) : BigInt(0);
    // 当轮扣除量及加入记录
    const deductionResult = contractData[7]?.result as [bigint, bigint[], bigint[]] | undefined;
    const totalDeduction = deductionResult ? safeToBigInt(deductionResult[0]) : BigInt(0);
    const joinBlocks = deductionResult ? deductionResult[1].map((b) => safeToBigInt(b)) : [];
    const joinAmounts = deductionResult ? deductionResult[2].map((a) => safeToBigInt(a)) : [];
    // 用户的实际治理票占比
    const govRatioInfo = contractData[8]?.result as [bigint, boolean] | undefined;
    const govRatio = govRatioInfo ? safeToBigInt(govRatioInfo[0]) : BigInt(0);
    // 当轮总扣除量（所有用户）
    const roundTotalDeduction = contractData[9]?.result ? safeToBigInt(contractData[9].result) : BigInt(0);

    // 计算理论激励/锁定激励（mintReward + burnReward）
    const theoreticalReward = userReward + userBurnReward;

    // 计算LP占比（参考值）
    let lpRatioPercent = 0;
    if (totalLp > BigInt(0) && userLp > BigInt(0)) {
      const lpRatio = (userLp * PRECISION) / totalLp;
      lpRatioPercent = (Number(lpRatio) / Number(PRECISION)) * 100;
    }

    // 计算有效LP代币数量及总有效LP代币数量
    const effectiveLp = userLp > totalDeduction ? userLp - totalDeduction : BigInt(0);
    const totalEffectiveLp = totalLp > roundTotalDeduction ? totalLp - roundTotalDeduction : BigInt(0);

    // 有效LP占比 = 有效LP代币数量 / 总有效LP代币数量
    let effectiveLpRatioPercent = 0;
    let effectiveLpRatio = BigInt(0);
    if (totalEffectiveLp > BigInt(0) && effectiveLp > BigInt(0)) {
      effectiveLpRatio = (effectiveLp * PRECISION) / totalEffectiveLp;
      effectiveLpRatioPercent = (Number(effectiveLpRatio) / Number(PRECISION)) * 100;
    }

    // 计算本轮起始区块
    const roundStartBlock = round !== undefined ? originBlocks + round * phaseBlocks : BigInt(0);

    // 使用合约返回的实际治理票占比
    let govRatioPercent = 0;
    if (govRatio > BigInt(0)) {
      govRatioPercent = (Number(govRatio) / Number(PRECISION)) * 100;
    }

    // 判断是否因治理票不足导致销毁
    let hasGovShortage = false;
    const hasGovLimit = govRatioMultiplier > BigInt(0);
    if (hasGovLimit && totalReward > BigInt(0)) {
      // 计算如果治理票充足情况下应该得到的激励（基于有效LP占比）
      // rewardIfGovSufficient = totalReward × effectiveLpRatio
      const rewardIfGovSufficient = (totalReward * effectiveLpRatio) / PRECISION;

      // 判断是否因治理票不足导致销毁
      // 注意：由于精度损失，需要添加容差。允许 0.1% 的计算误差
      const tolerance = rewardIfGovSufficient / BigInt(1000); // 0.1% 容差
      hasGovShortage = userReward + tolerance < rewardIfGovSufficient;
    }

    return {
      // 原始数据
      totalReward,
      userReward,
      userBurnReward,
      userLp,
      totalLp,
      phaseBlocks,
      originBlocks,
      govRatioMultiplier,

      // 当轮扣除数据
      totalDeduction,
      roundTotalDeduction,
      joinBlocks,
      joinAmounts,

      // 计算结果
      lpRatioPercent,
      govRatioPercent,
      effectiveLp,
      totalEffectiveLp,
      effectiveLpRatioPercent,
      theoreticalReward,
      hasGovShortage,

      // 区块详情
      roundStartBlock,
    };
  }, [contractData, round]);

  return {
    data: result,
    isPending,
    error,
  };
};
