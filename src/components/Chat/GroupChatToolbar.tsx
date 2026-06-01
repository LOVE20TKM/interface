import { useEffect, useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';

import type { ChatWorkspaceView } from './chatTypes';

export function GroupChatToolbar({
  groupId,
  title,
  messagesCount,
  menuOpen,
  isFollowed,
  onToggleMenu,
  onCloseMenu,
  onToggleFollow,
  onOpenPanel,
}: {
  groupId: bigint;
  title: string;
  messagesCount: bigint | undefined;
  menuOpen: boolean;
  isFollowed: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onToggleFollow: (groupId: bigint) => void;
  onOpenPanel: (view: ChatWorkspaceView) => void;
}) {
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnPointerDown = (event: PointerEvent) => {
      if (toolbarRef.current?.contains(event.target as Node)) return;
      onCloseMenu();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseMenu();
    };

    document.addEventListener('pointerdown', closeOnPointerDown);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnPointerDown);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen, onCloseMenu]);

  const openPanel = (view: ChatWorkspaceView) => {
    onCloseMenu();
    onOpenPanel(view);
  };

  const toggleFollow = () => {
    onCloseMenu();
    onToggleFollow(groupId);
  };

  return (
    <div className="chat-tools" ref={toolbarRef}>
      <div className="chat-tools-copy">
        <strong>{title}</strong>
        <span className="chat-tools-meta">
          G#{groupId.toString()}
          {messagesCount !== undefined ? ` · ${messagesCount.toString()} 条消息` : ''}
        </span>
      </div>
      <button type="button" className="chat-menu-button inline-flex" onClick={onToggleMenu} title="群聊菜单">
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>
      {menuOpen && (
        <div className="chat-menu">
          <button type="button" onClick={toggleFollow}>{isFollowed ? '移出' : '添加'}</button>
          <button type="button" onClick={() => openPanel('members')}>群成员</button>
          <button type="button" onClick={() => openPanel('banList')}>禁言名单</button>
          <button type="button" onClick={() => openPanel('admins')}>管理员</button>
          <button type="button" onClick={() => openPanel('settings')}>群设置</button>
        </div>
      )}
    </div>
  );
}
