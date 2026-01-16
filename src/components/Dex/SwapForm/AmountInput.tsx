import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { formatTokenAmount, formatUnits } from '@/src/lib/format';
import { TokenConfig } from '../utils/swapTypes';
import { MIN_NATIVE_TO_TOKEN } from '../utils/swapConfig';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  token: TokenConfig;
  balance?: bigint;
  disabled?: boolean;
  readOnly?: boolean;
  onSetPercentage?: (percentage: number) => void;
  onSetMax?: () => void;
  maxNativeInputLimit?: bigint;
  showPercentageButtons?: boolean;
  tokenSelector?: React.ReactNode; // 可选的代币选择器
}

const AmountInput = ({
  value,
  onChange,
  token,
  balance,
  disabled,
  readOnly,
  onSetPercentage,
  onSetMax,
  maxNativeInputLimit,
  showPercentageButtons = true,
  tokenSelector,
}: AmountInputProps) => {
  return (
    <Card className="bg-[#f7f8f9] border-none">
      <CardContent className="py-4 px-2">
        <div className="flex items-center justify-between mb-3">
          <Input
            type="number"
            placeholder="0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            className="text-xl border-none p-0 h-auto bg-transparent focus:ring-0 focus:outline-none mr-2"
          />
          {tokenSelector}
        </div>

        <div className="flex items-center justify-between">
          {showPercentageButtons && onSetPercentage && onSetMax ? (
            <div className="flex space-x-1">
              {[25, 50].map((percentage) => (
                <Button
                  key={percentage}
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => onSetPercentage(percentage)}
                  disabled={disabled || (balance || BigInt(0)) <= BigInt(0)}
                  className="text-xs h-7 px-2 rounded-lg"
                >
                  {percentage}%
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={onSetMax}
                disabled={disabled || (balance || BigInt(0)) <= BigInt(0)}
                className="text-xs h-7 px-2 rounded-lg"
              >
                最高
              </Button>
            </div>
          ) : (
            <div />
          )}

          <span className="text-sm text-gray-600">
            {formatTokenAmount(balance || BigInt(0))} {token.symbol}
          </span>
        </div>

        {maxNativeInputLimit && (
          <div className="text-xs text-gray-500 mt-2">
            测试环境限制：
            {token.isWETH ? '最多可使用 1 ' : `最多可使用 ${MIN_NATIVE_TO_TOKEN} `}
            {token.symbol}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AmountInput;
