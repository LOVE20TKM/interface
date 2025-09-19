import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { formatUnits, parseUnits } from '@/src/lib/format';
import { TokenConfig, SwapFormValues } from '../utils/swapTypes';
import { getSwapFormSchema } from '../utils/swapValidation';
import TokenSelector from './TokenSelector';
import AmountInput from './AmountInput';
import SwapButton from './SwapButton';

interface SwapFormProps {
  fromToken: TokenConfig;
  toToken: TokenConfig;
  supportedTokens: TokenConfig[];
  onFromTokenChange: (token: TokenConfig) => void;
  onToTokenChange: (token: TokenConfig) => void;
  onFromAmountChange: (amount: bigint) => void;
  onFromAmountStringChange: (amountString: string) => void;
  onSwapTokens: () => void;

  // 从 useSwapLogic 传入的数据
  fromAmount: bigint;
  toAmount: bigint;
  fromBalance?: bigint;
  toBalance?: bigint;
  maxNativeInputLimit?: bigint;
  isPendingFromBalance: boolean;
  isPendingToBalance: boolean;

  // 操作状态
  needsApproval: boolean;
  isApproved: boolean;
  isApproving: boolean;
  isSwapping: boolean;
  isSwapConfirmed: boolean;

  // 操作方法
  setMaxAmount: () => string;
  handleApprove: () => void;
  executeSwap: () => void;
}

const SwapForm = ({
  fromToken,
  toToken,
  supportedTokens,
  onFromTokenChange,
  onToTokenChange,
  onFromAmountChange,
  onFromAmountStringChange,
  onSwapTokens,
  fromAmount,
  toAmount,
  fromBalance,
  toBalance,
  maxNativeInputLimit,
  isPendingFromBalance,
  isPendingToBalance,
  needsApproval,
  isApproved,
  isApproving,
  isSwapping,
  isSwapConfirmed,
  setMaxAmount,
  handleApprove,
  executeSwap,
}: SwapFormProps) => {
  const router = useRouter();
  const isDisabled = isPendingFromBalance || isPendingToBalance;

  const form = useForm<SwapFormValues>({
    resolver: zodResolver(getSwapFormSchema(fromBalance || BigInt(0))),
    defaultValues: {
      fromTokenAmount: '',
      fromTokenAddress: fromToken.address,
      toTokenAddress: toToken.address,
    },
    mode: 'onChange',
  });

  // 同步表单值与代币状态
  useEffect(() => {
    form.setValue('fromTokenAddress', fromToken.address);
    form.setValue('toTokenAddress', toToken.address);
  }, [fromToken.address, toToken.address, form]);

  // 监听输入数量变化
  const watchFromAmount = form.watch('fromTokenAmount');
  useEffect(() => {
    onFromAmountStringChange(watchFromAmount || '0');
    try {
      const amount = parseUnits(watchFromAmount || '0');
      let finalAmount = amount;
      if (maxNativeInputLimit && amount > maxNativeInputLimit) {
        finalAmount = maxNativeInputLimit;
        const limitedStr = formatUnits(finalAmount);
        if (watchFromAmount && watchFromAmount !== limitedStr) {
          form.setValue('fromTokenAmount', limitedStr);
          toast('测试环境限制：最多可使用 ' + limitedStr + ' ' + fromToken.symbol);
        }
      }
      onFromAmountChange(finalAmount);
    } catch {
      onFromAmountChange(BigInt(0));
    }
  }, [watchFromAmount, maxNativeInputLimit, form, fromToken.symbol, onFromAmountChange, onFromAmountStringChange]);

  const handleFromTokenSelect = (tokenAddress: string) => {
    const selectedToken = supportedTokens.find((t) => t.address === tokenAddress);
    if (selectedToken) {
      if (selectedToken.address === toToken.address) {
        // 自动对调
        onFromTokenChange(selectedToken);
        onToTokenChange(fromToken);
        form.setValue('fromTokenAddress', selectedToken.address);
        form.setValue('toTokenAddress', fromToken.address);
        form.setValue('fromTokenAmount', '');
      } else {
        onFromTokenChange(selectedToken);
        form.setValue('fromTokenAddress', tokenAddress);
      }
    }
  };

  const handleToTokenSelect = (tokenAddress: string) => {
    const selectedToken = supportedTokens.find((t) => t.address === tokenAddress);
    if (selectedToken) {
      if (selectedToken.address === fromToken.address) {
        // 自动对调
        onFromTokenChange(toToken);
        onToTokenChange(selectedToken);
        form.setValue('fromTokenAddress', toToken.address);
        form.setValue('toTokenAddress', selectedToken.address);
        form.setValue('fromTokenAmount', '');
      } else {
        onToTokenChange(selectedToken);
        form.setValue('toTokenAddress', tokenAddress);
      }
    }
  };

  const handleSetPercentage = (percentage: number) => {
    const base = ((fromBalance ?? BigInt(0)) * BigInt(percentage)) / BigInt(100);
    const capped = maxNativeInputLimit
      ? base > maxNativeInputLimit
        ? maxNativeInputLimit
        : base
      : base;
    form.setValue('fromTokenAmount', formatUnits(capped));
  };

  const handleSetMax = () => {
    const maxStr = setMaxAmount();
    form.setValue('fromTokenAmount', maxStr);
  };

  return (
    <Form {...form}>
      <form>
        {/* From Token 输入框 */}
        <div className="mb-2">
          <FormField
            control={form.control}
            name="fromTokenAmount"
            render={({ field }) => (
              <FormItem>
                <AmountInput
                  value={field.value}
                  onChange={field.onChange}
                  token={fromToken}
                  balance={fromBalance}
                  disabled={isDisabled}
                  onSetPercentage={handleSetPercentage}
                  onSetMax={handleSetMax}
                  maxNativeInputLimit={maxNativeInputLimit}
                  tokenSelector={
                    <FormField
                      control={form.control}
                      name="fromTokenAddress"
                      render={({ field: selectField }) => (
                        <FormItem>
                          <FormControl>
                            <TokenSelector
                              selectedToken={fromToken}
                              supportedTokens={supportedTokens}
                              onTokenSelect={handleFromTokenSelect}
                              disabled={isDisabled}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  }
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 交换按钮 */}
        <div className="flex justify-center mb-1">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <Button
              variant="ghost"
              type="button"
              size="icon"
              className="rounded-full hover:bg-gray-100"
              onClick={onSwapTokens}
              disabled={isDisabled}
            >
              <ArrowDown className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
        </div>

        {/* To Token 输入框 */}
        <div className="mb-6">
          <AmountInput
            value={formatUnits(toAmount)}
            onChange={() => {}} // 输出金额不可编辑
            token={toToken}
            balance={toBalance}
            disabled
            readOnly
            showPercentageButtons={false}
            tokenSelector={
              <FormField
                control={form.control}
                name="toTokenAddress"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <TokenSelector
                        selectedToken={toToken}
                        supportedTokens={supportedTokens}
                        onTokenSelect={handleToTokenSelect}
                        disabled={isDisabled}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            }
          />
        </div>

        {/* 操作按钮 */}
        <SwapButton
          needsApproval={needsApproval}
          isApproved={isApproved}
          isApproving={isApproving}
          isSwapping={isSwapping}
          isSwapConfirmed={isSwapConfirmed}
          onApprove={form.handleSubmit(handleApprove)}
          onSwap={form.handleSubmit(executeSwap)}
          disabled={isDisabled}
        />
      </form>
    </Form>
  );
};

export default SwapForm;