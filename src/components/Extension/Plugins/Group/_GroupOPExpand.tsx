// components/Extension/Plugins/Group/_GroupOPExpand.tsx
// 追加质押操作

'use client';

import React, { useContext, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Form } from '@/components/ui/form';
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
import { useExtensionActionParam } from '@/src/hooks/extension/plugins/group/composite';
import _GroupStakeTokenPanel from './_GroupStakeTokenPanel';
import _GroupTokenApproveButtons from './_GroupTokenApproveButtons';
import _GroupActionTips from './_GroupActionTips';

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

  // 获取链群行动整体参数（扩展基本常量 + 实时数据）
  const {
    params: actionParams,
    isPending: isPendingActionParams,
    error: errorActionParams,
  } = useExtensionActionParam({ actionId, extensionAddress });

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
  } = useAllowance(
    stakeTokenAddress as `0x${string}`,
    account as `0x${string}`,
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`,
  );

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
      await approve(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`,
        additionalStakeBigInt,
      );
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

    // 验证追加金额范围
    if (actualMinStake > BigInt(0) && additionalStakeBigInt < actualMinStake) {
      toast.error(`追加质押金额不能小于最小值 ${formatTokenAmount(actualMinStake, 4, 'ceil')} ${stakeSymbol}`);
      return;
    }

    if (actualMaxStake !== undefined && additionalStakeBigInt > actualMaxStake) {
      toast.error(`追加质押金额不能大于最大值 ${formatTokenAmount(actualMaxStake)} ${stakeSymbol}`);
      return;
    }

    if (userBalance !== undefined && userBalance > BigInt(0) && additionalStakeBigInt > userBalance) {
      toast.error(`追加质押金额不能大于余额 ${formatTokenAmount(userBalance)} ${stakeSymbol}`);
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

  // 计算追加质押的实际范围
  // 实际最小值：如果原最小质押量 > 当前已质押量，则需要至少补足差额，否则为 0
  const actualMinStake = useMemo(() => {
    if (!actionParams?.minStake || !groupDetail?.stakedAmount) return BigInt(0);
    const diff = actionParams.minStake - groupDetail.stakedAmount;
    return diff > BigInt(0) ? diff : BigInt(0);
  }, [actionParams?.minStake, groupDetail?.stakedAmount]);

  // 实际最大值：取 additionalStakeAllowed（已经考虑了容量限制）
  const actualMaxStake = useMemo(() => {
    return additionalStakeAllowed || BigInt(0);
  }, [additionalStakeAllowed]);

  // 设置最高按钮
  const handleSetMax = () => {
    if (!userBalance || !actualMaxStake) return;

    const maxAmount = userBalance < actualMaxStake ? userBalance : actualMaxStake;
    form.setValue('additionalStake', formatTokenAmount(maxAmount, 6));
  };

  // 实时表单验证
  useEffect(() => {
    const staked = additionalStakeBigInt;

    if (additionalStake && staked > BigInt(0)) {
      // 验证最小值
      if (actualMinStake > BigInt(0) && staked < actualMinStake) {
        form.setError('additionalStake', {
          type: 'validate',
          message: `追加质押金额不能小于最小值 ${formatTokenAmount(actualMinStake, 4, 'ceil')} ${stakeSymbol}`,
        });
      }
      // 验证最大值
      else if (actualMaxStake > BigInt(0) && staked > actualMaxStake) {
        form.setError('additionalStake', {
          type: 'validate',
          message: `追加质押金额不能大于最大值 ${formatTokenAmount(actualMaxStake)} ${stakeSymbol}`,
        });
      }
      // 验证余额
      else if (userBalance !== undefined && userBalance > BigInt(0) && staked > userBalance) {
        form.setError('additionalStake', {
          type: 'validate',
          message: `追加质押金额不能大于余额 ${formatTokenAmount(userBalance)} ${stakeSymbol}`,
        });
      } else {
        form.clearErrors('additionalStake');
      }
    }
  }, [additionalStake, additionalStakeBigInt, actualMinStake, actualMaxStake, userBalance, stakeSymbol, form]);

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
                {formatTokenAmount(groupDetail.stakedAmount)} {stakeSymbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">当前容量:</span>
              <span className="font-medium">
                {formatTokenAmount(groupDetail.capacity)} {token?.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">还可以质押:</span>
              <span className="font-medium text-secondary">
                {formatTokenAmount(additionalStakeAllowed || BigInt(0))} {stakeSymbol}
              </span>
            </div>
          </div>
        </div>

        {/* 表单 */}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* 追加质押金额 */}
            <_GroupStakeTokenPanel
              form={form}
              fieldName="additionalStake"
              label="追加质押金额"
              placeholder="请输入追加质押金额"
              tokenSymbol={stakeSymbol}
              userBalance={userBalance}
              minAmount={actualMinStake}
              maxAmount={actualMaxStake}
              showRange={true}
              onSetMax={handleSetMax}
            />

            {/* 按钮 */}
            <_GroupTokenApproveButtons
              tokenSymbol={stakeSymbol}
              isTokenApproved={isTokenApproved}
              isPendingApprove={isPendingApprove}
              isConfirmingApprove={isConfirmingApprove}
              onApprove={() => form.handleSubmit((values) => handleApprove(values))()}
              isPendingAction={isPendingExpand}
              isConfirmingAction={isConfirmingExpand}
              isConfirmedAction={isConfirmedExpand}
              onAction={() => form.handleSubmit((values) => handleExpand(values))()}
              actionLabel="追加质押"
              actionLabelPending="2.提交中..."
              actionLabelConfirming="2.确认中..."
              actionLabelConfirmed="2.已追加"
            />
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
