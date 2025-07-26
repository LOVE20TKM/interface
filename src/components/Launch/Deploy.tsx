'use client';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';

import { toast } from 'react-hot-toast';

// shadcn/ui
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// my funcs
import { checkWalletConnection } from '@/src/lib/web3';

// my hooks
import { useLaunchToken } from '@/src/hooks/contracts/useLOVE20Launch';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import LoadingIcon from '../Common/LoadingIcon';
import LoadingOverlay from '../Common/LoadingOverlay';

// 1. 使用 zod 定义表单校验规则
const TokenFormSchema = z.object({
  symbol: z
    .string()
    .nonempty('请输入代币符号')
    .length(6, '代币符号必须是 6 个字符')
    .regex(/^[A-Z0-9]+$/, '只能使用大写字母 A~Z 和数字 0~9')
    .regex(/^[A-Z]/, '必须以大写字母 A~Z 开头'),
});

type TokenFormValues = z.infer<typeof TokenFormSchema>;

export default function TokenDeployment() {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { chain: accountChain } = useAccount();
  const [symbol, setSymbol] = useState('');

  // 2. 部署合约相关 Hook
  const { launchToken, isPending, writeError, isConfirming, isConfirmed } = useLaunchToken();

  // 3. 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (writeError) {
      handleContractError(writeError, 'launch');
    }
  }, [writeError, handleContractError]);

  // 4. 表单 Hook
  const form = useForm<TokenFormValues>({
    resolver: zodResolver(TokenFormSchema),
    defaultValues: {
      symbol: '',
    },
  });

  // 5. 提交逻辑
  async function onSubmit(data: TokenFormValues) {
    if (!checkWalletConnection(accountChain)) {
      toast.error('请切换到正确的网络');
      return;
    }
    try {
      setSymbol(data.symbol);
      await launchToken(data.symbol, token?.address as `0x${string}`);
    } catch (error) {
      console.error(error);
    }
  }

  // 6. 交易确认后跳转
  useEffect(() => {
    if (isConfirmed) {
      router.push(`/launch/?symbol=${process.env.NEXT_PUBLIC_TOKEN_PREFIX ?? ''}${symbol}`);
    }
  }, [isConfirmed, router, symbol]);

  // 如果 TokenContext 中还未读取到 token，就显示加载
  if (!token) {
    return <LoadingIcon />;
  }

  // 7. 界面渲染
  const isLoading = isPending || isConfirming;

  return (
    <>
      <Card className="w-full border-none shadow-none rounded-none">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">开启子币公平发射</CardTitle>
          <CardDescription className="text-center">
            创建 <span className="text-secondary">{token.symbol}</span> 的子币
          </CardDescription>
        </CardHeader>

        {/* 8. 用 Form 包裹 CardContent + CardFooter */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>子币符号：</FormLabel>
                    <FormControl>
                      <Input
                        id="symbol"
                        placeholder="例如: TENNIS, FOOTBALL"
                        disabled={isLoading || isConfirmed}
                        className="!ring-secondary-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>只能用大写字母A~Z和数字0~9，最多 6 个字符。</FormDescription>
                    {/* 有错误信息会渲染在这 */}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button className="w-1/2" type="submit" disabled={isLoading || isConfirmed}>
                {isPending ? '提交中...' : isConfirming ? '确认中...' : isConfirmed ? '提交成功' : '提交'}
              </Button>
            </CardFooter>
          </form>
        </Form>
        <div className="bg-gray-100 text-greyscale-500 rounded-lg p-4 text-sm mt-0 m-6">
          <p className="mb-1">说明：</p>
          <p>1. 须持有 {token?.symbol}不少于 0.5%的治理票</p>
          <p>2. 子币发射目标：须筹集 20,000,000个 {token?.symbol}</p>
        </div>
      </Card>
      <LoadingOverlay isLoading={isLoading} text={isPending ? '提交交易...' : '确认交易...'} />
    </>
  );
}
