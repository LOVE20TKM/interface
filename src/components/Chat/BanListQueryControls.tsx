import { Input } from '@/components/ui/input';
import NftOwnerLookup from '@/src/components/Extension/Base/Group/NftOwnerLookup';
import {
  type NftLookupMode,
  type NftLookupResult,
} from '@/src/hooks/extension/base/composite/useNftOwnerLookup';
import { cn } from '@/lib/utils';
import type { BanListQueryType } from './useBanListPanelState';

export function BanListQueryControls({
  queryType,
  queryInput,
  nftLookupMode,
  nftLookupValue,
  nftLookupResult,
  canAddBanListTarget,
  canAdd,
  isBusy,
  addLabel,
  onQueryTypeChange,
  onQueryInputChange,
  onNftLookupModeChange,
  onNftLookupValueChange,
  onQuerySelf,
  onAdd,
}: {
  queryType: BanListQueryType;
  queryInput: string;
  nftLookupMode: NftLookupMode;
  nftLookupValue: string;
  nftLookupResult: NftLookupResult;
  canAddBanListTarget: boolean;
  canAdd: boolean;
  isBusy: boolean;
  addLabel?: string;
  onQueryTypeChange: (queryType: BanListQueryType) => void;
  onQueryInputChange: (value: string) => void;
  onNftLookupModeChange: (mode: NftLookupMode) => void;
  onNftLookupValueChange: (value: string) => void;
  onQuerySelf: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="admin-id-controls ban-list-query-controls">
      <div className="filter-tabs ban-list-query-tabs">
        <button className={cn('filter-tab inline-flex', queryType === 'address' && 'active')} type="button" onClick={() => onQueryTypeChange('address')}>按地址</button>
        <button className={cn('filter-tab inline-flex', queryType === 'nft' && 'active')} type="button" onClick={() => onQueryTypeChange('nft')}>按NFT</button>
        <button className={cn('filter-tab inline-flex', queryType === 'message' && 'active')} type="button" onClick={() => onQueryTypeChange('message')}>按消息ID</button>
      </div>
      {queryType === 'nft' ? (
        <NftOwnerLookup
          className="ban-list-nft-lookup"
          lookupMode={nftLookupMode}
          onLookupModeChange={onNftLookupModeChange}
          lookupValue={nftLookupValue}
          onLookupValueChange={onNftLookupValueChange}
          lookupResult={nftLookupResult}
          placeholder="请输入要查询的NFT"
        />
      ) : (
        <Input
          value={queryInput}
          onChange={(event) => onQueryInputChange(event.target.value)}
          inputMode={queryType === 'message' ? 'numeric' : 'text'}
          placeholder={queryType === 'message' ? '输入消息 ID' : '请输入要查询的地址'}
        />
      )}
      <div className="admin-action-row ban-list-action-row">
        {queryType !== 'message' && (
          <button className="sheet-button inline-flex" type="button" onClick={onQuerySelf}>
            {queryType === 'address' ? '我的地址' : '我的 NFT'}
          </button>
        )}
        {queryType === 'message' ? (
          <button className="sheet-button primary inline-flex" type="button" onClick={onAdd}>
            查询消息ID
          </button>
        ) : canAddBanListTarget && (
          <button className="sheet-button primary inline-flex" type="button" onClick={onAdd} disabled={!canAdd || isBusy}>
            {addLabel || '加入禁言名单'}
          </button>
        )}
      </div>
    </div>
  );
}
