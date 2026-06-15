export type ConfiguredGroupChatRecommendation = {
  groupId: string;
  reason: string;
};

function normalizeRecommendationItem(value: unknown): ConfiguredGroupChatRecommendation | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

  const item = value as Record<string, unknown>;
  const rawGroupId = item.groupId ?? item.id;
  const rawReason = item.reason;
  const groupId = typeof rawGroupId === 'string' || typeof rawGroupId === 'number'
    ? String(rawGroupId).trim()
    : '';
  const reason = typeof rawReason === 'string' ? rawReason.trim() : '';

  if (!/^\d+$/.test(groupId) || !reason) return undefined;
  return { groupId, reason };
}

export function getConfiguredGroupChatRecommendations(): ConfiguredGroupChatRecommendation[] {
  const rawRecommendations = process.env.NEXT_PUBLIC_GROUP_CHAT_RECOMMENDATIONS;
  if (!rawRecommendations) return [];

  try {
    const parsed = JSON.parse(rawRecommendations);
    return Array.isArray(parsed)
      ? parsed
        .map(normalizeRecommendationItem)
        .filter((item): item is ConfiguredGroupChatRecommendation => !!item)
      : [];
  } catch {
    return [];
  }
}
