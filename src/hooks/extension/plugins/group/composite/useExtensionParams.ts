// hooks/extension/plugins/group/composite/useExtensionParams.ts

import { useReadContracts } from 'wagmi';
import { ExtensionGroupActionAbi } from '@/src/abis/ExtensionGroupAction';
import { safeToBigInt } from '@/src/lib/clientUtils';

// 从环境变量获取全局合约地址
const GROUP_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`;
const GROUP_JOIN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;
const GROUP_VERIFY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY as `0x${string}`;

/**
 * Hook for getting extension parameters by querying the extension contract directly
 * 直接查询扩展合约获取参数
 *
 * 注意：新版合约中，GroupManager、GroupJoin、GroupVerify 的地址通过环境变量配置
 */
export const useExtensionParams = (extensionAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContracts({
    contracts: [
      {
        address: extensionAddress,
        abi: ExtensionGroupActionAbi,
        functionName: 'TOKEN_ADDRESS',
      },
      {
        address: extensionAddress,
        abi: ExtensionGroupActionAbi,
        functionName: 'JOIN_TOKEN_ADDRESS',
      },
      {
        address: extensionAddress,
        abi: ExtensionGroupActionAbi,
        functionName: 'ACTIVATION_STAKE_AMOUNT',
      },
      {
        address: extensionAddress,
        abi: ExtensionGroupActionAbi,
        functionName: 'MAX_JOIN_AMOUNT_RATIO',
      },
      {
        address: extensionAddress,
        abi: ExtensionGroupActionAbi,
        functionName: 'ACTIVATION_MIN_GOV_RATIO',
      },
    ],
    query: {
      enabled: !!extensionAddress,
    },
  });

  // 提取查询结果
  const tokenAddress = data?.[0]?.result as `0x${string}` | undefined;
  const joinTokenAddress = data?.[1]?.result as `0x${string}` | undefined;
  const activationStakeAmount = safeToBigInt(data?.[2]?.result);
  const maxJoinAmountRatio = safeToBigInt(data?.[3]?.result);
  const activationMinGovRatio = safeToBigInt(data?.[4]?.result);

  return {
    tokenAddress,
    // 全局合约地址从环境变量获取
    groupManagerAddress: GROUP_MANAGER_ADDRESS,
    groupJoinAddress: GROUP_JOIN_ADDRESS,
    groupVerifyAddress: GROUP_VERIFY_ADDRESS,
    joinTokenAddress,
    activationStakeAmount,
    maxJoinAmountRatio,
    activationMinGovRatio,
    isPending,
    error,
  };
};
