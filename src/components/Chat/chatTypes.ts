export type ChatWorkspaceView = 'inbox' | 'chat' | 'members' | 'admins' | 'banList' | 'settings';

export type GroupChatRecommendationReason =
  | 'owned-chain-group'
  | 'current-token-main'
  | 'governor'
  | 'joined-action'
  | 'voted-action'
  | 'joined-chain-group';

export type GroupChatRecommendationSignal = {
  groupId: bigint;
  reason: GroupChatRecommendationReason;
};

export const GROUP_CHAT_RECOMMENDATION_REASON_LABELS: Record<GroupChatRecommendationReason, string> = {
  'owned-chain-group': '我持有的链群',
  'current-token-main': '当前代币主群',
  governor: '我是治理者',
  'joined-action': '我参与的行动',
  'voted-action': '我投票过',
  'joined-chain-group': '我参与行动关联的链群',
};

export const GROUP_CHAT_RECOMMENDATION_REASON_RANK: Record<GroupChatRecommendationReason, number> = {
  'owned-chain-group': 6,
  'current-token-main': 5,
  governor: 4,
  'joined-action': 3,
  'voted-action': 2,
  'joined-chain-group': 1,
};
