import {
  GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER_ADDRESS,
  GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER_ADDRESS,
  GROUP_CHAT_TOKEN_GOV_MANAGER_ADDRESS,
  GROUP_CHAT_TOKEN_MAIN_MANAGER_ADDRESS,
} from '@/src/hooks/contracts/useGroupChatManagers';
import {
  GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS,
  GROUP_CHAT_GOV_VOTED_BAN_SOURCE_ADDRESS,
  GROUP_CHAT_JOIN_SCOPE_SOURCE_ADDRESS,
  GROUP_CHAT_MEMBER_SCOPE_ADDRESS,
} from '@/src/hooks/contracts/useGroupChatModeration';
import type { GroupChatAccountData, ParsedGroupChatInfo } from '@/src/hooks/composite/useGroupChatData';
import { ZERO_ADDRESS } from './chatConstants';
import { sameAddress } from './chatUtils';

export type SendAvailabilitySource =
  | 'loading'
  | 'wallet'
  | 'defaultNft'
  | 'chat'
  | 'scope'
  | 'ban'
  | 'unknown';

export type SendAvailability =
  | { canSend: true }
  | {
      canSend: false;
      source: SendAvailabilitySource;
      message: string;
    };

type ScopeDescriptor = {
  key: string;
  matches: (chatInfo: ParsedGroupChatInfo) => boolean;
  scopeRejectedMessage: (context: SendAvailabilityContext) => string;
};

type BanDescriptor = {
  key: string;
  matches: (chatInfo: ParsedGroupChatInfo) => boolean;
  banRejectedMessage: string;
};

const CAN_POST_REASON = {
  OK: '0x00000000',
  CHAT_NOT_ACTIVATED: '0x1dc37264',
  POSTING_NOT_ALLOWED: '0x105722a2',
  GROUP_NOT_EXIST: '0x6a003ec3',
  SENDER_ADDRESS_NOT_SENDER_ID_OWNER: '0x87d2b2a7',
  SCOPE_REJECTED: '0xab1f07dd',
  BAN_REJECTED: '0xa9cc8792',
  SCOPE_SOURCE_FAILED: '0x02a5acaa',
  BAN_SOURCE_FAILED: '0x1c3ba277',
} as const;

const scopeDescriptors: ScopeDescriptor[] = [
  {
    key: 'token-main-manager',
    matches: (chatInfo) => sameAddress(chatInfo.owner, GROUP_CHAT_TOKEN_MAIN_MANAGER_ADDRESS),
    scopeRejectedMessage: () => '持有该代币、拥有治理票或参与过该代币行动后可发言。',
  },
  {
    key: 'token-gov-manager',
    matches: (chatInfo) => sameAddress(chatInfo.owner, GROUP_CHAT_TOKEN_GOV_MANAGER_ADDRESS),
    scopeRejectedMessage: () => '拥有该代币治理票后可发言。',
  },
  {
    key: 'token-action-main-manager',
    matches: (chatInfo) => sameAddress(chatInfo.owner, GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER_ADDRESS),
    scopeRejectedMessage: () => '近期投过该行动票，或参与过该行动后可发言。',
  },
  {
    key: 'token-action-gov-manager',
    matches: (chatInfo) => sameAddress(chatInfo.owner, GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER_ADDRESS),
    scopeRejectedMessage: () => '近期投过该行动票后可发言。',
  },
  {
    key: 'group-member-scope',
    matches: (chatInfo) => sameAddress(chatInfo.scopeSource, GROUP_CHAT_MEMBER_SCOPE_ADDRESS),
    scopeRejectedMessage: (context) => `${formatDefaultSender(context.accountData)}不在该群成员名单中。`,
  },
  {
    key: 'group-join-scope-source',
    matches: (chatInfo) => sameAddress(chatInfo.scopeSource, GROUP_CHAT_JOIN_SCOPE_SOURCE_ADDRESS),
    scopeRejectedMessage: (context) => `当前地址未通过此链群参与行动，${formatDefaultSender(context.accountData)}也不在成员名单中。`,
  },
  {
    key: 'open-scope',
    matches: (chatInfo) => sameAddress(chatInfo.scopeSource, ZERO_ADDRESS),
    scopeRejectedMessage: (context) => `${formatDefaultSender(context.accountData)}没有发言资格。`,
  },
];

const banDescriptors: BanDescriptor[] = [
  {
    key: 'admin-ban-source',
    matches: (chatInfo) => sameAddress(chatInfo.banSource, GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS),
    banRejectedMessage: '当前地址或默认 NFT 已被管理员禁言。',
  },
  {
    key: 'gov-voted-ban-source',
    matches: (chatInfo) => sameAddress(chatInfo.banSource, GROUP_CHAT_GOV_VOTED_BAN_SOURCE_ADDRESS),
    banRejectedMessage: '当前地址或默认 NFT 已被治理禁言。',
  },
];

function normalizeReasonCode(reasonCode: unknown) {
  return typeof reasonCode === 'string' && reasonCode.startsWith('0x')
    ? reasonCode.toLowerCase()
    : undefined;
}

type SendAvailabilityContext = {
  accountData: GroupChatAccountData;
};

function formatDefaultSender(accountData: GroupChatAccountData) {
  const senderId = accountData.defaultSenderId;
  if (!senderId) return '当前默认 NFT';
  const idLabel = `NFT #${senderId.toString()}`;
  const name = accountData.defaultSenderName.trim();
  if (!name || name === idLabel || name === `LOVE20 ${idLabel}`) return idLabel;
  return `${name} (${idLabel})`;
}

function scopeRejectedMessage(chatInfo: ParsedGroupChatInfo | undefined, context: SendAvailabilityContext) {
  if (!chatInfo) return `${formatDefaultSender(context.accountData)}没有发言资格。`;
  const descriptor = scopeDescriptors.find((item) => item.matches(chatInfo));
  return descriptor?.scopeRejectedMessage(context) || `${formatDefaultSender(context.accountData)}或当前地址未满足该群自定义发言规则。`;
}

function banRejectedMessage(chatInfo: ParsedGroupChatInfo | undefined) {
  if (!chatInfo) return '当前地址或默认 NFT 被禁言规则拒绝。';
  const descriptor = banDescriptors.find((item) => item.matches(chatInfo));
  return descriptor?.banRejectedMessage || '当前地址或默认 NFT 被禁言规则拒绝。';
}

export function resolveSendAvailability({
  account,
  chatInfo,
  accountData,
}: {
  account: `0x${string}` | undefined;
  chatInfo: ParsedGroupChatInfo | undefined;
  accountData: GroupChatAccountData;
}): SendAvailability {
  if (!account) {
    return { canSend: false, source: 'wallet', message: '连接钱包后可参与聊天。' };
  }

  if (!chatInfo || accountData.isDefaultSenderPending || accountData.isPending) {
    return { canSend: false, source: 'loading', message: '正在检查发言权限...' };
  }

  if (!accountData.hasDefaultSender || !accountData.defaultSenderId) {
    return { canSend: false, source: 'defaultNft', message: '设置默认 LOVE20 NFT 后可参与聊天。' };
  }

  if (!accountData.canPost) {
    const reasonCode = normalizeReasonCode(accountData.canPostReasonCode);
    if (reasonCode === CAN_POST_REASON.CHAT_NOT_ACTIVATED) {
      return { canSend: false, source: 'chat', message: '该群聊尚未激活。' };
    }
    if (reasonCode === CAN_POST_REASON.POSTING_NOT_ALLOWED) {
      return { canSend: false, source: 'chat', message: '该群聊已暂停发言。' };
    }
    if (reasonCode === CAN_POST_REASON.GROUP_NOT_EXIST) {
      return { canSend: false, source: 'chat', message: '群聊或默认 NFT 身份不存在。' };
    }
    if (reasonCode === CAN_POST_REASON.SENDER_ADDRESS_NOT_SENDER_ID_OWNER) {
      return { canSend: false, source: 'defaultNft', message: '当前钱包不是默认 NFT 持有人。' };
    }
    if (reasonCode === CAN_POST_REASON.SCOPE_REJECTED) {
      return { canSend: false, source: 'scope', message: scopeRejectedMessage(chatInfo, { accountData }) };
    }
    if (reasonCode === CAN_POST_REASON.BAN_REJECTED) {
      return { canSend: false, source: 'ban', message: banRejectedMessage(chatInfo) };
    }
    if (reasonCode === CAN_POST_REASON.SCOPE_SOURCE_FAILED) {
      return { canSend: false, source: 'scope', message: '发言资格读取失败，暂时无法发言。' };
    }
    if (reasonCode === CAN_POST_REASON.BAN_SOURCE_FAILED) {
      return { canSend: false, source: 'ban', message: '禁言状态读取失败，暂时无法发言。' };
    }
    return { canSend: false, source: 'unknown', message: reasonCode ? `合约拒绝发言：${reasonCode}` : '当前无法发言。' };
  }

  if (!chatInfo.postingAllowed) {
    return { canSend: false, source: 'chat', message: '该群聊已暂停发言。' };
  }

  return { canSend: true };
}
