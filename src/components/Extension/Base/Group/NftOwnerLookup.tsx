import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  placeholder?: string;
}

const NftOwnerLookup: React.FC<NftOwnerLookupProps> = ({
  lookupMode,
  onLookupModeChange,
  lookupValue,
  onLookupValueChange,
  lookupResult,
  disabled = false,
  className,
  placeholder,
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'flex h-10 overflow-hidden rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <Select
          value={lookupMode}
          onValueChange={(value) => onLookupModeChange(value as NftLookupMode)}
          disabled={disabled}
        >
          <SelectTrigger className="h-full w-[112px] shrink-0 rounded-none border-0 border-r border-input bg-gray-50 px-3 focus:ring-0 focus:ring-offset-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id">NFT ID</SelectItem>
            <SelectItem value="name">NFT名称</SelectItem>
          </SelectContent>
        </Select>
        <Input
          aria-label={lookupMode === 'name' ? 'NFT名称' : 'NFT ID'}
          value={lookupValue}
          onChange={(event) => onLookupValueChange(event.target.value)}
          placeholder={placeholder || (lookupMode === 'name' ? '请输入NFT名称' : '请输入NFT ID')}
          disabled={disabled}
          className={cn(
            'h-full rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0',
            lookupMode === 'id' ? 'font-mono text-sm' : '',
          )}
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
            <span className="text-gray-500">NFT ID</span>
            <span className="font-mono text-secondary">#{lookupResult.tokenId.toString()}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-500">NFT名称</span>
            <span className="font-medium text-gray-900">{lookupResult.groupName}</span>
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
