import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TokenConfig } from '../utils/swapTypes';

interface TokenSelectorProps {
  selectedToken: TokenConfig;
  supportedTokens: TokenConfig[];
  onTokenSelect: (tokenAddress: string) => void;
  disabled?: boolean;
}

const TokenSelector = ({ selectedToken, supportedTokens, onTokenSelect, disabled }: TokenSelectorProps) => {
  return (
    <Select
      value={selectedToken.address}
      onValueChange={onTokenSelect}
      disabled={disabled}
    >
      <SelectTrigger className="w-auto border-none bg-card hover:bg-greyscale-50 px-3 py-1.5 rounded-full transition-colors border border-greyscale-200 font-mono">
        <div className="flex items-center gap-2">
          <span className="font-medium text-greyscale-800 font-mono">{selectedToken.symbol}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {supportedTokens.map((tokenConfig) => (
          <SelectItem
            key={tokenConfig.address}
            value={tokenConfig.address}
            className="font-mono"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono">{tokenConfig.symbol}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TokenSelector;