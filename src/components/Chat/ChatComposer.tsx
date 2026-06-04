'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { Loader2, Quote, Send, ShieldCheck, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import type { ParsedGroupChatMessage } from '@/src/hooks/composite/useGroupChatData';
import { cn } from '@/lib/utils';
import { quotedMessageSummary } from './chatUtils';
import type { SendAvailability } from './sendAvailability';

export const ChatComposer = forwardRef<HTMLElement, {
  activeSenderId: bigint | undefined;
  activeSenderName: string;
  activeCanPost: boolean;
  sendAvailability: SendAvailability;
  content: string;
  quotedMessage: ParsedGroupChatMessage | undefined;
  mentionValidationHint: string;
  mentionValidationBlocking: boolean;
  sendDisabled: boolean;
  isPending: boolean;
  isConfirming: boolean;
  onContentChange: (value: string) => void;
  onSend: () => void;
  onClearQuote: () => void;
}>(function ChatComposer({
  activeSenderId,
  activeSenderName,
  activeCanPost,
  sendAvailability,
  content,
  quotedMessage,
  mentionValidationHint,
  mentionValidationBlocking,
  sendDisabled,
  isPending,
  isConfirming,
  onContentChange,
  onSend,
  onClearQuote,
}, ref) {
  const composerLocked = !sendAvailability.canSend;
  const cannotSendMessage = sendAvailability.canSend ? '' : sendAvailability.message || '当前无法发言。';
  const showDefaultNftSetupLink = !sendAvailability.canSend && sendAvailability.source === 'defaultNft';
  const activeSenderLabel = activeSenderId
    ? formatSenderIdentity(activeSenderName, activeSenderId)
    : '';
  const sending = isPending || isConfirming;
  const sendButtonLabel = sending ? (isConfirming ? '确认中' : '发送中') : '发送';

  return (
    <footer ref={ref} className={composerLocked ? 'composer-banned' : 'composer'}>
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
            <div className="composer-identity-label">
              <ShieldCheck className={cn('h-3.5 w-3.5', activeCanPost ? 'text-secondary' : 'text-warning')} />
              <span className="truncate">
                {activeSenderId ? `使用 ${activeSenderLabel} 发言` : '默认 NFT 身份不可用'}
              </span>
            </div>
            {!activeCanPost && <span className="composer-identity-status">不可发言</span>}
          </div>
          {quotedMessage && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="chip inline-flex max-w-full items-center gap-1 rounded-full border border-greyscale-200 bg-greyscale-50 px-2 py-1 text-xs text-greyscale-600"
                onClick={onClearQuote}
                title="取消引用"
              >
                <Quote className="h-3 w-3 shrink-0" />
                <span className="truncate">引用 {quotedMessageSummary(quotedMessage, 18)}</span>
                <X className="h-3 w-3 shrink-0" />
              </button>
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
