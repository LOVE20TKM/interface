// hooks/extension/plugins/group/composite/useExtensionParams.ts

import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionGroupActionAbi } from '@/src/abis/LOVE20ExtensionGroupAction';
import { safeToBigInt } from '@/src/lib/clientUtils';

/**
 * Hook for getting extension parameters by querying the extension contract directly
 * 直接查询扩展合约获取参数（替代已删除的 factory.extensionParams）
 */
export const useExtensionParams = (extensionAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContracts({
    contracts: [
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'tokenAddress',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'GROUP_MANAGER_ADDRESS',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'GROUP_DISTRUST_ADDRESS',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'STAKE_TOKEN_ADDRESS',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'JOIN_TOKEN_ADDRESS',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'GROUP_ACTIVATION_STAKE_AMOUNT',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'MAX_JOIN_AMOUNT_MULTIPLIER',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'VERIFY_CAPACITY_MULTIPLIER',
      },
    ],
    query: {
      enabled: !!extensionAddress,
    },
  });

  // 提取查询结果
  const tokenAddress = data?.[0]?.result as `0x${string}` | undefined;
  const groupManagerAddress = data?.[1]?.result as `0x${string}` | undefined;
  const groupDistrustAddress = data?.[2]?.result as `0x${string}` | undefined;
  const stakeTokenAddress = data?.[3]?.result as `0x${string}` | undefined;
  const joinTokenAddress = data?.[4]?.result as `0x${string}` | undefined;
  const activationStakeAmount = safeToBigInt(data?.[5]?.result);
  const maxJoinAmountMultiplier = safeToBigInt(data?.[6]?.result);
  const verifyCapacityMultiplier = safeToBigInt(data?.[7]?.result);

  return {
    tokenAddress,
    groupManagerAddress,
    groupDistrustAddress,
    stakeTokenAddress,
    joinTokenAddress,
    activationStakeAmount,
    maxJoinAmountMultiplier,
    verifyCapacityMultiplier,
    isPending,
    error,
  };
};
