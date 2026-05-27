import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import {
  useAddGroupAdmins,
  useGroupAdminIds,
  useGroupOwnerOrDelegatePermission,
  useRemoveGroupAdmins,
} from '@/src/hooks/contracts/useGroupChatModeration';
import {
  useGroupChatRoomAccountData,
  useGroupChatRoomPublicData,
  useGroupNames,
} from '@/src/hooks/composite/useGroupChatData';
import { useNftOwnerLookup } from '@/src/hooks/extension/base/composite/useNftOwnerLookup';
import { resolveOwnerManagedChatPermission } from '@/src/lib/groupChatPermissions';
import { cn } from '@/lib/utils';
import { ChatNftLookupActions } from './ChatNftLookupActions';
import { GroupDetailHeader, useGroupDetailSubtitle } from './ChatGroupDetailHeader';
import { isManagerOwnedChat } from './chatUtils';
import { useConfirmedTransactionEffect } from './useConfirmedTransactionEffect';

export function AdminsPanel({
  groupId,
  account,
  onChanged,
}: {
  groupId: bigint;
  account: `0x${string}` | undefined;
  onChanged: () => void;
}) {
  const room = useGroupChatRoomPublicData(groupId);
  const accountRoom = useGroupChatRoomAccountData(groupId, account, room.senderNames);
  const admins = useGroupAdminIds(groupId);
  const adminIds = useMemo(() => admins.adminRecords.map((admin) => admin.id), [admins.adminRecords]);
  const { groupNames: adminNames } = useGroupNames(adminIds);
  const nftLookup = useNftOwnerLookup({ initialMode: 'name' });
  const addTx = useAddGroupAdmins();
  const removeTx = useRemoveGroupAdmins();
  const editPermission = useGroupOwnerOrDelegatePermission(groupId, account);
  const managerOwned = isManagerOwnedChat(room.chatInfo?.owner);
  const ownerPermission = resolveOwnerManagedChatPermission({
    account,
    owner: room.chatInfo?.owner,
    ownerOrDelegateId: editPermission.ownerOrDelegateId,
    isOwnerOrDelegatePending: editPermission.isPending,
    managerOwned,
    hasChatInfo: !!room.chatInfo,
  });
  const isPermissionLoading = ownerPermission.isPending;
  const canEditAdmins = ownerPermission.canEdit;
  const detailSubtitle = useGroupDetailSubtitle(groupId, room);
  const resolvedLookupId = nftLookup.lookupResult?.status === 'resolved' ? nftLookup.lookupResult.tokenId : undefined;
  const [queryResult, setQueryResult] = useState('');

  const refetchAdmins = useCallback(() => {
    admins.refetch();
    onChanged();
  }, [admins, onChanged]);
  useConfirmedTransactionEffect(addTx, refetchAdmins);
  useConfirmedTransactionEffect(removeTx, refetchAdmins);

  const describeAdmin = useCallback((id: bigint, label?: string) => {
    const record = admins.adminRecords.find((item) => item.id.toString() === id.toString());
    const suffix = record
      ? record.isEffective ? '已在 GroupAdmin 管理员名单且当前有效' : '已在 GroupAdmin 管理员名单但当前失效'
      : '不在 GroupAdmin 管理员名单';
    setQueryResult(`NFT #${id.toString()}${label ? ` · ${label}` : ''} · ${suffix}`);
  }, [admins.adminRecords]);

  useEffect(() => {
    if (!resolvedLookupId || nftLookup.lookupResult?.status !== 'resolved') return;
    describeAdmin(resolvedLookupId, nftLookup.lookupResult.groupName);
  }, [describeAdmin, nftLookup.lookupResult, resolvedLookupId]);

  const querySelf = () => {
    if (!accountRoom.defaultSenderId) {
      toast.error('当前钱包未设置默认 NFT');
      return;
    }
    nftLookup.setLookupMode('id');
    nftLookup.setLookupValue(accountRoom.defaultSenderId.toString());
    describeAdmin(accountRoom.defaultSenderId, accountRoom.defaultSenderName);
  };

  const addAdmin = async () => {
    if (!resolvedLookupId) {
      toast.error('请先输入并解析有效 NFT');
      return;
    }
    try {
      await addTx.addAdmins(groupId, [resolvedLookupId]);
      toast.success('已提交加入管理员名单');
    } catch (error) {
      console.error(error);
    }
  };

  const removeAdmin = async (id: bigint) => {
    try {
      await removeTx.removeAdmins(groupId, [id]);
      toast.success('已提交移除管理员');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section className="workspace-screen">
      <section className="workspace-band">
        <GroupDetailHeader
          title="管理员"
          groupId={groupId}
          subtitle={detailSubtitle}
          meta={isPermissionLoading ? '读取中' : managerOwned ? 'Manager 持有 NFT' : canEditAdmins ? '可管理' : '只读'}
        />
        <div className={cn('notice-row', canEditAdmins ? 'permission-ok' : 'permission-warn')}>
          {isPermissionLoading
            ? '正在读取群聊 owner/delegate 与 Manager 状态。'
            : managerOwned
              ? '去中心化群聊由 Manager 持有群聊 NFT；激活后这里没有可修改的管理员名单。'
              : canEditAdmins
                ? '有权限：当前身份是 owner/delegate，可维护 GroupAdmin 管理员 NFT。'
                : '无权限：管理员名单只允许当前 owner 或有效 delegate 修改；本页只能查看和查询。'}
        </div>
        <ChatNftLookupActions
          lookupMode={nftLookup.lookupMode}
          onLookupModeChange={(mode) => {
            nftLookup.setLookupMode(mode);
            setQueryResult('');
          }}
          lookupValue={nftLookup.lookupValue}
          onLookupValueChange={(value) => {
            nftLookup.setLookupValue(value);
            setQueryResult('');
          }}
          lookupResult={nftLookup.lookupResult}
          onQuerySelf={querySelf}
          onAdd={addAdmin}
          addLabel="加入名单"
          canAdd={canEditAdmins}
        />
        {queryResult && <div className="query-result">{queryResult}</div>}
        <div className="admin-nft-list">
          {admins.adminRecords.length ? admins.adminRecords.map((admin) => (
            <article className={cn('list-row admin-nft-row', !admin.isEffective && 'muted-row')} key={admin.id.toString()}>
              <div>
                <strong>NFT #{admin.id.toString()}</strong>
                <small>
                  {adminNames[admin.id.toString()] || `NFT #${admin.id.toString()}`} ·{' '}
                  {admin.isEffective ? '有效管理员身份' : '当前失效：NFT 持有人或默认身份已变化'}
                </small>
              </div>
              <span className={cn('pill', admin.isEffective ? 'pill-good' : 'pill-neutral')}>
                {admin.isEffective ? '有效' : '失效'}
              </span>
              <button type="button" onClick={() => removeAdmin(admin.id)} disabled={!canEditAdmins} aria-label="移除">x</button>
            </article>
          )) : <div className="empty-state">暂无记录</div>}
        </div>
      </section>
    </section>
  );
}
