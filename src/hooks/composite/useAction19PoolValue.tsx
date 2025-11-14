import { useMemo } from 'react';
import { usePairStats } from '@/src/hooks/composite/usePairStats';

interface TokenConfig {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  isNative: boolean;
}

interface UseAction19PoolValueParams {
  tokenAddress: `0x${string}` | undefined;
  enabled?: boolean;
}

/**
 * 获取19号行动的u池资产价值
 * 19号行动是u池质押行动，TUSDT-LOVE20池子的所有代币都参与了19号行动
 * 这个hook计算池子中的所有资产价值（以LOVE20代币计）
 */
export const useAction19PoolValue = ({ tokenAddress, enabled = true }: UseAction19PoolValueParams) => {
  // TUSDT配置
  const usdtToken: TokenConfig | null = useMemo(() => {
    const usdtSymbol = process.env.NEXT_PUBLIC_USDT_SYMBOL;
    const usdtAddress = process.env.NEXT_PUBLIC_USDT_ADDRESS;
    if (!usdtSymbol || !usdtAddress) return null;
    return {
      symbol: usdtSymbol,
      address: usdtAddress as `0x${string}`,
      decimals: 18,
      isNative: false,
    };
  }, []);

  // 当前token配置
  const targetToken: TokenConfig | null = useMemo(() => {
    if (!tokenAddress) return null;
    return {
      symbol: 'LOVE20', // 这里用通用名称，实际会从context获取
      address: tokenAddress,
      decimals: 18,
      isNative: false,
    };
  }, [tokenAddress]);

  // 获取TUSDT-LOVE20池子的统计信息
  const { pairExists, poolBaseReserve, poolTargetReserve, baseToTargetPrice, isLoading } = usePairStats({
    baseToken: usdtToken || {
      symbol: '',
      address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      decimals: 18,
      isNative: false,
    },
    targetToken,
  });

  // 计算池子资产价值
  const poolValue = useMemo(() => {
    // 检查数据是否完整
    if (
      !enabled ||
      !pairExists ||
      !poolBaseReserve ||
      poolBaseReserve === BigInt(0) ||
      !poolTargetReserve ||
      poolTargetReserve === BigInt(0) ||
      !usdtToken ||
      !targetToken
    ) {
      return {
        totalPoolValue: BigInt(0), // 总资产价值（以LOVE20代币计）
        usdtAmount: BigInt(0), // TUSDT数量
        love20Amount: BigInt(0), // LOVE20数量
      };
    }

    // 池子中的TUSDT数量
    const usdtAmount = poolBaseReserve;

    // 池子中的LOVE20数量
    const love20Amount = poolTargetReserve;

    // 总价值 = LOVE20数量 + TUSDT的LOVE20等价价值
    const totalPoolValue = love20Amount * BigInt(2);

    return {
      totalPoolValue,
      usdtAmount,
      love20Amount,
    };
  }, [enabled, pairExists, poolBaseReserve, poolTargetReserve, baseToTargetPrice, usdtToken, targetToken]);

  return {
    // 池子统计
    pairExists,
    poolBaseReserve,
    poolTargetReserve,
    baseToTargetPrice,

    // 计算结果
    ...poolValue,

    // 状态
    isLoading,
    error: undefined, // 该hook没有独立的错误处理

    // 验证
    hasValidData: !!usdtToken && !!targetToken && pairExists,
  };
};
