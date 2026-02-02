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
  userLp: bigint; // 用户LP
  totalLp: bigint; // 总LP
  joinedRound: bigint; // 用户加入轮次
  joinedBlock: bigint; // 用户加入区块
  phaseBlocks: bigint; // 轮次区块数
  originBlocks: bigint; // 起始区块
  govRatioMultiplier: bigint; // 治理票占比倍数

  // 计算结果（百分比）
  lpRatioPercent: number; // LP占比（%）
  govRatioPercent: number; // 推算的原始治理票占比（%，未乘以倍数）
  govRatioIsEstimate: boolean; // true表示 "≥"（无销毁），false表示 "≈"（有销毁）
  blockRatioPercent: number; // 加入轮时长比例（%）
  actualRewardRatioPercent: number; // 实际激励比例（%）
  theoreticalReward: bigint; // 理论激励（用于显示销毁计算）
  hasGovShortage: boolean; // 是否因治理票不足导致销毁（考虑了精度容差）
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
 * 批量获取所有必要数据，并通过逆向推算计算治理票占比
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
  // 构建合约调用数组（从10个减少到7个）
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
        functionName: 'rewardInfoByAccount',
        args: [round, account],
      },
      // 2: 用户加入信息 (joinedRound, amount, joinedBlock, exitableBlock)
      {
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'joinInfo',
        args: [account],
      },
      // 3: 用户LP (按轮次)
      {
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'joinedAmountByAccountByRound',
        args: [account, round],
      },
      // 4: 总LP (按轮次)
      {
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'joinedAmountByRound',
        args: [round],
      },
      // 5: 治理票占比倍数
      {
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'GOV_RATIO_MULTIPLIER',
        args: [],
      },
      // 6: phaseBlocks
      {
        address: JOIN_CONTRACT_ADDRESS,
        abi: LOVE20JoinAbi,
        functionName: 'phaseBlocks',
        args: [],
      },
      // 7: originBlocks
      {
        address: JOIN_CONTRACT_ADDRESS,
        abi: LOVE20JoinAbi,
        functionName: 'originBlocks',
        args: [],
      },
      // 8: 用户在指定轮次的加入区块（不为0说明是首轮加入）
      {
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'lastJoinedBlockByAccountByJoinedRound',
        args: [account, round],
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

    const joinInfo = contractData[2]?.result as [bigint, bigint, bigint, bigint] | undefined;
    const joinedRound = joinInfo ? safeToBigInt(joinInfo[0]) : BigInt(0);
    const joinedBlock = joinInfo ? safeToBigInt(joinInfo[2]) : BigInt(0);

    const userLp = contractData[3]?.result ? safeToBigInt(contractData[3].result) : BigInt(0);
    const totalLp = contractData[4]?.result ? safeToBigInt(contractData[4].result) : BigInt(0);
    const govRatioMultiplier = contractData[5]?.result ? safeToBigInt(contractData[5].result) : BigInt(0);
    const phaseBlocks = contractData[6]?.result ? safeToBigInt(contractData[6].result) : BigInt(0);
    const originBlocks = contractData[7]?.result ? safeToBigInt(contractData[7].result) : BigInt(0);
    // 用户在指定轮次的加入区块（不为0说明是首轮加入，值就是加入区块）
    const lastJoinedBlockByRound = contractData[8]?.result ? safeToBigInt(contractData[8].result) : BigInt(0);

    // 计算理论激励（mintReward + burnReward）
    const theoreticalReward = userReward + userBurnReward;

    // 计算LP占比
    let lpRatioPercent = 0;
    if (totalLp > BigInt(0) && userLp > BigInt(0)) {
      const lpRatio = (userLp * PRECISION) / totalLp;
      lpRatioPercent = (Number(lpRatio) / Number(PRECISION)) * 100;
    }

    // 计算加入轮时长比例（lastJoinedBlockByRound 不为0说明是首轮加入）
    let blockRatioPercent = 100;
    let blockRatio = PRECISION;
    if (!!round && lastJoinedBlockByRound > BigInt(0) && phaseBlocks > BigInt(0)) {
      const roundEndBlock = originBlocks + (round + BigInt(1)) * phaseBlocks - BigInt(1);
      const blocksInRound = roundEndBlock - lastJoinedBlockByRound + BigInt(1);
      blockRatio = (blocksInRound * PRECISION) / phaseBlocks;
      blockRatioPercent = (Number(blockRatio) / Number(PRECISION)) * 100;
    }

    // 逆向推算治理票占比
    let govRatioPercent = 0;
    let govRatioIsEstimate = false;
    let hasGovShortage = false; // 是否因治理票不足导致销毁
    const hasGovLimit = govRatioMultiplier > BigInt(0);

    if (hasGovLimit && totalReward > BigInt(0)) {
      // 计算如果治理票充足情况下应该得到的激励（只考虑首轮区块比例）
      // rewardIfGovSufficient = theoreticalReward × blockRatio
      const rewardIfGovSufficient = (theoreticalReward * blockRatio) / PRECISION;

      // 判断是否因治理票不足导致销毁
      // 注意：由于精度损失，需要添加容差。允许 0.1% 的计算误差
      const tolerance = rewardIfGovSufficient / BigInt(1000); // 0.1% 容差
      hasGovShortage = userReward + tolerance < rewardIfGovSufficient;

      if (hasGovShortage) {
        // 治理票不足，可以精确计算治理票占比
        // actualReward = govRatio × govMultiplier × blockRatio × totalReward
        // govRatio = actualReward / (govMultiplier × blockRatio × totalReward)
        const actualRatioBigInt = (userReward * PRECISION) / totalReward;
        const actualRatioPercent = (Number(actualRatioBigInt) / Number(PRECISION)) * 100;
        govRatioPercent = actualRatioPercent / (Number(govRatioMultiplier) * (blockRatioPercent / 100));
        govRatioIsEstimate = false; // 显示 "≈"，可以精确计算
      } else {
        // 治理票充足，只能给出下限
        // govRatio × govMultiplier >= lpRatio
        // govRatio >= lpRatio / govMultiplier
        govRatioPercent = lpRatioPercent / Number(govRatioMultiplier);
        govRatioIsEstimate = true; // 显示 "≥"，只能给出下限
      }
    } else if (!hasGovLimit) {
      // 没有治理票限制
      govRatioPercent = 100;
      govRatioIsEstimate = false;
    }

    // 计算实际激励比例
    let actualRewardRatioPercent = 0;
    if (totalReward > BigInt(0) && userReward > BigInt(0)) {
      const rewardRatio = (userReward * PRECISION) / totalReward;
      actualRewardRatioPercent = (Number(rewardRatio) / Number(PRECISION)) * 100;
    }

    return {
      // 原始数据
      totalReward,
      userReward,
      userBurnReward,
      userLp,
      totalLp,
      joinedRound,
      joinedBlock,
      phaseBlocks,
      originBlocks,
      govRatioMultiplier,

      // 计算结果
      lpRatioPercent,
      govRatioPercent,
      govRatioIsEstimate,
      blockRatioPercent,
      actualRewardRatioPercent,
      theoreticalReward,
      hasGovShortage,
    };
  }, [contractData, round]);

  return {
    data: result,
    isPending,
    error,
  };
};
