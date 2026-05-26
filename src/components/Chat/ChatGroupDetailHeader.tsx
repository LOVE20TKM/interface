import {
  useGroupChatManagedTitle,
  type GroupChatRoomData,
} from '@/src/hooks/composite/useGroupChatData';
import { cn } from '@/lib/utils';
import { isManagerOwnedChat } from './chatUtils';

export function useGroupDetailSubtitle(groupId: bigint, room: GroupChatRoomData) {
  const managedTitle = useGroupChatManagedTitle(groupId);
  const managerOwned = isManagerOwnedChat(room.chatInfo?.owner);

  return (
    managedTitle.title ||
    (!managerOwned && !managedTitle.isPending ? room.groupName : '') ||
    `群聊 #${groupId.toString()}`
  );
}

export function GroupDetailHeader({
  title,
  groupId,
  subtitle,
  meta,
}: {
  title: string;
  groupId: bigint;
  subtitle?: string;
  meta?: string;
}) {
  return (
    <div className="screen-heading group-detail-heading">
      <div className="group-detail-title">
        <h1>{title}</h1>
        <span>{subtitle || `群聊 #${groupId.toString()}`}</span>
      </div>
      {meta && <span className={cn('pill', meta === '只读' ? 'pill-warn' : 'pill-ok')}>{meta}</span>}
    </div>
  );
}
