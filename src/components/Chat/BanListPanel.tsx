import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { ChevronDown, Copy } from 'lucide-react';

import { TokenContext } from '@/src/contexts/TokenContext';
import { useGroupChatVotingPower } from '@/src/hooks/contracts/useGroupChatManagers';
import {
  GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS,
  GROUP_CHAT_GOV_VOTED_BAN_SOURCE_ADDRESS,
  isGovVotedBanSourceEnabled,
  isGroupBanListEnabled,
  useAdminBanQuery,
  useBanSenderAddresses,
  useBanSenderIds,
  useBanSenders,
  useGovClearVoteBySender,
  useGovBanQuery,
  useGovClearVoteBySenderAddress,
  useGovClearVoteBySenderId,
  useGovRefreshVoteBySenderAddress,
  useGovRefreshVoteBySenderId,
  useGovVoteBySenderAddress,
  useGovVoteBySenderId,
  useGovVoteBySender,
  useGovSenderVoteWeightsByVoter,
  useGovVotersByTarget,
  useGovVotedBanLists,
  useGovVotedBanMechanism,
  useGovVotedBanStateVersion,
  useGroupAdminOperatorPermission,
  useGroupBanLists,
  useUnbanSenderAddresses,
  useUnbanSenderIds,
  useUnbanSenders,
} from '@/src/hooks/contracts/useGroupChatModeration';
import { useGroupChatMessage } from '@/src/hooks/contracts/useGroupChat';
import {
  useGroupChatAccountData,
  useGroupChatPublicData,
  useGroupNames,
  parseGroupChatMessage,
} from '@/src/hooks/composite/useGroupChatData';
import { useNftOwnerLookup } from '@/src/hooks/extension/base/composite/useNftOwnerLookup';
import { abbreviateAddress } from '@/src/lib/format';
import { cn } from '@/lib/utils';
import { BanListQueryControls } from './BanListQueryControls';
import { AdminBanListRows, GovBanListRows } from './BanListRows';
import { GroupDetailHeader, useGroupDetailSubtitle } from './ChatGroupDetailHeader';
import { GovVoterSheet } from './GovVoterSheet';
import { BAN_LIST_PAGE_SIZE } from './chatConstants';
import {
  formatGovWeightShare,
  govBanListMechanismText,
  parseAddressInput,
  sameAddress,
} from './chatUtils';
import {
  useBanListPanelState,
  type BanListTarget,
} from './useBanListPanelState';
import { useConfirmedTransactionEffect } from './useConfirmedTransactionEffect';

type TransactionState = {
  isPending: boolean;
  isConfirming: boolean;
};

function transactionLabel(transaction: TransactionState, pendingLabel = '等待钱包确认', confirmingLabel = '链上确认中') {
  if (transaction.isConfirming) return confirmingLabel;
  if (transaction.isPending) return pendingLabel;
  return undefined;
}

function banStatusPillClass(tone: 'danger' | 'ok' | 'loading' | 'neutral') {
  if (tone === 'danger') return 'pill-bad';
  if (tone === 'ok') return 'pill-ok';
  if (tone === 'loading') return 'pill-neutral';
  return 'pill-warn';
}

function adminBanPermissionReason(permission: {
  canOperate: boolean;
  operatorKind?: string;
  ownerOrDelegateId: bigint;
  adminId: bigint;
}, groupId: bigint) {
  if (!permission.canOperate) {
    return `当前钱包没有维护身份。需要持有本群 NFT #${groupId.toString()}，或成为代理/管理员 NFT 持有者。`;
  }
  if (permission.operatorKind === 'owner-or-delegate') {
    if (permission.ownerOrDelegateId === groupId) {
      return `持有本群 NFT #${groupId.toString()}。`;
    }
    return `持有代理 NFT #${permission.ownerOrDelegateId.toString()}，它已被本群 NFT #${groupId.toString()} 设为代理。`;
  }
  if (permission.operatorKind === 'admin') {
    return `当前钱包持有管理员 NFT #${permission.adminId.toString()}，它在本群管理员名单中且仍然有效。`;
  }
  return '当前钱包有本群管理权限。';
}

function govBanPermissionReason({
  canVote,
  voteWeight,
  totalVoteWeight,
  ruleText,
}: {
  canVote: boolean;
  voteWeight: bigint;
  totalVoteWeight: bigint;
  ruleText: string;
}) {
  const ruleSuffix = ruleText ? `禁言生效规则：${ruleText}` : '';
  if (!canVote) {
    return '当前钱包没有有效治理票，所以只能查看和查询；质押 LP 获取有效治理票后可参与投票。';
  }
  return [
    `当前钱包有 ${formatGovWeightShare(voteWeight, totalVoteWeight)} 有效治理票，可参与禁言投票。`,
    ruleSuffix,
  ].filter(Boolean).join(' ');
}

export function BanListPanel({
  groupId,
  account,
  initialMessageId,
  onChanged,
}: {
  groupId: bigint;
  account: `0x${string}` | undefined;
  initialMessageId?: bigint;
  onChanged: () => void;
}) {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const publicData = useGroupChatPublicData(groupId);
  const accountData = useGroupChatAccountData(groupId, account, publicData.senderNames);
  const [activeMessageId, setActiveMessageId] = useState<bigint | undefined>(initialMessageId);
  const [permissionExpanded, setPermissionExpanded] = useState(false);
  const messageQuery = useGroupChatMessage(groupId, activeMessageId, !!activeMessageId);
  const messageTarget = useMemo(
    () => parseGroupChatMessage(messageQuery.message),
    [messageQuery.message],
  );
  const activeAdminBanSource = sameAddress(publicData.chatInfo?.banSource, GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS);
  const activeGovBanSource = sameAddress(publicData.chatInfo?.banSource, GROUP_CHAT_GOV_VOTED_BAN_SOURCE_ADDRESS);
  const {
    queryType,
    setQueryType,
    queryInput,
    setQueryInput,
    queryTarget,
    setQueryTarget,
    activeGovTarget,
    setActiveGovTarget,
    voterPage,
    setVoterPage,
    voterQuery,
    setVoterQuery,
    voterQueryResult,
    setVoterQueryResult,
    adminPage,
    setAdminPage,
    govPage,
    setGovPage,
    activeBanListMenuKey,
    setActiveBanListMenuKey,
    adminOffset,
    govOffset,
    voterOffset,
  } = useBanListPanelState();
  useEffect(() => {
    if (!initialMessageId) return;
    setQueryType('message');
  }, [initialMessageId, setQueryType]);
  useEffect(() => {
    if (!initialMessageId || queryType !== 'message') return;
    setQueryInput(initialMessageId.toString());
    setActiveMessageId(initialMessageId);
  }, [initialMessageId, queryType, setQueryInput]);
  useEffect(() => {
    if (queryType !== 'message') {
      setActiveMessageId(undefined);
    }
  }, [queryType]);
  const listMode = queryType === 'address' || queryType === 'nft' ? queryType : undefined;
  const listQueryType = listMode || 'address';
  const nftLookup = useNftOwnerLookup({ enabled: queryType === 'nft', initialMode: 'name' });
  const adminBan = useGroupBanLists(
    groupId,
    adminOffset,
    BigInt(BAN_LIST_PAGE_SIZE),
    adminOffset,
    BigInt(BAN_LIST_PAGE_SIZE),
    !!listMode && isGroupBanListEnabled && activeAdminBanSource,
  );
  const govBan = useGovVotedBanLists(
    groupId,
    govOffset,
    BigInt(BAN_LIST_PAGE_SIZE),
    govOffset,
    BigInt(BAN_LIST_PAGE_SIZE),
    account,
    !!listMode && isGovVotedBanSourceEnabled && activeGovBanSource,
  );
  const adminQuery = useAdminBanQuery(
    groupId,
    queryTarget?.type || listQueryType,
    queryTarget?.type === 'address' ? queryTarget.value : undefined,
    queryTarget?.type === 'nft' ? queryTarget.value : undefined,
    !!queryTarget && activeAdminBanSource,
  );
  const adminMessageAddressQuery = useAdminBanQuery(
    groupId,
    'address',
    messageTarget?.senderAddress,
    undefined,
    !!messageTarget?.senderAddress && activeAdminBanSource,
  );
  const adminMessageNftQuery = useAdminBanQuery(
    groupId,
    'nft',
    undefined,
    messageTarget?.senderId,
    !!messageTarget?.senderId && activeAdminBanSource,
  );
  const govQuery = useGovBanQuery(
    groupId,
    queryTarget?.type || listQueryType,
    queryTarget?.type === 'address' ? queryTarget.value : undefined,
    queryTarget?.type === 'nft' ? queryTarget.value : undefined,
    !!queryTarget && activeGovBanSource,
  );
  const govMessageAddressQuery = useGovBanQuery(
    groupId,
    'address',
    messageTarget?.senderAddress,
    undefined,
    !!messageTarget?.senderAddress && activeGovBanSource,
  );
  const govMessageNftQuery = useGovBanQuery(
    groupId,
    'nft',
    undefined,
    messageTarget?.senderId,
    !!messageTarget?.senderId && activeGovBanSource,
  );
  const govMessageSenderMyVote = useGovSenderVoteWeightsByVoter(
    groupId,
    messageTarget?.senderId,
    messageTarget?.senderAddress,
    account,
    !!messageTarget && activeGovBanSource,
  );
  const myGovVote = useGovSenderVoteWeightsByVoter(
    groupId,
    accountData.defaultSenderId,
    account,
    account,
    !!accountData.defaultSenderId && !!account && activeGovBanSource,
  );
  const myAddressBan = useAdminBanQuery(
    groupId,
    'address',
    account,
    undefined,
    !!account && activeAdminBanSource,
  );
  const myNftBan = useAdminBanQuery(
    groupId,
    'nft',
    undefined,
    accountData.defaultSenderId,
    !!accountData.defaultSenderId && activeAdminBanSource,
  );
  const myGovAddressBan = useGovBanQuery(
    groupId,
    'address',
    account,
    undefined,
    !!account && activeGovBanSource,
  );
  const myGovNftBan = useGovBanQuery(
    groupId,
    'nft',
    undefined,
    accountData.defaultSenderId,
    !!accountData.defaultSenderId && activeGovBanSource,
  );
  const govVoters = useGovVotersByTarget(
    groupId,
    activeGovTarget?.type || 'address',
    activeGovTarget?.type === 'address' ? activeGovTarget.value : undefined,
    activeGovTarget?.type === 'nft' ? activeGovTarget.value : undefined,
    voterOffset,
    BigInt(BAN_LIST_PAGE_SIZE),
    !!activeGovTarget,
  );
  const banAddressTx = useBanSenderAddresses();
  const unbanAddressTx = useUnbanSenderAddresses();
  const banSenderTx = useBanSenderIds();
  const unbanSenderTx = useUnbanSenderIds();
  const banMessageSenderTx = useBanSenders();
  const unbanMessageSenderTx = useUnbanSenders();
  const voteAddressTx = useGovVoteBySenderAddress();
  const voteSenderTx = useGovVoteBySenderId();
  const voteMessageSenderTx = useGovVoteBySender();
  const clearAddressTx = useGovClearVoteBySenderAddress();
  const clearSenderTx = useGovClearVoteBySenderId();
  const clearMessageSenderTx = useGovClearVoteBySender();
  const refreshAddressTx = useGovRefreshVoteBySenderAddress();
  const refreshSenderTx = useGovRefreshVoteBySenderId();
  const adminBanPermission = useGroupAdminOperatorPermission(groupId, account, activeAdminBanSource);
  const govVotingPower = useGroupChatVotingPower(groupId, publicData.chatInfo?.owner, account, activeGovBanSource);
  const govBanMechanism = useGovVotedBanMechanism(activeGovBanSource);
  const govBanStateVersion = useGovVotedBanStateVersion(groupId, activeGovBanSource);
  const canEditAdminBan = activeAdminBanSource && adminBanPermission.canOperate;
  const canVoteGovBan = activeGovBanSource && govVotingPower.voteWeight > BigInt(0);
  const anyBanListTxPending = [
    banAddressTx,
    unbanAddressTx,
    banSenderTx,
    unbanSenderTx,
    banMessageSenderTx,
    unbanMessageSenderTx,
    voteAddressTx,
    voteSenderTx,
    voteMessageSenderTx,
    clearAddressTx,
    clearSenderTx,
    clearMessageSenderTx,
    refreshAddressTx,
    refreshSenderTx,
  ].some((tx) => tx.isPending || tx.isConfirming);
  const addAddressBanLabel = transactionLabel(banAddressTx, '等待钱包确认', '地址禁言确认中');
  const addSenderBanLabel = transactionLabel(banSenderTx, '等待钱包确认', 'NFT禁言确认中');
  const banMessageSenderLabel = transactionLabel(banMessageSenderTx, '等待钱包确认', '禁言确认中');
  const unbanMessageSenderLabel = transactionLabel(unbanMessageSenderTx, '等待钱包确认', '解除确认中');
  const voteMessageSenderLabel = transactionLabel(voteMessageSenderTx, '等待钱包确认', '投票确认中');
  const clearMessageSenderLabel = transactionLabel(clearMessageSenderTx, '等待钱包确认', '撤票确认中');
  const opposeMyBanLabel = transactionLabel(voteMessageSenderTx, '等待钱包确认', '反对确认中');
  const adminPermissionRuleText = '持有本群 NFT、被设为代理，或持有本群有效管理员 NFT 的钱包可以维护禁言名单。';
  const detailSubtitle = useGroupDetailSubtitle(groupId, publicData);
  const govBanRuleText = activeGovBanSource && !govVotingPower.isPending && !govBanMechanism.isPending
    ? govBanListMechanismText(govVotingPower.totalVoteWeight, govBanMechanism.banThresholdRatio, govBanMechanism.precision, govBanMechanism.minSupportToOpposeRatio)
    : '';
  const permissionStatusDetail = !account
    ? '连接钱包后才能判断当前地址是否可维护禁言名单或参与治理禁言。'
    : activeAdminBanSource
      ? adminBanPermission.isPending
        ? adminPermissionRuleText
        : adminBanPermissionReason(adminBanPermission, groupId)
      : activeGovBanSource
        ? govVotingPower.isPending || govBanMechanism.isPending
          ? '持有有效治理票的地址可参与治理禁言投票。'
          : govBanPermissionReason({
            canVote: canVoteGovBan,
            voteWeight: govVotingPower.voteWeight,
            totalVoteWeight: govVotingPower.totalVoteWeight,
            ruleText: govBanRuleText,
          })
        : '这个群当前没有启用可维护或可投票的禁言源。';
  const permissionSummary = (() => {
    if (!account) {
      return { text: '未知', tone: 'neutral' as const };
    }
    if (activeAdminBanSource) {
      if (adminBanPermission.isPending) return { text: '读取中', tone: 'loading' as const };
      return canEditAdminBan
        ? { text: '可维护禁言名单', tone: 'ok' as const }
        : { text: '只读', tone: 'neutral' as const };
    }
    if (activeGovBanSource) {
      if (govVotingPower.isPending || govBanMechanism.isPending) return { text: '读取中', tone: 'loading' as const };
      return canVoteGovBan
        ? { text: '可投票', tone: 'ok' as const }
        : { text: '只读', tone: 'neutral' as const };
    }
    return { text: '未启用', tone: 'neutral' as const };
  })();
  const canAddBanListTarget = activeAdminBanSource || activeGovBanSource;
  const refetchAdminBan = useCallback(() => {
    adminBan.refetch();
    onChanged();
  }, [adminBan, onChanged]);
  const refetchGovBan = useCallback(() => {
    govBan.refetch();
    govBanStateVersion.refetch();
    onChanged();
  }, [govBan, govBanStateVersion, onChanged]);
  const refetchGovVotersAndBan = useCallback(() => {
    govVoters.refetch();
    govBan.refetch();
    govBanStateVersion.refetch();
    onChanged();
  }, [govBan, govBanStateVersion, govVoters, onChanged]);
  useConfirmedTransactionEffect(banAddressTx, refetchAdminBan);
  useConfirmedTransactionEffect(unbanAddressTx, refetchAdminBan);
  useConfirmedTransactionEffect(banSenderTx, refetchAdminBan);
  useConfirmedTransactionEffect(unbanSenderTx, refetchAdminBan);
  useConfirmedTransactionEffect(banMessageSenderTx, refetchAdminBan);
  useConfirmedTransactionEffect(unbanMessageSenderTx, refetchAdminBan);
  useConfirmedTransactionEffect(voteAddressTx, refetchGovBan);
  useConfirmedTransactionEffect(voteSenderTx, refetchGovBan);
  useConfirmedTransactionEffect(voteMessageSenderTx, refetchGovBan);
  useConfirmedTransactionEffect(clearAddressTx, refetchGovBan);
  useConfirmedTransactionEffect(clearSenderTx, refetchGovBan);
  useConfirmedTransactionEffect(clearMessageSenderTx, refetchGovBan);
  useConfirmedTransactionEffect(refreshAddressTx, refetchGovVotersAndBan);
  useConfirmedTransactionEffect(refreshSenderTx, refetchGovVotersAndBan);

  const adminRows = listMode === 'address' ? adminBan.addressRecords : listMode === 'nft' ? adminBan.senderRecords : [];
  const govRows = listMode === 'address' ? govBan.addressRecords : listMode === 'nft' ? govBan.senderRecords : [];
  const adminTotal = listMode === 'address' ? adminBan.addressCount : listMode === 'nft' ? adminBan.senderCount : undefined;
  const govTotal = listMode === 'address' ? govBan.addressCount : listMode === 'nft' ? govBan.senderCount : undefined;
  const adminTotalPages = Math.max(1, Math.ceil(Number(adminTotal || BigInt(0)) / BAN_LIST_PAGE_SIZE));
  const govTotalPages = Math.max(1, Math.ceil(Number(govTotal || BigInt(0)) / BAN_LIST_PAGE_SIZE));
  const voterTotalPages = Math.max(1, Math.ceil(Number(govVoters.count || BigInt(0)) / BAN_LIST_PAGE_SIZE));
  const visibleAdminRows = adminRows;
  const visibleGovRows = govRows;
  const senderNameIds = useMemo(() => {
    if (queryType !== 'nft') return [];
    return [
      ...adminBan.senderRecords.map((record) => record.senderId),
      ...govBan.senderRecords.map((record) => record.senderId),
    ];
  }, [adminBan.senderRecords, govBan.senderRecords, queryType]);
  const { groupNames: senderNames } = useGroupNames(
    senderNameIds,
    queryType === 'nft' && (activeAdminBanSource || activeGovBanSource),
  );

  useEffect(() => {
    setAdminPage((page) => Math.min(page, adminTotalPages));
  }, [adminTotalPages, setAdminPage]);

  useEffect(() => {
    setGovPage((page) => Math.min(page, govTotalPages));
  }, [govTotalPages, setGovPage]);

  const resolveQueryTarget = () => {
    if (queryType === 'mine') {
      return undefined;
    }
    if (queryType === 'message') {
      toast.error('消息 ID 会定位到发言者，不加入地址/NFT列表。');
      return undefined;
    }
    if (queryType === 'address') {
      const address = parseAddressInput(queryInput);
      if (!address) {
        toast.error('请输入有效地址');
        return undefined;
      }
      return { type: 'address' as const, value: address };
    }
    if (nftLookup.lookupResult?.status === 'resolved') {
      return { type: 'nft' as const, value: nftLookup.lookupResult.tokenId };
    }
    if (!nftLookup.lookupValue.trim()) {
      toast.error(nftLookup.lookupMode === 'name' ? '请输入 NFT 名称' : '请输入 NFT ID');
      return undefined;
    }
    toast.error('请先输入并解析有效 NFT');
    return undefined;
  };

  const submitQuery = () => {
    if (queryType === 'message') {
      const trimmed = queryInput.trim();
      if (!/^\d+$/.test(trimmed) || BigInt(trimmed) <= BigInt(0)) {
        toast.error('请输入有效消息 ID');
        return;
      }
      setActiveMessageId(BigInt(trimmed));
      return;
    }
    const target = resolveQueryTarget();
    if (!target) return;
    setQueryTarget(target);
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`已复制${label}`);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      copied ? toast.success(`已复制${label}`) : toast.error('复制失败');
    }
  };

  const copyMessageSenderAddress = () => {
    if (!messageTarget) return;
    copyText(messageTarget.senderAddress, '发送者地址');
  };

  const addAddressBan = async (address?: `0x${string}`) => {
    const target = address || parseAddressInput(queryInput);
    if (!target) {
      toast.error('请输入有效地址');
      return;
    }
    try {
      await banAddressTx.banBySenderAddresses(groupId, [target]);
      toast.success('已提交地址禁言');
    } catch (error) {
      console.error(error);
    }
  };

  const addSenderBan = async (senderId?: bigint) => {
    const resolved = senderId ? { type: 'nft' as const, value: senderId } : resolveQueryTarget();
    const target = resolved?.type === 'nft' ? resolved.value : undefined;
    if (!target) return;
    try {
      await banSenderTx.banBySenderIds(groupId, [target]);
      toast.success('已提交 NFT 禁言');
    } catch (error) {
      console.error(error);
    }
  };

  const addCurrentTarget = () => {
    if (queryType === 'message') {
      submitQuery();
      return;
    }
    const target = resolveQueryTarget();
    if (!target) return;
    setQueryTarget(target);
    if (activeGovBanSource) {
      if (!canVoteGovBan) {
        toast.error('当前地址没有治理票权，只能查看和查询治理禁言名单。');
        return;
      }
      voteCurrentTarget(true, target);
      return;
    }
    if (activeAdminBanSource) {
      if (target.type === 'address') {
        addAddressBan(target.value);
      } else {
        addSenderBan(target.value);
      }
      return;
    }
    toast.error('当前群聊未启用可写禁言源');
  };

  const removeCurrentTarget = () => {
    if (!queryTarget) return;
    if (activeAdminBanSource) {
      if (!canEditAdminBan) {
        toast.error('当前地址没有 AdminBanSource 管理权限。');
        return;
      }
      if (queryTarget.type === 'address') {
        removeAddressBan(queryTarget.value);
      } else {
        removeSenderBan(queryTarget.value);
      }
      return;
    }
    if (activeGovBanSource) {
      if (!canVoteGovBan) {
        toast.error('当前地址没有治理票权，只能查看和查询治理禁言名单。');
        return;
      }
      voteCurrentTarget(false, queryTarget);
      return;
    }
    toast.error('当前群聊未启用可写禁言源');
  };

  const voteCurrentTarget = async (support: boolean, resolvedTarget?: BanListTarget) => {
    if (!canVoteGovBan) {
      toast.error('当前地址没有治理票权，只能查看和查询治理禁言名单。');
      return;
    }
    const target = resolvedTarget || resolveQueryTarget();
    if (!target) return;
    setQueryTarget(target);
    try {
      if (target.type === 'address') {
        await voteAddressTx.voteBySenderAddress(groupId, target.value, support);
      } else {
        await voteSenderTx.voteBySenderId(groupId, target.value, support);
      }
      toast.success(support ? '已提交治理支持' : '已提交治理反对');
    } catch (error) {
      console.error(error);
    }
  };

  const toggleBanListMenu = (key: string) => {
    setActiveBanListMenuKey((current) => (current === key ? undefined : key));
  };

  const removeAddressBan = async (address: `0x${string}`) => {
    try {
      await unbanAddressTx.unbanBySenderAddresses(groupId, [address]);
      toast.success('已提交移出地址禁言名单');
      setActiveBanListMenuKey(undefined);
    } catch (error) {
      console.error(error);
    }
  };

  const removeSenderBan = async (senderId: bigint) => {
    try {
      await unbanSenderTx.unbanBySenderIds(groupId, [senderId]);
      toast.success('已提交移出 NFT 禁言名单');
      setActiveBanListMenuKey(undefined);
    } catch (error) {
      console.error(error);
    }
  };

  const addMessageSenderBan = async () => {
    if (!messageTarget) return;
    if (!canEditAdminBan) {
      toast.error('当前地址没有 AdminBanSource 管理权限。');
      return;
    }
    try {
      await banMessageSenderTx.banBySenders(groupId, [messageTarget.senderId], [messageTarget.senderAddress]);
      toast.success('已提交禁言该消息发送者');
    } catch (error) {
      console.error(error);
    }
  };

  const removeMessageSenderBan = async () => {
    if (!messageTarget) return;
    if (!canEditAdminBan) {
      toast.error('当前地址没有 AdminBanSource 管理权限。');
      return;
    }
    try {
      await unbanMessageSenderTx.unbanBySenders(groupId, [messageTarget.senderId], [messageTarget.senderAddress]);
      toast.success('已提交解除该消息发送者禁言');
    } catch (error) {
      console.error(error);
    }
  };

  const voteGovAddress = async (address: `0x${string}`, support: boolean) => {
    if (!canVoteGovBan) {
      toast.error('当前地址没有治理票权，只能查看和查询治理禁言名单。');
      return;
    }
    try {
      await voteAddressTx.voteBySenderAddress(groupId, address, support);
      toast.success(support ? '已提交地址治理支持' : '已提交地址治理反对');
      setActiveBanListMenuKey(undefined);
    } catch (error) {
      console.error(error);
    }
  };

  const voteGovSender = async (senderId: bigint, support: boolean) => {
    if (!canVoteGovBan) {
      toast.error('当前地址没有治理票权，只能查看和查询治理禁言名单。');
      return;
    }
    try {
      await voteSenderTx.voteBySenderId(groupId, senderId, support);
      toast.success(support ? '已提交 NFT 治理支持' : '已提交 NFT 治理反对');
      setActiveBanListMenuKey(undefined);
    } catch (error) {
      console.error(error);
    }
  };

  const voteMessageSender = async (support: boolean) => {
    if (!messageTarget) return;
    if (!canVoteGovBan) {
      toast.error('当前地址没有治理票权，只能查看和查询治理禁言名单。');
      return;
    }
    try {
      await voteMessageSenderTx.voteBySender(groupId, messageTarget.senderId, messageTarget.senderAddress, support);
      toast.success(support ? '已提交支持禁言该消息发送者' : '已提交反对禁言该消息发送者');
    } catch (error) {
      console.error(error);
    }
  };

  const opposeMyBan = async () => {
    if (!account) {
      toast.error('请先连接钱包');
      return;
    }
    if (!canVoteGovBan) {
      toast('需要先添加治理票，即将前往质押页面。');
      await router.push(token?.symbol ? `/stake/stakelp/?symbol=${encodeURIComponent(token.symbol)}` : '/stake/stakelp/');
      return;
    }
    if (!accountData.defaultSenderId) {
      toast.error('当前钱包未设置默认 NFT');
      return;
    }
    try {
      await voteMessageSenderTx.voteBySender(groupId, accountData.defaultSenderId, account, false);
      toast.success('已提交反对禁言我的 NFT 和地址');
    } catch (error) {
      console.error(error);
    }
  };

  const clearGovAddressVote = async (address: `0x${string}`) => {
    if (!canVoteGovBan) {
      toast.error('当前地址没有治理票权，只能查看和查询治理禁言名单。');
      return;
    }
    try {
      await clearAddressTx.clearVoteBySenderAddress(groupId, address);
      toast.success('已提交地址撤票');
      setActiveBanListMenuKey(undefined);
    } catch (error) {
      console.error(error);
    }
  };

  const clearMessageSenderVote = async () => {
    if (!messageTarget) return;
    if (!canVoteGovBan) {
      toast.error('当前地址没有治理票权，只能查看和查询治理禁言名单。');
      return;
    }
    try {
      await clearMessageSenderTx.clearVoteBySender(groupId, messageTarget.senderId, messageTarget.senderAddress);
      toast.success('已撤回对该消息发送者的禁言表态');
    } catch (error) {
      console.error(error);
    }
  };

  const clearGovSenderVote = async (senderId: bigint) => {
    if (!canVoteGovBan) {
      toast.error('当前地址没有治理票权，只能查看和查询治理禁言名单。');
      return;
    }
    try {
      await clearSenderTx.clearVoteBySenderId(groupId, senderId);
      toast.success('已提交 NFT 撤票');
      setActiveBanListMenuKey(undefined);
    } catch (error) {
      console.error(error);
    }
  };

  const queryVoter = () => {
    const voter = parseAddressInput(voterQuery);
    if (!voter) {
      toast.error('请输入有效投票地址');
      return;
    }
    const found = govVoters.voters.find((item) => sameAddress(item.voter, voter));
    setVoterPage(1);
    setVoterQueryResult(
      `${voter}：${found ? `支持 ${formatGovWeightShare(found.supportWeight, govVotingPower.totalVoteWeight)} / 反对 ${formatGovWeightShare(found.opposeWeight, govVotingPower.totalVoteWeight)}` : '当前页未找到；如不在当前页可直接重算'}`,
    );
  };

  const clearVoterQuery = () => {
    setVoterQuery('');
    setVoterQueryResult('');
    setVoterPage(1);
  };

  const openGovAddressVoters = (record: (typeof govBan.addressRecords)[number]) => {
    setActiveBanListMenuKey(undefined);
    setActiveGovTarget({
      type: 'address',
      value: record.senderAddress,
      supportWeight: record.supportWeight,
      opposeWeight: record.opposeWeight,
      voterCount: record.voterCount,
    });
  };

  const openGovSenderVoters = (record: (typeof govBan.senderRecords)[number]) => {
    setActiveBanListMenuKey(undefined);
    setActiveGovTarget({
      type: 'nft',
      value: record.senderId,
      supportWeight: record.supportWeight,
      opposeWeight: record.opposeWeight,
      voterCount: record.voterCount,
    });
  };

  const refreshVoter = async (voter: `0x${string}`) => {
    if (!activeGovTarget) return;
    try {
      if (activeGovTarget.type === 'address') {
        await refreshAddressTx.refreshVoteBySenderAddress(groupId, activeGovTarget.value, voter);
      } else {
        await refreshSenderTx.refreshVoteBySenderId(groupId, activeGovTarget.value, voter);
      }
      toast.success('已提交投票权重重算');
    } catch (error) {
      console.error(error);
    }
  };

  const refreshQueriedVoter = () => {
    const voter = parseAddressInput(voterQuery);
    if (!voter) {
      toast.error('请输入有效投票地址');
      return;
    }
    refreshVoter(voter);
  };

  const queryResultTone = queryTarget
    ? activeAdminBanSource
      ? adminQuery.isPending
        ? 'loading'
        : adminQuery.banned
          ? 'danger'
          : 'ok'
      : activeGovBanSource
        ? govQuery.isPending
          ? 'loading'
          : govQuery.status
            ? govQuery.status.banned
              ? 'danger'
              : 'ok'
            : 'neutral'
        : 'neutral'
    : 'neutral';
  const queryResultListName = queryTarget?.type === 'address' ? '禁言地址列表' : '禁言NFT列表';
  const queryResultSubjectName = queryTarget?.type === 'address' ? '地址' : 'NFT';
  const queryResultInBanList = queryResultTone === 'danger';
  const queryResultHasAction = canAddBanListTarget && (queryResultTone === 'danger' || queryResultTone === 'ok');
  const queryResultSentence = queryTarget
    ? queryResultTone === 'loading'
      ? `正在查询${queryResultSubjectName}是否在${queryResultListName}中`
      : queryResultTone === 'danger'
        ? `${queryResultSubjectName}已在${queryResultListName}中`
        : queryResultTone === 'ok'
          ? `${queryResultSubjectName}不在${queryResultListName}中`
          : activeGovBanSource && !govQuery.status
            ? `${queryResultSubjectName}暂无禁言投票记录`
            : `当前群聊未启用${queryResultListName}`
    : '';
  const queryResultMetaText =
    queryTarget && activeGovBanSource
      ? govQuery.isPending
        ? ''
        : govQuery.status
          ? [
              `支持 ${formatGovWeightShare(govQuery.status.supportWeight, govVotingPower.totalVoteWeight)}`,
              `反对 ${formatGovWeightShare(govQuery.status.opposeWeight, govVotingPower.totalVoteWeight)}`,
            ].join(' · ')
          : ''
      : !activeAdminBanSource && !activeGovBanSource
        ? '当前群聊未启用禁言源'
        : '';
  const messageSenderName = messageTarget
    ? publicData.senderNames[messageTarget.senderId.toString()] || `NFT #${messageTarget.senderId.toString()}`
    : '';
  const banStateText = (isPending: boolean, banned: boolean | undefined) =>
    !activeAdminBanSource && !activeGovBanSource ? '未启用' : isPending ? '读取中' : banned ? '已禁言' : '未禁言';
  const messageSenderAddressBanPending = activeAdminBanSource
    ? adminMessageAddressQuery.isPending
    : govMessageAddressQuery.isPending;
  const messageSenderNftBanPending = activeAdminBanSource
    ? adminMessageNftQuery.isPending
    : govMessageNftQuery.isPending;
  const messageSenderAddressBanned = activeAdminBanSource
    ? adminMessageAddressQuery.banned
    : govMessageAddressQuery.status?.banned;
  const messageSenderNftBanned = activeAdminBanSource
    ? adminMessageNftQuery.banned
    : govMessageNftQuery.status?.banned;
  const messageSenderAddressStatusText = messageTarget
    ? banStateText(messageSenderAddressBanPending, messageSenderAddressBanned)
    : '';
  const messageSenderNftStatusText = messageTarget
    ? banStateText(messageSenderNftBanPending, messageSenderNftBanned)
    : '';
  const formatMessageSenderVoteText = (supportWeight: bigint, opposeWeight: bigint) => {
    if (supportWeight > BigInt(0)) return `支持禁言 ${formatGovWeightShare(supportWeight, govVotingPower.totalVoteWeight)}`;
    if (opposeWeight > BigInt(0)) return `反对禁言 ${formatGovWeightShare(opposeWeight, govVotingPower.totalVoteWeight)}`;
    return '未表态';
  };
  const messageSenderTone = messageTarget
    ? messageSenderAddressBanPending || messageSenderNftBanPending
      ? 'loading'
      : messageSenderAddressBanned || messageSenderNftBanned
        ? 'danger'
        : activeAdminBanSource || activeGovBanSource
          ? 'ok'
          : 'neutral'
    : 'neutral';
  const messageSenderAddressStatusPillClass =
    banStatusPillClass(messageSenderAddressBanPending ? 'loading' : messageSenderAddressBanned ? 'danger' : activeAdminBanSource || activeGovBanSource ? 'ok' : 'neutral');
  const messageSenderNftStatusPillClass =
    banStatusPillClass(messageSenderNftBanPending ? 'loading' : messageSenderNftBanned ? 'danger' : activeAdminBanSource || activeGovBanSource ? 'ok' : 'neutral');
  const messageSenderBanPending = messageSenderAddressBanPending || messageSenderNftBanPending;
  const messageSenderBanned = messageSenderAddressBanned || messageSenderNftBanned;
  const messageSenderActionCount = activeGovBanSource ? 3 : activeAdminBanSource ? 1 : 0;
  const hasMessageSenderSupportVote =
    govMessageSenderMyVote.addressSupportWeight > BigInt(0) ||
    govMessageSenderMyVote.senderSupportWeight > BigInt(0);
  const hasMessageSenderOpposeVote =
    govMessageSenderMyVote.addressOpposeWeight > BigInt(0) ||
    govMessageSenderMyVote.senderOpposeWeight > BigInt(0);
  const hasCompleteMessageSenderSupportVote =
    govMessageSenderMyVote.addressSupportWeight > BigInt(0) &&
    govMessageSenderMyVote.senderSupportWeight > BigInt(0);
  const hasCompleteMessageSenderOpposeVote =
    govMessageSenderMyVote.addressOpposeWeight > BigInt(0) &&
    govMessageSenderMyVote.senderOpposeWeight > BigInt(0);
  const minMessageSenderSupportWeight =
    govMessageSenderMyVote.addressSupportWeight < govMessageSenderMyVote.senderSupportWeight
      ? govMessageSenderMyVote.addressSupportWeight
      : govMessageSenderMyVote.senderSupportWeight;
  const minMessageSenderOpposeWeight =
    govMessageSenderMyVote.addressOpposeWeight < govMessageSenderMyVote.senderOpposeWeight
      ? govMessageSenderMyVote.addressOpposeWeight
      : govMessageSenderMyVote.senderOpposeWeight;
  const messageSenderVotePending =
    govVotingPower.isPending ||
    messageSenderAddressBanPending ||
    messageSenderNftBanPending ||
    govMessageSenderMyVote.isPending;
  const canSupportMessageSenderBan =
    canVoteGovBan &&
    !messageSenderVotePending &&
    (!hasCompleteMessageSenderSupportVote || govVotingPower.voteWeight > minMessageSenderSupportWeight);
  const canOpposeMessageSenderBan =
    canVoteGovBan &&
    !messageSenderVotePending &&
    (!hasCompleteMessageSenderOpposeVote || govVotingPower.voteWeight > minMessageSenderOpposeWeight);
  const canClearMessageSenderVote =
    canVoteGovBan &&
    !messageSenderVotePending &&
    (hasMessageSenderSupportVote || hasMessageSenderOpposeVote);
  const myAddressBanPending = activeAdminBanSource ? myAddressBan.isPending : myGovAddressBan.isPending;
  const myNftBanPending = activeAdminBanSource ? myNftBan.isPending : myGovNftBan.isPending;
  const myAddressBanned = activeAdminBanSource ? myAddressBan.banned : myGovAddressBan.status?.banned;
  const myNftBanned = activeAdminBanSource ? myNftBan.banned : myGovNftBan.status?.banned;
  const hasCompleteMyOpposeVote =
    myGovVote.addressOpposeWeight > BigInt(0) &&
    myGovVote.senderOpposeWeight > BigInt(0);
  const minMyOpposeWeight =
    myGovVote.addressOpposeWeight < myGovVote.senderOpposeWeight
      ? myGovVote.addressOpposeWeight
      : myGovVote.senderOpposeWeight;
  const hasMyVoteWeightIncrease =
    hasCompleteMyOpposeVote && govVotingPower.voteWeight > minMyOpposeWeight;
  const opposeMyBanDisabled =
    !account ||
    !accountData.defaultSenderId ||
    govVotingPower.isPending ||
    myGovVote.isPending ||
    !!opposeMyBanLabel ||
    (canVoteGovBan && hasCompleteMyOpposeVote && !hasMyVoteWeightIncrease);
  const opposeMyBanButtonText = opposeMyBanLabel
    || (canVoteGovBan && hasCompleteMyOpposeVote
      ? hasMyVoteWeightIncrease ? '治理票已增加，更新反对禁言' : '已反对禁言，治理票未增加'
      : '反对禁言');
  const defaultNftLabel = accountData.defaultSenderId
    ? accountData.defaultSenderName || `NFT #${accountData.defaultSenderId.toString()}`
    : '未设置默认 NFT';
  const myBanSummary = (() => {
    if (!account) {
      return { text: '连接钱包后查看我的禁言状态', tone: 'neutral' as const };
    }
    if (publicData.isPending && !publicData.chatInfo) {
      return { text: '正在读取禁言源', tone: 'loading' as const };
    }
    if (!activeAdminBanSource && !activeGovBanSource) {
      return { text: '未启用禁言源', tone: 'neutral' as const };
    }
    if (myAddressBanPending || (accountData.defaultSenderId && myNftBanPending)) {
      return { text: '正在检查禁言状态', tone: 'loading' as const };
    }
    if (myAddressBanned || myNftBanned) {
      return { text: '已命中禁言规则', tone: 'danger' as const };
    }
    if (!accountData.defaultSenderId) {
      return { text: '已检查地址，未设置默认 NFT', tone: 'neutral' as const };
    }
    return { text: '未被禁言', tone: 'ok' as const };
  })();

  useEffect(() => {
    if (permissionSummary.tone === 'ok') {
      setPermissionExpanded(true);
    }
  }, [permissionSummary.tone]);

  return (
    <section className="workspace-screen ban-list-screen">
      <section className="workspace-band">
        <GroupDetailHeader
          title="禁言名单"
          groupId={groupId}
          subtitle={detailSubtitle}
        />
        <div className="my-ban-status-panel permission-status-panel">
          <button
            className="my-ban-status-summary"
            type="button"
            aria-expanded={permissionExpanded}
            onClick={() => setPermissionExpanded((expanded) => !expanded)}
          >
            <div>
              <strong>我的权限状态</strong>
            </div>
            <span className="my-ban-status-summary-meta">
              <span className={cn('pill', banStatusPillClass(permissionSummary.tone))}>{permissionSummary.text}</span>
              <ChevronDown
                className={cn('my-ban-status-chevron', permissionExpanded && 'expanded')}
                size={16}
                strokeWidth={2.2}
                aria-hidden="true"
              />
            </span>
          </button>
          {permissionExpanded && (
            <span className="permission-status-detail">
              {permissionStatusDetail && <small>{permissionStatusDetail}</small>}
            </span>
          )}
        </div>
        <div className="ban-list-work-section">
          <BanListQueryControls
            queryType={queryType}
            queryInput={queryInput}
            nftLookupMode={nftLookup.lookupMode}
            nftLookupValue={nftLookup.lookupValue}
            nftLookupResult={nftLookup.lookupResult}
            onQueryTypeChange={(value) => {
              setQueryType(value);
              setQueryTarget(undefined);
            }}
            onQueryInputChange={(value) => {
              setQueryInput(value);
              setQueryTarget(undefined);
              if (queryType === 'message') setActiveMessageId(undefined);
            }}
            onNftLookupModeChange={(mode) => {
              nftLookup.setLookupMode(mode);
              setQueryTarget(undefined);
            }}
            onNftLookupValueChange={(value) => {
              nftLookup.setLookupValue(value);
              setQueryTarget(undefined);
            }}
            onQuery={submitQuery}
          />
        </div>
        {queryType === 'mine' && (
          <div className={cn('query-result ban-list-query-result message-sender-result my-ban-query-result', `tone-${myBanSummary.tone}`)}>
            <div className="my-ban-query-head">
              <strong className="message-sender-heading">我的禁言状态</strong>
              <span className={cn('pill', banStatusPillClass(myBanSummary.tone))}>{myBanSummary.text}</span>
            </div>
            <div className="my-ban-status-grid">
              <div className="ban-status-object-row">
                <code title={account}>{account ? abbreviateAddress(account) : '未连接钱包'}</code>
                <span className={cn('pill', banStatusPillClass(myAddressBanPending ? 'loading' : myAddressBanned ? 'danger' : 'ok'))}>
                  {account ? banStateText(myAddressBanPending, myAddressBanned) : '未查询'}
                </span>
              </div>
              <div className="ban-status-object-row">
                <span className="my-ban-nft-label">
                  <strong>{defaultNftLabel}</strong>
                  {accountData.defaultSenderId && <small>NFT #{accountData.defaultSenderId.toString()}</small>}
                </span>
                <span className={cn('pill', banStatusPillClass(myNftBanPending ? 'loading' : myNftBanned ? 'danger' : 'ok'))}>
                  {accountData.defaultSenderId ? banStateText(myNftBanPending, myNftBanned) : '未查询'}
                </span>
              </div>
            </div>
            <small className="my-ban-status-hint">地址或默认 NFT 任一被禁言，都会命中禁言规则；完整发言资格还取决于发言范围和群聊状态。</small>
            {activeGovBanSource && (
              <button
                className="sheet-button inline-flex my-ban-status-action"
                type="button"
                onClick={opposeMyBan}
                aria-disabled={!canVoteGovBan}
                disabled={opposeMyBanDisabled}
              >
                {opposeMyBanButtonText}
              </button>
            )}
            {activeGovBanSource && !govVotingPower.isPending && !canVoteGovBan && (
              <small className="my-ban-status-hint">当前无治理票权。点击“反对禁言”可前往添加治理票。</small>
            )}
          </div>
        )}
        {queryType === 'message' && activeMessageId && (
          <div className={cn('query-result ban-list-query-result message-sender-result', `tone-${messageSenderTone}`)}>
            {messageQuery.isPending ? (
              <div className="message-sender-result-loading">正在读取消息 #{activeMessageId.toString()}</div>
            ) : messageTarget ? (
              <>
                <div className="message-sender-top">
                  <strong className="message-sender-heading">按消息ID定位到发言者</strong>
                  <div className="my-ban-status-grid message-sender-object-grid">
                    <div className="ban-status-object-row">
                      <span className="message-sender-address-block">
                        <span className="ban-list-query-target message-sender-address-line">
                          <code title={messageTarget.senderAddress}>{abbreviateAddress(messageTarget.senderAddress)}</code>
                          <button type="button" onClick={copyMessageSenderAddress} aria-label="复制发送者地址" title="复制发送者地址">
                            <Copy size={13} strokeWidth={2.2} />
                          </button>
                        </span>
                        <small>地址</small>
                      </span>
                      <span className={cn('pill', messageSenderAddressStatusPillClass)}>
                        {messageSenderAddressStatusText}
                      </span>
                    </div>
                    <div className="ban-status-object-row">
                      <span className="my-ban-nft-label">
                        <strong>{messageSenderName}</strong>
                        <small>NFT #{messageTarget.senderId.toString()}</small>
                      </span>
                      <span className={cn('pill', messageSenderNftStatusPillClass)}>
                        {messageSenderNftStatusText}
                      </span>
                    </div>
                  </div>
                </div>
                {activeGovBanSource && (
                  <dl className="message-sender-vote-grid">
                    <div>
                      <dt>我对地址的表态</dt>
                      <dd>
                        {govMessageSenderMyVote.isPending
                          ? '读取中'
                          : formatMessageSenderVoteText(
                            govMessageSenderMyVote.addressSupportWeight,
                            govMessageSenderMyVote.addressOpposeWeight,
                          )}
                      </dd>
                    </div>
                    <div>
                      <dt>我对 NFT 的表态</dt>
                      <dd>
                        {govMessageSenderMyVote.isPending
                          ? '读取中'
                          : formatMessageSenderVoteText(
                            govMessageSenderMyVote.senderSupportWeight,
                            govMessageSenderMyVote.senderOpposeWeight,
                          )}
                      </dd>
                    </div>
                  </dl>
                )}
                <div className={cn('ban-list-action-row message-sender-actions', `count-${messageSenderActionCount}`)}>
                  {activeAdminBanSource && (
                    messageSenderBanned ? (
                      <button className="sheet-button inline-flex" type="button" onClick={removeMessageSenderBan} disabled={!canEditAdminBan || messageSenderBanPending || !!unbanMessageSenderLabel}>{unbanMessageSenderLabel || '解除禁言'}</button>
                    ) : (
                      <button className="sheet-button inline-flex" type="button" onClick={addMessageSenderBan} disabled={!canEditAdminBan || messageSenderBanPending || !!banMessageSenderLabel}>{banMessageSenderLabel || '禁言发送者'}</button>
                    )
                  )}
                  {activeGovBanSource && (
                    <>
                      <button className="sheet-button inline-flex" type="button" onClick={() => voteMessageSender(true)} disabled={!canSupportMessageSenderBan || !!voteMessageSenderLabel}>{voteMessageSenderLabel || '支持禁言'}</button>
                      <button className="sheet-button inline-flex" type="button" onClick={() => voteMessageSender(false)} disabled={!canOpposeMessageSenderBan || !!voteMessageSenderLabel}>{voteMessageSenderLabel || '反对禁言'}</button>
                      <button className="sheet-button inline-flex" type="button" onClick={clearMessageSenderVote} disabled={!canClearMessageSenderVote || !!clearMessageSenderLabel}>{clearMessageSenderLabel || '撤回表态'}</button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="message-sender-result-loading">没有读到消息 #{activeMessageId.toString()}，请确认消息仍存在。</div>
            )}
          </div>
        )}
        {queryTarget && (
          <div className={cn('query-result ban-list-query-result ban-list-standard-result', `tone-${queryResultTone}`)}>
            <span className="ban-list-query-summary">
              <span className="ban-list-query-sentence">{queryResultSentence}</span>
            </span>
            {queryResultMetaText && <span className="ban-list-query-meta">{queryResultMetaText}</span>}
            {queryResultHasAction && (
              <div className="ban-list-result-actions">
                <button
                  className="sheet-button inline-flex"
                  type="button"
                  onClick={queryResultInBanList ? removeCurrentTarget : addCurrentTarget}
                  disabled={!(activeAdminBanSource ? canEditAdminBan : canVoteGovBan) || anyBanListTxPending}
                >
                  {queryResultInBanList
                    ? activeAdminBanSource
                      ? transactionLabel(queryTarget.type === 'address' ? unbanAddressTx : unbanSenderTx, '等待钱包确认', '移除确认中') || '移除'
                      : transactionLabel(queryTarget.type === 'address' ? voteAddressTx : voteSenderTx, '等待钱包确认', '投票确认中') || '反对禁言'
                    : activeAdminBanSource
                      ? queryTarget.type === 'address'
                        ? addAddressBanLabel || '加入禁言列表'
                        : addSenderBanLabel || '加入禁言列表'
                      : transactionLabel(queryTarget.type === 'address' ? voteAddressTx : voteSenderTx, '等待钱包确认', '投票确认中') || '支持禁言'}
                </button>
              </div>
            )}
          </div>
        )}
        {activeGovTarget && (
          <GovVoterSheet
            target={activeGovTarget}
            voters={govVoters.voters}
            count={govVoters.count}
            totalVoteWeight={govVotingPower.totalVoteWeight}
            page={voterPage}
            totalPages={voterTotalPages}
            isPending={govVoters.isPending}
            query={voterQuery}
            queryResult={voterQueryResult}
            refreshStatusLabel={transactionLabel(activeGovTarget.type === 'address' ? refreshAddressTx : refreshSenderTx, '等待钱包确认', '重算确认中')}
            onQueryChange={(value) => {
              setVoterQuery(value);
              setVoterQueryResult('');
            }}
            onQuery={queryVoter}
            onClearQuery={clearVoterQuery}
            onRefreshVoter={refreshVoter}
            onRefreshQueriedVoter={refreshQueriedVoter}
            onPageChange={setVoterPage}
            onClose={() => setActiveGovTarget(undefined)}
          />
        )}
        {activeAdminBanSource && listMode && (
          <AdminBanListRows
            queryType={listMode}
            rows={visibleAdminRows}
            total={adminTotal}
            page={adminPage}
            totalPages={adminTotalPages}
            isPending={adminBan.isPending}
            activeMenuKey={activeBanListMenuKey}
            canEdit={canEditAdminBan}
            removeStatusLabel={transactionLabel(listMode === 'address' ? unbanAddressTx : unbanSenderTx, '等待钱包确认', '移出确认中')}
            senderNames={senderNames}
            onToggleMenu={toggleBanListMenu}
            onRemoveAddress={removeAddressBan}
            onRemoveSender={removeSenderBan}
            onPageChange={setAdminPage}
          />
        )}
        {activeGovBanSource && listMode && (
          <GovBanListRows
            queryType={listMode}
            rows={visibleGovRows}
            total={govTotal}
            page={govPage}
            totalPages={govTotalPages}
            isPending={govBan.isPending}
            activeMenuKey={activeBanListMenuKey}
            canVote={canVoteGovBan}
            voteStatusLabel={transactionLabel(listMode === 'address' ? voteAddressTx : voteSenderTx, '等待钱包确认', '投票确认中')}
            clearStatusLabel={transactionLabel(listMode === 'address' ? clearAddressTx : clearSenderTx, '等待钱包确认', '撤票确认中')}
            totalVoteWeight={govVotingPower.totalVoteWeight}
            senderNames={senderNames}
            onToggleMenu={toggleBanListMenu}
            onVoteAddress={voteGovAddress}
            onVoteSender={voteGovSender}
            onClearAddressVote={clearGovAddressVote}
            onClearSenderVote={clearGovSenderVote}
            onOpenAddressVoters={openGovAddressVoters}
            onOpenSenderVoters={openGovSenderVoters}
            onPageChange={setGovPage}
          />
        )}
      </section>
    </section>
  );
}
