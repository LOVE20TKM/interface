// components/Extension/Plugins/Group/_GroupOPUpdate.tsx
// 更新链群信息操作

'use client';

// React
import React, { useContext, useEffect, useMemo } from 'react';

// Next.js
import { useRouter } from 'next/router';

// 第三方库
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// UI 组件
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useExtensionActionParam, useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite';
import {
  useUpdateGroupInfo,
  useMaxVerifyCapacityByOwner,
} from '@/src/hooks/extension/plugins/group/contracts/useLOVE20GroupManager';
import { useAccount } from 'wagmi';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';
import { formatTokenAmount, parseUnits } from '@/src/lib/format';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import _GroupActionTips from './_GroupActionTips';

function safeParseUnits(val: string | undefined): bigint {
  if (!val) return BigInt(0);
  return parseUnits(val);
}

interface GroupOPUpdateProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupId: bigint;
}

const _GroupOPUpdate: React.FC<GroupOPUpdateProps> = ({ actionId, actionInfo, extensionAddress, groupId }) => {
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
    actionId,
    groupId,
  });

  // 获取扩展协议参数（用于获取行动的最小/最大参与量）
  const {
    params: actionParams,
    isPending: isPendingParams,
    error: errorParams,
  } = useExtensionActionParam({ actionId, extensionAddress });

  // 获取服务者的最大容量上限
  const {
    maxVerifyCapacity,
    isPending: isPendingMaxCapacity,
    error: errorMaxCapacity,
  } = useMaxVerifyCapacityByOwner(token?.address as `0x${string}`, actionId, account as `0x${string}`);

  // 表单验证
  const formSchema = useMemo(
    () =>
      z
        .object({
          maxCapacity: z
            .string()
            .min(1, { message: '请输入链群容量上限' })
            .refine(
              (val) => {
                const amount = parseFloat(val);
                return !isNaN(amount) && amount > 0;
              },
              { message: '请输入有效的容量上限' },
            ),
          description: z.string().max(500, { message: '描述不能超过500字' }),
          minJoinAmount: z
            .string()
            .refine(
              (val) => {
                if (!val || val === '0') return true;
                const amount = parseFloat(val);
                return !isNaN(amount) && amount >= 0;
              },
              { message: '请输入有效的代币数' },
            )
            .superRefine((val, ctx) => {
              if (!val || val === '0') return;
              const amount = parseUnits(val);
              if (amount > BigInt(0)) {
                // 不能大于行动的单个行动者最大参与代币数
                if (actionParams?.joinMaxAmount && amount > actionParams.joinMaxAmount) {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `不能大于全局最大参与量 ${formatTokenAmount(actionParams.joinMaxAmount, 2)} ${
                      token?.symbol || ''
                    }`,
                  });
                }
              }
            }),
          maxJoinAmount: z
            .string()
            .refine(
              (val) => {
                if (!val || val === '0') return true;
                const amount = parseFloat(val);
                return !isNaN(amount) && amount >= 0;
              },
              { message: '请输入有效的代币数' },
            )
            .superRefine((val, ctx) => {
              if (!val || val === '0') return;
              const amount = parseUnits(val);
              if (amount > BigInt(0)) {
                // 不能大于行动的单个行动者最大参与代币数
                if (actionParams?.joinMaxAmount && amount > actionParams.joinMaxAmount) {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `不能大于全局最大参与量 ${formatTokenAmount(actionParams.joinMaxAmount, 2)} ${
                      token?.symbol || ''
                    }`,
                  });
                }
              }
            }),
        })
        .refine(
          (data) => {
            // 交叉验证：最大参与量不能小于最小参与量
            const minAmount = parseUnits(data.minJoinAmount || '0');
            const maxAmount = parseUnits(data.maxJoinAmount || '0');
            return !(minAmount > BigInt(0) && maxAmount > BigInt(0) && maxAmount < minAmount);
          },
          {
            message: `最大参与量不能小于最小参与量`,
            path: ['maxJoinAmount'], // 错误显示在 maxJoinAmount 字段
          },
        ),
    [actionParams, token],
  );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      maxCapacity: '',
      description: '',
      minJoinAmount: '',
      maxJoinAmount: '',
    },
    mode: 'onChange',
  });

  // 当链群详情加载完成后，填充表单
  useEffect(() => {
    if (groupDetail) {
      form.reset({
        maxCapacity:
          groupDetail.maxCapacity > BigInt(0) ? formatTokenAmount(groupDetail.maxCapacity, token?.decimals || 18) : '',
        description: groupDetail.description || '',
        minJoinAmount:
          groupDetail.minJoinAmount > BigInt(0)
            ? formatTokenAmount(groupDetail.minJoinAmount, token?.decimals || 18)
            : '',
        maxJoinAmount:
          groupDetail.maxJoinAmount > BigInt(0)
            ? formatTokenAmount(groupDetail.maxJoinAmount, token?.decimals || 18)
            : '',
      });
    }
  }, [groupDetail, form, token?.decimals]);

  // 更新链群信息
  const {
    updateGroupInfo,
    isPending: isPendingUpdate,
    isConfirming: isConfirmingUpdate,
    isConfirmed: isConfirmedUpdate,
    writeError: errorUpdate,
  } = useUpdateGroupInfo();

  async function handleUpdate(values: FormValues) {
    if (!actionParams) {
      toast.error('扩展协议参数未加载完成');
      return;
    }

    // 转换参数为 BigInt（formSchema 已经完成验证）
    const maxCapacityBigInt = values.maxCapacity ? parseUnits(values.maxCapacity) : BigInt(0);
    const minJoinAmountBigInt = values.minJoinAmount ? parseUnits(values.minJoinAmount) : BigInt(0);
    const maxJoinAmountBigInt = values.maxJoinAmount ? parseUnits(values.maxJoinAmount) : BigInt(0);

    try {
      await updateGroupInfo(
        token?.address as `0x${string}`,
        actionId,
        groupId,
        values.description,
        maxCapacityBigInt,
        minJoinAmountBigInt,
        maxJoinAmountBigInt,
        BigInt(0),
      );
    } catch (error) {
      console.error('Update group failed', error);
    }
  }

  useEffect(() => {
    if (isConfirmedUpdate) {
      toast.success('链群信息更新成功');
      setTimeout(() => {
        router.back();
      }, 1500);
    }
  }, [isConfirmedUpdate, router]);

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorDetail) handleError(errorDetail);
    if (errorParams) handleError(errorParams);
    if (errorMaxCapacity) handleError(errorMaxCapacity);
    if (errorUpdate) handleError(errorUpdate);
  }, [errorDetail, errorParams, errorMaxCapacity, errorUpdate, handleError]);

  if (isPendingDetail || isPendingParams || isPendingMaxCapacity) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载参数中...</p>
      </div>
    );
  }

  if (!groupDetail || !actionParams) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">未找到扩展参数</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <LeftTitle title="更新链群信息" />
        </div>

        {/* 表单 */}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* 链群容量上限 */}
            <FormField
              control={form.control}
              name="maxCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>链群容量上限 ({actionParams?.joinTokenSymbol})</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入链群容量上限" className="!ring-secondary-foreground" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    <span className="flex items-center gap-1">
                      您的最大容量上限：{formatTokenAmount(maxVerifyCapacity || BigInt(0))}{' '}
                      {actionParams?.joinTokenSymbol} &nbsp;
                      {actionParams?.joinTokenAddress && (
                        <>
                          (
                          <AddressWithCopyButton
                            address={actionParams.joinTokenAddress}
                            showCopyButton={true}
                            showAddress={true}
                            colorClassName="text-greyscale-500"
                          />
                          )
                        </>
                      )}
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 链群描述 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>链群描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="介绍您的链群..."
                      className="!ring-secondary-foreground min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 最小参与代币数 */}
            <FormField
              control={form.control}
              name="minJoinAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最小参与代币数 ({actionParams?.joinTokenSymbol})</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="可填0, 表示任何>0的参与量都可以"
                      className="!ring-secondary-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">设置为0表示任何大于0的参与量都可以</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 最大参与代币数 */}
            <FormField
              control={form.control}
              name="maxJoinAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最大参与代币数 ({actionParams?.joinTokenSymbol})</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="可填0, 表示与扩展行动默认值保持一致"
                      className="!ring-secondary-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    扩展行动默认值当前最大参与量：{formatTokenAmount(actionParams.joinMaxAmount)}{' '}
                    {actionParams?.joinTokenSymbol}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 按钮 */}
            <div className="flex justify-center space-x-4 pt-4">
              <Button
                disabled={isPendingUpdate || isConfirmingUpdate || isConfirmedUpdate}
                className="w-full max-w-xs"
                type="button"
                onClick={() => {
                  form.handleSubmit((values) => handleUpdate(values))();
                }}
              >
                {isPendingUpdate
                  ? '提交中...'
                  : isConfirmingUpdate
                  ? '确认中...'
                  : isConfirmedUpdate
                  ? '已更新'
                  : '确认更新'}
              </Button>
            </div>
          </form>
        </Form>

        {/* 小贴士（算法 + 数值） */}
        <_GroupActionTips
          maxVerifyCapacityFactor={actionParams?.maxVerifyCapacityFactor}
          maxJoinAmountRatio={actionParams?.maxJoinAmountRatio}
          joinMaxAmount={actionParams?.joinMaxAmount}
          groupActivationStakeAmount={actionParams?.groupActivationStakeAmount}
        />
      </div>

      <LoadingOverlay
        isLoading={isPendingUpdate || isConfirmingUpdate}
        text={isPendingUpdate ? '更新中...' : '确认更新...'}
      />
    </>
  );
};

export default _GroupOPUpdate;
