// components/Extension/Plugins/Group/_GroupOPUpdate.tsx
// 更新链群信息操作

'use client';

import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { TokenContext } from '@/src/contexts/TokenContext';
import { ActionInfo } from '@/src/types/love20types';
import { useExtensionGroupDetail, useExtensionActionParam } from '@/src/hooks/extension/plugins/group/composite';
import { useUpdateGroupInfo } from '@/src/hooks/extension/plugins/group/contracts/useLOVE20GroupManager';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { parseUnits, formatTokenAmount } from '@/src/lib/format';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import LeftTitle from '@/src/components/Common/LeftTitle';
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

  // 表单验证
  const formSchema = z.object({
    description: z.string().max(500, { message: '描述不能超过500字' }),
    minJoinAmount: z.string().refine(
      (val) => {
        if (!val || val === '0') return true;
        const amount = parseFloat(val);
        return !isNaN(amount) && amount >= 0;
      },
      { message: '请输入有效的代币数' },
    ),
    maxJoinAmount: z.string().refine(
      (val) => {
        if (!val || val === '0') return true;
        const amount = parseFloat(val);
        return !isNaN(amount) && amount >= 0;
      },
      { message: '请输入有效的代币数' },
    ),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
        description: groupDetail.description || '',
        minJoinAmount:
          groupDetail.groupMinJoinAmount > BigInt(0)
            ? formatTokenAmount(groupDetail.groupMinJoinAmount, token?.decimals || 18)
            : '',
        maxJoinAmount:
          groupDetail.groupMaxJoinAmount > BigInt(0)
            ? formatTokenAmount(groupDetail.groupMaxJoinAmount, token?.decimals || 18)
            : '',
      });
    }
  }, [groupDetail, form, token?.decimals]);

  // 监控表单值用于实时验证
  const minJoinAmountValue = form.watch('minJoinAmount');
  const maxJoinAmountValue = form.watch('maxJoinAmount');

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

    // 验证最小参与代币数
    const minJoinAmountBigInt = values.minJoinAmount ? parseUnits(values.minJoinAmount) : BigInt(0);

    if (minJoinAmountBigInt > BigInt(0)) {
      // 不能小于行动的最小参与量
      if (minJoinAmountBigInt < actionParams.minJoinAmount) {
        toast.error(
          `最小参与量不能小于行动要求的 ${formatTokenAmount(actionParams.minJoinAmount, 2)} ${token?.symbol}`,
        );
        return;
      }

      // 不能大于行动的单个行动者最大参与代币数
      if (minJoinAmountBigInt > actionParams.joinMaxAmount) {
        toast.error(`最小参与量不能大于 ${formatTokenAmount(actionParams.joinMaxAmount, 2)} ${token?.symbol}`);
        return;
      }
    }

    // 验证最大参与代币数
    const maxJoinAmountBigInt = values.maxJoinAmount ? parseUnits(values.maxJoinAmount) : BigInt(0);

    if (maxJoinAmountBigInt > BigInt(0)) {
      // 不能大于行动的单个行动者最大参与代币数
      if (maxJoinAmountBigInt > actionParams.joinMaxAmount) {
        toast.error(`最大参与量不能大于 ${formatTokenAmount(actionParams.joinMaxAmount, 2)} ${token?.symbol}`);
        return;
      }
    }

    try {
      await updateGroupInfo(
        token?.address as `0x${string}`,
        actionId,
        groupId,
        values.description,
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

  // 额外校验：把"范围约束"实时反馈到输入框下方
  useEffect(() => {
    if (!actionParams) return;

    // minJoinAmount
    const minJoin = safeParseUnits(minJoinAmountValue);
    if (minJoinAmountValue && minJoin > BigInt(0)) {
      if (minJoin < actionParams.minJoinAmount) {
        form.setError('minJoinAmount', {
          type: 'validate',
          message: `不能小于行动最小参与量 ${formatTokenAmount(actionParams.minJoinAmount, 2)} ${token?.symbol}`,
        });
      } else if (minJoin > actionParams.joinMaxAmount) {
        form.setError('minJoinAmount', {
          type: 'validate',
          message: `不能大于全局最大参与量 ${formatTokenAmount(actionParams.joinMaxAmount, 2)} ${token?.symbol}`,
        });
      } else {
        form.clearErrors('minJoinAmount');
      }
    }

    // maxJoinAmount
    const maxJoin = safeParseUnits(maxJoinAmountValue);
    if (maxJoinAmountValue && maxJoin > BigInt(0)) {
      if (maxJoin > actionParams.joinMaxAmount) {
        form.setError('maxJoinAmount', {
          type: 'validate',
          message: `不能大于全局最大参与量 ${formatTokenAmount(actionParams.joinMaxAmount, 2)} ${token?.symbol}`,
        });
      } else {
        form.clearErrors('maxJoinAmount');
      }
    }
  }, [actionParams, form, maxJoinAmountValue, minJoinAmountValue, token?.symbol]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorDetail) handleContractError(errorDetail, 'extension');
    if (errorParams) handleContractError(errorParams, 'extension');
    if (errorUpdate) handleContractError(errorUpdate, 'extension');
  }, [errorDetail, errorParams, errorUpdate, handleContractError]);

  if (isPendingDetail || isPendingParams) {
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
                  <FormLabel>最小参与代币数 ({token?.symbol})</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="可填0, 表示与扩展行动默认值保持一致"
                      className="!ring-secondary-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    扩展行动默认值最小参与量：{formatTokenAmount(actionParams.minJoinAmount)} {token?.symbol}
                  </FormDescription>
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
                  <FormLabel>最大参与代币数 ({token?.symbol})</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="可填0, 表示与扩展行动默认值保持一致"
                      className="!ring-secondary-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    扩展行动默认值当前最大参与量：{formatTokenAmount(actionParams.joinMaxAmount)} {token?.symbol}
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
          minGovVoteRatioBps={actionParams?.minGovVoteRatioBps}
          capacityMultiplier={actionParams?.capacityMultiplier}
          stakingMultiplier={actionParams?.stakingMultiplier}
          minJoinAmount={actionParams?.minJoinAmount}
          maxJoinAmountMultiplier={actionParams?.maxJoinAmountMultiplier}
          joinMaxAmount={actionParams?.joinMaxAmount}
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
