'use client';

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useAccount, useBalance, useChainId } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'react-hot-toast';

// my funcs
import { formatTokenAmount, formatUnits, parseUnits } from '@/src/lib/format';

// my hooks
import { useWithdraw } from '@/src/hooks/contracts/useWETH';
import { useBalanceOf } from '@/src/hooks/contracts/useLOVE20Token';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { useError } from '@/src/contexts/ErrorContext';

// my context
import { TokenContext } from '@/src/contexts/TokenContext';

// my components

import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

// 1. 修改为函数，接收 balance 作为参数
const getWithdrawFormSchema = (balance: bigint) =>
  z.object({
    withdrawAmount: z
      .string()
      .nonempty('请输入兑换数量')
      .refine(
        (val) => {
          try {
            const amount = parseUnits(val);
            return amount > BigInt(0) && amount <= balance;
          } catch (e) {
            return false;
          }
        },
        {
          message: '兑换数量必须大于0且不超过您的余额',
        },
      ),
  });

type WithdrawFormValues = z.infer<ReturnType<typeof getWithdrawFormSchema>>;

const Withdraw: React.FC = () => {
  const router = useRouter();
  const { address: account } = useAccount();
  const chainId = useChainId();
  const { token } = useContext(TokenContext) || {};

  // 读取余额
  const {
    data: balance,
    error: errBalance,
    isLoading: isLoadingBalance,
  } = useBalance({
    address: account,
  });

  // 读取我的代币余额
  const {
    balance: balanceOfERC20Token,
    isPending: isPendingBalanceOfERC20Token,
    error: errorBalanceOfERC20Token,
  } = useBalanceOf(
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN as `0x${string}`,
    account as `0x${string}`,
  );

  // 兑换
  const {
    withdraw,
    isPending: isPendingWithdraw,
    isConfirming: isConfirmingWithdraw,
    isConfirmed: isConfirmedWithdraw,
    writeError: errWithdraw,
  } = useWithdraw();

  // 2. 创建 hook form 实例，并传入当前余额
  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(getWithdrawFormSchema(balanceOfERC20Token || BigInt(0))),
    defaultValues: {
      withdrawAmount: '',
    },
    mode: 'onChange',
  });

  // 3. 提交
  async function onSubmit(data: WithdrawFormValues) {
    try {
      await withdraw(parseUnits(data.withdrawAmount));
    } catch (error) {
      console.error(error);
    }
  }

  // 兑换成功后回调
  const { setError } = useError();
  useEffect(() => {
    if (isConfirmedWithdraw) {
      toast.success('兑换成功');
      setError(null);

      // 2秒后刷新/返回
      setTimeout(() => {
        // 如果发射未结束,跳到申购页;否则,跳到质押lp页
        if (token && !token.hasEnded) {
          window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/launch/contribute/?symbol=${token.symbol}`;
        } else if (token && !token.initialStakeRound) {
          window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/gov/stakelp/?symbol=${
            token.symbol
          }&first=true`;
        } else {
          router.back();
        }
      }, 2000);
    }
  }, [isConfirmedWithdraw, router]);

  // 设置最大金额
  const setMaxAmount = () => {
    // 注意这里需要先将 balance?.value 转字符串
    // 再用 formatUnits 转成人类可读
    form.setValue('withdrawAmount', formatUnits(balanceOfERC20Token || BigInt(0)));
  };

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errBalance) {
      handleContractError(errBalance, 'token');
    }
    if (errorBalanceOfERC20Token) {
      handleContractError(errorBalanceOfERC20Token, 'token');
    }
    if (errWithdraw) {
      handleContractError(errWithdraw, 'token');
    }
  }, [errBalance, errorBalanceOfERC20Token, errWithdraw, handleContractError]);

  if (isLoadingBalance || isPendingBalanceOfERC20Token) {
    return <LoadingIcon />;
  }

  return (
    <>
      <div className="py-6 px-2">
        <div className="mb-4 flex items-center space-x-2">
          <LeftTitle title={`${process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL} 兑换 ${balance?.symbol}`} />
        </div>

        {/* 4. 使用 Form 组件包裹并渲染  */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="withdrawAmount"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder={`填写 ${process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL ?? ''} 数量`}
                      type="number"
                      disabled={isPendingWithdraw || isConfirmingWithdraw}
                      className="!ring-secondary-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription className="flex items-center justify-between">
                    <span>
                      共 {isLoadingBalance ? <LoadingIcon /> : formatTokenAmount(balanceOfERC20Token || BigInt(0))}{' '}
                      {process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL}
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={setMaxAmount}
                      className="text-secondary p-0 ml-2"
                      disabled={isLoadingBalance || isPendingWithdraw || isConfirmingWithdraw}
                    >
                      全部
                    </Button>
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* 提交按钮 */}
            <div className="flex justify-center">
              <Button
                type="submit"
                className="w-1/2 text-white py-2 rounded-lg"
                disabled={isPendingWithdraw || isConfirmingWithdraw || isConfirmedWithdraw}
              >
                {isPendingWithdraw
                  ? '提现中...'
                  : isConfirmingWithdraw
                  ? '确认中...'
                  : isConfirmedWithdraw
                  ? '提现成功'
                  : '提现'}
              </Button>
            </div>
            <div className="flex justify-center mb-2">
              <span className="text-sm">
                兑换比例：1 {process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL} = 1 {balance?.symbol}
              </span>
            </div>
          </form>
        </Form>
      </div>

      <LoadingOverlay
        isLoading={isPendingWithdraw || isConfirmingWithdraw}
        text={isPendingWithdraw ? '提交交易...' : '确认交易...'}
      />
    </>
  );
};

export default Withdraw;
