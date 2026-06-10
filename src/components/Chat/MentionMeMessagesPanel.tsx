'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';

import { useDefaultGroupOf } from '@/src/hooks/extension/base/contracts/useGroupDefaults';
import {
  useGroupChatManagedTitle,
  useGroupChatMentionData,
  useGroupNames,
} from '@/src/hooks/composite/useGroupChatData';
import { MENTION_ALL_PAGE_SIZE } from './chatConstants';
import { GroupDetailHeader } from './ChatGroupDetailHeader';
import {
  MentionMessageRow,
  formatMentionListError,
} from './MentionAllMessagesPanel';

export function MentionMeMessagesPanel({
  groupId,
}: {
  groupId: bigint;
}) {
  const { address: account } = useAccount();
  const { defaultGroupId, defaultGroupName, hasDefaultGroup, isPending: isDefaultGroupPending } =
    useDefaultGroupOf(account, !!account);
  const [page, setPage] = useState(1);
  const offset = BigInt((Math.max(1, page) - 1) * MENTION_ALL_PAGE_SIZE);
  const data = useGroupChatMentionData(groupId, defaultGroupId, offset, BigInt(MENTION_ALL_PAGE_SIZE), true);
  const { groupNames, isPending: isGroupNamePending } = useGroupNames([groupId], true);
  const managedTitle = useGroupChatManagedTitle(groupId);
  const groupTitle =
    managedTitle.title ||
    groupNames[groupId.toString()] ||
    `群聊 #${groupId.toString()}`;
  const totalPages = Math.max(1, Math.ceil(Number(data.messagesCount || BigInt(0)) / MENTION_ALL_PAGE_SIZE));
  const loadingInitial =
    !!account &&
    hasDefaultGroup &&
    (data.isPending || isDefaultGroupPending || isGroupNamePending || managedTitle.isPending) &&
    data.messages.length === 0;
  const pageLabel = `${Math.min(page, totalPages)} / ${totalPages}`;
  const displayMessages = useMemo(() => [...data.messages].reverse(), [data.messages]);
  const senderLabel = defaultGroupName || (defaultGroupId ? `NFT #${defaultGroupId.toString()}` : '');
  const headerMeta =
    data.messagesCount !== undefined
      ? `${data.messagesCount.toString()} 条`
      : account && (isDefaultGroupPending || hasDefaultGroup)
        ? senderLabel || '读取中'
        : undefined;

  return (
    <section className="workspace-screen mention-all-list-screen" aria-label="@我 消息列表">
      <GroupDetailHeader
        title="@我"
        groupId={groupId}
        subtitle={groupTitle}
        meta={headerMeta}
      />

      <section className="workspace-band mention-all-list-card">
        {!account ? (
          <div className="empty-state">连接钱包后查看 @我 消息。</div>
        ) : isDefaultGroupPending ? (
          <div className="message-detail-loading" role="status" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>正在读取默认 NFT...</span>
          </div>
        ) : !hasDefaultGroup || !defaultGroupId ? (
          <div className="empty-state">设置默认 NFT 后查看 @我 消息。</div>
        ) : loadingInitial ? (
          <div className="message-detail-loading" role="status" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>正在读取 @我 消息...</span>
          </div>
        ) : data.error ? (
          <div className="empty-state">加载失败：{formatMentionListError(data.error, '@我')}</div>
        ) : data.messages.length === 0 ? (
          <div className="empty-state">暂无 @我 消息</div>
        ) : (
          <div className="mention-all-list">
            {displayMessages.map((message) => (
              <MentionMessageRow
                key={message.messageId.toString()}
                message={message}
                senderNames={data.senderNames}
                variant="me"
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
