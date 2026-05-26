import NftOwnerLookup from '@/src/components/Extension/Base/Group/NftOwnerLookup';
import {
  type NftLookupMode,
  type NftLookupResult,
} from '@/src/hooks/extension/base/composite/useNftOwnerLookup';

export function ChatNftLookupActions({
  lookupMode,
  onLookupModeChange,
  lookupValue,
  onLookupValueChange,
  lookupResult,
  onQuerySelf,
  onAdd,
  addLabel,
  canAdd,
}: {
  lookupMode: NftLookupMode;
  onLookupModeChange: (mode: NftLookupMode) => void;
  lookupValue: string;
  onLookupValueChange: (value: string) => void;
  lookupResult: NftLookupResult;
  onQuerySelf: () => void;
  onAdd: () => void;
  addLabel: string;
  canAdd: boolean;
}) {
  return (
    <div className="admin-id-controls">
      <NftOwnerLookup
        lookupMode={lookupMode}
        onLookupModeChange={onLookupModeChange}
        lookupValue={lookupValue}
        onLookupValueChange={onLookupValueChange}
        lookupResult={lookupResult}
      />
      <div className="admin-action-row">
        <button className="sheet-button inline-flex" type="button" onClick={onQuerySelf}>查自己</button>
        <button type="button" className="sheet-button primary inline-flex" onClick={onAdd} disabled={!canAdd}>{addLabel}</button>
      </div>
    </div>
  );
}
