import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Info, Loader2, Trash2 } from 'lucide-react';

import {
  useAddGroupAdmins,
  useGroupAdminIds,
  useGroupOwnerOrDelegatePermission,
  useRemoveGroupAdmins,
} from '@/src/hooks/contracts/useGroupChatModeration';
import {
  useGroupChatAccountData,
  useGroupChatPublicData,
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
  const publicData = useGroupChatPublicData(groupId);
  const accountData = useGroupChatAccountData(groupId, account, publicData.senderNames);
  const admins = useGroupAdminIds(groupId);
  const adminIds = useMemo(() => admins.adminRecords.map((admin) => admin.id), [admins.adminRecords]);
  const { groupNames: adminNames } = useGroupNames(adminIds);
  const nftLookup = useNftOwnerLookup({ initialMode: 'name' });
  const addTx = useAddGroupAdmins();
  const removeTx = useRemoveGroupAdmins();
  const editPermission = useGroupOwnerOrDelegatePermission(groupId, account);
  const managerOwned = isManagerOwnedChat(publicData.chatInfo?.owner);
  const ownerPermission = resolveOwnerManagedChatPermission({
    account,
    owner: publicData.chatInfo?.owner,
    ownerOrDelegateId: editPermission.ownerOrDelegateId,
    isOwnerOrDelegatePending: editPermission.isPending,
    managerOwned,
    hasChatInfo: !!publicData.chatInfo,
  });
  const isPermissionLoading = ownerPermission.isPending;
  const canEditAdmins = ownerPermission.canEdit;
  const detailSubtitle = useGroupDetailSubtitle(groupId, publicData);
  const resolvedLookupId = nftLookup.lookupResult?.status === 'resolved' ? nftLookup.lookupResult.tokenId : undefined;
  const [queryResult, setQueryResult] = useState('');
  const [pendingRemoveId, setPendingRemoveId] = useState<bigint | undefined>();
  const [permissionExpanded, setPermissionExpanded] = useState(false);
  const permissionStatusDetail = managerOwned
    ? '这个群由去中心化合约管理；激活后这里没有可修改的管理员名单。'
    : !account
      ? '连接钱包后才能判断当前地址是否可以维护管理员名单。'
      : isPermissionLoading
        ? '管理员名单只允许群主或有效代理身份修改，正在读取当前钱包身份。'
        : canEditAdmins
          ? ownerPermission.accountIsOwner
            ? `当前钱包持有本群身份 #${groupId.toString()}，可以维护管理员名单。`
            : `当前钱包持有代理身份 #${editPermission.ownerOrDelegateId?.toString() || ''}，可以维护管理员名单。`
          : '管理员名单只允许群主或有效代理身份修改；本页只能查看和查询。';
  const permissionSummary = (() => {
    if (managerOwned) return { text: '去中心化合约管理', tone: 'neutral' as const };
    if (!account) return { text: '未知', tone: 'neutral' as const };
    if (isPermissionLoading) return { text: '读取中', tone: 'loading' as const };
    return canEditAdmins
      ? { text: '可管理名单', tone: 'ok' as const }
      : { text: '只读', tone: 'neutral' as const };
  })();

  const refetchAdmins = useCallback(() => {
    admins.refetch();
    onChanged();
  }, [admins, onChanged]);
  useConfirmedTransactionEffect(addTx, refetchAdmins);
  useConfirmedTransactionEffect(removeTx, refetchAdmins);

  const describeAdmin = useCallback((id: bigint, label?: string) => {
    const record = admins.adminRecords.find((item) => item.id.toString() === id.toString());
    const suffix = record
      ? record.isEffective ? '已在管理员名单且当前有效' : '已在管理员名单但当前失效'
      : '不在管理员名单';
    setQueryResult(`NFT #${id.toString()}${label ? ` · ${label}` : ''} · ${suffix}`);
  }, [admins.adminRecords]);

  useEffect(() => {
    if (!resolvedLookupId || nftLookup.lookupResult?.status !== 'resolved') return;
    describeAdmin(resolvedLookupId, nftLookup.lookupResult.groupName);
  }, [describeAdmin, nftLookup.lookupResult, resolvedLookupId]);

  useEffect(() => {
    if (!pendingRemoveId) return;
    if (removeTx.isConfirmed || removeTx.writeError) {
      setPendingRemoveId(undefined);
    }
  }, [pendingRemoveId, removeTx.isConfirmed, removeTx.writeError]);

  const isAddingAdmin = addTx.isPending || addTx.isConfirming;
  const addAdminLabel = addTx.isConfirming ? '确认中' : addTx.isPending ? '提交中' : '加入名单';
  const isRemovingAdmin = removeTx.isPending || removeTx.isConfirming;

  const querySelf = () => {
    if (!accountData.defaultSenderId) {
      toast.error('当前钱包未设置默认 NFT');
      return;
    }
    nftLookup.setLookupMode('id');
    nftLookup.setLookupValue(accountData.defaultSenderId.toString());
    describeAdmin(accountData.defaultSenderId, accountData.defaultSenderName);
  };

  const addAdmin = async () => {
    if (!canEditAdmins) {
      toast.error('当前地址没有管理员名单维护权限');
      return;
    }
    if (isAddingAdmin) return;
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
    if (!canEditAdmins) {
      toast.error('当前地址没有管理员名单维护权限');
      return;
    }
    if (isRemovingAdmin) return;
    setPendingRemoveId(id);
    try {
      await removeTx.removeAdmins(groupId, [id]);
      toast.success('已提交移除管理员');
    } catch (error) {
      setPendingRemoveId(undefined);
      console.error(error);
    }
  };

  return (
    <section className="workspace-screen">
      <section className="workspace-band">
        <GroupDetailHeader
          title="管理员"
          groupId={groupId}
          subtitle={`G#${groupId.toString()} ${detailSubtitle}`}
          actions={(
            <div className="permission-status-inline">
              <span className={cn('pill', permissionSummary.tone === 'ok' ? 'pill-ok' : 'pill-neutral')}>{permissionSummary.text}</span>
              <button
                className="permission-status-info-button"
                type="button"
                aria-label="查看权限原因"
                aria-expanded={permissionExpanded}
                onClick={() => setPermissionExpanded((expanded) => !expanded)}
              >
                <Info size={14} strokeWidth={2.2} aria-hidden="true" />
              </button>
              {permissionExpanded && (
                <span className="permission-status-popover" role="status">
                  {permissionStatusDetail}
                </span>
              )}
            </div>
          )}
        />
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
          addLabel={addAdminLabel}
          canAdd={canEditAdmins && !isAddingAdmin}
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
              <button
                type="button"
                onClick={() => removeAdmin(admin.id)}
                disabled={!canEditAdmins || isRemovingAdmin}
                aria-label={pendingRemoveId === admin.id && isRemovingAdmin ? '正在移除管理员' : '移除管理员'}
                title={pendingRemoveId === admin.id && isRemovingAdmin ? (removeTx.isConfirming ? '确认移除中' : '提交移除中') : '移除管理员'}
              >
                {pendingRemoveId === admin.id && isRemovingAdmin ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </article>
          )) : <div className="empty-state">暂无记录</div>}
        </div>
      </section>
    </section>
  );
}
