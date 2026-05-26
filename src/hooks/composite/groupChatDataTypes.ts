import { safeToBigInt } from '@/src/lib/clientUtils';
import { abbreviateAddress } from '@/src/lib/format';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

export type GroupChatKind = 'token-community' | 'token-gov' | 'action' | 'action-gov' | 'chain-service' | 'unknown';

export interface ParsedGroupChatInfo {
  groupId: bigint;
  owner: `0x${string}`;
  activated: boolean;
  postingAllowed: boolean;
  scopeSource: `0x${string}`;
  banSource: `0x${string}`;
  beforePostPlugin: `0x${string}`;
  afterPostPlugin: `0x${string}`;
  firstActivatedOwner: `0x${string}`;
  firstActivatedBlockNumber: bigint;
  firstActivatedTimestamp: bigint;
}

export interface ParsedGroupChatMessage {
  groupId: bigint;
  senderId: bigint;
  senderAddress: `0x${string}`;
  round: bigint;
  messageId: bigint;
  content: string;
  blockNumber: bigint;
  timestamp: bigint;
  mentionedSenderIds: bigint[];
  mentionAll: boolean;
  quotedMessageId: bigint;
}

export interface ParsedGroupChatMeta {
  title: string;
  description: string;
}

export interface GroupChatListItem {
  groupId: bigint;
  kind: GroupChatKind;
  typeLabel: string;
  groupName: string;
  title: string;
  tokenAddress?: `0x${string}`;
  tokenSymbol?: string;
  actionId?: bigint;
  actionTitle?: string;
  info?: ParsedGroupChatInfo;
  meta: ParsedGroupChatMeta;
  latestMentionMeMessageId: bigint;
  latestMentionAllMessageId: bigint;
  messagesCount: bigint;
  latestMessage?: ParsedGroupChatMessage;
  latestMessageBanned: boolean;
  recentMessages: ParsedGroupChatMessage[];
  recentBannedMessageIds: Record<string, boolean>;
  latestVisibleMentionMeMessageId: bigint;
  latestVisibleMentionAllMessageId: bigint;
}

export interface GroupChatRoomData {
  groupId: bigint | undefined;
  chatInfo?: ParsedGroupChatInfo;
  meta: ParsedGroupChatMeta;
  groupName: string;
  messagesCount: bigint | undefined;
  messages: ParsedGroupChatMessage[];
  quotedMessages: Record<string, ParsedGroupChatMessage>;
  bannedMessageIds: Record<string, boolean>;
  senderNames: Record<string, string>;
  defaultSenderId: bigint | undefined;
  defaultSenderName: string;
  hasDefaultSender: boolean;
  isDefaultSenderPending: boolean;
  canPost: boolean;
  canPostReasonCode?: `0x${string}`;
  isMessageFeedPending: boolean;
  isPending: boolean;
  error?: unknown;
  refetch: () => void;
}

export type ReadContractResult = {
  status?: string;
  result?: unknown;
};

export type ClassifierKind = Exclude<GroupChatKind, 'chain-service' | 'unknown'>;

export const GROUP_NAME_UNKNOWN = 'LOVE20 NFT';

export function isNonZeroAddress(value: unknown): value is `0x${string}` {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value) && value.toLowerCase() !== ZERO_ADDRESS;
}

export function normalizeAddress(value: unknown): `0x${string}` {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value) ? (value as `0x${string}`) : ZERO_ADDRESS;
}

export function addressesEqual(left?: `0x${string}`, right?: `0x${string}`) {
  return !!left && !!right && left.toLowerCase() === right.toLowerCase();
}

export function resultAt(data: readonly ReadContractResult[] | undefined, index: number) {
  const item = data?.[index];
  return item?.status === 'success' ? item.result : undefined;
}

export function parseGroupChatInfo(raw: unknown): ParsedGroupChatInfo | undefined {
  if (!raw) return undefined;
  const item = raw as Record<string, unknown> & readonly unknown[];

  return {
    groupId: safeToBigInt(item.groupId ?? item[0]),
    owner: normalizeAddress(item.owner ?? item[1]),
    activated: Boolean(item.activated ?? item[2]),
    postingAllowed: Boolean(item.postingAllowed ?? item[3]),
    scopeSource: normalizeAddress(item.scopeSource ?? item[4]),
    banSource: normalizeAddress(item.banSource ?? item[5]),
    beforePostPlugin: normalizeAddress(item.beforePostPlugin ?? item[6]),
    afterPostPlugin: normalizeAddress(item.afterPostPlugin ?? item[7]),
    firstActivatedOwner: normalizeAddress(item.firstActivatedOwner ?? item[8]),
    firstActivatedBlockNumber: safeToBigInt(item.firstActivatedBlockNumber ?? item[9]),
    firstActivatedTimestamp: safeToBigInt(item.firstActivatedTimestamp ?? item[10]),
  };
}

export function parseGroupChatMessage(raw: unknown): ParsedGroupChatMessage | undefined {
  if (!raw) return undefined;
  const item = raw as Record<string, unknown> & readonly unknown[];
  const mentionedSenderIds = (item.mentionedSenderIds ?? item[8]) as readonly unknown[] | undefined;

  return {
    groupId: safeToBigInt(item.groupId ?? item[0]),
    senderId: safeToBigInt(item.senderId ?? item[1]),
    senderAddress: normalizeAddress(item.senderAddress ?? item[2]),
    round: safeToBigInt(item.round ?? item[3]),
    messageId: safeToBigInt(item.messageId ?? item[4]),
    content: typeof (item.content ?? item[5]) === 'string' ? ((item.content ?? item[5]) as string) : '',
    blockNumber: safeToBigInt(item.blockNumber ?? item[6]),
    timestamp: safeToBigInt(item.timestamp ?? item[7]),
    mentionedSenderIds: Array.isArray(mentionedSenderIds) ? mentionedSenderIds.map((value) => safeToBigInt(value)) : [],
    mentionAll: Boolean(item.mentionAll ?? item[9]),
    quotedMessageId: safeToBigInt(item.quotedMessageId ?? item[10]),
  };
}

export function typeLabel(kind: GroupChatKind) {
  if (kind === 'token-community') return '主群';
  if (kind === 'token-gov') return '治理群';
  if (kind === 'action') return '行动主群';
  if (kind === 'action-gov') return '行动治理群';
  if (kind === 'chain-service') return '链群';
  return '群聊';
}

export function buildChatTitle(item: {
  kind: GroupChatKind;
  groupId: bigint;
  meta?: ParsedGroupChatMeta;
  groupName?: string;
  tokenSymbol?: string;
  tokenAddress?: `0x${string}`;
  actionId?: bigint;
  actionTitle?: string;
}) {
  const symbol = item.tokenSymbol || (item.tokenAddress ? abbreviateAddress(item.tokenAddress) : '');
  const managerLabel = symbol || `G#${item.groupId}`;
  if (item.kind === 'token-community') return `${managerLabel} 主群`;
  if (item.kind === 'token-gov') return `${managerLabel} 治理群`;
  if (item.kind === 'action') return `No.${item.actionId ?? '?'} ${item.actionTitle || '行动'} 行动主群`;
  if (item.kind === 'action-gov') return `No.${item.actionId ?? '?'} ${item.actionTitle || '行动'} 行动治理群`;
  if (item.meta?.title) return item.meta.title;
  return item.groupName || `群聊 #${item.groupId}`;
}

export function uniqueBigInts(values: readonly (bigint | undefined)[]) {
  const seen = new Set<string>();
  return values.filter((value): value is bigint => {
    if (!value || value <= BigInt(0)) return false;
    const key = value.toString();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function uniqueAddresses(values: readonly (`0x${string}` | undefined)[]) {
  const seen = new Set<string>();
  return values.filter((value): value is `0x${string}` => {
    if (!isNonZeroAddress(value)) return false;
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
