import LoadingIcon from '@/src/components/Common/LoadingIcon';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { GovVoterRecord } from '@/src/hooks/contracts/useGroupChatModeration';
import { BAN_LIST_PAGE_SIZE } from './chatConstants';
import { formatGovCount, formatGovWeightShare } from './chatUtils';

export type GovBanListTarget =
  | { type: 'address'; value: `0x${string}`; supportWeight: bigint; opposeWeight: bigint; voterCount: bigint }
  | { type: 'nft'; value: bigint; supportWeight: bigint; opposeWeight: bigint; voterCount: bigint };

export function GovVoterSheet({
  target,
  voters,
  count,
  totalVoteWeight,
  page,
  totalPages,
  isPending,
  query,
  queryResult,
  refreshStatusLabel,
  onQueryChange,
  onQuery,
  onClearQuery,
  onRefreshVoter,
  onRefreshQueriedVoter,
  onPageChange,
  onClose,
}: {
  target: GovBanListTarget;
  voters: GovVoterRecord[];
  count: bigint | undefined;
  totalVoteWeight: bigint;
  page: number;
  totalPages: number;
  isPending: boolean;
  query: string;
  queryResult: string;
  refreshStatusLabel?: string;
  onQueryChange: (value: string) => void;
  onQuery: () => void;
  onClearQuery: () => void;
  onRefreshVoter: (voter: `0x${string}`) => void;
  onRefreshQueriedVoter: () => void;
  onPageChange: (page: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="status-sheet">
      <div className="sheet-handle" />
      <div className="status-card">
        <div className="card-topline">
          <strong>投票列表</strong>
          <span>{target.type === 'address' ? '地址' : 'NFT'}</span>
        </div>
        <dl>
          <dt>目标</dt>
          <dd>{target.type === 'address' ? target.value : `NFT #${target.value.toString()}`}</dd>
          <dt>投票</dt>
          <dd>支持 {formatGovWeightShare(target.supportWeight, totalVoteWeight)} · 反对 {formatGovWeightShare(target.opposeWeight, totalVoteWeight)}</dd>
          <dt>投票人数</dt>
          <dd>{formatGovCount(count || target.voterCount)}</dd>
        </dl>
      </div>
      <section className="workspace-band gov-voter-panel">
        <div className="query-row ban-list-query-row">
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="输入投票地址"
          />
          <button className="sheet-button primary inline-flex" type="button" onClick={onQuery}>查询</button>
          <button className="sheet-button inline-flex" type="button" onClick={onClearQuery}>清除</button>
        </div>
        {queryResult && <div className="query-result">{queryResult}</div>}
        {isPending ? (
          <div className="py-4"><LoadingIcon /></div>
        ) : voters.length ? voters.map((entry) => (
          <article className="list-row" key={entry.voter}>
            <div>
              <strong>{entry.voter}</strong>
              <small>
                权重 {formatGovWeightShare(entry.supportWeight > BigInt(0) ? entry.supportWeight : entry.opposeWeight, totalVoteWeight)}
              </small>
            </div>
            <span className={cn('pill', entry.supportWeight > BigInt(0) ? 'pill-ok' : 'pill-warn')}>
              {entry.supportWeight > BigInt(0) ? '支持' : '反对'}
            </span>
            <div className="row-actions">
              <button type="button" onClick={() => onRefreshVoter(entry.voter)} disabled={!!refreshStatusLabel}>
                {refreshStatusLabel || '重算'}
              </button>
            </div>
          </article>
        )) : <div className="empty-state">暂无投票</div>}
        {count !== undefined && count > BigInt(BAN_LIST_PAGE_SIZE) && (
          <div className="pager-row">
            <button className="sheet-button inline-flex" type="button" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>上一页</button>
            <span>{Math.min(page, totalPages)} / {totalPages}</span>
            <button className="sheet-button inline-flex" type="button" disabled={page >= totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))}>下一页</button>
          </div>
        )}
        <div className="close-row">
          <button className="sheet-button inline-flex" type="button" onClick={onRefreshQueriedVoter} disabled={!!refreshStatusLabel}>
            {refreshStatusLabel || '重算输入地址'}
          </button>
        </div>
      </section>
      <div className="close-row">
        <button className="sheet-button inline-flex" type="button" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}
