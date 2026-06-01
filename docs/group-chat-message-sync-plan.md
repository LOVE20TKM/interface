# Group Chat Message Sync Plan

This document records the agreed design for group chat unread-message syncing. It is intended as an audit reference before and during implementation.

## Background

The current public Thinkium 70001 RPC environment does not provide a reliable WebSocket event subscription path for `GroupChat.PostMessage`. Group chat message monitoring should therefore be implemented as an explicit polling-based sync system, not as event-driven realtime monitoring.

The product goal is stable, low-cost detection of new messages and mentions across watched group chats.

## Count Model

Each watched group tracks three on-chain cumulative counters:

- `messagesCount`: total group messages, including messages from banned senders.
- `mentionMeCount`: total messages mentioning the current default NFT sender identity.
- `mentionAllCount`: total messages with `mentionAll`.

Each group also stores a local baseline:

- `knownMessagesCount`
- `knownMentionMeCount`
- `knownMentionAllCount`

Unread counts are derived from the difference between on-chain counters and local baselines:

```ts
unreadMessages = max(0, messagesCount - knownMessagesCount)
unreadMentionMe = max(0, mentionMeCount - knownMentionMeCount)
unreadMentionAll = max(0, mentionAllCount - knownMentionAllCount)
```

When a group is first seen, historical messages are not counted as unread. The initial on-chain counters become the local baseline.

`mentionMeCount` is bound to the current wallet's default NFT sender identity. If no default sender identity exists, `mentionMeCount` is not queried; normal unread and `mentionAllCount` still apply.

Entering a group chat detail page and successfully refreshing the current group marks that group as read by updating all three baselines to the current on-chain counters.

## Bottom Navigation Badge

The bottom chat icon uses this priority:

1. If total `unreadMentionMe > 0`, show the `@me` count.
2. Else if total `unreadMentionAll > 0`, show the `@all` count.
3. Else if total `unreadMessages > 0`, show the normal unread count.
4. Counts above 99 are displayed as `99+`.
5. If the app is opened for the first time and all three group caches are missing, show a red dot to invite chat discovery.

The badge represents message counts, not the number of groups.

Suggested summary shape:

```ts
type ChatBadgeSummary = {
  badgeType: 'mention-me' | 'mention-all' | 'unread' | 'intro-dot' | 'none';
  badgeCount: bigint;
  badgeLabel: string;
};
```

## Watch Registration Model

There are two registration scopes:

- Page-level watches: owned by the current page. A new page-level registration replaces the previous page-level registration.
- Background watches: long-lived watches driven by caches or persistent user choices. They are not removed by page navigation.

The chat page maintains both:

- Background low-frequency watches for followed groups and recommended groups.
- Page-level medium-frequency watches for the chat page's current visible group set.

The group chat detail page registers the current group as a page-level high-frequency watch. Background watches remain active.

Suggested registration API:

```ts
registerGroups({
  source: string;
  scope: 'page' | 'background';
  frequency: 'high' | 'medium' | 'low';
  groupIds: readonly bigint[];
})
```

Rules:

- A new `scope: 'page'` registration replaces previous page-level registrations.
- `scope: 'background'` registrations are added or removed by source and are not affected by page-level changes.
- If the same group is registered by multiple sources, the highest frequency wins.
- Unregistering a source only removes that source.
- Removing a group from all watch sources does not delete its baseline; this prevents old history from being counted as unread if the group is watched again later.

## Refresh Cadence

Refresh frequencies:

- High: every 20 seconds, for the current group chat.
- Medium: every 1 minute, for chat page groups.
- Low: every 3 minutes, for background cached groups.

Scheduling rules:

- Intervals are measured from the previous refresh end time, not the start time.
- High, medium, and low refreshes that become due at the same time are merged into one batch query.
- No overlapping refresh batches are allowed. If a refresh is still running, the next refresh waits.
- Page visibility restore may trigger an immediate refresh, but still must respect the no-overlap rule.
- For groups with multiple sources, the highest effective frequency determines whether the group is due.

## Batch Query Strategy

The sync center collects all due groups, deduplicates them, and queries counters in a batched contract read.

Low and medium refreshes should query all three counters:

- `messagesCount(groupId)`
- `messagesByMentionCount(groupId, defaultSenderId)`
- `messagesByMentionAllCount(groupId)`

The high-frequency group chat detail refresh may query only `messagesCount(groupId)` in the first implementation to reduce RPC load. The group's mentions are marked read when entering the group chat detail page, and the main group chat detail requirement is detecting new message body updates. If strict consistency is later needed, the high-frequency path can query all three counters as well.

After a refresh:

- First-seen groups initialize baselines instead of generating unread counts.
- Existing groups update current counters and derived unread counts.
- If the current group chat's `messagesCount` increased, the group chat message list is refreshed.

## Cache Design

Followed group and owned chain group keys are isolated by:

- `chainId`
- `groupChatContract`
- `walletAddress`

Token recommendation cache keys additionally include `tokenAddress`, because token/action recommendations are current-token contextual. Count baseline keys also include `defaultSenderId`, because `@me` depends on the default NFT identity.

Followed groups:

```ts
type GroupChatFollowedGroups = string[];
```

Owned chain groups:

```ts
type GroupChatOwnedChainGroups = string[];
```

Token recommendation cache:

```ts
type GroupChatCachedGroups = {
  recommendedGroupIds: string[];
  initializedAt: number;
  updatedAt: number;
};
```

Baseline cache:

```ts
type GroupChatCountBaseline = {
  messagesCount: string;
  mentionMeCount: string;
  mentionAllCount: string;
  updatedAt: number;
};
```

If all three group caches are missing, the bottom navigation shows the intro red dot.

## Group Sources

Followed groups:

- User-followed groups.
- Newly activated groups are followed automatically after activation confirmation.
- Background low-frequency watch.
- Included in chat page medium-frequency watch when visible.

Recommended groups:

- Token main group.
- Token governance group.
- Relevant action main groups.
- Relevant action governance groups.
- Activated chain groups returned by `GroupJoin.gGroupIdsByTokenAddressByAccount(currentToken, account)`.
- Other already-activated groups produced by existing recommendation logic.

Owned chain groups:

- Activated chain groups for my owned NFTs.
- Wallet-level background low-frequency watch.
- Included in chat page medium-frequency watch when visible.
- Displayed with reason "我持有的链群".

Recommended groups display the strongest recommendation reason as a compact pill after the group id. Chain groups discovered through action participation use "我参与行动关联的链群". Followed groups are filtered out of recommendations so the same group does not appear twice.

When delayed loading produces a new group set, it must be fully diffed against the cached set:

- Added groups are registered and refreshed as needed.
- Removed groups are unregistered from that source and removed from cache.
- Existing groups keep state and baseline.

This includes reductions, for example when leaving an action causes related groups to stop being recommended. If the same group remains followed, it stays watched with the highest remaining frequency.

## Page Flows

### First app open outside chat

- Read followed groups, owned chain groups, and token recommendation caches.
- If all are missing, show the bottom-nav intro red dot.
- If any cache exists, register cached groups as background low-frequency watches.
- Trigger one immediate batch refresh for cached groups.
- Show the bottom-nav badge according to `@me > @all > unread`.

### Chat page

- Read followed groups, cached owned chain groups, and cached token recommendations.
- Register background low-frequency watches.
- Register page-level medium-frequency watches.
- Immediately refresh cached groups.
- Delayed-load recommendation sources.
- Diff delayed-loaded groups against cache.
- Register added groups, unregister removed groups, refresh added groups, and update cache.
- When leaving the page, page-level medium-frequency watches are replaced or removed; background watches remain.

### Group chat detail page

- Register the current group as a page-level high-frequency watch.
- Immediately refresh the current group.
- After successful refresh, update all three baselines for the group and clear unread.
- If high-frequency polling detects a `messagesCount` increase, refresh the group chat message list.
- Leaving the group chat detail page removes the high-frequency page watch; background watches remain.

## Code Migration Direction

Remove or disable:

- `useWatchContractEvent('PostMessage')`
- Event-watch failure state
- Event-health terminology such as `healthy/degraded/failed`
- Event-driven `latestMessages` compensation paths

Keep and promote:

- Batched contract reads
- `messagesCount` synchronization
- Read-baseline marking
- Unread summary
- Page-level and background watch registration

The sync center should use explicit polling-sync naming, such as `src/contexts/GroupChatSyncContext.tsx`. Do not keep event/realtime naming for the main implementation.

## Implementation Order

1. Refactor the context into a polling sync center with source registration, frequency aggregation, batched refresh, baselines, and badge summary.
2. Connect the bottom navigation badge to `@me`, `@all`, normal unread, and intro-dot states.
3. Connect the chat page cache-first flow, medium page watches, and full delayed-load diff.
4. Connect the group chat detail high-frequency watch, immediate refresh, read-baseline update, and message-list refresh trigger.
5. Remove event-watch code and temporary probe scripts.
6. Verify against real chain state: intro dot, low-frequency background badge, medium chat refresh, high group chat detail refresh, cache additions, cache removals, and action-exit recommendation removal.
