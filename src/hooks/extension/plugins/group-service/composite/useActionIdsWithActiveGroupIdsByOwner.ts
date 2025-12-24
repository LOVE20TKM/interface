/**
 * 获取一个链群主所有激活的链群NFTs列表（按行动id分组）Hook
 *
 * 功能：
 * 1. 批量获取 verifyRound, verifyRound-1, verifyRound-2 3个轮次的投过票的actionIds
 * 2. 批量通过 center 合约获取 extension 地址
 * 3. 批量用 factory 合约的 exists 检查 extension 地址是否有效，丢弃掉无效的地址
 * 4. 批量对于 actionId 用 activeGroupIdsByOwner 获取在该群激活的链群NFT列表
 *
 * 使用示例：
 * ```typescript
 * const { actionIdsWithGroupIds, isPending, error } = useActionIdsWithActiveGroupIdsByOwner({
 *   tokenAddress: '0x...',
 *   verifyRound: BigInt(10),
 *   account: '0x...'
 * });
 * ```
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20VoteAbi } from '@/src/abis/LOVE20Vote';
import { LOVE20ExtensionCenterAbi } from '@/src/abis/LOVE20ExtensionCenter';
import { LOVE20GroupManagerAbi } from '@/src/abis/LOVE20GroupManager';
import { ILOVE20ExtensionAbi } from '@/src/abis/ILOVE20Extension';
import { LOVE20ExtensionFactoryBaseAbi } from '@/src/abis/LOVE20ExtensionFactoryBase';
import { safeToBigInt } from '@/src/lib/clientUtils';

// ==================== 类型定义 ====================

/**
 * 按 actionId 分组的链群NFT列表
 */
export interface ActionIdWithGroupIds {
  /** 行动ID */
  actionId: bigint;
  /** 该行动下激活的链群NFT列表 */
  groupIds: bigint[];
}

/**
 * Hook 参数
 */
export interface UseActionIdsWithActiveGroupIdsByOwnerParams {
  /** Token 地址 */
  tokenAddress: `0x${string}` | undefined;
  /** 验证轮次 */
  verifyRound: bigint | undefined;
  /** 链群主账户地址 */
  account: `0x${string}` | undefined;
}

/**
 * Hook 返回值
 */
export interface UseActionIdsWithActiveGroupIdsByOwnerResult {
  /** 按 actionId 分组的激活链群NFT列表 */
  actionIdsWithGroupIds: ActionIdWithGroupIds[];
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: any;
}

// ==================== 常量定义 ====================

const VOTE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VOTE as `0x${string}`;
const EXTENSION_CENTER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER as `0x${string}`;
const GROUP_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

// ==================== Hook 实现 ====================

/**
 * 获取一个链群主所有激活的链群NFTs列表（按行动id分组）
 *
 * @param params - Hook 参数
 * @returns 按 actionId 分组的激活链群NFT列表
 */
export function useActionIdsWithActiveGroupIdsByOwner({
  tokenAddress,
  verifyRound,
  account,
}: UseActionIdsWithActiveGroupIdsByOwnerParams): UseActionIdsWithActiveGroupIdsByOwnerResult {
  // ==========================================
  // 步骤1：批量获取3个轮次的投票actionIds
  // ==========================================

  // 计算三个轮次（处理负数情况）
  const rounds = useMemo(() => {
    if (verifyRound === undefined) return [];
    const rounds: bigint[] = [];
    if (verifyRound >= BigInt(0)) rounds.push(verifyRound);
    if (verifyRound >= BigInt(1)) rounds.push(verifyRound - BigInt(1));
    if (verifyRound >= BigInt(2)) rounds.push(verifyRound - BigInt(2));
    return rounds;
  }, [verifyRound]);

  // 批量获取每个轮次的投票数量
  const countContracts = useMemo(() => {
    if (!tokenAddress || rounds.length === 0) return [];
    return rounds.map((round) => ({
      address: VOTE_CONTRACT_ADDRESS,
      abi: LOVE20VoteAbi,
      functionName: 'votedActionIdsCount' as const,
      args: [tokenAddress, round] as const,
    }));
  }, [tokenAddress, rounds]);

  const {
    data: countData,
    isPending: isCountPending,
    error: countError,
  } = useReadContracts({
    contracts: countContracts as any,
    query: {
      enabled: !!tokenAddress && rounds.length > 0 && countContracts.length > 0,
    },
  });

  // 解析每个轮次的投票数量
  const roundCounts = useMemo(() => {
    if (!countData || countData.length === 0) return [];
    return countData.map((item, index) => {
      const count = item?.result ? safeToBigInt(item.result) : BigInt(0);
      return { round: rounds[index], count };
    });
  }, [countData, rounds]);

  // 批量获取所有 actionIds
  const actionIdContracts = useMemo(() => {
    if (!tokenAddress || roundCounts.length === 0) return [];
    const contracts: any[] = [];
    roundCounts.forEach(({ round, count }) => {
      for (let i = BigInt(0); i < count; i++) {
        contracts.push({
          address: VOTE_CONTRACT_ADDRESS,
          abi: LOVE20VoteAbi,
          functionName: 'votedActionIdsAtIndex' as const,
          args: [tokenAddress, round, i] as const,
        });
      }
    });
    return contracts;
  }, [tokenAddress, roundCounts]);

  const {
    data: actionIdData,
    isPending: isActionIdPending,
    error: actionIdError,
  } = useReadContracts({
    contracts: actionIdContracts,
    query: {
      enabled: !!tokenAddress && actionIdContracts.length > 0,
    },
  });

  // 解析并去重 actionIds
  const allActionIds = useMemo(() => {
    if (!actionIdData || actionIdData.length === 0) return [];
    const actionIdSet = new Set<string>();
    actionIdData.forEach((item) => {
      if (item?.status === 'success' && item.result) {
        const actionId = safeToBigInt(item.result);
        actionIdSet.add(actionId.toString());
      }
    });
    return Array.from(actionIdSet).map((id) => BigInt(id));
  }, [actionIdData]);

  // ==========================================
  // 步骤2：批量通过 center 合约获取 extension 地址
  // ==========================================

  const extensionContracts = useMemo(() => {
    if (!tokenAddress || allActionIds.length === 0) return [];
    return allActionIds.map((actionId) => ({
      address: EXTENSION_CENTER_ADDRESS,
      abi: LOVE20ExtensionCenterAbi,
      functionName: 'extension' as const,
      args: [tokenAddress, actionId] as const,
    }));
  }, [tokenAddress, allActionIds]);

  const {
    data: extensionData,
    isPending: isExtensionPending,
    error: extensionError,
  } = useReadContracts({
    contracts: extensionContracts as any,
    query: {
      enabled: !!tokenAddress && allActionIds.length > 0 && extensionContracts.length > 0,
    },
  });

  // 解析 extension 地址，并建立 actionId 到 extension 地址的映射
  const actionIdToExtension = useMemo(() => {
    if (!extensionData || allActionIds.length === 0) return new Map<bigint, `0x${string}`>();
    const map = new Map<bigint, `0x${string}`>();
    extensionData.forEach((item, index) => {
      if (item?.status === 'success' && item.result) {
        const extensionAddress = item.result as `0x${string}`;
        // 过滤掉零地址
        if (extensionAddress && extensionAddress.toLowerCase() !== ZERO_ADDRESS.toLowerCase()) {
          map.set(allActionIds[index], extensionAddress);
        }
      }
    });
    return map;
  }, [extensionData, allActionIds]);

  // ==========================================
  // 步骤3：批量验证 extension 地址有效性
  // ==========================================

  // 批量获取 factory 地址
  const factoryContracts = useMemo(() => {
    if (actionIdToExtension.size === 0) return [];
    const contracts: any[] = [];
    actionIdToExtension.forEach((extensionAddress) => {
      contracts.push({
        address: extensionAddress,
        abi: ILOVE20ExtensionAbi,
        functionName: 'factory' as const,
        args: [] as const,
      });
    });
    return contracts;
  }, [actionIdToExtension]);

  const {
    data: factoryData,
    isPending: isFactoryPending,
    error: factoryError,
  } = useReadContracts({
    contracts: factoryContracts as any,
    query: {
      enabled: actionIdToExtension.size > 0 && factoryContracts.length > 0,
    },
  });

  // 解析 factory 地址，过滤掉空地址
  const extensionToFactory = useMemo(() => {
    if (!factoryData || actionIdToExtension.size === 0) return new Map<`0x${string}`, `0x${string}`>();
    const map = new Map<`0x${string}`, `0x${string}`>();
    let index = 0;
    actionIdToExtension.forEach((extensionAddress) => {
      const factoryItem = factoryData[index];
      if (factoryItem?.status === 'success' && factoryItem.result) {
        const factoryAddress = factoryItem.result as `0x${string}`;
        // 如果 factory 地址不为空（零地址），则保留
        if (factoryAddress && factoryAddress.toLowerCase() !== ZERO_ADDRESS.toLowerCase()) {
          map.set(extensionAddress, factoryAddress);
        }
      }
      index++;
    });
    return map;
  }, [factoryData, actionIdToExtension]);

  // 批量调用 factory.exists 验证 extension
  const existsContracts = useMemo(() => {
    if (extensionToFactory.size === 0) return [];
    const contracts: any[] = [];
    extensionToFactory.forEach((factoryAddress, extensionAddress) => {
      contracts.push({
        address: factoryAddress,
        abi: LOVE20ExtensionFactoryBaseAbi,
        functionName: 'exists' as const,
        args: [extensionAddress] as const,
      });
    });
    return contracts;
  }, [extensionToFactory]);

  const {
    data: existsData,
    isPending: isExistsPending,
    error: existsError,
  } = useReadContracts({
    contracts: existsContracts as any,
    query: {
      enabled: extensionToFactory.size > 0 && existsContracts.length > 0,
    },
  });

  // 过滤出有效的 actionIds（extension 存在且 factory 验证通过）
  const validActionIds = useMemo(() => {
    if (!existsData || extensionToFactory.size === 0) return [];

    // 建立 extensionAddress 到 actionId 的反向映射
    const extensionToActionId = new Map<`0x${string}`, bigint>();
    actionIdToExtension.forEach((extensionAddress, actionId) => {
      extensionToActionId.set(extensionAddress, actionId);
    });

    const validIds: bigint[] = [];
    let index = 0;
    // 按照 extensionToFactory 的顺序遍历（与 existsData 的顺序一致）
    extensionToFactory.forEach((factoryAddress, extensionAddress) => {
      const existsItem = existsData[index];
      if (existsItem?.status === 'success' && existsItem.result === true) {
        const actionId = extensionToActionId.get(extensionAddress);
        if (actionId !== undefined) {
          validIds.push(actionId);
        }
      }
      index++;
    });
    return validIds;
  }, [existsData, extensionToFactory, actionIdToExtension]);

  // ==========================================
  // 步骤4：批量获取激活的链群NFT列表
  // ==========================================

  const groupIdsContracts = useMemo(() => {
    if (!tokenAddress || !account || validActionIds.length === 0) return [];
    return validActionIds.map((actionId) => ({
      address: GROUP_MANAGER_ADDRESS,
      abi: LOVE20GroupManagerAbi,
      functionName: 'activeGroupIdsByOwner' as const,
      args: [tokenAddress, actionId, account] as const,
    }));
  }, [tokenAddress, account, validActionIds]);

  const {
    data: groupIdsData,
    isPending: isGroupIdsPending,
    error: groupIdsError,
  } = useReadContracts({
    contracts: groupIdsContracts as any,
    query: {
      enabled: !!tokenAddress && !!account && validActionIds.length > 0 && groupIdsContracts.length > 0,
    },
  });

  // ==========================================
  // 结果组装
  // ==========================================

  const actionIdsWithGroupIds = useMemo(() => {
    if (!groupIdsData || validActionIds.length === 0) return [];
    const result: ActionIdWithGroupIds[] = [];
    groupIdsData.forEach((item, index) => {
      if (item?.status === 'success' && item.result) {
        const groupIds = item.result as bigint[];
        // 只返回有激活链群的 actionId
        if (groupIds.length > 0) {
          result.push({
            actionId: validActionIds[index],
            groupIds,
          });
        }
      }
    });
    return result;
  }, [groupIdsData, validActionIds]);

  // ==========================================
  // 计算 isPending 状态
  // ==========================================

  const isPending = useMemo(() => {
    // 如果基本参数不存在，等待参数
    if (!tokenAddress || verifyRound === undefined || !account) return true;

    // 步骤1：获取投票数量
    if (isCountPending) return true;
    // 如果步骤1没有数据（轮次为空或没有投票），后续步骤不执行，isPending 为 false
    if (rounds.length === 0 || roundCounts.every((rc) => rc.count === BigInt(0))) return false;

    // 步骤1：获取 actionIds
    if (isActionIdPending) return true;
    // 如果步骤1获取的 actionIds 为空，后续步骤不执行，isPending 为 false
    if (allActionIds.length === 0) return false;

    // 步骤2：获取 extension 地址
    if (isExtensionPending) return true;
    // 如果步骤2获取的 extension 地址为空，后续步骤不执行，isPending 为 false
    if (actionIdToExtension.size === 0) return false;

    // 步骤3：获取 factory 地址
    if (isFactoryPending) return true;
    // 如果步骤3没有有效的 factory 地址，后续步骤不执行，isPending 为 false
    if (extensionToFactory.size === 0) return false;

    // 步骤3：验证 exists
    if (isExistsPending) return true;
    // 如果步骤3验证后没有有效的 actionIds，步骤4不执行，isPending 为 false
    if (validActionIds.length === 0) return false;

    // 步骤4：获取链群NFT列表
    return isGroupIdsPending;
  }, [
    tokenAddress,
    verifyRound,
    account,
    isCountPending,
    rounds.length,
    roundCounts,
    isActionIdPending,
    allActionIds.length,
    isExtensionPending,
    actionIdToExtension.size,
    isFactoryPending,
    extensionToFactory.size,
    isExistsPending,
    validActionIds.length,
    isGroupIdsPending,
  ]);

  // ==========================================
  // 错误处理
  // ==========================================

  const error = countError || actionIdError || extensionError || factoryError || existsError || groupIdsError;

  // ==========================================
  // 返回结果
  // ==========================================

  return {
    actionIdsWithGroupIds,
    isPending,
    error,
  };
}
