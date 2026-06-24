'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowUpDown, HelpCircle, Settings, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// my funcs
import { formatTokenAmount, formatUnits, formatPercentage } from '@/src/lib/format';
import {
  calculateLiquiditySlippageMins,
  formatLiquidityAmountInputError,
  parseLiquidityAmountInput,
} from '@/src/lib/liquidityAmountInput';
import { liquidityZapPreference } from '@/src/lib/uiPreferences';
import { parseContractError } from '@/src/errors/contractErrorParser';
// my hooks
import { useTokenApproval } from '@/src/hooks/contracts/useTokenApproval';
import { useAddLiquidity, useAddLiquidityETH } from '@/src/hooks/contracts/useUniswapV2Router';
import {
  isUniswapV2ZapConfigured,
  UNISWAP_V2_ZAP_ADDRESS,
  useZapQuote,
  useZapNativeToken,
  useZapToken,
} from '@/src/hooks/contracts/useUniswapV2Zap';
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

const PRICE_SCALE = BigInt('1000000000000000000');

const buildPriceInfo = (baseReserve: bigint, targetReserve: bigint) => ({
  baseToTarget: (targetReserve * PRICE_SCALE) / baseReserve,
  targetToBase: (baseReserve * PRICE_SCALE) / targetReserve,
});

const formatCalculatedAmount = (amount: bigint) => {
  const [integerPart, fractionalPart = ''] = formatUnits(amount).split('.');
  const fraction = fractionalPart.slice(0, 12).replace(/0+$/, '');
  return fraction ? `${integerPart}.${fraction}` : integerPart;
};

const formatPriceChangePercentage = (before: bigint, after: bigint) => {
  if (before <= BigInt(0)) return null;

  const change = after - before;
  const sign = change > BigInt(0) ? '+' : change < BigInt(0) ? '-' : '';
  const absChange = change < BigInt(0) ? -change : change;
  const scaled = (absChange * BigInt(10000) + before / BigInt(2)) / before;
  const whole = scaled / BigInt(100);
  const fraction = (scaled % BigInt(100)).toString().padStart(2, '0');

  return `${sign}${whole.toString()}.${fraction}%`;
};

// 构建支持的基础代币列表 (TUSDT, 父代币)
const buildBaseTokens = (parentTokenAddress?: `0x${string}`, parentTokenSymbol?: string): TokenConfig[] => {
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

  // 2. 父代币 (使用真实的父币信息)
  if (parentTokenSymbol && parentTokenAddress) {
    supportedTokens.push({
      symbol: parentTokenSymbol,
      address: parentTokenAddress,
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
const amountInputSchema = (balance: bigint) =>
  z.string().refine(
    (val) => {
      const amountError = formatLiquidityAmountInputError(val, balance);
      return !amountError;
    },
    (val) => ({ message: formatLiquidityAmountInputError(val, balance) || '请输入有效数字' }),
  );

const getLiquidityFormSchema = (baseBalance: bigint, tokenBalance: bigint, allowSingleSidedZap: boolean) =>
  z
    .object({
      baseTokenAmount: amountInputSchema(baseBalance),
      tokenAmount: amountInputSchema(tokenBalance),
      baseTokenAddress: z.string(),
    })
    .superRefine((values, ctx) => {
      const baseAmount = parseLiquidityAmountInput(values.baseTokenAmount) ?? BigInt(0);
      const tokenAmount = parseLiquidityAmountInput(values.tokenAmount) ?? BigInt(0);

      if (allowSingleSidedZap) {
        if (baseAmount <= BigInt(0) && tokenAmount <= BigInt(0)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '请输入至少一种代币数量',
            path: ['baseTokenAmount'],
          });
        }
        return;
      }

      if (baseAmount <= BigInt(0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '输入数量必须大于0',
          path: ['baseTokenAmount'],
        });
      }
      if (tokenAmount <= BigInt(0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '输入数量必须大于0',
          path: ['tokenAmount'],
        });
      }
    });

type LiquidityFormValues = z.infer<ReturnType<typeof getLiquidityFormSchema>>;
type EditedSide = 'base' | 'token';

// ================================================
// 主组件
// ================================================
const LiquidityPanel = () => {
  const router = useRouter();
  const { address: account } = useAccount();
  const { token } = useTokenContext();
  const parentTokenAddress = token?.parentTokenAddress;
  const parentTokenSymbol = token?.parentTokenSymbol;

  // --------------------------------------------------
  // 1. 构建支持的代币列表
  // --------------------------------------------------
  const baseTokens = useMemo(
    () => buildBaseTokens(parentTokenAddress, parentTokenSymbol),
    [parentTokenAddress, parentTokenSymbol],
  );

  // 根据父币是否为根父币，决定默认选择 USDT 还是父币
  const isRootParent = parentTokenSymbol === process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL;

  // 选中的基础代币状态
  const [baseToken, setBaseToken] = useState<TokenConfig>(() => {
    // 父币是根父币，默认选 USDT
    const usdtSymbol = process.env.NEXT_PUBLIC_USDT_SYMBOL;
    const defaultToken = baseTokens.find((t) => t.symbol === usdtSymbol);
    return (
      defaultToken ||
      baseTokens[0] || {
        symbol: parentTokenSymbol || '',
        address: parentTokenAddress || ('0x0000000000000000000000000000000000000000' as `0x${string}`),
        decimals: 18,
        isNative: false,
      }
    );
  });

  // 当 baseTokens 更新时，同步更新 baseToken
  useEffect(() => {
    if (baseTokens.length === 0) return;

    const routeBaseToken = router.query.baseToken;
    if (typeof routeBaseToken === 'string') {
      const matchedToken = baseTokens.find((t) => t.symbol === routeBaseToken);
      if (matchedToken) {
        setBaseToken(matchedToken);
        return;
      }
    }

    // 检查当前选中的 baseToken 是否还在 baseTokens 列表中
    const currentTokenExists = baseTokens.some((t) => t.address === baseToken.address);
    if (!currentTokenExists) {
      if (isRootParent) {
        // 父币是根父币，默认选 USDT
        const usdtSymbol = process.env.NEXT_PUBLIC_USDT_SYMBOL;
        const defaultToken = baseTokens.find((t) => t.symbol === usdtSymbol) || baseTokens[0];
        if (defaultToken) setBaseToken(defaultToken);
      } else {
        // 父币不是根父币，默认选父币
        const defaultToken = baseTokens.find((t) => t.symbol === parentTokenSymbol) || baseTokens[0];
        if (defaultToken) setBaseToken(defaultToken);
      }
    }
  }, [router.query.baseToken, baseTokens, isRootParent, parentTokenSymbol]);

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

  const [useZap, setUseZap] = useState(false);
  const shouldUseZap = useZap && isUniswapV2ZapConfigured;

  useEffect(() => {
    const syncPreference = () => setUseZap(liquidityZapPreference.get());
    syncPreference();
    window.addEventListener(liquidityZapPreference.eventName, syncPreference);
    return () => window.removeEventListener(liquidityZapPreference.eventName, syncPreference);
  }, []);

  // --------------------------------------------------
  // 3. 表单设置
  // --------------------------------------------------
  const form = useForm<LiquidityFormValues>({
    resolver: zodResolver(
      getLiquidityFormSchema(baseBalance || BigInt(0), tokenBalance || BigInt(0), shouldUseZap && pairExists),
    ),
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
  const [lastEditedSide, setLastEditedSide] = useState<EditedSide | null>(null);

  const baseTokenValue = form.watch('baseTokenAmount');
  const tokenAmountValue = form.watch('tokenAmount');
  const parsedBaseAmount = parseLiquidityAmountInput(baseTokenValue) ?? BigInt(0);
  const parsedTokenAmount = parseLiquidityAmountInput(tokenAmountValue) ?? BigInt(0);

  // 根据流动性池储备量计算另一个代币的数量
  // 当用户修改基础代币数量时，计算需要的目标代币数量
  useEffect(() => {
    // 如果池子不存在，不执行任何自动计算，让用户自由输入
    if (!pairExists) {
      return;
    }

    if (isBaseTokenChangedByUser && parsedBaseAmount && parsedBaseAmount > BigInt(0) && baseReserve && targetReserve) {
      // 使用 AMM 公式：ratio = baseAmount / targetAmount
      const calculatedTokenAmount = (parsedBaseAmount * targetReserve) / baseReserve;
      const tokenAmountToSet =
        shouldUseZap && calculatedTokenAmount > (tokenBalance || BigInt(0))
          ? tokenBalance || BigInt(0)
          : calculatedTokenAmount;
      form.setValue('tokenAmount', formatCalculatedAmount(tokenAmountToSet), { shouldValidate: true });
      setIsBaseTokenChangedByUser(false);
      setIsTokenChangedByUser(false);
    }
  }, [isBaseTokenChangedByUser, parsedBaseAmount, pairExists, baseReserve, targetReserve, shouldUseZap, tokenBalance, form]);

  // 当用户修改目标代币数量时，计算需要的基础代币数量
  useEffect(() => {
    // 如果池子不存在，不执行任何自动计算，让用户自由输入
    if (!pairExists) {
      return;
    }

    if (isTokenChangedByUser && parsedTokenAmount && parsedTokenAmount > BigInt(0) && baseReserve && targetReserve) {
      // 使用 AMM 公式：ratio = baseAmount / targetAmount
      const calculatedBaseAmount = (parsedTokenAmount * baseReserve) / targetReserve;
      const baseAmountToSet =
        shouldUseZap && calculatedBaseAmount > (baseBalance || BigInt(0))
          ? baseBalance || BigInt(0)
          : calculatedBaseAmount;
      form.setValue('baseTokenAmount', formatCalculatedAmount(baseAmountToSet), { shouldValidate: true });
      setIsBaseTokenChangedByUser(false);
      setIsTokenChangedByUser(false);
    }
  }, [isTokenChangedByUser, parsedTokenAmount, pairExists, baseReserve, targetReserve, shouldUseZap, baseBalance, form]);

  useEffect(() => {
    if (!shouldUseZap || !pairExists || !baseReserve || !targetReserve) {
      return;
    }

    const validateAmounts = () => {
      void form.trigger(['baseTokenAmount', 'tokenAmount']);
    };

    if (lastEditedSide === 'base' && parsedBaseAmount > BigInt(0)) {
      const calculatedTokenAmount = (parsedBaseAmount * targetReserve) / baseReserve;
      const tokenAmountToSet =
        calculatedTokenAmount > (tokenBalance || BigInt(0)) ? tokenBalance || BigInt(0) : calculatedTokenAmount;
      const nextTokenAmount = formatCalculatedAmount(tokenAmountToSet);

      if (tokenAmountValue !== nextTokenAmount) {
        form.setValue('tokenAmount', nextTokenAmount, { shouldValidate: true });
      } else {
        validateAmounts();
      }
      return;
    }

    if (lastEditedSide === 'token' && parsedTokenAmount > BigInt(0)) {
      const calculatedBaseAmount = (parsedTokenAmount * baseReserve) / targetReserve;
      const baseAmountToSet =
        calculatedBaseAmount > (baseBalance || BigInt(0)) ? baseBalance || BigInt(0) : calculatedBaseAmount;
      const nextBaseAmount = formatCalculatedAmount(baseAmountToSet);

      if (baseTokenValue !== nextBaseAmount) {
        form.setValue('baseTokenAmount', nextBaseAmount, { shouldValidate: true });
      } else {
        validateAmounts();
      }
      return;
    }

    validateAmounts();
  }, [
    shouldUseZap,
    pairExists,
    baseReserve,
    targetReserve,
    baseBalance,
    tokenBalance,
    lastEditedSide,
    parsedBaseAmount,
    parsedTokenAmount,
    baseTokenValue,
    tokenAmountValue,
    form,
  ]);

  // --------------------------------------------------
  // 5. 授权逻辑
  // --------------------------------------------------
  const routerAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_ROUTER as `0x${string}`;
  const spenderAddress = shouldUseZap ? UNISWAP_V2_ZAP_ADDRESS : routerAddress;

  const {
    isApproved: isBaseTokenApprovedRaw,
    isChecking: isPendingApproveBaseAllowance,
    isApprovingTx: isPendingApproveBase,
    isConfirming: isConfirmingApproveBase,
    approve: approveBaseToken,
    error: errApproveBase,
    approvalActionText: baseApprovalActionText,
  } = useTokenApproval({
    token: baseToken.address,
    owner: account as `0x${string}` | undefined,
    spender: spenderAddress,
    amount: parsedBaseAmount,
    enabled: !baseToken.isNative && !!account && parsedBaseAmount > BigInt(0),
    successMessage: `授权${baseToken.symbol}成功`,
  });

  const {
    isApproved: isTokenApproved,
    isChecking: isPendingApproveTokenAllowance,
    isApprovingTx: isPendingApproveToken,
    isConfirming: isConfirmingApproveToken,
    approve: approveToken,
    error: errApproveToken,
    approvalActionText: tokenApprovalActionText,
  } = useTokenApproval({
    token: targetToken?.address as `0x${string}` | undefined,
    owner: account as `0x${string}` | undefined,
    spender: spenderAddress,
    amount: parsedTokenAmount,
    enabled: !!targetToken?.address && !!account && parsedTokenAmount > BigInt(0),
    successMessage: `授权${targetToken?.symbol}成功`,
  });

  const isBaseTokenApproved = baseToken.isNative || isBaseTokenApprovedRaw;
  const hasBaseInput = parsedBaseAmount > BigInt(0);
  const hasTokenInput = parsedTokenAmount > BigInt(0);
  const canSubmitAmounts = shouldUseZap ? hasBaseInput || hasTokenInput : hasBaseInput && hasTokenInput;
  const needsZapQuote = shouldUseZap && pairExists;
  const canSubmitApproval =
    (isBaseTokenApproved || (shouldUseZap && !hasBaseInput)) && (isTokenApproved || (shouldUseZap && !hasTokenInput));

  const handleApproveBase = form.handleSubmit(async () => {
    try {
      await approveBaseToken();
    } catch (error: any) {
      console.error(error);
    }
  });

  const handleApproveToken = form.handleSubmit(async () => {
    try {
      await approveToken();
    } catch (error: any) {
      console.error(error);
    }
  });

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

  const {
    zapToken,
    isWriting: isPendingZapToken,
    isConfirming: isConfirmingZapToken,
    isConfirmed: isConfirmedZapToken,
  } = useZapToken();

  const {
    zapNativeToken,
    isWriting: isPendingZapNativeToken,
    isConfirming: isConfirmingZapNativeToken,
    isConfirmed: isConfirmedZapNativeToken,
  } = useZapNativeToken();

  const {
    quote: zapQuote,
    error: zapQuoteError,
  } = useZapQuote(
    baseToken.address,
    targetToken?.address,
    parsedBaseAmount,
    parsedTokenAmount,
    shouldUseZap && pairExists,
    baseToken.isNative,
  );
  const zapQuoteErrorInfo = useMemo(
    () => (zapQuoteError ? parseContractError(zapQuoteError) : null),
    [zapQuoteError],
  );
  const canSubmitQuote = !needsZapQuote || !!zapQuote;

  const handleAddLiquidity = form.handleSubmit(async () => {
    if (!canSubmitApproval) {
      toast.error('请先完成授权');
      return;
    }

    if (!targetToken) {
      toast.error('目标代币未加载');
      return;
    }

    const baseAmount = parseLiquidityAmountInput(baseTokenValue || '0');
    const tokenAmount = parseLiquidityAmountInput(tokenAmountValue || '0');

    if (baseAmount === null || tokenAmount === null) {
      toast.error('请输入有效数字');
      return;
    }

    if (shouldUseZap ? baseAmount <= BigInt(0) && tokenAmount <= BigInt(0) : baseAmount <= BigInt(0) || tokenAmount <= BigInt(0)) {
      toast.error('请输入有效的数量');
      return;
    }

    if (needsZapQuote && !zapQuote) {
      toast.error('正在计算智能模式参数，请稍后再试');
      return;
    }

    try {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60); // 20分钟deadline

      const { baseAmountMin, tokenAmountMin, liquidityMin } = calculateLiquiditySlippageMins(
        baseAmount,
        tokenAmount,
        slippage,
        shouldUseZap ? zapQuote : undefined,
      );

      console.log('添加流动性参数:', {
        baseToken: baseToken.symbol,
        targetToken: targetToken.symbol,
        baseAmount: baseAmount.toString(),
        tokenAmount: tokenAmount.toString(),
        baseAmountMin: baseAmountMin.toString(),
        tokenAmountMin: tokenAmountMin.toString(),
        liquidityMin: liquidityMin.toString(),
        slippage,
        deadline: deadline.toString(),
        useZap: shouldUseZap,
      });

      if (shouldUseZap && baseToken.isNative) {
        await zapNativeToken(
          targetToken.address,
          tokenAmount,
          tokenAmountMin,
          baseAmountMin,
          liquidityMin,
          account as `0x${string}`,
          deadline,
          baseAmount,
        );
      } else if (shouldUseZap) {
        await zapToken({
          tokenA: baseToken.address,
          tokenB: targetToken.address,
          amountAIn: baseAmount,
          amountBIn: tokenAmount,
          amountAMin: baseAmountMin,
          amountBMin: tokenAmountMin,
          liquidityMin,
          to: account as `0x${string}`,
          deadline,
        });
      } else if (baseToken.isNative) {
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
    }
  });

  // --------------------------------------------------
  // 7. 价格比例显示
  // --------------------------------------------------
  const [showTokenToBase, setShowTokenToBase] = useState(true);

  // 价格计算
  const priceInfo = useMemo(() => {
    if (!pairExists || !baseReserve || !targetReserve) {
      return null;
    }

    return buildPriceInfo(baseReserve, targetReserve);
  }, [pairExists, baseReserve, targetReserve]);

  const priceAfterZap = useMemo(() => {
    if (!zapQuote?.willSwap || zapQuote.reserveAAfter <= BigInt(0) || zapQuote.reserveBAfter <= BigInt(0)) {
      return null;
    }

    return buildPriceInfo(zapQuote.reserveAAfter, zapQuote.reserveBAfter);
  }, [zapQuote]);

  const priceChangePercentage = useMemo(() => {
    if (!priceInfo || !priceAfterZap) {
      return null;
    }

    return showTokenToBase
      ? formatPriceChangePercentage(priceInfo.targetToBase, priceAfterZap.targetToBase)
      : formatPriceChangePercentage(priceInfo.baseToTarget, priceAfterZap.baseToTarget);
  }, [priceInfo, priceAfterZap, showTokenToBase]);

  // 预估获得的 LP 数量
  const estimatedLP = useMemo(() => {
    if (shouldUseZap && zapQuote) {
      return zapQuote.liquidity;
    }

    const lpBaseAmount = shouldUseZap && zapQuote ? zapQuote.amountAUsed : parsedBaseAmount;
    const lpTokenAmount = shouldUseZap && zapQuote ? zapQuote.amountBUsed : parsedTokenAmount;

    if (!lpBaseAmount || !lpTokenAmount || lpBaseAmount <= BigInt(0) || lpTokenAmount <= BigInt(0)) {
      return null;
    }

    if (pairExists && baseReserve && targetReserve && lpTotalSupply && lpTotalSupply > BigInt(0)) {
      // 已有池子：liquidity = min(amountA * totalSupply / reserveA, amountB * totalSupply / reserveB)
      const lpFromBase = (lpBaseAmount * lpTotalSupply) / baseReserve;
      const lpFromToken = (lpTokenAmount * lpTotalSupply) / targetReserve;
      return lpFromBase < lpFromToken ? lpFromBase : lpFromToken;
    } else if (!pairExists) {
      // 新池子：liquidity = sqrt(amountA * amountB) - MINIMUM_LIQUIDITY
      const MINIMUM_LIQUIDITY = BigInt(1000);
      const product = lpBaseAmount * lpTokenAmount;
      const sqrt = (n: bigint): bigint => {
        if (n <= BigInt(0)) return BigInt(0);
        let x = n;
        let y = (x + BigInt(1)) / BigInt(2);
        while (y < x) {
          x = y;
          y = (x + n / x) / BigInt(2);
        }
        return x;
      };
      const lp = sqrt(product) - MINIMUM_LIQUIDITY;
      return lp > BigInt(0) ? lp : BigInt(0);
    }

    return null;
  }, [parsedBaseAmount, parsedTokenAmount, shouldUseZap, zapQuote, pairExists, baseReserve, targetReserve, lpTotalSupply]);

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
    if (isConfirmedAddLiquidity || isConfirmedAddLiquidityETH || isConfirmedZapToken || isConfirmedZapNativeToken) {
      toast.success('添加流动性成功！');

      // 清空表单
      form.reset({
        baseTokenAmount: '',
        tokenAmount: '',
        baseTokenAddress: baseToken.address,
      });

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
  }, [
    isConfirmedAddLiquidity,
    isConfirmedAddLiquidityETH,
    isConfirmedZapToken,
    isConfirmedZapNativeToken,
    form,
    baseToken.address,
    refreshLiquidityData,
  ]);

  // --------------------------------------------------
  // 10. 加载状态
  // --------------------------------------------------
  if (!token || !targetToken || isLoadingLiquidityData) {
    return <LoadingIcon />;
  }

  const isApproving = isPendingApproveBase || isPendingApproveToken;
  const isApproveConfirming = isConfirmingApproveBase || isConfirmingApproveToken;
  const isAddingLiquidity = isPendingAddLiquidity || isPendingAddLiquidityETH || isPendingZapToken || isPendingZapNativeToken;
  const isConfirmingLiquidity =
    isConfirmingAddLiquidity || isConfirmingAddLiquidityETH || isConfirmingZapToken || isConfirmingZapNativeToken;
  const isAddLiquidityConfirmed =
    isConfirmedAddLiquidity || isConfirmedAddLiquidityETH || isConfirmedZapToken || isConfirmedZapNativeToken;
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
              href={`/dex/withdraw?symbol=${encodeURIComponent(token?.symbol || '')}&baseToken=${encodeURIComponent(
                baseToken.symbol,
              )}`}
              className="inline-flex items-center gap-1 text-sm text-secondary hover:text-blue-800 transition-colors underline"
              title="撤出流动性"
            >
              撤出
            </Link>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <LeftTitle title="添加流动性" />
      </div>

      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
        <Form {...form}>
          <form>
            {/* 智能模式 */}
            <label className="mb-3 flex cursor-pointer items-start gap-2 rounded-md bg-[#f7f8f9] px-3 py-2 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-3.5 w-3.5 shrink-0 accent-secondary"
                checked={shouldUseZap}
                disabled={!isUniswapV2ZapConfigured}
                onChange={(event) => liquidityZapPreference.set(event.target.checked)}
                title={isUniswapV2ZapConfigured ? '智能模式' : '智能模式未配置'}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium leading-5 text-gray-800">智能模式</span>
                <span className="block text-xs leading-4 text-gray-500">
                  余额不足时自动补齐比例，可能产生一次内部兑换。
                </span>
              </span>
            </label>

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
                              setLastEditedSide('base');
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
                            {[25, 50].map((percentage) => (
                              <Button
                                key={percentage}
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={() => {
                                  const amount = ((baseBalance ?? BigInt(0)) * BigInt(percentage)) / BigInt(100);
                                  form.setValue('baseTokenAmount', formatUnits(amount));
                                  setIsBaseTokenChangedByUser(true);
                                  setLastEditedSide('base');
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
                                setLastEditedSide('base');
                              }}
                              disabled={isDisabled || (baseBalance || BigInt(0)) <= BigInt(0)}
                              className="text-xs h-7 px-2 rounded-lg"
                            >
                              最高
                            </Button>
                          </div>
                          <span className="text-sm text-gray-600">{formatTokenAmount(baseBalance || BigInt(0))}</span>
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
                              setLastEditedSide('token');
                            }}
                            className="text-xl border-none p-0 h-auto bg-transparent focus:ring-0 focus:outline-none mr-2"
                          />
                          <div className="bg-white px-3 py-1.5 rounded-full border border-gray-200">
                            <span className="font-medium text-gray-800 font-mono">{targetToken.symbol}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-1">
                            {[25, 50].map((percentage) => (
                              <Button
                                key={percentage}
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={() => {
                                  const amount = ((tokenBalance ?? BigInt(0)) * BigInt(percentage)) / BigInt(100);
                                  form.setValue('tokenAmount', formatUnits(amount));
                                  setIsTokenChangedByUser(true);
                                  setLastEditedSide('token');
                                }}
                                disabled={isDisabled || (tokenBalance || BigInt(0)) <= BigInt(0)}
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
                                form.setValue('tokenAmount', formatUnits(tokenBalance || BigInt(0)));
                                setIsTokenChangedByUser(true);
                                setLastEditedSide('token');
                              }}
                              disabled={isDisabled || (tokenBalance || BigInt(0)) <= BigInt(0)}
                              className="text-xs h-7 px-2 rounded-lg"
                            >
                              最高
                            </Button>
                          </div>
                          <span className="text-sm text-gray-600">{formatTokenAmount(tokenBalance || BigInt(0))}</span>
                        </div>
                      </CardContent>
                    </Card>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {zapQuoteErrorInfo && (
              <div className="-mt-3 mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                智能模式报价失败：{zapQuoteErrorInfo.message}
              </div>
            )}

            {/* 预估获得 LP 数量 */}
            {estimatedLP !== null && (
              <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                <Zap className="w-4 h-4" />
                预估获得 LP: <span className="font-medium text-gray-800">{formatTokenAmount(estimatedLP)}</span>
              </div>
            )}

            {/* 价格比例显示 */}
            {priceInfo && (
              <div className="space-y-1 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <div className="text-gray-600">
                    当前池价格：
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
                {priceAfterZap && (
                  <div className="text-gray-600">
                    添加后价格：
                    {showTokenToBase ? (
                      <>
                        1 {targetToken.symbol} = {formatTokenAmount(priceAfterZap.targetToBase)} {baseToken.symbol}
                      </>
                    ) : (
                      <>
                        1 {baseToken.symbol} = {formatTokenAmount(priceAfterZap.baseToTarget)} {targetToken.symbol}
                      </>
                    )}
                    {priceChangePercentage && (
                      <span
                        className={`ml-1 ${
                          priceChangePercentage.startsWith('-')
                            ? 'text-red-600'
                            : priceChangePercentage.startsWith('+')
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }`}
                      >
                        ({priceChangePercentage})
                      </span>
                    )}
                  </div>
                )}
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
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center lg:justify-start">
              <Button
                type="button"
                className="w-full sm:flex-1 lg:w-auto lg:px-4"
                disabled={
                  !hasBaseInput ||
                  isPendingApproveBaseAllowance || isPendingApproveBase || isConfirmingApproveBase || isBaseTokenApproved
                }
                onClick={handleApproveBase}
              >
                {isPendingApproveBaseAllowance
                  ? '1.读取授权...'
                  : isPendingApproveBase
                  ? '1.授权中...'
                  : isConfirmingApproveBase
                  ? '1.确认中...'
                  : isBaseTokenApproved
                  ? `1.${baseToken.symbol}已授权`
                  : `1.${baseApprovalActionText}${baseToken.symbol}`}
              </Button>
              <Button
                type="button"
                className="w-full sm:flex-1 lg:w-auto lg:px-4"
                disabled={
                  !hasTokenInput ||
                  !(isBaseTokenApproved || (shouldUseZap && !hasBaseInput)) ||
                  isPendingApproveTokenAllowance ||
                  isPendingApproveToken ||
                  isConfirmingApproveToken ||
                  isTokenApproved
                }
                onClick={handleApproveToken}
              >
                {isPendingApproveTokenAllowance
                  ? '2.读取授权...'
                  : isPendingApproveToken
                  ? '2.授权中...'
                  : isConfirmingApproveToken
                  ? '2.确认中...'
                  : isTokenApproved
                  ? `2.${targetToken.symbol}已授权`
                  : `2.${tokenApprovalActionText}${targetToken.symbol}`}
              </Button>
              <Button
                className="w-full sm:flex-1 lg:w-auto lg:px-4"
                onClick={handleAddLiquidity}
                disabled={
                  !canSubmitAmounts ||
                  !canSubmitApproval ||
                  !canSubmitQuote ||
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
