import { useCallback, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

import { useGroupChatVotingPower } from '@/src/hooks/contracts/useGroupChatManagers';
import {
  GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS,
  GROUP_CHAT_GOV_VOTED_BAN_SOURCE_ADDRESS,
  isGovVotedBanSourceEnabled,
  isGroupBanListEnabled,
  useAdminBanQuery,
  useBanSenderAddresses,
  useBanSenderIds,
  useGovBanQuery,
  useGovClearVoteBySenderAddress,
  useGovClearVoteBySenderId,
  useGovRefreshVoteBySenderAddress,
  useGovRefreshVoteBySenderId,
  useGovVoteBySenderAddress,
  useGovVoteBySenderId,
  useGovVotersByTarget,
  useGovVotedBanLists,
  useGovVotedBanMechanism,
  useGovVotedBanStateVersion,
  useGroupAdminOperatorPermission,
  useGroupBanLists,
  useUnbanSenderAddresses,
  useUnbanSenderIds,
} from '@/src/hooks/contracts/useGroupChatModeration';
import { useGroupChatRoomData, useGroupNames } from '@/src/hooks/composite/useGroupChatData';
import { useNftOwnerLookup } from '@/src/hooks/extension/base/composite/useNftOwnerLookup';
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

export function BanListPanel({
  groupId,
  account,
  onChanged,
}: {
  groupId: bigint;
  account: `0x${string}` | undefined;
  onChanged: () => void;
}) {
  const room = useGroupChatRoomData(groupId, account);
  const activeAdminBanSource = sameAddress(room.chatInfo?.banSource, GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS);
  const activeGovBanSource = sameAddress(room.chatInfo?.banSource, GROUP_CHAT_GOV_VOTED_BAN_SOURCE_ADDRESS);
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
  const nftLookup = useNftOwnerLookup({ enabled: queryType === 'nft', initialMode: 'name' });
  const adminBan = useGroupBanLists(
    groupId,
    adminOffset,
    BigInt(BAN_LIST_PAGE_SIZE),
    adminOffset,
    BigInt(BAN_LIST_PAGE_SIZE),
    isGroupBanListEnabled && activeAdminBanSource,
  );
  const govBan = useGovVotedBanLists(
    groupId,
    govOffset,
    BigInt(BAN_LIST_PAGE_SIZE),
    govOffset,
    BigInt(BAN_LIST_PAGE_SIZE),
    account,
    isGovVotedBanSourceEnabled && activeGovBanSource,
  );
  const adminQuery = useAdminBanQuery(
    groupId,
    queryTarget?.type || queryType,
    queryTarget?.type === 'address' ? queryTarget.value : undefined,
    queryTarget?.type === 'nft' ? queryTarget.value : undefined,
    !!queryTarget && activeAdminBanSource,
  );
  const govQuery = useGovBanQuery(
    groupId,
    queryTarget?.type || queryType,
    queryTarget?.type === 'address' ? queryTarget.value : undefined,
    queryTarget?.type === 'nft' ? queryTarget.value : undefined,
    !!queryTarget && activeGovBanSource,
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
  const voteAddressTx = useGovVoteBySenderAddress();
  const voteSenderTx = useGovVoteBySenderId();
  const clearAddressTx = useGovClearVoteBySenderAddress();
  const clearSenderTx = useGovClearVoteBySenderId();
  const refreshAddressTx = useGovRefreshVoteBySenderAddress();
  const refreshSenderTx = useGovRefreshVoteBySenderId();
  const adminBanPermission = useGroupAdminOperatorPermission(groupId, account, activeAdminBanSource);
  const govVotingPower = useGroupChatVotingPower(groupId, room.chatInfo?.owner, account, activeGovBanSource);
  const govBanMechanism = useGovVotedBanMechanism(activeGovBanSource);
  const govBanStateVersion = useGovVotedBanStateVersion(groupId, activeGovBanSource);
  const canEditAdminBan = activeAdminBanSource && adminBanPermission.canOperate;
  const canVoteGovBan = activeGovBanSource && govVotingPower.voteWeight > BigInt(0);
  const adminBanPermissionText = adminBanPermission.operatorKind === 'owner-or-delegate'
    ? '当前链群NFT持有者、代理、群管理可维护禁言名单。'
    : adminBanPermission.operatorKind === 'admin'
      ? '当前链群NFT持有者、代理、群管理可维护禁言名单。'
      : adminBanPermission.isPending
        ? '正在读取 AdminBanSource 管理权限。'
        : '当前地址不是链群NFT持有者、代理或群管理；禁言名单只能查看和查询。';
  const detailSubtitle = useGroupDetailSubtitle(groupId, room);
  const govBanListNotice = activeGovBanSource
    ? govVotingPower.isPending || govBanMechanism.isPending
      ? '正在读取当前地址治理票权和禁言阈值。'
      : canVoteGovBan
        ? `当前地址有 ${formatGovWeightShare(govVotingPower.voteWeight, govVotingPower.totalVoteWeight)} 票权，可参与治理禁言投票。${govBanListMechanismText(govVotingPower.totalVoteWeight, govBanMechanism.banThresholdRatio, govBanMechanism.precision)}`
        : `当前地址没有票权，只能查看和查询治理禁言名单。${govBanListMechanismText(govVotingPower.totalVoteWeight, govBanMechanism.banThresholdRatio, govBanMechanism.precision)}`
    : '';
  const activeBanListVersion = activeGovBanSource ? govBanStateVersion.stateVersion : undefined;
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
  useConfirmedTransactionEffect(voteAddressTx, refetchGovBan);
  useConfirmedTransactionEffect(voteSenderTx, refetchGovBan);
  useConfirmedTransactionEffect(clearAddressTx, refetchGovBan);
  useConfirmedTransactionEffect(clearSenderTx, refetchGovBan);
  useConfirmedTransactionEffect(refreshAddressTx, refetchGovVotersAndBan);
  useConfirmedTransactionEffect(refreshSenderTx, refetchGovVotersAndBan);

  const adminRows = queryType === 'address' ? adminBan.addressRecords : adminBan.senderRecords;
  const govRows = queryType === 'address' ? govBan.addressRecords : govBan.senderRecords;
  const adminTotal = queryType === 'address' ? adminBan.addressCount : adminBan.senderCount;
  const govTotal = queryType === 'address' ? govBan.addressCount : govBan.senderCount;
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

  useEffect(() => {
    if (queryType === 'address') {
      const address = parseAddressInput(queryInput);
      setQueryTarget(address ? { type: 'address', value: address } : undefined);
      return;
    }
    if (nftLookup.lookupResult?.status === 'resolved') {
      setQueryTarget({ type: 'nft', value: nftLookup.lookupResult.tokenId });
      return;
    }
    setQueryTarget(undefined);
  }, [nftLookup.lookupResult, queryInput, queryType, setQueryTarget]);

  const querySelf = () => {
    if (queryType === 'address') {
      if (!account) {
        toast.error('请先连接钱包');
        return;
      }
      setQueryInput(account);
      setQueryTarget({ type: 'address', value: account });
      return;
    }
    if (!room.defaultSenderId) {
      toast.error('当前钱包未设置默认 NFT');
      return;
    }
    nftLookup.setLookupMode('id');
    nftLookup.setLookupValue(room.defaultSenderId.toString());
    setQueryTarget({ type: 'nft', value: room.defaultSenderId });
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

  const queryLabel = queryTarget
    ? queryTarget.type === 'address'
      ? queryTarget.value
      : `NFT #${queryTarget.value.toString()}`
    : '';
  const govQueryStatusText = govQuery.isPending
    ? '读取中'
    : govQuery.status
      ? [
          govQuery.status.banned ? '已生效' : '未生效',
          `支持 ${formatGovWeightShare(govQuery.status.supportWeight, govVotingPower.totalVoteWeight)}`,
          `反对 ${formatGovWeightShare(govQuery.status.opposeWeight, govVotingPower.totalVoteWeight)}`,
        ].join(' · ')
      : '无投票状态';
  const queryResultText = queryTarget
    ? activeAdminBanSource
      ? [
          `${queryLabel}`,
          `AdminBanSource：${adminQuery.isPending ? '读取中' : adminQuery.banned ? '在禁言名单' : '不在禁言名单'}`,
        ].join(' · ')
      : activeGovBanSource
        ? [`${queryLabel}`, `GovVotedBanSource：${govQueryStatusText}`].join(' · ')
        : `${queryLabel} · 当前群聊未启用禁言源`
    : '';
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
          : govQuery.status?.banned
            ? 'danger'
            : 'ok'
        : 'neutral'
    : 'neutral';

  return (
    <section className="workspace-screen">
      <section className="workspace-band">
        <GroupDetailHeader
          title="禁言名单"
          groupId={groupId}
          subtitle={detailSubtitle}
          meta={
            activeAdminBanSource
              ? canEditAdminBan ? '可管理' : '只读'
              : activeGovBanSource
                ? activeBanListVersion !== undefined ? `v${activeBanListVersion.toString()}` : '读取中'
                : '只读'
          }
        />
        <div className={cn('notice-row', canEditAdminBan || canVoteGovBan ? 'permission-ok' : 'permission-warn')}>
          {activeAdminBanSource
            ? adminBanPermissionText
            : activeGovBanSource
              ? govBanListNotice
              : '当前群聊未启用禁言源；本页只展示底层来源状态。'}
        </div>
        <BanListQueryControls
          queryType={queryType}
          queryInput={queryInput}
          nftLookupMode={nftLookup.lookupMode}
          nftLookupValue={nftLookup.lookupValue}
          nftLookupResult={nftLookup.lookupResult}
          canAddBanListTarget={canAddBanListTarget}
          canAdd={activeAdminBanSource ? canEditAdminBan : canVoteGovBan}
          onQueryTypeChange={(value) => {
            setQueryType(value);
            setQueryTarget(undefined);
          }}
          onQueryInputChange={(value) => {
            setQueryInput(value);
            setQueryTarget(undefined);
          }}
          onNftLookupModeChange={(mode) => {
            nftLookup.setLookupMode(mode);
            setQueryTarget(undefined);
          }}
          onNftLookupValueChange={(value) => {
            nftLookup.setLookupValue(value);
            setQueryTarget(undefined);
          }}
          onQuerySelf={querySelf}
          onAdd={addCurrentTarget}
        />
        {queryResultText && (
          <div className={cn('query-result ban-list-query-result', `tone-${queryResultTone}`)}>
            <strong>查询结果</strong>
            <span>{queryResultText}</span>
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
        {activeAdminBanSource && (
          <AdminBanListRows
            queryType={queryType}
            rows={visibleAdminRows}
            total={adminTotal}
            page={adminPage}
            totalPages={adminTotalPages}
            isPending={adminBan.isPending}
            activeMenuKey={activeBanListMenuKey}
            canEdit={canEditAdminBan}
            senderNames={senderNames}
            onToggleMenu={toggleBanListMenu}
            onRemoveAddress={removeAddressBan}
            onRemoveSender={removeSenderBan}
            onPageChange={setAdminPage}
          />
        )}
        {activeGovBanSource && (
          <GovBanListRows
            queryType={queryType}
            rows={visibleGovRows}
            total={govTotal}
            page={govPage}
            totalPages={govTotalPages}
            isPending={govBan.isPending}
            activeMenuKey={activeBanListMenuKey}
            canVote={canVoteGovBan}
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
