/**
 * 铸造链群 NFT 组件
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

// UI & shadcn components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// my hooks
import { formatTokenAmount } from '@/src/lib/format';
import { useContractError } from '@/src/errors/useContractError';
import { useError } from '@/src/contexts/ErrorContext';
import { useBalanceOf, useAllowance, useApprove } from '@/src/hooks/contracts/useLOVE20Token';
import { useMint, useMaxGroupNameLength } from '@/src/hooks/extension/base/contracts/useLOVE20Group';
import { useGroupNameValidation } from '@/src/hooks/extension/base/composite/useGroupNameValidation';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

const FIRST_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_FIRST_TOKEN as `0x${string}`;
const GROUP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP as `0x${string}`;
const FIRST_TOKEN_SYMBOL = process.env.NEXT_PUBLIC_FIRST_TOKEN_SYMBOL as string;

// 定义表单验证 Schema
const getFormSchema = (balance: bigint) =>
  z.object({
    groupName: z
      .string()
      .nonempty({ message: '请输入群名称' })
      .refine((val) => val.trim().length > 0, {
        message: '群名称不能只包含空白字符',
      }),
  });

export default function MintGroup() {
  const { address: account, isConnected } = useAccount();
  const router = useRouter();
  const { setError } = useError();

  // 获取最大名称长度
  const { maxGroupNameLength } = useMaxGroupNameLength();

  // 获取 LOVE20 代币余额
  const {
    balance,
    isPending: isBalancePending,
    error: balanceError,
  } = useBalanceOf(FIRST_TOKEN_ADDRESS, account as `0x${string}`);

  // 初始化表单
  const form = useForm<z.infer<ReturnType<typeof getFormSchema>>>({
    resolver: zodResolver(getFormSchema(balance || BigInt(0))),
    defaultValues: {
      groupName: '',
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const groupName = form.watch('groupName');

  // 验证群名称并获取铸造成本
  const {
    isValid,
    validationError,
    isGroupNameUsed,
    mintCost,
    isPending: isValidationPending,
  } = useGroupNameValidation({
    groupName,
    maxGroupNameLength: maxGroupNameLength ? Number(maxGroupNameLength) : 100,
    enabled: !!groupName,
  });

  // 显示验证结果
  useEffect(() => {
    if (groupName && !isValidationPending && validationError) {
      form.setError('groupName', { message: validationError });
    } else if (groupName && !isValidationPending && isValid) {
      form.clearErrors('groupName');
    }
  }, [groupName, isValid, validationError, isValidationPending, form]);

  // 授权相关
  const {
    approve,
    isPending: isPendingApprove,
    isConfirming: isConfirmingApprove,
    isConfirmed: isConfirmedApprove,
    writeError: errApprove,
  } = useApprove(FIRST_TOKEN_ADDRESS);

  const [isTokenApproved, setIsTokenApproved] = useState(false);

  // 获取已授权额度
  const {
    allowance,
    isPending: isPendingAllowance,
    error: errAllowance,
    refetch: refetchAllowance,
  } = useAllowance(FIRST_TOKEN_ADDRESS, account as `0x${string}`, GROUP_CONTRACT_ADDRESS);

  // 授权交易确认后，设置状态
  const hasHandledApproveSuccessRef = useRef(false);

  // 当开始新的授权交易时，重置成功标记
  useEffect(() => {
    if (isPendingApprove) {
      hasHandledApproveSuccessRef.current = false;
    }
  }, [isPendingApprove]);

  useEffect(() => {
    if (isConfirmedApprove && !hasHandledApproveSuccessRef.current) {
      hasHandledApproveSuccessRef.current = true;
      setIsTokenApproved(true);
      toast.success('授权成功');
      // 授权成功后，刷新授权额度
      refetchAllowance();
    }
  }, [isConfirmedApprove, refetchAllowance]);

  // 根据铸造成本和已授权额度，判断是否满足授权
  useEffect(() => {
    if (mintCost && mintCost > BigInt(0) && allowance && allowance >= mintCost) {
      setIsTokenApproved(true);
    } else {
      setIsTokenApproved(false);
    }
  }, [mintCost, allowance]);

  const onApprove = async () => {
    if (!mintCost || mintCost <= BigInt(0)) {
      toast.error('请先输入有效的群名称');
      return;
    }
    try {
      // 授权 mintCost 的 100.1%，避免铸造价格变化
      const approveAmount = (mintCost * BigInt(1001)) / BigInt(1000);
      await approve(GROUP_CONTRACT_ADDRESS, approveAmount);
    } catch (error) {
      console.error(error);
    }
  };

  // 铸造相关
  const {
    mint,
    isPending: isPendingMint,
    isConfirming: isConfirmingMint,
    isConfirmed: isConfirmedMint,
    writeError: errMint,
  } = useMint();

  const onMint = async (data: z.infer<ReturnType<typeof getFormSchema>>) => {
    if (!isValid) {
      toast.error(validationError || '群名称不合法');
      return;
    }

    if (!isTokenApproved) {
      toast.error('请先授权');
      return;
    }

    if (!mintCost || mintCost <= BigInt(0)) {
      toast.error('无法获取铸造成本');
      return;
    }

    if (balance && balance < mintCost) {
      toast.error(`${FIRST_TOKEN_SYMBOL} 代币余额不足`);
      return;
    }

    try {
      await mint(data.groupName.trim());
    } catch (error) {
      console.error(error);
    }
  };

  // 使用 ref 记录是否已经处理过成功状态，避免无限循环
  const hasHandledMintSuccessRef = useRef(false);

  // 当开始新的铸造交易时，重置成功标记
  useEffect(() => {
    if (isPendingMint) {
      hasHandledMintSuccessRef.current = false;
    }
  }, [isPendingMint]);

  useEffect(() => {
    if (isConfirmedMint && !hasHandledMintSuccessRef.current) {
      hasHandledMintSuccessRef.current = true;
      toast.success('铸造成功！');
      // 2秒后跳转到"我的"页面
      setTimeout(() => {
        router.push('/group/groupids?tab=my');
      }, 2000);
    }
  }, [isConfirmedMint, router]);

  // 余额不足错误提示
  useEffect(() => {
    if (balance === undefined && !isBalancePending && isValid && mintCost !== undefined) {
      setError({ name: '余额不足', message: `${FIRST_TOKEN_SYMBOL} 不足` });
    } else if (balance !== undefined && mintCost !== undefined && balance >= mintCost) {
      // 当余额充足时，清除余额不足错误
      setError(null);
    }
  }, [balance, isBalancePending, isValid, mintCost, setError, FIRST_TOKEN_SYMBOL]);

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (balanceError) {
      handleError(balanceError);
    }
    if (errApprove) {
      handleError(errApprove);
    }
    if (errAllowance) {
      handleError(errAllowance);
    }
    if (errMint) {
      handleError(errMint);
    }
  }, [balanceError, errApprove, errAllowance, errMint, handleError]);

  // 控制按钮文案
  const hasStartedApproving = isPendingApprove || isConfirmingApprove;

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center p-4 mt-4">
        <div className="text-center mb-4 text-greyscale-500">没有链接钱包，请先连接钱包</div>
      </div>
    );
  }

  if (isBalancePending) {
    return <LoadingIcon />;
  }

  return (
    <>
      <div className="px-4 mt-4">
        <LeftTitle title="铸造链群NFT" />

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <FormField
              control={form.control}
              name="groupName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel></FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="请输入NFT名称"
                      disabled={hasStartedApproving || isPendingMint || isConfirmingMint}
                      className="!ring-secondary-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  {maxGroupNameLength && (
                    <>
                      <div className="text-xs text-greyscale-400 mt-1">
                        最大长度：{maxGroupNameLength.toString()} 字节
                      </div>
                      <div className="text-xs text-greyscale-400 mt-1">
                        (其中英文或数字一个占1个字节，中文一个占3个字节)
                      </div>
                    </>
                  )}
                </FormItem>
              )}
            />

            {/* 显示验证状态和铸造成本 */}
            {groupName && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">链群名称:</span>
                  {isValidationPending ? (
                    <span className="text-gray-400">检查中...</span>
                  ) : isValid ? (
                    <span className="text-green-600 font-medium">✓ 可用</span>
                  ) : (
                    <span className="text-red-600 font-medium">✗ {validationError}</span>
                  )}
                </div>

                {isValid && mintCost !== undefined && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">铸造成本:</span>
                      <span className="font-mono text-secondary font-medium">
                        {formatTokenAmount(mintCost)} {FIRST_TOKEN_SYMBOL}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">滑点:</span>
                      <span className="font-mono text-secondary font-medium">0.1%</span>
                    </div>
                  </>
                )}

                {balance !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">我的余额:</span>
                    <span className="font-mono text-greyscale-600">
                      {formatTokenAmount(balance)} {FIRST_TOKEN_SYMBOL}
                    </span>
                  </div>
                )}

                {/* 余额不足提示 */}
                {isValid && mintCost !== undefined && balance !== undefined && balance < mintCost && (
                  <div className="text-xs text-red-600 mt-1">
                    余额不足，还需要 {formatTokenAmount(mintCost - balance)} {FIRST_TOKEN_SYMBOL}
                  </div>
                )}
              </div>
            )}

            {/* 授权和铸造按钮 */}
            <div className="flex space-x-4 w-full pt-2">
              <Button
                className="w-1/2"
                onClick={onApprove}
                disabled={
                  isPendingAllowance ||
                  isPendingApprove ||
                  isConfirmingApprove ||
                  isTokenApproved ||
                  !isValid ||
                  !mintCost ||
                  mintCost <= BigInt(0) ||
                  (balance === undefined && !isBalancePending) ||
                  (balance !== undefined && balance < mintCost)
                }
              >
                {isPendingAllowance ? (
                  <Loader2 className="animate-spin" />
                ) : isPendingApprove ? (
                  '1.授权中...'
                ) : isConfirmingApprove ? (
                  '1.确认中...'
                ) : isTokenApproved ? (
                  '1.已授权'
                ) : (
                  '1.授权'
                )}
              </Button>

              <Button
                className="w-1/2 text-white py-2 rounded-lg"
                onClick={form.handleSubmit(onMint)}
                disabled={
                  !isTokenApproved ||
                  isPendingMint ||
                  isConfirmingMint ||
                  isConfirmedMint ||
                  (balance === undefined && !isBalancePending) ||
                  (balance !== undefined && balance < (mintCost || BigInt(0)))
                }
              >
                {isPendingMint
                  ? '2.铸造中...'
                  : isConfirmingMint
                  ? '2.确认中...'
                  : isConfirmedMint
                  ? '2.铸造成功'
                  : '2.铸造'}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <LoadingOverlay
        isLoading={isPendingMint || isConfirmingMint || isPendingApprove || isConfirmingApprove}
        text={isPendingMint || isPendingApprove ? '提交交易...' : '确认交易...'}
      />
    </>
  );
}
