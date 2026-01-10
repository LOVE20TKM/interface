/**
 * 扩展行动参与数据查询 Hook
 *
 * 职责：
 * - 查询扩展合约的公共统计数据（参与人数、总金额）
 * - 查询用户在扩展行动中的参与状态（参与金额、是否已参与）
 * - 使用批量调用优化性能
 * - 支持代币金额转换（将 joinedAmount 转换为目标代币金额）
 *
 * 使用示例：
 * ```typescript
 * const { participantCount, totalAmount, isJoined } =
 *   useExtensionParticipationData(extensionAddress, tokenAddress, actionId, account);
 * ```
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { IExtensionAbi } from '@/src/abis/IExtension';
import { ExtensionCenterAbi } from '@/src/abis/ExtensionCenter';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useActionBaseInfosByIdsWithCache } from '@/src/hooks/composite/useActionBaseInfosByIdsWithCache';
import { useExtensionContractInfo } from '@/src/hooks/extension/base/composite/useExtensionBaseData';
import { useConvertTokenAmount } from '@/src/hooks/composite/useConvertTokenAmount';
import { ActionInfo } from '@/src/types/love20types';

const EXTENSION_CENTER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER as `0x${string}`;

// ==================== 类型定义 ====================

/**
 * 扩展行动参与数据
 */
export interface ExtensionParticipationData {
  /** 参与者数量 */
  participantCount: bigint | undefined;
  /** 总参与金额 */
  totalAmount: bigint | undefined;
  /** 用户是否已参与 */
  isJoined: boolean;
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: Error | null;
}

// ==================== Hook 实现 ====================

/**
 * 获取扩展行动的参与数据
 *
 * @param extensionAddress - 扩展合约地址
 * @param tokenAddress - 代币地址
 * @param actionId - 行动 ID
 * @param account - 用户地址（可选，不传则不查询用户相关数据）
 * @returns 扩展行动的参与数据
 *
 * @description
 * 批量查询 3 个合约方法：
 * 1. accountsCount - 参与者数量（从扩展合约）
 * 2. joinedAmount - 总参与金额（从扩展合约）
 * 3. isAccountJoined - 是否已参与（从 ExtensionCenter，需要 account）
 *
 * 如果扩展行动的 joinedAmountTokenAddress 与 tokenAddress 不同，会自动进行代币转换
 */
export function useExtensionParticipationData(
  extensionAddress: `0x${string}` | undefined,
  tokenAddress: `0x${string}` | undefined,
  actionId: bigint | undefined,
  account?: `0x${string}` | undefined,
): ExtensionParticipationData {
  // ==========================================
  // 步骤1: 获取行动基本信息（用于后续获取合约信息）
  // ==========================================
  const { actionInfos: actionBaseInfos, isPending: isPendingActionInfo } = useActionBaseInfosByIdsWithCache({
    tokenAddress,
    actionIds: actionId !== undefined ? [actionId] : [],
    enabled: !!tokenAddress && actionId !== undefined,
  });

  // 将 ActionBaseInfo 转换为 ActionInfo（添加空的 verificationRule）
  const actionInfo: ActionInfo | undefined = useMemo(() => {
    if (actionBaseInfos.length === 0) return undefined;
    const baseInfo = actionBaseInfos[0];
    return {
      head: baseInfo.head,
      body: {
        ...baseInfo.body,
        verificationRule: '', // ActionBaseInfo 不包含此字段，添加空字符串
      },
    };
  }, [actionBaseInfos]);

  // ==========================================
  // 步骤2: 获取扩展合约信息（包含 joinedAmountTokenAddress 和 joinedAmountTokenIsLP）
  // ==========================================
  const {
    contractInfo,
    isPending: isPendingContractInfo,
    error: errorContractInfo,
  } = useExtensionContractInfo({
    tokenAddress,
    actionInfo,
  });

  // ==========================================
  // 步骤3: 构建批量查询合约配置
  // ==========================================
  const contracts = useMemo(() => {
    const contractCalls = [
      // 1. 查询参与者数量（公共数据，始终查询）
      {
        address: EXTENSION_CENTER_ADDRESS,
        abi: ExtensionCenterAbi,
        functionName: 'accountsCount' as const,
        args: [tokenAddress, actionId],
      },
      // 2. 查询总参与金额（公共数据，始终查询）
      {
        address: extensionAddress,
        abi: IExtensionAbi,
        functionName: 'joinedAmount' as const,
      },
      // 3. 查询用户是否已参与（需要 account + tokenAddress + actionId）
      {
        address: EXTENSION_CENTER_ADDRESS,
        abi: ExtensionCenterAbi,
        functionName: 'isAccountJoined' as const,
        args: tokenAddress && actionId !== undefined && account ? [tokenAddress, actionId, account] : undefined,
      },
    ];

    return contractCalls;
  }, [extensionAddress, tokenAddress, actionId, account]);

  // ==========================================
  // 步骤4: 批量调用合约
  // ==========================================
  const {
    data,
    isPending: isPendingContracts,
    error: errorContracts,
  } = useReadContracts({
    contracts,
    query: {
      enabled: !!extensionAddress,
    },
  });

  // ==========================================
  // 步骤5: 解析返回数据
  // ==========================================
  const participantCount = useMemo(() => {
    return data?.[0]?.status === 'success' ? safeToBigInt(data[0].result) : undefined;
  }, [data]);

  // 获取原始的 joinedAmount
  const joinedAmount = useMemo(() => {
    return data?.[1]?.status === 'success' ? safeToBigInt(data[1].result) : undefined;
  }, [data]);

  const isJoined = useMemo(() => {
    // 如果没有传 account 或必要参数，返回 false
    if (!account || !tokenAddress || actionId === undefined) return false;
    return data?.[2]?.status === 'success' ? (data[2].result as boolean) : false;
  }, [data, account, tokenAddress, actionId]);

  // ==========================================
  // 步骤6: 代币金额转换
  // ==========================================
  // 判断是否需要转换：需要合约信息、joinedAmount、且源代币与目标代币不同
  const needsConversion = useMemo(() => {
    return (
      !!tokenAddress &&
      !!contractInfo?.isExtension &&
      !!contractInfo?.joinedAmountTokenAddress &&
      contractInfo.joinedAmountTokenAddress !== tokenAddress &&
      joinedAmount !== undefined
    );
  }, [tokenAddress, contractInfo, joinedAmount]);

  const {
    convertedAmount,
    isSuccess: isConversionSuccess,
    isPending: isPendingConversion,
    error: errorConversion,
  } = useConvertTokenAmount({
    fromToken: (contractInfo?.joinedAmountTokenAddress || tokenAddress) as `0x${string}`,
    isFromTokenLP: contractInfo?.joinedAmountTokenIsLP ?? false,
    fromAmount: joinedAmount || BigInt(0),
    toToken: tokenAddress as `0x${string}`,
  });

  // ==========================================
  // 步骤7: 计算最终的 totalAmount（转换后的金额）
  // ==========================================
  const totalAmount = useMemo(() => {
    // 如果没有 joinedAmount，返回 undefined
    if (joinedAmount === undefined) return undefined;

    // 如果不需要转换（相同代币或没有合约信息），直接返回原始金额
    if (!needsConversion) {
      return joinedAmount;
    }

    // 如果需要转换，等待转换完成
    if (isPendingConversion) return undefined;

    // 转换成功，返回转换后的金额
    if (isConversionSuccess) {
      return convertedAmount;
    }

    // 转换失败，返回原始金额（降级处理）
    console.warn(`⚠️ ActionId ${actionId} 的代币转换失败，使用原始金额. ` + `Error: ${errorConversion}`);
    return joinedAmount;
  }, [
    joinedAmount,
    needsConversion,
    isPendingConversion,
    isConversionSuccess,
    convertedAmount,
    errorConversion,
    actionId,
  ]);

  // ==========================================
  // 聚合加载状态和错误
  // ==========================================
  const isPending = useMemo(() => {
    return isPendingActionInfo || isPendingContractInfo || isPendingContracts || isPendingConversion;
  }, [isPendingActionInfo, isPendingContractInfo, isPendingContracts, isPendingConversion]);

  const error = useMemo(() => {
    return errorContracts || errorContractInfo || errorConversion || null;
  }, [errorContracts, errorContractInfo, errorConversion]);

  // ==========================================
  // 返回结果
  // ==========================================
  return {
    participantCount,
    totalAmount,
    isJoined,
    isPending,
    error,
  };
}
