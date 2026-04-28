import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import { NftLookupMode, NftLookupResult } from '@/src/hooks/extension/base/composite/useNftOwnerLookup';

interface NftOwnerLookupProps {
  lookupMode: NftLookupMode;
  onLookupModeChange: (mode: NftLookupMode) => void;
  lookupValue: string;
  onLookupValueChange: (value: string) => void;
  lookupResult: NftLookupResult;
  disabled?: boolean;
  className?: string;
}

const NftOwnerLookup: React.FC<NftOwnerLookupProps> = ({
  lookupMode,
  onLookupModeChange,
  lookupValue,
  onLookupValueChange,
  lookupResult,
  disabled = false,
  className,
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={
            lookupMode === 'name' ? 'border-secondary bg-secondary text-white hover:bg-secondary/90 hover:text-white' : ''
          }
          onClick={() => onLookupModeChange('name')}
          disabled={disabled}
        >
          NFT名称
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={
            lookupMode === 'id' ? 'border-secondary bg-secondary text-white hover:bg-secondary/90 hover:text-white' : ''
          }
          onClick={() => onLookupModeChange('id')}
          disabled={disabled}
        >
          NFT ID
        </Button>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">{lookupMode === 'name' ? 'NFT名称' : 'NFT ID'}</Label>
        <Input
          value={lookupValue}
          onChange={(event) => onLookupValueChange(event.target.value)}
          placeholder={lookupMode === 'name' ? '请输入NFT名称' : '请输入NFT ID'}
          disabled={disabled}
          className={lookupMode === 'id' ? 'font-mono text-sm' : ''}
        />
      </div>

      {lookupResult?.status === 'loading' && <div className="text-xs text-gray-400">查询中...</div>}

      {(lookupResult?.status === 'invalid' || lookupResult?.status === 'not_found') && (
        <div className="text-xs text-gray-400">{lookupResult.message}</div>
      )}

      {lookupResult?.status === 'error' && <div className="text-xs text-red-500">{lookupResult.message}</div>}

      {lookupResult?.status === 'resolved' && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-500">NFT名称</span>
            <span className="font-medium text-gray-900">{lookupResult.groupName}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-500">NFT ID</span>
            <span className="font-mono text-secondary">#{lookupResult.tokenId.toString()}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-500">当前持有人地址</span>
            <AddressWithCopyButton
              address={lookupResult.owner}
              showAddress={true}
              showCopyButton={true}
              colorClassName="text-gray-600"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NftOwnerLookup;
