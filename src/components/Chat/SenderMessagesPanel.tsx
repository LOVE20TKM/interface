'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import {
  useGroupChatManagedTitle,
  useGroupChatSenderData,
  useGroupNames,
} from '@/src/hooks/composite/useGroupChatData';
import { MENTION_ALL_PAGE_SIZE } from './chatConstants';
import { GroupDetailHeader } from './ChatGroupDetailHeader';
import {
  MentionMessageRow,
  formatMentionListError,
} from './MentionAllMessagesPanel';

export function SenderMessagesPanel({
  groupId,
  senderId,
}: {
  groupId: bigint;
  senderId: bigint;
}) {
  const [page, setPage] = useState(1);
  const offset = BigInt((Math.max(1, page) - 1) * MENTION_ALL_PAGE_SIZE);
  const data = useGroupChatSenderData(groupId, senderId, offset, BigInt(MENTION_ALL_PAGE_SIZE), true);
  const { groupNames, isPending: isGroupNamePending } = useGroupNames([groupId, senderId], true);
  const managedTitle = useGroupChatManagedTitle(groupId);
  const groupTitle =
    managedTitle.title ||
    groupNames[groupId.toString()] ||
    `群聊 #${groupId.toString()}`;
  const senderLabel = data.senderNames[senderId.toString()] || groupNames[senderId.toString()] || `NFT #${senderId.toString()}`;
  const totalPages = Math.max(1, Math.ceil(Number(data.messagesCount || BigInt(0)) / MENTION_ALL_PAGE_SIZE));
  const loadingInitial = (data.isPending || isGroupNamePending || managedTitle.isPending) && data.messages.length === 0;
  const pageLabel = `${Math.min(page, totalPages)} / ${totalPages}`;
  const displayMessages = useMemo(() => [...data.messages].reverse(), [data.messages]);

  return (
    <section className="workspace-screen mention-all-list-screen" aria-label="只看Ta 消息列表">
      <GroupDetailHeader
        title="只看Ta"
        groupId={groupId}
        subtitle={`${groupTitle} · ${senderLabel}`}
        meta={data.messagesCount !== undefined ? `${data.messagesCount.toString()} 条` : '读取中'}
      />

      <section className="workspace-band mention-all-list-card">
        {loadingInitial ? (
          <div className="message-detail-loading" role="status" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>正在读取 Ta 的消息...</span>
          </div>
        ) : data.error ? (
          <div className="empty-state">加载失败：{formatMentionListError(data.error, 'Ta 的')}</div>
        ) : data.messages.length === 0 ? (
          <div className="empty-state">暂无 Ta 发送的消息</div>
        ) : (
          <div className="mention-all-list">
            {displayMessages.map((message) => (
              <MentionMessageRow
                key={message.messageId.toString()}
                message={message}
                senderNames={data.senderNames}
                variant="sender"
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
