'use client';

import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { useGroupChatSyncState, useMarkGroupRead, useRegisterActiveChat } from '@/src/contexts/GroupChatSyncContext';
import { useGroupChatVotingPower } from '@/src/hooks/contracts/useGroupChatManagers';
import {
  usePostAsDefaultSender,
} from '@/src/hooks/contracts/useGroupChat';
import {
  GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS,
  GROUP_CHAT_GOV_VOTED_BAN_SOURCE_ADDRESS,
  useGroupAdminOperatorPermission,
  useGroupMentionAllPermission,
} from '@/src/hooks/contracts/useGroupChatModeration';
import {
  useGroupChatManagedTitle,
  useGroupChatRoomAccountData,
  useGroupChatRoomPublicData,
  type ParsedGroupChatMessage,
} from '@/src/hooks/composite/useGroupChatData';
import { ChatComposer } from './ChatComposer';
import { ChatMessageList } from './ChatMessageList';
import { ChatRoomToolbar } from './ChatRoomToolbar';
import {
  DEFAULT_MESSAGE_WINDOW_SIZE,
  MAX_MENTIONED_SENDER_IDS,
  MESSAGE_PAGE_SIZE,
} from './chatConstants';
import type { ChatWorkspaceView } from './chatTypes';
import {
  formatCanPostReason,
  isManagerOwnedChat,
  sameAddress,
} from './chatUtils';
import { useChatComposerState } from './useChatComposerState';

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function RoomPanel({
  groupId,
  account,
  title,
  isPinned,
  showBannedMessages,
  showMessageTimes,
  tokenAddress,
  tokenSymbol,
  onPosted,
  onOpenPanel,
  onOpenBanSettings,
  onTogglePin,
  onReadLatest,
}: {
  groupId: bigint | undefined;
  account: `0x${string}` | undefined;
  title?: string;
  isPinned: boolean;
  showBannedMessages: boolean;
  showMessageTimes: boolean;
  tokenAddress?: `0x${string}`;
  tokenSymbol?: string;
  onPosted: () => void;
  onOpenPanel: (view: ChatWorkspaceView) => void;
  onOpenBanSettings: (message: ParsedGroupChatMessage) => void;
  onTogglePin: (groupId: bigint) => void;
  onReadLatest?: (groupId: bigint, latestMessageId: bigint | undefined) => void;
}) {
  const [content, setContent] = useState('');
  const [quotedMessage, setQuotedMessage] = useState<ParsedGroupChatMessage | undefined>();
  const [mentionedSenderIds, setMentionedSenderIds] = useState<bigint[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | undefined>();
  const [messageWindowSize, setMessageWindowSize] = useState(DEFAULT_MESSAGE_WINDOW_SIZE);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLElement | null>(null);
  const restoreScrollAfterPrependRef = useRef(false);
  const previousScrollHeightRef = useRef(0);
  const lastAutoScrollGroupIdRef = useRef<string | undefined>();
  const lastAutoScrollLatestMessageIdRef = useRef<string | undefined>();
  const lastRefetchedSyncMessageIdRef = useRef<string | undefined>();
  const bottomResizeObserverRef = useRef<ResizeObserver | undefined>();
  const bottomResizeFrameRef = useRef<number | undefined>();
  const [composerHeight, setComposerHeight] = useState(0);
  const [messageListHeight, setMessageListHeight] = useState<number | undefined>();
  const [bottomNavHeight, setBottomNavHeight] = useState(0);
  useRegisterActiveChat(groupId);
  const markGroupRead = useMarkGroupRead();
  const syncState = useGroupChatSyncState(groupId);
  const publicRoom = useGroupChatRoomPublicData(groupId, messageWindowSize);
  const accountRoom = useGroupChatRoomAccountData(groupId, account, publicRoom.senderNames);
  const managedTitle = useGroupChatManagedTitle(
    groupId,
    tokenAddress && tokenSymbol ? { address: tokenAddress, symbol: tokenSymbol } : undefined,
  );
  const activeGovBanSource = sameAddress(publicRoom.chatInfo?.banSource, GROUP_CHAT_GOV_VOTED_BAN_SOURCE_ADDRESS);
  const activeAdminBanSource = sameAddress(publicRoom.chatInfo?.banSource, GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS);
  const messageGovVotingPower = useGroupChatVotingPower(
    groupId,
    publicRoom.chatInfo?.owner,
    account,
    activeGovBanSource,
  );
  const canVoteMessageGovBan = activeGovBanSource && messageGovVotingPower.voteWeight > BigInt(0);
  const { postAsDefaultSender, isPending, isConfirming, isConfirmed } = usePostAsDefaultSender();
  const mentionAllPermission = useGroupMentionAllPermission(groupId, account);
  const messageAdminPermission = useGroupAdminOperatorPermission(groupId, account, activeAdminBanSource);
  const canManageMessageAdminBan = activeAdminBanSource && messageAdminPermission.canOperate;
  const postedHandledRef = useRef(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    setContent('');
    setQuotedMessage(undefined);
    setMentionedSenderIds([]);
    setActiveMenuMessageId(undefined);
    setMessageWindowSize(DEFAULT_MESSAGE_WINDOW_SIZE);
    restoreScrollAfterPrependRef.current = false;
    previousScrollHeightRef.current = 0;
    lastAutoScrollGroupIdRef.current = undefined;
    lastAutoScrollLatestMessageIdRef.current = undefined;
    lastRefetchedSyncMessageIdRef.current = undefined;
  }, [groupId]);

  const stopBottomResizeObserver = useCallback(() => {
    bottomResizeObserverRef.current?.disconnect();
    bottomResizeObserverRef.current = undefined;
    if (bottomResizeFrameRef.current !== undefined) {
      cancelAnimationFrame(bottomResizeFrameRef.current);
      bottomResizeFrameRef.current = undefined;
    }
  }, []);

  const scrollMessageListToBottom = useCallback(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;
    const scrollToBottom = () => {
      messageList.scrollTop = Math.max(0, messageList.scrollHeight - messageList.clientHeight);
    };
    scrollToBottom();
    requestAnimationFrame(() => {
      scrollToBottom();
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    });
  }, []);

  const keepMessageListAtBottomWhileLayoutSettles = useCallback(() => {
    stopBottomResizeObserver();
    scrollMessageListToBottom();
    const messageList = messageListRef.current;
    if (!messageList || typeof ResizeObserver === 'undefined') return;

    let stableFrames = 0;
    let lastScrollHeight = -1;
    let lastClientHeight = -1;

    const settle = () => {
      bottomResizeFrameRef.current = undefined;
      const currentList = messageListRef.current;
      if (!currentList) {
        stopBottomResizeObserver();
        return;
      }

      const sizeChanged =
        currentList.scrollHeight !== lastScrollHeight ||
        currentList.clientHeight !== lastClientHeight;
      lastScrollHeight = currentList.scrollHeight;
      lastClientHeight = currentList.clientHeight;
      stableFrames = sizeChanged ? 0 : stableFrames + 1;
      scrollMessageListToBottom();

      if (stableFrames >= 8) {
        stopBottomResizeObserver();
        return;
      }
      bottomResizeFrameRef.current = requestAnimationFrame(settle);
    };

    const scheduleSettle = () => {
      stableFrames = 0;
      if (bottomResizeFrameRef.current !== undefined) return;
      bottomResizeFrameRef.current = requestAnimationFrame(settle);
    };

    bottomResizeObserverRef.current = new ResizeObserver(scheduleSettle);
    bottomResizeObserverRef.current.observe(messageList);
    Array.from(messageList.children).forEach((child) => {
      bottomResizeObserverRef.current?.observe(child);
    });
    scheduleSettle();
  }, [scrollMessageListToBottom, stopBottomResizeObserver]);

  useEffect(() => stopBottomResizeObserver, [stopBottomResizeObserver]);

  useEffect(() => {
    if (isPending || isConfirming) {
      postedHandledRef.current = false;
    }
  }, [isConfirming, isPending]);

  useEffect(() => {
    if (isConfirmed && !postedHandledRef.current) {
      postedHandledRef.current = true;
      setContent('');
      setQuotedMessage(undefined);
      setMentionedSenderIds([]);
      toast.success('已发送');
      publicRoom.refetch();
      accountRoom.refetch();
      onPosted();
    }
  }, [accountRoom, isConfirmed, onPosted, publicRoom]);

  const composerState = useChatComposerState({
    groupId,
    account,
    publicRoom,
    accountRoom,
    content,
    mentionedSenderIds,
    isPending,
    isConfirming,
  });
  const messageById = useMemo(() => {
    const map: Record<string, ParsedGroupChatMessage> = {};
    publicRoom.messages.forEach((message) => {
      map[message.messageId.toString()] = message;
    });
    Object.entries(publicRoom.quotedMessages).forEach(([messageId, message]) => {
      map[messageId] = message;
    });
    return map;
  }, [publicRoom.messages, publicRoom.quotedMessages]);
  const effectiveMessagesCount =
    syncState.messagesCount && (!publicRoom.messagesCount || syncState.messagesCount > publicRoom.messagesCount)
      ? syncState.messagesCount
      : publicRoom.messagesCount;
  const visibleMessages = useMemo(
    () => publicRoom.messages.filter((message) => showBannedMessages || !publicRoom.bannedMessageIds[message.messageId.toString()]),
    [publicRoom.bannedMessageIds, publicRoom.messages, showBannedMessages],
  );
  const latestVisibleMessageId = visibleMessages[visibleMessages.length - 1]?.messageId.toString();
  const hasMoreMessages =
    effectiveMessagesCount !== undefined && BigInt(publicRoom.messages.length) < effectiveMessagesCount;
  const displayedRoom = useMemo(
    () => ({
      ...publicRoom,
      messagesCount: effectiveMessagesCount,
      messages: publicRoom.messages,
    }),
    [effectiveMessagesCount, publicRoom],
  );

  const measureDetailLayout = useCallback(() => {
    const messageList = messageListRef.current;
    const composer = composerRef.current;
    if (!messageList || !composer) return;

    const nextComposerHeight = Math.ceil(composer.getBoundingClientRect().height);
    const bottomNav = document.querySelector('nav.fixed.bottom-0') as HTMLElement | null;
    const bottomNavRect = bottomNav?.getBoundingClientRect();
    const bottomNavVisible =
      !!bottomNav &&
      !!bottomNavRect &&
      bottomNavRect.height > 0 &&
      window.getComputedStyle(bottomNav).display !== 'none';
    const bottomBoundary = bottomNavVisible ? bottomNavRect.top : window.innerHeight;
    const nextBottomNavHeight = bottomNavVisible ? Math.max(0, window.innerHeight - bottomBoundary) : 0;
    const nextMessageListHeight = Math.max(
      120,
      Math.floor(bottomBoundary - nextComposerHeight - messageList.getBoundingClientRect().top),
    );

    setComposerHeight((current) => (current === nextComposerHeight ? current : nextComposerHeight));
    setBottomNavHeight((current) => (current === nextBottomNavHeight ? current : nextBottomNavHeight));
    setMessageListHeight((current) => (current === nextMessageListHeight ? current : nextMessageListHeight));
  }, []);

  useBrowserLayoutEffect(() => {
    measureDetailLayout();

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? undefined
      : new ResizeObserver(measureDetailLayout);
    if (composerRef.current) resizeObserver?.observe(composerRef.current);
    if (messageListRef.current) resizeObserver?.observe(messageListRef.current);

    window.addEventListener('resize', measureDetailLayout);
    window.visualViewport?.addEventListener('resize', measureDetailLayout);
    window.visualViewport?.addEventListener('scroll', measureDetailLayout);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measureDetailLayout);
      window.visualViewport?.removeEventListener('resize', measureDetailLayout);
      window.visualViewport?.removeEventListener('scroll', measureDetailLayout);
    };
  }, [groupId, measureDetailLayout]);

  useEffect(() => {
    if (!groupId || publicRoom.isMessageFeedPending) return;
    const latestLoadedMessageId =
      publicRoom.messages[publicRoom.messages.length - 1]?.messageId || publicRoom.messagesCount;
    markGroupRead(groupId, latestLoadedMessageId);
    onReadLatest?.(groupId, latestLoadedMessageId);
  }, [groupId, markGroupRead, onReadLatest, publicRoom.isMessageFeedPending, publicRoom.messages, publicRoom.messagesCount]);

  useEffect(() => {
    if (
      !groupId ||
      publicRoom.isMessageFeedPending ||
      (syncState.messagesCount === undefined && syncState.latestMessageId === undefined) ||
      publicRoom.messagesCount === undefined ||
      (syncState.messagesCount || syncState.latestMessageId || BigInt(0)) <= publicRoom.messagesCount
    ) {
      return;
    }
    const latestKey = (syncState.latestMessageId || syncState.messagesCount)?.toString();
    if (latestKey && lastRefetchedSyncMessageIdRef.current === latestKey) return;
    lastRefetchedSyncMessageIdRef.current = latestKey;
    publicRoom.refetch();
  }, [groupId, publicRoom, syncState.latestMessageId, syncState.messagesCount]);

  useBrowserLayoutEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;
    if (restoreScrollAfterPrependRef.current) {
      if (publicRoom.isMessageFeedPending) return;
      stopBottomResizeObserver();
      const previousScrollHeight = previousScrollHeightRef.current;
      restoreScrollAfterPrependRef.current = false;
      previousScrollHeightRef.current = 0;
      requestAnimationFrame(() => {
        const nextScrollHeight = messageList.scrollHeight;
        messageList.scrollTop += Math.max(0, nextScrollHeight - previousScrollHeight);
      });
      lastAutoScrollGroupIdRef.current = groupId?.toString();
      lastAutoScrollLatestMessageIdRef.current = latestVisibleMessageId;
      return;
    }
    if (publicRoom.isMessageFeedPending) return;

    const groupKey = groupId?.toString();
    const groupChanged = lastAutoScrollGroupIdRef.current !== groupKey;
    const latestChanged =
      latestVisibleMessageId !== undefined &&
      lastAutoScrollLatestMessageIdRef.current !== latestVisibleMessageId;
    if (!groupChanged && !latestChanged) return;

    keepMessageListAtBottomWhileLayoutSettles();
    lastAutoScrollGroupIdRef.current = groupKey;
    lastAutoScrollLatestMessageIdRef.current = latestVisibleMessageId;
  }, [
    groupId,
    keepMessageListAtBottomWhileLayoutSettles,
    latestVisibleMessageId,
    publicRoom.isMessageFeedPending,
    stopBottomResizeObserver,
  ]);

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList || composerHeight <= 0) return;
    if (restoreScrollAfterPrependRef.current || publicRoom.isPending || accountRoom.isPending) return;

    const distanceFromBottom = messageList.scrollHeight - messageList.clientHeight - messageList.scrollTop;
    if (distanceFromBottom <= composerHeight + 80) {
      scrollMessageListToBottom();
    }
  }, [accountRoom.isPending, composerHeight, publicRoom.isPending, scrollMessageListToBottom]);

  const loadEarlierMessages = () => {
    if (!hasMoreMessages || publicRoom.isPending || accountRoom.isPending) return;
    const messageList = messageListRef.current;
    previousScrollHeightRef.current = messageList?.scrollHeight || 0;
    restoreScrollAfterPrependRef.current = true;
    setMessageWindowSize((current) => {
      const total = effectiveMessagesCount ? Number(effectiveMessagesCount) : current + MESSAGE_PAGE_SIZE;
      return Math.min(total, current + MESSAGE_PAGE_SIZE);
    });
  };

  const addMention = (senderId: bigint) => {
    const key = senderId.toString();
    const token = `@${publicRoom.senderNames[key] || `NFT #${key}`}`;
    const alreadySelected = mentionedSenderIds.some((id) => id.toString() === key);
    if (!alreadySelected && mentionedSenderIds.length >= MAX_MENTIONED_SENDER_IDS) {
      toast.error(`最多提及 ${MAX_MENTIONED_SENDER_IDS} 个 NFT 身份`);
      return;
    }
    setContent((prev) => {
      if (prev.includes(token)) return prev;
      const trimmedEnd = /\s$/.test(prev) || prev.length === 0 ? prev : `${prev} `;
      return `${trimmedEnd}${token} `;
    });
    if (alreadySelected) {
      toast('已在提及列表中');
      return;
    }
    setMentionedSenderIds((prev) => [...prev, senderId]);
  };

  const copyMessage = async (message: ParsedGroupChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success('已复制消息');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = message.content;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      copied ? toast.success('已复制消息') : toast.error('复制失败');
    }
  };

  const onSend = async () => {
    if (!groupId) return;
    const trimmed = content.trim();
    if (!trimmed) return;
    if (!composerState.activeSenderId) {
      toast.error('请先设置默认 NFT 身份。');
      return;
    }
    if (!composerState.activeCanPost) {
      toast.error(formatCanPostReason(composerState.activeCanPostReasonCode) || '当前 NFT 身份没有发言资格。');
      return;
    }
    const finalMentionAll = composerState.draftMentions.mentionAll;
    if (composerState.draftMentions.invalidSenderIds.length > 0) {
      toast.error('mentionedSenderIds 必须是大于 0 的 NFT ID。');
      return;
    }
    if (composerState.draftMentions.overLimitCount > 0) {
      toast.error(
        `mentionedSenderIds 最多 ${composerState.maxMentionedSenderIds} 个，当前 ${composerState.draftMentions.mentionedSenderIds.length} 个；请删除 ${composerState.draftMentions.overLimitCount} 个 @ 后再发送。`,
      );
      return;
    }
    if (finalMentionAll) {
      if (mentionAllPermission.isPending) {
        toast('正在读取 @全部 权限');
        return;
      }
      if (!mentionAllPermission.canMentionAll) {
        toast.error('只有群 owner、delegate 或 GroupAdmin 管理员 NFT 可以发送 @全部。');
        return;
      }
    }
    try {
      await postAsDefaultSender(
        groupId,
        trimmed,
        composerState.draftMentions.mentionedSenderIds,
        finalMentionAll,
        quotedMessage?.messageId || BigInt(0),
      );
    } catch (error) {
      console.error(error);
    }
  };

  if (!groupId) {
    return (
      <section className="hidden min-h-[420px] items-center justify-center rounded-md border border-greyscale-200 bg-white p-6 text-center text-sm text-greyscale-500 md:flex">
        选择一个群聊开始查看链上消息
      </section>
    );
  }

  const managerOwned = isManagerOwnedChat(publicRoom.chatInfo?.owner);
  const displayGroupName =
    managedTitle.title ||
    title ||
    (!managerOwned && !managedTitle.isPending ? publicRoom.groupName : '') ||
    (groupId ? `群聊 #${groupId.toString()}` : '群聊');
  const defaultNftHref = tokenSymbol
    ? `/group/groupids/?symbol=${encodeURIComponent(tokenSymbol)}`
    : '/group/groupids/';

  return (
    <section
      className="chat-room-shell flex min-h-0 flex-1 flex-col bg-white"
      style={{
        '--detail-composer-height': `${composerHeight || 128}px`,
        '--detail-bottom-nav-height': `${bottomNavHeight}px`,
        ...(messageListHeight ? { '--detail-message-list-height': `${messageListHeight}px` } : {}),
      } as CSSProperties}
    >
      <ChatRoomToolbar
        groupId={groupId}
        title={displayGroupName}
        messagesCount={effectiveMessagesCount}
        menuOpen={menuOpen}
        isPinned={isPinned}
        onToggleMenu={() => setMenuOpen((value) => !value)}
        onCloseMenu={closeMenu}
        onTogglePin={onTogglePin}
        onOpenPanel={onOpenPanel}
      />

      <ChatMessageList
        account={account}
        room={displayedRoom}
        groupId={groupId}
        messageListRef={messageListRef}
        hasMoreMessages={hasMoreMessages}
        visibleMessages={visibleMessages}
        messageById={messageById}
        activeMenuMessageId={activeMenuMessageId}
        canUseMessageAdminBan={activeAdminBanSource}
        messageAdminCanOperate={canManageMessageAdminBan}
        canUseMessageGovBan={activeGovBanSource}
        canVoteMessageGovBan={canVoteMessageGovBan}
        showMessageTimes={showMessageTimes}
        onLoadEarlierMessages={loadEarlierMessages}
        onOpenMessageMenu={(messageId) => {
          setActiveMenuMessageId((value) => (value === messageId ? undefined : messageId));
        }}
        onMentionSender={(message) => {
          addMention(message.senderId);
          setActiveMenuMessageId(undefined);
        }}
        onCopyMessage={copyMessage}
        onQuoteMessage={setQuotedMessage}
        onOpenBanSettings={(message) => {
          setActiveMenuMessageId(undefined);
          onOpenBanSettings(message);
        }}
      />

      <ChatComposer
        ref={composerRef}
        account={account}
        postingAllowed={publicRoom.chatInfo?.postingAllowed}
        activeSenderId={composerState.activeSenderId}
        activeSenderName={composerState.activeSenderName}
        activeCanPost={composerState.activeCanPost}
        activeCanPostReasonCode={composerState.activeCanPostReasonCode}
        activeCanPostPending={accountRoom.isPending}
        isDefaultSenderPending={accountRoom.isDefaultSenderPending}
        needsDefaultSenderSetup={composerState.needsDefaultSenderSetup}
        defaultNftHref={defaultNftHref}
        content={content}
        quotedMessage={quotedMessage}
        mentionValidationHint={composerState.mentionValidationHint}
        mentionValidationBlocking={composerState.mentionValidationBlocking}
        sendDisabled={composerState.sendDisabled}
        isPending={isPending}
        isConfirming={isConfirming}
        onContentChange={setContent}
        onSend={onSend}
        onClearQuote={() => setQuotedMessage(undefined)}
      />
    </section>
  );
}
