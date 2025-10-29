// hooks/composite/useActionExtensionUserStatus.tsx
// 获取用户在扩展行动中的参与状态

import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionStakeLpAbi } from '@/src/abis/LOVE20ExtensionStakeLp';
import { LOVE20ExtensionCenterAbi } from '@/src/abis/LOVE20ExtensionCenter';
import { safeToBigInt } from '@/src/lib/clientUtils';

const EXTENSION_CENTER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER as `0x${string}`;

/**
 * 扩展行动用户参与状态类型
 */
export interface ActionExtensionUserStatus {
  userJoinedAmount: bigint | undefined;
  isJoined: boolean;
  isPending: boolean;
  error: Error | null;
}

/**
 * Hook: 获取用户在扩展行动中的参与状态
 *
 * @param extensionAddress - 扩展合约地址
 * @param tokenAddress - 代币地址
 * @param actionId - 行动 ID
 * @param account - 用户地址
 * @returns 用户在扩展行动中的参与状态
 *
 * @description
 * 批量获取用户在扩展行动中的参与状态：
 * - userJoinedAmount: 用户参与金额（joinedValueByAccount）
 * - isJoined: 是否已参与（isAccountJoined from ExtensionCenter）
 */
export function useActionExtensionUserStatus(
  extensionAddress: `0x${string}` | undefined,
  tokenAddress: `0x${string}` | undefined,
  actionId: bigint | undefined,
  account: `0x${string}` | undefined,
): ActionExtensionUserStatus {
  // 批量调用获取用户参与状态
  const { data, isPending, error } = useReadContracts({
    contracts: [
      // 1. 获取用户参与金额（从扩展合约）
      {
        address: extensionAddress,
        abi: LOVE20ExtensionStakeLpAbi,
        functionName: 'joinedValueByAccount',
        args: account ? [account] : undefined,
      },
      // 2. 获取是否已参与（从 ExtensionCenter）
      {
        address: EXTENSION_CENTER_ADDRESS,
        abi: LOVE20ExtensionCenterAbi,
        functionName: 'isAccountJoined',
        args: tokenAddress && actionId !== undefined && account ? [tokenAddress, actionId, account] : undefined,
      },
    ],
    query: {
      enabled: !!extensionAddress && !!tokenAddress && actionId !== undefined && !!account,
    },
  });

  // 解析返回数据
  const userJoinedAmount = data?.[0]?.status === 'success' ? safeToBigInt(data[0].result) : undefined;

  const isJoined = data?.[1]?.status === 'success' ? (data[1].result as boolean) : false;

  return {
    userJoinedAmount,
    isJoined,
    isPending,
    error: error || null,
  };
}
