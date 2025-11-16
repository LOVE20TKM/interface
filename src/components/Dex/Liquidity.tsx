'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowUpDown, HelpCircle, Settings, Zap, RefreshCw, Search, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// my funcs
import {
  formatIntegerStringWithCommas,
  formatTokenAmount,
  formatUnits,
  parseUnits,
  formatPercentage,
} from '@/src/lib/format';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my hooks
import { useApprove } from '@/src/hooks/contracts/useLOVE20Token';
import { useAddLiquidity, useAddLiquidityETH } from '@/src/hooks/contracts/useUniswapV2Router';
import { useLiquidityPageData } from '@/src/hooks/composite/useLiquidityPageData';

// my context
import useTokenContext from '@/src/hooks/context/useTokenContext';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

// ================================================
// Token 配置接口定义
// ================================================
interface TokenConfig {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  isNative: boolean;
}

// 构建支持的基础代币列表 (TUSDT, TKM20)
const buildBaseTokens = (): TokenConfig[] => {
  const supportedTokens: TokenConfig[] = [];

  // 1. TUSDT (如果配置了地址)
  const usdtSymbol = process.env.NEXT_PUBLIC_USDT_SYMBOL;
  const usdtAddress = process.env.NEXT_PUBLIC_USDT_ADDRESS;
  if (usdtSymbol && usdtAddress) {
    supportedTokens.push({
      symbol: usdtSymbol,
      address: usdtAddress as `0x${string}`,
      decimals: 18,
      isNative: false,
    });
  }

  // 2. TKM20 (父代币)
  const parentSymbol = process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL;
  const parentAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN;
  if (parentSymbol && parentAddress) {
    supportedTokens.push({
      symbol: parentSymbol,
      address: parentAddress as `0x${string}`,
      decimals: 18,
      isNative: false,
    });
  }

  return supportedTokens;
};

// 移除了原来的 useTokenBalance Hook，现在使用 useLiquidityPageData 统一处理

// ================================================
// 表单 Schema 定义
// ================================================
const getLiquidityFormSchema = (baseBalance: bigint, tokenBalance: bigint) =>
  z.object({
    baseTokenAmount: z
      .string()
      .nonempty('请输入数量')
      .refine(
        (val) => {
          if (val.endsWith('.')) return true;
          if (val === '0') return true;
          try {
            const amount = parseUnits(val);
            return amount > BigInt(0) && amount <= baseBalance;
          } catch (e) {
            return false;
          }
        },
        { message: '输入数量必须大于0且不超过您的可用余额' },
      ),
    tokenAmount: z
      .string()
      .nonempty('请输入数量')
      .refine(
        (val) => {
          if (val.endsWith('.')) return true;
          if (val === '0') return true;
          try {
            const amount = parseUnits(val);
            return amount > BigInt(0) && amount <= tokenBalance;
          } catch (e) {
            return false;
          }
        },
        { message: '输入数量必须大于0且不超过您的可用余额' },
      ),
    baseTokenAddress: z.string(),
  });

type LiquidityFormValues = z.infer<ReturnType<typeof getLiquidityFormSchema>>;

// ================================================
// 主组件
// ================================================
const LiquidityPanel = () => {
  const { address: account } = useAccount();
  const { token } = useTokenContext();

  // --------------------------------------------------
  // 1. 构建支持的代币列表
  // --------------------------------------------------
  const baseTokens = useMemo(() => buildBaseTokens(), []);

  // 选中的基础代币状态
  const [baseToken, setBaseToken] = useState<TokenConfig>(() => {
    const usdtSymbol = process.env.NEXT_PUBLIC_USDT_SYMBOL;
    const defaultToken = baseTokens.find((t) => t.symbol === usdtSymbol);
    return (
      defaultToken || {
        symbol: process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL || '',
        address:
          (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN as `0x${string}`) ||
          '0x0000000000000000000000000000000000000000',
        decimals: 18,
        isNative: false,
      }
    );
  });

  // 目标代币 (当前token)
  const targetToken = useMemo(() => {
    if (!token) return null;
    return {
      symbol: token.symbol,
      address: token.address as `0x${string}`,
      decimals: 18,
      isNative: false,
    };
  }, [token]);

  // --------------------------------------------------
  // 2. 使用优化后的流动性页面数据查询hook
  // --------------------------------------------------
  const {
    baseBalance,
    targetBalance: tokenBalance,
    baseAllowance,
    targetAllowance,
    lpBalance,
    lpTotalSupply,
    pairAddress,
    pairExists,
    baseReserve,
    targetReserve,
    isLoading: isLoadingLiquidityData,
    refreshLiquidityData,
  } = useLiquidityPageData({
    baseToken,
    targetToken,
    account,
  });

  // --------------------------------------------------
  // 3. 表单设置
  // --------------------------------------------------
  const form = useForm<LiquidityFormValues>({
    resolver: zodResolver(getLiquidityFormSchema(baseBalance || BigInt(0), tokenBalance || BigInt(0))),
    defaultValues: {
      baseTokenAmount: '',
      tokenAmount: '',
      baseTokenAddress: baseToken.address,
    },
    mode: 'onChange',
  });

  // 同步表单值与代币状态
  useEffect(() => {
    form.setValue('baseTokenAddress', baseToken.address);
  }, [baseToken.address, form]);

  // --------------------------------------------------
  // 4. 自动计算数量逻辑
  // --------------------------------------------------
  const [isBaseTokenChangedByUser, setIsBaseTokenChangedByUser] = useState(false);
  const [isTokenChangedByUser, setIsTokenChangedByUser] = useState(false);

  const baseTokenValue = form.watch('baseTokenAmount');
  const tokenAmountValue = form.watch('tokenAmount');
  const parsedBaseAmount = parseUnits(baseTokenValue);
  const parsedTokenAmount = parseUnits(tokenAmountValue);

  // 根据流动性池储备量计算另一个代币的数量
  // 当用户修改基础代币数量时，计算需要的目标代币数量
  useEffect(() => {
    if (
      isBaseTokenChangedByUser &&
      parsedBaseAmount &&
      parsedBaseAmount > BigInt(0) &&
      pairExists &&
      baseReserve &&
      targetReserve
    ) {
      // 使用 AMM 公式：ratio = baseAmount / targetAmount
      const calculatedTokenAmount = (parsedBaseAmount * targetReserve) / baseReserve;
      const calculatedStr = Number(formatUnits(calculatedTokenAmount))
        .toFixed(12)
        .replace(/\.?0+$/, '');
      form.setValue('tokenAmount', calculatedStr, { shouldValidate: true });
      setIsBaseTokenChangedByUser(false);
      setIsTokenChangedByUser(false);
    } else if (isBaseTokenChangedByUser && (!pairExists || !baseReserve || !targetReserve)) {
      // 如果池子不存在，可以自由设置比例
      form.setValue('tokenAmount', '', { shouldValidate: true });
      setIsBaseTokenChangedByUser(false);
      setIsTokenChangedByUser(false);
    }
  }, [isBaseTokenChangedByUser, parsedBaseAmount, pairExists, baseReserve, targetReserve, form]);

  // 当用户修改目标代币数量时，计算需要的基础代币数量
  useEffect(() => {
    if (
      isTokenChangedByUser &&
      parsedTokenAmount &&
      parsedTokenAmount > BigInt(0) &&
      pairExists &&
      baseReserve &&
      targetReserve
    ) {
      // 使用 AMM 公式：ratio = baseAmount / targetAmount
      const calculatedBaseAmount = (parsedTokenAmount * baseReserve) / targetReserve;
      const calculatedStr = Number(formatUnits(calculatedBaseAmount))
        .toFixed(12)
        .replace(/\.?0+$/, '');
      form.setValue('baseTokenAmount', calculatedStr, { shouldValidate: true });
      setIsBaseTokenChangedByUser(false);
      setIsTokenChangedByUser(false);
    } else if (isTokenChangedByUser && (!pairExists || !baseReserve || !targetReserve)) {
      // 如果池子不存在，可以自由设置比例
      form.setValue('baseTokenAmount', '', { shouldValidate: true });
      setIsBaseTokenChangedByUser(false);
      setIsTokenChangedByUser(false);
    }
  }, [isTokenChangedByUser, parsedTokenAmount, pairExists, baseReserve, targetReserve, form]);

  // --------------------------------------------------
  // 5. 授权逻辑
  // --------------------------------------------------
  const [isBaseTokenApproved, setIsBaseTokenApproved] = useState(false);
  const [isTokenApproved, setIsTokenApproved] = useState(false);

  // 根据授权额度判断授权状态
  useEffect(() => {
    if (parsedBaseAmount && baseAllowance !== undefined) {
      setIsBaseTokenApproved(baseAllowance >= parsedBaseAmount);
    } else if (baseToken.isNative) {
      setIsBaseTokenApproved(true); // 原生代币不需要授权
    } else {
      setIsBaseTokenApproved(false);
    }
  }, [parsedBaseAmount, baseAllowance, baseToken.isNative]);

  useEffect(() => {
    if (parsedTokenAmount && targetAllowance !== undefined) {
      setIsTokenApproved(targetAllowance >= parsedTokenAmount);
    } else {
      setIsTokenApproved(false);
    }
  }, [parsedTokenAmount, targetAllowance]);

  const {
    approve: approveBaseToken,
    isPending: isPendingApproveBase,
    isConfirming: isConfirmingApproveBase,
    isConfirmed: isConfirmedApproveBase,
    writeError: errApproveBase,
  } = useApprove(baseToken.address);

  const {
    approve: approveToken,
    isPending: isPendingApproveToken,
    isConfirming: isConfirmingApproveToken,
    isConfirmed: isConfirmedApproveToken,
    writeError: errApproveToken,
  } = useApprove(targetToken?.address as `0x${string}`);

  const spenderAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_ROUTER as `0x${string}`;

  const handleApproveBase = form.handleSubmit(async () => {
    try {
      const amount = parseUnits(baseTokenValue || '0');
      await approveBaseToken(spenderAddress, amount);
    } catch (error: any) {
      console.error(error);
    }
  });

  const handleApproveToken = form.handleSubmit(async () => {
    try {
      const amount = parseUnits(tokenAmountValue || '0');
      await approveToken(spenderAddress, amount);
    } catch (error: any) {
      console.error(error);
    }
  });

  useEffect(() => {
    if (isConfirmedApproveBase) {
      setIsBaseTokenApproved(true);
      toast.success(`授权${baseToken.symbol}成功`);
    }
  }, [isConfirmedApproveBase, baseToken.symbol]);

  useEffect(() => {
    if (isConfirmedApproveToken) {
      setIsTokenApproved(true);
      toast.success(`授权${targetToken?.symbol}成功`);
    }
  }, [isConfirmedApproveToken, targetToken?.symbol]);

  // --------------------------------------------------
  // 6. 添加流动性逻辑
  // --------------------------------------------------
  const {
    addLiquidity,
    isWriting: isPendingAddLiquidity,
    isConfirming: isConfirmingAddLiquidity,
    isConfirmed: isConfirmedAddLiquidity,
    writeError: errAddLiquidity,
  } = useAddLiquidity();

  const {
    addLiquidityETH,
    isWriting: isPendingAddLiquidityETH,
    isConfirming: isConfirmingAddLiquidityETH,
    isConfirmed: isConfirmedAddLiquidityETH,
    writeError: errAddLiquidityETH,
  } = useAddLiquidityETH();

  const handleAddLiquidity = form.handleSubmit(async () => {
    if (!isBaseTokenApproved || !isTokenApproved) {
      toast.error('请先完成授权');
      return;
    }

    if (!targetToken) {
      toast.error('目标代币未加载');
      return;
    }

    const baseAmount = parseUnits(baseTokenValue || '0');
    const tokenAmount = parseUnits(tokenAmountValue || '0');

    if (!baseAmount || !tokenAmount || baseAmount <= BigInt(0) || tokenAmount <= BigInt(0)) {
      toast.error('请输入有效的数量');
      return;
    }

    try {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60); // 20分钟deadline

      // 计算滑点保护的最小数量
      const slippageBigInt = BigInt(Math.round(slippage * 10)); // 将百分比转换为千分之一
      const baseAmountMin = (baseAmount * (BigInt(1000) - slippageBigInt)) / BigInt(1000);
      const tokenAmountMin = (tokenAmount * (BigInt(1000) - slippageBigInt)) / BigInt(1000);

      console.log('添加流动性参数:', {
        baseToken: baseToken.symbol,
        targetToken: targetToken.symbol,
        baseAmount: baseAmount.toString(),
        tokenAmount: tokenAmount.toString(),
        baseAmountMin: baseAmountMin.toString(),
        tokenAmountMin: tokenAmountMin.toString(),
        slippage,
        deadline: deadline.toString(),
      });

      // 如果基础代币是原生代币，使用 addLiquidityETH
      if (baseToken.isNative) {
        await addLiquidityETH(
          targetToken.address,
          tokenAmount,
          tokenAmountMin,
          baseAmountMin,
          account as `0x${string}`,
          deadline,
          baseAmount, // ETH value
        );
      } else {
        // 否则使用标准的 addLiquidity
        await addLiquidity(
          baseToken.address,
          targetToken.address,
          baseAmount,
          tokenAmount,
          baseAmountMin,
          tokenAmountMin,
          account as `0x${string}`,
          deadline,
        );
      }

      toast.success('添加流动性交易已提交');
    } catch (error: any) {
      console.error('添加流动性失败', error);
      handleContractError(error, 'liquidity');
    }
  });

  // --------------------------------------------------
  // 7. 价格比例显示
  // --------------------------------------------------
  const [showTokenToBase, setShowTokenToBase] = useState(false);

  // 价格计算
  const priceInfo = useMemo(() => {
    if (!pairExists || !baseReserve || !targetReserve) {
      return null;
    }

    const baseToTarget = (targetReserve * BigInt(10 ** 18)) / baseReserve;
    const targetToBase = (baseReserve * BigInt(10 ** 18)) / targetReserve;

    return {
      baseToTarget,
      targetToBase,
    };
  }, [pairExists, baseReserve, targetReserve]);

  // 移除了旧的 exchangeRate 逻辑，现在使用 priceInfo

  // --------------------------------------------------
  // 8. 滑点设置
  // --------------------------------------------------
  const [slippage, setSlippage] = useState(2.5); // 默认2.5%
  const [isSlippageDialogOpen, setIsSlippageDialogOpen] = useState(false);
  const [customSlippage, setCustomSlippage] = useState('');

  // --------------------------------------------------
  // 9. 成功处理 - 智能刷新数据
  // --------------------------------------------------
  useEffect(() => {
    if (isConfirmedAddLiquidity || isConfirmedAddLiquidityETH) {
      toast.success('添加流动性成功！');

      // 清空表单
      form.reset({
        baseTokenAmount: '',
        tokenAmount: '',
        baseTokenAddress: baseToken.address,
      });
      setIsBaseTokenApproved(false);
      setIsTokenApproved(false);

      // 立即刷新一次
      refreshLiquidityData();

      // 延迟刷新数据，等待区块确认
      const timeout1 = setTimeout(() => {
        refreshLiquidityData();
      }, 2000); // 2秒后刷新

      // 立即启动轮询刷新，确保数据最终一致性
      const refreshInterval = setInterval(() => {
        refreshLiquidityData();
      }, 3000); // 每3秒刷新一次

      // 10秒后停止轮询
      const timeout2 = setTimeout(() => {
        clearInterval(refreshInterval);
      }, 10000);

      // 清理函数，避免内存泄漏
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearInterval(refreshInterval);
      };
    }
  }, [isConfirmedAddLiquidity, isConfirmedAddLiquidityETH, form, baseToken.address, refreshLiquidityData]);

  // --------------------------------------------------
  // 10. 错误处理
  // --------------------------------------------------
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errApproveBase) {
      handleContractError(errApproveBase, 'liquidity');
    }
    if (errApproveToken) {
      handleContractError(errApproveToken, 'liquidity');
    }
    if (errAddLiquidity) {
      handleContractError(errAddLiquidity, 'liquidity');
    }
    if (errAddLiquidityETH) {
      handleContractError(errAddLiquidityETH, 'liquidity');
    }
  }, [errApproveBase, errApproveToken, errAddLiquidity, errAddLiquidityETH, handleContractError]);

  // --------------------------------------------------
  // 11. 加载状态
  // --------------------------------------------------
  if (!token || !targetToken || isLoadingLiquidityData) {
    return <LoadingIcon />;
  }

  const isApproving = isPendingApproveBase || isPendingApproveToken;
  const isApproveConfirming = isConfirmingApproveBase || isConfirmingApproveToken;
  const isAddingLiquidity = isPendingAddLiquidity || isPendingAddLiquidityETH;
  const isConfirmingLiquidity = isConfirmingAddLiquidity || isConfirmingAddLiquidityETH;
  const isAddLiquidityConfirmed = isConfirmedAddLiquidity || isConfirmedAddLiquidityETH;
  const isDisabled = isLoadingLiquidityData;

  return (
    <div className="py-6 px-2">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm">
          <span className="text-gray-600">底池总LP:&nbsp;</span>
          <span className="text-secondary">{formatTokenAmount(lpTotalSupply || BigInt(0))}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm">
            <span className="text-gray-600">我的LP:&nbsp;</span>
            <span className="text-secondary">
              {formatTokenAmount(lpBalance || BigInt(0))}
              {lpTotalSupply && lpTotalSupply > BigInt(0) && lpBalance && lpBalance > BigInt(0) && (
                <span className="text-gray-500 ml-1">
                  ({formatPercentage((Number(lpBalance) / Number(lpTotalSupply)) * 100)})
                </span>
              )}
            </span>
          </div>
          {(lpBalance || BigInt(0)) > BigInt(0) && (
            <Link
              href={`/dex/withdraw?baseToken=${encodeURIComponent(baseToken.symbol)}`}
              className="inline-flex items-center gap-1 text-sm text-secondary hover:text-blue-800 transition-colors underline"
              title="撤出流动性"
            >
              撤出
            </Link>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <LeftTitle title="流动性添加" />
      </div>

      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
        <Form {...form}>
          <form>
            {/* 基础代币输入框 */}
            <div className="mb-2">
              <FormField
                control={form.control}
                name="baseTokenAmount"
                render={({ field }) => (
                  <FormItem>
                    <Card className="bg-[#f7f8f9] border-none">
                      <CardContent className="py-4 px-2">
                        <div className="flex items-center justify-between mb-3">
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            disabled={isDisabled}
                            onChange={(e) => {
                              field.onChange(e);
                              setIsBaseTokenChangedByUser(true);
                            }}
                            className="text-xl border-none p-0 h-auto bg-transparent focus:ring-0 focus:outline-none mr-2"
                          />
                          <FormField
                            control={form.control}
                            name="baseTokenAddress"
                            render={({ field: selectField }) => (
                              <FormItem>
                                <FormControl>
                                  <Select
                                    value={selectField.value}
                                    onValueChange={(val) => {
                                      const selectedToken = baseTokens.find((t) => t.address === val);
                                      if (selectedToken) {
                                        selectField.onChange(val);
                                        setBaseToken(selectedToken);
                                      }
                                    }}
                                    disabled={isDisabled}
                                  >
                                    <SelectTrigger className="w-auto border-none bg-white hover:bg-gray-50 px-3 py-1.5 rounded-full transition-colors border border-gray-200 font-mono">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-800 font-mono">{baseToken.symbol}</span>
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {baseTokens.map((tokenConfig) => (
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
                                </FormControl>
                              </FormItem>
                            )}
                          />
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
                                  const amount = ((baseBalance ?? BigInt(0)) * BigInt(percentage)) / BigInt(100);
                                  form.setValue('baseTokenAmount', formatUnits(amount));
                                  setIsBaseTokenChangedByUser(true);
                                }}
                                disabled={isDisabled || (baseBalance || BigInt(0)) <= BigInt(0)}
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
                                form.setValue('baseTokenAmount', formatUnits(baseBalance || BigInt(0)));
                                setIsBaseTokenChangedByUser(true);
                              }}
                              disabled={isDisabled || (baseBalance || BigInt(0)) <= BigInt(0)}
                              className="text-xs h-7 px-2 rounded-lg"
                            >
                              最高
                            </Button>
                          </div>
                          <span className="text-sm text-gray-600">
                            {formatTokenAmount(baseBalance || BigInt(0))} {baseToken.symbol}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 目标代币输入框 */}
            <div className="mb-6">
              <FormField
                control={form.control}
                name="tokenAmount"
                render={({ field }) => (
                  <FormItem>
                    <Card className="bg-[#f7f8f9] border-none">
                      <CardContent className="py-4 px-2">
                        <div className="flex items-center justify-between mb-3">
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            disabled={isDisabled}
                            onChange={(e) => {
                              field.onChange(e);
                              setIsTokenChangedByUser(true);
                            }}
                            className="text-xl border-none p-0 h-auto bg-transparent focus:ring-0 focus:outline-none mr-2"
                          />
                          <div className="bg-white px-3 py-1.5 rounded-full border border-gray-200">
                            <span className="font-medium text-gray-800 font-mono">{targetToken.symbol}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="text-sm text-gray-600">
                            {formatTokenAmount(tokenBalance || BigInt(0))} {targetToken.symbol}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 价格比例显示 */}
            {priceInfo && (
              <div className="space-y-1 text-sm mb-4">
                <div className="text-gray-600 flex items-center gap-1">
                  <HelpCircle className="w-4 h-4" />
                  当前池价格：
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-gray-600">
                    {showTokenToBase ? (
                      <>
                        1 {targetToken.symbol} = {formatTokenAmount(priceInfo.targetToBase)} {baseToken.symbol}
                      </>
                    ) : (
                      <>
                        1 {baseToken.symbol} = {formatTokenAmount(priceInfo.baseToTarget)} {targetToken.symbol}
                      </>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTokenToBase(!showTokenToBase)}
                    className="h-6 w-6 p-0 hover:bg-gray-100 transition-colors"
                    title="切换价格显示"
                  >
                    <ArrowUpDown className="h-3 w-3 text-gray-500" />
                  </Button>
                </div>
              </div>
            )}
            {!priceInfo && pairExists && (
              <div className="space-y-1 text-sm mb-4">
                <div className="text-gray-600 flex items-center gap-1">
                  <HelpCircle className="w-4 h-4" />
                  正在加载价格信息...
                </div>
              </div>
            )}
            {!pairExists && (
              <div className="space-y-1 text-sm mb-4">
                <div className="text-gray-600 flex items-center gap-1">
                  <HelpCircle className="w-4 h-4" />
                  将创建新的流动性池
                </div>
              </div>
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
                disabled={isPendingApproveBase || isConfirmingApproveBase || isBaseTokenApproved}
                onClick={handleApproveBase}
              >
                {isPendingApproveBase
                  ? '1.授权中...'
                  : isConfirmingApproveBase
                  ? '1.确认中...'
                  : isBaseTokenApproved
                  ? `1.${baseToken.symbol}已授权`
                  : `1.授权${baseToken.symbol}`}
              </Button>
              <Button
                type="button"
                className="flex-1 lg:w-auto lg:px-4"
                disabled={!isBaseTokenApproved || isPendingApproveToken || isConfirmingApproveToken || isTokenApproved}
                onClick={handleApproveToken}
              >
                {isPendingApproveToken
                  ? '2.授权中...'
                  : isConfirmingApproveToken
                  ? '2.确认中...'
                  : isTokenApproved
                  ? `2.${targetToken.symbol}已授权`
                  : `2.授权${targetToken.symbol}`}
              </Button>
              <Button
                className="flex-1 lg:w-auto lg:px-4"
                onClick={handleAddLiquidity}
                disabled={
                  !isBaseTokenApproved ||
                  !isTokenApproved ||
                  isAddingLiquidity ||
                  isConfirmingLiquidity ||
                  isAddLiquidityConfirmed
                }
              >
                {isAddingLiquidity
                  ? '3.提交中...'
                  : isConfirmingLiquidity
                  ? '3.确认中...'
                  : isAddLiquidityConfirmed
                  ? '3.已添加'
                  : '3.提交'}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <LoadingOverlay
        isLoading={isApproving || isApproveConfirming || isAddingLiquidity || isConfirmingLiquidity}
        text={
          isApproving || isAddingLiquidity ? '提交交易...' : isApproveConfirming ? '确认授权...' : '确认添加流动性...'
        }
      />
    </div>
  );
};

export default LiquidityPanel;
