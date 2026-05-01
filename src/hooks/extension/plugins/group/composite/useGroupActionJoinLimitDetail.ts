// hooks/extension/plugins/group/composite/useGroupActionJoinLimitDetail.ts
// 读取链群行动单地址参与上限的计算明细

import { useMemo } from 'react';
import { ExtensionGroupActionAbi } from '@/src/abis/ExtensionGroupAction';
import { GroupManagerAbi } from '@/src/abis/GroupManager';
import { LOVE20JoinAbi } from '@/src/abis/LOVE20Join';
import { LOVE20TokenAbi } from '@/src/abis/LOVE20Token';
import { LOVE20VoteAbi } from '@/src/abis/LOVE20Vote';
import { safeToBigInt } from '@/src/lib/clientUtils';
import type { ActionJoinLimitDetail } from '@/src/lib/extensionGroup';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';

const GROUP_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`;
const JOIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN as `0x${string}`;
const VOTE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VOTE as `0x${string}`;

export interface UseGroupActionJoinLimitDetailParams {
  actionId: bigint | undefined;
  extensionAddress: `0x${string}` | undefined;
  joinTokenAddress: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
}

export const useGroupActionJoinLimitDetail = ({
  actionId,
  extensionAddress,
  joinTokenAddress,
  tokenAddress,
}: UseGroupActionJoinLimitDetailParams) => {
  const contracts = useMemo(() => {
    if (actionId === undefined || !extensionAddress || !joinTokenAddress || !tokenAddress) return [];

    return [
      {
        address: JOIN_CONTRACT_ADDRESS,
        abi: LOVE20JoinAbi,
        functionName: 'currentRound' as const,
      },
      {
        address: joinTokenAddress,
        abi: LOVE20TokenAbi,
        functionName: 'totalSupply' as const,
      },
      {
        address: extensionAddress,
        abi: ExtensionGroupActionAbi,
        functionName: 'MAX_JOIN_AMOUNT_RATIO' as const,
      },
      {
        address: GROUP_MANAGER_ADDRESS,
        abi: GroupManagerAbi,
        functionName: 'maxJoinAmount' as const,
        args: [extensionAddress] as const,
      },
    ];
  }, [actionId, extensionAddress, joinTokenAddress, tokenAddress]);

  const {
    data: baseData,
    isPending: isBasePending,
    error: baseError,
  } = useUniversalReadContracts({
    contracts: contracts as any,
    query: {
      enabled: contracts.length > 0,
    },
  });

  const round = useMemo(() => safeToBigInt(baseData?.[0]?.result), [baseData]);

  const voteContracts = useMemo(() => {
    if (actionId === undefined || !tokenAddress || round <= BigInt(0)) return [];

    return [
      {
        address: VOTE_CONTRACT_ADDRESS,
        abi: LOVE20VoteAbi,
        functionName: 'votesNum' as const,
        args: [tokenAddress, round] as const,
      },
      {
        address: VOTE_CONTRACT_ADDRESS,
        abi: LOVE20VoteAbi,
        functionName: 'votesNumByActionId' as const,
        args: [tokenAddress, round, actionId] as const,
      },
    ];
  }, [actionId, tokenAddress, round]);

  const {
    data: voteData,
    isPending: isVotePending,
    error: voteError,
  } = useUniversalReadContracts({
    contracts: voteContracts as any,
    query: {
      enabled: voteContracts.length > 0,
    },
  });

  const detail = useMemo<ActionJoinLimitDetail | undefined>(() => {
    if (!baseData || baseData.length < 4) return undefined;
    if (!voteData || voteData.length < 2) return undefined;
    if (
      baseData[0]?.status !== 'success' ||
      baseData[1]?.status !== 'success' ||
      baseData[2]?.status !== 'success' ||
      baseData[3]?.status !== 'success' ||
      voteData[0]?.status !== 'success' ||
      voteData[1]?.status !== 'success'
    ) {
      return undefined;
    }

    return {
      round,
      joinTokenTotalSupply: safeToBigInt(baseData[1]?.result),
      maxJoinAmountRatio: safeToBigInt(baseData[2]?.result),
      actionMaxJoinAmount: safeToBigInt(baseData[3]?.result),
      totalVotes: safeToBigInt(voteData?.[0]?.result),
      actionVotes: safeToBigInt(voteData?.[1]?.result),
    };
  }, [baseData, round, voteData]);

  return {
    detail,
    isPending: isBasePending || isVotePending,
    error: baseError || voteError,
  };
};
