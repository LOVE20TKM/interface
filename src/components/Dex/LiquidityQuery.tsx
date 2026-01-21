'use client';

import { useState, useMemo, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useAccount } from 'wagmi';
import { ArrowUpDown } from 'lucide-react';

// UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

// my funcs
import { formatTokenAmount, formatPercentage } from '@/src/lib/format';

// my hooks
import { useLiquidityQuery } from '@/src/hooks/composite/useLiquidityQuery';
import { usePairStats } from '@/src/hooks/composite/usePairStats';
import { useLPSymbol } from '@/src/hooks/contracts/useUniswapV2Pair';

// my context
import useTokenContext from '@/src/hooks/context/useTokenContext';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import AddToMetamask from '@/src/components/Common/AddToMetamask';

// ================================================
// Token 配置接口定义
// ================================================
interface TokenConfig {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  isNative: boolean;
}

// 构建支持的基础代币列表
const buildBaseTokens = (parentToken?: { symbol: string; address: `0x${string}` } | null): TokenConfig[] => {
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

  // 2. 父代币（从 TokenContext 获取）
  if (parentToken?.symbol && parentToken?.address) {
    supportedTokens.push({
      symbol: parentToken.symbol,
      address: parentToken.address,
      decimals: 18,
      isNative: false,
    });
  }

  return supportedTokens;
};

// ================================================
// 表单 Schema 定义
// ================================================
const queryFormSchema = z.object({
  queryAddress: z
    .string()
    .min(1, '请输入查询地址')
    .regex(/^0x[a-fA-F0-9]{40}$/, '请输入有效的以太坊地址'),
  baseTokenAddress: z.string().min(1, '请选择基础代币'),
});

type QueryFormValues = z.infer<typeof queryFormSchema>;

// ================================================
// 主组件
// ================================================
const LiquidityQueryPanel: React.FC = () => {
  const { token } = useTokenContext();
  const { address: account, isConnected } = useAccount();
  const [hasQueried, setHasQueried] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showTokenToBase, setShowTokenToBase] = useState(true);

  // 构建基础代币列表
  const baseTokens = useMemo(() => {
    const parentToken =
      token?.parentTokenSymbol && token?.parentTokenAddress
        ? { symbol: token.parentTokenSymbol, address: token.parentTokenAddress }
        : null;
    return buildBaseTokens(parentToken);
  }, [token?.parentTokenSymbol, token?.parentTokenAddress]);

  // 选中的基础代币状态
  const [baseToken, setBaseToken] = useState<TokenConfig>(() => {
    const usdtSymbol = process.env.NEXT_PUBLIC_USDT_SYMBOL;
    const defaultToken = baseTokens.find((t) => t.symbol === usdtSymbol);
    return (
      defaultToken || {
        symbol: baseTokens[0]?.symbol || '',
        address: baseTokens[0]?.address || '0x0000000000000000000000000000000000000000',
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

  // 表单设置
  const form = useForm<QueryFormValues>({
    resolver: zodResolver(queryFormSchema),
    defaultValues: {
      queryAddress: account || '',
      baseTokenAddress: baseToken.address,
    },
    mode: 'onChange',
  });

  // 当 token 异步加载导致 baseTokens 变化时，确保当前选中的 baseToken 仍然有效
  useEffect(() => {
    if (baseTokens.length === 0) return;

    const isCurrentValid = baseTokens.some((t) => t.address === baseToken.address);
    if (isCurrentValid) return;

    const usdtSymbol = process.env.NEXT_PUBLIC_USDT_SYMBOL;
    const preferred = (usdtSymbol ? baseTokens.find((t) => t.symbol === usdtSymbol) : undefined) || baseTokens[0];
    if (!preferred) return;

    setBaseToken(preferred);
    form.setValue('baseTokenAddress', preferred.address, { shouldValidate: true });
  }, [baseTokens, baseToken.address, form]);

  // 同步表单值与代币状态
  const watchedBaseTokenAddress = form.watch('baseTokenAddress');
  const watchedQueryAddress = form.watch('queryAddress');

  // 初始化时自动填入钱包地址并自动查询
  useEffect(() => {
    if (!isInitialized && account) {
      form.setValue('queryAddress', account);
      setIsInitialized(true);
      // 自动触发第一次查询
      setHasQueried(true);
    }
  }, [account, form, isInitialized]);

  // 检测用户是否手动修改了地址（与当前钱包地址不同）
  const isManualInput = watchedQueryAddress !== account;

  // 自动查询：只对当前钱包地址自动查询，手动输入的地址需要点击按钮
  useEffect(() => {
    const isValidAddress = watchedQueryAddress && watchedQueryAddress.match(/^0x[a-fA-F0-9]{40}$/);
    const isFormValid = form.formState.isValid;
    const isCurrentAccount = watchedQueryAddress === account;

    // 只有当地址是当前钱包地址且表单有效时才自动查询
    if (isValidAddress && isFormValid && !hasQueried && isCurrentAccount && account) {
      const timer = setTimeout(() => {
        setHasQueried(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [watchedQueryAddress, form.formState.isValid, hasQueried, account]);

  // 更新选中的基础代币
  useMemo(() => {
    const selectedToken = baseTokens.find((t) => t.address === watchedBaseTokenAddress);
    if (selectedToken) {
      setBaseToken(selectedToken);
    }
  }, [watchedBaseTokenAddress, baseTokens]);

  // 当基础代币变化时，重置查询状态（但不自动查询）
  useEffect(() => {
    if (hasQueried) {
      setHasQueried(false);
    }
  }, [watchedBaseTokenAddress]);

  // 查询地址（只有在表单有效且已查询时才传递）
  const queryAddress = useMemo(() => {
    if (!hasQueried || !watchedQueryAddress || !watchedQueryAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return undefined;
    }
    return watchedQueryAddress as `0x${string}`;
  }, [watchedQueryAddress, hasQueried]);

  // 币对统计数据查询
  const {
    pairAddress,
    pairExists: pairStatsExists,
    poolTotalSupply: statsTotalSupply,
    poolBaseReserve: statsBaseReserve,
    poolTargetReserve: statsTargetReserve,
    baseToTargetPrice,
    targetToBasePrice,
    isLoading: isLoadingStats,
  } = usePairStats({
    baseToken,
    targetToken,
  });

  // 获取LP代币的symbol
  const { lpSymbol } = useLPSymbol(pairAddress);

  // 流动性查询
  const {
    pairExists,
    userLPBalance,
    userBaseTokenAmount,
    userTargetTokenAmount,
    lpSharePercentage,
    poolBaseReserve,
    poolTargetReserve,
    poolTotalSupply,
    isLoading,
    hasValidInput,
  } = useLiquidityQuery({
    baseToken,
    targetToken,
    queryAddress,
  });

  // 处理查询
  const handleQuery = form.handleSubmit(() => {
    setHasQueried(true);
  });

  // 重置查询
  const handleReset = () => {
    // 重置表单，清空地址输入框
    form.reset({
      queryAddress: '',
      baseTokenAddress: baseToken.address,
    });
    // 重置查询状态
    setHasQueried(false);
  };

  if (!token || !targetToken) {
    return <LoadingIcon />;
  }

  const showResults = hasQueried && hasValidInput;
  const hasLiquidity = showResults && pairExists && userLPBalance > BigInt(0);

  return (
    <div className="py-2 px-0">
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
        <Form {...form}>
          <form onSubmit={handleQuery} className="space-y-4">
            {/* 币对选择 */}
            <Card>
              <CardContent className="px-4 pt-4 pb-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-700 mb-3 font-bold">选择交易对：</div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* 基础代币选择 */}
                    <FormField
                      control={form.control}
                      name="baseTokenAddress"
                      render={({ field }) => (
                        <FormItem>
                          {/* <FormLabel className="text-xs text-gray-500">基础代币</FormLabel> */}
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
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
                      {/* <FormLabel className="text-xs text-gray-500">目标代币</FormLabel> */}
                      <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center text-sm text-gray-700">
                        {targetToken.symbol}
                      </div>
                    </FormItem>
                  </div>

                  {/* LP代币地址显示 */}
                  {pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000' && (
                    <div className="mt-3 pb-1">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs text-gray-600 whitespace-nowrap">LP代币地址：</span>
                        <AddressWithCopyButton address={pairAddress} />
                        <AddToMetamask
                          tokenAddress={pairAddress as `0x${string}`}
                          tokenSymbol={lpSymbol || 'LP' + baseToken.symbol + '-' + targetToken.symbol}
                          tokenDecimals={token.decimals}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 币对统计数据 */}
            {targetToken && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-gray-700 mb-3 text-center">交易对统计</div>

                  {isLoadingStats ? (
                    <div className="text-center py-4">
                      <LoadingIcon />
                      <p className="text-xs text-gray-500 mt-1">加载中...</p>
                    </div>
                  ) : !pairStatsExists ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">交易对不存在</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* 池子基础信息 */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">LP总数量：</span>
                          <span className="font-medium text-secondary">{formatTokenAmount(statsTotalSupply)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{baseToken.symbol} 总数量：</span>
                          <span className="font-medium text-secondary">{formatTokenAmount(statsBaseReserve)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{targetToken.symbol} 总数量：</span>
                          <span className="font-medium text-secondary">{formatTokenAmount(statsTargetReserve)}</span>
                        </div>
                      </div>

                      {/* 价格信息 */}
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-gray-600">
                            {showTokenToBase ? (
                              <>
                                1 {targetToken.symbol} ={' '}
                                <span className="font-medium">{formatTokenAmount(targetToBasePrice, 5)}</span>{' '}
                                {baseToken.symbol}
                              </>
                            ) : (
                              <>
                                1 {baseToken.symbol} ={' '}
                                <span className="font-medium">{formatTokenAmount(baseToTargetPrice)}</span>{' '}
                                {targetToken.symbol}
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
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 地址输入 */}
            <Card>
              <CardContent className="p-4">
                <FormField
                  control={form.control}
                  name="queryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-gray-800 mb-4">查询地址：</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="flex space-x-2">
                            <Input
                              placeholder={'请输入要查询的地址 (0x...)'}
                              {...field}
                              className="flex-1 font-mono text-sm"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleQuery();
                                }
                              }}
                            />
                            <Button type="submit" disabled={!form.formState.isValid || (hasQueried && isLoading)}>
                              {hasQueried && isLoading ? '查询中...' : isManualInput ? '查询' : '重新查询'}
                            </Button>
                            {hasQueried && (
                              <Button variant="outline" onClick={handleReset}>
                                重置
                              </Button>
                            )}
                          </div>
                          {!isConnected && (
                            <div className="text-xs text-orange-600">⚠️ 未连接钱包，请手动输入要查询的地址</div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </form>
        </Form>

        {/* 查询结果 */}
        {showResults && (
          <div className="mt-6">
            {isLoading ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <LoadingIcon />
                  <p className="text-sm text-gray-500 mt-2">查询中...</p>
                </CardContent>
              </Card>
            ) : !pairExists ? (
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
            ) : !hasLiquidity ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-gray-500">
                    <p className="text-sm mt-1">该地址在此交易对中，没有LP代币</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-gray-700 mb-3">该地址LP情况：</div>

                    {/* LP代币数量 */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">LP代币数量</span>
                        <span className="font-medium">{formatTokenAmount(userLPBalance)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">所占份额</span>
                        <span className="font-medium">{formatPercentage(lpSharePercentage)}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="text-sm font-medium text-gray-700 mb-3">可兑换代币数量：</div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{baseToken.symbol}</span>
                          <span className="font-medium">{formatTokenAmount(userBaseTokenAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{targetToken.symbol}</span>
                          <span className="font-medium">{formatTokenAmount(userTargetTokenAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiquidityQueryPanel;
