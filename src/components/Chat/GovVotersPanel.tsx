import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { RotateCw, Search, X } from 'lucide-react';

import LoadingIcon from '@/src/components/Common/LoadingIcon';
import { Input } from '@/components/ui/input';
import { useGroupChatVotingPower } from '@/src/hooks/contracts/useGroupChatManagers';
import {
  GROUP_CHAT_GOV_VOTED_BAN_SOURCE_ADDRESS,
  isGovVotedBanSourceEnabled,
  useGovBanQuery,
  useGovRefreshVoteBySenderAddress,
  useGovRefreshVoteBySenderId,
  useGovVotedBanStateVersion,
  useGovVotersByTarget,
} from '@/src/hooks/contracts/useGroupChatModeration';
import { useGroupChatPublicData, useGroupNames } from '@/src/hooks/composite/useGroupChatData';
import { cn } from '@/lib/utils';
import { AddressDisplay } from './BanListRows';
import { GroupDetailHeader, useGroupDetailSubtitle } from './ChatGroupDetailHeader';
import { BAN_LIST_PAGE_SIZE } from './chatConstants';
import {
  formatGovCount,
  formatGovWeightShare,
  parseAddressInput,
  sameAddress,
} from './chatUtils';
import { useConfirmedTransactionEffect } from './useConfirmedTransactionEffect';

type GovVotersTarget =
  | { type: 'address'; value: `0x${string}` }
  | { type: 'nft'; value: bigint };

type TransactionState = {
  isPending: boolean;
  isConfirming: boolean;
};

function transactionLabel(transaction: TransactionState, pendingLabel = '等待钱包确认', confirmingLabel = '链上确认中') {
  if (transaction.isConfirming) return confirmingLabel;
  if (transaction.isPending) return pendingLabel;
  return undefined;
}

function targetLabel(target: GovVotersTarget, nftName?: string) {
  if (target.type === 'address') return target.value;
  const fallback = `NFT #${target.value.toString()}`;
  return nftName && nftName !== `LOVE20 NFT #${target.value.toString()}`
    ? `${fallback} · ${nftName}`
    : fallback;
}

function targetKindLabel(target: GovVotersTarget) {
  return target.type === 'address' ? '地址' : 'NFT';
}

export function GovVotersPanel({
  groupId,
  account,
  target,
  onChanged,
}: {
  groupId: bigint;
  account: `0x${string}` | undefined;
  target: GovVotersTarget;
  onChanged: () => void;
}) {
  const [page, setPage] = useState(1);
  const [voterQuery, setVoterQuery] = useState('');
  const [voterQueryResult, setVoterQueryResult] = useState('');
  const publicData = useGroupChatPublicData(groupId);
  const { groupNames: targetNames } = useGroupNames(
    [target.type === 'nft' ? target.value : undefined],
    target.type === 'nft',
  );
  const targetName = target.type === 'nft' ? targetNames[target.value.toString()] : undefined;
  const detailSubtitle = useGroupDetailSubtitle(groupId, publicData);
  const activeGovBanSource =
    isGovVotedBanSourceEnabled && sameAddress(publicData.chatInfo?.banSource, GROUP_CHAT_GOV_VOTED_BAN_SOURCE_ADDRESS);
  const offset = BigInt((Math.max(1, page) - 1) * BAN_LIST_PAGE_SIZE);
  const govVotingPower = useGroupChatVotingPower(groupId, publicData.chatInfo?.owner, account, activeGovBanSource);
  const govStatus = useGovBanQuery(
    groupId,
    target.type,
    target.type === 'address' ? target.value : undefined,
    target.type === 'nft' ? target.value : undefined,
    activeGovBanSource,
  );
  const govVoters = useGovVotersByTarget(
    groupId,
    target.type,
    target.type === 'address' ? target.value : undefined,
    target.type === 'nft' ? target.value : undefined,
    offset,
    BigInt(BAN_LIST_PAGE_SIZE),
    activeGovBanSource,
  );
  const govBanStateVersion = useGovVotedBanStateVersion(groupId, activeGovBanSource);
  const refreshAddressTx = useGovRefreshVoteBySenderAddress();
  const refreshSenderTx = useGovRefreshVoteBySenderId();
  const refreshStatusLabel = transactionLabel(
    target.type === 'address' ? refreshAddressTx : refreshSenderTx,
    '等待钱包确认',
    '重算确认中',
  );
  const totalPages = Math.max(1, Math.ceil(Number(govVoters.count || BigInt(0)) / BAN_LIST_PAGE_SIZE));
  const supportWeight = govStatus.status?.supportWeight || BigInt(0);
  const opposeWeight = govStatus.status?.opposeWeight || BigInt(0);
  const countLabel = govVoters.count !== undefined
    ? formatGovCount(govVoters.count)
    : govVoters.isPending
      ? '读取中'
      : '0';
  const loadingChatInfo = publicData.isPending && !publicData.chatInfo;
  const targetStatusText = govStatus.isPending
    ? '读取中'
    : govStatus.status?.banned
      ? '已禁言'
      : '未禁言';
  const targetStatusClass = govStatus.isPending ? 'pill-neutral' : govStatus.status?.banned ? 'pill-bad' : 'pill-ok';

  const refetchVotersAndStatus = useCallback(() => {
    govVoters.refetch();
    govStatus.refetch();
    govBanStateVersion.refetch();
    onChanged();
  }, [govBanStateVersion, govStatus, govVoters, onChanged]);

  useConfirmedTransactionEffect(refreshAddressTx, refetchVotersAndStatus);
  useConfirmedTransactionEffect(refreshSenderTx, refetchVotersAndStatus);

  useEffect(() => {
    setPage((value) => Math.min(value, totalPages));
  }, [totalPages]);

  const queryVoter = () => {
    const voter = parseAddressInput(voterQuery);
    if (!voter) {
      toast.error('请输入有效投票地址');
      return;
    }
    const found = govVoters.voters.find((item) => sameAddress(item.voter, voter));
    setVoterQueryResult(
      found
        ? `${voter}：支持 ${formatGovWeightShare(found.supportWeight, govVotingPower.totalVoteWeight)} / 反对 ${formatGovWeightShare(found.opposeWeight, govVotingPower.totalVoteWeight)}`
        : `${voter}：当前页未找到；如不在当前页可直接重算`,
    );
  };

  const clearVoterQuery = () => {
    setVoterQuery('');
    setVoterQueryResult('');
    setPage(1);
  };

  const refreshVoter = async (voter: `0x${string}`) => {
    if (!activeGovBanSource) {
      toast.error('当前群聊未启用治理投票禁言');
      return;
    }
    try {
      if (target.type === 'address') {
        await refreshAddressTx.refreshVoteBySenderAddress(groupId, target.value, voter);
      } else {
        await refreshSenderTx.refreshVoteBySenderId(groupId, target.value, voter);
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

  return (
    <section className="workspace-screen ban-voters-screen" aria-label="禁言投票列表">
      <GroupDetailHeader
        title="投票列表"
        groupId={groupId}
        subtitle={detailSubtitle}
      />

      {loadingChatInfo ? (
        <section className="workspace-band">
          <div className="message-detail-loading" role="status" aria-live="polite">
            <LoadingIcon />
            <span>正在读取禁言规则...</span>
          </div>
        </section>
      ) : !activeGovBanSource ? (
        <section className="workspace-band">
          <div className="empty-state">本群未启用治理投票禁言，无法打开投票列表。</div>
        </section>
      ) : (
        <div className="ban-voters-layout">
          <section className="workspace-band ban-voters-summary">
            <div className="card-topline ban-voters-summary-head">
              <h2>{targetKindLabel(target)} 目标</h2>
              <span className={cn('pill ban-voters-status-pill', targetStatusClass)}>{targetStatusText}</span>
            </div>
            <div className="ban-voters-target-value">
              {target.type === 'address' ? <AddressDisplay address={target.value} /> : targetLabel(target, targetName)}
            </div>
            <div className="ban-voters-metrics">
              <div>
                <span>支持禁言</span>
                <strong>{formatGovWeightShare(supportWeight, govVotingPower.totalVoteWeight)}</strong>
              </div>
              <div>
                <span>反对禁言</span>
                <strong>{formatGovWeightShare(opposeWeight, govVotingPower.totalVoteWeight)}</strong>
              </div>
              <div>
                <span>投票人数</span>
                <strong>{countLabel}</strong>
              </div>
            </div>
          </section>

          <section className="workspace-band ban-voters-query-card">
            <div className="card-topline ban-voters-section-head">
              <h2>查询投票地址</h2>
              <span>当前页查询</span>
            </div>
            <div className="query-row ban-voters-query-row">
              <Input
                value={voterQuery}
                onChange={(event) => {
                  setVoterQuery(event.target.value);
                  setVoterQueryResult('');
                }}
                placeholder="输入投票地址"
              />
              <button className="sheet-button primary inline-flex" type="button" onClick={queryVoter}>
                <Search className="h-4 w-4" aria-hidden="true" />
                查询
              </button>
              <button className="sheet-button inline-flex" type="button" onClick={clearVoterQuery}>
                <X className="h-4 w-4" aria-hidden="true" />
                清除
              </button>
              <button
                className="sheet-button inline-flex"
                type="button"
                onClick={refreshQueriedVoter}
                disabled={!!refreshStatusLabel}
              >
                <RotateCw className="h-4 w-4" aria-hidden="true" />
                {refreshStatusLabel || '重算'}
              </button>
            </div>
            {voterQueryResult && <div className="query-result ban-voters-query-result">{voterQueryResult}</div>}
          </section>

          <section className="workspace-band ban-voters-list-card">
            <div className="card-topline ban-voters-section-head">
              <h2>投票人</h2>
              <span>{countLabel} 人</span>
            </div>

            {govVoters.isPending && govVoters.voters.length === 0 ? (
              <div className="py-4"><LoadingIcon /></div>
            ) : govVoters.voters.length ? (
              <div className="ban-voters-list">
                {govVoters.voters.map((entry) => {
                  const supports = entry.supportWeight > BigInt(0);
                  const weight = supports ? entry.supportWeight : entry.opposeWeight;
                  return (
                    <article className="list-row ban-voters-row" key={entry.voter}>
                      <div className="ban-voters-row-main">
                        <strong><AddressDisplay address={entry.voter} /></strong>
                        <small>权重 {formatGovWeightShare(weight, govVotingPower.totalVoteWeight)}</small>
                      </div>
                      <span className={cn('pill', supports ? 'pill-bad' : 'pill-ok')}>
                        {supports ? '支持禁言' : '反对禁言'}
                      </span>
                      <button
                        className="icon-button ban-voter-refresh-button"
                        type="button"
                        aria-label={refreshStatusLabel || '重算投票权重'}
                        title={refreshStatusLabel || '重算投票权重'}
                        onClick={() => refreshVoter(entry.voter)}
                        disabled={!!refreshStatusLabel}
                      >
                        <RotateCw className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">暂无投票</div>
            )}

            {govVoters.count !== undefined && govVoters.count > BigInt(BAN_LIST_PAGE_SIZE) && (
              <div className="pager-row">
                <button
                  className="sheet-button inline-flex"
                  type="button"
                  disabled={page <= 1 || govVoters.isPending}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  上一页
                </button>
                <span>{Math.min(page, totalPages)} / {totalPages}</span>
                <button
                  className="sheet-button inline-flex"
                  type="button"
                  disabled={page >= totalPages || govVoters.isPending}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                >
                  下一页
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
