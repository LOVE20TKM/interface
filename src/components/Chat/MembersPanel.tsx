import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Trash2 } from 'lucide-react';

import {
  GROUP_CHAT_JOIN_SCOPE_SOURCE_ADDRESS,
  GROUP_CHAT_MEMBER_SCOPE_ADDRESS,
  useAddGroupMembers,
  useGroupAdminOperatorPermission,
  useGroupJoinParticipationCount,
  useGroupMemberIdStatus,
  useGroupMemberIds,
  useRemoveGroupMembers,
} from '@/src/hooks/contracts/useGroupChatModeration';
import {
  useGroupChatAccountData,
  useGroupChatPublicData,
  useGroupNames,
} from '@/src/hooks/composite/useGroupChatData';
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
  const [isQueryingSelf, setIsQueryingSelf] = useState(false);
  const [selfQueryNonce, setSelfQueryNonce] = useState(0);
  const [pendingRemoveId, setPendingRemoveId] = useState<bigint | undefined>();
  const [page, setPage] = useState(1);
  const memberOffset = BigInt((Math.max(1, page) - 1) * MEMBER_PAGE_SIZE);
  const publicData = useGroupChatPublicData(groupId);
  const accountData = useGroupChatAccountData(groupId, account, publicData.senderNames);
  const nftLookup = useNftOwnerLookup({ initialMode: 'name' });
  const addTx = useAddGroupMembers();
  const removeTx = useRemoveGroupMembers();
  const managerScope = managerMemberScopeDescription(publicData.chatInfo?.owner);
  const hasGroupMemberScope = sameAddress(publicData.chatInfo?.scopeSource, GROUP_CHAT_MEMBER_SCOPE_ADDRESS);
  const hasGroupJoinScope = sameAddress(publicData.chatInfo?.scopeSource, GROUP_CHAT_JOIN_SCOPE_SOURCE_ADDRESS);
  const hasOpenScope = sameAddress(publicData.chatInfo?.scopeSource, ZERO_ADDRESS);
  const hasMemberListScope = !managerScope && (hasGroupMemberScope || hasGroupJoinScope);
  const memberPermission = useGroupAdminOperatorPermission(groupId, account, hasMemberListScope);
  const members = useGroupMemberIds(groupId, memberOffset, BigInt(MEMBER_PAGE_SIZE), hasMemberListScope);
  const { groupNames: memberNames } = useGroupNames(members.memberIds, members.memberIds.length > 0);
  const memberStatus = useGroupMemberIdStatus(groupId, queryMemberTarget?.id, hasMemberListScope && !!queryMemberTarget);
  const defaultSenderMemberStatus = useGroupMemberIdStatus(
    groupId,
    accountData.defaultSenderId,
    hasMemberListScope && !!accountData.defaultSenderId,
  );
  const joinParticipation = useGroupJoinParticipationCount(groupId, account, hasGroupJoinScope && !!account);
  const isPermissionLoading = hasMemberListScope && (publicData.isPending || !publicData.chatInfo || memberPermission.isPending);
  const canEditMembers = hasMemberListScope && memberPermission.canOperate;
  const memberPermissionText = canEditMembers
    ? '当前链群 NFT 持有者、代理、群管理可维护成员名单。'
    : isPermissionLoading
      ? '正在读取成员管理权限。'
      : '当前地址不是链群 NFT 持有者、代理或群管理；本页只能查看和查询成员名单。';
  const detailSubtitle = useGroupDetailSubtitle(groupId, publicData);
  const scopeDescription = !publicData.chatInfo
    ? '正在读取群成员规则。'
    : managerScope
      ? managerScope.text
      : hasGroupMemberScope
        ? '当前群聊使用 GroupMemberScope：普通发言者需要使用 GroupMember 成员名单里的 NFT ID 发言。'
        : hasGroupJoinScope
          ? '通过此链群参与行动的地址或显式加入成员名单的 NFT，即为群成员，可发言。'
          : hasOpenScope
            ? '当前群聊未设置 scopeSource：已激活群默认开放发言，任何有效 LOVE20 NFT 持有人都可发言。'
            : '当前群聊使用自定义 scopeSource：发言成员范围由该合约实时判断，前端无法安全枚举成员列表。';
  const sourceRules = [
    { label: 'owner', value: publicData.chatInfo?.owner, note: '当前群聊 NFT owner' },
    {
      label: 'scopeSource',
      value: publicData.chatInfo?.scopeSource,
      note: hasOpenScope
        ? '未挂载，默认开放发言'
        : hasMemberListScope
          ? '成员资格源包含 GroupMember 成员名单'
          : '成员资格由该合约规则决定',
    },
    { label: 'banSource', value: publicData.chatInfo?.banSource, note: '发言禁用规则源' },
    { label: 'beforePostPlugin', value: publicData.chatInfo?.beforePostPlugin, note: '发言前插件' },
    { label: 'afterPostPlugin', value: publicData.chatInfo?.afterPostPlugin, note: '发言后插件' },
  ];
  const refetchMembers = useCallback(() => {
    members.refetch();
    onChanged();
  }, [members, onChanged]);
  useConfirmedTransactionEffect(addTx, refetchMembers);
  useConfirmedTransactionEffect(removeTx, refetchMembers);

  const memberTotalPages = Math.max(1, Math.ceil(Number(members.count || BigInt(0)) / MEMBER_PAGE_SIZE));
  const resolvedLookupId = nftLookup.lookupResult?.status === 'resolved' ? nftLookup.lookupResult.tokenId : undefined;
  const isAddingMember = addTx.isPending || addTx.isConfirming;
  const addMemberLabel = addTx.isConfirming ? '确认中' : addTx.isPending ? '提交中' : '加入成员';
  const isRemovingMember = removeTx.isPending || removeTx.isConfirming;

  const describeMember = useCallback((id: bigint, label?: string, queryingSelf: boolean = false) => {
    setIsQueryingSelf(queryingSelf);
    setQueryMemberTarget({ id, label });
  }, []);

  useEffect(() => {
    if (!queryMemberTarget || isQueryingSelf) return;
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
  }, [isQueryingSelf, memberStatus.isMember, memberStatus.isPending, queryMemberTarget]);

  useEffect(() => {
    if (!isQueryingSelf || !hasGroupJoinScope) return;
    if (!publicData.chatInfo) {
      setQueryResult('正在查询当前钱包成员资格');
      return;
    }
    if (!account) {
      setQueryResult('连接钱包后可查看当前地址是否已通过此链群参与行动。');
      return;
    }
    const actionJoinText = joinParticipation.hasJoinedByGroupAction
      ? `当前地址已通过此链群参与行动，可发言。${joinParticipation.count && joinParticipation.count > BigInt(1) ? `关联 ${joinParticipation.count.toString()} 个行动代币。` : ''}`
      : joinParticipation.isPending
        ? '正在读取当前地址是否通过此链群参与行动。'
        : joinParticipation.error
          ? '当前地址的链群行动参与状态读取失败。'
          : '当前地址未通过此链群参与行动。';
    const defaultNftText = accountData.defaultSenderId
      ? defaultSenderMemberStatus.isPending
        ? `正在读取默认 NFT #${accountData.defaultSenderId.toString()} 是否在成员名单。`
        : defaultSenderMemberStatus.error
          ? `默认 NFT #${accountData.defaultSenderId.toString()} 的成员名单状态读取失败。`
          : defaultSenderMemberStatus.isMember
            ? `默认 NFT #${accountData.defaultSenderId.toString()} 已在成员名单，可发言。`
            : `默认 NFT #${accountData.defaultSenderId.toString()} 未加入成员名单。`
      : '当前钱包未设置默认 NFT。';
    setQueryResult(`${actionJoinText} ${defaultNftText}`);
  }, [
    account,
    defaultSenderMemberStatus.error,
    defaultSenderMemberStatus.isMember,
    defaultSenderMemberStatus.isPending,
    hasGroupJoinScope,
    isQueryingSelf,
    joinParticipation.count,
    joinParticipation.error,
    joinParticipation.hasJoinedByGroupAction,
    joinParticipation.isPending,
    publicData.chatInfo,
    accountData.defaultSenderId,
    selfQueryNonce,
  ]);

  useEffect(() => {
    if (isQueryingSelf) return;
    if (!resolvedLookupId || nftLookup.lookupResult?.status !== 'resolved') return;
    describeMember(resolvedLookupId, nftLookup.lookupResult.groupName);
  }, [describeMember, isQueryingSelf, nftLookup.lookupResult, resolvedLookupId]);

  useEffect(() => {
    if (!pendingRemoveId) return;
    if (removeTx.isConfirmed || removeTx.writeError) {
      setPendingRemoveId(undefined);
    }
  }, [pendingRemoveId, removeTx.isConfirmed, removeTx.writeError]);

  const querySelf = () => {
    if (hasGroupJoinScope) {
      setIsQueryingSelf(true);
      setQueryResult('正在查询当前钱包成员资格');
      setSelfQueryNonce((value) => value + 1);
      joinParticipation.refetch();
      defaultSenderMemberStatus.refetch();
      if (accountData.defaultSenderId) {
        nftLookup.setLookupMode('id');
        nftLookup.setLookupValue(accountData.defaultSenderId.toString());
        setQueryMemberTarget({ id: accountData.defaultSenderId, label: accountData.defaultSenderName });
      } else {
        setQueryMemberTarget(undefined);
      }
      return;
    }
    if (!accountData.defaultSenderId) {
      toast.error('当前钱包未设置默认 NFT');
      return;
    }
    nftLookup.setLookupMode('id');
    nftLookup.setLookupValue(accountData.defaultSenderId.toString());
    describeMember(accountData.defaultSenderId, accountData.defaultSenderName, hasGroupJoinScope);
  };

  const addMember = async () => {
    if (!canEditMembers) {
      toast.error('当前地址没有成员管理权限');
      return;
    }
    if (isAddingMember) return;
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
    if (isRemovingMember) return;
    setPendingRemoveId(id);
    try {
      await removeTx.removeMemberIds(groupId, [id]);
      toast.success('已提交移除成员');
    } catch (error) {
      setPendingRemoveId(undefined);
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
        {managerScope || !publicData.chatInfo ? null : !hasMemberListScope ? (
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
            <ChatNftLookupActions
              lookupMode={nftLookup.lookupMode}
              onLookupModeChange={(mode) => {
                nftLookup.setLookupMode(mode);
                setQueryResult('');
                setQueryMemberTarget(undefined);
                setIsQueryingSelf(false);
              }}
              lookupValue={nftLookup.lookupValue}
              onLookupValueChange={(value) => {
                nftLookup.setLookupValue(value);
                setQueryResult('');
                setQueryMemberTarget(undefined);
                setIsQueryingSelf(false);
              }}
              lookupResult={nftLookup.lookupResult}
              onQuerySelf={querySelf}
              onAdd={addMember}
              addLabel={addMemberLabel}
              canAdd={canEditMembers && !isAddingMember}
            />
            {queryResult && <div className="query-result">{queryResult}</div>}
            <div className="admin-nft-list">
              {members.memberIds.length ? members.memberIds.map((id) => (
                <article className="list-row admin-nft-row member-nft-row" key={id.toString()}>
                  <div>
                    <strong>#{id.toString()} {memberNames[id.toString()] || '读取名称中'}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMember(id)}
                    disabled={!canEditMembers || isRemovingMember}
                    aria-label={pendingRemoveId === id && isRemovingMember ? '正在移除成员' : '移除成员'}
                    title={pendingRemoveId === id && isRemovingMember ? (removeTx.isConfirming ? '确认移除中' : '提交移除中') : '移除成员'}
                  >
                    {pendingRemoveId === id && isRemovingMember ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
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
