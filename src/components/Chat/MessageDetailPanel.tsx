'use client';

import { useMemo, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

import { useGroupChatMessage } from '@/src/hooks/contracts/useGroupChat';
import {
  parseGroupChatMessage,
  useGroupChatManagedTitle,
  useGroupNames,
} from '@/src/hooks/composite/useGroupChatData';
import { GroupDetailHeader } from './ChatGroupDetailHeader';
import { ChatMessageText } from './ChatMessageText';

function formatError(error: unknown) {
  if (error instanceof Error) return error.message;
  return '读取消息失败，请稍后重试';
}

function formatTimestamp(timestamp: bigint) {
  if (timestamp <= BigInt(0)) return '0';
  const millis = Number(timestamp) * 1000;
  if (!Number.isFinite(millis)) return timestamp.toString();
  const date = new Date(millis);
  const pad = (value: number) => value.toString().padStart(2, '0');
  const localTime = [
    `${date.getFullYear()}年${pad(date.getMonth() + 1)}月${pad(date.getDate())}日`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join(' ');
  return `${timestamp.toString()}（${localTime}）`;
}

function idWithName(id: bigint, names: Record<string, string>) {
  const key = id.toString();
  return names[key] ? `#${key} · ${names[key]}` : `#${key}`;
}

function DetailRow({
  label,
  children,
  note,
}: {
  label: string;
  children: ReactNode;
  note?: string;
}) {
  return (
    <div>
      <span>{label}</span>
      <strong>
        {children}
        {note && <small>{note}</small>}
      </strong>
    </div>
  );
}

export function MessageDetailPanel({
  groupId,
  messageId,
}: {
  groupId: bigint;
  messageId: bigint;
}) {
  const {
    message: rawMessage,
    isPending: isMessagePending,
    error,
  } = useGroupChatMessage(groupId, messageId);
  const message = useMemo(() => parseGroupChatMessage(rawMessage), [rawMessage]);
  const mentionedSenderIdsKey = useMemo(
    () => message?.mentionedSenderIds.map((id) => id.toString()).join(',') || '',
    [message?.mentionedSenderIds],
  );
  const nameIds = useMemo(
    () => [
      groupId,
      message?.senderId,
      ...(message?.mentionedSenderIds || []),
    ],
    [groupId, mentionedSenderIdsKey, message?.senderId],
  );
  const {
    groupNames,
    isPending: isNamesPending,
  } = useGroupNames(nameIds, nameIds.length > 0);
  const managedTitle = useGroupChatManagedTitle(groupId);
  const groupTitle =
    managedTitle.title ||
    groupNames[groupId.toString()] ||
    `群聊 #${groupId.toString()}`;
  const isLoading = isMessagePending || isNamesPending || managedTitle.isPending;
  const isValidMessage =
    !!message &&
    message.messageId === messageId &&
    message.groupId === groupId &&
    message.messageId > BigInt(0);

  return (
    <section className="workspace-screen message-detail-screen" aria-label="消息详情">
      <GroupDetailHeader
        title="消息详情"
        groupId={groupId}
        subtitle={groupTitle}
      />

      {isLoading && !message ? (
        <section className="workspace-band message-detail-loading" role="status" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>正在读取链上消息...</span>
        </section>
      ) : error ? (
        <section className="workspace-band">
          <div className="empty-state">加载失败：{formatError(error)}</div>
        </section>
      ) : !isValidMessage ? (
        <section className="workspace-band">
          <div className="empty-state">未找到这条消息，或消息不属于当前群聊。</div>
        </section>
      ) : (
        <section className="workspace-band message-detail-card">
          <div className="rule-table message-detail-fields">
            <DetailRow label="groupId" note={groupTitle}>
              {message.groupId.toString()}
            </DetailRow>
            <DetailRow label="senderId" note={idWithName(message.senderId, groupNames)}>
              {message.senderId.toString()}
            </DetailRow>
            <DetailRow label="senderAddress">
              <code>{message.senderAddress}</code>
            </DetailRow>
            <DetailRow label="round">
              {message.round.toString()}
            </DetailRow>
            <DetailRow label="messageId">
              {message.messageId.toString()}
            </DetailRow>
            <DetailRow label="content">
              <span className="message-detail-inline-content">
                <ChatMessageText content={message.content} emptyText="（空）" />
              </span>
            </DetailRow>
            <DetailRow label="blockNumber">
              {message.blockNumber.toString()}
            </DetailRow>
            <DetailRow label="timestamp">
              {formatTimestamp(message.timestamp)}
            </DetailRow>
            <DetailRow label="mentionedSenderIds">
              {message.mentionedSenderIds.length > 0 ? (
                <span className="message-detail-token-list">
                  {message.mentionedSenderIds.map((id) => (
                    <span className="message-detail-token" key={id.toString()}>
                      {id.toString()}
                      <small>{idWithName(id, groupNames)}</small>
                    </span>
                  ))}
                </span>
              ) : (
                '[]'
              )}
            </DetailRow>
            <DetailRow label="mentionAll">
              {message.mentionAll ? 'true' : 'false'}
            </DetailRow>
            <DetailRow label="quotedMessageId">
              {message.quotedMessageId.toString()}
            </DetailRow>
          </div>
        </section>
      )}
    </section>
  );
}
