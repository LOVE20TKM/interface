export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
export const FIRST_TOKEN_SYMBOL = process.env.NEXT_PUBLIC_FIRST_TOKEN_SYMBOL || 'LOVE20';
export const MAX_MENTIONED_SENDER_IDS = 32;
export const BAN_LIST_PAGE_SIZE = 5;
export const MEMBER_PAGE_SIZE = 20;
export const MENTION_ALL_PAGE_SIZE = 20;
export const DEFAULT_MESSAGE_WINDOW_SIZE = 100;
export const MESSAGE_PAGE_SIZE = 100;
export const MESSAGE_TIME_DIVIDER_GAP_MS = 5 * 60 * 1000;
export const LONG_PRESS_MS = 520;
export const LONG_PRESS_MOVE_TOLERANCE = 10;
export const FOLLOWED_GROUPS_STORAGE_KEY = 'love20-chat:followed-groups:v1';
export const FOLLOWED_GROUPS_CHANGED_EVENT = 'love20-chat:followed-groups-changed';
export const OWNED_CHAIN_GROUPS_STORAGE_KEY = 'love20-chat:owned-chain-groups:v1';
export const OWNED_CHAIN_GROUPS_CHANGED_EVENT = 'love20-chat:owned-chain-groups-changed';
export const SELECTED_CHAT_SENDER_STORAGE_KEY = 'love20-chat:selected-chat-sender:v1';
export const CACHED_GROUP_SETS_STORAGE_KEY = 'love20-chat:cached-group-sets:v2';
export const CACHED_GROUP_SETS_CHANGED_EVENT = 'love20-chat:cached-group-sets-changed';
export const MESSAGE_PREFERENCES_STORAGE_KEY = 'love20-chat:message-preferences:v3';
export const READ_CURSORS_STORAGE_KEY = 'love20-chat:read-cursors:v1';
export const READ_CURSORS_CHANGED_EVENT = 'love20-chat:read-cursors-changed';
export const MENTION_ALL_READ_CURSORS_STORAGE_KEY = 'love20-chat:mention-all-read-cursors:v1';
export const MENTION_ALL_READ_CURSORS_CHANGED_EVENT = 'love20-chat:mention-all-read-cursors-changed';

export const CAN_POST_REASON_LABELS: Record<string, string> = {
  '0x00000000': '可以发言',
  '0x1dc37264': '群聊未激活',
  '0x105722a2': '群聊已暂停发言',
  '0x6a003ec3': '群聊或默认身份不存在',
  '0x87d2b2a7': '当前钱包不是默认身份持有人',
  '0xab1f07dd': '当前默认身份没有发言资格',
  '0xa9cc8792': '当前默认身份或地址被禁言',
  '0x02a5acaa': '发言资格源读取失败',
  '0x1c3ba277': '禁言状态源读取失败',
};
