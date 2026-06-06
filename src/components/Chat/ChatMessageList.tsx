'use client';

import { Fragment } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import type { GroupChatPublicData, ParsedGroupChatMessage } from '@/src/hooks/composite/useGroupChatData';
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
  data,
  groupId,
  messageListRef,
  hasMoreMessages,
  isLoadingEarlierMessages,
  visibleMessages,
  messageById,
  activeMenuMessageId,
  canUseMessageAdminBan,
  messageAdminCanOperate,
  canUseMessageGovBan,
  canVoteMessageGovBan,
  showMessageTimes,
  onLoadEarlierMessages,
  onOpenMessageMenu,
  onMentionSender,
  onCopyMessage,
  onQuoteMessage,
  onOpenBanSettings,
}: {
  account: `0x${string}` | undefined;
  data: GroupChatPublicData;
  groupId: bigint;
  messageListRef: React.RefObject<HTMLDivElement>;
  hasMoreMessages: boolean;
  isLoadingEarlierMessages: boolean;
  visibleMessages: ParsedGroupChatMessage[];
  messageById: Record<string, ParsedGroupChatMessage>;
  activeMenuMessageId: string | undefined;
  canUseMessageAdminBan: boolean;
  messageAdminCanOperate: boolean;
  canUseMessageGovBan: boolean;
  canVoteMessageGovBan: boolean;
  showMessageTimes: boolean;
  onLoadEarlierMessages: () => void;
  onOpenMessageMenu: (messageId: string) => void;
  onMentionSender: (message: ParsedGroupChatMessage) => void;
  onCopyMessage: (message: ParsedGroupChatMessage) => void;
  onQuoteMessage: (message: ParsedGroupChatMessage) => void;
  onOpenBanSettings: (message: ParsedGroupChatMessage) => void;
}) {
  const showListSyncIndicator =
    data.isMessageListFetching && data.messages.length > 0 && !isLoadingEarlierMessages;
  const loadEarlierDisabled = isLoadingEarlierMessages || data.isMessageFeedFetching;
  const showInitialLoadingState = data.isMessageFeedPending && data.messages.length === 0;
  const showLoadEarlierRow = hasMoreMessages && !showInitialLoadingState;

  return (
    <div
      className="message-list"
      ref={messageListRef}
      aria-busy={data.isMessageListFetching || isLoadingEarlierMessages}
    >
      {showLoadEarlierRow && (
        <div className="load-earlier-row">
          <button
            className="sheet-button inline-flex"
            type="button"
            onClick={onLoadEarlierMessages}
            disabled={loadEarlierDisabled}
          >
            {isLoadingEarlierMessages ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                加载更早消息中
              </>
            ) : (
              <>
                <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                加载更早消息
              </>
            )}
          </button>
          <span className="load-earlier-count">
            已显示 {data.messages.length.toString()} / {data.messagesCount?.toString()} 条
          </span>
        </div>
      )}
      {showListSyncIndicator && (
        <div className="message-sync-indicator-wrap" role="status" aria-live="polite">
          <div className="message-sync-indicator">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            <span>正在更新消息列表...</span>
          </div>
        </div>
      )}
      {showInitialLoadingState ? (
        <div className="message-initial-loading" role="status" aria-live="polite">
          <LoadingIcon />
          <span>正在读取链上消息...</span>
        </div>
      ) : visibleMessages.length === 0 ? (
        <div className="rounded-md border border-dashed border-greyscale-300 bg-white p-5 text-center text-sm text-greyscale-500">
          {data.messages.length === 0 ? '还没有链上消息' : '禁言消息已按本机偏好隐藏'}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleMessages.map((message, index) => {
            const mine = sameAddress(message.senderAddress, account);
            const banned = data.bannedMessageIds[message.messageId.toString()] === true;
            const senderName = data.senderNames[message.senderId.toString()] || `NFT #${message.senderId.toString()}`;
            const quoted = message.quotedMessageId > BigInt(0) ? messageById[message.quotedMessageId.toString()] : undefined;
            const timestamp = messageTimestampMs(message);
            const showTimeDivider = shouldRenderMessageTimeDivider(message, visibleMessages[index - 1]);
            const messageKey = message.messageId.toString();
            const messageTime = showMessageTimes ? formatMessageTime(message.timestamp) : '';
            const quotePreview = quoted ? quotedMessageSummary(quoted, 72) : '引用消息未在当前分页中';
            const canOpenBanSettings =
              !mine && ((canUseMessageAdminBan && messageAdminCanOperate) || (canUseMessageGovBan && canVoteMessageGovBan));

            return (
              <Fragment key={messageKey}>
                {showTimeDivider && timestamp !== undefined && (
                  <div className="message-time-divider">{formatMessageDividerTime(timestamp)}</div>
                )}
                <article className={cn('message-row', mine && 'mine', banned && 'banned')} onClick={() => onOpenMessageMenu(messageKey)}>
                  <div className="message-body">
                    <div className="message-meta">
                      {senderName}
                      {messageTime && <span className="message-meta-time">{messageTime}</span>}
                      {banned && <span className="message-ban-badge">禁言</span>}
                    </div>
                    <div className={cn('message-bubble', mine && 'mine', message.quotedMessageId > BigInt(0) && 'with-quote')}>
                      {message.quotedMessageId > BigInt(0) && (
                        <div className={cn('quote-preview', !quoted && 'unavailable')}>{quotePreview}</div>
                      )}
                      {renderMessageContent(message, data.senderNames)}
                    </div>
                    {activeMenuMessageId === messageKey && (
                      <div
                        className="message-actions"
                        data-message-actions-id={messageKey}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button type="button" title="提及" onClick={() => onMentionSender(message)}>提及</button>
                        <button type="button" title="引用" onClick={() => onQuoteMessage(message)}>引用</button>
                        <button type="button" title="复制" onClick={() => onCopyMessage(message)}>复制</button>
                        {canOpenBanSettings && (
                          <button type="button" onClick={() => onOpenBanSettings(message)}>禁言设置</button>
                        )}
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
