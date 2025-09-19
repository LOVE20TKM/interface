'use client';

import { useState, useMemo } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Search } from 'lucide-react';

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

// my context
import useTokenContext from '@/src/hooks/context/useTokenContext';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

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
  const [hasQueried, setHasQueried] = useState(false);

  // 构建基础代币列表
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

  // 表单设置
  const form = useForm<QueryFormValues>({
    resolver: zodResolver(queryFormSchema),
    defaultValues: {
      queryAddress: '',
      baseTokenAddress: baseToken.address,
    },
    mode: 'onChange',
  });

  // 同步表单值与代币状态
  const watchedBaseTokenAddress = form.watch('baseTokenAddress');
  const watchedQueryAddress = form.watch('queryAddress');

  // 更新选中的基础代币
  useMemo(() => {
    const selectedToken = baseTokens.find((t) => t.address === watchedBaseTokenAddress);
    if (selectedToken) {
      setBaseToken(selectedToken);
    }
  }, [watchedBaseTokenAddress, baseTokens]);

  // 查询地址（只有在表单有效且已查询时才传递）
  const queryAddress = useMemo(() => {
    if (!hasQueried || !watchedQueryAddress || !watchedQueryAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return undefined;
    }
    return watchedQueryAddress as `0x${string}`;
  }, [watchedQueryAddress, hasQueried]);

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

  if (!token || !targetToken) {
    return <LoadingIcon />;
  }

  const showResults = hasQueried && hasValidInput;
  const hasLiquidity = showResults && pairExists && userLPBalance > BigInt(0);

  return (
    <div className="py-6 px-2">
      <div className="flex justify-between items-center mb-6">
        <LeftTitle title="流动性查询" />
      </div>

      <div className="w-full max-w-md">
        <Form {...form}>
          <form onSubmit={handleQuery} className="space-y-4">
            {/* 币对选择 */}
            <Card>
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
                      <FormLabel className="text-xs text-gray-500">目标代币</FormLabel>
                      <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center text-sm text-gray-700">
                        {targetToken.symbol}
                      </div>
                    </FormItem>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 地址输入 */}
            <Card>
              <CardContent className="p-4">
                <FormField
                  control={form.control}
                  name="queryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>查询地址</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入要查询的地址 (0x...)" {...field} className="font-mono text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 查询按钮 */}
            <Button type="submit" className="w-full" disabled={!form.formState.isValid}>
              <Search className="w-4 h-4 mr-2" />
              查询流动性
            </Button>
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
                    <div className="text-lg font-semibold text-gray-800 mb-4">该地址情况：</div>

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
                      <div className="text-sm font-medium text-gray-700 mb-3">可兑换代币数量</div>
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

                    {/* 池子信息 */}
                    <div className="border-t pt-4">
                      <div className="text-lg font-medium text-gray-700 mb-3">底池信息</div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex justify-between">
                          <span>总LP供应量</span>
                          <span>{formatTokenAmount(poolTotalSupply || BigInt(0))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>总{baseToken.symbol}储备</span>
                          <span>{formatTokenAmount(poolBaseReserve || BigInt(0))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>总{targetToken.symbol}储备</span>
                          <span>{formatTokenAmount(poolTargetReserve || BigInt(0))}</span>
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
