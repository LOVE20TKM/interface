import { useMemo } from 'react';
import { isAddress } from 'viem';

import { ExtensionCenterAbi } from '@/src/abis/ExtensionCenter';
import { IExtensionAbi } from '@/src/abis/IExtension';
import { LOVE20TokenAbi } from '@/src/abis/LOVE20Token';
import { Token } from '@/src/contexts/TokenContext';
import { getExtensionConfigs, getFactoryName } from '@/src/config/extensionConfig';
import { useActionIdsByAccount } from '@/src/hooks/extension/base/contracts/useExtensionCenter';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { ZERO_ADDRESS } from '@/src/lib/tokenOptions';

export interface ApprovalSpender {
  name: string;
  category: string;
  address: `0x${string}`;
  note?: string;
}

const EXTENSION_CENTER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER as `0x${string}`;

const envSpenders = (): ApprovalSpender[] => [
  { name: 'Launch', category: 'LOVE20核心', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_LAUNCH as `0x${string}` },
  { name: 'Stake', category: 'LOVE20核心', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE as `0x${string}` },
  { name: 'Join', category: 'LOVE20核心', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN as `0x${string}` },
  { name: 'Hub', category: 'LOVE20周边', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_HUB as `0x${string}` },
  { name: 'BatchTransfer', category: 'LOVE20周边', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BATCH_TRANSFER as `0x${string}` },
  { name: 'UniswapV2Router02', category: 'DEX', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_ROUTER as `0x${string}` },
  { name: 'ExtensionLpFactory', category: '扩展工厂', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_LP_FACTORY as `0x${string}` },
  { name: 'ExtensionLpFactoryV2', category: '扩展工厂', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_LP_FACTORY_V2 as `0x${string}` },
  { name: 'ExtensionGroupActionFactory', category: '扩展工厂', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_ACTION_FACTORY as `0x${string}` },
  { name: 'ExtensionGroupServiceFactory', category: '扩展工厂', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_SERVICE_FACTORY as `0x${string}` },
  { name: 'GroupManager', category: '链群扩展', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}` },
  { name: 'GroupJoin', category: '链群扩展', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}` },
  { name: 'TokenMainManager', category: '群聊', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_MAIN_MANAGER as `0x${string}` },
  { name: 'TokenGovManager', category: '群聊', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_GOV_MANAGER as `0x${string}` },
  { name: 'TokenActionMainManager', category: '群聊', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER as `0x${string}` },
  { name: 'TokenActionGovManager', category: '群聊', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER as `0x${string}` },
];

const uniqueSpenders = (spenders: ApprovalSpender[]) => {
  const seen = new Set<string>();
  return spenders.filter((spender) => {
    if (!spender.address || !isAddress(spender.address) || spender.address === ZERO_ADDRESS) return false;
    const key = spender.address.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function useKnownTokenApprovals(
  token: Token | null | undefined,
  owner: `0x${string}` | undefined,
  selectedTokenAddress: `0x${string}` | undefined,
  extraSpenders: ApprovalSpender[] = [],
) {
  const factories = useMemo(() => {
    if (!token?.address || !owner || !selectedTokenAddress) return [];
    return getExtensionConfigs().map((config) => config.factoryAddress);
  }, [owner, selectedTokenAddress, token?.address]);
  const { actionIds, isPending: isPendingActionIds } = useActionIdsByAccount(
    token?.address || ZERO_ADDRESS,
    owner || ZERO_ADDRESS,
    factories,
  );

  const extensionContracts = useMemo(() => {
    if (!token?.address || !owner || !selectedTokenAddress || !actionIds || actionIds.length === 0) return [];
    return actionIds.flatMap((actionId) => [
      {
        address: EXTENSION_CENTER_ADDRESS,
        abi: ExtensionCenterAbi,
        functionName: 'extension' as const,
        args: [token.address, actionId],
      },
      {
        address: EXTENSION_CENTER_ADDRESS,
        abi: ExtensionCenterAbi,
        functionName: 'isAccountJoined' as const,
        args: [token.address, actionId, owner],
      },
    ]);
  }, [actionIds, owner, selectedTokenAddress, token?.address]);

  const {
    data: extensionData,
    isPending: isPendingExtensionData,
    error: extensionError,
  } = useUniversalReadContracts({
    contracts: extensionContracts as any,
    query: { enabled: extensionContracts.length > 0 },
  });

  const activeExtensions = useMemo(() => {
    if (!actionIds || !extensionData) return [];
    return actionIds.flatMap((actionId, index) => {
      const extensionAddress = extensionData[index * 2]?.result as `0x${string}` | undefined;
      const isJoined = extensionData[index * 2 + 1]?.result === true;
      if (!isJoined || !extensionAddress || extensionAddress === ZERO_ADDRESS) return [];
      return [{ actionId, extensionAddress }];
    });
  }, [actionIds, extensionData]);

  const extensionInfoContracts = useMemo(() => {
    if (!selectedTokenAddress) return [];
    return activeExtensions.flatMap((extension) => [
      {
        address: extension.extensionAddress,
        abi: IExtensionAbi,
        functionName: 'joinedAmountTokenAddress' as const,
        args: [],
      },
      {
        address: extension.extensionAddress,
        abi: IExtensionAbi,
        functionName: 'FACTORY_ADDRESS' as const,
        args: [],
      },
    ]);
  }, [activeExtensions, selectedTokenAddress]);

  const { data: extensionInfoData, isPending: isPendingExtensionInfo } = useUniversalReadContracts({
    contracts: extensionInfoContracts as any,
    query: { enabled: extensionInfoContracts.length > 0 },
  });

  const dynamicSpenders = useMemo(() => {
    if (!extensionInfoData) return [];
    return activeExtensions.flatMap((extension, index): ApprovalSpender[] => {
      const joinedTokenAddress = extensionInfoData[index * 2]?.result as `0x${string}` | undefined;
      const factoryAddress = extensionInfoData[index * 2 + 1]?.result as `0x${string}` | undefined;
      if (
        !selectedTokenAddress ||
        !joinedTokenAddress ||
        joinedTokenAddress.toLowerCase() !== selectedTokenAddress.toLowerCase()
      ) {
        return [];
      }

      return [
        {
          name: `${getFactoryName(factoryAddress || '', '扩展行动')} #${extension.actionId.toString()}`,
          category: '当前参与扩展',
          address: extension.extensionAddress,
          note: '当前正在参与的扩展行动',
        },
      ];
    });
  }, [activeExtensions, extensionInfoData, selectedTokenAddress]);

  const spenders = useMemo(
    () => (selectedTokenAddress ? uniqueSpenders([...envSpenders(), ...dynamicSpenders, ...extraSpenders]) : []),
    [dynamicSpenders, extraSpenders, selectedTokenAddress],
  );

  const allowanceContracts = useMemo(() => {
    if (!owner || !selectedTokenAddress || spenders.length === 0) return [];
    return spenders.map((spender) => ({
      address: selectedTokenAddress,
      abi: LOVE20TokenAbi,
      functionName: 'allowance' as const,
      args: [owner, spender.address],
    }));
  }, [owner, selectedTokenAddress, spenders]);

  const {
    data: allowanceData,
    isPending: isPendingAllowances,
    error: allowanceError,
    refetch,
  } = useUniversalReadContracts({
    contracts: allowanceContracts as any,
    query: { enabled: allowanceContracts.length > 0 },
  });

  const rows = useMemo(() => {
    return spenders.map((spender, index) => ({
      ...spender,
      allowance: allowanceData?.[index]?.result !== undefined ? safeToBigInt(allowanceData[index].result) : undefined,
    }));
  }, [allowanceData, spenders]);

  return {
    rows,
    isPending:
      (factories.length > 0 && isPendingActionIds) ||
      (extensionContracts.length > 0 && isPendingExtensionData) ||
      (extensionInfoContracts.length > 0 && isPendingExtensionInfo) ||
      (allowanceContracts.length > 0 && isPendingAllowances),
    error: extensionError || allowanceError,
    refetch,
  };
}
