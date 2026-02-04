// hooks/extension/plugins/group-service/composite/useExtensionParams.ts

import { useReadContracts } from 'wagmi';
import { ExtensionGroupServiceAbi } from '@/src/abis/ExtensionGroupService';
import { GroupRecipientsAbi } from '@/src/abis/GroupRecipients';
import { safeToBigInt } from '@/src/lib/clientUtils';

// GroupRecipients 是全局合约，使用环境变量配置地址
const GROUP_RECIPIENTS_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_RECIPIENTS as `0x${string}`;

/**
 * Hook for getting extension parameters by querying the extension contract directly
 * 直接查询扩展合约获取参数（替代已删除的 factory.extensionParams）
 * 注意：maxRecipients 从 GroupRecipients 合约获取
 */
export const useExtensionParams = (extensionAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContracts({
    contracts: [
      {
        address: extensionAddress,
        abi: ExtensionGroupServiceAbi,
        functionName: 'TOKEN_ADDRESS',
      },
      {
        address: extensionAddress,
        abi: ExtensionGroupServiceAbi,
        functionName: 'GROUP_ACTION_TOKEN_ADDRESS',
      },
      {
        address: extensionAddress,
        abi: ExtensionGroupServiceAbi,
        functionName: 'GROUP_ACTION_FACTORY_ADDRESS',
      },
      {
        address: GROUP_RECIPIENTS_ADDRESS,
        abi: GroupRecipientsAbi,
        functionName: 'DEFAULT_MAX_RECIPIENTS',
      },
      {
        address: extensionAddress,
        abi: ExtensionGroupServiceAbi,
        functionName: 'GOV_RATIO_MULTIPLIER',
      },
    ],
    query: {
      enabled: !!extensionAddress && !!GROUP_RECIPIENTS_ADDRESS,
    },
  });

  // 提取查询结果
  const tokenAddress = data?.[0]?.result as `0x${string}` | undefined;
  const groupActionTokenAddress = data?.[1]?.result as `0x${string}` | undefined;
  const groupActionFactoryAddress = data?.[2]?.result as `0x${string}` | undefined;
  const maxRecipients = safeToBigInt(data?.[3]?.result);
  const govRatioMultiplier = safeToBigInt(data?.[4]?.result);

  return {
    tokenAddress,
    groupActionTokenAddress,
    groupActionFactoryAddress,
    maxRecipients,
    govRatioMultiplier,
    isPending,
    error,
  };
};
