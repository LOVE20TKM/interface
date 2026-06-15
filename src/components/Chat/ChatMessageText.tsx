'use client';

import type { ReactNode } from 'react';
import type { ParsedGroupChatMessage } from '@/src/hooks/composite/useGroupChatData';
import { MENTION_ALL_DISPLAY_TOKEN, normalizeMentionAllDisplayTokens } from './chatUtils';

type TextPart =
  | { type: 'text'; value: string }
  | { type: 'link'; value: string; href: string };

const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"'`]+/giu;
const TRAILING_PUNCTUATION_PATTERN = /[.,!?;:，。！？；：、)\]}>）】》…]+$/u;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function messageMentionTokens(message: ParsedGroupChatMessage, senderNames: Record<string, string>) {
  const tokens = new Set<string>();
  if (message.mentionAll) {
    tokens.add(MENTION_ALL_DISPLAY_TOKEN);
  }
  message.mentionedSenderIds.forEach((senderId) => {
    const key = senderId.toString();
    const name = senderNames[key];
    if (name) tokens.add(`@${name}`);
    tokens.add(`@NFT #${key}`);
  });
  return Array.from(tokens).sort((left, right) => right.length - left.length);
}

function normalizeUrl(rawUrl: string) {
  return rawUrl.toLowerCase().startsWith('www.') ? `https://${rawUrl}` : rawUrl;
}

export function linkifyMessageText(content: string): TextPart[] {
  const parts: TextPart[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(URL_PATTERN)) {
    const rawValue = match[0];
    const start = match.index ?? 0;
    if (start > lastIndex) parts.push({ type: 'text', value: content.slice(lastIndex, start) });

    const trailingMatch = rawValue.match(TRAILING_PUNCTUATION_PATTERN);
    const trailing = trailingMatch?.[0] || '';
    const value = trailing ? rawValue.slice(0, -trailing.length) : rawValue;

    if (value) parts.push({ type: 'link', value, href: normalizeUrl(value) });
    if (trailing) parts.push({ type: 'text', value: trailing });
    lastIndex = start + rawValue.length;
  }

  if (lastIndex < content.length) parts.push({ type: 'text', value: content.slice(lastIndex) });
  return parts.length > 0 ? parts : [{ type: 'text', value: content }];
}

function sourceLinkHrefs(sourceContent: string) {
  return linkifyMessageText(sourceContent)
    .filter((part): part is Extract<TextPart, { type: 'link' }> => part.type === 'link')
    .map((part) => part.href);
}

function renderLink(value: string, href: string, key: string) {
  return (
    <a
      className="message-link"
      href={href}
      key={key}
      rel="noreferrer"
      target="_blank"
      onClick={(event) => event.stopPropagation()}
    >
      {value}
    </a>
  );
}

function renderLinkedText(content: string, keyPrefix: string, sourceContent = content) {
  const sourceHrefs = sourceContent === content ? [] : sourceLinkHrefs(sourceContent);
  let linkIndex = 0;

  return linkifyMessageText(content).map((part, index) => {
    if (part.type === 'text') return part.value;
    const href = sourceHrefs[linkIndex] || part.href;
    linkIndex += 1;
    return renderLink(part.value, href, `${keyPrefix}-${index}`);
  });
}

function renderMentionedPlainText(content: string, tokens: string[], keyPrefix: string) {
  if (tokens.length === 0) return content;
  const tokenSet = new Set(tokens);
  const parts = content.split(new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'g'));

  return parts.map((part, index) =>
    tokenSet.has(part) ? (
      <span className="message-mention" key={`${keyPrefix}-mention-${index}`}>
        {part}
      </span>
    ) : part,
  );
}

function renderMentionedText(
  content: string,
  tokens: string[],
  keyPrefix: string,
): ReactNode {
  if (tokens.length === 0) return renderLinkedText(content, keyPrefix);

  let linkIndex = 0;
  return linkifyMessageText(content).map((part, index) => {
    if (part.type === 'text') return renderMentionedPlainText(part.value, tokens, `${keyPrefix}-text-${index}`);
    linkIndex += 1;
    return renderLink(part.value, part.href, `${keyPrefix}-link-${linkIndex}`);
  });
}

export function ChatMessageText({
  content,
  emptyText = '',
  sourceContent,
}: {
  content: string | undefined;
  emptyText?: string;
  sourceContent?: string;
}) {
  const text = content || emptyText;
  return <>{renderLinkedText(text, 'message-text', sourceContent || text)}</>;
}

export function ChatMessageContent({
  message,
  senderNames,
}: {
  message: ParsedGroupChatMessage;
  senderNames: Record<string, string>;
}) {
  const content = message.mentionAll ? normalizeMentionAllDisplayTokens(message.content) : message.content;
  return <>{renderMentionedText(content, messageMentionTokens(message, senderNames), 'message-content')}</>;
}
