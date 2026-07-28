import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { isAddress, zeroAddress } from 'viem';

import { BurnAbi } from '@/src/abis/Burn';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { type BurnStats, type CategoryStats } from '@/src/lib/burnStats';
import { useUniversalReadContract, useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';

export type { BurnStats, CategoryStats } from '@/src/lib/burnStats';

export interface RewardBurnState {
  claimableRewardAmount: bigint;
  claimedRewardAmount: bigint;
  isClaimed: boolean;
  burnQuotaAmount: bigint;
  burnedAmount: bigint;
  unusedQuotaAmount: bigint;
}

export interface ActionRewardBurnState {
  actionId: bigint;
  extensionAddress: `0x${string}`;
  reward: RewardBurnState;
}

export interface TokenShare {
  slTokenLock: bigint;
  stTokenLock: bigint;
  govRewardBurn: bigint;
  actionRewardBurn: bigint;
  total: bigint;
  finalized: boolean;
}

export interface AirdropState {
  enabled: boolean;
  shareFinalized: boolean;
  isClaimed: boolean;
  share: bigint;
  claimableAmount: bigint;
  claimedAmount: bigint;
}

export interface ActionRewardBurnRequest {
  tokenAddress: `0x${string}`;
  actionId: bigint;
  amount: bigint;
}

const configuredBurnAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BURN;

export const BURN_CONTRACT_ADDRESS =
  configuredBurnAddress && isAddress(configuredBurnAddress)
    ? (configuredBurnAddress as `0x${string}`)
    : zeroAddress;

export const isBurnEnabled = BURN_CONTRACT_ADDRESS !== zeroAddress;

const field = (value: any, name: string, index: number) => value?.[name] ?? value?.[index];

const parseCategoryStats = (value: any): CategoryStats => ({
  amount: safeToBigInt(field(value, 'amount', 0)),
  score: safeToBigInt(field(value, 'score', 1)),
});

export const parseBurnStats = (value: any): BurnStats => ({
  slTokenLock: parseCategoryStats(field(value, 'slTokenLock', 0)),
  stTokenLock: parseCategoryStats(field(value, 'stTokenLock', 1)),
  govRewardBurn: parseCategoryStats(field(value, 'govRewardBurn', 2)),
  actionRewardBurn: parseCategoryStats(field(value, 'actionRewardBurn', 3)),
});

const parseRewardBurnState = (value: any): RewardBurnState => ({
  claimableRewardAmount: safeToBigInt(field(value, 'claimableRewardAmount', 0)),
  claimedRewardAmount: safeToBigInt(field(value, 'claimedRewardAmount', 1)),
  isClaimed: Boolean(field(value, 'isClaimed', 2)),
  burnQuotaAmount: safeToBigInt(field(value, 'burnQuotaAmount', 3)),
  burnedAmount: safeToBigInt(field(value, 'burnedAmount', 4)),
  unusedQuotaAmount: safeToBigInt(field(value, 'unusedQuotaAmount', 5)),
});

const parseTokenShare = (value: any): TokenShare => ({
  slTokenLock: safeToBigInt(field(value, 'slTokenLock', 0)),
  stTokenLock: safeToBigInt(field(value, 'stTokenLock', 1)),
  govRewardBurn: safeToBigInt(field(value, 'govRewardBurn', 2)),
  actionRewardBurn: safeToBigInt(field(value, 'actionRewardBurn', 3)),
  total: safeToBigInt(field(value, 'total', 4)),
  finalized: Boolean(field(value, 'finalized', 5)),
});

const parseAirdropState = (value: any): AirdropState => ({
  enabled: Boolean(field(value, 'enabled', 0)),
  shareFinalized: Boolean(field(value, 'shareFinalized', 1)),
  isClaimed: Boolean(field(value, 'isClaimed', 2)),
  share: safeToBigInt(field(value, 'share', 3)),
  claimableAmount: safeToBigInt(field(value, 'claimableAmount', 4)),
  claimedAmount: safeToBigInt(field(value, 'claimedAmount', 5)),
});

const batchResult = (data: any, index: number) =>
  data?.[index]?.status === 'success' ? data[index].result : undefined;

export function useBurnActivityConfig() {
  const contracts = useMemo(
    () =>
      [
        'scopeTokenAddress',
        'airdropTokenAddress',
        'startRound',
        'roundCount',
        'endRound',
        'quotaMultiplier',
        'totalCommunityWeight',
        'communities',
        'participantsCount',
      ].map((functionName) => ({
        address: BURN_CONTRACT_ADDRESS,
        abi: BurnAbi,
        functionName,
        args: [],
      })),
    [],
  );

  const { data, isPending, error, refetch } = useUniversalReadContracts({
    contracts: contracts as any,
    query: { enabled: isBurnEnabled },
  });

  const resultError = (data as any)?.find((item: any) => item?.status === 'failure')?.error;

  return {
    scopeTokenAddress: batchResult(data, 0) as `0x${string}` | undefined,
    airdropTokenAddress: batchResult(data, 1) as `0x${string}` | undefined,
    startRound: safeToBigInt(batchResult(data, 2)),
    roundCount: safeToBigInt(batchResult(data, 3)),
    endRound: safeToBigInt(batchResult(data, 4)),
    quotaMultiplier: safeToBigInt(batchResult(data, 5)),
    totalCommunityWeight: safeToBigInt(batchResult(data, 6)),
    communities: (batchResult(data, 7) as `0x${string}`[] | undefined) || [],
    participantsCount: safeToBigInt(batchResult(data, 8)),
    isPending: isBurnEnabled && isPending,
    error: error || resultError,
    refetch,
  };
}

function useBurnRead(functionName: string, args: readonly unknown[], enabled: boolean) {
  return useUniversalReadContract({
    address: BURN_CONTRACT_ADDRESS,
    abi: BurnAbi,
    functionName,
    args,
    query: { enabled: isBurnEnabled && enabled },
  } as any);
}

export function useBurnRoundOpen(round: bigint | undefined, enabled = true) {
  const query = useBurnRead('isRoundOpen', [round ?? BigInt(0)], enabled && round !== undefined);
  return { isOpen: Boolean(query.data), ...query };
}

export function useBurnScoreMultiplier(tokenAddress: `0x${string}` | undefined, round: bigint | undefined) {
  const query = useBurnRead(
    'scoreMultiplier',
    [tokenAddress ?? zeroAddress, round ?? BigInt(0)],
    !!tokenAddress && round !== undefined,
  );
  return { multiplier: safeToBigInt(query.data), ...query };
}

export function useBurnCommunityWeights(tokenAddresses: readonly `0x${string}`[]) {
  const contracts = useMemo(
    () =>
      tokenAddresses.map((tokenAddress) => ({
        address: BURN_CONTRACT_ADDRESS,
        abi: BurnAbi,
        functionName: 'communityWeight' as const,
        args: [tokenAddress],
      })),
    [tokenAddresses],
  );

  const { data, isPending, error, refetch } = useUniversalReadContracts({
    contracts: contracts as any,
    query: { enabled: isBurnEnabled && contracts.length > 0 },
  });
  const resultError = (data as any)?.find((item: any) => item?.status === 'failure')?.error;
  const weights = useMemo(
    () => tokenAddresses.map((_, index) => safeToBigInt(batchResult(data, index))),
    [data, tokenAddresses],
  );

  return { weights, isPending: isBurnEnabled && contracts.length > 0 && isPending, error: error || resultError, refetch };
}

export function useBurnCommunityRoundStats(tokenAddress: `0x${string}` | undefined, round: bigint | undefined) {
  const query = useBurnRead(
    'communityRoundBurnStats',
    [tokenAddress ?? zeroAddress, round ?? BigInt(0)],
    !!tokenAddress && round !== undefined,
  );
  return { stats: parseBurnStats(query.data), ...query };
}

export function useBurnCommunityStatsThroughRound(
  tokenAddress: `0x${string}` | undefined,
  round: bigint | undefined,
) {
  const query = useBurnRead(
    'communityBurnStatsThroughRound',
    [tokenAddress ?? zeroAddress, round ?? BigInt(0)],
    !!tokenAddress && round !== undefined,
  );
  return { stats: parseBurnStats(query.data), ...query };
}

export function useBurnAccountRoundStats(
  account: `0x${string}` | undefined,
  tokenAddress: `0x${string}` | undefined,
  round: bigint | undefined,
) {
  const query = useBurnRead(
    'accountRoundBurnStats',
    [account ?? zeroAddress, tokenAddress ?? zeroAddress, round ?? BigInt(0)],
    !!account && !!tokenAddress && round !== undefined,
  );
  return { stats: parseBurnStats(query.data), ...query };
}

export function useBurnAccountStatsThroughRound(
  account: `0x${string}` | undefined,
  tokenAddress: `0x${string}` | undefined,
  round: bigint | undefined,
) {
  const query = useBurnRead(
    'accountBurnStatsThroughRound',
    [account ?? zeroAddress, tokenAddress ?? zeroAddress, round ?? BigInt(0)],
    !!account && !!tokenAddress && round !== undefined,
  );
  return { stats: parseBurnStats(query.data), ...query };
}

export function useBurnCommunityStats(tokenAddress: `0x${string}` | undefined) {
  const query = useBurnRead('communityBurnStats', [tokenAddress ?? zeroAddress], !!tokenAddress);
  return { stats: parseBurnStats(query.data), ...query };
}

export function useBurnAccountStats(account: `0x${string}` | undefined, tokenAddress: `0x${string}` | undefined) {
  const query = useBurnRead(
    'accountBurnStats',
    [account ?? zeroAddress, tokenAddress ?? zeroAddress],
    !!account && !!tokenAddress,
  );
  return { stats: parseBurnStats(query.data), ...query };
}

export function useBurnGovRewardState(
  account: `0x${string}` | undefined,
  tokenAddress: `0x${string}` | undefined,
  round: bigint | undefined,
) {
  const query = useBurnRead(
    'govRewardBurnState',
    [account ?? zeroAddress, tokenAddress ?? zeroAddress, round ?? BigInt(0)],
    !!account && !!tokenAddress && round !== undefined,
  );
  return { state: parseRewardBurnState(query.data), ...query };
}

export function useBurnActionRewardStates(
  account: `0x${string}` | undefined,
  tokenAddress: `0x${string}` | undefined,
  round: bigint | undefined,
) {
  const enabled = isBurnEnabled && !!account && !!tokenAddress && round !== undefined;
  const query = useReadContract({
    address: BURN_CONTRACT_ADDRESS,
    abi: BurnAbi,
    functionName: 'actionRewardBurnStates',
    args: [account ?? zeroAddress, tokenAddress ?? zeroAddress, round ?? BigInt(0)],
    query: { enabled },
  });
  const states = useMemo(
    () =>
      ((query.data as any[]) || []).map((value) => ({
        actionId: safeToBigInt(field(value, 'actionId', 0)),
        extensionAddress: field(value, 'extensionAddress', 1) as `0x${string}`,
        reward: parseRewardBurnState(field(value, 'reward', 2)),
      })),
    [query.data],
  );

  return {
    states,
    ...query,
  };
}

export function useBurnAccountTokenShare(
  account: `0x${string}` | undefined,
  tokenAddress: `0x${string}` | undefined,
) {
  const query = useBurnRead(
    'accountTokenShare',
    [account ?? zeroAddress, tokenAddress ?? zeroAddress],
    !!account && !!tokenAddress,
  );
  return { share: parseTokenShare(query.data), ...query };
}

export function useBurnAccountOverview(account: `0x${string}` | undefined) {
  const contracts = useMemo(
    () => [
      {
        address: BURN_CONTRACT_ADDRESS,
        abi: BurnAbi,
        functionName: 'accountShare',
        args: [account ?? zeroAddress],
      },
      {
        address: BURN_CONTRACT_ADDRESS,
        abi: BurnAbi,
        functionName: 'accountAirdropState',
        args: [account ?? zeroAddress],
      },
    ],
    [account],
  );
  const { data, isPending, error, refetch } = useUniversalReadContracts({
    contracts: contracts as any,
    query: { enabled: isBurnEnabled && !!account },
  });
  const shareResult = batchResult(data, 0);

  return {
    totalShare: safeToBigInt(field(shareResult, 'share', 0)),
    shareFinalized: Boolean(field(shareResult, 'finalized', 1)),
    airdropState: parseAirdropState(batchResult(data, 1)),
    isPending: isBurnEnabled && !!account && isPending,
    error,
    refetch,
  };
}

export function useBurnLockSLToken() {
  const transaction = useUniversalTransaction(BurnAbi, BURN_CONTRACT_ADDRESS, 'lockSLToken');
  return {
    lockSLToken: (tokenAddress: `0x${string}`, round: bigint, amount: bigint) =>
      transaction.execute([tokenAddress, round, amount]),
    ...transaction,
  };
}

export function useBurnLockSTToken() {
  const transaction = useUniversalTransaction(BurnAbi, BURN_CONTRACT_ADDRESS, 'lockSTToken');
  return {
    lockSTToken: (tokenAddress: `0x${string}`, round: bigint, amount: bigint) =>
      transaction.execute([tokenAddress, round, amount]),
    ...transaction,
  };
}

export function useBurnGovRewardToken() {
  const transaction = useUniversalTransaction(BurnAbi, BURN_CONTRACT_ADDRESS, 'burnGovRewardToken');
  return {
    burnGovRewardToken: (tokenAddress: `0x${string}`, round: bigint, amount: bigint) =>
      transaction.execute([tokenAddress, round, amount]),
    ...transaction,
  };
}

export function useBurnActionRewardTokens() {
  const transaction = useUniversalTransaction(BurnAbi, BURN_CONTRACT_ADDRESS, 'burnActionRewardTokens');
  return {
    burnActionRewardTokens: (round: bigint, requests: ActionRewardBurnRequest[]) =>
      transaction.execute([round, requests]),
    ...transaction,
  };
}

export function useBurnClaimAirdrop() {
  const transaction = useUniversalTransaction(BurnAbi, BURN_CONTRACT_ADDRESS, 'claimAirdrop');
  return { claimAirdrop: () => transaction.execute([]), ...transaction };
}
