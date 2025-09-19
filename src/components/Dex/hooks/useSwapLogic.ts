import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { formatUnits, parseUnits } from '@/src/lib/format';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { TokenConfig, SwapMethod } from '../utils/swapTypes';
import { useTokenBalance } from './useTokenBalance';
import { useSwapRoute } from './useSwapRoute';
import { MIN_NATIVE_TO_TOKEN } from '../utils/swapConfig';
import {
  validateSwapEnvironment,
  validateSwapPath,
  validateSwapAmount,
} from '../utils/swapValidation';

// 导入交换相关的hooks
import { useApprove } from '@/src/hooks/contracts/useLOVE20Token';
import { useDeposit, useWithdraw } from '@/src/hooks/contracts/useWETH';
import {
  useSwapExactTokensForTokens,
  useSwapExactETHForTokens,
  useSwapExactTokensForETH,
} from '@/src/hooks/contracts/useUniswapV2Router';

export const useSwapLogic = (fromToken: TokenConfig, toToken: TokenConfig) => {
  const { address: account } = useAccount();
  const { handleContractError } = useHandleContractError();

  // 状态管理
  const [fromAmount, setFromAmount] = useState<bigint>(BigInt(0));
  const [toAmount, setToAmount] = useState<bigint>(BigInt(0));

  // 余额查询
  const { balance: fromBalance, isPending: isPendingFromBalance } = useTokenBalance(fromToken, account);
  const { balance: toBalance, isPending: isPendingToBalance } = useTokenBalance(toToken, account);

  // 路由和价格查询
  const {
    swapMethod,
    swapPath,
    amountsOut,
    amountsOutError,
    canSwap,
    errInitialStakeRound,
  } = useSwapRoute(fromToken, toToken, fromAmount);

  // 计算最大输入限制
  const maxNativeInputLimit = useMemo(() => {
    const hasPrefix = !!process.env.NEXT_PUBLIC_TOKEN_PREFIX;
    if (!hasPrefix || !fromToken.isNative) return undefined;
    const limitStr = toToken.isWETH ? '1' : MIN_NATIVE_TO_TOKEN;
    return parseUnits(limitStr);
  }, [fromToken.isNative, toToken.isWETH]);

  // 授权相关
  const needsApproval = !fromToken.isNative && swapMethod !== 'WETH9';
  const approvalTarget = swapMethod === 'WETH9'
    ? (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN as `0x${string}`)
    : (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_ROUTER as `0x${string}`);

  // 合约操作hooks
  const {
    approve,
    isPending: isPendingApprove,
    isConfirming: isConfirmingApprove,
    isConfirmed: isConfirmedApprove,
    writeError: errApprove,
  } = useApprove(fromToken.address as `0x${string}`);

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

  // 计算状态
  const isApproving = isPendingApprove || isConfirmingApprove;
  const isApproved = isConfirmedApprove || !needsApproval;
  const isSwapping = isPendingDeposit || isConfirmingDeposit || isPendingWithdraw || isConfirmingWithdraw ||
    isPendingTokenToToken || isConfirmingTokenToToken || isPendingETHToToken || isConfirmingETHToToken ||
    isPendingTokenToETH || isConfirmingTokenToETH;
  const isSwapConfirmed = isConfirmedDeposit || isConfirmedWithdraw || isConfirmedTokenToToken ||
    isConfirmedETHToToken || isConfirmedTokenToETH;

  // 更新输出数量
  useEffect(() => {
    if (swapMethod === 'WETH9') {
      setToAmount(fromAmount);
    } else if (amountsOut && amountsOut.length > 1) {
      const finalOutputAmount = amountsOut[amountsOut.length - 1];
      setToAmount(BigInt(finalOutputAmount));
    } else {
      setToAmount(BigInt(0));
    }
  }, [swapMethod, fromAmount, amountsOut]);

  // 错误处理
  useEffect(() => {
    if (amountsOutError) {
      handleContractError(amountsOutError, 'uniswapV2Router');
    }
  }, [amountsOutError, handleContractError]);

  useEffect(() => {
    const errors = [errInitialStakeRound, errApprove, errDeposit, errWithdraw, errTokenToToken, errETHToToken, errTokenToETH];
    errors.forEach((error) => {
      if (error) {
        handleContractError(error, 'uniswapV2Router');
      }
    });
  }, [errInitialStakeRound, errApprove, errDeposit, errWithdraw, errTokenToToken, errETHToToken, errTokenToETH, handleContractError]);

  // 授权成功提示
  useEffect(() => {
    if (isConfirmedApprove) {
      toast.success(`授权${fromToken.symbol}成功`);
    }
  }, [isConfirmedApprove, fromToken.symbol]);

  // 交换成功提示和页面刷新
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

  // 设置最大数量
  const setMaxAmount = () => {
    const rawMax = fromBalance || BigInt(0);
    const capped = maxNativeInputLimit ? (rawMax > maxNativeInputLimit ? maxNativeInputLimit : rawMax) : rawMax;
    return formatUnits(capped);
  };

  // 执行授权
  const handleApprove = async () => {
    try {
      await approve(approvalTarget, fromAmount);
    } catch (error: any) {
      console.error(error);
    }
  };

  // 执行交换
  const executeSwap = async () => {
    if (!canSwap) {
      toast.error('流动池为空，无法兑换，请稍后重试');
      return;
    }

    // 环境验证
    const envValidation = validateSwapEnvironment();
    if (!envValidation.isValid) {
      toast.error(envValidation.error!);
      return;
    }

    // 测试环境限制验证
    if (maxNativeInputLimit && fromAmount > maxNativeInputLimit) {
      const limitedStr = formatUnits(maxNativeInputLimit);
      toast.error(`输入超出测试环境上限，已调整为 ${limitedStr} ${fromToken.symbol}`);
      return;
    }

    // 路径验证
    const pathValidation = validateSwapPath(swapPath, swapMethod, fromToken, toToken);
    if (!pathValidation.isValid) {
      toast.error(pathValidation.error!);
      return;
    }

    // 金额验证
    const amountValidation = validateSwapAmount(toAmount);
    if (!amountValidation.isValid) {
      toast.error(amountValidation.error!);
      return;
    }

    try {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
      const minAmountOut = (toAmount * BigInt(995)) / BigInt(1000); // 0.5% 滑点

      switch (swapMethod) {
        case 'WETH9':
          if (fromToken.isNative) {
            await deposit(fromAmount);
          } else {
            await withdraw(fromAmount);
          }
          break;

        case 'UniswapV2_ETH_TO_TOKEN':
          await swapETHForTokens(minAmountOut, swapPath, account as `0x${string}`, deadline, fromAmount);
          break;

        case 'UniswapV2_TOKEN_TO_ETH':
          await swapTokensForETH(fromAmount, minAmountOut, swapPath, account as `0x${string}`, deadline);
          break;

        case 'UniswapV2_TOKEN_TO_TOKEN':
          await swapTokensForTokens(fromAmount, minAmountOut, swapPath, account as `0x${string}`, deadline);
          break;
      }
    } catch (error: any) {
      // 处理滑点失败
      if (
        error.message?.includes('INSUFFICIENT_OUTPUT_AMOUNT') ||
        error.cause?.message?.includes('INSUFFICIENT_OUTPUT_AMOUNT') ||
        error.details?.includes('INSUFFICIENT_OUTPUT_AMOUNT')
      ) {
        toast.error('价格变动过快超过滑点保护，交易被保护性取消，请重试');
        return;
      }
      handleContractError(error, 'uniswapV2Router');
    }
  };

  return {
    // 状态
    fromAmount,
    toAmount,
    setFromAmount,
    fromBalance,
    toBalance,
    isPendingFromBalance,
    isPendingToBalance,

    // 交换信息
    swapMethod,
    swapPath,
    amountsOut,
    amountsOutError,
    canSwap,
    maxNativeInputLimit,

    // 操作状态
    needsApproval,
    isApproved,
    isApproving,
    isSwapping,
    isSwapConfirmed,

    // 操作方法
    setMaxAmount,
    handleApprove,
    executeSwap,
  };
};