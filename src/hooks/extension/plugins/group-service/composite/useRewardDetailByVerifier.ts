/**
 * Hook: 获取服务者在某轮次的激励明细
 *
 * 功能：
 * 1. 使用 actionIdsByVerifier 获取该验证者在指定轮次验证的行动ID
 * 2. 获取每个行动的扩展合约地址
 * 3. 使用 GroupVerify.groupIdsByVerifier 获取服务者在指定轮次验证的链群
 * 4. 批量调用 rewardDistribution 获取每个链群的激励分配明细
 * 5. 批量调用 generatedActionRewardByGroupId 获取各链群总铸币量
 * 6. 批量获取行动名称（使用缓存）
 * 7. 批量获取链群名称
 *
 * 返回按行动分组的激励数据结构
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { ExtensionGroupActionAbi } from '@/src/abis/ExtensionGroupAction';
import { ExtensionGroupServiceAbi } from '@/src/abis/ExtensionGroupService';
import { GroupVerifyAbi } from '@/src/abis/GroupVerify';
import { useActionIdsByVerifier } from '@/src/hooks/extension/plugins/group/contracts/useGroupVerify';
import { useActionBaseInfosByIdsWithCache } from '@/src/hooks/composite/useActionBaseInfosByIdsWithCache';
import { useGroupNames } from '@/src/hooks/extension/base/composite/useGroupNames';
import { useExtensionsByActionIdsWithCache } from '@/src/hooks/extension/base/composite/useExtensionsByActionIdsWithCache';

// ==================== 常量定义 ====================

const GROUP_VERIFY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY as `0x${string}`;

// ==================== 类型定义 ====================

/**
 * 链群激励信息
 */
export interface GroupRewardInfo {
  /** 链群NFT */
  groupId: bigint;
  /** 链群名称 */
  groupName: string | undefined;
  /** 链群总铸币量 */
  totalGenerated: bigint;
  /** 服务者剩余激励 */
  ownerAmount: bigint;
  /** 已分配激励 */
  distributedAmount: bigint;
  /** 是否有二次分配 */
  hasRecipients: boolean;
}

/**
 * 服务者激励汇总信息（溢出计算相关）
 */
export interface VerifierRewardSummary {
  /** 可铸造激励 */
  mintReward: bigint;
  /** 销毁激励 */
  burnReward: bigint;
  /** 是否已领取 */
  claimed: boolean;
  /** 行动总激励 */
  totalReward: bigint;
  /** 服务者铸币量 */
  verifierGenerated: bigint;
  /** 总铸币量 */
  totalGenerated: bigint;
  /** 治理票占比倍数 */
  govRatioMultiplier: bigint;
  /** 铸币量占比（%） */
  generatedRatioPercent: number;
  /** 推算的治理票占比（%） */
  govRatioPercent: number;
  /** 是否有溢出销毁 */
  hasOverflow: boolean;
}

/**
 * 行动激励信息
 */
export interface ActionRewardInfo {
  /** 行动 ID */
  actionId: bigint;
  /** 行动标题 */
  actionTitle: string;
  /** 链群激励列表 */
  groupRewards: GroupRewardInfo[];
}

/**
 * Hook 参数
 */
export interface UseRewardDetailByVerifierParams {
  /** 扩展合约地址 */
  extensionAddress: `0x${string}` | undefined;
  /** 链群行动代币地址 */
  groupActionTokenAddress: `0x${string}` | undefined;
  /** 轮次 */
  round: bigint | undefined;
  /** 服务者地址 */
  verifier: `0x${string}` | undefined;
}

/**
 * Hook 返回值
 */
export interface UseRewardDetailByVerifierResult {
  /** 按行动分组的激励数据 */
  actionRewards: ActionRewardInfo[];
  /** 服务者激励汇总信息（溢出计算相关） */
  verifierRewardSummary: VerifierRewardSummary | null;
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: Error | null;
}

// ==================== Hook 实现 ====================

/**
 * 获取服务者在某轮次的激励明细
 *
 * @param params - Hook 参数
 * @returns 按行动分组的激励数据
 */
export function useRewardDetailByVerifier(params: UseRewardDetailByVerifierParams): UseRewardDetailByVerifierResult {
  const { extensionAddress, groupActionTokenAddress, round, verifier } = params;

  // ==========================================
  // 第一步：使用 actionIdsByVerifier 获取该验证者在指定轮次验证的行动ID
  // ==========================================
  const {
    actionIds: allActionIds,
    isPending: isActionIdsPending,
    error: actionIdsError,
  } = useActionIdsByVerifier(groupActionTokenAddress, round, verifier);

  // ==========================================
  // 第二步：获取每个行动的扩展合约地址
  // ==========================================
  const { extensions, isPending: isExtensionsPending } = useExtensionsByActionIdsWithCache({
    token: { address: groupActionTokenAddress as `0x${string}` } as any,
    actionIds: allActionIds || [],
    enabled: !!groupActionTokenAddress && !!allActionIds && allActionIds.length > 0,
  });

  // 创建 actionId 到扩展合约地址的映射
  const extensionAddressMap = useMemo(() => {
    const map = new Map<bigint, `0x${string}`>();
    extensions.forEach((ext) => {
      if (ext.isExtension && ext.extensionAddress) {
        map.set(ext.actionId, ext.extensionAddress);
      }
    });
    return map;
  }, [extensions]);

  // ==========================================
  // 第三步：批量获取服务者在指定轮次验证的链群
  // ==========================================
  const groupIdsContracts = useMemo(() => {
    if (!round || !verifier || !extensions || extensions.length === 0) {
      return [];
    }

    return extensions
      .filter((ext) => ext.isExtension && ext.extensionAddress)
      .map((ext) => ({
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'groupIdsByVerifier' as const,
        args: [ext.extensionAddress!, round, verifier] as const,
      }));
  }, [round, verifier, extensions]);

  const {
    data: groupIdsData,
    isPending: isGroupIdsPending,
    error: groupIdsError,
  } = useReadContracts({
    contracts: groupIdsContracts,
    query: {
      enabled: !!round && !!verifier && groupIdsContracts.length > 0 && !isActionIdsPending && !isExtensionsPending,
    },
  });

  // 解析数据，提取所有唯一的 actionId 和 groupIdsByAction
  const { actionIds, groupIdsByAction, actionGroupPairs } = useMemo(() => {
    if (!groupIdsData || !extensions || extensions.length === 0) {
      return {
        actionIds: [],
        groupIdsByAction: new Map<bigint, bigint[]>(),
        actionGroupPairs: [] as Array<{ actionId: bigint; groupId: bigint }>,
      };
    }

    const actionSet = new Set<bigint>();
    const groupMap = new Map<bigint, bigint[]>();
    const pairs: Array<{ actionId: bigint; groupId: bigint }> = [];

    // 遍历查询结果，建立 actionId -> groupIds 映射
    groupIdsData.forEach((result, index) => {
      if (result?.status === 'success' && result.result) {
        const extension = extensions.filter((ext) => ext.isExtension && ext.extensionAddress)[index];
        if (!extension) return;

        const actionId = extension.actionId;
        const groupIds = result.result as bigint[];

        if (groupIds.length > 0) {
          actionSet.add(actionId);

          if (!groupMap.has(actionId)) {
            groupMap.set(actionId, []);
          }

          groupIds.forEach((groupId) => {
            groupMap.get(actionId)!.push(groupId);
            pairs.push({ actionId, groupId });
          });
        }
      }
    });

    return {
      actionIds: Array.from(actionSet),
      groupIdsByAction: groupMap,
      actionGroupPairs: pairs,
    };
  }, [groupIdsData, extensions]);

  // ==========================================
  // 第四步：批量获取每个链群的激励分配明细 + 服务者激励汇总数据
  // ==========================================
  const rewardDistributionContracts = useMemo(() => {
    if (!extensionAddress || !round || !verifier || actionGroupPairs.length === 0) {
      return [];
    }

    return actionGroupPairs.map(({ actionId, groupId }) => ({
      address: extensionAddress,
      abi: ExtensionGroupServiceAbi,
      functionName: 'rewardDistribution' as const,
      args: [verifier, round, actionId, groupId] as const,
    }));
  }, [extensionAddress, round, verifier, actionGroupPairs]);

  const {
    data: rewardDistributionData,
    isPending: isRewardDistributionPending,
    error: rewardDistributionError,
  } = useReadContracts({
    contracts: rewardDistributionContracts,
    query: {
      enabled:
        !!extensionAddress && !!round && !!verifier && rewardDistributionContracts.length > 0 && !isGroupIdsPending,
    },
  });

  // ==========================================
  // 第四步-B：批量获取服务者激励汇总数据（用于溢出计算）
  // ==========================================
  const verifierSummaryContracts = useMemo(() => {
    if (!extensionAddress || !round || !verifier) {
      return [];
    }

    return [
      // 0: 服务者激励详情 (mintReward, burnReward, claimed)
      {
        address: extensionAddress,
        abi: ExtensionGroupServiceAbi,
        functionName: 'rewardByAccount' as const,
        args: [round, verifier] as const,
      },
      // 1: 行动总激励
      {
        address: extensionAddress,
        abi: ExtensionGroupServiceAbi,
        functionName: 'reward' as const,
        args: [round] as const,
      },
      // 2: 服务者铸币量
      {
        address: extensionAddress,
        abi: ExtensionGroupServiceAbi,
        functionName: 'generatedActionRewardByVerifier' as const,
        args: [verifier, round] as const,
      },
      // 3: 总铸币量
      {
        address: extensionAddress,
        abi: ExtensionGroupServiceAbi,
        functionName: 'generatedActionReward' as const,
        args: [round] as const,
      },
      // 4: 治理票占比倍数
      {
        address: extensionAddress,
        abi: ExtensionGroupServiceAbi,
        functionName: 'GOV_RATIO_MULTIPLIER' as const,
        args: [] as const,
      },
    ];
  }, [extensionAddress, round, verifier]);

  const {
    data: verifierSummaryData,
    isPending: isVerifierSummaryPending,
    error: verifierSummaryError,
  } = useReadContracts({
    contracts: verifierSummaryContracts as any,
    query: {
      enabled: !!extensionAddress && !!round && !!verifier && verifierSummaryContracts.length > 0,
    },
  });

  // 构建 (actionId, groupId) -> distribution 的映射
  const distributionMap = useMemo(() => {
    const map = new Map<
      string,
      {
        addrs: `0x${string}`[];
        basisPoints: bigint[];
        amounts: bigint[];
        ownerAmount: bigint;
      }
    >();

    if (!rewardDistributionData || actionGroupPairs.length === 0) {
      return map;
    }

    rewardDistributionData.forEach((result, index) => {
      if (result?.status === 'success' && result.result) {
        const { actionId, groupId } = actionGroupPairs[index];
        const key = `${actionId.toString()}-${groupId.toString()}`;
        const data = result.result as [`0x${string}`[], bigint[], bigint[], bigint];
        map.set(key, {
          addrs: data[0],
          basisPoints: data[1],
          amounts: data[2],
          ownerAmount: data[3],
        });
      }
    });

    return map;
  }, [rewardDistributionData, actionGroupPairs]);

  // ==========================================
  // 第五步：批量获取链群总铸币量
  // ==========================================
  const generatedRewardContracts = useMemo(() => {
    if (!round || actionGroupPairs.length === 0 || extensionAddressMap.size === 0) {
      return [];
    }

    // 为每个 (actionId, groupId) 组合构建一个查询配置，使用对应 actionId 的扩展合约地址
    return actionGroupPairs
      .map(({ actionId, groupId }) => {
        const extensionAddr = extensionAddressMap.get(actionId);
        if (!extensionAddr) {
          return null;
        }
        return {
          address: extensionAddr,
          abi: ExtensionGroupActionAbi,
          functionName: 'generatedActionRewardByGroupId' as const,
          args: [round, groupId] as const,
        };
      })
      .filter((contract): contract is NonNullable<typeof contract> => contract !== null);
  }, [round, actionGroupPairs, extensionAddressMap]);

  const {
    data: generatedRewardsData,
    isPending: isGeneratedRewardsPending,
    error: generatedRewardsError,
  } = useReadContracts({
    contracts: generatedRewardContracts,
    query: {
      enabled: !!round && actionGroupPairs.length > 0 && generatedRewardContracts.length > 0 && !isGroupIdsPending,
    },
  });

  // ==========================================
  // 第六步：批量获取行动名称
  // ==========================================
  const { actionInfos, isPending: isActionInfosPending } = useActionBaseInfosByIdsWithCache({
    tokenAddress: groupActionTokenAddress,
    actionIds,
    enabled: actionIds.length > 0,
  });

  // ==========================================
  // 第七步：批量获取链群名称
  // ==========================================
  const allGroupIds = useMemo(() => {
    if (actionGroupPairs.length === 0) return [];
    return actionGroupPairs.map(({ groupId }) => groupId);
  }, [actionGroupPairs]);

  const { groupNameMap, isPending: isGroupNamesPending } = useGroupNames(allGroupIds, allGroupIds.length > 0);

  // ==========================================
  // 第七步-B：计算服务者激励汇总（溢出计算）
  // ==========================================
  const PRECISION = BigInt(1e18);

  const verifierRewardSummary = useMemo((): VerifierRewardSummary | null => {
    if (!verifierSummaryData || verifierSummaryData.length < 5) {
      return null;
    }

    // 解析数据
    const rewardByAccountResult = verifierSummaryData[0]?.result as [bigint, bigint, boolean] | undefined;
    const mintReward = rewardByAccountResult ? rewardByAccountResult[0] : BigInt(0);
    // 忽略很小的 burnReward 值（小于 1e11 时认为是 0，避免精度误差）
    const rawBurnReward = rewardByAccountResult ? rewardByAccountResult[1] : BigInt(0);
    const burnReward = rawBurnReward < BigInt(1e11) ? BigInt(0) : rawBurnReward;
    const claimed = rewardByAccountResult ? rewardByAccountResult[2] : false;

    const totalReward = verifierSummaryData[1]?.result ? (verifierSummaryData[1].result as bigint) : BigInt(0);
    const verifierGenerated = verifierSummaryData[2]?.result ? (verifierSummaryData[2].result as bigint) : BigInt(0);
    const totalGenerated = verifierSummaryData[3]?.result ? (verifierSummaryData[3].result as bigint) : BigInt(0);
    const govRatioMultiplier = verifierSummaryData[4]?.result ? (verifierSummaryData[4].result as bigint) : BigInt(0);

    // 计算铸币量占比
    let generatedRatioPercent = 0;
    if (totalGenerated > BigInt(0) && verifierGenerated > BigInt(0)) {
      const generatedRatio = (verifierGenerated * PRECISION) / totalGenerated;
      generatedRatioPercent = (Number(generatedRatio) / Number(PRECISION)) * 100;
    }

    // 判断是否有溢出销毁
    const hasOverflow = burnReward > BigInt(0);
    const hasGovLimit = govRatioMultiplier > BigInt(0);

    // 逆向推算治理票占比
    let govRatioPercent = 0;
    if (hasGovLimit && totalReward > BigInt(0)) {
      if (hasOverflow) {
        // 治理票不足，可以精确计算治理票占比
        // actualReward = govRatio × govMultiplier × totalReward
        // govRatio = actualReward / (govMultiplier × totalReward)
        const actualRatioBigInt = (mintReward * PRECISION) / totalReward;
        const actualRatioPercent = (Number(actualRatioBigInt) / Number(PRECISION)) * 100;
        govRatioPercent = actualRatioPercent / Number(govRatioMultiplier);
      } else {
        // 治理票充足，只能给出下限
        // govRatio × govMultiplier >= generatedRatio
        // govRatio >= generatedRatio / govMultiplier
        govRatioPercent = generatedRatioPercent / Number(govRatioMultiplier);
      }
    } else if (!hasGovLimit) {
      // 没有治理票限制
      govRatioPercent = 100;
    }

    return {
      mintReward,
      burnReward,
      claimed,
      totalReward,
      verifierGenerated,
      totalGenerated,
      govRatioMultiplier,
      generatedRatioPercent,
      govRatioPercent,
      hasOverflow,
    };
  }, [verifierSummaryData]);

  // ==========================================
  // 第八步：组装数据
  // ==========================================
  // 创建 (actionId, groupId) 到 generatedRewardsData 索引的映射
  const actionGroupToRewardIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    let rewardIndex = 0;
    actionGroupPairs.forEach(({ actionId, groupId }) => {
      if (extensionAddressMap.has(actionId)) {
        const key = `${actionId.toString()}-${groupId.toString()}`;
        map.set(key, rewardIndex);
        rewardIndex++;
      }
    });
    return map;
  }, [actionGroupPairs, extensionAddressMap]);

  const actionRewards = useMemo(() => {
    if (
      actionGroupPairs.length === 0 ||
      actionInfos.length === 0 ||
      !generatedRewardsData ||
      generatedRewardsData.length === 0
    ) {
      return [];
    }

    // 创建行动 ID 到行动信息的映射
    const actionInfoMap = new Map(actionInfos.map((info) => [info.head.id, info]));

    // 按行动分组数据
    const result: ActionRewardInfo[] = [];

    actionIds.forEach((actionId) => {
      const actionInfo = actionInfoMap.get(actionId);
      if (!actionInfo) return;

      const groupIds = groupIdsByAction.get(actionId) || [];
      const groupRewards: GroupRewardInfo[] = [];

      // 为该行动下的每个链群构建激励信息
      groupIds.forEach((groupId) => {
        const key = `${actionId.toString()}-${groupId.toString()}`;
        const distribution = distributionMap.get(key);

        // 获取链群总铸币量
        const rewardIndex = actionGroupToRewardIndexMap.get(key);
        const generatedRewardResult = rewardIndex !== undefined ? generatedRewardsData[rewardIndex] : undefined;
        const totalGenerated =
          generatedRewardResult?.status === 'success' && generatedRewardResult.result
            ? (generatedRewardResult.result as bigint)
            : BigInt(0);

        if (distribution) {
          // 有分配数据（可能设置了二次分配，也可能没有）
          const { addrs, amounts, ownerAmount } = distribution;
          const hasRecipients = addrs.length > 0;
          const distributedAmount = amounts.reduce((sum, amount) => sum + amount, BigInt(0));

          groupRewards.push({
            groupId,
            groupName: groupNameMap.get(groupId),
            totalGenerated,
            ownerAmount,
            distributedAmount,
            hasRecipients,
          });
        } else {
          // 没有分配数据（可能是查询失败，或者确实没有设置分配）
          // 这种情况下，所有激励都属于服务者一个人
          groupRewards.push({
            groupId,
            groupName: groupNameMap.get(groupId),
            totalGenerated,
            ownerAmount: totalGenerated, // 如果没有二次分配，所有激励都属于服务者
            distributedAmount: BigInt(0),
            hasRecipients: false,
          });
        }
      });

      result.push({
        actionId,
        actionTitle: actionInfo.body.title || `行动 #${actionId.toString()}`,
        groupRewards,
      });
    });

    return result;
  }, [
    actionGroupPairs,
    actionInfos,
    generatedRewardsData,
    actionIds,
    groupIdsByAction,
    groupNameMap,
    distributionMap,
    actionGroupToRewardIndexMap,
  ]);

  // ==========================================
  // 计算最终状态
  // ==========================================
  const isPending = useMemo(() => {
    // 如果 allActionIds 为空数组，说明查询已完成，直接返回 false
    if (!allActionIds || allActionIds.length === 0) {
      // 但需要确保第一步的查询和服务者汇总查询已完成
      return isActionIdsPending || isVerifierSummaryPending;
    }

    // 第一步：获取行动ID
    if (isActionIdsPending) return true;
    // 第二步：获取扩展地址
    if (isExtensionsPending) return true;
    // 第三步：获取验证的链群
    if (isGroupIdsPending) return true;
    // 服务者汇总数据
    if (isVerifierSummaryPending) return true;
    // 如果没有链群数据，不需要等待其他查询
    if (actionGroupPairs.length === 0) return false;
    // 等待激励分配明细、链群总铸币量、行动信息、链群名称查询完成
    return isRewardDistributionPending || isGeneratedRewardsPending || isActionInfosPending || isGroupNamesPending;
  }, [
    allActionIds,
    isActionIdsPending,
    isExtensionsPending,
    isGroupIdsPending,
    isVerifierSummaryPending,
    actionGroupPairs.length,
    isRewardDistributionPending,
    isGeneratedRewardsPending,
    isActionInfosPending,
    isGroupNamesPending,
  ]);

  const error =
    actionIdsError || groupIdsError || rewardDistributionError || generatedRewardsError || verifierSummaryError || null;

  // ==========================================
  // 返回结果
  // ==========================================
  return {
    actionRewards,
    verifierRewardSummary,
    isPending,
    error,
  };
}
