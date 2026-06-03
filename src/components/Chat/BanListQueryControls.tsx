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
  onQueryTypeChange,
  onQueryInputChange,
  onNftLookupModeChange,
  onNftLookupValueChange,
  onQuery,
}: {
  queryType: BanListQueryType;
  queryInput: string;
  nftLookupMode: NftLookupMode;
  nftLookupValue: string;
  nftLookupResult: NftLookupResult;
  onQueryTypeChange: (queryType: BanListQueryType) => void;
  onQueryInputChange: (value: string) => void;
  onNftLookupModeChange: (mode: NftLookupMode) => void;
  onNftLookupValueChange: (value: string) => void;
  onQuery: () => void;
}) {
  const placeholder = queryType === 'message' ? '输入消息 ID' : '请输入要查询的地址';

  return (
    <div className="admin-id-controls ban-list-query-controls">
      <div className="ban-list-query-head">
        <strong>查询或处理发言者</strong>
      </div>
      <div className="ban-list-query-form">
        <div className="ban-list-query-mode">
          <div className="filter-tabs ban-list-query-tabs" role="tablist" aria-label="禁言名单查询类型">
            <button className={cn('filter-tab inline-flex', queryType === 'mine' && 'active')} type="button" role="tab" aria-selected={queryType === 'mine'} onClick={() => onQueryTypeChange('mine')}>我的</button>
            <button className={cn('filter-tab inline-flex', queryType === 'address' && 'active')} type="button" role="tab" aria-selected={queryType === 'address'} onClick={() => onQueryTypeChange('address')}>地址</button>
            <button className={cn('filter-tab inline-flex', queryType === 'nft' && 'active')} type="button" role="tab" aria-selected={queryType === 'nft'} onClick={() => onQueryTypeChange('nft')}>NFT</button>
            <button className={cn('filter-tab inline-flex', queryType === 'message' && 'active')} type="button" role="tab" aria-selected={queryType === 'message'} onClick={() => onQueryTypeChange('message')}>消息 ID</button>
          </div>
        </div>
        {queryType !== 'mine' && (
          <>
            <div className="ban-list-query-field">
              {queryType === 'nft' ? (
                <NftOwnerLookup
                  className="ban-list-nft-lookup"
                  lookupMode={nftLookupMode}
                  onLookupModeChange={onNftLookupModeChange}
                  lookupValue={nftLookupValue}
                  onLookupValueChange={onNftLookupValueChange}
                  lookupResult={nftLookupResult}
                  placeholder="请输入要查询的 NFT"
                  resultVariant="compact"
                />
              ) : (
                <Input
                  value={queryInput}
                  onChange={(event) => onQueryInputChange(event.target.value)}
                  inputMode={queryType === 'message' ? 'numeric' : 'text'}
                  placeholder={placeholder}
                />
              )}
            </div>
            <div className="ban-list-query-submit">
              <button className="sheet-button primary inline-flex" type="button" onClick={onQuery}>
                查询
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
