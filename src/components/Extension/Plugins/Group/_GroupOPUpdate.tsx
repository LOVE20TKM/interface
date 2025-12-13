// components/Extension/Plugins/Group/_GroupOPUpdate.tsx
// 更新链群信息操作

'use client';

import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
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
    url: z.string().url({ message: '请输入有效的URL' }).or(z.literal('')),
    minJoinAmount: z.string().refine(
      (val) => {
        if (!val || val === '0') return true;
        const amount = parseFloat(val);
        return !isNaN(amount) && amount >= 0;
      },
      { message: '请输入有效的金额' },
    ),
    maxJoinAmount: z.string().refine(
      (val) => {
        if (!val || val === '0') return true;
        const amount = parseFloat(val);
        return !isNaN(amount) && amount >= 0;
      },
      { message: '请输入有效的金额' },
    ),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      url: '',
      minJoinAmount: '0',
      maxJoinAmount: '0',
    },
    mode: 'onChange',
  });

  // 当链群详情加载完成后，填充表单
  useEffect(() => {
    if (groupDetail) {
      form.reset({
        description: groupDetail.description || '',
        url: '', // URL 字段不在 GroupDetailInfo 中，保持为空
        minJoinAmount:
          groupDetail.groupMinJoinAmount > BigInt(0)
            ? formatTokenAmount(groupDetail.groupMinJoinAmount, token?.decimals || 18)
            : '0',
        maxJoinAmount:
          groupDetail.groupMaxJoinAmount > BigInt(0)
            ? formatTokenAmount(groupDetail.groupMaxJoinAmount, token?.decimals || 18)
            : '0',
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
      toast.error('行动参数未加载完成');
      return;
    }

    // 验证最小参与金额
    const minJoinAmountBigInt = values.minJoinAmount ? parseUnits(values.minJoinAmount) : BigInt(0);

    if (minJoinAmountBigInt > BigInt(0)) {
      // 不能小于行动本身的最小参与量
      if (minJoinAmountBigInt < actionParams.minJoinAmount) {
        toast.error(
          `最小参与量不能小于行动要求的 ${formatTokenAmount(actionParams.minJoinAmount, 2)} ${token?.symbol}`,
        );
        return;
      }
      // 不能大于行动本身的单个行动者最大参与代币数
      if (minJoinAmountBigInt > actionParams.joinMaxAmount) {
        toast.error(`最小参与量不能大于 ${formatTokenAmount(actionParams.joinMaxAmount, 2)} ${token?.symbol}`);
        return;
      }
    }

    // 验证最大参与金额
    const maxJoinAmountBigInt = values.maxJoinAmount ? parseUnits(values.maxJoinAmount) : BigInt(0);

    if (maxJoinAmountBigInt > BigInt(0)) {
      // 不能大于行动本身的单个行动者最大参与代币数
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
        <p className="mt-4 text-gray-600">加载链群信息...</p>
      </div>
    );
  }

  if (!groupDetail || !actionParams) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">未找到必要信息</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* 返回按钮 */}
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>

        {/* 标题 */}
        <div>
          <LeftTitle title="更新链群信息" />
          <p className="text-sm text-gray-600 mt-2">更新链群 #{groupId.toString()} 的描述和参与规则</p>
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
                  <FormLabel className="text-greyscale-500 font-normal">链群描述</FormLabel>
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

            {/* 链群链接 */}
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-greyscale-500 font-normal">相关链接</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." className="!ring-secondary-foreground" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">链群的网站、社交媒体等</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 最小参与金额 */}
            <FormField
              control={form.control}
              name="minJoinAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-greyscale-500 font-normal">最小参与金额 ({token?.symbol})</FormLabel>
                  <FormControl>
                    <Input placeholder="0 表示使用行动默认值" className="!ring-secondary-foreground" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    行动默认值: {formatTokenAmount(actionParams.minJoinAmount, 2)} {token?.symbol}
                  </FormDescription>
                  <FormDescription className="text-xs">
                    当前实际值: {formatTokenAmount(groupDetail.actualMinJoinAmount, 2)} {token?.symbol}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 最大参与金额 */}
            <FormField
              control={form.control}
              name="maxJoinAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-greyscale-500 font-normal">最大参与金额 ({token?.symbol})</FormLabel>
                  <FormControl>
                    <Input placeholder="0 表示使用行动默认值" className="!ring-secondary-foreground" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    行动默认值: {formatTokenAmount(actionParams?.joinMaxAmount || BigInt(0), 2)} {token?.symbol}
                  </FormDescription>
                  <FormDescription className="text-xs">
                    当前实际值: {formatTokenAmount(groupDetail.actualMaxJoinAmount, 2)} {token?.symbol}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 按钮 */}
            <div className="flex justify-center space-x-4 pt-4">
              <Button variant="outline" onClick={() => router.back()} disabled={isPendingUpdate || isConfirmingUpdate}>
                取消
              </Button>
              <Button
                disabled={isPendingUpdate || isConfirmingUpdate || isConfirmedUpdate}
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

        {/* 说明 */}
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 更新说明</div>
          <div className="space-y-1 text-gray-600">
            <div>• 可以随时更新链群的描述和链接</div>
            <div>• 参与金额限制会影响新加入者</div>
            <div>• 实际限制取决于链群设置和行动默认值的较小值</div>
          </div>
        </div>
      </div>

      <LoadingOverlay
        isLoading={isPendingUpdate || isConfirmingUpdate}
        text={isPendingUpdate ? '更新中...' : '确认更新...'}
      />
    </>
  );
};

export default _GroupOPUpdate;
