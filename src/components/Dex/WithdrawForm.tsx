'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Settings, Zap } from 'lucide-react';

// UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// my funcs
import { formatTokenAmount, formatUnits, parseUnits } from '@/src/lib/format';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my hooks
import { useApprove, useAllowance } from '@/src/hooks/contracts/useLOVE20Token';
import { useRemoveLiquidity, useRemoveLiquidityETH } from '@/src/hooks/contracts/useUniswapV2Router';

// my components
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

// ================================================
// 接口定义
// ================================================
interface TokenConfig {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  isNative: boolean;
}

interface WithdrawFormProps {
  baseToken: TokenConfig;
  targetToken: TokenConfig;
  baseTokens: TokenConfig[];
  lpBalance: bigint;
  pairAddress: `0x${string}`;
  baseReserve: bigint;
  targetReserve: bigint;
  lpTotalSupply: bigint;
  onBaseTokenChange: (token: TokenConfig) => void;
  onRefreshData: () => void;
}

// ================================================
// 表单 Schema 定义
// ================================================
const getWithdrawFormSchema = (lpBalance: bigint) =>
  z.object({
    lpAmount: z
      .string()
      .nonempty('请输入LP数量')
      .refine(
        (val) => {
          if (val.endsWith('.')) return true;
          if (val === '0') return true;
          try {
            const amount = parseUnits(val);
            return amount > BigInt(0) && amount <= lpBalance;
          } catch (e) {
            return false;
          }
        },
        { message: '输入数量必须大于0且不超过您的LP余额' },
      ),
    baseTokenAddress: z.string(),
  });

type WithdrawFormValues = z.infer<ReturnType<typeof getWithdrawFormSchema>>;

// ================================================
// 主组件
// ================================================
const WithdrawForm: React.FC<WithdrawFormProps> = ({
  baseToken,
  targetToken,
  baseTokens,
  lpBalance,
  pairAddress,
  baseReserve,
  targetReserve,
  lpTotalSupply,
  onBaseTokenChange,
  onRefreshData,
}) => {
  const { address: account } = useAccount();

  // --------------------------------------------------
  // 1. LP代币授权查询
  // --------------------------------------------------
  const spenderAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_ROUTER as `0x${string}`;
  const {
    allowance: lpAllowance,
    refetch: refetchAllowance,
  } = useAllowance(pairAddress, account as `0x${string}`, spenderAddress);

  // --------------------------------------------------
  // 2. 表单设置
  // --------------------------------------------------
  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(getWithdrawFormSchema(lpBalance)),
    defaultValues: {
      lpAmount: '',
      baseTokenAddress: baseToken.address,
    },
    mode: 'onChange',
  });

  // 同步表单值与代币状态
  useEffect(() => {
    form.setValue('baseTokenAddress', baseToken.address);
  }, [baseToken.address, form]);

  const lpAmountValue = form.watch('lpAmount');
  const parsedLPAmount = parseUnits(lpAmountValue);

  // --------------------------------------------------
  // 3. 计算可获得的代币数量
  // --------------------------------------------------
  const { baseTokenAmount, targetTokenAmount } = useMemo(() => {
    if (!parsedLPAmount || !lpTotalSupply || !baseReserve || !targetReserve || lpTotalSupply === BigInt(0)) {
      return { baseTokenAmount: BigInt(0), targetTokenAmount: BigInt(0) };
    }

    // 计算可获得的代币数量
    const baseAmount = (parsedLPAmount * baseReserve) / lpTotalSupply;
    const targetAmount = (parsedLPAmount * targetReserve) / lpTotalSupply;

    return { baseTokenAmount: baseAmount, targetTokenAmount: targetAmount };
  }, [parsedLPAmount, lpTotalSupply, baseReserve, targetReserve]);

  // --------------------------------------------------
  // 4. LP代币授权逻辑
  // --------------------------------------------------
  const [isLPApproved, setIsLPApproved] = useState(false);

  // 根据授权额度判断授权状态
  useEffect(() => {
    if (parsedLPAmount && lpAllowance !== undefined) {
      setIsLPApproved(lpAllowance >= parsedLPAmount);
    } else {
      setIsLPApproved(false);
    }
  }, [parsedLPAmount, lpAllowance]);

  const {
    approve: approveLPToken,
    isPending: isPendingApproveLP,
    isConfirming: isConfirmingApproveLP,
    isConfirmed: isConfirmedApproveLP,
    writeError: errApproveLP,
  } = useApprove(pairAddress);

  const handleApproveLP = form.handleSubmit(async () => {
    try {
      const amount = parseUnits(lpAmountValue || '0');
      await approveLPToken(spenderAddress, amount);
    } catch (error: any) {
      console.error(error);
    }
  });

  useEffect(() => {
    if (isConfirmedApproveLP) {
      setIsLPApproved(true);
      toast.success('LP代币授权成功');
      // 授权成功后，刷新授权额度
      refetchAllowance();
    }
  }, [isConfirmedApproveLP, refetchAllowance]);

  // --------------------------------------------------
  // 5. 撤销流动性逻辑
  // --------------------------------------------------
  const {
    removeLiquidity,
    isWriting: isPendingRemoveLiquidity,
    isConfirming: isConfirmingRemoveLiquidity,
    isConfirmed: isConfirmedRemoveLiquidity,
    writeError: errRemoveLiquidity,
  } = useRemoveLiquidity();

  const {
    removeLiquidityETH,
    isWriting: isPendingRemoveLiquidityETH,
    isConfirming: isConfirmingRemoveLiquidityETH,
    isConfirmed: isConfirmedRemoveLiquidityETH,
    writeError: errRemoveLiquidityETH,
  } = useRemoveLiquidityETH();

  // --------------------------------------------------
  // 6. 滑点设置
  // --------------------------------------------------
  const [slippage, setSlippage] = useState(2.5); // 默认2.5%
  const [isSlippageDialogOpen, setIsSlippageDialogOpen] = useState(false);
  const [customSlippage, setCustomSlippage] = useState('');

  const handleRemoveLiquidity = form.handleSubmit(async () => {
    if (!isLPApproved) {
      toast.error('请先完成LP代币授权');
      return;
    }

    const lpAmount = parseUnits(lpAmountValue || '0');

    if (!lpAmount || lpAmount <= BigInt(0)) {
      toast.error('请输入有效的LP数量');
      return;
    }

    try {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60); // 20分钟deadline

      // 计算滑点保护的最小数量
      const slippageBigInt = BigInt(Math.round(slippage * 10)); // 将百分比转换为千分之一
      const baseAmountMin = (baseTokenAmount * (BigInt(1000) - slippageBigInt)) / BigInt(1000);
      const targetAmountMin = (targetTokenAmount * (BigInt(1000) - slippageBigInt)) / BigInt(1000);

      console.log('撤销流动性参数:', {
        baseToken: baseToken.symbol,
        targetToken: targetToken.symbol,
        lpAmount: lpAmount.toString(),
        baseAmountMin: baseAmountMin.toString(),
        targetAmountMin: targetAmountMin.toString(),
        slippage,
        deadline: deadline.toString(),
      });

      // 如果基础代币是原生代币，使用 removeLiquidityETH
      if (baseToken.isNative) {
        await removeLiquidityETH(
          targetToken.address,
          lpAmount,
          targetAmountMin,
          baseAmountMin,
          account as `0x${string}`,
          deadline,
        );
      } else {
        // 否则使用标准的 removeLiquidity
        await removeLiquidity(
          baseToken.address,
          targetToken.address,
          lpAmount,
          baseAmountMin,
          targetAmountMin,
          account as `0x${string}`,
          deadline,
        );
      }

      toast.success('撤销流动性交易已提交');
    } catch (error: any) {
      console.error('撤销流动性失败', error);
      handleContractError(error, 'liquidity');
    }
  });

  // --------------------------------------------------
  // 7. 成功处理 - 智能刷新数据
  // --------------------------------------------------
  useEffect(() => {
    if (isConfirmedRemoveLiquidity || isConfirmedRemoveLiquidityETH) {
      toast.success('撤销流动性成功！');

      // 清空表单
      form.reset({
        lpAmount: '',
        baseTokenAddress: baseToken.address,
      });
      setIsLPApproved(false);

      // 延迟刷新数据
      setTimeout(() => {
        onRefreshData();
      }, 2000);

      // 轮询刷新
      const refreshInterval = setInterval(() => {
        onRefreshData();
      }, 3000);

      // 10秒后停止轮询
      setTimeout(() => {
        clearInterval(refreshInterval);
      }, 10000);
    }
  }, [isConfirmedRemoveLiquidity, isConfirmedRemoveLiquidityETH, form, baseToken.address, onRefreshData]);

  // --------------------------------------------------
  // 8. 错误处理
  // --------------------------------------------------
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errApproveLP) {
      handleContractError(errApproveLP, 'liquidity');
    }
    if (errRemoveLiquidity) {
      handleContractError(errRemoveLiquidity, 'liquidity');
    }
    if (errRemoveLiquidityETH) {
      handleContractError(errRemoveLiquidityETH, 'liquidity');
    }
  }, [errApproveLP, errRemoveLiquidity, errRemoveLiquidityETH, handleContractError]);

  const isApproving = isPendingApproveLP;
  const isApproveConfirming = isConfirmingApproveLP;
  const isRemoving = isPendingRemoveLiquidity || isPendingRemoveLiquidityETH;
  const isConfirmingRemove = isConfirmingRemoveLiquidity || isConfirmingRemoveLiquidityETH;
  const isRemoveConfirmed = isConfirmedRemoveLiquidity || isConfirmedRemoveLiquidityETH;

  return (
    <>
      <Form {...form}>
        <form>
          {/* 交易对选择 */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-700 mb-3">选择交易对</div>

                <div className="grid grid-cols-2 gap-3">
                  {/* 基础代币选择 */}
                  <FormField
                    control={form.control}
                    name="baseTokenAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-500">基础代币</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(val) => {
                              const selectedToken = baseTokens.find((t) => t.address === val);
                              if (selectedToken) {
                                field.onChange(val);
                                onBaseTokenChange(selectedToken);
                              }
                            }}
                            value={field.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="选择代币" />
                            </SelectTrigger>
                            <SelectContent>
                              {baseTokens.map((token) => (
                                <SelectItem key={token.address} value={token.address}>
                                  {token.symbol}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 目标代币显示 */}
                  <FormItem>
                    <FormLabel className="text-xs text-gray-500">目标代币</FormLabel>
                    <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center text-sm text-gray-700">
                      {targetToken.symbol}
                    </div>
                  </FormItem>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LP数量输入框 */}
          <div className="mb-4">
            <FormField
              control={form.control}
              name="lpAmount"
              render={({ field }) => (
                <FormItem>
                  <Card className="bg-[#f7f8f9] border-none">
                    <CardContent className="py-4 px-2">
                      <div className="flex items-center justify-between mb-3">
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          className="text-xl border-none p-0 h-auto bg-transparent focus:ring-0 focus:outline-none mr-2"
                        />
                        <div className="bg-white px-3 py-1.5 rounded-full border border-gray-200">
                          <span className="font-medium text-gray-800 font-mono">LP</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-1">
                          {[25, 50, 75].map((percentage) => (
                            <Button
                              key={percentage}
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => {
                                const amount = (lpBalance * BigInt(percentage)) / BigInt(100);
                                form.setValue('lpAmount', formatUnits(amount));
                              }}
                              disabled={lpBalance <= BigInt(0)}
                              className="text-xs h-7 px-2 rounded-lg"
                            >
                              {percentage}%
                            </Button>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => {
                              form.setValue('lpAmount', formatUnits(lpBalance));
                            }}
                            disabled={lpBalance <= BigInt(0)}
                            className="text-xs h-7 px-2 rounded-lg"
                          >
                            最高
                          </Button>
                        </div>
                        <span className="text-sm text-gray-600">余额：{formatTokenAmount(lpBalance)} LP</span>
                      </div>
                    </CardContent>
                  </Card>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 预计获得的代币显示 */}
          {parsedLPAmount > BigInt(0) && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-gray-700 mb-3">预计获得</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{baseToken.symbol}</span>
                    <span className="font-medium">{formatTokenAmount(baseTokenAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{targetToken.symbol}</span>
                    <span className="font-medium">{formatTokenAmount(targetTokenAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 滑点设置 */}
          <div className="flex items-center text-sm mb-4">
            <div className="text-gray-600 flex items-center gap-1 mr-2">
              <Zap className="w-4 h-4" />
              滑点上限：{slippage}%
            </div>
            <Dialog open={isSlippageDialogOpen} onOpenChange={setIsSlippageDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs hover:bg-gray-100 transition-colors"
                  title="设置滑点"
                >
                  <Settings className="h-3 w-3" />
                  设置
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>滑点设置</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">选择滑点</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[0.5, 1.0, 2.5].map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          variant={slippage === preset ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setSlippage(preset);
                            setCustomSlippage('');
                            setIsSlippageDialogOpen(false);
                          }}
                          className="text-xs"
                        >
                          {preset}%
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">自定义滑点</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="输入滑点百分比"
                        value={customSlippage}
                        onChange={(e) => setCustomSlippage(e.target.value)}
                        className="flex-1"
                        min="0"
                        max="50"
                        step="0.1"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                    {customSlippage && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const value = parseFloat(customSlippage);
                          if (value >= 0 && value <= 50) {
                            setSlippage(value);
                            setIsSlippageDialogOpen(false);
                          } else {
                            toast.error('滑点应在 0-50% 之间');
                          }
                        }}
                        className="w-full"
                      >
                        应用自定义滑点
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* 授权和确认按钮 */}
          <div className="flex justify-center lg:justify-start space-x-2">
            <Button
              type="button"
              className="flex-1 lg:w-auto lg:px-4"
              disabled={isPendingApproveLP || isConfirmingApproveLP || isLPApproved}
              onClick={handleApproveLP}
            >
              {isPendingApproveLP
                ? '授权中...'
                : isConfirmingApproveLP
                ? '确认中...'
                : isLPApproved
                ? 'LP已授权'
                : '授权LP代币'}
            </Button>
            <Button
              className="flex-1 lg:w-auto lg:px-4"
              onClick={handleRemoveLiquidity}
              disabled={
                !isLPApproved || isRemoving || isConfirmingRemove || isRemoveConfirmed || parsedLPAmount <= BigInt(0)
              }
            >
              {isRemoving
                ? '提交中...'
                : isConfirmingRemove
                ? '确认中...'
                : isRemoveConfirmed
                ? '已撤销'
                : '撤销流动性'}
            </Button>
          </div>
        </form>
      </Form>

      <LoadingOverlay
        isLoading={isApproving || isApproveConfirming || isRemoving || isConfirmingRemove}
        text={isApproving || isRemoving ? '提交交易...' : isApproveConfirming ? '确认授权...' : '确认撤销流动性...'}
      />
    </>
  );
};

export default WithdrawForm;
