'use client';

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useAccount, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

// my funcs
import { formatTokenAmount, formatUnits, parseUnits } from '@/src/lib/format';

// my hooks
import { useDeposit } from '@/src/hooks/contracts/useWETH';
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
const getDepositFormSchema = (balance: bigint) =>
  z.object({
    depositAmount: z
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

type DepositFormValues = z.infer<ReturnType<typeof getDepositFormSchema>>;

const Deposit: React.FC = () => {
  const router = useRouter();
  const { address: account } = useAccount();
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
    deposit,
    isPending: isPendingDeposit,
    isConfirming: isConfirmingDeposit,
    isConfirmed: isConfirmedDeposit,
    writeError: errDeposit,
  } = useDeposit();

  // 2. 创建 hook form 实例，并传入当前余额
  const form = useForm<DepositFormValues>({
    resolver: zodResolver(getDepositFormSchema(balance?.value || BigInt(0))),
    defaultValues: {
      depositAmount: '',
    },
    mode: 'onChange',
  });

  // 3. 提交时调用 deposit
  async function onSubmit(data: DepositFormValues) {
    try {
      await deposit(parseUnits(data.depositAmount));
    } catch (error) {
      console.error(error);
    }
  }

  // 兑换成功后回调
  const { setError } = useError();
  useEffect(() => {
    if (isConfirmedDeposit) {
      toast.success('兑换成功');
      setError(null);

      // 2秒后刷新/返回
      setTimeout(() => {
        // 如果发射未结束,跳到申购页;否则,跳到质押lp页
        if (token && !token.hasEnded) {
          if (token.parentTokenSymbol === process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL) {
            window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/launch/contribute/?symbol=${
              token.symbol
            }`;
          } else {
            router.back();
          }
        } else if (token && !token.initialStakeRound) {
          window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/stake/stakelp/?symbol=${
            token.symbol
          }&first=true`;
        } else {
          router.back();
        }
      }, 2000);
    }
  }, [isConfirmedDeposit, router]);

  // 设置最大金额
  const setMaxAmount = () => {
    // 注意这里需要先将 balance?.value 转字符串
    // 再用 formatUnits 转成人类可读
    form.setValue('depositAmount', formatUnits(balance?.value || BigInt(0)));
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
    if (errDeposit) {
      handleContractError(errDeposit, 'token');
    }
  }, [errBalance, errorBalanceOfERC20Token, errDeposit, handleContractError]);

  if (isLoadingBalance || isPendingBalanceOfERC20Token) {
    return <LoadingIcon />;
  }

  return (
    <>
      <div className="p-6 pt-0">
        <div className="mb-4 flex justify-between items-center">
          <LeftTitle title={`存入${balance?.symbol} 换取 ${process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL}`} />
          <Button variant="link" className="text-secondary border-secondary m-0 p-0" asChild>
            <Link href={`/dex/withdraw?symbol=${token?.symbol}`}>提现 {balance?.symbol}</Link>
          </Button>
        </div>

        {/* 4. 使用 Form 组件包裹并渲染  */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="depositAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>存入数量：</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`填写 ${balance?.symbol ?? ''} 数量`}
                      type="number"
                      disabled={isPendingDeposit || isConfirmingDeposit}
                      className="!ring-secondary-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription className="flex items-center justify-between">
                    <span>
                      共 {isLoadingBalance ? <LoadingIcon /> : formatTokenAmount(balance?.value || BigInt(0))}{' '}
                      {balance?.symbol}
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={setMaxAmount}
                      className="text-secondary p-0 ml-2"
                      disabled={isLoadingBalance || isPendingDeposit || isConfirmingDeposit}
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
                disabled={isPendingDeposit || isConfirmingDeposit || isConfirmedDeposit}
              >
                {isPendingDeposit
                  ? '存入中...'
                  : isConfirmingDeposit
                  ? '确认中...'
                  : isConfirmedDeposit
                  ? '存入成功'
                  : '存入'}
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
      <div className="bg-gray-100 text-greyscale-500 rounded-lg p-4 text-sm mt-0 m-6">
        <p className="mb-1">说明：</p>
        <p>
          1. {process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL} 是用 WETH9 协议，将 {balance?.symbol} 包装的符合 ERC20
          协议的代币
        </p>
        <p>
          2. 存入的 {balance?.symbol} 会被协议锁定，随时可以通过提现功能，将{' '}
          {process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL} 转回 {balance?.symbol}
        </p>
      </div>
      <LoadingOverlay
        isLoading={isPendingDeposit || isConfirmingDeposit}
        text={isPendingDeposit ? '提交交易...' : '确认交易...'}
      />
    </>
  );
};

export default Deposit;
