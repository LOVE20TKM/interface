import type { QueryClient } from '@tanstack/react-query';
import type { UrlObject } from 'url';

import { formatNumber, formatTokenAmount } from '@/src/lib/format';
import {
  GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER_ADDRESS,
  GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER_ADDRESS,
  GROUP_CHAT_TOKEN_GOV_MANAGER_ADDRESS,
  GROUP_CHAT_TOKEN_MAIN_MANAGER_ADDRESS,
} from '@/src/hooks/contracts/useGroupChatManagers';
import type { ParsedGroupChatMessage } from '@/src/hooks/composite/useGroupChatData';
import { normalizeAddressInput } from '@/src/lib/addressUtils';
import { CAN_POST_REASON_LABELS, MAX_MENTIONED_SENDER_IDS, MESSAGE_TIME_DIVIDER_GAP_MS } from './chatConstants';

export function parseGroupId(value: string | string[] | undefined) {
  return parsePositiveId(value);
}

export function parseSenderId(value: string | string[] | undefined) {
  return parsePositiveId(value);
}

function parsePositiveId(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) return undefined;
  const parsed = BigInt(raw);
  return parsed > BigInt(0) ? parsed : undefined;
}

export function buildGroupChatDetailHref(groupId: bigint) {
  const params = new URLSearchParams();
  params.set('groupId', groupId.toString());
  return `/chat/group?${params.toString()}`;
}

export function buildGroupChatMessageDetailHref(groupId: bigint, messageId: bigint) {
  const params = new URLSearchParams();
  params.set('groupId', groupId.toString());
  params.set('messageId', messageId.toString());
  return `/chat/group/message?${params.toString()}`;
}

export function buildGroupChatMentionAllHref(groupId: bigint) {
  const params = new URLSearchParams();
  params.set('groupId', groupId.toString());
  return `/chat/group/mentions/all?${params.toString()}`;
}

export function buildGroupChatMentionMeHref(groupId: bigint) {
  const params = new URLSearchParams();
  params.set('groupId', groupId.toString());
  return `/chat/group/mentions/me?${params.toString()}`;
}

export function buildGroupChatSenderHref(groupId: bigint, senderId: bigint) {
  const params = new URLSearchParams();
  params.set('groupId', groupId.toString());
  params.set('senderId', senderId.toString());
  return `/chat/group/sender?${params.toString()}`;
}

export function buildGroupChatDetailUrl(groupId: bigint): UrlObject {
  return {
    pathname: '/chat/group',
    query: {
      groupId: groupId.toString(),
    },
  };
}

export function buildChatIndexHref() {
  return '/chat';
}

export function buildChatPreferencesHref() {
  return '/chat/preferences';
}

export function buildChatActivationHref(activationType?: 'token' | 'action' | 'chain') {
  const params = new URLSearchParams();
  if (activationType) params.set('activationType', activationType);
  const query = params.toString();
  return query ? `/chat/activate?${query}` : '/chat/activate';
}

export function buildChatChainActivationHref(
  groupId: bigint,
  groupName: string | undefined,
) {
  const params = new URLSearchParams();
  params.set('groupId', groupId.toString());
  if (groupName) params.set('groupName', groupName);
  return `/chat/activate/chain?${params.toString()}`;
}

export function buildGroupChatPanelHref(
  panel: 'members' | 'banlist' | 'admins' | 'settings',
  groupId: bigint,
  extras?: Record<string, string | bigint | undefined>,
) {
  const params = new URLSearchParams();
  params.set('groupId', groupId.toString());
  Object.entries(extras || {}).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, value.toString());
  });
  return `/chat/group/${panel}?${params.toString()}`;
}

export function parseActionIdInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return undefined;
  return BigInt(trimmed);
}

export function safeBigIntFromString(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return BigInt(0);
  return BigInt(value);
}

export function parseAddressInput(value: string): `0x${string}` | undefined {
  const normalized = normalizeAddressInput(value);
  return /^0x[0-9a-fA-F]{40}$/.test(normalized) ? (normalized as `0x${string}`) : undefined;
}

export function actionInfoTitle(actionInfo: any, fallbackId?: bigint): string {
  return actionInfo?.body?.title || actionInfo?.[1]?.title || (fallbackId !== undefined ? `行动 #${fallbackId.toString()}` : '行动');
}

export function sameAddress(left?: `0x${string}`, right?: `0x${string}`) {
  return !!left && !!right && left.toLowerCase() === right.toLowerCase();
}

export function isManagerOwnedChat(owner?: `0x${string}`) {
  return [
    GROUP_CHAT_TOKEN_MAIN_MANAGER_ADDRESS,
    GROUP_CHAT_TOKEN_GOV_MANAGER_ADDRESS,
    GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER_ADDRESS,
    GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER_ADDRESS,
  ].some((address) => sameAddress(owner, address));
}

export function managerMemberScopeDescription(owner?: `0x${string}`) {
  if (sameAddress(owner, GROUP_CHAT_TOKEN_MAIN_MANAGER_ADDRESS)) {
    return {
      label: 'TokenMainManager',
      summary: '持币/治理/行动',
      text: '持有该代币余额、拥有该代币治理票权，或参与该代币社区行动的地址可用自己的默认 NFT 发言。',
    };
  }
  if (sameAddress(owner, GROUP_CHAT_TOKEN_GOV_MANAGER_ADDRESS)) {
    return {
      label: 'TokenGovManager',
      summary: '治理票',
      text: '拥有该代币治理票权的地址可用自己的默认 NFT 发言。',
    };
  }
  if (sameAddress(owner, GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER_ADDRESS)) {
    return {
      label: 'TokenActionMainManager',
      summary: '行动参与/投票',
      text: '当前仍有该行动参与份额，或近期投过该行动票的地址可用自己的默认 NFT 发言。',
    };
  }
  if (sameAddress(owner, GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER_ADDRESS)) {
    return {
      label: 'TokenActionGovManager',
      summary: '行动投票',
      text: '近期投过该行动票的地址可用自己的默认 NFT 发言。',
    };
  }
  return undefined;
}

export function formatGovRatio(ratio: bigint, precision: bigint) {
  if (precision <= BigInt(0)) return '0%';
  const basisPoints = (ratio * BigInt(10000)) / precision;
  const whole = basisPoints / BigInt(100);
  const fraction = basisPoints % BigInt(100);
  if (fraction === BigInt(0)) return `${whole.toString()}%`;
  return `${whole.toString()}.${fraction.toString().padStart(2, '0').replace(/0+$/, '')}%`;
}

export function formatGovWeight(weight: bigint | undefined) {
  if (weight === undefined) return '0';
  return formatTokenAmount(weight);
}

export function formatGovCount(count: bigint | undefined) {
  if (count === undefined) return '0';
  return formatNumber(count);
}

export function formatGovWeightPercent(weight: bigint | undefined, totalWeight: bigint | undefined) {
  const value = weight || BigInt(0);
  const total = totalWeight || BigInt(0);
  if (value <= BigInt(0) || total <= BigInt(0)) return '0%';
  const basisPoints = (value * BigInt(10000)) / total;
  if (basisPoints === BigInt(0)) return '<0.01%';
  const whole = basisPoints / BigInt(100);
  const fraction = basisPoints % BigInt(100);
  if (fraction === BigInt(0)) return `${whole.toString()}%`;
  return `${whole.toString()}.${fraction.toString().padStart(2, '0')}%`;
}

export function formatGovWeightShare(weight: bigint | undefined, totalWeight: bigint | undefined) {
  return `${formatGovWeight(weight)}（${formatGovWeightPercent(weight, totalWeight)}）`;
}

export function govBanListMechanismText(
  totalWeight: bigint,
  thresholdRatio: bigint,
  precision: bigint,
  minSupportToOpposeRatio: bigint,
) {
  const supportToOpposeText = minSupportToOpposeRatio > BigInt(0)
    ? `严格超过反对票 ${formatNumber(minSupportToOpposeRatio)} 倍`
    : '严格超过反对票';
  if (totalWeight <= BigInt(0) || thresholdRatio <= BigInt(0) || precision <= BigInt(0)) {
    return `禁言名单实时计票：赞成票${supportToOpposeText}时生效；普通发言者的地址或 NFT 任一命中都会拒绝发言。`;
  }
  const thresholdWeight = (totalWeight * thresholdRatio + precision - BigInt(1)) / precision;
  return `禁言名单实时计票：赞成票${supportToOpposeText}，且赞成票达到全 token 治理票的 ${formatGovRatio(thresholdRatio, precision)}（当前至少 ${formatGovWeight(thresholdWeight)} 票）时生效；普通发言者的地址或 NFT 任一命中都会拒绝发言。`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countMentionTokenOccurrences(content: string, token: string) {
  if (!token) return 0;
  const tokenBoundary = String.raw`(?=$|\s|[,.!?;:，。！？；：、)）\]】])`;
  return Array.from(content.matchAll(new RegExp(`${escapeRegExp(token)}${tokenBoundary}`, 'gu'))).length;
}

const MENTION_ALL_TOKEN_PATTERN = /(^|[\s,，。.!?！？;；:：、([{（【])(@(?:all|全部|全体))(?=$|\s|[,.!?;:，。！？；：、)）\]】])/giu;

export function hasMentionAllToken(content: string) {
  MENTION_ALL_TOKEN_PATTERN.lastIndex = 0;
  return MENTION_ALL_TOKEN_PATTERN.test(content);
}

export function addMentionAllToken(content: string) {
  if (hasMentionAllToken(content)) return content;
  const trimmedEnd = /\s$/.test(content) || content.length === 0 ? content : `${content} `;
  return `${trimmedEnd}@全部 `;
}

export function removeMentionAllTokens(content: string) {
  return content
    .replace(MENTION_ALL_TOKEN_PATTERN, (match, prefix) => prefix)
    .replace(/[ \t]{2,}/g, ' ')
    .trimStart();
}

export function parseComposerMentions(
  content: string,
  selectedSenderIds: bigint[],
  senderNames: Record<string, string>,
) {
  const selected = new Set(selectedSenderIds.map((id) => id.toString()));
  let duplicateCount = 0;
  const nftIdOccurrences = new Map<string, number>();

  for (const match of content.matchAll(/@NFT\s*#(\d+)/g)) {
    const rawId = match[1];
    if (!rawId) continue;
    const normalizedId = BigInt(rawId).toString();
    selected.add(normalizedId);
    nftIdOccurrences.set(normalizedId, (nftIdOccurrences.get(normalizedId) || 0) + 1);
  }
  nftIdOccurrences.forEach((count) => {
    if (count > 1) duplicateCount += count - 1;
  });

  const mentionTokensForSender = (senderId: string) => {
    const name = senderNames[senderId];
    return [`@NFT #${senderId}`, ...(name ? [`@${name}`] : [])];
  };

  Object.keys(senderNames).forEach((senderId) => {
    let matched = false;
    mentionTokensForSender(senderId).forEach((token) => {
      const count = countMentionTokenOccurrences(content, token);
      if (count > 0) matched = true;
      if (count > 1) duplicateCount += count - 1;
    });
    if (matched) selected.add(senderId);
  });

  const mentionedSenderIds = Array.from(selected)
    .filter(
      (senderId) =>
        nftIdOccurrences.has(senderId) ||
        mentionTokensForSender(senderId).some((token) => countMentionTokenOccurrences(content, token) > 0),
    )
    .map((senderId) => BigInt(senderId));

  return {
    mentionedSenderIds,
    mentionAll: hasMentionAllToken(content),
    duplicateCount,
    invalidSenderIds: mentionedSenderIds.filter((senderId) => senderId <= BigInt(0)),
    overLimitCount: Math.max(0, mentionedSenderIds.length - MAX_MENTIONED_SENDER_IDS),
  };
}

export function mentionSenderIdsValidationHint(
  draftMentions: {
    duplicateCount: number;
    overLimitCount: number;
  },
  maxMentionedSenderIds: number = MAX_MENTIONED_SENDER_IDS,
) {
  const notices: string[] = [];
  if (draftMentions.duplicateCount > 0) {
    notices.push(`已去重 ${draftMentions.duplicateCount} 个重复 @`);
  }
  if (draftMentions.overLimitCount > 0) {
    notices.push(`超过 ${maxMentionedSenderIds} 个，请删除 ${draftMentions.overLimitCount} 个`);
  }
  return notices.length ? `mentionedSenderIds ${notices.join('；')}。` : '';
}

export function formatMessageTime(timestamp: bigint | undefined) {
  if (!timestamp || timestamp <= BigInt(0)) return '';
  const date = new Date(Number(timestamp) * 1000);
  if (!Number.isFinite(date.getTime())) return '';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  if (sameDay) return time;
  return `${date.getMonth() + 1}/${date.getDate()} ${time}`;
}

export function formatMessageFullTime(timestamp: bigint | undefined) {
  if (!timestamp || timestamp <= BigInt(0)) return '';
  const date = new Date(Number(timestamp) * 1000);
  if (!Number.isFinite(date.getTime())) return '';
  const dateLabel = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  const timeLabel = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${dateLabel} ${timeLabel}`;
}

export function messageTimestampMs(message: ParsedGroupChatMessage | undefined) {
  if (!message?.timestamp || message.timestamp <= BigInt(0)) return undefined;
  const value = Number(message.timestamp) * 1000;
  return Number.isFinite(value) ? value : undefined;
}

function calendarDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function sameCalendarDay(left: Date, right: Date) {
  return calendarDayStart(left) === calendarDayStart(right);
}

function dayDistance(later: Date, earlier: Date) {
  return Math.round((calendarDayStart(later) - calendarDayStart(earlier)) / (24 * 60 * 60 * 1000));
}

function messageDayPeriod(date: Date) {
  const hour = date.getHours();
  if (hour < 6) return '凌晨';
  if (hour < 8) return '早上';
  if (hour < 12) return '上午';
  if (hour < 13) return '中午';
  if (hour < 18) return '下午';
  return '晚上';
}

export function formatMessageDividerTime(timestampMs: number, now = new Date()) {
  const date = new Date(timestampMs);
  if (!Number.isFinite(date.getTime())) return '';
  const period = `${messageDayPeriod(date)} ${date.getHours() % 12 || 12}:${String(date.getMinutes()).padStart(2, '0')}`;
  const distance = dayDistance(now, date);
  if (distance === 0 && sameCalendarDay(now, date)) return period;
  if (distance === 1) return `昨天 ${period}`;
  if (distance > 1 && distance < 7) {
    return `${['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]} ${period}`;
  }
  if (date.getFullYear() === now.getFullYear()) return `${date.getMonth() + 1}月${date.getDate()}日 ${period}`;
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${period}`;
}

export function shouldRenderMessageTimeDivider(
  message: ParsedGroupChatMessage,
  previousMessage: ParsedGroupChatMessage | undefined,
) {
  const timestamp = messageTimestampMs(message);
  if (timestamp === undefined) return false;
  if (!previousMessage) return true;
  const previousTimestamp = messageTimestampMs(previousMessage);
  if (previousTimestamp === undefined) return true;
  return !sameCalendarDay(new Date(timestamp), new Date(previousTimestamp)) ||
    Math.abs(timestamp - previousTimestamp) >= MESSAGE_TIME_DIVIDER_GAP_MS;
}

export function quotedMessageSummary(message: { content?: string } | undefined, maxLength: number = Infinity) {
  const normalized = String(message?.content || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '消息';
  if (!Number.isFinite(maxLength) || normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

export function formatCanPostReason(reasonCode: `0x${string}` | undefined) {
  if (!reasonCode) return '';
  return CAN_POST_REASON_LABELS[reasonCode.toLowerCase()] || `合约拒绝：${reasonCode}`;
}

export function invalidateContractReads(queryClient: QueryClient) {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return Array.isArray(key) && (key[0] === 'readContract' || key[0] === 'readContracts');
    },
  });
}
