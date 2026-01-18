'use client';

import { useEffect, useState, useMemo } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useAccount, useChainId } from 'wagmi';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { formatTokenAmount, formatUnits, parseUnits } from '@/src/lib/format';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { LaunchInfo } from '@/src/types/love20types';
import { useBalanceOf, useBurnForParentToken, useTotalSupply } from '@/src/hooks/contracts/useLOVE20Token';

import { Token } from '@/src/contexts/TokenContext';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

const Burn: React.FC<{ token: Token | null | undefined; launchInfo: LaunchInfo }> = ({ token, launchInfo }) => {
  const { address: account } = useAccount();
  const chainId = useChainId();
  const router = useRouter();

  // 读取我的代币余额
  const {
    balance: balanceOfToken,
    isPending: isPendingBalanceOfToken,
    error: errorBalanceOfToken,
  } = useBalanceOf(token?.address as `0x${string}`, account as `0x${string}`);

  // 读取我的父币余额
  const {
    balance: balanceOfParentTokenOfMy,
    isPending: isPendingBalanceOfParentTokenOfMy,
    error: errorBalanceOfParentTokenOfMy,
  } = useBalanceOf(token?.parentTokenAddress as `0x${string}`, account as `0x${string}`);

  // 读取底池父币余额
  const {
    balance: balanceOfParentToken,
    isPending: isPendingBalanceOfParentToken,
    error: errorBalanceOfParentToken,
  } = useBalanceOf(token?.parentTokenAddress as `0x${string}`, token?.address as `0x${string}`);

  // 读取token发行总量
  const {
    totalSupply: totalSupplyOfToken,
    isPending: isPendingTotalSupplyOfToken,
    error: errorTotalSupplyOfToken,
  } = useTotalSupply(token?.address as `0x${string}`);

  // 根据当前余额动态创建表单验证规则
  const FormSchema = useMemo(() => {
    return z
      .object({
        burnAmount: z
          .string()
          .nonempty({ message: '请输入销毁数量' })
          .refine((val) => Number(val) > 0, { message: '销毁数量不能为0' }),
      })
      .refine(
        (data) => {
          // 若余额未知，暂不校验超限
          if (!balanceOfToken) return true;
          try {
            return parseUnits(data.burnAmount) ? parseUnits(data.burnAmount) <= balanceOfToken : false;
          } catch {
            return false;
          }
        },
        { message: '销毁数量不能超过您的余额', path: ['burnAmount'] },
      );
  }, [balanceOfToken]);

  // 初始化 React Hook Form，设置 mode: 'onChange' 实现即时校验
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { burnAmount: '' },
    mode: 'onChange',
  });

  // 监听用户输入的销毁数量，并解析成 BigInt
  const burnAmount = form.watch('burnAmount');
  const parsedBurnAmount = useMemo(() => {
    try {
      return burnAmount ? parseUnits(burnAmount) : BigInt(0);
    } catch (e) {
      return BigInt(0);
    }
  }, [burnAmount]);

  // 计算预计可换回的父币数量
  const [expectedParentTokenBalance, setExpectedParentTokenBalance] = useState(BigInt(0));
  useEffect(() => {
    const burnAmt = form.getValues('burnAmount');
    if (totalSupplyOfToken && balanceOfParentToken && burnAmt) {
      const expected = (parseUnits(burnAmt) * balanceOfParentToken) / totalSupplyOfToken;
      setExpectedParentTokenBalance(expected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch('burnAmount'), totalSupplyOfToken, balanceOfParentToken]);

  // 销毁相关逻辑
  const {
    burnForParentToken,
    isPending: isPendingBurn,
    isConfirming: isConfirmingBurn,
    isConfirmed: isConfirmedBurn,
    writeError: errBurn,
  } = useBurnForParentToken(token?.address as `0x${string}`);

  const onBurn = async (data: z.infer<typeof FormSchema>) => {
    try {
      await burnForParentToken(parseUnits(data.burnAmount));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isConfirmedBurn) {
      toast.success('销毁成功');
      setTimeout(() => {
        router.push(`/my?symbol=${token?.symbol}`);
      }, 1000);
    }
  }, [isConfirmedBurn, router, token?.symbol]);

  // "最高"按钮逻辑
  const setMaxAmount = () => {
    form.setValue('burnAmount', formatUnits(balanceOfToken || BigInt(0)));
  };

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorBalanceOfToken) handleContractError(errorBalanceOfToken, 'token');
    if (errorBalanceOfParentToken) handleContractError(errorBalanceOfParentToken, 'token');
    if (errorTotalSupplyOfToken) handleContractError(errorTotalSupplyOfToken, 'token');
    if (errorBalanceOfParentTokenOfMy) handleContractError(errorBalanceOfParentTokenOfMy, 'token');
    if (errBurn) handleContractError(errBurn, 'token');
  }, [
    errorBalanceOfToken,
    errorBalanceOfParentToken,
    errorTotalSupplyOfToken,
    errorBalanceOfParentTokenOfMy,
    errBurn,
    handleContractError,
  ]);

  if (!token || isPendingBalanceOfToken) {
    return <LoadingIcon />;
  }

  return (
    <>
      <div className="p-6">
        <LeftTitle title="换回父币" />
        <div className="stats w-full">
          <div className="stat place-items-center">
            <div className="stat-title text-sm mr-6">父币托底池总量</div>
            <div className="stat-value text-secondary mt-2">
              {formatTokenAmount(balanceOfParentToken || BigInt(0))}
              <span className="text-greyscale-500 font-normal text-sm ml-2">{token.parentTokenSymbol}</span>
            </div>
            <div className="stat-desc text-sm mt-2">
              销毁 {token.symbol}，可从托底池取回 {token.parentTokenSymbol}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="flex items-center text-sm my-0">
                <span className="text-greyscale-400">
                  我的 {token.symbol}:{' '}
                  <span className="text-secondary">{formatTokenAmount(balanceOfToken || BigInt(0))}</span>
                </span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={setMaxAmount}
                  disabled={(balanceOfToken || BigInt(0)) <= BigInt(0) || isPendingBurn || isConfirmingBurn}
                  className="text-secondary"
                >
                  最高
                </Button>
              </div>

              <FormField
                control={form.control}
                name="burnAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={`请输入要销毁的 ${token.symbol} 数量`}
                        disabled={(balanceOfToken || BigInt(0)) <= BigInt(0) || isPendingBurn || isConfirmingBurn}
                        className="!ring-secondary-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center text-sm mt-1 mb-2">
                <span className="text-greyscale-400">
                  预计可取回 <span className="text-secondary">{formatTokenAmount(expectedParentTokenBalance)}</span>{' '}
                  {token.parentTokenSymbol}
                </span>
              </div>

              <div className="flex justify-center">
                <Button
                  className="text-white py-2 rounded-lg"
                  onClick={form.handleSubmit(onBurn)}
                  disabled={isPendingBurn || isConfirmingBurn || isConfirmedBurn}
                >
                  {isPendingBurn
                    ? '提交中...'
                    : isConfirmingBurn
                    ? '确认中...'
                    : isConfirmedBurn
                    ? '交易成功'
                    : `销毁 ${token.symbol}，换回父币`}
                </Button>
              </div>

              <div className="flex items-center justify-center text-sm my-2">
                <span className="text-greyscale-400">
                  我的 {token.parentTokenSymbol}:{' '}
                  <span className="text-secondary">{formatTokenAmount(balanceOfParentTokenOfMy || BigInt(0))}</span>{' '}
                  {token.parentTokenSymbol}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/dex/swap?from=${token.parentTokenSymbol}&to=${
                        token.parentTokenSymbol == process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL
                          ? process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL
                          : process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL
                      }`,
                    )
                  }
                  className="text-secondary ml-2"
                >
                  去兑换
                </Button>
              </div>
            </form>
          </Form>

          <div className="bg-gray-100 text-greyscale-500 rounded-lg p-4 text-sm mt-4">
            <p className="mb-1">计算公式：</p>
            <p>
              所得 {token.parentTokenSymbol} 数量 = 底池 {token.parentTokenSymbol} 总量 * (销毁 {token.symbol} 数量 /{' '}
              {token.symbol} 总发行量)
            </p>
          </div>
        </div>
      </div>

      <LoadingOverlay
        isLoading={isPendingBurn || isConfirmingBurn}
        text={isPendingBurn ? '提交交易...' : '确认交易...'}
      />
    </>
  );
};

export default Burn;
