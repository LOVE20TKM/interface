// hooks/composite/useVerificationInfos.ts
// 批量获取验证信息的 Hook

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionCenterAbi } from '@/src/abis/LOVE20ExtensionCenter';

interface VerificationInfosParams {
  tokenAddress: `0x${string}` | undefined;
  actionId: bigint;
  accounts: `0x${string}`[];
  verificationKeys: string[];
  enabled?: boolean;
}

export interface VerificationInfoResult {
  account: `0x${string}`;
  infos: string[]; // 按 verificationKeys 顺序对应的验证信息
  isPending: boolean;
  error: Error | null;
}

// 获取合约地址
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER as `0x${string}`;

/**
 * 批量获取多个地址的验证信息
 * 使用 useReadContracts 将多个 RPC 调用合并成一次批量请求，提高效率
 * 
 * @param tokenAddress - 代币地址
 * @param actionId - 行动 ID
 * @param accounts - 需要获取验证信息的地址列表
 * @param verificationKeys - 验证信息的键列表
 * @param enabled - 是否启用查询
 * @returns 包含所有地址验证信息的数组
 */
export const useVerificationInfos = ({
  tokenAddress,
  actionId,
  accounts,
  verificationKeys,
  enabled = true,
}: VerificationInfosParams) => {
  // 构建批量合约调用配置
  // 对于 N 个地址 × M 个验证 key，将生成 N*M 个合约调用
  const contracts = useMemo(() => {
    if (!enabled || accounts.length === 0 || verificationKeys.length === 0 || !tokenAddress) {
      return [];
    }

    const contractCalls: any[] = [];
    
    // 为每个地址和每个验证 key 创建一个合约调用
    accounts.forEach((account) => {
      verificationKeys.forEach((key) => {
        contractCalls.push({
          address: CONTRACT_ADDRESS,
          abi: LOVE20ExtensionCenterAbi,
          functionName: 'verificationInfo' as const,
          args: [tokenAddress, actionId, account, key],
        });
      });
    });

    return contractCalls;
  }, [tokenAddress, actionId, accounts, verificationKeys, enabled]);

  // 使用 useReadContracts 进行批量调用 - 这是真正的一次 RPC 请求！
  const {
    data: contractResults,
    isLoading,
    error,
    isSuccess,
  } = useReadContracts({
    contracts,
    query: {
      enabled: enabled && contracts.length > 0,
    },
  });

  // 计算派生数据
  const verificationInfos = useMemo(() => {
    if (!enabled || accounts.length === 0 || verificationKeys.length === 0) {
      return {
        infos: [] as VerificationInfoResult[],
        isLoading: false,
        hasError: false,
        allLoaded: true,
      };
    }

    // 处理批量调用的结果
    const infos: VerificationInfoResult[] = accounts.map((account, accountIndex) => {
      // 为每个地址收集所有验证 key 的信息
      const accountInfos: string[] = [];
      let hasError = false;
      let accountError: Error | null = null;

      verificationKeys.forEach((_, keyIndex) => {
        // 计算在 contractResults 中的索引
        const resultIndex = accountIndex * verificationKeys.length + keyIndex;
        const result = contractResults?.[resultIndex];

        if (result?.status === 'success') {
          accountInfos.push((result.result as string) || '');
        } else {
          accountInfos.push('');
          if (result?.status === 'failure') {
            hasError = true;
            accountError = result.error as Error;
          }
        }
      });

      return {
        account,
        infos: accountInfos,
        isPending: isLoading,
        error: hasError ? accountError : null,
      };
    });

    // 计算整体状态
    const hasError = !!error || infos.some((info) => info.error !== null);
    const allLoaded = isSuccess;

    return {
      infos,
      isLoading,
      hasError,
      allLoaded,
    };
  }, [contractResults, accounts, verificationKeys, enabled, isLoading, error, isSuccess]);

  // 返回格式化的结果
  return {
    // 验证信息数据
    verificationInfos: verificationInfos.infos,

    // 状态信息
    isLoading: verificationInfos.isLoading,
    isPending: verificationInfos.isLoading,
    hasError: verificationInfos.hasError,
    allLoaded: verificationInfos.allLoaded,
    error: error || null,

    // 便捷方法：根据地址获取验证信息
    getInfosByAccount: (account: `0x${string}`) => {
      const found = verificationInfos.infos.find((info) => info.account.toLowerCase() === account.toLowerCase());
      return found?.infos || [];
    },

    // 便捷方法：获取所有验证信息的映射
    getInfosMap: () => {
      const map: { [account: string]: string[] } = {};
      verificationInfos.infos.forEach((info) => {
        map[info.account] = info.infos;
      });
      return map;
    },

    // 验证
    hasValidData: enabled && accounts.length > 0 && verificationKeys.length > 0 && !!tokenAddress,
  };
};

