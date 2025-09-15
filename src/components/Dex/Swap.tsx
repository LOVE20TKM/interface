'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { useForm } from 'react-hook-form';

// UI components
import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';

// my funcs
import { formatIntegerStringWithCommas, formatTokenAmount, formatUnits, parseUnits } from '@/src/lib/format';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my hooks
import { useBalanceOf, useApprove } from '@/src/hooks/contracts/useLOVE20Token';
import { useDeposit, useWithdraw } from '@/src/hooks/contracts/useWETH';
import { useInitialStakeRound } from '@/src/hooks/contracts/useLOVE20Stake';
import {
  useGetAmountsOut,
  useSwapExactTokensForTokens,
  useSwapExactETHForTokens,
  useSwapExactTokensForETH,
} from '@/src/hooks/contracts/useUniswapV2Router';

// my context
import useTokenContext from '@/src/hooks/context/useTokenContext';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

// 常量定义
const MIN_NATIVE_TO_TOKEN = '0.1';

// 交换方法类型
type SwapMethod = 'WETH9' | 'UniswapV2_TOKEN_TO_TOKEN' | 'UniswapV2_ETH_TO_TOKEN' | 'UniswapV2_TOKEN_TO_ETH';

// ================================================
// 构建支持的代币列表
// ================================================
interface TokenConfig {
  symbol: string;
  address: `0x${string}` | 'NATIVE';
  decimals: number;
  isNative: boolean;
  isWETH?: boolean;
}

// 添加 SwapPanel 的 Props 接口
interface SwapPanelProps {
  showCurrentToken?: boolean; // 是否显示当前 token，默认为 true
}

const buildSupportedTokens = (token: any, showCurrentToken: boolean = true): TokenConfig[] => {
  const supportedTokens: TokenConfig[] = [];

  // 1. 原生代币 - 确保symbol不为空
  const nativeSymbol = process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL;
  if (nativeSymbol) {
    supportedTokens.push({
      symbol: nativeSymbol,
      address: 'NATIVE',
      decimals: 18,
      isNative: true,
    });
  }

  // 2. WETH9 代币 - 确保symbol不为空
  const wethSymbol = process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL;
  const wethAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN;
  if (wethSymbol && wethAddress) {
    supportedTokens.push({
      symbol: wethSymbol,
      address: wethAddress as `0x${string}`,
      decimals: 18,
      isNative: false,
      isWETH: true,
    });
  }

  // 3. 添加当前 token 和其 parentToken（如果不重复且允许显示当前token）
  if (token) {
    // 当前 token - 只有在 showCurrentToken 为 true 时才添加
    if (
      showCurrentToken &&
      token.symbol &&
      token.address &&
      !supportedTokens.find((t) => t.address === token.address)
    ) {
      supportedTokens.push({
        symbol: token.symbol,
        address: token.address,
        decimals: 18,
        isNative: false,
      });
    }

    // parentToken (第一个token的parent是 WETH9) - 确保symbol和address有效
    if (
      token.parentTokenSymbol &&
      token.parentTokenAddress &&
      !supportedTokens.find((t) => t.address === token.parentTokenAddress)
    ) {
      supportedTokens.push({
        symbol: token.parentTokenSymbol,
        address: token.parentTokenAddress,
        decimals: 18,
        isNative: false,
        isWETH: token.parentTokenAddress === process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN,
      });
    }
  }

  console.log('buildSupportedTokens result:', supportedTokens);
  return supportedTokens;
};

// ================================================
// 方法封装
// ================================================
// swap方法决策器
const determineSwapMethod = (fromToken: TokenConfig, toToken: TokenConfig): SwapMethod => {
  // 情况1: 原生代币 ↔ WETH9 - 使用 WETH9
  if ((fromToken.isNative && toToken.isWETH) || (fromToken.isWETH && toToken.isNative)) {
    return 'WETH9';
  }

  // 情况2: 原生代币 → 非WETH的ERC20代币 - 使用 ETH_TO_TOKEN
  if (fromToken.isNative && !toToken.isNative && !toToken.isWETH) {
    return 'UniswapV2_ETH_TO_TOKEN';
  }

  // 情况3: 非WETH的ERC20代币 → 原生代币 - 使用 TOKEN_TO_ETH
  if (!fromToken.isNative && !fromToken.isWETH && toToken.isNative) {
    return 'UniswapV2_TOKEN_TO_ETH';
  }

  // 情况4: 所有其他情况都使用 UniswapV2 标准方法
  return 'UniswapV2_TOKEN_TO_TOKEN';
};

// 构建交换路径
const buildSwapPath = (fromToken: TokenConfig, toToken: TokenConfig): `0x${string}`[] => {
  const wethAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN as `0x${string}`;

  if (fromToken.isNative) {
    return [wethAddress, toToken.address as `0x${string}`];
  }
  if (toToken.isNative) {
    return [fromToken.address as `0x${string}`, wethAddress];
  }
  return [fromToken.address as `0x${string}`, toToken.address as `0x${string}`];
};

// 统一余额查询 Hook
const useTokenBalance = (tokenConfig: TokenConfig, account: `0x${string}` | undefined) => {
  // 原生代币使用 useBalance
  const { data: nativeBalance, isLoading: isLoadingNative } = useBalance({
    address: account,
    query: {
      enabled: !!account && tokenConfig.isNative,
    },
  });

  // ERC20 代币使用 useBalanceOf - 只对非原生代币调用
  const { balance: erc20Balance, isPending: isPendingERC20 } = useBalanceOf(
    tokenConfig.isNative ? '0x0000000000000000000000000000000000000000' : (tokenConfig.address as `0x${string}`),
    account as `0x${string}`,
  );

  return {
    balance: tokenConfig.isNative ? nativeBalance?.value : erc20Balance,
    isPending: tokenConfig.isNative ? isLoadingNative : isPendingERC20,
  };
};

// ================================================
// 表单 Schema 定义
// ================================================
const getSwapFormSchema = (balance: bigint) =>
  z.object({
    fromTokenAmount: z
      .string()
      .nonempty('请输入兑换数量')
      .refine(
        (val) => {
          // 如果输入以 '.' 结尾，则视为用户仍在输入中，不触发报错
          if (val.endsWith('.')) return true;
          // 如果输入仅为 "0"，也允许中间状态
          if (val === '0') return true;
          try {
            const amount = parseUnits(val);
            return amount > BigInt(0) && amount <= balance;
          } catch (e) {
            return false;
          }
        },
        { message: '输入数量必须大于0且不超过您的可用余额' },
      ),
    fromTokenAddress: z.string(),
    toTokenAddress: z.string(),
  });

type SwapFormValues = z.infer<ReturnType<typeof getSwapFormSchema>>;

// ================================================
// 主组件
// ================================================
const SwapPanel = ({ showCurrentToken = true }: SwapPanelProps) => {
  const router = useRouter();
  const { address: account } = useAccount();
  const chainId = useChainId();
  const { token } = useTokenContext();

  // --------------------------------------------------
  // 1. 构建支持的代币列表
  // --------------------------------------------------
  const supportedTokens = useMemo(() => buildSupportedTokens(token, showCurrentToken), [token, showCurrentToken]);

  // 选中的代币状态 - 使用 useEffect 来正确初始化
  const [fromToken, setFromToken] = useState<TokenConfig>({
    symbol: process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL || '',
    address: 'NATIVE',
    decimals: 18,
    isNative: true,
  });
  const [toToken, setToToken] = useState<TokenConfig>({
    symbol: process.env.NEXT_PUBLIC_FIRST_TOKEN_SYMBOL || '',
    address:
      (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_FIRST_TOKEN as `0x${string}`) ||
      '0x0000000000000000000000000000000000000000',
    decimals: 18,
    isNative: false,
    isWETH: false,
  });

  // 当 supportedTokens 更新时，同步代币选择
  useEffect(() => {
    console.log('supportedTokens updated:', supportedTokens);
    console.log('router.query:', router.query);
    console.log('token context:', token);

    // 如果 token 还没有加载完成，不执行初始化逻辑
    // 这样可以确保 supportedTokens 包含完整的代币列表
    if (!token) {
      console.log('Token not loaded yet, skipping initialization');
      return;
    }

    if (supportedTokens.length > 0) {
      // 获取URL参数
      const { from: fromSymbol, to: toSymbol } = router.query;

      // 调试: 输出所有可用的代币symbols
      console.log(
        'Available token symbols:',
        supportedTokens.map((t) => t.symbol),
      );

      let selectedFromToken: TokenConfig | undefined = undefined;
      let selectedToToken: TokenConfig | undefined = undefined;
      let hasUrlParamError = false;

      // 如果有URL参数，尝试根据symbol查找代币
      if (fromSymbol && typeof fromSymbol === 'string') {
        console.log('Looking for fromSymbol:', fromSymbol);
        selectedFromToken = supportedTokens.find(
          (t) => t.symbol && t.symbol.toLowerCase() === fromSymbol.toLowerCase(),
        );
        console.log('Found fromToken:', selectedFromToken);
        if (!selectedFromToken) {
          toast.error(`找不到代币 ${fromSymbol}`);
          hasUrlParamError = true;
        }
      }

      if (toSymbol && typeof toSymbol === 'string') {
        console.log('Looking for toSymbol:', toSymbol);
        selectedToToken = supportedTokens.find((t) => t.symbol && t.symbol.toLowerCase() === toSymbol.toLowerCase());
        console.log('Found toToken:', selectedToToken);
        if (!selectedToToken) {
          toast.error(`找不到代币 ${toSymbol}`);
          hasUrlParamError = true;
        }
      }

      // 如果URL参数指定的两个代币相同，报错并重置
      if (selectedFromToken && selectedToToken && selectedFromToken.address === selectedToToken.address) {
        toast.error('不能选择相同的代币进行兑换');
        hasUrlParamError = true;
        selectedFromToken = undefined;
        selectedToToken = undefined;
      }

      // 设置 fromToken
      if (selectedFromToken) {
        console.log('Setting fromToken from URL:', selectedFromToken);
        setFromToken(selectedFromToken);
      } else {
        // 使用默认逻辑：设置为第一个代币
        if (supportedTokens[0]) {
          console.log('Setting fromToken as default:', supportedTokens[0]);
          setFromToken(supportedTokens[0]);
        }
      }

      // 设置 toToken
      const finalFromToken = selectedFromToken || supportedTokens[0];
      if (selectedToToken && selectedToToken.address !== finalFromToken?.address) {
        console.log('Setting toToken from URL:', selectedToToken);
        setToToken(selectedToToken);
      } else {
        // 使用默认逻辑：优先查找 FIRST_TOKEN
        let preferredToToken: TokenConfig | undefined = undefined;

        // 首先尝试找到 FIRST_TOKEN (当前 token)
        const firstTokenSymbol = process.env.NEXT_PUBLIC_FIRST_TOKEN_SYMBOL;
        if (firstTokenSymbol) {
          preferredToToken = supportedTokens.find(
            (t) => t.symbol === firstTokenSymbol && t.address !== finalFromToken?.address,
          );
        }

        // 如果没找到 FIRST_TOKEN，则找第一个与 fromToken 不同的代币
        if (!preferredToToken) {
          for (let i = 1; i < supportedTokens.length; i++) {
            if (supportedTokens[i].address !== finalFromToken?.address) {
              preferredToToken = supportedTokens[i];
              break;
            }
          }
        }

        // 如果还没找到，并且第二个代币不是fromToken
        if (!preferredToToken && supportedTokens.length > 1) {
          if (supportedTokens[1].address !== finalFromToken?.address) {
            preferredToToken = supportedTokens[1];
          } else if (supportedTokens[0].address !== finalFromToken?.address) {
            preferredToToken = supportedTokens[0];
          }
        }

        if (preferredToToken) {
          console.log('Setting toToken as default:', preferredToToken);
          setToToken(preferredToToken);
        }
      }

      // 如果有URL参数错误，显示额外提示并清理URL参数
      if (hasUrlParamError) {
        toast.error('已切换为默认代币对儿');
        // 清理URL参数，避免重复处理
        const newQuery = { ...router.query };
        delete newQuery.from;
        delete newQuery.to;
        router.replace(
          {
            pathname: router.pathname,
            query: newQuery,
          },
          undefined,
          { shallow: true },
        );
      }
    }
  }, [supportedTokens, router, token]); // 添加 token 作为依赖项

  // --------------------------------------------------
  // 2. 余额查询
  // --------------------------------------------------
  // 余额查询
  const { balance: fromBalance, isPending: isPendingFromBalance } = useTokenBalance(fromToken, account);
  const { balance: toBalance, isPending: isPendingToBalance } = useTokenBalance(toToken, account);
  const {
    initialStakeRound,
    isPending: isPendingInitialStakeRound,
    error: errInitialStakeRound,
  } = useInitialStakeRound(token?.address as `0x${string}`);

  // 调试信息
  useEffect(() => {
    console.log('Balance states:', {
      fromBalance,
      toBalance,
      isPendingFromBalance,
      isPendingToBalance,
      fromToken,
      toToken,
      account,
    });
  }, [fromBalance, toBalance, isPendingFromBalance, isPendingToBalance, fromToken, toToken, account]);

  // --------------------------------------------------
  // 3. 表单设置
  // --------------------------------------------------
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
    console.log('Syncing form values:', { fromAddress: fromToken.address, toAddress: toToken.address });
    form.setValue('fromTokenAddress', fromToken.address);
    form.setValue('toTokenAddress', toToken.address);
  }, [fromToken.address, toToken.address, form]);

  // 输入数量和输出数量
  const [fromAmount, setFromAmount] = useState<bigint>(BigInt(0));
  const [toAmount, setToAmount] = useState<bigint>(BigInt(0));

  // 基于测试前缀的原生代币使用上限（仅在存在 NEXT_PUBLIC_TOKEN_PREFIX 时生效）
  const maxNativeInputLimit = useMemo(() => {
    const hasPrefix = !!process.env.NEXT_PUBLIC_TOKEN_PREFIX;
    if (!hasPrefix) return undefined;
    if (!fromToken.isNative) return undefined;
    const limitStr = toToken.isWETH ? '1' : MIN_NATIVE_TO_TOKEN;
    return parseUnits(limitStr);
  }, [fromToken.isNative, toToken.isWETH]);

  // 监听输入数量变化
  const watchFromAmount = form.watch('fromTokenAmount');
  useEffect(() => {
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
      setFromAmount(finalAmount);
    } catch {
      setFromAmount(BigInt(0));
    }
  }, [watchFromAmount, maxNativeInputLimit, form, fromToken.symbol]);

  // --------------------------------------------------
  // 4. 组件交互：设置最大数量、切换代币
  // --------------------------------------------------
  // 设置最大数量
  const setMaxAmount = () => {
    const rawMax = fromBalance || BigInt(0);
    const capped = maxNativeInputLimit ? (rawMax > maxNativeInputLimit ? maxNativeInputLimit : rawMax) : rawMax;
    const maxStr = formatUnits(capped);
    form.setValue('fromTokenAmount', maxStr);
  };

  // 切换代币
  const handleSwapTokens = () => {
    // 简单交换 From 和 To 代币
    const tempFrom = { ...fromToken };
    const tempTo = { ...toToken };

    setFromToken(tempTo);
    setToToken(tempFrom);
    form.setValue('fromTokenAmount', '');

    console.log('Swapped tokens:', {
      newFrom: tempTo.symbol,
      newTo: tempFrom.symbol,
    });
  };

  // --------------------------------------------------
  // 5. 兑换比例和手续费计算
  // --------------------------------------------------
  const swapMethod = useMemo(() => determineSwapMethod(fromToken, toToken), [fromToken, toToken]);

  // 价格路径计算
  const swapPath = useMemo(() => {
    if (swapMethod === 'WETH9') {
      return [];
    }
    return buildSwapPath(fromToken, toToken);
  }, [fromToken, toToken, swapMethod]);

  // 添加路径和地址验证
  useEffect(() => {
    console.log('🔍 Swap Path Debug:', {
      swapMethod,
      fromToken: {
        symbol: fromToken.symbol,
        address: fromToken.address,
        isNative: fromToken.isNative,
      },
      toToken: {
        symbol: toToken.symbol,
        address: toToken.address,
        isNative: toToken.isNative,
      },
      swapPath,
      wethAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN,
      routerAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_ROUTER,
    });

    // 验证路径是否正确
    if (swapMethod === 'UniswapV2_ETH_TO_TOKEN' && swapPath.length >= 2) {
      const expectedWETH = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN;
      if (swapPath[0] !== expectedWETH) {
        console.error('❌ 路径错误: path[0] 应该是 WETH 地址', {
          expected: expectedWETH,
          actual: swapPath[0],
        });
        toast.error('交换路径配置错误，请检查 WETH 地址配置');
      }
    }
  }, [swapMethod, fromToken, toToken, swapPath]);

  // 价格查询
  const useCurrentToken = fromToken.symbol === token?.symbol || toToken.symbol === token?.symbol;
  const canSwap = !useCurrentToken || !!initialStakeRound;
  const {
    data: amountsOut,
    error: amountsOutError,
    isLoading: isAmountsOutLoading,
  } = useGetAmountsOut(
    fromAmount,
    swapPath,
    // 只有当路径有效且金额大于0时才启用查询
    canSwap && swapMethod !== 'WETH9' && fromAmount > BigInt(0) && swapPath.length >= 2,
  );

  // --------------------------------------------------
  // 6. 错误处理 Hook
  // --------------------------------------------------
  const { handleContractError } = useHandleContractError();

  // 改进的价格查询错误处理
  useEffect(() => {
    if (amountsOutError) {
      console.error('🚨 getAmountsOut 详细错误:', {
        error: amountsOutError,
        errorMessage: amountsOutError.message,
        errorCause: amountsOutError.cause?.message,
        errorDetails: amountsOutError.details,
        fromAmount: fromAmount.toString(),
        swapPath,
        swapMethod,
      });

      // 使用统一的错误处理逻辑
      handleContractError(amountsOutError, 'uniswapV2Router');
    }
  }, [amountsOutError, fromAmount, swapPath, swapMethod, handleContractError]);

  // 更新输出数量
  useEffect(() => {
    if (swapMethod === 'WETH9') {
      // WETH9 是 1:1 兑换
      setToAmount(fromAmount);
    } else if (amountsOut && amountsOut.length > 1) {
      setToAmount(BigInt(amountsOut[1]));
    } else {
      setToAmount(BigInt(0));
    }
  }, [swapMethod, fromAmount, amountsOut]);

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

  // --------------------------------------------------
  // 7. 获取主要操作的 hook 函数
  // --------------------------------------------------
  const needsApproval = !fromToken.isNative && swapMethod !== 'WETH9';
  const approvalTarget =
    swapMethod === 'WETH9'
      ? (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN as `0x${string}`)
      : (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_ROUTER as `0x${string}`);

  const {
    approve,
    isPending: isPendingApprove,
    isConfirming: isConfirmingApprove,
    isConfirmed: isConfirmedApprove,
    writeError: errApprove,
  } = useApprove(fromToken.address as `0x${string}`);

  // WETH9 操作
  const {
    deposit,
    isPending: isPendingDeposit,
    writeError: errDeposit,
    isConfirming: isConfirmingDeposit,
    isConfirmed: isConfirmedDeposit,
  } = useDeposit();

  const {
    withdraw,
    isPending: isPendingWithdraw,
    writeError: errWithdraw,
    isConfirming: isConfirmingWithdraw,
    isConfirmed: isConfirmedWithdraw,
  } = useWithdraw();

  // UniswapV2 操作
  const {
    swap: swapTokensForTokens,
    isWriting: isPendingTokenToToken,
    isConfirming: isConfirmingTokenToToken,
    isConfirmed: isConfirmedTokenToToken,
    writeError: errTokenToToken,
  } = useSwapExactTokensForTokens();

  const {
    swap: swapETHForTokens,
    isWriting: isPendingETHToToken,
    isConfirming: isConfirmingETHToToken,
    isConfirmed: isConfirmedETHToToken,
    writeError: errETHToToken,
  } = useSwapExactETHForTokens();

  const {
    swap: swapTokensForETH,
    isWriting: isPendingTokenToETH,
    isConfirming: isConfirmingTokenToETH,
    isConfirmed: isConfirmedTokenToETH,
    writeError: errTokenToETH,
  } = useSwapExactTokensForETH();

  const isApproving = isPendingApprove || isConfirmingApprove;
  const isApproved = isConfirmedApprove || !needsApproval;
  const isSwapping =
    isPendingDeposit ||
    isConfirmingDeposit ||
    isPendingWithdraw ||
    isConfirmingWithdraw ||
    isPendingTokenToToken ||
    isConfirmingTokenToToken ||
    isPendingETHToToken ||
    isConfirmingETHToToken ||
    isPendingTokenToETH ||
    isConfirmingTokenToETH;
  const isSwapConfirmed =
    isConfirmedDeposit ||
    isConfirmedWithdraw ||
    isConfirmedTokenToToken ||
    isConfirmedETHToToken ||
    isConfirmedTokenToETH;

  // 禁用状态
  const isDisabled = isPendingFromBalance || isPendingToBalance;
  useEffect(() => {
    console.log('Disabled states:', {
      isPendingFromBalance,
      isPendingToBalance,
      isApproved,
      isConfirmedApprove,
      needsApproval,
      isDisabled,
    });
  }, [isPendingFromBalance, isPendingToBalance, isApproved, isConfirmedApprove, needsApproval, isDisabled]);

  // --------------------------------------------------
  // 8. 执行交易操作
  // --------------------------------------------------
  // 处理授权
  const handleApprove = form.handleSubmit(async () => {
    try {
      await approve(approvalTarget, fromAmount);
    } catch (error: any) {
      console.error(error);
    }
  });

  // 监听授权成功
  useEffect(() => {
    if (isConfirmedApprove) {
      toast.success(`授权${fromToken.symbol}成功`);
    }
  }, [isConfirmedApprove, fromToken.symbol]);

  // 处理交换
  const handleSwap = form.handleSubmit(async () => {
    if (!canSwap) {
      toast.error('流动池为空，无法兑换，请稍后重试');
      return;
    }

    try {
      // 预检查0：测试环境原生币输入上限
      if (maxNativeInputLimit && fromAmount > maxNativeInputLimit) {
        const limitedStr = formatUnits(maxNativeInputLimit);
        form.setValue('fromTokenAmount', limitedStr);
        toast.error(`输入超出测试环境上限，已调整为 ${limitedStr} ${fromToken.symbol}`);
        return;
      }

      // 预检查1：验证环境变量
      const wethAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN;
      const routerAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_ROUTER;

      if (!wethAddress || !routerAddress) {
        console.error('❌ 缺少必要的环境变量配置');
        toast.error('系统配置错误，请联系管理员');
        return;
      }

      // 预检查2：验证交换路径
      if (swapMethod === 'UniswapV2_ETH_TO_TOKEN') {
        if (swapPath.length !== 2) {
          console.error('❌ Native to Token 路径长度错误:', swapPath);
          toast.error('交换路径配置错误');
          return;
        }

        if (swapPath[0] !== wethAddress) {
          console.error('❌ 路径第一个地址不是 WETH:', {
            expected: wethAddress,
            actual: swapPath[0],
          });
          toast.error('WETH 地址配置错误');
          return;
        }
      }

      // 预检查3：验证金额合理性
      if (toAmount <= BigInt(0)) {
        toast.error('无法获取兑换价格，流动池可能不足');
        return;
      }

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
      const minAmountOut = (toAmount * BigInt(995)) / BigInt(1000); // 0.5% 滑点

      console.log('🚀 执行交换，参数详情:', {
        swapMethod,
        fromAmount: fromAmount.toString(),
        toAmount: toAmount.toString(),
        minAmountOut: minAmountOut.toString(),
        swapPath,
        deadline: deadline.toString(),
        account,
      });

      switch (swapMethod) {
        case 'WETH9':
          if (fromToken.isNative) {
            await deposit(fromAmount);
          } else {
            await withdraw(fromAmount);
          }
          break;

        case 'UniswapV2_ETH_TO_TOKEN':
          console.log('📞 调用 swapETHForTokens (直接交易模式):', {
            minAmountOut: minAmountOut.toString(),
            path: swapPath,
            to: account,
            deadline: deadline.toString(),
            value: fromAmount.toString(),
          });

          await swapETHForTokens(minAmountOut, swapPath, account as `0x${string}`, deadline, fromAmount);
          break;

        case 'UniswapV2_TOKEN_TO_ETH':
          await swapTokensForETH(
            fromAmount,
            minAmountOut,
            [
              fromToken.address as `0x${string}`,
              process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN as `0x${string}`,
            ],
            account as `0x${string}`,
            deadline,
          );
          break;

        case 'UniswapV2_TOKEN_TO_TOKEN':
          await swapTokensForTokens(
            fromAmount,
            minAmountOut,
            [fromToken.address as `0x${string}`, toToken.address as `0x${string}`],
            account as `0x${string}`,
            deadline,
          );
          break;
      }
    } catch (error: any) {
      console.error('🚨 交换执行错误:', {
        error,
        errorMessage: error.message,
        errorCause: error.cause,
        errorDetails: error.details,
      });

      // 使用统一的错误处理逻辑，但为swap操作提供额外的上下文提示
      console.error('🚨 交换执行错误详情:', {
        errorMessage: error.message,
        errorCause: error.cause?.message,
        errorDetails: error.details,
        swapMethod,
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        fromAmount: fromAmount.toString(),
        toAmount: toAmount.toString(),
      });

      // 优先检查是否是滑点失败（这是最常见的情况）
      if (
        error.message?.includes('INSUFFICIENT_OUTPUT_AMOUNT') ||
        error.cause?.message?.includes('INSUFFICIENT_OUTPUT_AMOUNT') ||
        error.details?.includes('INSUFFICIENT_OUTPUT_AMOUNT')
      ) {
        toast.error('价格变动过快超过滑点保护，交易被保护性取消，请重试');
        return;
      }

      // 使用全局错误处理逻辑
      handleContractError(error, 'uniswapV2Router');
    }
  });

  // 交换确认后
  useEffect(() => {
    if (isSwapConfirmed) {
      toast.success('兑换成功');
      setTimeout(() => {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('from', fromToken.symbol);
        currentUrl.searchParams.set('to', toToken.symbol);
        window.location.href = currentUrl.toString();
      }, 2000);
    }
  }, [isSwapConfirmed, fromToken.symbol, toToken.symbol]);

  // --------------------------------------------------
  // 9. 错误处理
  // --------------------------------------------------
  // 错误处理（amountsOutError单独处理，不在这里重复处理）
  useEffect(() => {
    const errors = [
      errInitialStakeRound,
      errApprove,
      errDeposit,
      errWithdraw,
      errTokenToToken,
      errETHToToken,
      errTokenToETH,
    ];
    errors.forEach((error) => {
      if (error) {
        handleContractError(error, 'uniswapV2Router');
      }
    });
  }, [
    errInitialStakeRound,
    errApprove,
    errDeposit,
    errWithdraw,
    errTokenToToken,
    errETHToToken,
    errTokenToETH,
    handleContractError,
  ]);

  // --------------------------------------------------
  // 10. 加载状态
  // --------------------------------------------------
  if (!token) {
    return <LoadingIcon />;
  }

  // 如果支持的代币列表为空，显示提示
  if (supportedTokens.length === 0) {
    return (
      <div className="p-6">
        <LeftTitle title="兑换" />
        <div className="text-center text-greyscale-500 mt-4">正在加载代币信息...</div>
      </div>
    );
  }

  const isLoadingOverlay = isApproving || isSwapping;

  return (
    <div className="p-6">
      <LeftTitle title="兑换代币" />
      <div className="w-full max-w-md mt-4">
        <Form {...form}>
          <form>
            {/* From Token 输入框 */}
            <div className="mb-2">
              <FormField
                control={form.control}
                name="fromTokenAmount"
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
                            className="text-xl border-none p-0 h-auto bg-transparent focus:ring-0 focus:outline-none mr-2"
                          />
                          <FormField
                            control={form.control}
                            name="fromTokenAddress"
                            render={({ field: selectField }) => (
                              <FormItem>
                                <FormControl>
                                  <Select
                                    value={selectField.value}
                                    onValueChange={(val) => {
                                      const selectedToken = supportedTokens.find((t) => t.address === val);
                                      if (selectedToken) {
                                        // 如果选择的代币与当前 toToken 相同，则自动对调
                                        if (selectedToken.address === toToken.address) {
                                          setFromToken(selectedToken);
                                          setToToken(fromToken);

                                          selectField.onChange(selectedToken.address);
                                          form.setValue('toTokenAddress', fromToken.address);
                                          form.setValue('fromTokenAmount', '');
                                        } else {
                                          selectField.onChange(val);
                                          setFromToken(selectedToken);
                                        }
                                      }
                                    }}
                                    disabled={isDisabled}
                                  >
                                    <SelectTrigger className="w-auto border-none bg-white hover:bg-gray-50 px-3 py-1.5 rounded-full transition-colors border border-gray-200 font-mono">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-800 font-mono">{fromToken.symbol}</span>
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
                                  const base = ((fromBalance ?? BigInt(0)) * BigInt(percentage)) / BigInt(100);
                                  const capped = maxNativeInputLimit
                                    ? base > maxNativeInputLimit
                                      ? maxNativeInputLimit
                                      : base
                                    : base;
                                  form.setValue('fromTokenAmount', formatUnits(capped));
                                }}
                                disabled={isDisabled || (fromBalance || BigInt(0)) <= BigInt(0)}
                                className="text-xs h-7 px-2 rounded-lg"
                              >
                                {percentage}%
                              </Button>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={setMaxAmount}
                              disabled={isDisabled || (fromBalance || BigInt(0)) <= BigInt(0)}
                              className="text-xs h-7 px-2 rounded-lg"
                            >
                              最高
                            </Button>
                          </div>
                          <span className="text-sm text-gray-600">
                            {formatTokenAmount(fromBalance || BigInt(0))} {fromToken.symbol}
                          </span>
                        </div>
                        {maxNativeInputLimit && (
                          <div className="text-xs text-gray-500 mt-2">
                            测试环境限制：
                            {toToken.isWETH ? '最多可使用 1 ' : `最多可使用 ${MIN_NATIVE_TO_TOKEN} `}
                            {fromToken.symbol}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-center mb-1">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Button
                  variant="ghost"
                  type="button"
                  size="icon"
                  className="rounded-full hover:bg-gray-100"
                  onClick={handleSwapTokens}
                  disabled={isDisabled}
                >
                  <ArrowDown className="w-5 h-5 text-gray-600" />
                </Button>
              </div>
            </div>

            {/* To Token 输入框 */}
            <div className="mb-6">
              <Card className="bg-[#f7f8f9] border-none">
                <CardContent className="py-4 px-2">
                  <div className="flex items-center justify-between mb-3">
                    <Input
                      type="number"
                      placeholder="0"
                      value={formatUnits(toAmount)}
                      disabled
                      readOnly
                      className="text-xl border-none p-0 h-auto bg-transparent focus:ring-0 focus:outline-none mr-2"
                    />
                    <FormField
                      control={form.control}
                      name="toTokenAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={(val) => {
                                const selectedToken = supportedTokens.find((t) => t.address === val);
                                if (selectedToken) {
                                  // 如果选择的代币与当前 fromToken 相同，则自动对调
                                  if (selectedToken.address === fromToken.address) {
                                    setFromToken(toToken);
                                    setToToken(selectedToken);
                                    field.onChange(selectedToken.address);
                                    form.setValue('fromTokenAddress', toToken.address);
                                    form.setValue('fromTokenAmount', '');
                                  } else {
                                    field.onChange(val);
                                    setToToken(selectedToken);
                                  }
                                }
                              }}
                              disabled={isDisabled}
                            >
                              <SelectTrigger className="w-auto border-none bg-white hover:bg-gray-50 px-3 py-1.5 rounded-full transition-colors border border-gray-200 font-mono">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-800 font-mono">{toToken.symbol}</span>
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
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="text-sm text-gray-600">
                      {formatTokenAmount(toBalance || BigInt(0))} {toToken.symbol}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-row space-x-2">
              {needsApproval && (
                <Button className="w-1/2" onClick={handleApprove} disabled={isApproving || isApproved}>
                  {isPendingApprove
                    ? '1.授权中...'
                    : isConfirmingApprove
                    ? '1.确认中...'
                    : isApproved
                    ? '1.已授权'
                    : '1.授权'}
                </Button>
              )}
              <Button
                className={needsApproval ? 'w-1/2' : 'w-full'}
                onClick={handleSwap}
                disabled={!isApproved || isApproving || isSwapping || isSwapConfirmed}
              >
                {isSwapping
                  ? needsApproval
                    ? '2.兑换中...'
                    : '兑换中...'
                  : isSwapConfirmed
                  ? needsApproval
                    ? '2.已兑换'
                    : '已兑换'
                  : needsApproval
                  ? '2.兑换'
                  : '兑换'}
              </Button>
            </div>
          </form>
        </Form>

        {/* 交换信息提示 */}
        {fromAmount > BigInt(0) && (
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

            {/* {directTxHash && (
              <div className="text-sm text-green-600 mt-2">
                ✅ 交易已发送: {directTxHash.slice(0, 10)}...{directTxHash.slice(-8)}
              </div>
            )} */}
          </div>
        )}
      </div>

      <LoadingOverlay isLoading={isLoadingOverlay} text={isApproving ? '授权中...' : '兑换中...'} />
    </div>
  );
};

export default SwapPanel;
