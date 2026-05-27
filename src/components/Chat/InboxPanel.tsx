import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { MessagesSquare } from 'lucide-react';

import LoadingIcon from '@/src/components/Common/LoadingIcon';
import type { GroupChatListItem } from '@/src/hooks/composite/useGroupChatData';
import { cn } from '@/lib/utils';
import { ChatBadge } from './ChatBadge';
import { LONG_PRESS_MOVE_TOLERANCE, LONG_PRESS_MS } from './chatConstants';
import { buildChatRoomHref, safeBigIntFromString } from './chatUtils';

const CONVERSATION_MENU_WIDTH = 132;
const CONVERSATION_MENU_HEIGHT = 44;
const CONVERSATION_MENU_GUTTER = 8;

function ConversationItem({
  item,
  pinned,
  readCursor,
  tokenSymbol,
  onTogglePin,
}: {
  item: GroupChatListItem;
  pinned: boolean;
  readCursor: bigint;
  tokenSymbol?: string;
  onTogglePin: (groupId: bigint) => void;
}) {
  const typeClass = `conversation-type-${item.kind}`;
  const rawUnreadCount = item.messagesCount > readCursor ? item.messagesCount - readCursor : BigInt(0);
  const visibleUnreadCount = rawUnreadCount;
  const hasUnreadMentionMe = item.latestMentionMeMessageId > readCursor;
  const hasUnreadMentionAll = item.latestMentionAllMessageId > readCursor;
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: CONVERSATION_MENU_GUTTER, top: CONVERSATION_MENU_GUTTER });
  const rowRef = useRef<HTMLDivElement | null>(null);
  const href = buildChatRoomHref(tokenSymbol, item.groupId);
  const pressRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const clearPress = useCallback(() => {
    if (pressRef.current) clearTimeout(pressRef.current.timer);
    pressRef.current = null;
  }, []);

  useEffect(() => clearPress, [clearPress]);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnPointerDown = (event: PointerEvent) => {
      if (rowRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeOnPointerDown);
    return () => document.removeEventListener('pointerdown', closeOnPointerDown);
  }, [menuOpen]);

  const startLongPress = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('.conversation-menu')) {
      return;
    }
    const { clientX, clientY, pointerId } = event;
    clearPress();
    pressRef.current = {
      pointerId,
      x: clientX,
      y: clientY,
      timer: setTimeout(() => {
        const rect = rowRef.current?.getBoundingClientRect();
        if (rect) {
          const maxLeft = Math.max(CONVERSATION_MENU_GUTTER, rect.width - CONVERSATION_MENU_WIDTH - CONVERSATION_MENU_GUTTER);
          const maxTop = Math.max(CONVERSATION_MENU_GUTTER, rect.height - CONVERSATION_MENU_HEIGHT - CONVERSATION_MENU_GUTTER);
          setMenuPosition({
            left: Math.min(Math.max(clientX - rect.left - CONVERSATION_MENU_WIDTH / 2, CONVERSATION_MENU_GUTTER), maxLeft),
            top: Math.min(Math.max(clientY - rect.top - CONVERSATION_MENU_HEIGHT / 2, CONVERSATION_MENU_GUTTER), maxTop),
          });
        }
        pressRef.current = null;
        suppressClickRef.current = true;
        setMenuOpen((value) => !value);
      }, LONG_PRESS_MS),
    };
  };

  const cancelMovedPress = (event: React.PointerEvent<HTMLElement>) => {
    const press = pressRef.current;
    if (!press || event.pointerId !== press.pointerId) return;
    const moved =
      Math.abs(event.clientX - press.x) > LONG_PRESS_MOVE_TOLERANCE ||
      Math.abs(event.clientY - press.y) > LONG_PRESS_MOVE_TOLERANCE;
    if (moved) clearPress();
  };

  return (
    <div
      ref={rowRef}
      onPointerDown={startLongPress}
      onPointerMove={cancelMovedPress}
      onPointerUp={clearPress}
      onPointerCancel={clearPress}
      onContextMenu={(event) => event.preventDefault()}
      className="conversation-row-wrap"
      data-menu-open={menuOpen ? 'true' : 'false'}
      data-long-press-conversation
    >
      <Link
        href={href}
        prefetch={false}
        className={cn('conversation-row group-row', typeClass, pinned && 'pinned')}
        data-menu-open={menuOpen ? 'true' : 'false'}
        onClick={(event) => {
          if (!suppressClickRef.current) return;
          suppressClickRef.current = false;
          event.preventDefault();
        }}
      >
        <div className="conversation-type-rail" aria-hidden="true" />
        <div className="conversation-main">
          <div className="conversation-title">
            <span>{item.title.replace(` ${item.typeLabel}`, '')}</span>
            <ChatBadge>{item.typeLabel}</ChatBadge>
          </div>
          <div className="conversation-kicker">
            <span className="conversation-meta-text">
              G#{item.groupId.toString()}
            </span>
            {(hasUnreadMentionMe || hasUnreadMentionAll || visibleUnreadCount > BigInt(0)) && (
              <span className="conversation-reminders">
                {hasUnreadMentionMe && <span className="conversation-badge mention-me">@我</span>}
                {hasUnreadMentionAll && <span className="conversation-badge mention-all">@全部</span>}
                {visibleUnreadCount > BigInt(0) && (
                  <span className="conversation-badge unread-meta">未读 {visibleUnreadCount.toString()}</span>
                )}
              </span>
            )}
          </div>
        </div>
      </Link>
      {menuOpen && (
        <div
          className="conversation-menu"
          style={{
            left: menuPosition.left,
            top: menuPosition.top,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onTogglePin(item.groupId);
              setMenuOpen(false);
            }}
          >
            {pinned ? '取消置顶' : '置顶'}
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyInbox({
  isConnected,
  tokenSymbol,
}: {
  isConnected: boolean;
  tokenSymbol?: string;
}) {
  return (
    <div className="empty-state text-center">
      <MessagesSquare className="mx-auto mb-2 h-5 w-5 text-secondary" />
      <strong className="block text-greyscale-900">暂无已激活群聊</strong>
      <p className="mt-2 leading-6">
        public-test 当前没有链上群聊记录。可以从当前代币{tokenSymbol ? ` ${tokenSymbol} ` : ' '}开始创建主群或治理群。
      </p>
      {!isConnected && <p className="mt-3 text-secondary">连接钱包后可创建群聊。</p>}
    </div>
  );
}

export function InboxPanel({
  items,
  isPending,
  isConnected,
  tokenSymbol,
  pinnedGroupIds,
  myChainGroupIds,
  recommendedGroupIds,
  readCursors,
  preferencesOpen,
  showBannedMessages,
  showMessageTimes,
  onOpenActivate,
  onTogglePin,
  onTogglePreferences,
  onSetShowBannedMessages,
  onSetShowMessageTimes,
}: {
  items: GroupChatListItem[];
  isPending: boolean;
  isConnected: boolean;
  tokenSymbol?: string;
  pinnedGroupIds: string[];
  myChainGroupIds: bigint[];
  recommendedGroupIds: bigint[];
  readCursors: Record<string, string>;
  preferencesOpen: boolean;
  showBannedMessages: boolean;
  showMessageTimes: boolean;
  onOpenActivate: () => void;
  onTogglePin: (groupId: bigint) => void;
  onTogglePreferences: () => void;
  onSetShowBannedMessages: (value: boolean) => void;
  onSetShowMessageTimes: (value: boolean) => void;
}) {
  const pinnedSet = useMemo(() => new Set(pinnedGroupIds), [pinnedGroupIds]);
  const myChainSet = useMemo(() => new Set(myChainGroupIds.map((groupId) => groupId.toString())), [myChainGroupIds]);
  const recommendedSet = useMemo(
    () => new Set(recommendedGroupIds.map((groupId) => groupId.toString())),
    [recommendedGroupIds],
  );
  const activatedItems = useMemo(
    () => items.filter((item) => item.info?.activated === true),
    [items],
  );
  const pinnedItems = activatedItems.filter((item) => pinnedSet.has(item.groupId.toString()));
  const myChainItems = activatedItems.filter(
    (item) => !pinnedSet.has(item.groupId.toString()) && myChainSet.has(item.groupId.toString()),
  );
  const recommendedItems = activatedItems.filter(
    (item) =>
      !pinnedSet.has(item.groupId.toString()) &&
      !myChainSet.has(item.groupId.toString()) &&
      recommendedSet.has(item.groupId.toString()),
  );
  const hasVisibleItems = pinnedItems.length > 0 || myChainItems.length > 0 || recommendedItems.length > 0;

  return (
    <>
      {isPending && !hasVisibleItems ? (
        <div className="py-10">
          <LoadingIcon />
        </div>
      ) : !hasVisibleItems ? (
        <EmptyInbox isConnected={isConnected} tokenSymbol={tokenSymbol} />
      ) : (
        <section className="conversation-list">
          <div className="conversation-section">
            <div className="conversation-section-label">
              <strong>置顶</strong>
              <span>{pinnedItems.length} 个</span>
            </div>
            {pinnedItems.length ? pinnedItems.map((item) => (
              <ConversationItem
                key={item.groupId.toString()}
                item={item}
                pinned
                readCursor={safeBigIntFromString(readCursors[item.groupId.toString()])}
                tokenSymbol={tokenSymbol}
                onTogglePin={onTogglePin}
              />
            )) : <div className="empty-state compact">暂无置顶群聊</div>}
          </div>
          <div className="conversation-section">
            <div className="conversation-section-label">
              <strong>我的链群</strong>
              <span>{myChainItems.length} 个</span>
            </div>
            {myChainItems.length ? myChainItems.map((item) => (
              <ConversationItem
                key={item.groupId.toString()}
                item={item}
                pinned={false}
                readCursor={safeBigIntFromString(readCursors[item.groupId.toString()])}
                tokenSymbol={tokenSymbol}
                onTogglePin={onTogglePin}
              />
            )) : <div className="empty-state compact">暂无已激活链群</div>}
          </div>
          <div className="conversation-section">
            <div className="conversation-section-label">
              <strong>推荐群聊</strong>
              <span>{recommendedItems.length} 个</span>
            </div>
            {recommendedItems.length ? recommendedItems.map((item) => (
              <ConversationItem
                key={item.groupId.toString()}
                item={item}
                pinned={false}
                readCursor={safeBigIntFromString(readCursors[item.groupId.toString()])}
                tokenSymbol={tokenSymbol}
                onTogglePin={onTogglePin}
              />
            )) : <div className="empty-state compact">暂无更多推荐群聊</div>}
          </div>
        </section>
      )}
      <div className="inbox-action-row">
        <button className="sheet-button inline-flex inbox-preference-button" type="button" onClick={onTogglePreferences}>
          我的偏好
        </button>
        <button className="sheet-button primary inline-flex inbox-activate-button" type="button" onClick={onOpenActivate}>群聊激活</button>
      </div>
      {preferencesOpen && (
        <section className="workspace-band message-preference-panel">
          <div className="card-topline">
            <strong>我的阅读偏好</strong>
            <span>全部群聊</span>
          </div>
          <div className="field-row activation-choice-row">
            <label>显示每条消息时间</label>
            <div className="choice-group">
              <button
                className={cn('picker-button inline-flex', showMessageTimes && 'active')}
                type="button"
                onClick={() => onSetShowMessageTimes(true)}
              >
                开启
              </button>
              <button
                className={cn('picker-button inline-flex', !showMessageTimes && 'active')}
                type="button"
                onClick={() => onSetShowMessageTimes(false)}
              >
                关闭
              </button>
            </div>
          </div>
          <div className="field-row activation-choice-row">
            <label>显示禁言消息</label>
            <div className="choice-group">
              <button
                className={cn('picker-button inline-flex', showBannedMessages && 'active')}
                type="button"
                onClick={() => onSetShowBannedMessages(true)}
              >
                开启
              </button>
              <button
                className={cn('picker-button inline-flex', !showBannedMessages && 'active')}
                type="button"
                onClick={() => onSetShowBannedMessages(false)}
              >
                关闭
              </button>
            </div>
          </div>
        </section>
      )}
      <div className="inbox-bottom-spacer" aria-hidden="true" />
    </>
  );
}
