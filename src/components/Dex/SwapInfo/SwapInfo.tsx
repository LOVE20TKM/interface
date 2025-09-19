import { useMemo } from 'react';
import { formatIntegerStringWithCommas, formatUnits } from '@/src/lib/format';
import { TokenConfig, SwapMethod } from '../utils/swapTypes';
import { MIN_NATIVE_TO_TOKEN } from '../utils/swapConfig';

interface SwapInfoProps {
  fromToken: TokenConfig;
  toToken: TokenConfig;
  fromAmount: bigint;
  toAmount: bigint;
  watchFromAmount: string;
  swapMethod: SwapMethod;
  amountsOutError?: Error | null;
}

const SwapInfo = ({
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  watchFromAmount,
  swapMethod,
  amountsOutError,
}: SwapInfoProps) => {
  // 转换率计算
  const conversionRate = useMemo(() => {
    if (fromAmount > BigInt(0) && toAmount > BigInt(0)) {
      try {
        const fromStr = formatUnits(fromAmount);
        const toStr = formatUnits(toAmount);
        const fromNum = parseFloat(fromStr);
        const toNum = parseFloat(toStr);

        if (fromNum > 0) {
          const rate = toNum / fromNum;
          return formatIntegerStringWithCommas(rate.toString(), 2, 4);
        }
        return '0';
      } catch (error) {
        console.warn('转换率计算出错:', error);
        return '0';
      }
    }
    return '0';
  }, [fromAmount, toAmount]);

  // 手续费计算
  const feeInfo = useMemo(() => {
    if (swapMethod === 'WETH9') {
      return { feePercentage: 0, feeAmount: '0' };
    }

    const feePercentage = 0.3;
    const val = parseFloat(watchFromAmount || '0');
    const calculatedFee = (val * feePercentage) / 100;
    const feeAmount =
      calculatedFee < parseFloat(MIN_NATIVE_TO_TOKEN) ? calculatedFee.toExponential(2) : calculatedFee.toFixed(6);

    return { feePercentage, feeAmount };
  }, [swapMethod, watchFromAmount]);

  if (fromAmount <= BigInt(0)) return null;

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-md">
      {swapMethod === 'WETH9' && (
        <div className="text-sm text-green-600 mb-2">💡 这是 1:1 包装转换，无手续费，无滑点</div>
      )}

      {/* 价格查询失败时的友好提示 */}
      {amountsOutError && swapMethod !== 'WETH9' && (
        <div className="text-sm text-amber-600 mb-2 bg-amber-50 p-2 rounded border-l-4 border-amber-400">
          ⚠️ 价格信息更新中，请稍后重试。这通常是因为链上交易活跃导致的临时状态。
        </div>
      )}

      {!amountsOutError && (
        <>
          <div className="flex justify-between text-sm">
            <span className="text-greyscale-400">兑换率: </span>
            <span>
              1 {fromToken.symbol} = {conversionRate} {toToken.symbol}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-greyscale-400">手续费 ({feeInfo.feePercentage}%)：</span>
            <span>
              {feeInfo.feeAmount} {fromToken.symbol}
            </span>
          </div>

          {swapMethod !== 'WETH9' && (
            <div className="flex justify-between text-sm">
              <span className="text-greyscale-400">滑点上限 (自动)：</span>
              <span>0.5%</span>
            </div>
          )}
        </>
      )}

      {/* 当价格查询失败且输出金额为0时，显示额外说明 */}
      {amountsOutError && toAmount === BigInt(0) && swapMethod !== 'WETH9' && (
        <div className="text-xs text-gray-500 mt-2">
          💡 提示：同时进行相同交易可能会因MEV保护机制而失败，这是为了保护您的资金安全。
        </div>
      )}
    </div>
  );
};

export default SwapInfo;