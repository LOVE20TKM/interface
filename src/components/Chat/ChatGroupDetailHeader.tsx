import {
  useGroupChatManagedTitle,
  type GroupChatPublicData,
} from '@/src/hooks/composite/useGroupChatData';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { isManagerOwnedChat } from './chatUtils';

export function useGroupDetailSubtitle(groupId: bigint, data: GroupChatPublicData) {
  const managedTitle = useGroupChatManagedTitle(groupId);
  const managerOwned = isManagerOwnedChat(data.chatInfo?.owner);

  return (
    managedTitle.title ||
    (!managerOwned && !managedTitle.isPending ? data.groupName : '') ||
    `群聊 #${groupId.toString()}`
  );
}

export function GroupDetailHeader({
  title,
  groupId,
  subtitle,
  meta,
  actions,
}: {
  title: string;
  groupId: bigint;
  subtitle?: string;
  meta?: string;
  actions?: ReactNode;
}) {
  const warnMeta = meta === '只读' || meta === '不可管理名单';
  const neutralMeta =
    meta === '读取中' ||
    meta === '无成员名单' ||
    meta === '成员名单' ||
    meta === '名单 + 行动参与' ||
    meta === '开放发言' ||
    meta === '自定义规则';

  return (
    <div className="screen-heading group-detail-heading">
      <div className="group-detail-title">
        <h1>{title}</h1>
        <span>{subtitle || `群聊 #${groupId.toString()}`}</span>
      </div>
      {(meta || actions) && (
        <div className="group-detail-actions">
          {actions}
          {meta && <span className={cn('pill', warnMeta ? 'pill-warn' : neutralMeta ? 'pill-neutral' : 'pill-ok')}>{meta}</span>}
        </div>
      )}
    </div>
  );
}
