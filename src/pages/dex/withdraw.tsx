'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/router';
import { z } from 'zod';

// UI components
import { Card, CardContent } from '@/components/ui/card';

// my funcs
import { parseUnits } from '@/src/lib/format';

// my hooks
import { useLiquidityPageData } from '@/src/hooks/composite/useLiquidityPageData';

// my context
import useTokenContext from '@/src/hooks/context/useTokenContext';

// my components
import Header from '@/src/components/Header';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import WithdrawForm from '@/src/components/Dex/WithdrawForm';

// ================================================
// Token 配置接口定义
// ================================================
interface TokenConfig {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  isNative: boolean;
}

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
const WithdrawPage = () => {
  const { address: account } = useAccount();
  const { token } = useTokenContext();
  const router = useRouter();
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
    if (isRootParent) {
      const usdtSymbol = process.env.NEXT_PUBLIC_USDT_SYMBOL;
      const defaultToken = baseTokens.find((t) => t.symbol === usdtSymbol);
      return defaultToken || baseTokens[0] || {
        symbol: parentTokenSymbol || '',
        address: parentTokenAddress || ('0x0000000000000000000000000000000000000000' as `0x${string}`),
        decimals: 18,
        isNative: false,
      };
    } else {
      const defaultToken = baseTokens.find((t) => t.symbol === parentTokenSymbol);
      return defaultToken || baseTokens[0] || {
        symbol: parentTokenSymbol || '',
        address: parentTokenAddress || ('0x0000000000000000000000000000000000000000' as `0x${string}`),
        decimals: 18,
        isNative: false,
      };
    }
  });

  // --------------------------------------------------
  // 2. 处理 URL 参数 + baseTokens 变化时同步 baseToken
  // --------------------------------------------------
  useEffect(() => {
    if (baseTokens.length === 0) return;

    // 优先使用 URL 参数中的 baseToken
    const { baseToken: baseTokenSymbol } = router.query;
    if (baseTokenSymbol && typeof baseTokenSymbol === 'string') {
      const foundToken = baseTokens.find((t) => t.symbol === baseTokenSymbol);
      if (foundToken) {
        setBaseToken(foundToken);
        return;
      }
    }

    // 没有 URL 参数或未匹配时，检查当前选中的是否还在列表中
    const currentTokenExists = baseTokens.some((t) => t.address === baseToken.address);
    if (!currentTokenExists) {
      if (isRootParent) {
        const usdtSymbol = process.env.NEXT_PUBLIC_USDT_SYMBOL;
        const defaultToken = baseTokens.find((t) => t.symbol === usdtSymbol) || baseTokens[0];
        if (defaultToken) setBaseToken(defaultToken);
      } else {
        const defaultToken = baseTokens.find((t) => t.symbol === parentTokenSymbol) || baseTokens[0];
        if (defaultToken) setBaseToken(defaultToken);
      }
    }
  }, [router.query, baseTokens]);

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
  // 3. 使用流动性页面数据查询hook
  // --------------------------------------------------
  const {
    lpBalance,
    pairAddress,
    pairExists,
    baseReserve,
    targetReserve,
    lpTotalSupply,
    isLoading: isLoadingLiquidityData,
    refreshLiquidityData,
  } = useLiquidityPageData({
    baseToken,
    targetToken,
    account,
  });

  // --------------------------------------------------
  // 4. 加载状态
  // --------------------------------------------------
  if (!token || !targetToken || isLoadingLiquidityData) {
    return (
      <>
        <Header title="流动性撤出" />
        <main className="flex-grow px-3 sm:px-0">
          <LoadingIcon />
        </main>
      </>
    );
  }

  // 检查是否有LP余额
  const hasLPBalance = pairExists && (lpBalance || BigInt(0)) > BigInt(0);

  return (
    <>
      <Header title="流动性撤出" showBackButton={true} />
      <main className="flex-grow sm:px-0">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <LeftTitle title="流动性撤出" />
          </div>

          <div className="w-full max-w-md">
            {!pairExists ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-gray-500">
                    <p className="font-medium">未找到流动性池</p>
                    <p className="text-sm mt-1">
                      {baseToken.symbol}-{targetToken.symbol} 交易对不存在
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : !hasLPBalance ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-gray-500">
                    <p className="font-medium">您在此交易对中没有LP代币</p>
                    <p className="text-sm mt-1">请先添加流动性</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <WithdrawForm
                baseToken={baseToken}
                targetToken={targetToken}
                baseTokens={baseTokens}
                lpBalance={lpBalance || BigInt(0)}
                pairAddress={pairAddress as `0x${string}`}
                baseReserve={baseReserve || BigInt(0)}
                targetReserve={targetReserve || BigInt(0)}
                lpTotalSupply={lpTotalSupply || BigInt(0)}
                onBaseTokenChange={setBaseToken}
                onRefreshData={refreshLiquidityData}
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default WithdrawPage;
