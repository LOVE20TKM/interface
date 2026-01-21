/**
 * 扩展行动数据查询 Hooks
 *
 * 功能概述：
 * 1. 提供批量和单个行动的扩展基础数据查询
 * 2. 基础数据实时查询（不缓存，每次从链上读取）
 * 3. 使用 useReadContracts 批量调用优化性能
 * 4. 依赖 useExtensionsByActionInfosWithCache 获取合约信息（有缓存）
 *
 * 主要 Hooks：
 * - useExtensionsBaseData: 批量获取扩展基础数据（无缓存，实时查询）
 * - useExtensionBaseData: 获取单个行动的扩展基础数据（无缓存，实时查询）
 *
 * 使用示例：
 * ```typescript
 * // 查询基础数据（实时查询，不缓存）
 * const { baseData } = useExtensionsBaseData({
 *   tokenAddress,
 *   actionInfos: [actionInfo1, actionInfo2],
 * });
 * ```
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { ExtensionLpAbi } from '@/src/abis/ExtensionLp';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { ActionInfo } from '@/src/types/love20types';
import { useConvertTokenAmounts, UseConvertTokenAmountParams } from '@/src/hooks/composite/useConvertTokenAmount';
import { useExtensionsByActionInfosWithCache } from './useExtensionsByActionInfosWithCache';

/**
 * 扩展基础数据
 */
export interface ExtensionBaseData {
  actionId: bigint;
  isExtension: boolean;
  extension?: `0x${string}`;
  accountsCount?: bigint;
  joinedAmount?: bigint; // 原始的 joinedAmount
  convertedJoinedValue?: bigint; // 转换后的参与值
  isConvertedJoinedValueSuccess?: boolean; // convertedJoinedValue 是否为“转换成功”得到的结果
}

/**
 * 转换映射 (追踪哪个转换对应哪个行动)
 */
interface ConversionMapping {
  actionId: bigint; // 原始行动 ID
  extensionIndex: number; // 在 extensionAddresses 数组中的索引
  conversionIndex: number; // 在 conversions 数组中的索引
}

// ==================== 辅助函数 ====================

/**
 * 根据扩展地址查找索引
 */
function findExtensionIndex(extensionAddress: `0x${string}`, extensionAddresses: `0x${string}`[]): number {
  return extensionAddresses.findIndex((addr) => addr === extensionAddress);
}

// ==================== Hook: 批量获取扩展基础数据 ====================

export interface UseExtensionsBaseDataParams {
  tokenAddress: `0x${string}` | undefined;
  actionInfos: ActionInfo[];
}

export interface UseExtensionsBaseDataResult {
  baseData: ExtensionBaseData[];
  isPending: boolean;
  error: any;
}

/**
 * Hook 3: 批量获取扩展基础数据
 *
 * 功能：
 * 1. 使用 Hook 1 获取扩展合约信息
 * 2. 批量查询扩展行动的参与统计数据（不缓存，每次实时查询）
 *
 * @param tokenAddress 代币地址
 * @param actionInfos 行动信息列表
 * @returns 扩展基础数据列表、加载状态和错误信息
 */
export const useExtensionsBaseData = ({
  tokenAddress,
  actionInfos,
}: UseExtensionsBaseDataParams): UseExtensionsBaseDataResult => {
  // 步骤1: 使用 useExtensionsByActionInfosWithCache 获取合约信息
  const {
    contractInfos,
    isPending: isPendingContract,
    error: errorContract,
  } = useExtensionsByActionInfosWithCache({
    tokenAddress,
    actionInfos,
  });

  // 步骤2: 构建扩展地址列表（只处理有扩展的行动）
  const extensionAddresses = useMemo(() => {
    if (!tokenAddress || actionInfos.length === 0 || contractInfos.length === 0) {
      return [];
    }

    const extensions: `0x${string}`[] = [];

    for (const contractInfo of contractInfos) {
      // 只处理扩展行动
      if (contractInfo.isExtension && contractInfo.extension) {
        extensions.push(contractInfo.extension);
      }
    }

    return extensions;
  }, [tokenAddress, actionInfos, contractInfos]);

  // 步骤3: 构建批量合约调用列表
  const dynamicContracts = useMemo(() => {
    if (extensionAddresses.length === 0) return [];

    const contracts: any[] = [];

    for (const extensionAddress of extensionAddresses) {
      contracts.push({
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'accountsCount' as const,
        args: [],
      });
      contracts.push({
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'joinedAmount' as const,
        args: [],
      });
    }

    return contracts;
  }, [extensionAddresses]);

  // 步骤4: 批量读取基础数据（实时查询，不缓存）
  const {
    data: dynamicContractsData,
    isPending: isPendingDynamic,
    error: errorDynamic,
  } = useReadContracts({
    contracts: dynamicContracts as any,
    query: {
      enabled: dynamicContracts.length > 0,
    },
  });

  // 步骤4.5: 构建代币转换请求数组
  const { conversions, conversionMappings } = useMemo(() => {
    if (!tokenAddress || extensionAddresses.length === 0 || !dynamicContractsData) {
      return { conversions: [], conversionMappings: [] };
    }

    const conversionArray: UseConvertTokenAmountParams[] = [];
    const mappings: ConversionMapping[] = [];

    for (const actionInfo of actionInfos) {
      const actionId = actionInfo.head.id;
      const contractInfo = contractInfos.find((info) => info.actionId === actionId);

      // 跳过非扩展行动
      if (!contractInfo?.isExtension || !contractInfo.extension) {
        continue;
      }

      // 查找扩展索引
      const extensionIndex = findExtensionIndex(contractInfo.extension, extensionAddresses);
      if (extensionIndex === -1) continue;

      // 获取 joinedAmount
      const joinedAmountResult = dynamicContractsData[extensionIndex * 2 + 1];
      if (!joinedAmountResult?.result) continue;
      const joinedAmount = safeToBigInt(joinedAmountResult.result);

      // 获取转换参数
      const fromToken = contractInfo.joinedAmountTokenAddress;
      const isFromTokenLP = contractInfo.joinedAmountTokenIsLP ?? false;

      // 跳过: 无源代币或源代币与目标代币相同
      if (!fromToken || fromToken === tokenAddress) continue;

      // 添加到转换数组
      conversionArray.push({
        fromToken,
        isFromTokenLP,
        fromAmount: joinedAmount,
        toToken: tokenAddress,
      });

      // 记录映射
      mappings.push({
        actionId,
        extensionIndex,
        conversionIndex: conversionArray.length - 1,
      });
    }

    return { conversions: conversionArray, conversionMappings: mappings };
  }, [tokenAddress, actionInfos, contractInfos, extensionAddresses, dynamicContractsData]);

  // 步骤4.6: 批量执行代币转换
  const {
    results: conversionResults,
    isPending: isPendingConversion,
    error: errorConversion,
  } = useConvertTokenAmounts({ conversions });

  // 步骤5: 解析查询结果并组合数据 (集成代币转换)
  const baseData = useMemo(() => {
    const results: ExtensionBaseData[] = [];

    for (const actionInfo of actionInfos) {
      const actionId = actionInfo.head.id;
      const contractInfo = contractInfos.find((info) => info.actionId === actionId);

      // 如果不是扩展行动，直接返回基本信息
      if (!contractInfo?.isExtension || !contractInfo.extension) {
        results.push({
          actionId,
          isExtension: false,
        });
        continue;
      }

      // 找到对应的扩展地址索引
      const extensionIndex = findExtensionIndex(contractInfo.extension, extensionAddresses);

      // 如果找到了扩展地址且有查询结果
      if (extensionIndex !== -1 && dynamicContractsData) {
        const accountsCountResult = dynamicContractsData[extensionIndex * 2];
        const joinedAmountResult = dynamicContractsData[extensionIndex * 2 + 1];

        const accountsCount = safeToBigInt(accountsCountResult?.result);
        const joinedAmount = safeToBigInt(joinedAmountResult?.result);

        // 查找转换结果
        const mapping = conversionMappings.find((m) => m.actionId === actionId);
        let convertedJoinedValue: bigint | undefined;
        let isConvertedJoinedValueSuccess: boolean | undefined;

        if (mapping !== undefined) {
          // 需要转换
          const conversionResult = conversionResults?.[mapping.conversionIndex];
          if (conversionResult?.isSuccess) {
            convertedJoinedValue = conversionResult.convertedAmount;
            isConvertedJoinedValueSuccess = true;
          } else if (!isPendingConversion) {
            // 转换失败，使用原始金额并记录警告
            console.warn(
              `⚠️ ActionId ${actionId} 的代币转换失败，使用原始金额. ` + `Error: ${conversionResult?.error}`,
            );
            convertedJoinedValue = joinedAmount;
            isConvertedJoinedValueSuccess = false;
          }
          // else: 转换中，保持 undefined
        } else {
          // 不需要转换 (相同代币或无转换数据)
          convertedJoinedValue = joinedAmount;
          isConvertedJoinedValueSuccess = false;
        }

        results.push({
          actionId,
          isExtension: true,
          extension: contractInfo.extension,
          accountsCount,
          joinedAmount,
          convertedJoinedValue,
          isConvertedJoinedValueSuccess,
        });
      } else {
        // 数据还在加载中
        results.push({
          actionId,
          isExtension: true,
          extension: contractInfo.extension,
        });
      }
    }

    return results;
  }, [
    actionInfos,
    contractInfos,
    extensionAddresses,
    dynamicContractsData,
    conversionMappings,
    conversionResults,
    isPendingConversion,
  ]);

  const isPending =
    isPendingContract ||
    (dynamicContracts.length > 0 && isPendingDynamic) ||
    (conversions.length > 0 && isPendingConversion);

  const error = errorContract || errorDynamic || errorConversion;

  return {
    baseData,
    isPending,
    error,
  };
};

// ==================== Hook 4: 单个行动的扩展基础数据 ====================

export interface UseExtensionBaseDataParams {
  tokenAddress: `0x${string}` | undefined;
  actionInfo: ActionInfo | undefined;
}

export interface UseExtensionBaseDataResult {
  baseData: ExtensionBaseData | undefined;
  isPending: boolean;
  error: any;
}

/**
 * Hook 4: 获取单个行动的扩展基础数据
 *
 * 封装 Hook 3，简化单个行动的查询
 *
 * @param tokenAddress 代币地址
 * @param actionInfo 行动信息
 * @returns 扩展基础数据、加载状态和错误信息
 */
export const useExtensionBaseData = ({
  tokenAddress,
  actionInfo,
}: UseExtensionBaseDataParams): UseExtensionBaseDataResult => {
  const actionInfos = useMemo(() => (actionInfo !== undefined ? [actionInfo] : []), [actionInfo]);

  const {
    baseData: allBaseData,
    isPending,
    error,
  } = useExtensionsBaseData({
    tokenAddress,
    actionInfos,
  });

  const baseData = useMemo(() => {
    if (actionInfo === undefined) return undefined;
    return allBaseData.find((data) => data.actionId === actionInfo.head.id);
  }, [allBaseData, actionInfo]);

  return {
    baseData,
    isPending,
    error,
  };
};
