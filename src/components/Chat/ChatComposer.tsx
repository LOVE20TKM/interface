'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { AtSign, Loader2, Quote, Send, ShieldCheck, UserRoundCog, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import type { ParsedGroupChatMessage } from '@/src/hooks/composite/useGroupChatData';
import type { GroupNFT } from '@/src/hooks/extension/base/composite/useMyGroups';
import { cn } from '@/lib/utils';
import { quotedMessageSummary } from './chatUtils';
import { ChatMessageText } from './ChatMessageText';
import type { SendAvailability } from './sendAvailability';

type SenderOption = Pick<GroupNFT, 'tokenId' | 'groupName'>;

export const ChatComposer = forwardRef<HTMLElement, {
  activeSenderId: bigint | undefined;
  activeSenderName: string;
  activeCanPost: boolean;
  sendAvailability: SendAvailability;
  canSwitchSender: boolean;
  senderOptions: SenderOption[];
  selectedSenderId: bigint | undefined;
  isSenderOptionsPending: boolean;
  content: string;
  quotedMessage: ParsedGroupChatMessage | undefined;
  mentionValidationHint: string;
  mentionValidationBlocking: boolean;
  mentionAllActive: boolean;
  mentionAllDisabled: boolean;
  sendDisabled: boolean;
  isPending: boolean;
  isConfirming: boolean;
  onSelectSender: (senderId: bigint | undefined) => void;
  onContentChange: (value: string) => void;
  onToggleMentionAll: () => void;
  onSend: () => void;
  onClearQuote: () => void;
}>(function ChatComposer({
  activeSenderId,
  activeSenderName,
  activeCanPost,
  sendAvailability,
  canSwitchSender,
  senderOptions,
  selectedSenderId,
  isSenderOptionsPending,
  content,
  quotedMessage,
  mentionValidationHint,
  mentionValidationBlocking,
  mentionAllActive,
  mentionAllDisabled,
  sendDisabled,
  isPending,
  isConfirming,
  onSelectSender,
  onContentChange,
  onToggleMentionAll,
  onSend,
  onClearQuote,
}, ref) {
  const composerLocked = !sendAvailability.canSend;
  const showDefaultNftSetupLink = !canSwitchSender && !sendAvailability.canSend && sendAvailability.source === 'defaultNft';
  const cannotSendMessage = showDefaultNftSetupLink
    ? '请先设置默认 LOVE20 NFT 后再发言。'
    : sendAvailability.canSend
      ? ''
      : canSwitchSender && sendAvailability.source === 'defaultNft'
        ? '请选择发言 NFT 后再发言。'
        : sendAvailability.message || '当前无法发言。';
  const activeSenderLabel = activeSenderId
    ? formatSenderIdentity(activeSenderName, activeSenderId)
    : '';
  const selectedSenderValue = selectedSenderId ? selectedSenderId.toString() : '';
  const senderControlDisabled = isPending || isConfirming || isSenderOptionsPending || senderOptions.length === 0;
  const sending = isPending || isConfirming;
  const sendButtonLabel = sending ? (isConfirming ? '确认中' : '发送中') : '发送';
  const senderControl = (
    <SenderIdentityControl
      activeSenderId={activeSenderId}
      activeSenderLabel={activeSenderLabel}
      activeCanPost={activeCanPost}
      canSwitchSender={canSwitchSender}
      disabled={senderControlDisabled}
      isPending={isSenderOptionsPending}
      options={senderOptions}
      value={selectedSenderValue}
      onChange={(value) => onSelectSender(value ? BigInt(value) : undefined)}
    />
  );

  return (
    <footer ref={ref} className={composerLocked ? 'composer-banned' : 'composer'}>
      {composerLocked && canSwitchSender && senderControl}
      {!sendAvailability.canSend ? (
        <div className="cannot-post">
          <div className="cannot-post-inline">
            {sendAvailability.source === 'loading' && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
            <span>{cannotSendMessage}</span>
            {showDefaultNftSetupLink && (
              <Link href="/group/groupids/" className="composer-setup-link">
                去设置
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="composer-identity-row">
            {senderControl}
            <button
              type="button"
              className={cn('composer-tool-button inline-flex', mentionAllActive && 'active')}
              onClick={onToggleMentionAll}
              disabled={mentionAllDisabled && !mentionAllActive}
              aria-pressed={mentionAllActive}
              aria-label={mentionAllActive ? '取消 @所有人' : '添加 @所有人'}
              title={mentionAllDisabled && !mentionAllActive ? '只有群 owner、delegate 或管理员 NFT 可用' : mentionAllActive ? '取消 @所有人' : '添加 @所有人'}
            >
              <AtSign className="h-3.5 w-3.5" aria-hidden="true" />
              <span>所有人</span>
            </button>
            {!activeCanPost && <span className="composer-identity-status">不可发言</span>}
          </div>
          {quotedMessage && (
            <div className="flex flex-wrap gap-2">
              <div
                className="chip inline-flex max-w-full items-center gap-1 rounded-full border border-greyscale-200 bg-greyscale-50 px-2 py-1 text-xs text-greyscale-600"
              >
                <Quote className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  引用 <ChatMessageText content={quotedMessageSummary(quotedMessage, 18)} sourceContent={quotedMessage.content} />
                </span>
                <button
                  type="button"
                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0 text-greyscale-500 hover:text-greyscale-900"
                  onClick={onClearQuote}
                  title="取消引用"
                  aria-label="取消引用"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
          <div className="composer-row">
            <Textarea
              value={content}
              onChange={(event) => onContentChange(event.target.value)}
              onContextMenu={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
                event.preventDefault();
                if (!sendDisabled) onSend();
              }}
              placeholder="输入公开链上消息"
              maxLength={4096}
              className="composer-input min-h-0 resize-none"
              aria-label="消息内容"
            />
            <button
              type="button"
              className="send-button inline-flex"
              disabled={sendDisabled}
              onClick={onSend}
              aria-label={sendButtonLabel}
              title={sendButtonLabel}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          {mentionValidationHint && (
            <div className={cn('composer-mention-hint', mentionValidationBlocking && 'blocking')}>
              {mentionValidationHint}
            </div>
          )}
        </div>
      )}
    </footer>
  );
});

function formatSenderIdentity(name: string, senderId: bigint) {
  const idLabel = `NFT #${senderId.toString()}`;
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName === idLabel || trimmedName === `LOVE20 ${idLabel}`) return idLabel;
  return `${trimmedName} (${idLabel})`;
}

function SenderIdentityControl({
  activeSenderId,
  activeSenderLabel,
  activeCanPost,
  canSwitchSender,
  disabled,
  isPending,
  options,
  value,
  onChange,
}: {
  activeSenderId: bigint | undefined;
  activeSenderLabel: string;
  activeCanPost: boolean;
  canSwitchSender: boolean;
  disabled: boolean;
  isPending: boolean;
  options: SenderOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const displayValue = value || activeSenderId?.toString() || '';
  const statusText = activeSenderId
    ? `使用 ${activeSenderLabel} 发言`
    : canSwitchSender
      ? '选择发言 NFT'
      : '默认 NFT 身份不可用';

  if (!canSwitchSender) {
    return (
      <div className="composer-identity-control">
        <ShieldCheck className={cn('h-3.5 w-3.5 shrink-0', activeCanPost ? 'text-secondary' : 'text-warning')} />
        <span className="truncate">{statusText}</span>
      </div>
    );
  }

  return (
    <label className={cn('composer-identity-control interactive', disabled && 'disabled')} title="切换本次发言 NFT">
      <UserRoundCog className={cn('h-3.5 w-3.5 shrink-0', activeCanPost ? 'text-secondary' : 'text-warning')} aria-hidden="true" />
      <span className="sr-only">发言 NFT</span>
      <span className="composer-identity-prefix">使用</span>
      <select
        value={displayValue}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-label="选择发言 NFT"
      >
        {!value && !activeSenderId && <option value="">选择发言 NFT</option>}
        {options.length === 0 && activeSenderId && (
          <option value={activeSenderId.toString()}>
            NFT #{activeSenderId.toString()}
          </option>
        )}
        {options.map((option) => (
          <option key={option.tokenId.toString()} value={option.tokenId.toString()}>
            {senderOptionLabel(option)}
          </option>
        ))}
      </select>
      <span className="composer-identity-suffix">发言</span>
      {isPending && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />}
    </label>
  );
}

function senderOptionLabel(option: SenderOption) {
  const idLabel = `NFT #${option.tokenId.toString()}`;
  const name = option.groupName.trim();
  if (!name || name === idLabel || name === `LOVE20 ${idLabel}`) return idLabel;
  return `${name} (${idLabel})`;
}
