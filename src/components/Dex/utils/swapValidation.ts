import { z } from 'zod';
import { parseUnits } from '@/src/lib/format';
import { TokenConfig, SwapValidationResult } from './swapTypes';
import { getSwapContractAddresses } from './swapConfig';

export const getSwapFormSchema = (balance: bigint) =>
  z.object({
    fromTokenAmount: z
      .string()
      .nonempty('请输入兑换数量')
      .refine(
        (val) => {
          if (val.endsWith('.')) return true;
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

export const validateSwapEnvironment = (): SwapValidationResult => {
  const { wethAddress, routerAddress } = getSwapContractAddresses();

  if (!wethAddress || !routerAddress) {
    return {
      isValid: false,
      error: '系统配置错误，请联系管理员',
    };
  }

  return { isValid: true };
};

export const validateSwapPath = (
  swapPath: `0x${string}`[],
  swapMethod: string,
  fromToken: TokenConfig,
  toToken: TokenConfig,
): SwapValidationResult => {
  const { wethAddress } = getSwapContractAddresses();

  if (swapMethod === 'UniswapV2_ETH_TO_TOKEN') {
    if (swapPath.length < 2 || swapPath.length > 3) {
      return {
        isValid: false,
        error: '交换路径配置错误',
      };
    }

    if (swapPath[0] !== wethAddress) {
      return {
        isValid: false,
        error: 'TKM20/WETH 地址配置错误',
      };
    }
  }

  if (swapMethod === 'UniswapV2_TOKEN_TO_ETH') {
    if (swapPath.length < 2 || swapPath.length > 3) {
      return {
        isValid: false,
        error: '交换路径配置错误',
      };
    }

    if (swapPath[swapPath.length - 1] !== wethAddress) {
      return {
        isValid: false,
        error: 'TKM20/WETH 地址配置错误',
      };
    }
  }

  return { isValid: true };
};

export const validateSwapAmount = (toAmount: bigint): SwapValidationResult => {
  if (toAmount <= BigInt(0)) {
    return {
      isValid: false,
      error: '无法获取兑换价格，流动池可能不足',
    };
  }

  return { isValid: true };
};