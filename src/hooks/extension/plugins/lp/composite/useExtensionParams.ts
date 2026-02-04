// hooks/extension/plugins/lp/composite/useExtensionParams.ts

import { useReadContracts } from 'wagmi';
import { ExtensionLpAbi } from '@/src/abis/ExtensionLp';
import { safeToBigInt } from '@/src/lib/clientUtils';

/**
 * Hook for getting extension parameters by querying the extension contract directly
 */
export const useExtensionParams = (extensionAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContracts({
    contracts: [
      {
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'TOKEN_ADDRESS',
      },
      {
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'JOIN_TOKEN_ADDRESS',
      },
      {
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'WAITING_BLOCKS',
      },
      {
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'GOV_RATIO_MULTIPLIER',
      },
      {
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'MIN_GOV_RATIO',
      },
    ],
    query: {
      enabled: !!extensionAddress,
    },
  });

  // 提取查询结果
  const tokenAddress = data?.[0]?.result as `0x${string}` | undefined;
  const joinTokenAddress = data?.[1]?.result as `0x${string}` | undefined;
  const waitingBlocks = safeToBigInt(data?.[2]?.result);
  const govRatioMultiplier = safeToBigInt(data?.[3]?.result);
  const minGovRatio = safeToBigInt(data?.[4]?.result);

  return {
    tokenAddress,
    joinTokenAddress,
    waitingBlocks,
    govRatioMultiplier,
    minGovRatio,
    isPending,
    error,
  };
};
