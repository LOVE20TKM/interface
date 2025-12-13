// components/Extension/Plugins/Group/_GroupOPExpand.tsx
// 追加质押操作

'use client';

import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { TokenContext } from '@/src/contexts/TokenContext';
import { ActionInfo } from '@/src/types/love20types';
import { useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite';
import {
  useConfig,
  useExpandableInfo,
  useExpandGroup,
} from '@/src/hooks/extension/plugins/group/contracts/useLOVE20GroupManager';
import { useAllowance, useBalanceOf, useApprove, useSymbol } from '@/src/hooks/contracts/useLOVE20Token';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { parseUnits, formatTokenAmount } from '@/src/lib/format';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import LeftTitle from '@/src/components/Common/LeftTitle';

interface GroupOPExpandProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupId: bigint;
}

const _GroupOPExpand: React.FC<GroupOPExpandProps> = ({ actionId, actionInfo, extensionAddress, groupId }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取扩展协议参数（从 GroupManager.config 读取）
  const {
    stakeTokenAddress,
    isPending: isPendingParams,
    error: errorParams,
  } = useConfig(token?.address as `0x${string}`, actionId);

  // 获取质押代币的 symbol
  const {
    symbol: stakeSymbol,
    isPending: isPendingStakeSymbol,
    error: errorStakeSymbol,
  } = useSymbol(stakeTokenAddress as `0x${string}`);

  // 获取链群详情
  const {
    groupDetail,
    isPending: isPendingDetail,
    error: errorDetail,
  } = useExtensionGroupDetail({
    extensionAddress,
    groupId,
  });

  // 获取可扩展信息
  const {
    additionalStakeAllowed,
    isPending: isPendingExpandable,
    error: errorExpandable,
  } = useExpandableInfo(token?.address as `0x${string}`, actionId, account as `0x${string}`);

  // 获取用户余额
  const {
    balance: userBalance,
    isPending: isPendingBalance,
    error: errorBalance,
  } = useBalanceOf(stakeTokenAddress as `0x${string}`, account as `0x${string}`);

  // 表单验证
  const formSchema = z.object({
    additionalStake: z
      .string()
      .min(1, { message: '请输入追加质押金额' })
      .refine(
        (val) => {
          const amount = parseFloat(val);
          return !isNaN(amount) && amount > 0;
        },
        { message: '请输入有效的追加金额' },
      ),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      additionalStake: '',
    },
    mode: 'onChange',
  });

  // 授权检查
  const additionalStake = form.watch('additionalStake');
  const additionalStakeBigInt = additionalStake ? parseUnits(additionalStake) : BigInt(0);

  const {
    allowance,
    isPending: isPendingAllowance,
    error: errorAllowance,
    refetch: refetchAllowance,
  } = useAllowance(stakeTokenAddress as `0x${string}`, account as `0x${string}`, extensionAddress);

  const isTokenApproved = allowance !== undefined && allowance >= additionalStakeBigInt;

  // 授权
  const {
    approve,
    isPending: isPendingApprove,
    isConfirming: isConfirmingApprove,
    isConfirmed: isConfirmedApprove,
    writeError: errorApprove,
  } = useApprove(stakeTokenAddress as `0x${string}`);

  async function handleApprove(values: FormValues) {
    if (!values.additionalStake || additionalStakeBigInt === BigInt(0)) {
      toast.error('请输入追加质押金额');
      return;
    }

    try {
      await approve(extensionAddress, additionalStakeBigInt);
    } catch (error) {
      console.error('Approve failed', error);
    }
  }

  useEffect(() => {
    if (isConfirmedApprove) {
      toast.success('授权成功');
      // 授权成功后，刷新授权额度
      refetchAllowance();
    }
  }, [isConfirmedApprove, refetchAllowance]);

  // 追加质押
  const {
    expandGroup,
    isPending: isPendingExpand,
    isConfirming: isConfirmingExpand,
    isConfirmed: isConfirmedExpand,
    writeError: errorExpand,
  } = useExpandGroup();

  async function handleExpand(values: FormValues) {
    if (!isTokenApproved) {
      toast.error('请先授权质押代币');
      return;
    }

    if (additionalStakeAllowed !== undefined && additionalStakeBigInt > additionalStakeAllowed) {
      toast.error('追加质押金额超过允许的最大值');
      return;
    }

    try {
      await expandGroup(token?.address as `0x${string}`, actionId, groupId, additionalStakeBigInt);
    } catch (error) {
      console.error('Expand stake failed', error);
    }
  }

  useEffect(() => {
    if (isConfirmedExpand) {
      toast.success('追加质押成功');
      setTimeout(() => {
        router.back();
      }, 1500);
    }
  }, [isConfirmedExpand, router]);

  // 设置最高按钮
  const handleSetMax = () => {
    if (!userBalance || !additionalStakeAllowed) return;

    const maxAmount = userBalance < additionalStakeAllowed ? userBalance : additionalStakeAllowed;
    form.setValue('additionalStake', formatTokenAmount(maxAmount, token?.decimals || 18));
  };

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorParams) handleContractError(errorParams, 'extension');
    if (errorStakeSymbol) handleContractError(errorStakeSymbol, 'token');
    if (errorDetail) handleContractError(errorDetail, 'extension');
    if (errorExpandable) handleContractError(errorExpandable, 'extension');
    if (errorBalance) handleContractError(errorBalance, 'token');
    if (errorAllowance) handleContractError(errorAllowance, 'token');
    if (errorApprove) handleContractError(errorApprove, 'token');
    if (errorExpand) handleContractError(errorExpand, 'extension');
  }, [
    errorParams,
    errorStakeSymbol,
    errorDetail,
    errorExpandable,
    errorBalance,
    errorAllowance,
    errorApprove,
    errorExpand,
    handleContractError,
  ]);

  if (isPendingParams || isPendingStakeSymbol || isPendingDetail || isPendingExpandable || isPendingBalance) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载信息...</p>
      </div>
    );
  }

  if (!stakeTokenAddress || !stakeSymbol || !groupDetail) {
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
          <LeftTitle title="追加质押" />
          <p className="text-sm text-gray-600 mt-2">为链群 #{groupId.toString()} 追加质押以增加容量</p>
        </div>

        {/* 当前状态 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">当前质押:</span>
              <span className="font-medium">
                {formatTokenAmount(groupDetail.stakedAmount, 2)} {stakeSymbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">当前容量:</span>
              <span className="font-medium">
                {formatTokenAmount(groupDetail.capacity, 2)} {token?.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">还可以质押:</span>
              <span className="font-medium text-secondary">
                {formatTokenAmount(additionalStakeAllowed || BigInt(0), 2)} {stakeSymbol}
              </span>
            </div>
          </div>
        </div>

        {/* 表单 */}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* 追加质押金额 */}
            <FormField
              control={form.control}
              name="additionalStake"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-greyscale-500 font-normal">追加质押金额 ({stakeSymbol})*</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="请输入追加质押金额"
                        className="!ring-secondary-foreground flex-1"
                        {...field}
                      />
                    </FormControl>
                    <Button type="button" variant="outline" onClick={handleSetMax}>
                      最高
                    </Button>
                  </div>
                  <FormDescription className="text-xs">
                    最多可追加: {formatTokenAmount(additionalStakeAllowed || BigInt(0), 2)} {stakeSymbol}
                  </FormDescription>
                  <FormDescription className="text-xs">
                    您的余额：{formatTokenAmount(userBalance || BigInt(0), 2)} {stakeSymbol}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 按钮 */}
            <div className="flex justify-center space-x-4 pt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={isPendingApprove || isConfirmingApprove || isPendingExpand || isConfirmingExpand}
              >
                取消
              </Button>
              <Button
                disabled={isPendingAllowance || isPendingApprove || isConfirmingApprove || isTokenApproved}
                type="button"
                onClick={() => {
                  form.handleSubmit((values) => handleApprove(values))();
                }}
              >
                {isTokenApproved ? `1.${stakeSymbol}已授权` : `1.授权${stakeSymbol}`}
              </Button>
              <Button
                disabled={!isTokenApproved || isPendingExpand || isConfirmingExpand || isConfirmedExpand}
                type="button"
                onClick={() => {
                  form.handleSubmit((values) => handleExpand(values))();
                }}
              >
                {isPendingExpand
                  ? '2.提交中...'
                  : isConfirmingExpand
                  ? '2.确认中...'
                  : isConfirmedExpand
                  ? '2.已追加'
                  : '2.追加质押'}
              </Button>
            </div>
          </form>
        </Form>

        {/* 说明 */}
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 追加质押说明</div>
          <div className="space-y-1 text-gray-600">
            <div>• 追加质押可以增加链群的容量上限</div>
            <div>• 容量上限取决于质押量和治理票占比</div>
            <div>• 关闭链群后可以取回质押代币</div>
          </div>
        </div>
      </div>

      <LoadingOverlay
        isLoading={isPendingApprove || isConfirmingApprove || isPendingExpand || isConfirmingExpand}
        text={
          isPendingApprove
            ? '授权中...'
            : isConfirmingApprove
            ? '确认授权...'
            : isPendingExpand
            ? '追加质押中...'
            : '确认追加...'
        }
      />
    </>
  );
};

export default _GroupOPExpand;
