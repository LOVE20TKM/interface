import { useEffect, useMemo } from 'react';

import { GroupAdminAbi } from '@/src/abis/GroupAdmin';
import { GroupBanListAbi } from '@/src/abis/GroupBanList';
import { GroupMemberAbi } from '@/src/abis/GroupMember';
import { GovVotedBanSourceAbi } from '@/src/abis/GovVotedBanSource';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';
import { useUniversalReadContract } from '@/src/lib/universalReadContract';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import {
  getSingleArray,
  getResultArray,
  normalizeAddress,
  parseAdminBanAddressRecords,
  parseAdminBanSenderRecords,
  parseAdminRecords,
  parseGovVoteStatus,
  parseGovVotedAddressRecords,
  parseGovVotedSenderRecords,
  parseGovVoterRecords,
  type AdminBanAddressRecord,
  type AdminBanSenderRecord,
  type GovVoteStatus,
  type GovVotedAddressRecord,
  type GovVotedSenderRecord,
  type GovVoterRecord,
  type GroupAdminRecord,
} from './groupChatModerationTypes';

export type {
  AdminBanAddressRecord,
  AdminBanSenderRecord,
  GovVoteStatus,
  GovVotedAddressRecord,
  GovVotedSenderRecord,
  GovVoterRecord,
  GroupAdminRecord,
} from './groupChatModerationTypes';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

const GROUP_ADMIN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN as `0x${string}` | undefined;
const GROUP_MEMBER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_MEMBER as `0x${string}` | undefined;
const GROUP_BAN_LIST_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_BAN_LIST as `0x${string}` | undefined;
const ADMIN_BAN_SOURCE_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN_BAN_SOURCE as
  | `0x${string}`
  | undefined;
const GOV_VOTED_BAN_SOURCE_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_GOV_VOTED_BAN_SOURCE as
  | `0x${string}`
  | undefined;
const GROUP_MEMBER_SCOPE_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_MEMBER_SCOPE as
  | `0x${string}`
  | undefined;
const GROUP_JOIN_SCOPE_SOURCE_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_JOIN_SCOPE_SOURCE as
  | `0x${string}`
  | undefined;

const getGroupAdminAddress = () => (GROUP_ADMIN_ADDRESS || ZERO_ADDRESS) as `0x${string}`;
const getGroupMemberAddress = () => (GROUP_MEMBER_ADDRESS || ZERO_ADDRESS) as `0x${string}`;
const getGroupBanListAddress = () => (GROUP_BAN_LIST_ADDRESS || ZERO_ADDRESS) as `0x${string}`;
const getAdminBanSourceAddress = () => (ADMIN_BAN_SOURCE_ADDRESS || ZERO_ADDRESS) as `0x${string}`;
const getGovVotedBanSourceAddress = () => (GOV_VOTED_BAN_SOURCE_ADDRESS || ZERO_ADDRESS) as `0x${string}`;
const getGroupMemberScopeAddress = () => (GROUP_MEMBER_SCOPE_ADDRESS || ZERO_ADDRESS) as `0x${string}`;
const getGroupJoinScopeSourceAddress = () => (GROUP_JOIN_SCOPE_SOURCE_ADDRESS || ZERO_ADDRESS) as `0x${string}`;

export const isGroupAdminEnabled = !!GROUP_ADMIN_ADDRESS;
export const isGroupMemberEnabled = !!GROUP_MEMBER_ADDRESS;
export const isGroupBanListEnabled = !!GROUP_BAN_LIST_ADDRESS;
export const isGovVotedBanSourceEnabled = !!GOV_VOTED_BAN_SOURCE_ADDRESS;
export const isGroupMemberScopeEnabled = !!GROUP_MEMBER_SCOPE_ADDRESS;
export const isGroupJoinScopeSourceEnabled = !!GROUP_JOIN_SCOPE_SOURCE_ADDRESS;
export const GROUP_CHAT_ADMIN_ADDRESS = getGroupAdminAddress();
export const GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS = getAdminBanSourceAddress();
export const GROUP_CHAT_GOV_VOTED_BAN_SOURCE_ADDRESS = getGovVotedBanSourceAddress();
export const GROUP_CHAT_MEMBER_SCOPE_ADDRESS = getGroupMemberScopeAddress();
export const GROUP_CHAT_JOIN_SCOPE_SOURCE_ADDRESS = getGroupJoinScopeSourceAddress();

const isPositiveId = (value: bigint | undefined) => value !== undefined && value > BigInt(0);

function useWrite(abi: readonly any[], address: `0x${string}`, functionName: string) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    abi,
    address,
    functionName,
  );

  useEffect(() => {
    if (hash) console.log(`${functionName} tx hash:`, hash);
    if (error) {
      console.log(`提交${functionName}交易错误:`);
      logWeb3Error(error);
      logError(error);
    }
  }, [error, functionName, hash]);

  return { execute, isPending, isConfirming, isConfirmed, writeError: error, hash, isTukeMode };
}

export function useGroupAdminIds(groupId: bigint | undefined, enabled: boolean = true) {
  const isQueryEnabled = isGroupAdminEnabled && enabled && isPositiveId(groupId);
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getGroupAdminAddress(),
    abi: GroupAdminAbi,
    functionName: 'adminIds',
    args: [groupId || BigInt(0)],
    query: { enabled: isQueryEnabled },
  });

  const adminRecords = isQueryEnabled ? parseAdminRecords(data) : [];

  return {
    adminRecords,
    adminIds: adminRecords.map((item) => item.id),
    effectiveAdminIds: adminRecords.filter((item) => item.isEffective).map((item) => item.id),
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
}

export function useGroupMentionAllPermission(
  groupId: bigint | undefined,
  account: `0x${string}` | undefined,
  enabled: boolean = true,
) {
  const isQueryEnabled = isGroupAdminEnabled && enabled && isPositiveId(groupId) && !!account;
  const {
    data: ownerOrDelegateData,
    isPending: isPendingOwnerOrDelegate,
    error: ownerOrDelegateError,
    refetch: refetchOwnerOrDelegate,
  } = useUniversalReadContract({
    address: getGroupAdminAddress(),
    abi: GroupAdminAbi,
    functionName: 'ownerOrDelegateIdOf',
    args: [groupId || BigInt(0), account || ZERO_ADDRESS],
    query: { enabled: isQueryEnabled },
  });
  const {
    data: adminData,
    isPending: isPendingAdmin,
    error: adminError,
    refetch: refetchAdmin,
  } = useUniversalReadContract({
    address: getGroupAdminAddress(),
    abi: GroupAdminAbi,
    functionName: 'adminIdOf',
    args: [groupId || BigInt(0), account || ZERO_ADDRESS],
    query: { enabled: isQueryEnabled },
  });

  const ownerOrDelegateId = isQueryEnabled && ownerOrDelegateData !== undefined
    ? safeToBigInt(ownerOrDelegateData)
    : BigInt(0);
  const adminId = isQueryEnabled && adminData !== undefined ? safeToBigInt(adminData) : BigInt(0);

  return {
    canMentionAll: isQueryEnabled ? ownerOrDelegateId > BigInt(0) || adminId > BigInt(0) : false,
    ownerOrDelegateId,
    adminId,
    isPending: isQueryEnabled ? isPendingOwnerOrDelegate || isPendingAdmin : false,
    error: ownerOrDelegateError || adminError,
    refetch: () => {
      refetchOwnerOrDelegate();
      refetchAdmin();
    },
  };
}

export function useGroupOwnerOrDelegatePermission(
  groupId: bigint | undefined,
  account: `0x${string}` | undefined,
  enabled: boolean = true,
) {
  const isQueryEnabled = isGroupAdminEnabled && enabled && isPositiveId(groupId) && !!account;
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getGroupAdminAddress(),
    abi: GroupAdminAbi,
    functionName: 'ownerOrDelegateIdOf',
    args: [groupId || BigInt(0), account || ZERO_ADDRESS],
    query: { enabled: isQueryEnabled },
  });
  const ownerOrDelegateId = isQueryEnabled && data !== undefined ? safeToBigInt(data) : BigInt(0);

  return {
    canEditRules: ownerOrDelegateId > BigInt(0),
    ownerOrDelegateId,
    isPending: isQueryEnabled ? isPending : false,
    error,
    refetch,
  };
}

export function useGroupAdminOperatorPermission(
  groupId: bigint | undefined,
  account: `0x${string}` | undefined,
  enabled: boolean = true,
) {
  const isQueryEnabled = isGroupAdminEnabled && enabled && isPositiveId(groupId) && !!account;
  const {
    data: ownerOrDelegateData,
    isPending: isPendingOwnerOrDelegate,
    error: ownerOrDelegateError,
    refetch: refetchOwnerOrDelegate,
  } = useUniversalReadContract({
    address: getGroupAdminAddress(),
    abi: GroupAdminAbi,
    functionName: 'ownerOrDelegateIdOf',
    args: [groupId || BigInt(0), account || ZERO_ADDRESS],
    query: { enabled: isQueryEnabled },
  });
  const {
    data: adminData,
    isPending: isPendingAdmin,
    error: adminError,
    refetch: refetchAdmin,
  } = useUniversalReadContract({
    address: getGroupAdminAddress(),
    abi: GroupAdminAbi,
    functionName: 'adminIdOf',
    args: [groupId || BigInt(0), account || ZERO_ADDRESS],
    query: { enabled: isQueryEnabled },
  });
  const ownerOrDelegateId = isQueryEnabled && ownerOrDelegateData !== undefined
    ? safeToBigInt(ownerOrDelegateData)
    : BigInt(0);
  const adminId = isQueryEnabled && adminData !== undefined ? safeToBigInt(adminData) : BigInt(0);
  const operatorId = ownerOrDelegateId > BigInt(0) ? ownerOrDelegateId : adminId;
  const operatorKind = ownerOrDelegateId > BigInt(0) ? 'owner-or-delegate' : adminId > BigInt(0) ? 'admin' : undefined;

  return {
    canOperate: operatorId > BigInt(0),
    ownerOrDelegateId,
    adminId,
    operatorId,
    operatorKind,
    isPending: isQueryEnabled ? isPendingOwnerOrDelegate || isPendingAdmin : false,
    error: ownerOrDelegateError || adminError,
    refetch: () => {
      refetchOwnerOrDelegate();
      refetchAdmin();
    },
  };
}

export function useGroupMemberIds(
  groupId: bigint | undefined,
  offset: bigint = BigInt(0),
  limit: bigint = BigInt(100),
  enabled: boolean = true,
) {
  const isCountEnabled = isGroupMemberEnabled && enabled && isPositiveId(groupId);
  const { data: countData, isPending: isPendingCount, error: countError, refetch: refetchCount } = useUniversalReadContract({
    address: getGroupMemberAddress(),
    abi: GroupMemberAbi,
    functionName: 'memberIdsCount',
    args: [groupId || BigInt(0)],
    query: { enabled: isCountEnabled },
  });
  const count = isCountEnabled && countData !== undefined ? safeToBigInt(countData) : undefined;
  const remaining = count === undefined || count <= offset ? BigInt(0) : count - offset;
  const readLimit = remaining < limit ? remaining : limit;
  const shouldReadList = isGroupMemberEnabled && enabled && isPositiveId(groupId) && readLimit > BigInt(0);
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getGroupMemberAddress(),
    abi: GroupMemberAbi,
    functionName: 'memberIds',
    args: [groupId || BigInt(0), offset, readLimit],
    query: { enabled: shouldReadList },
  });

  return {
    memberIds: shouldReadList ? getSingleArray(data).map((item) => safeToBigInt(item)).filter((item) => item > BigInt(0)) : [],
    count,
    isPending: (isCountEnabled ? isPendingCount : false) || (shouldReadList ? isPending : false),
    error: countError || (shouldReadList ? error : undefined),
    refetch: () => {
      refetchCount();
      refetch();
    },
  };
}

export function useGroupMemberIdStatus(
  groupId: bigint | undefined,
  memberId: bigint | undefined,
  enabled: boolean = true,
) {
  const isQueryEnabled = isGroupMemberEnabled && enabled && isPositiveId(groupId) && isPositiveId(memberId);
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getGroupMemberAddress(),
    abi: GroupMemberAbi,
    functionName: 'isMemberId',
    args: [groupId || BigInt(0), memberId || BigInt(0)],
    query: { enabled: isQueryEnabled },
  });

  return {
    isMember: isQueryEnabled && data !== undefined ? Boolean(data) : undefined,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
}

export function useGovVotedBanStateVersion(groupId: bigint | undefined, enabled: boolean = true) {
  const isQueryEnabled = isGovVotedBanSourceEnabled && enabled && isPositiveId(groupId);
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getGovVotedBanSourceAddress(),
    abi: GovVotedBanSourceAbi,
    functionName: 'stateVersion',
    args: [groupId || BigInt(0)],
    query: { enabled: isQueryEnabled },
  });

  return {
    stateVersion: isQueryEnabled && data !== undefined ? safeToBigInt(data) : undefined,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
}

export function useGovVotedBanMechanism(enabled: boolean = true) {
  const isQueryEnabled = isGovVotedBanSourceEnabled && enabled;
  const precisionRead = useUniversalReadContract({
    address: getGovVotedBanSourceAddress(),
    abi: GovVotedBanSourceAbi,
    functionName: 'PRECISION',
    args: [],
    query: { enabled: isQueryEnabled },
  });
  const thresholdRatioRead = useUniversalReadContract({
    address: getGovVotedBanSourceAddress(),
    abi: GovVotedBanSourceAbi,
    functionName: 'BAN_THRESHOLD_RATIO',
    args: [],
    query: { enabled: isQueryEnabled },
  });

  return {
    precision: isQueryEnabled && precisionRead.data !== undefined ? safeToBigInt(precisionRead.data) : BigInt(0),
    banThresholdRatio: isQueryEnabled && thresholdRatioRead.data !== undefined ? safeToBigInt(thresholdRatioRead.data) : BigInt(0),
    isPending: isQueryEnabled ? Boolean(precisionRead.isPending || thresholdRatioRead.isPending) : false,
    error: precisionRead.error || thresholdRatioRead.error,
    refetch: () => {
      precisionRead.refetch();
      thresholdRatioRead.refetch();
    },
  };
}

export function useGroupBanLists(
  groupId: bigint | undefined,
  addressOffset: bigint = BigInt(0),
  addressLimit: bigint = BigInt(100),
  senderOffset: bigint = BigInt(0),
  senderLimit: bigint = BigInt(100),
  enabled: boolean = true,
) {
  const isQueryEnabled = isGroupBanListEnabled && enabled && isPositiveId(groupId);
  const addressCount = useUniversalReadContract({
    address: getGroupBanListAddress(),
    abi: GroupBanListAbi,
    functionName: 'addressBanListCount',
    args: [groupId || BigInt(0)],
    query: { enabled: isQueryEnabled },
  });
  const senderCount = useUniversalReadContract({
    address: getGroupBanListAddress(),
    abi: GroupBanListAbi,
    functionName: 'senderIdBanListCount',
    args: [groupId || BigInt(0)],
    query: { enabled: isQueryEnabled },
  });
  const addressTotal = addressCount.data !== undefined ? safeToBigInt(addressCount.data) : undefined;
  const senderTotal = senderCount.data !== undefined ? safeToBigInt(senderCount.data) : undefined;
  const addressRemaining = addressTotal === undefined || addressTotal <= addressOffset ? BigInt(0) : addressTotal - addressOffset;
  const senderRemaining = senderTotal === undefined || senderTotal <= senderOffset ? BigInt(0) : senderTotal - senderOffset;
  const addressReadLimit = addressRemaining < addressLimit ? addressRemaining : addressLimit;
  const senderReadLimit = senderRemaining < senderLimit ? senderRemaining : senderLimit;
  const shouldReadAddressList = isQueryEnabled && addressReadLimit > BigInt(0);
  const shouldReadSenderList = isQueryEnabled && senderReadLimit > BigInt(0);
  const addressList = useUniversalReadContract({
    address: getGroupBanListAddress(),
    abi: GroupBanListAbi,
    functionName: 'addressBanList',
    args: [groupId || BigInt(0), addressOffset, addressReadLimit],
    query: { enabled: shouldReadAddressList },
  });
  const senderList = useUniversalReadContract({
    address: getGroupBanListAddress(),
    abi: GroupBanListAbi,
    functionName: 'senderIdBanList',
    args: [groupId || BigInt(0), senderOffset, senderReadLimit],
    query: { enabled: shouldReadSenderList },
  });

  const addressRecords = parseAdminBanAddressRecords(addressList.data);
  const senderRecords = parseAdminBanSenderRecords(senderList.data);

  return {
    addressRecords,
    senderRecords,
    addressBanList: addressRecords.map((item) => item.senderAddress),
    senderIdBanList: senderRecords.map((item) => item.senderId),
    addressCount: addressCount.data !== undefined ? safeToBigInt(addressCount.data) : undefined,
    senderCount: senderCount.data !== undefined ? safeToBigInt(senderCount.data) : undefined,
    isPending: Boolean(
      (isQueryEnabled && (addressCount.isPending || senderCount.isPending)) ||
        (shouldReadAddressList && addressList.isPending) ||
        (shouldReadSenderList && senderList.isPending),
    ),
    error: addressCount.error || senderCount.error || addressList.error || senderList.error,
    refetch: () => {
      addressCount.refetch();
      senderCount.refetch();
      addressList.refetch();
      senderList.refetch();
    },
  };
}

export function useGovVotedBanLists(
  groupId: bigint | undefined,
  addressOffset: bigint = BigInt(0),
  addressLimit: bigint = BigInt(100),
  senderOffset: bigint = BigInt(0),
  senderLimit: bigint = BigInt(100),
  voter: `0x${string}` | undefined,
  enabled: boolean = true,
) {
  const isQueryEnabled = isGovVotedBanSourceEnabled && enabled && isPositiveId(groupId);
  const addressCount = useUniversalReadContract({
    address: getGovVotedBanSourceAddress(),
    abi: GovVotedBanSourceAbi,
    functionName: 'votedSenderAddressesCount',
    args: [groupId || BigInt(0)],
    query: { enabled: isQueryEnabled },
  });
  const senderCount = useUniversalReadContract({
    address: getGovVotedBanSourceAddress(),
    abi: GovVotedBanSourceAbi,
    functionName: 'votedSenderIdsCount',
    args: [groupId || BigInt(0)],
    query: { enabled: isQueryEnabled },
  });
  const addressTotal = addressCount.data !== undefined ? safeToBigInt(addressCount.data) : undefined;
  const senderTotal = senderCount.data !== undefined ? safeToBigInt(senderCount.data) : undefined;
  const addressRemaining = addressTotal === undefined || addressTotal <= addressOffset ? BigInt(0) : addressTotal - addressOffset;
  const senderRemaining = senderTotal === undefined || senderTotal <= senderOffset ? BigInt(0) : senderTotal - senderOffset;
  const addressReadLimit = addressRemaining < addressLimit ? addressRemaining : addressLimit;
  const senderReadLimit = senderRemaining < senderLimit ? senderRemaining : senderLimit;
  const shouldReadAddressList = isQueryEnabled && addressReadLimit > BigInt(0);
  const shouldReadSenderList = isQueryEnabled && senderReadLimit > BigInt(0);
  const addressList = useUniversalReadContract({
    address: getGovVotedBanSourceAddress(),
    abi: GovVotedBanSourceAbi,
    functionName: 'votedSenderAddresses',
    args: [groupId || BigInt(0), addressOffset, addressReadLimit],
    query: { enabled: shouldReadAddressList },
  });
  const senderList = useUniversalReadContract({
    address: getGovVotedBanSourceAddress(),
    abi: GovVotedBanSourceAbi,
    functionName: 'votedSenderIds',
    args: [groupId || BigInt(0), senderOffset, senderReadLimit],
    query: { enabled: shouldReadSenderList },
  });

  const rawAddressRecords = parseGovVotedAddressRecords(addressList.data);
  const rawSenderRecords = parseGovVotedSenderRecords(senderList.data);
  const addressTargets = rawAddressRecords.map((item) => item.senderAddress);
  const senderIdTargets = rawSenderRecords.map((item) => item.senderId);
  const shouldReadAddressStatus = isQueryEnabled && addressTargets.length > 0;
  const shouldReadSenderStatus = isQueryEnabled && senderIdTargets.length > 0;
  const shouldReadAddressMyVote = shouldReadAddressStatus && !!voter;
  const shouldReadSenderMyVote = shouldReadSenderStatus && !!voter;
  const addressStatus = useUniversalReadContract({
    address: getGovVotedBanSourceAddress(),
    abi: GovVotedBanSourceAbi,
    functionName: 'voteStatusBySenderAddresses',
    args: [groupId || BigInt(0), addressTargets],
    query: { enabled: shouldReadAddressStatus },
  });
  const senderStatus = useUniversalReadContract({
    address: getGovVotedBanSourceAddress(),
    abi: GovVotedBanSourceAbi,
    functionName: 'voteStatusBySenderIds',
    args: [groupId || BigInt(0), senderIdTargets],
    query: { enabled: shouldReadSenderStatus },
  });
  const addressMyVote = useUniversalReadContract({
    address: getGovVotedBanSourceAddress(),
    abi: GovVotedBanSourceAbi,
    functionName: 'voteWeightsBySenderAddressesByVoter',
    args: [groupId || BigInt(0), addressTargets, voter || ZERO_ADDRESS],
    query: { enabled: shouldReadAddressMyVote },
  });
  const senderMyVote = useUniversalReadContract({
    address: getGovVotedBanSourceAddress(),
    abi: GovVotedBanSourceAbi,
    functionName: 'voteWeightsBySenderIdsByVoter',
    args: [groupId || BigInt(0), senderIdTargets, voter || ZERO_ADDRESS],
    query: { enabled: shouldReadSenderMyVote },
  });
  const addressBanned = getResultArray(addressStatus.data, 0, 'banned');
  const addressSupportWeights = getResultArray(addressStatus.data, 1, 'supportWeights');
  const addressOpposeWeights = getResultArray(addressStatus.data, 2, 'opposeWeights');
  const senderBanned = getResultArray(senderStatus.data, 0, 'banned');
  const senderSupportWeights = getResultArray(senderStatus.data, 1, 'supportWeights');
  const senderOpposeWeights = getResultArray(senderStatus.data, 2, 'opposeWeights');
  const addressMySupportWeights = getResultArray(addressMyVote.data, 0, 'supportWeights');
  const addressMyOpposeWeights = getResultArray(addressMyVote.data, 1, 'opposeWeights');
  const senderMySupportWeights = getResultArray(senderMyVote.data, 0, 'supportWeights');
  const senderMyOpposeWeights = getResultArray(senderMyVote.data, 1, 'opposeWeights');
  const addressRecords = rawAddressRecords.map((item, index) => ({
    ...item,
    banned: addressStatus.data === undefined ? item.banned : addressBanned[index] === true,
    supportWeight: addressStatus.data === undefined ? item.supportWeight : safeToBigInt(addressSupportWeights[index]),
    opposeWeight: addressStatus.data === undefined ? item.opposeWeight : safeToBigInt(addressOpposeWeights[index]),
    mySupportWeight: addressMyVote.data === undefined ? item.mySupportWeight : safeToBigInt(addressMySupportWeights[index]),
    myOpposeWeight: addressMyVote.data === undefined ? item.myOpposeWeight : safeToBigInt(addressMyOpposeWeights[index]),
  }));
  const senderRecords = rawSenderRecords.map((item, index) => ({
    ...item,
    banned: senderStatus.data === undefined ? item.banned : senderBanned[index] === true,
    supportWeight: senderStatus.data === undefined ? item.supportWeight : safeToBigInt(senderSupportWeights[index]),
    opposeWeight: senderStatus.data === undefined ? item.opposeWeight : safeToBigInt(senderOpposeWeights[index]),
    mySupportWeight: senderMyVote.data === undefined ? item.mySupportWeight : safeToBigInt(senderMySupportWeights[index]),
    myOpposeWeight: senderMyVote.data === undefined ? item.myOpposeWeight : safeToBigInt(senderMyOpposeWeights[index]),
  }));

  return {
    addressRecords,
    senderRecords,
    addressTargets,
    senderIdTargets,
    addressCount: addressCount.data !== undefined ? safeToBigInt(addressCount.data) : undefined,
    senderCount: senderCount.data !== undefined ? safeToBigInt(senderCount.data) : undefined,
    isPending: Boolean(
      (isQueryEnabled && (addressCount.isPending || senderCount.isPending)) ||
        (shouldReadAddressList && addressList.isPending) ||
        (shouldReadSenderList && senderList.isPending) ||
        (shouldReadAddressStatus && addressStatus.isPending) ||
        (shouldReadSenderStatus && senderStatus.isPending) ||
        (shouldReadAddressMyVote && addressMyVote.isPending) ||
        (shouldReadSenderMyVote && senderMyVote.isPending),
    ),
    error:
      addressCount.error ||
      senderCount.error ||
      addressList.error ||
      senderList.error ||
      addressStatus.error ||
      senderStatus.error ||
      addressMyVote.error ||
      senderMyVote.error,
    refetch: () => {
      addressCount.refetch();
      senderCount.refetch();
      addressList.refetch();
      senderList.refetch();
      addressStatus.refetch();
      senderStatus.refetch();
      addressMyVote.refetch();
      senderMyVote.refetch();
    },
  };
}

export function useAdminBanQuery(
  groupId: bigint | undefined,
  targetType: 'address' | 'nft',
  senderAddress: `0x${string}` | undefined,
  senderId: bigint | undefined,
  enabled: boolean = true,
) {
  const isAddressQuery = targetType === 'address';
  const isQueryEnabled =
    isGroupBanListEnabled &&
    enabled &&
    isPositiveId(groupId) &&
    (isAddressQuery ? !!senderAddress : isPositiveId(senderId));
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getGroupBanListAddress(),
    abi: GroupBanListAbi,
    functionName: isAddressQuery ? 'isAddressBanned' : 'isSenderIdBanned',
    args: isAddressQuery
      ? [groupId || BigInt(0), senderAddress || ZERO_ADDRESS]
      : [groupId || BigInt(0), senderId || BigInt(0)],
    query: { enabled: isQueryEnabled },
  });

  return {
    banned: isQueryEnabled && data !== undefined ? Boolean(data) : undefined,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
}

export function useGovBanQuery(
  groupId: bigint | undefined,
  targetType: 'address' | 'nft',
  senderAddress: `0x${string}` | undefined,
  senderId: bigint | undefined,
  enabled: boolean = true,
) {
  const isAddressQuery = targetType === 'address';
  const isQueryEnabled =
    isGovVotedBanSourceEnabled &&
    enabled &&
    isPositiveId(groupId) &&
    (isAddressQuery ? !!senderAddress : isPositiveId(senderId));
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getGovVotedBanSourceAddress(),
    abi: GovVotedBanSourceAbi,
    functionName: isAddressQuery ? 'voteStatusBySenderAddress' : 'voteStatusBySenderId',
    args: isAddressQuery
      ? [groupId || BigInt(0), senderAddress || ZERO_ADDRESS]
      : [groupId || BigInt(0), senderId || BigInt(0)],
    query: { enabled: isQueryEnabled },
  });

  return {
    status: isQueryEnabled ? parseGovVoteStatus(data) : undefined,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
}

export function useGovVotersByTarget(
  groupId: bigint | undefined,
  targetType: 'address' | 'nft',
  senderAddress: `0x${string}` | undefined,
  senderId: bigint | undefined,
  offset: bigint = BigInt(0),
  limit: bigint = BigInt(5),
  enabled: boolean = true,
) {
  const isAddressQuery = targetType === 'address';
  const isQueryEnabled =
    isGovVotedBanSourceEnabled &&
    enabled &&
    isPositiveId(groupId) &&
    limit > BigInt(0) &&
    (isAddressQuery ? !!senderAddress : isPositiveId(senderId));
  const voterCountRead = useUniversalReadContract({
    address: getGovVotedBanSourceAddress(),
    abi: GovVotedBanSourceAbi,
    functionName: isAddressQuery ? 'votersBySenderAddressCount' : 'votersBySenderIdCount',
    args: isAddressQuery
      ? [groupId || BigInt(0), senderAddress || ZERO_ADDRESS]
      : [groupId || BigInt(0), senderId || BigInt(0)],
    query: { enabled: isQueryEnabled },
  }) as any;
  const votersRead = useUniversalReadContract({
    address: getGovVotedBanSourceAddress(),
    abi: GovVotedBanSourceAbi,
    functionName: isAddressQuery ? 'votersBySenderAddress' : 'votersBySenderId',
    args: isAddressQuery
      ? [groupId || BigInt(0), senderAddress || ZERO_ADDRESS, offset, limit]
      : [groupId || BigInt(0), senderId || BigInt(0), offset, limit],
    query: { enabled: isQueryEnabled },
  }) as any;

  return {
    voters: isQueryEnabled ? parseGovVoterRecords(votersRead.data) : [],
    count: isQueryEnabled && voterCountRead.data !== undefined ? safeToBigInt(voterCountRead.data) : undefined,
    isPending: isQueryEnabled ? Boolean(voterCountRead.isPending || votersRead.isPending) : false,
    error: voterCountRead.error || votersRead.error,
    refetch: () => {
      voterCountRead.refetch();
      votersRead.refetch();
    },
  };
}

export function useAddGroupAdmins() {
  const tx = useWrite(GroupAdminAbi, getGroupAdminAddress(), 'addAdmins');
  return { addAdmins: (groupId: bigint, adminIds: bigint[]) => tx.execute([groupId, adminIds]), ...tx };
}

export function useRemoveGroupAdmins() {
  const tx = useWrite(GroupAdminAbi, getGroupAdminAddress(), 'removeAdmins');
  return { removeAdmins: (groupId: bigint, adminIds: bigint[]) => tx.execute([groupId, adminIds]), ...tx };
}

export function useAddGroupMembers() {
  const tx = useWrite(GroupMemberAbi, getGroupMemberAddress(), 'addMemberIds');
  return { addMemberIds: (groupId: bigint, memberIds: bigint[]) => tx.execute([groupId, memberIds]), ...tx };
}

export function useRemoveGroupMembers() {
  const tx = useWrite(GroupMemberAbi, getGroupMemberAddress(), 'removeMemberIds');
  return { removeMemberIds: (groupId: bigint, memberIds: bigint[]) => tx.execute([groupId, memberIds]), ...tx };
}

export function useBanSenderAddresses() {
  const tx = useWrite(GroupBanListAbi, getGroupBanListAddress(), 'banBySenderAddresses');
  return { banBySenderAddresses: (groupId: bigint, addresses: `0x${string}`[]) => tx.execute([groupId, addresses]), ...tx };
}

export function useUnbanSenderAddresses() {
  const tx = useWrite(GroupBanListAbi, getGroupBanListAddress(), 'unbanBySenderAddresses');
  return { unbanBySenderAddresses: (groupId: bigint, addresses: `0x${string}`[]) => tx.execute([groupId, addresses]), ...tx };
}

export function useBanSenderIds() {
  const tx = useWrite(GroupBanListAbi, getGroupBanListAddress(), 'banBySenderIds');
  return { banBySenderIds: (groupId: bigint, senderIds: bigint[]) => tx.execute([groupId, senderIds]), ...tx };
}

export function useBanSenders() {
  const tx = useWrite(GroupBanListAbi, getGroupBanListAddress(), 'banBySenders');
  return {
    banBySenders: (groupId: bigint, senderIds: bigint[], senderAddresses: `0x${string}`[]) =>
      tx.execute([groupId, senderIds, senderAddresses]),
    ...tx,
  };
}

export function useUnbanSenders() {
  const tx = useWrite(GroupBanListAbi, getGroupBanListAddress(), 'unbanBySenders');
  return {
    unbanBySenders: (groupId: bigint, senderIds: bigint[], senderAddresses: `0x${string}`[]) =>
      tx.execute([groupId, senderIds, senderAddresses]),
    ...tx,
  };
}

export function useUnbanSenderIds() {
  const tx = useWrite(GroupBanListAbi, getGroupBanListAddress(), 'unbanBySenderIds');
  return { unbanBySenderIds: (groupId: bigint, senderIds: bigint[]) => tx.execute([groupId, senderIds]), ...tx };
}

export function useGovVoteBySenderAddress() {
  const tx = useWrite(GovVotedBanSourceAbi, getGovVotedBanSourceAddress(), 'voteBySenderAddress');
  return { voteBySenderAddress: (groupId: bigint, senderAddress: `0x${string}`, supportBan: boolean) => tx.execute([groupId, senderAddress, supportBan]), ...tx };
}

export function useGovVoteBySenderId() {
  const tx = useWrite(GovVotedBanSourceAbi, getGovVotedBanSourceAddress(), 'voteBySenderId');
  return { voteBySenderId: (groupId: bigint, senderId: bigint, supportBan: boolean) => tx.execute([groupId, senderId, supportBan]), ...tx };
}

export function useGovVoteBySender() {
  const tx = useWrite(GovVotedBanSourceAbi, getGovVotedBanSourceAddress(), 'voteBySender');
  return {
    voteBySender: (groupId: bigint, senderId: bigint, senderAddress: `0x${string}`, supportBan: boolean) =>
      tx.execute([groupId, senderId, senderAddress, supportBan]),
    ...tx,
  };
}

export function useGovClearVoteBySenderAddress() {
  const tx = useWrite(GovVotedBanSourceAbi, getGovVotedBanSourceAddress(), 'clearVoteBySenderAddress');
  return { clearVoteBySenderAddress: (groupId: bigint, senderAddress: `0x${string}`) => tx.execute([groupId, senderAddress]), ...tx };
}

export function useGovClearVoteBySenderId() {
  const tx = useWrite(GovVotedBanSourceAbi, getGovVotedBanSourceAddress(), 'clearVoteBySenderId');
  return { clearVoteBySenderId: (groupId: bigint, senderId: bigint) => tx.execute([groupId, senderId]), ...tx };
}

export function useGovClearVoteBySender() {
  const tx = useWrite(GovVotedBanSourceAbi, getGovVotedBanSourceAddress(), 'clearVoteBySender');
  return {
    clearVoteBySender: (groupId: bigint, senderId: bigint, senderAddress: `0x${string}`) =>
      tx.execute([groupId, senderId, senderAddress]),
    ...tx,
  };
}

export function useGovRefreshVoteBySenderAddress() {
  const tx = useWrite(GovVotedBanSourceAbi, getGovVotedBanSourceAddress(), 'refreshVoteBySenderAddress');
  return {
    refreshVoteBySenderAddress: (groupId: bigint, senderAddress: `0x${string}`, voter: `0x${string}`) =>
      tx.execute([groupId, senderAddress, voter]),
    ...tx,
  };
}

export function useGovRefreshVoteBySenderId() {
  const tx = useWrite(GovVotedBanSourceAbi, getGovVotedBanSourceAddress(), 'refreshVoteBySenderId');
  return {
    refreshVoteBySenderId: (groupId: bigint, senderId: bigint, voter: `0x${string}`) =>
      tx.execute([groupId, senderId, voter]),
    ...tx,
  };
}
