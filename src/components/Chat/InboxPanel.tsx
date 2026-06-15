import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { MessagesSquare, MoreHorizontal } from "lucide-react";

import LoadingIcon from "@/src/components/Common/LoadingIcon";
import { useGroupChatSyncState } from "@/src/contexts/GroupChatSyncContext";
import type { GroupChatListItem } from "@/src/hooks/composite/useGroupChatData";
import { cn } from "@/lib/utils";
import { suppressNextRouteLoading } from "@/src/lib/routeLoading";
import { ChatBadge } from "./ChatBadge";
import { LONG_PRESS_MOVE_TOLERANCE, LONG_PRESS_MS } from "./chatConstants";
import {
  GROUP_CHAT_RECOMMENDATION_REASON_LABELS,
  GROUP_CHAT_RECOMMENDATION_REASON_RANK,
  type GroupChatRecommendationReason,
  type GroupChatRecommendationSignal,
} from "./chatTypes";
import { buildGroupChatDetailHref, buildGroupChatDetailUrl, safeBigIntFromString } from "./chatUtils";

const CONVERSATION_MENU_WIDTH = 132;
const CONVERSATION_MENU_HEIGHT = 44;
const CONVERSATION_MENU_GUTTER = 8;

function ConversationItem({
  item,
  followed,
  recommendationReasonLabel,
  readCursor,
  tokenSymbol,
  onToggleFollow,
}: {
  item: GroupChatListItem;
  followed: boolean;
  recommendationReasonLabel?: string;
  readCursor: bigint;
  tokenSymbol?: string;
  onToggleFollow: (groupId: bigint) => void;
}) {
  const router = useRouter();
  const typeClass = `conversation-type-${item.kind}`;
  const syncState = useGroupChatSyncState(item.groupId);
  const effectiveMessagesCount =
    syncState.messagesCount && syncState.messagesCount > item.messagesCount
      ? syncState.messagesCount
      : item.messagesCount;
  const rawUnreadCount = effectiveMessagesCount > readCursor ? effectiveMessagesCount - readCursor : BigInt(0);
  const visibleUnreadCount = syncState.unreadCount > rawUnreadCount ? syncState.unreadCount : rawUnreadCount;
  const hasUnreadMentionMe = syncState.unreadMentionMeCount > BigInt(0) || item.latestMentionMeMessageId > readCursor;
  const hasUnreadMentionAll =
    syncState.unreadMentionAllCount > BigInt(0) || item.latestMentionAllMessageId > readCursor;
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: CONVERSATION_MENU_GUTTER, top: CONVERSATION_MENU_GUTTER });
  const rowRef = useRef<HTMLDivElement | null>(null);
  const href = buildGroupChatDetailHref(item.groupId);
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

    document.addEventListener("pointerdown", closeOnPointerDown);
    return () => document.removeEventListener("pointerdown", closeOnPointerDown);
  }, [menuOpen]);

  const startLongPress = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest(".conversation-menu")) {
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
          const maxLeft = Math.max(
            CONVERSATION_MENU_GUTTER,
            rect.width - CONVERSATION_MENU_WIDTH - CONVERSATION_MENU_GUTTER,
          );
          const maxTop = Math.max(
            CONVERSATION_MENU_GUTTER,
            rect.height - CONVERSATION_MENU_HEIGHT - CONVERSATION_MENU_GUTTER,
          );
          setMenuPosition({
            left: Math.min(
              Math.max(clientX - rect.left - CONVERSATION_MENU_WIDTH / 2, CONVERSATION_MENU_GUTTER),
              maxLeft,
            ),
            top: Math.min(
              Math.max(clientY - rect.top - CONVERSATION_MENU_HEIGHT / 2, CONVERSATION_MENU_GUTTER),
              maxTop,
            ),
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
      data-menu-open={menuOpen ? "true" : "false"}
      data-long-press-conversation
    >
      <Link
        href={href}
        prefetch={false}
        className={cn("conversation-row group-row", typeClass, followed && "pinned")}
        data-menu-open={menuOpen ? "true" : "false"}
        onClick={(event) => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            event.preventDefault();
            return;
          }
          suppressNextRouteLoading(href);
          event.preventDefault();
          router.push(buildGroupChatDetailUrl(item.groupId));
        }}
      >
        <div className="conversation-main">
          <div className="conversation-title">
            <span>{item.title.replace(` ${item.typeLabel}`, "")}</span>
            <ChatBadge>{item.typeLabel}</ChatBadge>
          </div>
          <div className="conversation-kicker">
            <span className="conversation-meta-text">G#{item.groupId.toString()}</span>
            {recommendationReasonLabel && (
              <span className="conversation-badge recommendation-reason">
                {recommendationReasonLabel}
              </span>
            )}
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
      {!followed && (
        <button
          type="button"
          className="conversation-follow-button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFollow(item.groupId);
          }}
        >
          添加
        </button>
      )}
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
              onToggleFollow(item.groupId);
              setMenuOpen(false);
            }}
          >
            {followed ? "移出" : "添加"}
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyInbox({ isConnected, tokenSymbol }: { isConnected: boolean; tokenSymbol?: string }) {
  return (
    <div className="empty-state text-center">
      <MessagesSquare className="mx-auto mb-2 h-5 w-5 text-secondary" />
      <strong className="block text-greyscale-900">暂无已激活群聊</strong>
      <p className="mt-2 leading-6">
        当前没有链上群聊记录。可以从当前代币{tokenSymbol ? ` ${tokenSymbol} ` : " "}开始创建主群或治理群。
      </p>
      {!isConnected && <p className="mt-3 text-secondary">连接钱包后可创建群聊。</p>}
    </div>
  );
}

function InboxHeaderMenu({
  onOpenAddGroup,
  onOpenActivate,
  onOpenPreferences,
}: {
  onOpenAddGroup: () => void;
  onOpenActivate: () => void;
  onOpenPreferences: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const closeOnPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const runMenuAction = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="inbox-menu-root" ref={menuRef}>
      <button
        className="inbox-menu-button"
        type="button"
        title="我的群聊菜单"
        aria-label="打开我的群聊菜单"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>
      {open && (
        <div className="inbox-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => runMenuAction(onOpenAddGroup)}>
            添加群聊
          </button>
          <button type="button" role="menuitem" onClick={() => runMenuAction(onOpenPreferences)}>
            我的偏好
          </button>
          <button type="button" role="menuitem" onClick={() => runMenuAction(onOpenActivate)}>
            激活群聊
          </button>
        </div>
      )}
    </div>
  );
}

export function InboxPanel({
  followedItems,
  recommendedItems,
  isPending,
  isConnected,
  tokenSymbol,
  recommendationSignals,
  readCursors,
  onOpenAddGroup,
  onOpenActivate,
  onOpenPreferences,
  onToggleFollow,
}: {
  followedItems: GroupChatListItem[];
  recommendedItems: GroupChatListItem[];
  isPending: boolean;
  isConnected: boolean;
  tokenSymbol?: string;
  recommendationSignals: GroupChatRecommendationSignal[];
  readCursors: Record<string, string>;
  onOpenAddGroup: () => void;
  onOpenActivate: () => void;
  onOpenPreferences: () => void;
  onToggleFollow: (groupId: bigint) => void;
}) {
  const recommendationReasonByGroup = useMemo(() => {
    const map: Record<string, { reason: GroupChatRecommendationReason; label: string }> = {};
    recommendationSignals.forEach((signal) => {
      const key = signal.groupId.toString();
      const current = map[key];
      const label = signal.reasonLabel || GROUP_CHAT_RECOMMENDATION_REASON_LABELS[signal.reason];
      if (
        !current ||
        GROUP_CHAT_RECOMMENDATION_REASON_RANK[signal.reason] > GROUP_CHAT_RECOMMENDATION_REASON_RANK[current.reason]
      ) {
        map[key] = {
          reason: signal.reason,
          label,
        };
      }
    });
    return map;
  }, [recommendationSignals]);
  const hasVisibleItems = followedItems.length > 0 || recommendedItems.length > 0;

  return (
    <>
      {isPending && !hasVisibleItems ? (
        <div className="py-10">
          <LoadingIcon />
        </div>
      ) : (
        <section className="conversation-list">
          <div className="conversation-section">
            <div className="conversation-section-label conversation-section-heading">
              <div className="conversation-section-title">
                <strong>我的群聊</strong>
                <span>{followedItems.length} 个</span>
              </div>
              <InboxHeaderMenu
                onOpenAddGroup={onOpenAddGroup}
                onOpenActivate={onOpenActivate}
                onOpenPreferences={onOpenPreferences}
              />
            </div>
            {followedItems.length ? (
              followedItems.map((item) => (
                <ConversationItem
                  key={item.groupId.toString()}
                  item={item}
                  followed
                  recommendationReasonLabel={recommendationReasonByGroup[item.groupId.toString()]?.label}
                  readCursor={safeBigIntFromString(readCursors[item.groupId.toString()])}
                  tokenSymbol={tokenSymbol}
                  onToggleFollow={onToggleFollow}
                />
              ))
            ) : (
              <div className="empty-state compact">
                暂无已关注群聊，可在下方推荐群聊点击添加，或点击右上角菜单添加群聊
              </div>
            )}
          </div>
          {hasVisibleItems ? (
            <div className="conversation-section">
              <div className="conversation-section-label">
                <strong>推荐群聊</strong>
                <span>{recommendedItems.length} 个</span>
              </div>
              {recommendedItems.length ? (
                recommendedItems.map((item) => (
                  <ConversationItem
                    key={item.groupId.toString()}
                    item={item}
                    followed={false}
                    recommendationReasonLabel={recommendationReasonByGroup[item.groupId.toString()]?.label}
                    readCursor={safeBigIntFromString(readCursors[item.groupId.toString()])}
                    tokenSymbol={tokenSymbol}
                    onToggleFollow={onToggleFollow}
                  />
                ))
              ) : (
                <div className="empty-state compact">暂无更多推荐群聊</div>
              )}
            </div>
          ) : (
            <EmptyInbox isConnected={isConnected} tokenSymbol={tokenSymbol} />
          )}
        </section>
      )}
      <div className="inbox-bottom-spacer" aria-hidden="true" />
    </>
  );
}
