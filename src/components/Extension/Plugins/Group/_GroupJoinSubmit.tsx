// components/Extension/Plugins/Group/_GroupJoinSubmit.tsx
// 第二步：确认加入链群

'use client';

import React, { useContext, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

// ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';

// my hooks
import { useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite';
import { useJoin } from '@/src/hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupAction';
import { useApprove, useBalanceOf, useAllowance } from '@/src/hooks/contracts/useLOVE20Token';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatTokenAmount, formatUnits, parseUnits } from '@/src/lib/format';

// contexts / types
import { TokenContext } from '@/src/contexts/TokenContext';
import { ActionInfo } from '@/src/types/love20types';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import LeftTitle from '@/src/components/Common/LeftTitle';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

interface FormValues {
  joinAmount: string;
}

interface GroupJoinSubmitProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupId: bigint;
}

const _GroupJoinSubmit: React.FC<GroupJoinSubmitProps> = ({ actionId, actionInfo, extensionAddress, groupId }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取链群详情
  const {
    groupDetail,
    isPending: isPendingDetail,
    error: errorDetail,
  } = useExtensionGroupDetail({
    extensionAddress,
    groupId,
  });

  // 获取代币余额
  const { balance, error: errorBalance } = useBalanceOf(
    token?.address as `0x${string}`,
    account as `0x${string}`,
    !!token?.address && !!account,
  );

  // 获取已授权数量
  const {
    allowance,
    isPending: isPendingAllowance,
    error: errorAllowance,
  } = useAllowance(
    token?.address as `0x${string}`,
    account as `0x${string}`,
    extensionAddress,
    !!token?.address && !!account,
  );

  // 授权状态
  const [isTokenApproved, setIsTokenApproved] = useState(false);

  // 动态构造 zod schema
  const formSchema = z.object({
    joinAmount: z
      .string()
      .refine((val) => val.trim() === '' || /^[0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?$/.test(val.trim()), {
        message: '请输入合法的数字格式',
      })
      .transform((val) => (val.trim() === '' ? '0' : val.trim().replace(/,/g, '')))
      .refine((val) => val !== '0', { message: '参与代币数不能为 0' })
      .refine(
        (val) => {
          const inputVal = parseUnits(val);
          return inputVal !== null && balance !== undefined && inputVal <= balance;
        },
        { message: '您的代币余额不足' },
      )
      .refine(
        (val) => {
          if (!groupDetail) return true;
          const inputVal = parseUnits(val);
          return inputVal !== null && inputVal >= groupDetail.actualMinJoinAmount;
        },
        {
          message: `参与代币数不能小于最小值 ${
            groupDetail ? formatTokenAmount(groupDetail.actualMinJoinAmount, 2) : '0'
          }`,
        },
      )
      .refine(
        (val) => {
          if (!groupDetail) return true;
          const inputVal = parseUnits(val);
          return inputVal !== null && inputVal <= groupDetail.actualMaxJoinAmount;
        },
        {
          message: `参与代币数不能大于最大值 ${
            groupDetail ? formatTokenAmount(groupDetail.actualMaxJoinAmount, 2) : '0'
          }`,
        },
      ),
  });

  // 表单实例
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      joinAmount: '',
    },
    mode: 'onChange',
  });

  // 授权
  const {
    approve,
    isPending: isPendingApprove,
    isConfirming: isConfirmingApprove,
    isConfirmed: isConfirmedApprove,
    writeError: errorApprove,
  } = useApprove(token?.address as `0x${string}`);

  const approveButtonRef = useRef<HTMLButtonElement>(null);
  const prevIsPendingAllowanceRef = useRef(isPendingAllowance);

  useEffect(() => {
    if (prevIsPendingAllowanceRef.current && !isPendingAllowance && approveButtonRef.current) {
      approveButtonRef.current.blur();
    }
    prevIsPendingAllowanceRef.current = isPendingAllowance;
  }, [isPendingAllowance]);

  async function handleApprove(values: FormValues) {
    const joinAmount = parseUnits(values.joinAmount) ?? BigInt(0);
    if (joinAmount === BigInt(0)) {
      toast.error('当前无需授权');
      return;
    }

    try {
      await approve(extensionAddress, joinAmount);
    } catch (error) {
      console.error('Approve failed', error);
    }
  }

  useEffect(() => {
    if (isConfirmedApprove) {
      setIsTokenApproved(true);
      toast.success('授权代币成功');
    }
  }, [isConfirmedApprove]);

  // 监听用户输入的加入数量及链上返回的授权额度判断是否已授权
  const joinAmount = form.watch('joinAmount');
  const parsedJoinAmount = parseUnits(joinAmount || '0') ?? BigInt(0);

  useEffect(() => {
    if (parsedJoinAmount > BigInt(0) && allowance && allowance > BigInt(0) && allowance >= parsedJoinAmount) {
      setIsTokenApproved(true);
    } else {
      setIsTokenApproved(false);
    }
  }, [parsedJoinAmount, isPendingAllowance, allowance]);

  // 加入提交
  const {
    join,
    isPending: isPendingJoin,
    isConfirming: isConfirmingJoin,
    isConfirmed: isConfirmedJoin,
    writeError: errorJoin,
  } = useJoin(extensionAddress);

  async function handleJoin(values: FormValues) {
    try {
      await join(groupId, parseUnits(values.joinAmount) ?? BigInt(0));
    } catch (error) {
      console.error('Join failed', error);
    }
  }

  // 加入成功后跳转到第三步
  useEffect(() => {
    if (isConfirmedJoin) {
      toast.success('加入链群成功');
      // 跳转到第三步：填写验证信息
      setTimeout(() => {
        router.push(
          `/acting/join?tab=update_verification_info&groupId=${groupId.toString()}&id=${actionId.toString()}&symbol=${
            token?.symbol
          }`,
        );
      }, 1000);
    }
  }, [isConfirmedJoin, router, groupId, actionId, token?.symbol]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorDetail) handleContractError(errorDetail, 'extension');
    if (errorBalance) handleContractError(errorBalance, 'token');
    if (errorAllowance) handleContractError(errorAllowance, 'token');
    if (errorApprove) handleContractError(errorApprove, 'token');
    if (errorJoin) handleContractError(errorJoin, 'extension');
  }, [errorDetail, errorBalance, errorAllowance, errorApprove, errorJoin, handleContractError]);

  if (isPendingDetail) {
    return (
      <div className="flex flex-col items-center px-4 pt-6">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载链群信息...</p>
      </div>
    );
  }

  if (!groupDetail) {
    return (
      <div className="flex flex-col items-center px-6 pt-6">
        <p className="text-red-500">链群信息加载失败</p>
      </div>
    );
  }

  return (
    <>
      <div className="px-6 pt-6 pb-2">
        <LeftTitle title="加入链群" />

        {/* 行动信息 */}
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">行动：</span>
            <span className="text-gray-800">
              #{actionId.toString()} {actionInfo.body.title}
            </span>
          </div>

          {/* 链群信息 */}
          <div className="text-sm text-gray-600 flex items-center justify-between">
            <div>
              <span className="font-medium">链群：</span>
              <span className="text-gray-800">
                #{groupDetail.groupId.toString()} {groupDetail.groupName}
              </span>
            </div>
            <Button
              variant="link"
              size="sm"
              onClick={() => router.push(`/acting/join?id=${actionId}&symbol=${token?.symbol}`)}
              className="text-secondary p-0 h-auto"
            >
              切换链群
            </Button>
          </div>

          {/* 服务者 */}
          <div className="text-sm text-gray-600 mt-2 flex items-center gap-2">
            <span className="font-medium">服务者：</span>
            <AddressWithCopyButton address={groupDetail.owner} showCopyButton={true} />
          </div>
        </div>

        {/* 表单 */}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4 pt-4">
            {/* 参与代币数 */}
            <FormField
              control={form.control}
              name="joinAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-greyscale-500 font-normal">参与代币数：</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`请输入参与代币数量`}
                      type="number"
                      disabled={!balance || balance <= BigInt(0)}
                      className="!ring-secondary-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500">
                        范围：{formatTokenAmount(groupDetail.actualMinJoinAmount, 2)} {token?.symbol} ~{' '}
                        {formatTokenAmount(groupDetail.actualMaxJoinAmount, 2)} {token?.symbol}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => {
                        if (balance && balance > BigInt(0) && groupDetail) {
                          const maxAmount =
                            balance < groupDetail.actualMaxJoinAmount ? balance : groupDetail.actualMaxJoinAmount;
                          form.setValue('joinAmount', formatUnits(maxAmount));
                        }
                      }}
                      className="text-secondary p-0 h-auto"
                      disabled={!balance || balance <= BigInt(0)}
                    >
                      最高
                    </Button>
                  </FormDescription>
                  <FormDescription>
                    <span>
                      余额：<span className="text-secondary">{formatTokenAmount(balance || BigInt(0), 4)}</span>{' '}
                      {token?.symbol}
                    </span>
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* 操作按钮 */}
            <div className="flex justify-center space-x-4 pt-2">
              <Button
                ref={approveButtonRef}
                className="w-1/2"
                disabled={isPendingAllowance || isPendingApprove || isConfirmingApprove || isTokenApproved}
                type="button"
                onClick={() => {
                  form.handleSubmit((values) => handleApprove(values))();
                }}
              >
                {isPendingAllowance ? (
                  <Loader2 className="animate-spin" />
                ) : isPendingApprove ? (
                  '1.提交中...'
                ) : isConfirmingApprove ? (
                  '1.确认中...'
                ) : isTokenApproved ? (
                  `1.${token?.symbol}已授权`
                ) : (
                  `1.授权${token?.symbol}`
                )}
              </Button>

              <Button
                className="w-1/2"
                disabled={!isTokenApproved || isPendingJoin || isConfirmingJoin || isConfirmedJoin}
                type="button"
                onClick={() => {
                  form.handleSubmit((values) => handleJoin(values))();
                }}
              >
                {isPendingJoin
                  ? '2.提交中...'
                  : isConfirmingJoin
                  ? '2.确认中...'
                  : isConfirmedJoin
                  ? '2.已加入'
                  : '2.加入'}
              </Button>
            </div>
          </form>
        </Form>

        {/* 提示信息 */}
        <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 温馨提示</div>
          <div className="space-y-1 text-gray-600">
            <div>• 加入后需要填写验证信息（如果行动需要）</div>
            <div>• 您的激励将基于链群服务者的验证打分</div>
            <div>• 可以随时取回参与的代币</div>
          </div>
        </div>
      </div>

      <LoadingOverlay
        isLoading={isPendingApprove || isConfirmingApprove || isPendingJoin || isConfirmingJoin}
        text={isPendingApprove || isPendingJoin ? '提交交易...' : '确认交易...'}
      />
    </>
  );
};

export default _GroupJoinSubmit;
