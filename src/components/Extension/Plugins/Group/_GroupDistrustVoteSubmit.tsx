// components/Extension/Plugins/Group/_GroupDistrustVoteSubmit.tsx
// 投不信任票 - 第二步：提交投票

'use client';

import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { TokenContext } from '@/src/contexts/TokenContext';
import { ActionInfo } from '@/src/types/love20types';
import { useExtensionGroupsOfAction } from '@/src/hooks/extension/plugins/group/composite';
import { useDistrustVote } from '@/src/hooks/extension/plugins/group/contracts/useLOVE20GroupDistrust';
import { useScoreByVerifierByActionId } from '@/src/hooks/contracts/useLOVE20Verify';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
import { useHandleContractError } from '@/src/lib/errorUtils';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import LeftTitle from '@/src/components/Common/LeftTitle';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

interface GroupDistrustVoteSubmitProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupOwner: `0x${string}`;
  onCancel: () => void;
  onSuccess: () => void;
}

// 投票档位选项
const VOTE_OPTIONS = [
  { label: '100% 不信任票', value: 1.0 },
  { label: '80% 不信任票', value: 0.8 },
  { label: '60% 不信任票', value: 0.6 },
  { label: '40% 不信任票', value: 0.4 },
  { label: '20% 不信任票', value: 0.2 },
];

interface FormValues {
  ratio: number;
  reason: string;
}

const _GroupDistrustVoteSubmit: React.FC<GroupDistrustVoteSubmitProps> = ({
  actionId,
  actionInfo,
  extensionAddress,
  groupOwner,
  onCancel,
  onSuccess,
}) => {
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取当前轮次
  const { currentRound, isPending: isPendingRound, error: errorRound } = useCurrentRound();

  // 获取我的验证票数
  const {
    scoreByVerifierByActionId: myVerifyVotes,
    isPending: isPendingVerify,
    error: errorVerify,
  } = useScoreByVerifierByActionId(
    token?.address as `0x${string}`,
    currentRound || BigInt(0),
    account as `0x${string}`,
    actionId,
  );

  // 获取服务者管理的链群
  const {
    groups,
    isPending: isPendingGroups,
    error: errorGroups,
  } = useExtensionGroupsOfAction({
    extensionAddress,
    tokenAddress: token?.address,
    actionId,
  });

  const ownerGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter((g) => g.owner.toLowerCase() === groupOwner.toLowerCase());
  }, [groups, groupOwner]);

  // 表单验证
  const formSchema = z.object({
    ratio: z.number().min(0.2).max(1.0, { message: '请选择不信任比例' }),
    reason: z.string().min(1, { message: '请输入不信任的原因' }).max(500, { message: '原因不能超过500字' }),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ratio: 0,
      reason: '',
    },
    mode: 'onChange',
  });

  const selectedRatio = form.watch('ratio');

  // 计算不信任票数
  const distrustVotes = useMemo(() => {
    if (!myVerifyVotes || myVerifyVotes === BigInt(0) || selectedRatio === 0) return BigInt(0);
    return BigInt(Math.floor(Number(myVerifyVotes) * selectedRatio));
  }, [myVerifyVotes, selectedRatio]);

  // 提交不信任投票
  const {
    distrustVote,
    isPending: isPendingVote,
    isConfirming: isConfirmingVote,
    isConfirmed: isConfirmedVote,
    writeError: errorVote,
  } = useDistrustVote(extensionAddress);

  async function handleSubmit(values: FormValues) {
    if (!myVerifyVotes || myVerifyVotes === BigInt(0)) {
      toast.error('您没有验证票，无法投不信任票');
      return;
    }

    if (distrustVotes === BigInt(0)) {
      toast.error('请选择不信任比例');
      return;
    }

    try {
      await distrustVote(
        token?.address as `0x${string}`,
        actionId,
        groupOwner,
        distrustVotes,
        values.reason,
        account as `0x${string}`,
      );
    } catch (error) {
      console.error('Distrust vote failed', error);
    }
  }

  useEffect(() => {
    if (isConfirmedVote) {
      toast.success('不信任投票提交成功');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  }, [isConfirmedVote, onSuccess]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorRound) handleContractError(errorRound, 'vote');
    if (errorVerify) handleContractError(errorVerify, 'verify');
    if (errorGroups) handleContractError(errorGroups, 'extension');
    if (errorVote) handleContractError(errorVote, 'extension');
  }, [errorRound, errorVerify, errorGroups, errorVote, handleContractError]);

  if (isPendingRound || isPendingVerify || isPendingGroups) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载投票信息...</p>
      </div>
    );
  }

  // 检查是否有投票权限
  if (!myVerifyVotes || myVerifyVotes === BigInt(0)) {
    return (
      <div className="space-y-4">
        <LeftTitle title="对该服务者投不信任票" />
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">您没有投票权限</p>
          <p className="text-sm text-gray-600 mb-6">只有给本行动投过票的治理者才能投不信任票</p>
          <Button variant="outline" onClick={onCancel}>
            返回
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <LeftTitle title="对该服务者投不信任票" />

        {/* 服务者信息 */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">服务者:</span>
          </div>
          <AddressWithCopyButton address={groupOwner} />

          {/* 管理的链群列表 */}
          {ownerGroups.length > 0 && (
            <div className="mt-3 text-sm text-gray-600">
              <span className="font-medium">管理的链群: </span>
              {ownerGroups.map((group, idx) => (
                <span key={group.groupId.toString()}>
                  #{group.groupId.toString()} {group.groupName}
                  {idx < ownerGroups.length - 1 && ', '}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 我的验证票信息 */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <span className="text-gray-600">您对本行动的验证票: </span>
          <span className="font-medium text-blue-800">{myVerifyVotes.toString()}</span>
        </div>

        {/* 投票表单 */}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* 投票档位选择 */}
            <FormField
              control={form.control}
              name="ratio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-greyscale-500 font-normal">选择不信任比例：</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {VOTE_OPTIONS.map((option) => (
                        <div
                          key={option.value}
                          onClick={() => field.onChange(option.value)}
                          className={`border rounded-lg p-3 cursor-pointer transition-all ${
                            field.value === option.value
                              ? 'border-secondary bg-secondary/10 ring-2 ring-secondary'
                              : 'border-gray-200 hover:border-secondary hover:bg-secondary/5'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{option.label}</span>
                            {field.value === option.value && (
                              <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                            )}
                          </div>
                          {field.value === option.value && (
                            <div className="text-sm text-gray-600 mt-1">
                              将投 {Math.floor(Number(myVerifyVotes) * option.value).toString()} 票不信任
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 不信任原因 */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-greyscale-500 font-normal">不信任原因：</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请详细说明不信任该服务者的原因..."
                      className="!ring-secondary-foreground min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">原因将在链上公示，供其他治理者参考</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 按钮 */}
            <div className="flex justify-center space-x-4 pt-4">
              <Button variant="outline" onClick={onCancel} disabled={isPendingVote || isConfirmingVote}>
                取消
              </Button>
              <Button
                disabled={isPendingVote || isConfirmingVote || isConfirmedVote}
                type="button"
                onClick={() => {
                  form.handleSubmit((values) => handleSubmit(values))();
                }}
              >
                {isPendingVote ? '提交中...' : isConfirmingVote ? '确认中...' : isConfirmedVote ? '已提交' : '提交'}
              </Button>
            </div>
          </form>
        </Form>

        {/* 说明 */}
        <div className="mt-6 text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          <div className="font-medium text-amber-800 mb-1">⚠️ 重要提示</div>
          <div className="space-y-1 text-amber-700">
            <div>• 不信任投票会降低该服务者管理的所有链群的激励</div>
            <div>• 投票原因将在链上公示，请客观公正</div>
            <div>• 投票后不可撤回，请谨慎操作</div>
          </div>
        </div>
      </div>

      <LoadingOverlay
        isLoading={isPendingVote || isConfirmingVote}
        text={isPendingVote ? '提交投票...' : '确认投票...'}
      />
    </>
  );
};

export default _GroupDistrustVoteSubmit;
