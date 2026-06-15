'use client';

import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

import { useGroupChatSyncState, useMarkGroupRead, useRegisterActiveChat } from '@/src/contexts/GroupChatSyncContext';
import { useGroupChatVotingPower } from '@/src/hooks/contracts/useGroupChatManagers';
import {
  useGroupChatCurrentRound,
  usePostAsDefaultSender,
} from '@/src/hooks/contracts/useGroupChat';
import {
  GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS,
  GROUP_CHAT_GOV_VOTED_BAN_SOURCE_ADDRESS,
  isAdminBanSourceEnabled,
  isGovVotedBanSourceEnabled,
  useGroupAdminOperatorPermission,
  useGroupMentionAllPermission,
} from '@/src/hooks/contracts/useGroupChatModeration';
import {
  useGroupChatManagedTitle,
  useGroupChatAccountData,
  useGroupChatMentionAllData,
  useGroupChatPublicData,
  type ParsedGroupChatMessage,
} from '@/src/hooks/composite/useGroupChatData';
import { ChatComposer } from './ChatComposer';
import { ChatMessageList } from './ChatMessageList';
import { ChatMessageText } from './ChatMessageText';
import { GroupChatToolbar } from './GroupChatToolbar';
import {
  DEFAULT_MESSAGE_WINDOW_SIZE,
  MENTION_ALL_READ_CURSORS_CHANGED_EVENT,
  MAX_MENTIONED_SENDER_IDS,
  MESSAGE_PAGE_SIZE,
} from './chatConstants';
import {
  readMentionAllReadCursors,
  writeMentionAllReadCursor,
} from './chatStorage';
import type { ChatWorkspaceView } from './chatTypes';
import {
  addMentionAllToken,
  buildGroupChatMentionAllHref,
  formatMessageTime,
  hasMentionAllToken,
  isManagerOwnedChat,
  quotedMessageSummary,
  removeMentionAllTokens,
  sameAddress,
  safeBigIntFromString,
} from './chatUtils';
import { useChatComposerState } from './useChatComposerState';
import { useConfirmedTransactionEffect } from './useConfirmedTransactionEffect';

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function GroupChatPanel({
  groupId,
  account,
  title,
  showBannedMessages,
  showMessageTimes,
  tokenAddress,
  tokenSymbol,
  onPosted,
  onOpenPanel,
  onOpenBanSettings,
  onOpenMessageDetail,
  onReadLatest,
}: {
  groupId: bigint | undefined;
  account: `0x${string}` | undefined;
  title?: string;
  showBannedMessages: boolean;
  showMessageTimes: boolean;
  tokenAddress?: `0x${string}`;
  tokenSymbol?: string;
  onPosted: () => void;
  onOpenPanel: (view: ChatWorkspaceView) => void;
  onOpenBanSettings: (message: ParsedGroupChatMessage) => void;
  onOpenMessageDetail: (message: ParsedGroupChatMessage) => void;
  onReadLatest?: (groupId: bigint, latestMessageId: bigint | undefined) => void;
}) {
  const [content, setContent] = useState('');
  const [quotedMessage, setQuotedMessage] = useState<ParsedGroupChatMessage | undefined>();
  const [mentionedSenderIds, setMentionedSenderIds] = useState<bigint[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | undefined>();
  const [messageWindowSize, setMessageWindowSize] = useState(DEFAULT_MESSAGE_WINDOW_SIZE);
  const [isLoadingEarlierMessages, setIsLoadingEarlierMessages] = useState(false);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLElement | null>(null);
  const restoreScrollAfterPrependRef = useRef(false);
  const previousScrollHeightRef = useRef(0);
  const loadEarlierTargetSizeRef = useRef<number | undefined>();
  const lastAutoScrollGroupIdRef = useRef<string | undefined>();
  const lastAutoScrollLatestMessageIdRef = useRef<string | undefined>();
  const lastRefetchedSyncMessageIdRef = useRef<string | undefined>();
  const bottomResizeObserverRef = useRef<ResizeObserver | undefined>();
  const bottomResizeFrameRef = useRef<number | undefined>();
  const [composerHeight, setComposerHeight] = useState(0);
  const [messageListHeight, setMessageListHeight] = useState<number | undefined>();
  const [mentionAllReadCursors, setMentionAllReadCursors] = useState<Record<string, string>>({});
  useRegisterActiveChat(groupId);
  const markGroupRead = useMarkGroupRead();
  const syncState = useGroupChatSyncState(groupId);
  const publicData = useGroupChatPublicData(groupId, messageWindowSize);
  const accountData = useGroupChatAccountData(groupId, account, publicData.senderNames);
  const { currentRound, isPending: isCurrentRoundPending } = useGroupChatCurrentRound();
  const managedTitle = useGroupChatManagedTitle(
    groupId,
    tokenAddress && tokenSymbol ? { address: tokenAddress, symbol: tokenSymbol } : undefined,
  );
  const activeGovBanSource =
    isGovVotedBanSourceEnabled && sameAddress(publicData.chatInfo?.banSource, GROUP_CHAT_GOV_VOTED_BAN_SOURCE_ADDRESS);
  const activeAdminBanSource =
    isAdminBanSourceEnabled && sameAddress(publicData.chatInfo?.banSource, GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS);
  const messageGovVotingPower = useGroupChatVotingPower(
    groupId,
    publicData.chatInfo?.owner,
    account,
    activeGovBanSource,
  );
  const canVoteMessageGovBan = activeGovBanSource && messageGovVotingPower.voteWeight > BigInt(0);
  const postTx = usePostAsDefaultSender();
  const { postAsDefaultSender, isPending, isConfirming } = postTx;
  const mentionAllPermission = useGroupMentionAllPermission(groupId, account);
  const messageAdminPermission = useGroupAdminOperatorPermission(groupId, account, activeAdminBanSource);
  const canManageMessageAdminBan = activeAdminBanSource && messageAdminPermission.canOperate;
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    setContent('');
    setQuotedMessage(undefined);
    setMentionedSenderIds([]);
    setActiveMenuMessageId(undefined);
    setMessageWindowSize(DEFAULT_MESSAGE_WINDOW_SIZE);
    setIsLoadingEarlierMessages(false);
    restoreScrollAfterPrependRef.current = false;
    previousScrollHeightRef.current = 0;
    loadEarlierTargetSizeRef.current = undefined;
    lastAutoScrollGroupIdRef.current = undefined;
    lastAutoScrollLatestMessageIdRef.current = undefined;
    lastRefetchedSyncMessageIdRef.current = undefined;
    setComposerHeight(0);
    setMessageListHeight(undefined);
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

  const keepActiveMessageMenuVisible = useCallback((messageId: string | undefined) => {
    if (!messageId) return;
    const messageList = messageListRef.current;
    if (!messageList) return;

    const scrollIntoView = () => {
      const actions = messageList.querySelector(
        `[data-message-actions-id="${messageId}"]`,
      ) as HTMLElement | null;
      if (!actions) return;

      const listRect = messageList.getBoundingClientRect();
      const actionsRect = actions.getBoundingClientRect();
      const bottomPadding = 12;
      const topPadding = 8;
      const hiddenBelow = actionsRect.bottom - (listRect.bottom - bottomPadding);
      const hiddenAbove = listRect.top + topPadding - actionsRect.top;

      if (hiddenBelow > 0) {
        messageList.scrollTop += hiddenBelow;
      } else if (hiddenAbove > 0) {
        messageList.scrollTop -= hiddenAbove;
      }
    };

    requestAnimationFrame(() => {
      scrollIntoView();
      requestAnimationFrame(scrollIntoView);
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

  useConfirmedTransactionEffect(postTx, () => {
    setContent('');
    setQuotedMessage(undefined);
    setMentionedSenderIds([]);
    toast.success('已发送');
    publicData.refetch();
    accountData.refetch();
    onPosted();
  });

  const composerState = useChatComposerState({
    groupId,
    account,
    publicData,
    accountData,
    content,
    mentionedSenderIds,
    isPending,
    isConfirming,
  });
  const messageById = useMemo(() => {
    const map: Record<string, ParsedGroupChatMessage> = {};
    publicData.messages.forEach((message) => {
      map[message.messageId.toString()] = message;
    });
    Object.entries(publicData.quotedMessages).forEach(([messageId, message]) => {
      map[messageId] = message;
    });
    return map;
  }, [publicData.messages, publicData.quotedMessages]);
  const effectiveMessagesCount =
    syncState.messagesCount && (!publicData.messagesCount || syncState.messagesCount > publicData.messagesCount)
      ? syncState.messagesCount
      : publicData.messagesCount;
  const visibleMessages = useMemo(
    () => publicData.messages.filter((message) => showBannedMessages || !publicData.bannedMessageIds[message.messageId.toString()]),
    [publicData.bannedMessageIds, publicData.messages, showBannedMessages],
  );
  const latestVisibleMessageId = visibleMessages[visibleMessages.length - 1]?.messageId.toString();
  const latestMentionAll = useGroupChatMentionAllData(groupId, BigInt(0), BigInt(1), true);
  const latestMentionAllMessage = latestMentionAll.messages[0];
  const latestMentionAllMessageId = latestMentionAllMessage?.messageId;
  const mentionAllReadCursor = safeBigIntFromString(groupId ? mentionAllReadCursors[groupId.toString()] : undefined);
  const mentionAllUnread =
    latestMentionAllMessageId !== undefined && latestMentionAllMessageId > mentionAllReadCursor;
  const hasMoreMessages =
    effectiveMessagesCount !== undefined && BigInt(publicData.messages.length) < effectiveMessagesCount;
  const displayedData = useMemo(
    () => ({
      ...publicData,
      messagesCount: effectiveMessagesCount,
      messages: publicData.messages,
    }),
    [effectiveMessagesCount, publicData],
  );

  const measureDetailLayout = useCallback(() => {
    const messageList = messageListRef.current;
    const composer = composerRef.current;
    if (!messageList || !composer) return;

    const composerRect = composer.getBoundingClientRect();
    const nextComposerHeight = Math.ceil(composerRect.height);
    const nextMessageListHeight = Math.max(
      120,
      Math.floor(composerRect.top - messageList.getBoundingClientRect().top),
    );

    setComposerHeight((current) => (current === nextComposerHeight ? current : nextComposerHeight));
    setMessageListHeight((current) => (current === nextMessageListHeight ? current : nextMessageListHeight));
  }, []);

  useBrowserLayoutEffect(() => {
    measureDetailLayout();
    let frame2: number | undefined;
    const frame1 = requestAnimationFrame(() => {
      measureDetailLayout();
      frame2 = requestAnimationFrame(measureDetailLayout);
    });

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? undefined
      : new ResizeObserver(measureDetailLayout);
    if (composerRef.current) resizeObserver?.observe(composerRef.current);
    if (messageListRef.current) resizeObserver?.observe(messageListRef.current);

    window.addEventListener('resize', measureDetailLayout);
    window.visualViewport?.addEventListener('resize', measureDetailLayout);
    window.visualViewport?.addEventListener('scroll', measureDetailLayout);

    return () => {
      cancelAnimationFrame(frame1);
      if (frame2 !== undefined) cancelAnimationFrame(frame2);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measureDetailLayout);
      window.visualViewport?.removeEventListener('resize', measureDetailLayout);
      window.visualViewport?.removeEventListener('scroll', measureDetailLayout);
    };
  }, [groupId, measureDetailLayout]);

  useEffect(() => {
    if (!groupId || publicData.isMessageFeedFetching) return;
    const latestLoadedMessageId =
      publicData.messages[publicData.messages.length - 1]?.messageId || publicData.messagesCount;
    markGroupRead(groupId, latestLoadedMessageId);
    onReadLatest?.(groupId, latestLoadedMessageId);
  }, [groupId, markGroupRead, onReadLatest, publicData.isMessageFeedFetching, publicData.messages, publicData.messagesCount]);

  useEffect(() => {
    const refreshMentionAllReadCursors = () => {
      setMentionAllReadCursors(readMentionAllReadCursors(account));
    };
    refreshMentionAllReadCursors();
    window.addEventListener(MENTION_ALL_READ_CURSORS_CHANGED_EVENT, refreshMentionAllReadCursors);
    window.addEventListener('storage', refreshMentionAllReadCursors);
    window.addEventListener('focus', refreshMentionAllReadCursors);
    return () => {
      window.removeEventListener(MENTION_ALL_READ_CURSORS_CHANGED_EVENT, refreshMentionAllReadCursors);
      window.removeEventListener('storage', refreshMentionAllReadCursors);
      window.removeEventListener('focus', refreshMentionAllReadCursors);
    };
  }, [account]);

  const markLatestMentionAllRead = useCallback(() => {
    writeMentionAllReadCursor(account, groupId, latestMentionAllMessageId);
  }, [account, groupId, latestMentionAllMessageId]);

  useEffect(() => {
    if (
      !groupId ||
      publicData.isMessageFeedFetching ||
      (syncState.messagesCount === undefined && syncState.latestMessageId === undefined) ||
      publicData.messagesCount === undefined ||
      (syncState.messagesCount || syncState.latestMessageId || BigInt(0)) <= publicData.messagesCount
    ) {
      return;
    }
    const latestKey = (syncState.latestMessageId || syncState.messagesCount)?.toString();
    if (latestKey && lastRefetchedSyncMessageIdRef.current === latestKey) return;
    lastRefetchedSyncMessageIdRef.current = latestKey;
    publicData.refetch();
  }, [groupId, publicData, syncState.latestMessageId, syncState.messagesCount]);

  useEffect(() => {
    if (!isLoadingEarlierMessages || publicData.isMessageFeedFetching) return;
    const targetSize = loadEarlierTargetSizeRef.current;
    if (targetSize !== undefined && messageWindowSize < targetSize) return;
    loadEarlierTargetSizeRef.current = undefined;
    setIsLoadingEarlierMessages(false);
  }, [isLoadingEarlierMessages, messageWindowSize, publicData.isMessageFeedFetching]);

  useBrowserLayoutEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;
    if (restoreScrollAfterPrependRef.current) {
      if (publicData.isMessageFeedFetching) return;
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
    if (publicData.isMessageFeedFetching) return;

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
    publicData.isMessageFeedFetching,
    stopBottomResizeObserver,
  ]);

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList || composerHeight <= 0) return;
    if (restoreScrollAfterPrependRef.current || publicData.isPending || accountData.isPending) return;

    const distanceFromBottom = messageList.scrollHeight - messageList.clientHeight - messageList.scrollTop;
    if (distanceFromBottom <= composerHeight + 80) {
      scrollMessageListToBottom();
    }
  }, [accountData.isPending, composerHeight, publicData.isPending, scrollMessageListToBottom]);

  useBrowserLayoutEffect(() => {
    keepActiveMessageMenuVisible(activeMenuMessageId);
  }, [activeMenuMessageId, keepActiveMessageMenuVisible, messageListHeight]);

  const loadEarlierMessages = () => {
    if (!hasMoreMessages || publicData.isMessageFeedFetching || accountData.isPending) return;
    const total = effectiveMessagesCount ? Number(effectiveMessagesCount) : messageWindowSize + MESSAGE_PAGE_SIZE;
    const nextWindowSize = Math.min(total, messageWindowSize + MESSAGE_PAGE_SIZE);
    if (nextWindowSize <= messageWindowSize) return;
    const messageList = messageListRef.current;
    previousScrollHeightRef.current = messageList?.scrollHeight || 0;
    restoreScrollAfterPrependRef.current = true;
    loadEarlierTargetSizeRef.current = nextWindowSize;
    setIsLoadingEarlierMessages(true);
    setMessageWindowSize(nextWindowSize);
  };

  const addMention = (senderId: bigint) => {
    const key = senderId.toString();
    const token = `@${publicData.senderNames[key] || `NFT #${key}`}`;
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

  const toggleMentionAll = () => {
    setContent((prev) =>
      hasMentionAllToken(prev)
        ? removeMentionAllTokens(prev)
        : addMentionAllToken(prev),
    );
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
      toast.error(
        composerState.sendAvailability.canSend
          ? '当前 NFT 身份没有发言资格。'
          : composerState.sendAvailability.message,
      );
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
        toast('正在读取 @所有人权限');
        return;
      }
      if (!mentionAllPermission.canMentionAll) {
        toast.error('只有群 owner、delegate 或 GroupAdmin 管理员 NFT 可以发送 @所有人。');
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

  const managerOwned = isManagerOwnedChat(publicData.chatInfo?.owner);
  const displayGroupName =
    managedTitle.title ||
    title ||
    (!managerOwned && !managedTitle.isPending ? publicData.groupName : '') ||
    (groupId ? `群聊 #${groupId.toString()}` : '群聊');

  return (
    <section
      className="group-chat-shell flex min-h-0 flex-1 flex-col bg-white"
      style={{
        '--detail-composer-height': `${composerHeight || 128}px`,
        ...(messageListHeight ? { '--detail-message-list-height': `${messageListHeight}px` } : {}),
      } as CSSProperties}
    >
      <GroupChatToolbar
        groupId={groupId}
        title={displayGroupName}
        messagesCount={effectiveMessagesCount}
        currentRound={currentRound}
        isCurrentRoundPending={isCurrentRoundPending}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((value) => !value)}
        onCloseMenu={closeMenu}
        onOpenPanel={onOpenPanel}
      />

      <MentionAllSummary
        message={latestMentionAllMessage}
        href={buildGroupChatMentionAllHref(groupId)}
        unread={mentionAllUnread}
        onOpen={markLatestMentionAllRead}
      />

      <ChatMessageList
        account={account}
        currentSenderId={composerState.activeSenderId}
        data={displayedData}
        groupId={groupId}
        messageListRef={messageListRef}
        hasMoreMessages={hasMoreMessages}
        isLoadingEarlierMessages={isLoadingEarlierMessages}
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
          setActiveMenuMessageId((value) => {
            const nextMessageId = value === messageId ? undefined : messageId;
            keepActiveMessageMenuVisible(nextMessageId);
            return nextMessageId;
          });
        }}
        onMentionSender={(message) => {
          addMention(message.senderId);
          setActiveMenuMessageId(undefined);
        }}
        onCopyMessage={copyMessage}
        onQuoteMessage={setQuotedMessage}
        onOpenMessageDetail={(message) => {
          setActiveMenuMessageId(undefined);
          onOpenMessageDetail(message);
        }}
        onOpenBanSettings={(message) => {
          setActiveMenuMessageId(undefined);
          onOpenBanSettings(message);
        }}
      />

      <ChatComposer
        ref={composerRef}
        activeSenderId={composerState.activeSenderId}
        activeSenderName={composerState.activeSenderName}
        activeCanPost={composerState.activeCanPost}
        sendAvailability={composerState.sendAvailability}
        content={content}
        quotedMessage={quotedMessage}
        mentionValidationHint={composerState.mentionValidationHint}
        mentionValidationBlocking={composerState.mentionValidationBlocking}
        mentionAllActive={composerState.draftMentions.mentionAll}
        mentionAllDisabled={mentionAllPermission.isPending || !mentionAllPermission.canMentionAll}
        sendDisabled={composerState.sendDisabled}
        isPending={isPending}
        isConfirming={isConfirming}
        onContentChange={setContent}
        onToggleMentionAll={toggleMentionAll}
        onSend={onSend}
        onClearQuote={() => setQuotedMessage(undefined)}
      />
    </section>
  );
}

function MentionAllSummary({
  message,
  href,
  unread,
  onOpen,
}: {
  message: ParsedGroupChatMessage | undefined;
  href: string;
  unread: boolean;
  onOpen: () => void;
}) {
  const router = useRouter();
  const sourceContent = message
    ? removeMentionAllTokens(message.content).trim() || message.content
    : '';
  const content = message
    ? quotedMessageSummary({ content: sourceContent }, 72)
    : '';
  const timeLabel = formatMessageTime(message?.timestamp);

  if (!message) return null;

  const body = (
    <>
      <div className="mention-all-summary-main">
        <div className="mention-all-summary-meta">
          <span className="mention-all-summary-label">全员通知</span>
          {timeLabel && <span>{timeLabel}</span>}
        </div>
        <div className="mention-all-summary-content">
          <strong>
            <ChatMessageText content={content} sourceContent={sourceContent} />
          </strong>
        </div>
      </div>
      {unread && <span className="mention-all-summary-unread">未读</span>}
    </>
  );

  return (
    <div
      className={`mention-all-summary${unread ? ' mention-all-summary-is-unread' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={unread ? '查看未读全员通知' : '查看所有全员通知'}
      onClick={() => {
        onOpen();
        router.push(href);
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onOpen();
        router.push(href);
      }}
    >
      {body}
    </div>
  );
}
