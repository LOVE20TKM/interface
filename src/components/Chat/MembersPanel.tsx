import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Info, Loader2, Trash2 } from 'lucide-react';

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
  formatCanPostReason,
  managerMemberScopeDescription,
  sameAddress,
} from './chatUtils';
import { useConfirmedTransactionEffect } from './useConfirmedTransactionEffect';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const BAN_REJECTED_REASON = '0xa9cc8792';

const formatMemberIdentity = (id: bigint, label?: string) => `发言身份 #${id.toString()}${label ? ` · ${label}` : ''}`;

function memberPermissionPillClass(tone: 'ok' | 'loading' | 'neutral') {
  if (tone === 'ok') return 'pill-ok';
  return 'pill-neutral';
}

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
  const [permissionExpanded, setPermissionExpanded] = useState(false);
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
  const isPermissionLoading = hasMemberListScope && !!account && memberPermission.isPending;
  const canEditMembers = hasMemberListScope && memberPermission.canOperate;
  const memberPermissionText = canEditMembers
    ? '有权限：你可以维护本群成员名单。'
    : !account
      ? '连接钱包后可查看成员管理权限；当前只能查看成员名单。'
    : isPermissionLoading
      ? '正在读取成员管理权限。'
      : '当前钱包没有成员管理权限；本页只能查看和查询成员名单。';
  const permissionStatusDetail = !publicData.chatInfo
    ? '正在读取群成员规则。'
    : managerScope
      ? managerScope.text
      : hasMemberListScope
        ? memberPermissionText
        : '这个群当前没有启用可维护的成员名单；发言资格由当前发言范围规则决定。';
  const permissionSummary = (() => {
    if (!publicData.chatInfo) return { text: '读取中', tone: 'loading' as const };
    if (managerScope) return { text: '去中心化合约管理', tone: 'neutral' as const };
    if (!hasMemberListScope) return { text: '未启用', tone: 'neutral' as const };
    if (!account) return { text: '未知', tone: 'neutral' as const };
    if (isPermissionLoading) return { text: '读取中', tone: 'loading' as const };
    return canEditMembers
      ? { text: '可维护成员名单', tone: 'ok' as const }
      : { text: '只读', tone: 'neutral' as const };
  })();
  const detailSubtitle = useGroupDetailSubtitle(groupId, publicData);
  const isPostingStatusPending = Boolean(
    account &&
    (
      accountData.isPending ||
      (hasGroupMemberScope && defaultSenderMemberStatus.isPending) ||
      (hasGroupJoinScope && (joinParticipation.isPending || defaultSenderMemberStatus.isPending))
    ),
  );
  const canPostReasonCode = accountData.canPostReasonCode?.toLowerCase();
  const postingNoticeClass = !publicData.chatInfo || managerScope || !account || isPostingStatusPending
    ? ''
    : accountData.canPost
      ? 'permission-ok'
      : canPostReasonCode === BAN_REJECTED_REASON
        ? 'permission-danger'
        : 'permission-warn';
  const memberScopeDescription = (() => {
    if (!account) {
      return '连接钱包后可查看你能否在此群发言。此群只允许成员名单内的默认发言身份发言。';
    }
    if (isPostingStatusPending) {
      return '正在检查你能否在此群发言。原因：此群只允许成员名单内的默认发言身份发言。';
    }
    if (!accountData.defaultSenderId) {
      return '你暂时不能在此群发言。原因：当前钱包未设置默认发言身份。';
    }
    if (accountData.canPost) {
      return '你可以在此群发言。原因：当前默认发言身份已加入本群成员名单。';
    }
    if (defaultSenderMemberStatus.isMember === false) {
      return '你暂时不能在此群发言。原因：当前默认发言身份未加入本群成员名单。';
    }
    const reason = formatCanPostReason(accountData.canPostReasonCode) || '当前默认发言身份不满足此群发言条件';
    return `你暂时不能在此群发言。原因：${reason}。`;
  })();
  const joinScopeDescription = (() => {
    if (!account) {
      return '连接钱包后可查看你能否在此群发言。此群允许行动参与者，或成员名单内的默认发言身份发言。';
    }
    if (isPostingStatusPending) {
      return '正在检查你能否在此群发言。原因：此群允许行动参与者，或成员名单内的默认发言身份发言。';
    }
    if (!accountData.defaultSenderId) {
      return '你暂时不能在此群发言。原因：当前钱包未设置默认发言身份。';
    }
    if (accountData.canPost) {
      if (joinParticipation.hasJoinedByGroupAction) {
        return '你可以在此群发言。原因：当前钱包已通过此链群参与行动。';
      }
      if (defaultSenderMemberStatus.isMember) {
        return '你可以在此群发言。原因：当前默认发言身份已加入本群成员名单。';
      }
      return '你可以在此群发言。原因：已参与链群行动，或默认发言身份在成员名单中。';
    }
    if (joinParticipation.hasJoinedByGroupAction === false && defaultSenderMemberStatus.isMember === false) {
      return '你暂时不能在此群发言。原因：当前钱包未参与此链群行动，默认发言身份也未加入成员名单。';
    }
    const reason = formatCanPostReason(accountData.canPostReasonCode) || '当前默认发言身份不满足此群发言条件';
    return `你暂时不能在此群发言。原因：${reason}。`;
  })();
  const openScopeDescription = (() => {
    if (!account) {
      return '连接钱包后可查看你能否在此群发言。此群开放发言，默认发言身份有效且未被禁言时即可发送消息。';
    }
    if (isPostingStatusPending) {
      return '正在检查你能否在此群发言。原因：此群开放发言，默认发言身份有效且未被禁言时即可发送消息。';
    }
    if (!accountData.defaultSenderId) {
      return '你暂时不能在此群发言。原因：当前钱包未设置默认发言身份。';
    }
    if (accountData.canPost) {
      return '你可以在此群发言。原因：当前默认发言身份可用，且未被禁言。';
    }
    const reason = formatCanPostReason(accountData.canPostReasonCode) || '当前默认发言身份不满足此群发言条件';
    return `你暂时不能在此群发言。原因：${reason}。`;
  })();
  const customScopeDescription = (() => {
    if (!account) {
      return '连接钱包后可查看你能否在此群发言。此群使用自定义发言规则，成员范围由链上规则实时判断。';
    }
    if (isPostingStatusPending) {
      return '正在检查你能否在此群发言。原因：此群使用自定义发言规则，成员范围由链上规则实时判断。';
    }
    if (!accountData.defaultSenderId) {
      return '你暂时不能在此群发言。原因：当前钱包未设置默认发言身份。';
    }
    if (accountData.canPost) {
      return '你可以在此群发言。原因：当前默认发言身份满足此群自定义发言规则。';
    }
    const reason = formatCanPostReason(accountData.canPostReasonCode) || '当前默认发言身份不满足此群自定义发言规则';
    return `你暂时不能在此群发言。原因：${reason}。`;
  })();
  const scopeDescription = !publicData.chatInfo
    ? '正在读取群成员规则。'
    : managerScope
      ? managerScope.text
      : hasGroupMemberScope
        ? memberScopeDescription
        : hasGroupJoinScope
          ? joinScopeDescription
          : hasOpenScope
            ? openScopeDescription
            : customScopeDescription;
  const sourceRules = [
    { label: 'owner', value: publicData.chatInfo?.owner, note: '当前群聊 NFT owner' },
    {
      label: 'scopeSource',
      value: publicData.chatInfo?.scopeSource,
      note: hasOpenScope
        ? '未挂载，默认开放发言'
        : hasMemberListScope
          ? '发言范围包含本群成员名单'
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
      setQueryResult(`正在查询 ${formatMemberIdentity(queryMemberTarget.id, queryMemberTarget.label)} 是否可发言`);
      return;
    }
    if (memberStatus.isMember === undefined) return;
    const identity = formatMemberIdentity(queryMemberTarget.id, queryMemberTarget.label);
    const memberText = hasGroupJoinScope
      ? memberStatus.isMember
        ? '已加入管理员名单，可发言'
        : '未在管理员添加的成员名单中'
      : memberStatus.isMember
        ? '可以发言，已加入本群成员名单'
        : '暂不能发言，未加入本群成员名单';
    setQueryResult(
      `${identity} · ${memberText}`,
    );
  }, [hasGroupJoinScope, isQueryingSelf, memberStatus.isMember, memberStatus.isPending, queryMemberTarget]);

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
        ? `正在检查 ${formatMemberIdentity(accountData.defaultSenderId, accountData.defaultSenderName)} 是否已加入本群成员名单。`
        : defaultSenderMemberStatus.error
          ? `${formatMemberIdentity(accountData.defaultSenderId, accountData.defaultSenderName)} 的名单状态读取失败。`
          : defaultSenderMemberStatus.isMember
            ? `${formatMemberIdentity(accountData.defaultSenderId, accountData.defaultSenderName)} 已加入本群成员名单，可发言。`
            : `${formatMemberIdentity(accountData.defaultSenderId, accountData.defaultSenderName)} 未加入本群成员名单。`
      : '当前钱包未设置默认发言身份。';
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
    accountData.defaultSenderName,
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
      toast.error('当前钱包未设置默认发言身份');
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
          actions={(
            <div className="permission-status-inline">
              <span className={cn('pill', memberPermissionPillClass(permissionSummary.tone))}>{permissionSummary.text}</span>
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
                  {permissionStatusDetail || permissionSummary.text}
                </span>
              )}
            </div>
          )}
        />
        <div className={cn('notice-row', postingNoticeClass)}>
          {scopeDescription}
        </div>
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
