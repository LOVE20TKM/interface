// hooks/composite/useActionExtensionStats.tsx
// 获取扩展行动的统计信息

import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionStakeLpAbi } from '@/src/abis/LOVE20ExtensionStakeLp';
import { safeToBigInt } from '@/src/lib/clientUtils';

/**
 * 扩展行动统计信息类型
 */
export interface ActionExtensionStats {
  participantCount: bigint | undefined;
  totalAmount: bigint | undefined;
  isPending: boolean;
  error: Error | null;
}

/**
 * Hook: 获取扩展行动的统计信息
 *
 * @param extensionAddress - 扩展合约地址
 * @returns 扩展行动的统计数据
 *
 * @description
 * 批量获取扩展行动的参与统计：
 * - participantCount: 参与者数量（accountsCount）
 * - totalAmount: 总参与金额（joinedValue）
 */
export function useActionExtensionStats(extensionAddress: `0x${string}` | undefined): ActionExtensionStats {
  // 批量调用扩展合约的统计方法
  const { data, isPending, error } = useReadContracts({
    contracts: [
      // 1. 获取参与者数量
      {
        address: extensionAddress,
        abi: LOVE20ExtensionStakeLpAbi,
        functionName: 'accountsCount',
      },
      // 2. 获取总参与金额
      {
        address: extensionAddress,
        abi: LOVE20ExtensionStakeLpAbi,
        functionName: 'joinedValue',
      },
    ],
    query: {
      enabled: !!extensionAddress,
    },
  });

  // 解析返回数据
  const participantCount = data?.[0]?.status === 'success' ? safeToBigInt(data[0].result) : undefined;

  const totalAmount = data?.[1]?.status === 'success' ? safeToBigInt(data[1].result) : undefined;

  return {
    participantCount,
    totalAmount,
    isPending,
    error: error || null,
  };
}
