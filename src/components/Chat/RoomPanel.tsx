'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { useGroupChatVotingPower } from '@/src/hooks/contracts/useGroupChatManagers';
import {
  usePostAsDefaultSender,
} from '@/src/hooks/contracts/useGroupChat';
import {
  GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS,
  GROUP_CHAT_GOV_VOTED_BAN_SOURCE_ADDRESS,
  useBanSenders,
  useGovClearVoteBySender,
  useGovVoteBySender,
  useGroupAdminOperatorPermission,
  useGroupMentionAllPermission,
  useUnbanSenders,
} from '@/src/hooks/contracts/useGroupChatModeration';
import {
  useGroupChatManagedTitle,
  useGroupChatRoomData,
  type ParsedGroupChatMessage,
} from '@/src/hooks/composite/useGroupChatData';
import { ChatComposer } from './ChatComposer';
import { ChatMessageList } from './ChatMessageList';
import { ChatRoomToolbar } from './ChatRoomToolbar';
import {
  DEFAULT_MESSAGE_WINDOW_SIZE,
  LONG_PRESS_MOVE_TOLERANCE,
  LONG_PRESS_MS,
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
import { useConfirmedTransactionEffect } from './useConfirmedTransactionEffect';

export function RoomPanel({
  groupId,
  account,
  title,
  isPinned,
  showBlacklistedMessages,
  showMessageTimes,
  tokenAddress,
  tokenSymbol,
  onPosted,
  onOpenPanel,
  onTogglePin,
}: {
  groupId: bigint | undefined;
  account: `0x${string}` | undefined;
  title?: string;
  isPinned: boolean;
  showBlacklistedMessages: boolean;
  showMessageTimes: boolean;
  tokenAddress?: `0x${string}`;
  tokenSymbol?: string;
  onPosted: () => void;
  onOpenPanel: (view: ChatWorkspaceView) => void;
  onTogglePin: (groupId: bigint) => void;
}) {
  const [content, setContent] = useState('');
  const [quotedMessage, setQuotedMessage] = useState<ParsedGroupChatMessage | undefined>();
  const [mentionedSenderIds, setMentionedSenderIds] = useState<bigint[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | undefined>();
  const [activeAvatarMessageId, setActiveAvatarMessageId] = useState<string | undefined>();
  const [messageWindowSize, setMessageWindowSize] = useState(DEFAULT_MESSAGE_WINDOW_SIZE);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const restoreScrollAfterPrependRef = useRef(false);
  const previousScrollHeightRef = useRef(0);
  const lastAutoScrollGroupIdRef = useRef<string | undefined>();
  const lastAutoScrollLatestMessageIdRef = useRef<string | undefined>();
  const avatarPressRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  const suppressAvatarClickRef = useRef(false);
  const room = useGroupChatRoomData(groupId, account, messageWindowSize);
  const managedTitle = useGroupChatManagedTitle(
    groupId,
    tokenAddress && tokenSymbol ? { address: tokenAddress, symbol: tokenSymbol } : undefined,
  );
  const activeGovBanSource = sameAddress(room.chatInfo?.banSource, GROUP_CHAT_GOV_VOTED_BAN_SOURCE_ADDRESS);
  const activeAdminBanSource = sameAddress(room.chatInfo?.banSource, GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS);
  const messageGovVotingPower = useGroupChatVotingPower(
    groupId,
    room.chatInfo?.owner,
    account,
    activeGovBanSource,
  );
  const canVoteMessageGovBan = activeGovBanSource && messageGovVotingPower.voteWeight > BigInt(0);
  const { postAsDefaultSender, isPending, isConfirming, isConfirmed } = usePostAsDefaultSender();
  const mentionAllPermission = useGroupMentionAllPermission(groupId, account);
  const messageAdminPermission = useGroupAdminOperatorPermission(groupId, account, activeAdminBanSource);
  const canManageMessageAdminBan = activeAdminBanSource && messageAdminPermission.canOperate;
  const banSenderTx = useBanSenders();
  const unbanSenderTx = useUnbanSenders();
  const voteSenderTx = useGovVoteBySender();
  const clearSenderVoteTx = useGovClearVoteBySender();
  const postedHandledRef = useRef(false);
  const refetchRoomAfterModeration = useCallback(() => {
    room.refetch();
    onPosted();
  }, [onPosted, room]);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useConfirmedTransactionEffect(banSenderTx, refetchRoomAfterModeration);
  useConfirmedTransactionEffect(unbanSenderTx, refetchRoomAfterModeration);
  useConfirmedTransactionEffect(voteSenderTx, refetchRoomAfterModeration);
  useConfirmedTransactionEffect(clearSenderVoteTx, refetchRoomAfterModeration);

  useEffect(() => {
    setContent('');
    setQuotedMessage(undefined);
    setMentionedSenderIds([]);
    setActiveMenuMessageId(undefined);
    setActiveAvatarMessageId(undefined);
    setMessageWindowSize(DEFAULT_MESSAGE_WINDOW_SIZE);
    restoreScrollAfterPrependRef.current = false;
    previousScrollHeightRef.current = 0;
    lastAutoScrollGroupIdRef.current = undefined;
    lastAutoScrollLatestMessageIdRef.current = undefined;
  }, [groupId]);

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
      room.refetch();
      onPosted();
    }
  }, [isConfirmed, onPosted, room]);

  const clearAvatarPress = useCallback(() => {
    if (avatarPressRef.current) clearTimeout(avatarPressRef.current.timer);
    avatarPressRef.current = null;
  }, []);

  useEffect(() => clearAvatarPress, [clearAvatarPress]);

  const composerState = useChatComposerState({
    groupId,
    account,
    room,
    content,
    mentionedSenderIds,
    isPending,
    isConfirming,
  });
  const messageById = useMemo(() => {
    const map: Record<string, ParsedGroupChatMessage> = {};
    room.messages.forEach((message) => {
      map[message.messageId.toString()] = message;
    });
    Object.entries(room.quotedMessages).forEach(([messageId, message]) => {
      map[messageId] = message;
    });
    return map;
  }, [room.messages, room.quotedMessages]);
  const visibleMessages = useMemo(
    () => room.messages.filter((message) => showBlacklistedMessages || !room.bannedMessageIds[message.messageId.toString()]),
    [room.bannedMessageIds, room.messages, showBlacklistedMessages],
  );
  const latestVisibleMessageId = visibleMessages[visibleMessages.length - 1]?.messageId.toString();
  const hasMoreMessages =
    room.messagesCount !== undefined && BigInt(room.messages.length) < room.messagesCount;

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;
    if (restoreScrollAfterPrependRef.current) {
      if (room.isPending) return;
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
    if (room.isPending) return;

    const groupKey = groupId?.toString();
    const groupChanged = lastAutoScrollGroupIdRef.current !== groupKey;
    const latestChanged =
      latestVisibleMessageId !== undefined &&
      lastAutoScrollLatestMessageIdRef.current !== latestVisibleMessageId;
    if (!groupChanged && !latestChanged) return;

    requestAnimationFrame(() => {
      messageList.scrollTop = messageList.scrollHeight;
    });
    lastAutoScrollGroupIdRef.current = groupKey;
    lastAutoScrollLatestMessageIdRef.current = latestVisibleMessageId;
  }, [groupId, latestVisibleMessageId, room.isPending]);

  const loadEarlierMessages = () => {
    if (!hasMoreMessages || room.isPending) return;
    const messageList = messageListRef.current;
    previousScrollHeightRef.current = messageList?.scrollHeight || 0;
    restoreScrollAfterPrependRef.current = true;
    setMessageWindowSize((current) => {
      const total = room.messagesCount ? Number(room.messagesCount) : current + MESSAGE_PAGE_SIZE;
      return Math.min(total, current + MESSAGE_PAGE_SIZE);
    });
  };

  const addMention = (senderId: bigint) => {
    const key = senderId.toString();
    const token = `@${room.senderNames[key] || `NFT #${key}`}`;
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

  const startAvatarLongPress = (event: React.PointerEvent<HTMLButtonElement>, message: ParsedGroupChatMessage) => {
    if (event.button !== 0) return;
    clearAvatarPress();
    avatarPressRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      timer: setTimeout(() => {
        avatarPressRef.current = null;
        suppressAvatarClickRef.current = true;
        addMention(message.senderId);
      }, LONG_PRESS_MS),
    };
  };

  const cancelMovedAvatarPress = (event: React.PointerEvent<HTMLButtonElement>) => {
    const press = avatarPressRef.current;
    if (!press || event.pointerId !== press.pointerId) return;
    const moved =
      Math.abs(event.clientX - press.x) > LONG_PRESS_MOVE_TOLERANCE ||
      Math.abs(event.clientY - press.y) > LONG_PRESS_MOVE_TOLERANCE;
    if (moved) clearAvatarPress();
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

  const banMessageSender = async (message: ParsedGroupChatMessage) => {
    if (!groupId) return;
    if (!canManageMessageAdminBan) {
      toast.error('当前地址没有 AdminBanSource 管理权限。');
      return;
    }
    try {
      await banSenderTx.banBySenders(groupId, [message.senderId], [message.senderAddress]);
      toast.success('已提交拉黑 sender');
      setActiveMenuMessageId(undefined);
      setActiveAvatarMessageId(undefined);
    } catch (error) {
      console.error(error);
    }
  };

  const unbanMessageSender = async (message: ParsedGroupChatMessage) => {
    if (!groupId) return;
    if (!canManageMessageAdminBan) {
      toast.error('当前地址没有 AdminBanSource 管理权限。');
      return;
    }
    try {
      await unbanSenderTx.unbanBySenders(groupId, [message.senderId], [message.senderAddress]);
      toast.success('已提交解除 sender 黑名单');
      setActiveMenuMessageId(undefined);
      setActiveAvatarMessageId(undefined);
    } catch (error) {
      console.error(error);
    }
  };

  const voteMessageSender = async (message: ParsedGroupChatMessage, support: boolean) => {
    if (!groupId) return;
    if (!canVoteMessageGovBan) {
      toast.error('当前地址没有治理票权，只能查看和查询治理黑名单。');
      return;
    }
    try {
      await voteSenderTx.voteBySender(groupId, message.senderId, message.senderAddress, support);
      toast.success(support ? '已提交 sender 治理支持' : '已提交 sender 治理反对');
      setActiveMenuMessageId(undefined);
      setActiveAvatarMessageId(undefined);
    } catch (error) {
      console.error(error);
    }
  };

  const clearMessageSenderVote = async (message: ParsedGroupChatMessage) => {
    if (!groupId) return;
    if (!canVoteMessageGovBan) {
      toast.error('当前地址没有治理票权，只能查看和查询治理黑名单。');
      return;
    }
    try {
      await clearSenderVoteTx.clearVoteBySender(groupId, message.senderId, message.senderAddress);
      toast.success('已提交 sender 治理撤票');
      setActiveMenuMessageId(undefined);
      setActiveAvatarMessageId(undefined);
    } catch (error) {
      console.error(error);
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

  const managerOwned = isManagerOwnedChat(room.chatInfo?.owner);
  const displayGroupName =
    managedTitle.title ||
    title ||
    (!managerOwned && !managedTitle.isPending ? room.groupName : '') ||
    (groupId ? `群聊 #${groupId.toString()}` : '群聊');
  const defaultNftHref = tokenSymbol
    ? `/group/groupids/?symbol=${encodeURIComponent(tokenSymbol)}`
    : '/group/groupids/';

  return (
    <section className="chat-room-shell flex min-h-0 flex-1 flex-col bg-white">
      <ChatRoomToolbar
        groupId={groupId}
        title={displayGroupName}
        description={room.meta.description}
        messagesCount={room.messagesCount}
        menuOpen={menuOpen}
        isPinned={isPinned}
        onToggleMenu={() => setMenuOpen((value) => !value)}
        onCloseMenu={closeMenu}
        onTogglePin={onTogglePin}
        onOpenPanel={onOpenPanel}
      />

      <ChatMessageList
        account={account}
        room={room}
        groupId={groupId}
        messageListRef={messageListRef}
        hasMoreMessages={hasMoreMessages}
        visibleMessages={visibleMessages}
        messageById={messageById}
        activeAvatarMessageId={activeAvatarMessageId}
        activeMenuMessageId={activeMenuMessageId}
        canUseMessageAdminBan={activeAdminBanSource}
        messageAdminCanOperate={canManageMessageAdminBan}
        canUseMessageGovBan={activeGovBanSource}
        canVoteMessageGovBan={canVoteMessageGovBan}
        showMessageTimes={showMessageTimes}
        onLoadEarlierMessages={loadEarlierMessages}
        onOpenMessageMenu={(messageId) => {
          setActiveAvatarMessageId(undefined);
          setActiveMenuMessageId((value) => (value === messageId ? undefined : messageId));
        }}
        onToggleAvatarMenu={(messageId) => {
          if (suppressAvatarClickRef.current) {
            suppressAvatarClickRef.current = false;
            return;
          }
          setActiveMenuMessageId(undefined);
          setActiveAvatarMessageId((value) => (value === messageId ? undefined : messageId));
        }}
        onAvatarPointerDown={startAvatarLongPress}
        onAvatarPointerMove={cancelMovedAvatarPress}
        onAvatarPointerUp={clearAvatarPress}
        onCopyMessage={copyMessage}
        onQuoteMessage={setQuotedMessage}
        onBanMessageSender={banMessageSender}
        onUnbanMessageSender={unbanMessageSender}
        onVoteMessageSender={voteMessageSender}
        onClearMessageSenderVote={clearMessageSenderVote}
      />

      <ChatComposer
        account={account}
        postingAllowed={room.chatInfo?.postingAllowed}
        activeSenderId={composerState.activeSenderId}
        activeSenderName={composerState.activeSenderName}
        activeCanPost={composerState.activeCanPost}
        activeCanPostReasonCode={composerState.activeCanPostReasonCode}
        activeCanPostPending={composerState.activeCanPostQuery.isPending || room.isDefaultSenderPending}
        isDefaultSenderPending={room.isDefaultSenderPending}
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
