import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import {
  GROUP_CHAT_JOIN_SCOPE_SOURCE_ADDRESS,
  GROUP_CHAT_MEMBER_SCOPE_ADDRESS,
  useAddGroupMembers,
  useGroupAdminOperatorPermission,
  useGroupMemberIdStatus,
  useGroupMemberIds,
  useRemoveGroupMembers,
} from '@/src/hooks/contracts/useGroupChatModeration';
import { useGroupChatRoomData } from '@/src/hooks/composite/useGroupChatData';
import { useNftOwnerLookup } from '@/src/hooks/extension/base/composite/useNftOwnerLookup';
import { cn } from '@/lib/utils';
import { ChatNftLookupActions } from './ChatNftLookupActions';
import { GroupDetailHeader, useGroupDetailSubtitle } from './ChatGroupDetailHeader';
import { MEMBER_PAGE_SIZE } from './chatConstants';
import {
  managerMemberScopeDescription,
  sameAddress,
} from './chatUtils';
import { useConfirmedTransactionEffect } from './useConfirmedTransactionEffect';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

export function MembersPanel({
  groupId,
  account,
  onChanged,
}: {
  groupId: bigint;
  account: `0x${string}` | undefined;
  onChanged: () => void;
}) {
  const [queryResult, setQueryResult] = useState('');
  const [queryMemberTarget, setQueryMemberTarget] = useState<{ id: bigint; label?: string } | undefined>();
  const [page, setPage] = useState(1);
  const memberOffset = BigInt((Math.max(1, page) - 1) * MEMBER_PAGE_SIZE);
  const room = useGroupChatRoomData(groupId, account);
  const nftLookup = useNftOwnerLookup({ initialMode: 'name' });
  const addTx = useAddGroupMembers();
  const removeTx = useRemoveGroupMembers();
  const managerScope = managerMemberScopeDescription(room.chatInfo?.owner);
  const hasGroupMemberScope = sameAddress(room.chatInfo?.scopeSource, GROUP_CHAT_MEMBER_SCOPE_ADDRESS);
  const hasGroupJoinScope = sameAddress(room.chatInfo?.scopeSource, GROUP_CHAT_JOIN_SCOPE_SOURCE_ADDRESS);
  const hasOpenScope = sameAddress(room.chatInfo?.scopeSource, ZERO_ADDRESS);
  const hasMemberListScope = !managerScope && (hasGroupMemberScope || hasGroupJoinScope);
  const memberPermission = useGroupAdminOperatorPermission(groupId, account, hasMemberListScope);
  const members = useGroupMemberIds(groupId, memberOffset, BigInt(MEMBER_PAGE_SIZE), hasMemberListScope);
  const memberStatus = useGroupMemberIdStatus(groupId, queryMemberTarget?.id, hasMemberListScope && !!queryMemberTarget);
  const isPermissionLoading = hasMemberListScope && (room.isPending || !room.chatInfo || memberPermission.isPending);
  const canEditMembers = hasMemberListScope && memberPermission.canOperate;
  const memberPermissionText = memberPermission.operatorKind === 'owner-or-delegate'
    ? `当前 owner/delegate NFT #${memberPermission.ownerOrDelegateId.toString()} 可维护 GroupMember 成员名单。`
    : memberPermission.operatorKind === 'admin'
      ? `当前 GroupAdmin 管理员 NFT #${memberPermission.adminId.toString()} 可维护 GroupMember 成员名单。`
      : isPermissionLoading
        ? '正在读取成员管理权限。'
        : '当前地址不是 owner/delegate，也没有 GroupAdmin 管理员 NFT；本页只能查看和查询成员名单。';
  const detailSubtitle = useGroupDetailSubtitle(groupId, room);
  const scopeDescription = !room.chatInfo
    ? '正在读取群成员规则。'
    : managerScope
      ? managerScope.text
      : hasGroupMemberScope
        ? '当前群聊使用 GroupMemberScope：普通发言者需要使用 GroupMember 成员名单里的 NFT ID 发言。'
        : hasGroupJoinScope
          ? '当前群聊使用 GroupJoinScopeSource：普通发言者需要使用 GroupMember 成员名单里的 NFT ID，或已通过 GroupJoin 加入该链群的地址发言。'
          : hasOpenScope
            ? '当前群聊未设置 scopeSource：已激活群默认开放发言，任何有效 LOVE20 NFT 持有人都可发言。'
            : '当前群聊使用自定义 scopeSource：发言成员范围由该合约实时判断，前端无法安全枚举成员列表。';
  const sourceRules = [
    { label: 'owner', value: room.chatInfo?.owner, note: '当前群聊 NFT owner' },
    {
      label: 'scopeSource',
      value: room.chatInfo?.scopeSource,
      note: hasOpenScope
        ? '未挂载，默认开放发言'
        : hasMemberListScope
          ? '成员资格源包含 GroupMember 成员名单'
          : '成员资格由该合约规则决定',
    },
    { label: 'banSource', value: room.chatInfo?.banSource, note: '发言禁用规则源' },
    { label: 'beforePostPlugin', value: room.chatInfo?.beforePostPlugin, note: '发言前插件' },
    { label: 'afterPostPlugin', value: room.chatInfo?.afterPostPlugin, note: '发言后插件' },
  ];
  const refetchMembers = useCallback(() => {
    members.refetch();
    onChanged();
  }, [members, onChanged]);
  useConfirmedTransactionEffect(addTx, refetchMembers);
  useConfirmedTransactionEffect(removeTx, refetchMembers);

  const memberTotalPages = Math.max(1, Math.ceil(Number(members.count || BigInt(0)) / MEMBER_PAGE_SIZE));
  const resolvedLookupId = nftLookup.lookupResult?.status === 'resolved' ? nftLookup.lookupResult.tokenId : undefined;

  const describeMember = useCallback((id: bigint, label?: string) => {
    setQueryMemberTarget({ id, label });
  }, []);

  useEffect(() => {
    if (!queryMemberTarget) return;
    if (memberStatus.isPending) {
      setQueryResult(`正在查询 NFT #${queryMemberTarget.id.toString()} 成员资格`);
      return;
    }
    if (memberStatus.isMember === undefined) return;
    setQueryResult(
      `NFT #${queryMemberTarget.id.toString()}${queryMemberTarget.label ? ` · ${queryMemberTarget.label}` : ''} · ${
        memberStatus.isMember ? '已在 GroupMemberScope 成员名单' : '不在 GroupMemberScope 成员名单'
      }`,
    );
  }, [memberStatus.isMember, memberStatus.isPending, queryMemberTarget]);

  useEffect(() => {
    if (!resolvedLookupId || nftLookup.lookupResult?.status !== 'resolved') return;
    describeMember(resolvedLookupId, nftLookup.lookupResult.groupName);
  }, [describeMember, nftLookup.lookupResult, resolvedLookupId]);

  const querySelf = () => {
    if (!room.defaultSenderId) {
      toast.error('当前钱包未设置默认 NFT');
      return;
    }
    nftLookup.setLookupMode('id');
    nftLookup.setLookupValue(room.defaultSenderId.toString());
    describeMember(room.defaultSenderId, room.defaultSenderName);
  };

  const addMember = async () => {
    if (!canEditMembers) {
      toast.error('当前地址没有成员管理权限');
      return;
    }
    if (!resolvedLookupId) {
      toast.error('请先输入并解析有效 NFT');
      return;
    }
    try {
      await addTx.addMemberIds(groupId, [resolvedLookupId]);
      toast.success('已提交加入成员名单');
    } catch (error) {
      console.error(error);
    }
  };

  const removeMember = async (id: bigint) => {
    if (!canEditMembers) {
      toast.error('当前地址没有成员管理权限');
      return;
    }
    try {
      await removeTx.removeMemberIds(groupId, [id]);
      toast.success('已提交移除成员');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section className="workspace-screen">
      <section className="workspace-band">
        <GroupDetailHeader
          title="群成员"
          groupId={groupId}
          subtitle={detailSubtitle}
          meta={
            managerScope
              ? managerScope.label
              : hasMemberListScope
                ? canEditMembers ? '可管理' : '只读'
                : '只读'
          }
        />
        <div className={cn('notice-row', canEditMembers ? 'permission-ok' : managerScope ? '' : 'permission-warn')}>
          {scopeDescription}
        </div>
        {hasMemberListScope && (
          <div className={cn('notice-row', canEditMembers ? 'permission-ok' : 'permission-warn')}>
            {memberPermissionText}
          </div>
        )}
        {managerScope ? null : !hasMemberListScope ? (
          <div className="rule-table mt-3">
            {sourceRules.map((rule) => (
              <div key={rule.label}>
                <span>{rule.label}</span>
                <strong>
                  {rule.value || '读取中'}
                  <small>{rule.note}</small>
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="rule-table mt-3">
              <div>
                <span>scopeSource</span>
                <strong>
                  {room.chatInfo?.scopeSource || '读取中'}
                  <small>
                    {hasGroupJoinScope
                      ? 'GroupMember 成员名单可补充 GroupJoin 参与规则'
                      : '成员名单由 GroupMember 合约维护'}
                  </small>
                </strong>
              </div>
            </div>
            <ChatNftLookupActions
              lookupMode={nftLookup.lookupMode}
              onLookupModeChange={(mode) => {
                nftLookup.setLookupMode(mode);
                setQueryResult('');
                setQueryMemberTarget(undefined);
              }}
              lookupValue={nftLookup.lookupValue}
              onLookupValueChange={(value) => {
                nftLookup.setLookupValue(value);
                setQueryResult('');
                setQueryMemberTarget(undefined);
              }}
              lookupResult={nftLookup.lookupResult}
              onQuerySelf={querySelf}
              onAdd={addMember}
              addLabel="加入成员"
              canAdd={canEditMembers}
            />
            {queryResult && <div className="query-result">{queryResult}</div>}
            <div className="admin-nft-list">
              {members.memberIds.length ? members.memberIds.map((id) => (
                <article className="list-row admin-nft-row" key={id.toString()}>
                  <div>
                    <strong>NFT #{id.toString()}</strong>
                    <small>GroupMemberScope 成员身份</small>
                  </div>
                  <button type="button" onClick={() => removeMember(id)} disabled={!canEditMembers} aria-label="移除">x</button>
                </article>
              )) : members.isPending ? (
                <div className="empty-state">读取中</div>
              ) : <div className="empty-state">暂无记录</div>}
              {members.count !== undefined && members.count > BigInt(MEMBER_PAGE_SIZE) && (
                <div className="pager-row">
                  <button className="sheet-button inline-flex" type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>上一页</button>
                  <span>{Math.min(page, memberTotalPages)} / {memberTotalPages} · {members.count.toString()} 个</span>
                  <button className="sheet-button inline-flex" type="button" disabled={page >= memberTotalPages} onClick={() => setPage((value) => Math.min(memberTotalPages, value + 1))}>下一页</button>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </section>
  );
}
