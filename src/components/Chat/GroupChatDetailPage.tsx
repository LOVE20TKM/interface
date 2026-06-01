'use client';

import { useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import Header from '@/src/components/Header';
import { TokenContext } from '@/src/contexts/TokenContext';
import { cn } from '@/lib/utils';
import { GroupChatPanel } from './GroupChatPanel';
import styles from './ChatPage.module.css';
import {
  READ_CURSORS_CHANGED_EVENT,
  READ_CURSORS_STORAGE_KEY,
} from './chatConstants';
import {
  DEFAULT_MESSAGE_PREFERENCES,
  type MessagePreferences,
  readFollowedGroupIds,
  readMessagePreferences,
  readRecordStorage,
  writeFollowedGroupIds,
} from './chatStorage';
import type { ChatWorkspaceView } from './chatTypes';
import {
  buildChatIndexHref,
  buildGroupChatDetailHref,
  buildGroupChatPanelHref,
  invalidateContractReads,
  parseGroupId,
  safeBigIntFromString,
} from './chatUtils';
import type { ParsedGroupChatMessage } from '@/src/hooks/composite/useGroupChatData';

export default function GroupChatDetailPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const groupId = router.isReady ? parseGroupId(router.query.groupId) : undefined;
  const tokenSymbol = Array.isArray(router.query.symbol) ? router.query.symbol[0] : router.query.symbol || token?.symbol;
  const [followedGroupIds, setFollowedGroupIds] = useState<string[]>([]);
  const [readCursors, setReadCursors] = useState<Record<string, string>>({});
  const [messagePreferences, setMessagePreferences] = useState<MessagePreferences>(DEFAULT_MESSAGE_PREFERENCES);
  const accountAddress = account as `0x${string}` | undefined;
  const tokenAddress = token?.address as `0x${string}` | undefined;

  useEffect(() => {
    setFollowedGroupIds(readFollowedGroupIds(accountAddress));
    setReadCursors(readRecordStorage(READ_CURSORS_STORAGE_KEY));
    setMessagePreferences(readMessagePreferences());
  }, [accountAddress]);

  const markGroupRead = useCallback((nextGroupId: bigint, latestMessageId: bigint | undefined) => {
    const key = nextGroupId.toString();
    const cursor = latestMessageId && latestMessageId > BigInt(0) ? latestMessageId : BigInt(0);
    setReadCursors((prev) => {
      const previous = safeBigIntFromString(prev[key]);
      if (cursor <= previous) return prev;
      const next = { ...prev, [key]: cursor.toString() };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(READ_CURSORS_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event(READ_CURSORS_CHANGED_EVENT));
      }
      return next;
    });
  }, []);

  const refreshAll = useCallback(() => {
    invalidateContractReads(queryClient);
  }, [queryClient]);

  const toggleFollowedGroup = useCallback((nextGroupId: bigint) => {
    if (!accountAddress) return;
    const key = nextGroupId.toString();
    setFollowedGroupIds((prev) => {
      const next = prev.includes(key) ? prev.filter((item) => item !== key) : [key, ...prev];
      writeFollowedGroupIds(accountAddress, next);
      return next;
    });
  }, [accountAddress]);

  const onOpenGroupPanel = useCallback(
    (nextView: ChatWorkspaceView) => {
      if (!groupId) return;
      if (nextView === 'members') {
        router.push(buildGroupChatPanelHref('members', tokenSymbol, groupId));
        return;
      }
      if (nextView === 'banList') {
        router.push(buildGroupChatPanelHref('banlist', tokenSymbol, groupId));
        return;
      }
      if (nextView === 'admins') {
        router.push(buildGroupChatPanelHref('admins', tokenSymbol, groupId));
        return;
      }
      if (nextView === 'settings') {
        router.push(buildGroupChatPanelHref('settings', tokenSymbol, groupId));
        return;
      }
      router.push(buildGroupChatDetailHref(tokenSymbol, groupId), undefined, { shallow: true });
    },
    [groupId, router, tokenSymbol],
  );

  const openBanSettingsForMessage = useCallback(
    (message: ParsedGroupChatMessage) => {
      router.push(buildGroupChatPanelHref('banlist', tokenSymbol, message.groupId, {
        target: 'message',
        messageId: message.messageId,
      }));
    },
    [router, tokenSymbol],
  );

  const backUrl = buildChatIndexHref(tokenSymbol);

  return (
    <div className={styles.groupChatDetailPage}>
      <Header title="群聊" backUrl={backUrl} replaceBack />
      <main className={styles.chatPrototype} data-detail="true">
        <div className={styles.chatWorkspace} data-entry="love20-group-chat-detail">
          <section className={styles.chatSurface}>
            {!router.isReady ? (
              <section className={cn('workspace-screen', 'inbox-screen')} aria-label="聊天工作区">
                <div className="empty-state">页面初始化中...</div>
              </section>
            ) : groupId ? (
              <GroupChatPanel
                groupId={groupId}
                account={accountAddress}
                isFollowed={followedGroupIds.includes(groupId.toString())}
                showBannedMessages={messagePreferences.showBannedMessages}
                showMessageTimes={messagePreferences.showMessageTimes}
                tokenAddress={tokenAddress}
                tokenSymbol={tokenSymbol}
                onPosted={refreshAll}
                onOpenPanel={onOpenGroupPanel}
                onOpenBanSettings={openBanSettingsForMessage}
                onToggleFollow={toggleFollowedGroup}
                onReadLatest={markGroupRead}
              />
            ) : (
              <section className={cn('workspace-screen', 'inbox-screen')} aria-label="聊天工作区">
                <div className="empty-state">缺少 groupId，无法打开群聊。</div>
              </section>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
