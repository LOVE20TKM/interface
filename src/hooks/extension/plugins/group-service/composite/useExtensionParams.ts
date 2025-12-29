// hooks/extension/plugins/group-service/composite/useExtensionParams.ts

import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionGroupServiceAbi } from '@/src/abis/LOVE20ExtensionGroupService';
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
        abi: LOVE20ExtensionGroupServiceAbi,
        functionName: 'tokenAddress',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupServiceAbi,
        functionName: 'GROUP_ACTION_TOKEN_ADDRESS',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupServiceAbi,
        functionName: 'GROUP_ACTION_FACTORY_ADDRESS',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupServiceAbi,
        functionName: 'DEFAULT_MAX_RECIPIENTS',
      },
    ],
    query: {
      enabled: !!extensionAddress,
    },
  });

  // 提取查询结果
  const tokenAddress = data?.[0]?.result as `0x${string}` | undefined;
  const groupActionTokenAddress = data?.[1]?.result as `0x${string}` | undefined;
  const groupActionFactoryAddress = data?.[2]?.result as `0x${string}` | undefined;
  const maxRecipients = safeToBigInt(data?.[3]?.result);

  return {
    tokenAddress,
    groupActionTokenAddress,
    groupActionFactoryAddress,
    maxRecipients,
    isPending,
    error,
  };
};
