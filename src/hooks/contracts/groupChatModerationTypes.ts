import { safeToBigInt } from '@/src/lib/clientUtils';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

export type GroupAdminRecord = {
  id: bigint;
  isEffective: boolean;
};

export type AdminBanAddressRecord = {
  senderAddress: `0x${string}`;
  operatorAddress: `0x${string}`;
  operatorId: bigint;
};

export type AdminBanSenderRecord = {
  senderId: bigint;
  operatorAddress: `0x${string}`;
  operatorId: bigint;
};

export type GovVotedAddressRecord = {
  senderAddress: `0x${string}`;
  banned: boolean;
  supportWeight: bigint;
  opposeWeight: bigint;
  voterCount: bigint;
  mySupportWeight: bigint;
  myOpposeWeight: bigint;
};

export type GovVotedSenderRecord = {
  senderId: bigint;
  banned: boolean;
  supportWeight: bigint;
  opposeWeight: bigint;
  voterCount: bigint;
  mySupportWeight: bigint;
  myOpposeWeight: bigint;
};

export type GovVoterRecord = {
  voter: `0x${string}`;
  supportWeight: bigint;
  opposeWeight: bigint;
};

export type GovVoteStatus = {
  banned: boolean;
  supportWeight: bigint;
  opposeWeight: bigint;
};

export function normalizeAddress(value: unknown): `0x${string}` {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value) ? (value as `0x${string}`) : ZERO_ADDRESS;
}

export function getResultArray(data: unknown, index: number, namedKey?: string): readonly unknown[] {
  if (namedKey) {
    const namedValue = (data as Record<string, unknown> | undefined)?.[namedKey];
    if (Array.isArray(namedValue)) return namedValue;
  }
  if (Array.isArray(data) && Array.isArray(data[index])) return data[index];
  return [];
}

export function getSingleArray(data: unknown): readonly unknown[] {
  return Array.isArray(data) ? data : [];
}

export function parseAdminRecords(data: unknown): GroupAdminRecord[] {
  const ids = getResultArray(data, 0, 'ids');
  const effective = getResultArray(data, 1, 'isEffective');
  return ids
    .map((item, index) => ({
      id: safeToBigInt(item),
      isEffective: effective[index] === true,
    }))
    .filter((item) => item.id > BigInt(0));
}

export function parseAdminBanAddressRecords(data: unknown): AdminBanAddressRecord[] {
  const senderAddresses = getResultArray(data, 0, 'senderAddresses');
  const operatorAddresses = getResultArray(data, 1, 'operatorAddresses');
  const operatorIds = getResultArray(data, 2, 'operatorIds');
  return senderAddresses
    .map((item, index) => ({
      senderAddress: normalizeAddress(item),
      operatorAddress: normalizeAddress(operatorAddresses[index]),
      operatorId: safeToBigInt(operatorIds[index]),
    }))
    .filter((item) => item.senderAddress !== ZERO_ADDRESS);
}

export function parseAdminBanSenderRecords(data: unknown): AdminBanSenderRecord[] {
  const senderIds = getResultArray(data, 0, 'senderIds');
  const operatorAddresses = getResultArray(data, 1, 'operatorAddresses');
  const operatorIds = getResultArray(data, 2, 'operatorIds');
  return senderIds
    .map((item, index) => ({
      senderId: safeToBigInt(item),
      operatorAddress: normalizeAddress(operatorAddresses[index]),
      operatorId: safeToBigInt(operatorIds[index]),
    }))
    .filter((item) => item.senderId > BigInt(0));
}

export function parseGovVotedAddressRecords(data: unknown): GovVotedAddressRecord[] {
  const senderAddresses = getResultArray(data, 0, 'senderAddresses');
  const supportWeights = getResultArray(data, 1, 'supportWeights');
  const opposeWeights = getResultArray(data, 2, 'opposeWeights');
  const voterCounts = getResultArray(data, 3, 'voterCounts');
  return senderAddresses
    .map((item, index) => ({
      senderAddress: normalizeAddress(item),
      banned: false,
      supportWeight: safeToBigInt(supportWeights[index]),
      opposeWeight: safeToBigInt(opposeWeights[index]),
      voterCount: safeToBigInt(voterCounts[index]),
      mySupportWeight: BigInt(0),
      myOpposeWeight: BigInt(0),
    }))
    .filter((item) => item.senderAddress !== ZERO_ADDRESS);
}

export function parseGovVotedSenderRecords(data: unknown): GovVotedSenderRecord[] {
  const senderIds = getResultArray(data, 0, 'senderIds');
  const supportWeights = getResultArray(data, 1, 'supportWeights');
  const opposeWeights = getResultArray(data, 2, 'opposeWeights');
  const voterCounts = getResultArray(data, 3, 'voterCounts');
  return senderIds
    .map((item, index) => ({
      senderId: safeToBigInt(item),
      banned: false,
      supportWeight: safeToBigInt(supportWeights[index]),
      opposeWeight: safeToBigInt(opposeWeights[index]),
      voterCount: safeToBigInt(voterCounts[index]),
      mySupportWeight: BigInt(0),
      myOpposeWeight: BigInt(0),
    }))
    .filter((item) => item.senderId > BigInt(0));
}

export function parseGovVoterRecords(data: unknown): GovVoterRecord[] {
  const voters = getResultArray(data, 0, 'voters');
  const supportWeights = getResultArray(data, 1, 'supportWeights');
  const opposeWeights = getResultArray(data, 2, 'opposeWeights');
  return voters
    .map((item, index) => ({
      voter: normalizeAddress(item),
      supportWeight: safeToBigInt(supportWeights[index]),
      opposeWeight: safeToBigInt(opposeWeights[index]),
    }))
    .filter((item) => item.voter !== ZERO_ADDRESS);
}

export function parseGovVoteStatus(data: unknown): GovVoteStatus | undefined {
  if (!Array.isArray(data)) return undefined;
  return {
    banned: data[0] === true,
    supportWeight: safeToBigInt(data[1]),
    opposeWeight: safeToBigInt(data[2]),
  };
}
