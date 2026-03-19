'use client';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useAccount, useChainId } from 'wagmi';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';

import { toast } from 'react-hot-toast';

// shadcn/ui
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// my funcs
import { formatTokenAmount } from '@/src/lib/format';
import { safeToBigInt } from '@/src/lib/clientUtils';

// my hooks
import { useLaunchToken, useRemainingLaunchCount } from '@/src/hooks/contracts/useLOVE20Launch';
import { useNumOfMintGovRewardByAccount } from '@/src/hooks/contracts/useLOVE20Mint';
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
  const { address: account } = useAccount();
  const chainId = useChainId();
  const [symbol, setSymbol] = useState('');

  // 2. 部署合约相关 Hook
  const { launchToken, isPending, writeError, isConfirming, isConfirmed } = useLaunchToken();
  const { remainingLaunchCount, isPending: isRemainingLaunchCountPending } = useRemainingLaunchCount(
    token ? token.address : '0x0000000000000000000000000000000000000000',
    account as `0x${string}`,
  );

  const { numOfMintGovRewardByAccount, isPending: isNumOfMintGovRewardByAccountPending } =
    useNumOfMintGovRewardByAccount(
      token ? token.address : '0x0000000000000000000000000000000000000000',
      account as `0x${string}`,
    );
  // 获取等待铸币次数
  const MIN_GOV_REWARD_MINTS = Number(process.env.NEXT_PUBLIC_MIN_GOV_REWARD_MINTS_TO_LAUNCH) || BigInt(180);
  const remainingMintTimes =
    Number(MIN_GOV_REWARD_MINTS) - (Number(numOfMintGovRewardByAccount ?? 0) % Number(MIN_GOV_REWARD_MINTS));

  // 3. 表单 Hook
  const form = useForm<TokenFormValues>({
    resolver: zodResolver(TokenFormSchema),
    defaultValues: {
      symbol: '',
    },
  });

  // 5. 提交逻辑
  async function onSubmit(data: TokenFormValues) {
    try {
      const confirmed = await handleConfirm();
      if (!confirmed) return;

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

  // 修改状态管理
  const [open, setOpen] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<{
    resolve: (value: boolean) => void;
    reject: () => void;
  } | null>(null);

  // 修改确认逻辑
  const handleConfirm = (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      setPendingConfirm({ resolve, reject });
      setOpen(true);
    });
  };

  const handleConfirmClick = () => {
    setOpen(false);
    pendingConfirm?.resolve(true);
    setPendingConfirm(null);
  };

  const handleCancelClick = () => {
    setOpen(false);
    pendingConfirm?.resolve(false);
    setPendingConfirm(null);
  };

  if (!token || isRemainingLaunchCountPending || isNumOfMintGovRewardByAccountPending) {
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
                        placeholder="例如: TENNIS, GAME20"
                        disabled={isLoading || isConfirmed}
                        className="!ring-secondary-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      最多 6 个字符，首字母只能用大写字母A~Z，后5个字符只能用大写字母A~Z和数字0~9。
                    </FormDescription>
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
          <p>
            公平发射募集目标：
            {formatTokenAmount(safeToBigInt(process.env.NEXT_PUBLIC_PARENT_TOKEN_FUNDRAISING_GOAL ?? '0'))}个{' '}
            {token?.symbol}
          </p>
        </div>
      </Card>
      <LoadingOverlay isLoading={isLoading} text={isPending ? '提交交易...' : '确认交易...'} />
      <Dialog
        open={open}
        onOpenChange={(newOpen) => {
          if (!newOpen) {
            pendingConfirm?.resolve(false);
            setPendingConfirm(null);
          }
          setOpen(newOpen);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认开启子币发射</DialogTitle>
            <DialogDescription>
              剩余可发射次数：{Number(remainingLaunchCount)} 次
              <br />
              再完成 {remainingMintTimes} 次治理激励铸币，可增加1次
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelClick}>
              取消
            </Button>
            <Button onClick={handleConfirmClick}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
