import { abbreviateAddress } from '@/src/lib/format';
import { cn } from '@/lib/utils';
import type {
  AdminBanAddressRecord,
  AdminBanSenderRecord,
  GovVotedAddressRecord,
  GovVotedSenderRecord,
} from '@/src/hooks/contracts/useGroupChatModeration';
import { BAN_LIST_PAGE_SIZE } from './chatConstants';
import { formatGovCount, formatGovWeightShare } from './chatUtils';

function govMyVoteText(record: GovVotedAddressRecord | GovVotedSenderRecord, totalVoteWeight: bigint) {
  if (record.mySupportWeight > BigInt(0)) return `我的投票：支持 ${formatGovWeightShare(record.mySupportWeight, totalVoteWeight)}`;
  if (record.myOpposeWeight > BigInt(0)) return `我的投票：反对 ${formatGovWeightShare(record.myOpposeWeight, totalVoteWeight)}`;
  return '我的投票：未投票';
}

function nftLabel(senderNames: Record<string, string>, senderId: bigint) {
  const fallback = `NFT #${senderId.toString()}`;
  const name = senderNames[senderId.toString()];
  return name && name !== `LOVE20 NFT #${senderId.toString()}` ? name : fallback;
}

export function AdminBanListRows({
  queryType,
  rows,
  total,
  page,
  totalPages,
  isPending,
  activeMenuKey,
  canEdit,
  senderNames,
  onToggleMenu,
  onRemoveAddress,
  onRemoveSender,
  onPageChange,
}: {
  queryType: 'address' | 'nft';
  rows: Array<AdminBanAddressRecord | AdminBanSenderRecord>;
  total: bigint | undefined;
  page: number;
  totalPages: number;
  isPending: boolean;
  activeMenuKey: string | undefined;
  canEdit: boolean;
  senderNames: Record<string, string>;
  onToggleMenu: (key: string) => void;
  onRemoveAddress: (address: `0x${string}`) => void;
  onRemoveSender: (senderId: bigint) => void;
  onPageChange: (page: number) => void;
}) {
  const menuKey = (type: 'admin-address' | 'admin-nft', value: string) => `${type}:${value.toLowerCase()}`;

  return (
    <div className="tab-content-block">
      <div className="card-topline ban-list-list-head">
        <h2>{queryType === 'address' ? '地址列表' : 'NFT列表'}</h2>
        <span>{total?.toString() || '0'} 条</span>
      </div>
      {rows.length ? rows.map((record) => {
        if ('senderAddress' in record) {
          const key = menuKey('admin-address', record.senderAddress);
          return (
            <article className="list-row ban-list-row" key={record.senderAddress} onClick={() => onToggleMenu(key)}>
              <div>
                <strong>{record.senderAddress}</strong>
                <small>操作者 NFT #{record.operatorId.toString()} · {abbreviateAddress(record.operatorAddress)}</small>
              </div>
              <span className="pill pill-bad">已禁言</span>
              {activeMenuKey === key && (
                <div className="ban-list-menu" onClick={(event) => event.stopPropagation()}>
                  <button type="button" onClick={() => onRemoveAddress(record.senderAddress)} disabled={!canEdit}>移出禁言名单</button>
                </div>
              )}
            </article>
          );
        }
        const key = menuKey('admin-nft', record.senderId.toString());
        return (
          <article className="list-row ban-list-row" key={record.senderId.toString()} onClick={() => onToggleMenu(key)}>
            <div>
              <strong>{nftLabel(senderNames, record.senderId)}</strong>
              <small>NFT #{record.senderId.toString()} · 操作者 NFT #{record.operatorId.toString()} · {abbreviateAddress(record.operatorAddress)}</small>
            </div>
            <span className="pill pill-bad">已禁言</span>
            {activeMenuKey === key && (
              <div className="ban-list-menu" onClick={(event) => event.stopPropagation()}>
                <button type="button" onClick={() => onRemoveSender(record.senderId)} disabled={!canEdit}>移出禁言名单</button>
              </div>
            )}
          </article>
        );
      }) : isPending ? (
        <div className="empty-state">读取中</div>
      ) : <div className="empty-state">暂无{queryType === 'address' ? '地址' : 'NFT'}记录</div>}
      {total !== undefined && total > BigInt(BAN_LIST_PAGE_SIZE) && (
        <div className="pager-row">
          <button className="sheet-button inline-flex" type="button" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>上一页</button>
          <span>{Math.min(page, totalPages)} / {totalPages}</span>
          <button className="sheet-button inline-flex" type="button" disabled={page >= totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))}>下一页</button>
        </div>
      )}
    </div>
  );
}

export function GovBanListRows({
  queryType,
  rows,
  total,
  page,
  totalPages,
  isPending,
  activeMenuKey,
  canVote,
  totalVoteWeight,
  senderNames,
  onToggleMenu,
  onVoteAddress,
  onVoteSender,
  onClearAddressVote,
  onClearSenderVote,
  onOpenAddressVoters,
  onOpenSenderVoters,
  onPageChange,
}: {
  queryType: 'address' | 'nft';
  rows: Array<GovVotedAddressRecord | GovVotedSenderRecord>;
  total: bigint | undefined;
  page: number;
  totalPages: number;
  isPending: boolean;
  activeMenuKey: string | undefined;
  canVote: boolean;
  totalVoteWeight: bigint;
  senderNames: Record<string, string>;
  onToggleMenu: (key: string) => void;
  onVoteAddress: (address: `0x${string}`, support: boolean) => void;
  onVoteSender: (senderId: bigint, support: boolean) => void;
  onClearAddressVote: (address: `0x${string}`) => void;
  onClearSenderVote: (senderId: bigint) => void;
  onOpenAddressVoters: (record: GovVotedAddressRecord) => void;
  onOpenSenderVoters: (record: GovVotedSenderRecord) => void;
  onPageChange: (page: number) => void;
}) {
  const menuKey = (type: 'gov-address' | 'gov-nft', value: string) => `${type}:${value.toLowerCase()}`;

  return (
    <div className="tab-content-block">
      <div className="card-topline ban-list-list-head">
        <h2>{queryType === 'address' ? '地址列表' : 'NFT列表'}</h2>
        <span>{total?.toString() || '0'} 条</span>
      </div>
      {rows.length ? rows.map((record) => {
        if ('senderAddress' in record) {
          const key = menuKey('gov-address', record.senderAddress);
          return (
            <article className="list-row ban-list-row" key={record.senderAddress} onClick={() => onToggleMenu(key)}>
              <div>
                <strong>{record.senderAddress}</strong>
                <small>
                  支持 {formatGovWeightShare(record.supportWeight, totalVoteWeight)} · 反对 {formatGovWeightShare(record.opposeWeight, totalVoteWeight)} · {formatGovCount(record.voterCount)} 人 · {govMyVoteText(record, totalVoteWeight)}
                </small>
              </div>
              <span className={cn('pill', record.banned ? 'pill-bad' : 'pill-ok')}>
                {record.banned ? '已禁言' : '未禁言'}
              </span>
              {activeMenuKey === key && (
                <div className="ban-list-menu" onClick={(event) => event.stopPropagation()}>
                  <button type="button" onClick={() => onVoteAddress(record.senderAddress, true)} disabled={!canVote}>支持</button>
                  <button type="button" onClick={() => onVoteAddress(record.senderAddress, false)} disabled={!canVote}>反对</button>
                  <button type="button" onClick={() => onClearAddressVote(record.senderAddress)} disabled={!canVote}>撤票</button>
                  <button type="button" onClick={() => onOpenAddressVoters(record)}>投票列表</button>
                </div>
              )}
            </article>
          );
        }
        const key = menuKey('gov-nft', record.senderId.toString());
        return (
          <article className="list-row ban-list-row" key={record.senderId.toString()} onClick={() => onToggleMenu(key)}>
            <div>
              <strong>{nftLabel(senderNames, record.senderId)}</strong>
              <small>
                NFT #{record.senderId.toString()} · 支持 {formatGovWeightShare(record.supportWeight, totalVoteWeight)} · 反对 {formatGovWeightShare(record.opposeWeight, totalVoteWeight)} · {formatGovCount(record.voterCount)} 人 · {govMyVoteText(record, totalVoteWeight)}
              </small>
            </div>
            <span className={cn('pill', record.banned ? 'pill-bad' : 'pill-ok')}>
              {record.banned ? '已禁言' : '未禁言'}
            </span>
            {activeMenuKey === key && (
              <div className="ban-list-menu" onClick={(event) => event.stopPropagation()}>
                <button type="button" onClick={() => onVoteSender(record.senderId, true)} disabled={!canVote}>支持</button>
                <button type="button" onClick={() => onVoteSender(record.senderId, false)} disabled={!canVote}>反对</button>
                <button type="button" onClick={() => onClearSenderVote(record.senderId)} disabled={!canVote}>撤票</button>
                <button type="button" onClick={() => onOpenSenderVoters(record)}>投票列表</button>
              </div>
            )}
          </article>
        );
      }) : isPending ? (
        <div className="empty-state">读取中</div>
      ) : <div className="empty-state">暂无{queryType === 'address' ? '地址' : 'NFT'}投票目标</div>}
      {total !== undefined && total > BigInt(BAN_LIST_PAGE_SIZE) && (
        <div className="pager-row">
          <button className="sheet-button inline-flex" type="button" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>上一页</button>
          <span>{Math.min(page, totalPages)} / {totalPages}</span>
          <button className="sheet-button inline-flex" type="button" disabled={page >= totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))}>下一页</button>
        </div>
      )}
    </div>
  );
}
