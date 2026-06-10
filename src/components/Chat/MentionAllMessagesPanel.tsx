'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AtSign, Loader2, UserRound } from 'lucide-react';
import { useAccount } from 'wagmi';

import {
  useGroupChatManagedTitle,
  useGroupChatMentionAllData,
  useGroupNames,
  type ParsedGroupChatMessage,
} from '@/src/hooks/composite/useGroupChatData';
import { MENTION_ALL_PAGE_SIZE } from './chatConstants';
import { writeMentionAllReadCursor } from './chatStorage';
import { GroupDetailHeader } from './ChatGroupDetailHeader';
import {
  buildGroupChatMessageDetailHref,
  formatMessageFullTime,
  quotedMessageSummary,
} from './chatUtils';

export function MentionAllMessagesPanel({
  groupId,
}: {
  groupId: bigint;
}) {
  const { address: account } = useAccount();
  const [page, setPage] = useState(1);
  const offset = BigInt((Math.max(1, page) - 1) * MENTION_ALL_PAGE_SIZE);
  const data = useGroupChatMentionAllData(groupId, offset, BigInt(MENTION_ALL_PAGE_SIZE), true);
  const { groupNames, isPending: isGroupNamePending } = useGroupNames([groupId], true);
  const managedTitle = useGroupChatManagedTitle(groupId);
  const groupTitle =
    managedTitle.title ||
    groupNames[groupId.toString()] ||
    `群聊 #${groupId.toString()}`;
  const totalPages = Math.max(1, Math.ceil(Number(data.messagesCount || BigInt(0)) / MENTION_ALL_PAGE_SIZE));
  const loadingInitial = (data.isPending || isGroupNamePending || managedTitle.isPending) && data.messages.length === 0;
  const pageLabel = `${Math.min(page, totalPages)} / ${totalPages}`;
  const displayMessages = useMemo(() => [...data.messages].reverse(), [data.messages]);

  useEffect(() => {
    if (page !== 1) return;
    writeMentionAllReadCursor(account, groupId, data.messages[0]?.messageId);
  }, [account, data.messages, groupId, page]);

  return (
    <section className="workspace-screen mention-all-list-screen" aria-label="@全部 消息列表">
      <GroupDetailHeader
        title="@全部"
        groupId={groupId}
        subtitle={groupTitle}
        meta={data.messagesCount !== undefined ? `${data.messagesCount.toString()} 条` : '读取中'}
      />

      <section className="workspace-band mention-all-list-card">
        {loadingInitial ? (
          <div className="message-detail-loading" role="status" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>正在读取 @全部 消息...</span>
          </div>
        ) : data.error ? (
          <div className="empty-state">加载失败：{formatMentionListError(data.error, '@全部')}</div>
        ) : data.messages.length === 0 ? (
          <div className="empty-state">暂无 @全部 消息</div>
        ) : (
          <div className="mention-all-list">
            {displayMessages.map((message) => (
              <MentionMessageRow
                key={message.messageId.toString()}
                message={message}
                senderNames={data.senderNames}
                variant="all"
              />
            ))}
          </div>
        )}

        {data.messagesCount !== undefined && data.messagesCount > BigInt(MENTION_ALL_PAGE_SIZE) && (
          <div className="pager-row">
            <button
              className="sheet-button inline-flex"
              type="button"
              disabled={page <= 1 || data.isFetching}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              上一页
            </button>
            <span>{pageLabel} · 按聊天顺序</span>
            <button
              className="sheet-button inline-flex"
              type="button"
              disabled={page >= totalPages || data.isFetching}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              下一页
            </button>
          </div>
        )}
      </section>
    </section>
  );
}

export function MentionMessageRow({
  message,
  senderNames,
  variant,
}: {
  message: ParsedGroupChatMessage;
  senderNames: Record<string, string>;
  variant: 'all' | 'me' | 'sender';
}) {
  const senderName = senderNames[message.senderId.toString()] || `NFT #${message.senderId.toString()}`;
  const timeLabel = formatMessageFullTime(message.timestamp);
  const href = buildGroupChatMessageDetailHref(message.groupId, message.messageId);
  const mentionedIdsLabel = useMemo(
    () =>
      message.mentionedSenderIds.length > 0
        ? `${variant === 'all' ? '另提及' : '提及'} ${message.mentionedSenderIds.length.toString()} 个 NFT`
        : '',
    [message.mentionedSenderIds.length, variant],
  );

  return (
    <Link href={href} className={`list-row mention-all-list-row mention-${variant}`}>
      <div className="mention-all-list-icon">
        {variant === 'sender' ? (
          <UserRound className="h-4 w-4" aria-hidden="true" />
        ) : (
          <AtSign className="h-4 w-4" aria-hidden="true" />
        )}
      </div>
      <div className="mention-all-list-main">
        <div className="mention-all-list-meta">
          <strong>{senderName}</strong>
          <span>消息 #{message.messageId.toString()}</span>
          {timeLabel && <span>{timeLabel}</span>}
          <span>行动轮次 {message.round.toString()}</span>
          {mentionedIdsLabel && <span>{mentionedIdsLabel}</span>}
        </div>
        <div className="mention-all-list-content">
          {quotedMessageSummary(message, 140)}
        </div>
      </div>
    </Link>
  );
}

export function formatMentionListError(error: unknown, label: string) {
  if (error instanceof Error) return error.message;
  return `读取 ${label} 消息失败，请稍后重试`;
}
