import { useMemo } from 'react';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { ExtensionCenterAbi } from '@/src/abis/ExtensionCenter';
import { ExtensionGroupServiceAbi } from '@/src/abis/ExtensionGroupService';
import { LOVE20MintAbi } from '@/src/abis/LOVE20Mint';
import { LOVE20RoundViewerAbi } from '@/src/abis/LOVE20RoundViewer';
import { LOVE20SubmitAbi } from '@/src/abis/LOVE20Submit';
import { LOVE20VoteAbi } from '@/src/abis/LOVE20Vote';
import { UniswapV2PairAbi } from '@/src/abis/UniswapV2Pair';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { convertViaPairMidPrice, isTokenInPair, parsePairAddress } from '@/src/lib/uniswapValuation';
import { ActionInfo } from '@/src/types/love20types';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;
const GROUP_ACTION_FACTORY = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_ACTION_FACTORY as
  | `0x${string}`
  | undefined;
const GROUP_SERVICE_FACTORY = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_SERVICE_FACTORY as
  | `0x${string}`
  | undefined;
const EXTENSION_CENTER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER as `0x${string}` | undefined;
const MINT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MINT as `0x${string}`;
const ROUND_VIEWER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_ROUNDVIEWER as
  | `0x${string}`
  | undefined;
const SUBMIT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SUBMIT as `0x${string}` | undefined;
const VOTE_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VOTE as `0x${string}`;
const ACTION_REWARD_MIN_VOTE_PER_THOUSAND = BigInt(
  process.env.NEXT_PUBLIC_ACTION_REWARD_MIN_VOTE_PER_THOUSAND || '0',
);

type CommunityType = 'current' | 'parent';
type ConversionStatus = 'same-token' | 'converted' | 'missing-pair' | 'unusable-pair';

interface VotedActionCandidate {
  community: CommunityType;
  communityTokenAddress: `0x${string}`;
  communitySymbol?: string;
  actionId: bigint;
  actionVotes: bigint;
}

interface ExtensionActionCandidate extends VotedActionCandidate {
  extensionAddress: `0x${string}`;
  factoryAddress: `0x${string}`;
}

export interface GroupServiceIncentiveRatioItem {
  community: CommunityType;
  communityTokenAddress: `0x${string}`;
  communitySymbol?: string;
  actionId: bigint;
  actionTitle: string;
  extensionAddress: `0x${string}`;
  joinedRound: bigint;
  isJoined: boolean;
  actionVotes: bigint;
  totalVotes: bigint;
  estimatedReward: bigint;
  estimatedRewardInGroupActionToken: bigint;
  totalGroupActionEstimatedReward: bigint;
  ratioBasisPoints: bigint;
  conversionStatus: ConversionStatus;
}

export interface UseMyGroupServiceIncentiveRatiosParams {
  groupActionTokenAddress: `0x${string}` | undefined;
  groupActionPairAddress?: `0x${string}`;
  parentCommunityTokenAddress?: `0x${string}`;
  currentCommunitySymbol?: string;
  parentCommunitySymbol?: string;
  account: `0x${string}` | undefined;
  round: bigint | undefined;
}

export interface UseMyGroupServiceIncentiveRatiosResult {
  currentItems: GroupServiceIncentiveRatioItem[];
  parentItems: GroupServiceIncentiveRatioItem[];
  items: GroupServiceIncentiveRatioItem[];
  totalRatioBasisPoints: bigint;
  totalGroupActionEstimatedReward: bigint;
  isPending: boolean;
  error: any;
}

const sameAddress = (a: `0x${string}` | undefined, b: `0x${string}` | undefined) =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase();

const readResult = (data: any[] | undefined, index: number) => {
  const item = data?.[index];
  if (!item || item.status === 'failure') return undefined;
  return item.result;
};

const estimateActionRewardByVotes = (actionVotes: bigint, totalVotes: bigint, roundActionReward: bigint) => {
  if (actionVotes <= BigInt(0) || totalVotes <= BigInt(0) || roundActionReward <= BigInt(0)) return BigInt(0);

  const minVotesWithReward = (ACTION_REWARD_MIN_VOTE_PER_THOUSAND * totalVotes) / BigInt(1000);
  if (actionVotes < minVotesWithReward) return BigInt(0);

  return (roundActionReward * actionVotes) / totalVotes;
};

const normalizeVotesNums = (data: readonly [readonly bigint[], readonly bigint[]] | undefined) => {
  if (!data || data.length < 2) return [];

  const actionIds = data[0] || [];
  const votes = data[1] || [];

  return actionIds
    .map((actionId, index) => ({
      actionId,
      votes: safeToBigInt(votes[index]),
    }))
    .filter((item) => item.votes > BigInt(0));
};

/**
 * 获取“我的链群”页上的链群服务激励整体占比。
 *
 * 口径是参考估算：按验证阶段轮次的投票率估算链群行动和链群服务激励行动的铸币量；
 * 父币社区的服务激励会通过当前代币/父币 Uniswap 池折算到链群行动所在代币。
 */
export function useMyGroupServiceIncentiveRatios({
  groupActionTokenAddress,
  groupActionPairAddress,
  parentCommunityTokenAddress,
  currentCommunitySymbol,
  parentCommunitySymbol,
  account,
  round,
}: UseMyGroupServiceIncentiveRatiosParams): UseMyGroupServiceIncentiveRatiosResult {
  const canReadBase =
    !!GROUP_ACTION_FACTORY &&
    !!GROUP_SERVICE_FACTORY &&
    !!EXTENSION_CENTER_ADDRESS &&
    !!ROUND_VIEWER_ADDRESS &&
    !!account &&
    !!groupActionTokenAddress &&
    !!round &&
    round > BigInt(0);
  const hasParentCommunity =
    !!parentCommunityTokenAddress &&
    parentCommunityTokenAddress !== ZERO_ADDRESS &&
    !sameAddress(parentCommunityTokenAddress, groupActionTokenAddress);

  const communityTokenConfigs = useMemo(() => {
    const configs: Array<{
      community: CommunityType;
      communityTokenAddress: `0x${string}`;
      communitySymbol?: string;
    }> = [];

    if (groupActionTokenAddress) {
      configs.push({
        community: 'current',
        communityTokenAddress: groupActionTokenAddress,
        communitySymbol: currentCommunitySymbol,
      });
    }

    if (hasParentCommunity && parentCommunityTokenAddress) {
      configs.push({
        community: 'parent',
        communityTokenAddress: parentCommunityTokenAddress,
        communitySymbol: parentCommunitySymbol,
      });
    }

    return configs;
  }, [
    currentCommunitySymbol,
    groupActionTokenAddress,
    hasParentCommunity,
    parentCommunitySymbol,
    parentCommunityTokenAddress,
  ]);

  const votesNumsContracts = useMemo(() => {
    if (!canReadBase) return [];

    return communityTokenConfigs.map((config) => ({
      address: ROUND_VIEWER_ADDRESS as `0x${string}`,
      abi: LOVE20RoundViewerAbi,
      functionName: 'votesNums' as const,
      args: [config.communityTokenAddress, round] as const,
    }));
  }, [canReadBase, communityTokenConfigs, round]);

  const {
    data: votesNumsData,
    isPending: isPendingVotesNums,
    error: votesNumsError,
  } = useUniversalReadContracts({
    contracts: votesNumsContracts as any,
    query: {
      enabled: canReadBase && votesNumsContracts.length > 0,
    },
  });

  const votedActionCandidates = useMemo(() => {
    const candidates: VotedActionCandidate[] = [];
    if (!votesNumsData) return candidates;

    communityTokenConfigs.forEach((config, index) => {
      const votesNums = readResult(votesNumsData as any[], index) as
        | readonly [readonly bigint[], readonly bigint[]]
        | undefined;

      normalizeVotesNums(votesNums).forEach((item) => {
        candidates.push({
          ...config,
          actionId: item.actionId,
          actionVotes: item.votes,
        });
      });
    });

    return candidates;
  }, [communityTokenConfigs, votesNumsData]);

  const extensionLookupContracts = useMemo(() => {
    if (!canReadBase || votedActionCandidates.length === 0) return [];

    return votedActionCandidates.flatMap((candidate) => [
      {
        address: EXTENSION_CENTER_ADDRESS as `0x${string}`,
        abi: ExtensionCenterAbi,
        functionName: 'extension' as const,
        args: [candidate.communityTokenAddress, candidate.actionId] as const,
      },
      {
        address: EXTENSION_CENTER_ADDRESS as `0x${string}`,
        abi: ExtensionCenterAbi,
        functionName: 'factory' as const,
        args: [candidate.communityTokenAddress, candidate.actionId] as const,
      },
    ]);
  }, [canReadBase, votedActionCandidates]);

  const {
    data: extensionLookupData,
    isPending: isPendingExtensionLookup,
    error: extensionLookupError,
  } = useUniversalReadContracts({
    contracts: extensionLookupContracts as any,
    query: {
      enabled: canReadBase && extensionLookupContracts.length > 0,
    },
  });

  const extensionActionCandidates = useMemo(() => {
    const candidates: ExtensionActionCandidate[] = [];
    if (!extensionLookupData) return candidates;

    votedActionCandidates.forEach((candidate, index) => {
      const baseIndex = index * 2;
      const extensionAddress = readResult(extensionLookupData as any[], baseIndex) as `0x${string}` | undefined;
      const factoryAddress = readResult(extensionLookupData as any[], baseIndex + 1) as `0x${string}` | undefined;

      if (!extensionAddress || extensionAddress === ZERO_ADDRESS) return;
      if (!factoryAddress || factoryAddress === ZERO_ADDRESS) return;

      candidates.push({
        ...candidate,
        extensionAddress,
        factoryAddress,
      });
    });

    return candidates;
  }, [extensionLookupData, votedActionCandidates]);

  const groupActionCandidates = useMemo(
    () =>
      extensionActionCandidates.filter(
        (candidate) =>
          candidate.community === 'current' &&
          sameAddress(candidate.communityTokenAddress, groupActionTokenAddress) &&
          sameAddress(candidate.factoryAddress, GROUP_ACTION_FACTORY),
      ),
    [extensionActionCandidates, groupActionTokenAddress],
  );

  const serviceExtensionCandidates = useMemo(
    () =>
      extensionActionCandidates.filter((candidate) => sameAddress(candidate.factoryAddress, GROUP_SERVICE_FACTORY)),
    [extensionActionCandidates],
  );

  const serviceTargetContracts = useMemo(() => {
    if (!canReadBase || serviceExtensionCandidates.length === 0) return [];

    return serviceExtensionCandidates.map((candidate) => ({
      address: candidate.extensionAddress,
      abi: ExtensionGroupServiceAbi,
      functionName: 'GROUP_ACTION_TOKEN_ADDRESS' as const,
    }));
  }, [canReadBase, serviceExtensionCandidates]);

  const {
    data: serviceTargetData,
    isPending: isPendingServiceTargets,
    error: serviceTargetError,
  } = useUniversalReadContracts({
    contracts: serviceTargetContracts as any,
    query: {
      enabled: canReadBase && serviceTargetContracts.length > 0,
    },
  });

  const serviceActionCandidates = useMemo(() => {
    const candidates: ExtensionActionCandidate[] = [];
    if (!groupActionTokenAddress || !serviceTargetData) return candidates;

    serviceExtensionCandidates.forEach((candidate, index) => {
      const servedGroupActionTokenAddress = readResult(serviceTargetData as any[], index) as `0x${string}` | undefined;
      if (!sameAddress(servedGroupActionTokenAddress, groupActionTokenAddress)) return;

      candidates.push(candidate);
    });

    return candidates;
  }, [groupActionTokenAddress, serviceExtensionCandidates, serviceTargetData]);

  const involvedCommunityTokens = useMemo(() => {
    const tokenByAddress = new Map<string, `0x${string}`>();
    if (groupActionTokenAddress) {
      tokenByAddress.set(groupActionTokenAddress.toLowerCase(), groupActionTokenAddress);
    }

    serviceActionCandidates.forEach((candidate) => {
      tokenByAddress.set(candidate.communityTokenAddress.toLowerCase(), candidate.communityTokenAddress);
    });

    return Array.from(tokenByAddress.values());
  }, [groupActionTokenAddress, serviceActionCandidates]);

  const needsPairQuote = useMemo(
    () =>
      !!groupActionTokenAddress &&
      serviceActionCandidates.some((candidate) => !sameAddress(candidate.communityTokenAddress, groupActionTokenAddress)),
    [groupActionTokenAddress, serviceActionCandidates],
  );

  const parsedPairAddress = useMemo(() => parsePairAddress(groupActionPairAddress), [groupActionPairAddress]);

  const estimateContracts = useMemo(() => {
    if (!account || !groupActionTokenAddress || !round || serviceActionCandidates.length === 0) {
      return [];
    }

    const tokenMetricContracts = involvedCommunityTokens.flatMap((tokenAddress) => [
      {
        address: MINT_ADDRESS,
        abi: LOVE20MintAbi,
        functionName: 'calculateRoundActionReward' as const,
        args: [tokenAddress] as const,
      },
      {
        address: VOTE_ADDRESS,
        abi: LOVE20VoteAbi,
        functionName: 'votesNum' as const,
        args: [tokenAddress, round] as const,
      },
    ]);

    const serviceJoinInfoContracts = serviceActionCandidates.map((candidate) => ({
      address: candidate.extensionAddress,
      abi: ExtensionGroupServiceAbi,
      functionName: 'joinInfo' as const,
      args: [account] as const,
    }));

    const serviceActionInfoContracts = SUBMIT_ADDRESS
      ? serviceActionCandidates.map((candidate) => ({
          address: SUBMIT_ADDRESS,
          abi: LOVE20SubmitAbi,
          functionName: 'actionInfo' as const,
          args: [candidate.communityTokenAddress, candidate.actionId] as const,
        }))
      : [];

    const pairContracts =
      needsPairQuote && parsedPairAddress
        ? [
            {
              address: parsedPairAddress,
              abi: UniswapV2PairAbi,
              functionName: 'getReserves' as const,
            },
            {
              address: parsedPairAddress,
              abi: UniswapV2PairAbi,
              functionName: 'token0' as const,
            },
            {
              address: parsedPairAddress,
              abi: UniswapV2PairAbi,
              functionName: 'token1' as const,
            },
          ]
        : [];

    return [
      ...tokenMetricContracts,
      ...serviceJoinInfoContracts,
      ...serviceActionInfoContracts,
      ...pairContracts,
    ];
  }, [
    account,
    groupActionTokenAddress,
    involvedCommunityTokens,
    needsPairQuote,
    parsedPairAddress,
    round,
    serviceActionCandidates,
  ]);

  const {
    data: estimateData,
    isPending: isPendingEstimates,
    error: estimatesError,
  } = useUniversalReadContracts({
    contracts: estimateContracts as any,
    query: {
      enabled:
        !!account &&
        !!groupActionTokenAddress &&
        !!round &&
        serviceActionCandidates.length > 0 &&
        estimateContracts.length > 0,
    },
  });

  const { items, totalRatioBasisPoints, totalGroupActionEstimatedReward } = useMemo(() => {
    const emptyResult = {
      items: [] as GroupServiceIncentiveRatioItem[],
      totalRatioBasisPoints: BigInt(0),
      totalGroupActionEstimatedReward: BigInt(0),
    };

    if (!groupActionTokenAddress || !estimateData || serviceActionCandidates.length === 0) return emptyResult;

    const tokenMetricCount = involvedCommunityTokens.length * 2;
    const serviceJoinInfoStart = tokenMetricCount;
    const serviceActionInfoStart = serviceJoinInfoStart + serviceActionCandidates.length;
    const serviceActionInfoCount = SUBMIT_ADDRESS ? serviceActionCandidates.length : 0;
    const pairStart = serviceActionInfoStart + serviceActionInfoCount;

    const tokenMetricsByAddress = new Map<string, { roundActionReward: bigint; totalVotes: bigint }>();
    involvedCommunityTokens.forEach((tokenAddress, index) => {
      const baseIndex = index * 2;
      tokenMetricsByAddress.set(tokenAddress.toLowerCase(), {
        roundActionReward: safeToBigInt(readResult(estimateData as any[], baseIndex)),
        totalVotes: safeToBigInt(readResult(estimateData as any[], baseIndex + 1)),
      });
    });

    const currentTokenMetrics = tokenMetricsByAddress.get(groupActionTokenAddress.toLowerCase()) || {
      roundActionReward: BigInt(0),
      totalVotes: BigInt(0),
    };

    const totalGroupActionReward = groupActionCandidates.reduce((sum, candidate) => {
      const actionVotes = candidate.actionVotes;
      return (
        sum +
        estimateActionRewardByVotes(
          actionVotes,
          currentTokenMetrics.totalVotes,
          currentTokenMetrics.roundActionReward,
        )
      );
    }, BigInt(0));

    const pairData =
      needsPairQuote && parsedPairAddress
        ? {
            pairAddress: parsedPairAddress,
            reserves: readResult(estimateData as any[], pairStart) as [bigint, bigint, number] | undefined,
            token0: readResult(estimateData as any[], pairStart + 1) as `0x${string}` | undefined,
            token1: readResult(estimateData as any[], pairStart + 2) as `0x${string}` | undefined,
          }
        : undefined;

    const convertToGroupActionToken = (
      amount: bigint,
      fromToken: `0x${string}`,
    ): { amount: bigint; status: ConversionStatus } => {
      if (sameAddress(fromToken, groupActionTokenAddress)) {
        return { amount, status: 'same-token' };
      }

      if (!parsedPairAddress || !pairData) {
        return { amount: BigInt(0), status: 'missing-pair' };
      }

      if (!isTokenInPair(fromToken, pairData) || !isTokenInPair(groupActionTokenAddress, pairData)) {
        return { amount: BigInt(0), status: 'unusable-pair' };
      }

      const convertedAmount = convertViaPairMidPrice(amount, fromToken, groupActionTokenAddress, pairData);
      return convertedAmount === undefined
        ? { amount: BigInt(0), status: 'unusable-pair' }
        : { amount: convertedAmount, status: 'converted' };
    };

    const result: GroupServiceIncentiveRatioItem[] = [];

    serviceActionCandidates.forEach((candidate, index) => {
      const joinedRound = safeToBigInt(readResult(estimateData as any[], serviceJoinInfoStart + index));
      const actionInfo =
        serviceActionInfoCount > 0
          ? (readResult(estimateData as any[], serviceActionInfoStart + index) as ActionInfo | undefined)
          : undefined;
      const communityMetrics = tokenMetricsByAddress.get(candidate.communityTokenAddress.toLowerCase()) || {
        roundActionReward: BigInt(0),
        totalVotes: BigInt(0),
      };
      const actionVotes = candidate.actionVotes;
      if (actionVotes <= BigInt(0)) return;

      const estimatedReward = estimateActionRewardByVotes(
        actionVotes,
        communityMetrics.totalVotes,
        communityMetrics.roundActionReward,
      );
      const converted = convertToGroupActionToken(estimatedReward, candidate.communityTokenAddress);
      const ratioBasisPoints =
        totalGroupActionReward > BigInt(0)
          ? (converted.amount * BigInt(10000)) / totalGroupActionReward
          : BigInt(0);

      result.push({
        ...candidate,
        actionTitle: actionInfo?.body?.title || `行动 #${candidate.actionId.toString()}`,
        joinedRound,
        isJoined: joinedRound > BigInt(0),
        actionVotes,
        totalVotes: communityMetrics.totalVotes,
        estimatedReward,
        estimatedRewardInGroupActionToken: converted.amount,
        totalGroupActionEstimatedReward: totalGroupActionReward,
        ratioBasisPoints,
        conversionStatus: converted.status,
      });
    });

    const sortedItems = result.sort((a, b) => {
      if (a.community !== b.community) return a.community === 'current' ? -1 : 1;
      return a.actionId > b.actionId ? -1 : a.actionId < b.actionId ? 1 : 0;
    });

    const convertedServiceReward = sortedItems.reduce(
      (sum, item) => sum + item.estimatedRewardInGroupActionToken,
      BigInt(0),
    );

    return {
      items: sortedItems,
      totalRatioBasisPoints:
        totalGroupActionReward > BigInt(0) ? (convertedServiceReward * BigInt(10000)) / totalGroupActionReward : BigInt(0),
      totalGroupActionEstimatedReward: totalGroupActionReward,
    };
  }, [
    estimateData,
    groupActionCandidates,
    groupActionTokenAddress,
    involvedCommunityTokens,
    needsPairQuote,
    parsedPairAddress,
    serviceActionCandidates,
  ]);

  const currentItems = useMemo(() => items.filter((item) => item.community === 'current'), [items]);
  const parentItems = useMemo(() => items.filter((item) => item.community === 'parent'), [items]);

  const hasServiceExtensionCandidates = serviceExtensionCandidates.length > 0;
  const hasCandidates = serviceActionCandidates.length > 0;
  const isPending =
    !!canReadBase &&
    (isPendingVotesNums ||
      (extensionLookupContracts.length > 0 && isPendingExtensionLookup) ||
      (hasServiceExtensionCandidates && isPendingServiceTargets) ||
      (hasCandidates && isPendingEstimates));

  return {
    currentItems,
    parentItems,
    items,
    totalRatioBasisPoints,
    totalGroupActionEstimatedReward,
    isPending,
    error: votesNumsError || extensionLookupError || serviceTargetError || estimatesError,
  };
}
