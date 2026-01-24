/**
 * 扩展行动参与数据查询 Hook
 *
 * 职责：
 * - 查询扩展合约的公共统计数据（参与地址数、总金额）
 * - 查询用户在扩展行动中的参与状态（参与金额、是否已参与）
 * - 使用批量调用优化性能
 *
 * 使用示例：
 * ```typescript
 * const { participantCount, totalAmount, isJoined } =
 *   useExtensionParticipationData(extensionAddress, tokenAddress, actionId, account);
 * ```
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import type { Abi } from 'abitype';
import { IExtensionAbi } from '@/src/abis/IExtension';
import { ExtensionCenterAbi } from '@/src/abis/ExtensionCenter';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useActionBaseInfosByIdsWithCache } from '@/src/hooks/composite/useActionBaseInfosByIdsWithCache';
import { useExtensionByActionInfoWithCache } from '@/src/hooks/extension/base/composite/useExtensionsByActionInfosWithCache';
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
  /** 转换后的总参与金额（转换为当前代币的等价值） */
  convertedTotalAmount: bigint | undefined;
  /** joinedAmount 对应的代币地址*/
  joinedAmountTokenAddress: `0x${string}` | undefined;
  /** joinedAmount 对应的代币 symbol */
  joinedAmountTokenSymbol: string | undefined;
  /** joinedAmount 对应代币是否为 LP*/
  joinedAmountTokenIsLP: boolean;
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
 * 批量查询（按条件可选）最多 3 个合约方法：
 * 1. accountsCount - 参与者数量（从 ExtensionCenter）
 * 2. joinedAmount - 总参与金额（从扩展合约）
 * 3. isAccountJoined - 是否已参与（从 ExtensionCenter，需要 account）
 *
 * 注意：joinedAmountTokenSymbol 直接从 contractInfo 获取，不需要查询合约
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
  } = useExtensionByActionInfoWithCache({
    tokenAddress,
    actionInfo,
  });

  // ==========================================
  // 步骤3: 构建批量查询合约配置
  // ==========================================
  const { contracts, contractIndex, isContractsEnabled } = useMemo(() => {
    const nextContracts: Array<{
      address: `0x${string}`;
      abi: Abi;
      functionName: string;
      args?: readonly unknown[];
    }> = [];

    const nextIndex = {
      accountsCount: -1,
      joinedAmount: -1,
      isAccountJoined: -1,
    };

    // 1) accountsCount: 需要 tokenAddress + actionId
    if (tokenAddress && actionId !== undefined) {
      nextIndex.accountsCount = nextContracts.length;
      nextContracts.push({
        address: EXTENSION_CENTER_ADDRESS,
        abi: ExtensionCenterAbi,
        functionName: 'accountsCount',
        args: [tokenAddress, actionId],
      });
    }

    // 2) joinedAmount: 需要 extensionAddress
    if (extensionAddress) {
      nextIndex.joinedAmount = nextContracts.length;
      nextContracts.push({
        address: extensionAddress,
        abi: IExtensionAbi,
        functionName: 'joinedAmount',
      });
    }

    // 3) isAccountJoined: 需要 tokenAddress + actionId + account
    if (tokenAddress && actionId !== undefined && account) {
      nextIndex.isAccountJoined = nextContracts.length;
      nextContracts.push({
        address: EXTENSION_CENTER_ADDRESS,
        abi: ExtensionCenterAbi,
        functionName: 'isAccountJoined',
        args: [tokenAddress, actionId, account],
      });
    }

    return {
      contracts: nextContracts,
      contractIndex: nextIndex,
      isContractsEnabled: nextContracts.length > 0,
    };
  }, [tokenAddress, actionId, extensionAddress, account]);

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
      enabled: isContractsEnabled,
    },
  });

  // ==========================================
  // 步骤5: 解析返回数据
  // ==========================================
  const participantCount = useMemo(() => {
    const idx = contractIndex.accountsCount;
    if (idx < 0) return undefined;
    return data?.[idx]?.status === 'success' ? safeToBigInt(data[idx].result) : undefined;
  }, [data, contractIndex.accountsCount]);

  // 获取原始的 joinedAmount
  const joinedAmount = useMemo(() => {
    const idx = contractIndex.joinedAmount;
    if (idx < 0) return undefined;
    return data?.[idx]?.status === 'success' ? safeToBigInt(data[idx].result) : undefined;
  }, [data, contractIndex.joinedAmount]);

  const isJoined = useMemo(() => {
    const idx = contractIndex.isAccountJoined;
    if (idx < 0) return false;
    return data?.[idx]?.status === 'success' ? (data[idx].result as boolean) : false;
  }, [data, contractIndex.isAccountJoined]);

  // ==========================================
  // 步骤6: 计算最终的 totalAmount（真实金额，不做转换）
  // ==========================================
  const totalAmount = useMemo(() => {
    return joinedAmount;
  }, [joinedAmount]);

  // joinedAmount 的真实口径代币信息（不做转换）
  const joinedAmountTokenAddress = useMemo(() => {
    return (contractInfo?.joinedAmountTokenAddress || tokenAddress) as `0x${string}` | undefined;
  }, [contractInfo?.joinedAmountTokenAddress, tokenAddress]);

  const joinedAmountTokenIsLP = useMemo(() => {
    return contractInfo?.joinedAmountTokenIsLP ?? false;
  }, [contractInfo?.joinedAmountTokenIsLP]);

  // joinedAmountTokenSymbol 直接从 contractInfo 获取，不需要查询合约
  const joinedAmountTokenSymbol = useMemo(() => {
    return contractInfo?.joinedAmountTokenSymbol;
  }, [contractInfo?.joinedAmountTokenSymbol]);

  // ==========================================
  // 步骤7: 计算转换后的总参与金额（转换为当前代币的等价值）
  // ==========================================
  // 判断是否需要转换：只有当参与代币与当前代币不同时才需要转换
  const shouldConvert = useMemo(() => {
    return (
      totalAmount !== undefined &&
      totalAmount > BigInt(0) &&
      joinedAmountTokenAddress !== undefined &&
      tokenAddress !== undefined &&
      joinedAmountTokenAddress.toLowerCase() !== tokenAddress.toLowerCase()
    );
  }, [totalAmount, joinedAmountTokenAddress, tokenAddress]);

  // 使用 useConvertTokenAmount 进行代币转换
  // 注意：需要确保 fromToken 和 toToken 都是有效地址，否则传入默认值（不会实际使用）
  const defaultTokenAddress = '0x0000000000000000000000000000000000000000' as `0x${string}`;
  const { convertedAmount, isSuccess: isConvertSuccess } = useConvertTokenAmount({
    fromToken: (joinedAmountTokenAddress || tokenAddress || defaultTokenAddress) as `0x${string}`,
    isFromTokenLP: joinedAmountTokenIsLP,
    fromAmount: totalAmount || BigInt(0),
    toToken: (tokenAddress || defaultTokenAddress) as `0x${string}`,
  });

  const convertedTotalAmount = useMemo(() => {
    // 只有在需要转换且转换成功时才返回转换后的金额
    if (!shouldConvert || !isConvertSuccess) {
      return undefined;
    }
    return convertedAmount;
  }, [shouldConvert, isConvertSuccess, convertedAmount]);

  // ==========================================
  // 聚合加载状态和错误
  // ==========================================
  const isPending = useMemo(() => {
    return isPendingActionInfo || isPendingContractInfo || isPendingContracts;
  }, [isPendingActionInfo, isPendingContractInfo, isPendingContracts]);

  const error = useMemo(() => {
    return errorContracts || errorContractInfo || null;
  }, [errorContracts, errorContractInfo]);

  // ==========================================
  // 返回结果
  // ==========================================
  return {
    participantCount,
    totalAmount,
    convertedTotalAmount,
    joinedAmountTokenAddress,
    joinedAmountTokenSymbol,
    joinedAmountTokenIsLP,
    isJoined,
    isPending,
    error,
  };
}
