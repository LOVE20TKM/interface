import { Input } from '@/components/ui/input';
import NftOwnerLookup from '@/src/components/Extension/Base/Group/NftOwnerLookup';
import {
  type NftLookupMode,
  type NftLookupResult,
} from '@/src/hooks/extension/base/composite/useNftOwnerLookup';
import { cn } from '@/lib/utils';

export function BlacklistQueryControls({
  queryType,
  queryInput,
  nftLookupMode,
  nftLookupValue,
  nftLookupResult,
  canAddBlacklistTarget,
  canAdd,
  onQueryTypeChange,
  onQueryInputChange,
  onNftLookupModeChange,
  onNftLookupValueChange,
  onQuerySelf,
  onAdd,
}: {
  queryType: 'address' | 'nft';
  queryInput: string;
  nftLookupMode: NftLookupMode;
  nftLookupValue: string;
  nftLookupResult: NftLookupResult;
  canAddBlacklistTarget: boolean;
  canAdd: boolean;
  onQueryTypeChange: (queryType: 'address' | 'nft') => void;
  onQueryInputChange: (value: string) => void;
  onNftLookupModeChange: (mode: NftLookupMode) => void;
  onNftLookupValueChange: (value: string) => void;
  onQuerySelf: () => void;
  onAdd: () => void;
}) {
  const actionCount = canAddBlacklistTarget ? 'count-2' : 'count-1';

  return (
    <>
      <div className="filter-tabs blacklist-query-tabs">
        <button className={cn('filter-tab inline-flex', queryType === 'address' && 'active')} type="button" onClick={() => onQueryTypeChange('address')}>按地址</button>
        <button className={cn('filter-tab inline-flex', queryType === 'nft' && 'active')} type="button" onClick={() => onQueryTypeChange('nft')}>按NFT</button>
      </div>
      <div className={cn('blacklist-controls', actionCount)}>
        {queryType === 'nft' ? (
          <NftOwnerLookup
            className="blacklist-nft-lookup"
            lookupMode={nftLookupMode}
            onLookupModeChange={onNftLookupModeChange}
            lookupValue={nftLookupValue}
            onLookupValueChange={onNftLookupValueChange}
            lookupResult={nftLookupResult}
          />
        ) : (
          <Input
            value={queryInput}
            onChange={(event) => onQueryInputChange(event.target.value)}
            inputMode="text"
            placeholder="输入地址 0x..."
          />
        )}
        <div className={cn('blacklist-action-row', actionCount)}>
          <button className="sheet-button inline-flex" type="button" onClick={onQuerySelf}>
            {queryType === 'address' ? '我的地址' : '我的 NFT'}
          </button>
          {canAddBlacklistTarget && (
            <button className="sheet-button primary inline-flex" type="button" onClick={onAdd} disabled={!canAdd}>
              加入黑名单
            </button>
          )}
        </div>
      </div>
    </>
  );
}
