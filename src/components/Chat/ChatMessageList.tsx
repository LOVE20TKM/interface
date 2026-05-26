'use client';

import { Fragment } from 'react';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import type { ParsedGroupChatMessage } from '@/src/hooks/composite/useGroupChatData';
import { cn } from '@/lib/utils';
import {
  formatMessageDividerTime,
  formatMessageTime,
  messageTimestampMs,
  quotedMessageSummary,
  sameAddress,
  shouldRenderMessageTimeDivider,
} from './chatUtils';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function messageMentionTokens(message: ParsedGroupChatMessage, senderNames: Record<string, string>) {
  const tokens = new Set<string>();
  if (message.mentionAll) tokens.add('@全部');
  message.mentionedSenderIds.forEach((senderId) => {
    const key = senderId.toString();
    const name = senderNames[key];
    if (name) tokens.add(`@${name}`);
    tokens.add(`@NFT #${key}`);
  });
  return Array.from(tokens).sort((left, right) => right.length - left.length);
}

function renderMessageContent(message: ParsedGroupChatMessage, senderNames: Record<string, string>) {
  const tokens = messageMentionTokens(message, senderNames);
  if (tokens.length === 0) return message.content;
  const tokenSet = new Set(tokens);
  const parts = message.content.split(new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'g'));
  return parts.map((part, index) =>
    tokenSet.has(part) ? <span className="message-mention" key={`${part}-${index}`}>{part}</span> : part,
  );
}

export function ChatMessageList({
  account,
  room,
  groupId,
  messageListRef,
  hasMoreMessages,
  visibleMessages,
  messageById,
  activeAvatarMessageId,
  activeMenuMessageId,
  canUseMessageAdminBan,
  messageAdminCanOperate,
  canUseMessageGovBan,
  canVoteMessageGovBan,
  showMessageTimes,
  onLoadEarlierMessages,
  onOpenMessageMenu,
  onToggleAvatarMenu,
  onAvatarPointerDown,
  onAvatarPointerMove,
  onAvatarPointerUp,
  onCopyMessage,
  onQuoteMessage,
  onBanMessageSender,
  onUnbanMessageSender,
  onVoteMessageSender,
  onClearMessageSenderVote,
}: {
  account: `0x${string}` | undefined;
  room: ReturnType<typeof import('@/src/hooks/composite/useGroupChatData').useGroupChatRoomData>;
  groupId: bigint;
  messageListRef: React.RefObject<HTMLDivElement>;
  hasMoreMessages: boolean;
  visibleMessages: ParsedGroupChatMessage[];
  messageById: Record<string, ParsedGroupChatMessage>;
  activeAvatarMessageId: string | undefined;
  activeMenuMessageId: string | undefined;
  canUseMessageAdminBan: boolean;
  messageAdminCanOperate: boolean;
  canUseMessageGovBan: boolean;
  canVoteMessageGovBan: boolean;
  showMessageTimes: boolean;
  onLoadEarlierMessages: () => void;
  onOpenMessageMenu: (messageId: string) => void;
  onToggleAvatarMenu: (messageId: string) => void;
  onAvatarPointerDown: (event: React.PointerEvent<HTMLButtonElement>, message: ParsedGroupChatMessage) => void;
  onAvatarPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onAvatarPointerUp: () => void;
  onCopyMessage: (message: ParsedGroupChatMessage) => void;
  onQuoteMessage: (message: ParsedGroupChatMessage) => void;
  onBanMessageSender: (message: ParsedGroupChatMessage) => void;
  onUnbanMessageSender: (message: ParsedGroupChatMessage) => void;
  onVoteMessageSender: (message: ParsedGroupChatMessage, support: boolean) => void;
  onClearMessageSenderVote: (message: ParsedGroupChatMessage) => void;
}) {
  return (
    <div className="message-list" ref={messageListRef}>
      {hasMoreMessages && (
        <div className="load-earlier-row">
          <button className="sheet-button inline-flex" type="button" onClick={onLoadEarlierMessages} disabled={room.isPending}>
            {room.isPending ? '加载中' : '加载更早消息'}
          </button>
          <span>
            已显示 {room.messages.length.toString()} / {room.messagesCount?.toString()} 条
          </span>
        </div>
      )}
      {room.isMessageFeedPending && room.messages.length === 0 ? (
        <div className="py-10">
          <LoadingIcon />
        </div>
      ) : visibleMessages.length === 0 ? (
        <div className="rounded-md border border-dashed border-greyscale-300 bg-white p-5 text-center text-sm text-greyscale-500">
          {room.messages.length === 0 ? '还没有链上消息' : '黑名单消息已按本机偏好隐藏'}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleMessages.map((message, index) => {
            const mine = sameAddress(message.senderAddress, account);
            const banned = room.bannedMessageIds[message.messageId.toString()] === true;
            const senderName = room.senderNames[message.senderId.toString()] || `NFT #${message.senderId.toString()}`;
            const quoted = message.quotedMessageId > BigInt(0) ? messageById[message.quotedMessageId.toString()] : undefined;
            const timestamp = messageTimestampMs(message);
            const showTimeDivider = shouldRenderMessageTimeDivider(message, visibleMessages[index - 1]);
            const messageKey = message.messageId.toString();
            const messageTime = showMessageTimes ? formatMessageTime(message.timestamp) : '';

            return (
              <Fragment key={messageKey}>
                {showTimeDivider && timestamp !== undefined && (
                  <div className="message-time-divider">{formatMessageDividerTime(timestamp)}</div>
                )}
                <article className={cn('message-row', mine && 'mine', banned && 'banned')} onClick={() => onOpenMessageMenu(messageKey)}>
                  <button
                    type="button"
                    className="avatar"
                    onPointerDown={(event) => onAvatarPointerDown(event, message)}
                    onPointerMove={onAvatarPointerMove}
                    onPointerUp={onAvatarPointerUp}
                    onPointerCancel={onAvatarPointerUp}
                    onContextMenu={(event) => event.preventDefault()}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleAvatarMenu(messageKey);
                    }}
                    data-long-press-mention
                    title="发送者菜单"
                  >
                    {senderName.slice(0, 1) || '人'}
                  </button>
                  <div className="message-body">
                    <div className="message-meta">
                      {senderName}
                      {messageTime && <span className="message-meta-time">{messageTime}</span>}
                      {banned && <span className="message-ban-badge">黑名单</span>}
                    </div>
                    <div className={cn('message-bubble', mine && 'mine')}>
                      {message.quotedMessageId > BigInt(0) && (
                        <div className="quote-preview">
                          {quoted ? quotedMessageSummary(quoted) : '引用消息未在当前分页中'}
                        </div>
                      )}
                      {renderMessageContent(message, room.senderNames)}
                    </div>
                    {activeAvatarMessageId === messageKey && !mine && (
                      <div className="message-actions avatar-actions">
                        {canUseMessageAdminBan && (
                          banned ? (
                            <button type="button" onClick={() => onUnbanMessageSender(message)} disabled={!messageAdminCanOperate}>解除sender</button>
                          ) : (
                            <button type="button" onClick={() => onBanMessageSender(message)} disabled={!messageAdminCanOperate}>拉黑sender</button>
                          )
                        )}
                        {canUseMessageGovBan && (
                          <>
                            <button type="button" onClick={() => onVoteMessageSender(message, true)} disabled={!canVoteMessageGovBan}>治理支持</button>
                            <button type="button" onClick={() => onVoteMessageSender(message, false)} disabled={!canVoteMessageGovBan}>治理反对</button>
                            <button type="button" onClick={() => onClearMessageSenderVote(message)} disabled={!canVoteMessageGovBan}>治理撤票</button>
                          </>
                        )}
                      </div>
                    )}
                    {activeMenuMessageId === messageKey && (
                      <div className="message-actions" onClick={(event) => event.stopPropagation()}>
                        <button type="button" title="引用" onClick={() => onQuoteMessage(message)}>引用</button>
                        <button type="button" title="复制" onClick={() => onCopyMessage(message)}>复制</button>
                      </div>
                    )}
                  </div>
                </article>
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
