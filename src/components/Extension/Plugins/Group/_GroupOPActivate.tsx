// components/Extension/Plugins/Group/_GroupOPActivate.tsx
// 激活链群操作

'use client';

// React
import React, { useContext, useEffect, useMemo, useState } from 'react';

// Next.js
import Link from 'next/link';
import { useRouter } from 'next/router';

// 第三方库
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { useAccount } from 'wagmi';
import { z } from 'zod';

// UI 组件
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useAllowance, useApprove, useBalanceOf } from '@/src/hooks/contracts/useLOVE20Token';
import { useMyGovData } from '@/src/hooks/composite/useMyGovData';
import { useMyGroups } from '@/src/hooks/extension/base/composite/useMyGroups';
import { useExtensionActionParam } from '@/src/hooks/extension/plugins/group/composite';
import {
  useActivateGroup,
  useActiveGroupIdsByOwner,
  useExpandableInfo,
} from '@/src/hooks/extension/plugins/group/contracts/useLOVE20GroupManager';

// 工具函数
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatTokenAmount, parseUnits } from '@/src/lib/format';

// 组件
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import _GroupActionTips from './_GroupActionTips';
import _GroupStakeTokenPanel from './_GroupStakeTokenPanel';
import _GroupTokenApproveButtons from './_GroupTokenApproveButtons';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

function safeParseUnits(val: string | undefined): bigint {
  if (!val) return BigInt(0);
  return parseUnits(val);
}

interface GroupOPActivateProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupId?: bigint;
}

const _GroupOPActivate: React.FC<GroupOPActivateProps> = ({ actionId, actionInfo, extensionAddress, groupId }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取治理票占比数据
  const {
    governancePercentage,
    isPending: isPendingGovData,
    error: errorGovData,
  } = useMyGovData({
    tokenAddress: token?.address as `0x${string}`,
    account: account as `0x${string}`,
  });

  // 如果没有传入 groupId，需要从用户的 group NFT 中选择
  const { myGroups, isPending: isPendingGroups, error: errorGroups } = useMyGroups(account);
  const [selectedGroupId, setSelectedGroupId] = useState<bigint | undefined>(groupId);

  // 如果传入了 groupId，直接使用；否则使用选中的 groupId
  const finalGroupId = groupId || selectedGroupId;

  // 获取已经激活的 groupId 列表
  const {
    activeGroupIds: activatedGroupIds,
    isPending: isPendingActivatedGroups,
    error: errorActivatedGroups,
  } = useActiveGroupIdsByOwner(
    (token?.address as `0x${string}`) || ZERO_ADDRESS,
    actionId,
    (account || ZERO_ADDRESS) as `0x${string}`,
  );

  // 过滤掉已经激活的 groupId
  const availableGroups = useMemo(() => {
    if (!myGroups || !activatedGroupIds) return myGroups;
    return myGroups.filter((group) => !activatedGroupIds.some((activatedId) => activatedId === group.tokenId));
  }, [myGroups, activatedGroupIds]);

  // 当只有一个可用链群时，自动选择它
  useEffect(() => {
    if (!groupId && availableGroups && availableGroups.length === 1 && !selectedGroupId) {
      setSelectedGroupId(availableGroups[0].tokenId);
    }
  }, [groupId, availableGroups, selectedGroupId]);

  // 获取链群行动整体参数（扩展基本常量 + 实时数据）
  const {
    params: actionParams,
    isPending: isPendingActionParams,
    error: errorActionParams,
  } = useExtensionActionParam({ actionId, extensionAddress });
  console.log('actionParams', actionParams);

  // 获取可扩展信息（用于计算最大质押量）
  const {
    additionalStakeAllowed,
    maxCapacity,
    maxStake,
    currentStake,
    isPending: isPendingExpandable,
    error: errorExpandable,
  } = useExpandableInfo(
    (actionParams?.tokenAddress || (token?.address as `0x${string}`) || ZERO_ADDRESS) as `0x${string}`,
    actionId,
    (account || ZERO_ADDRESS) as `0x${string}`,
  );

  // 获取用户余额
  const {
    balance: userBalance,
    isPending: isPendingBalance,
    error: errorBalance,
  } = useBalanceOf(
    (actionParams?.stakeTokenAddress || ZERO_ADDRESS) as `0x${string}`,
    (account || ZERO_ADDRESS) as `0x${string}`,
    !!actionParams?.stakeTokenAddress && !!account,
  );

  // 表单验证
  const formSchema = useMemo(
    () =>
      z
        .object({
          stakedAmount: z
            .string()
            .min(1, { message: '请输入质押代币数' })
            .refine(
              (val) => {
                const amount = parseFloat(val);
                return !isNaN(amount) && amount > 0;
              },
              { message: '请输入有效的质押代币数' },
            )
            .superRefine((val, ctx) => {
              const amount = parseUnits(val);

              // 最小质押量验证
              if (actionParams?.minStake && actionParams.minStake > BigInt(0) && amount < actionParams.minStake) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `质押代币数不能小于最小质押量 ${formatTokenAmount(actionParams.minStake, 4, 'ceil')} ${
                    token?.symbol || ''
                  }`,
                });
              }

              // 最大质押量验证
              if (
                additionalStakeAllowed !== undefined &&
                additionalStakeAllowed > BigInt(0) &&
                amount > additionalStakeAllowed
              ) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `质押代币数不能大于最大质押量 ${formatTokenAmount(additionalStakeAllowed)} ${
                    token?.symbol || ''
                  }`,
                });
              }

              // 余额验证
              if (userBalance !== undefined && userBalance > BigInt(0) && amount > userBalance) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `质押代币数不能大于余额 ${formatTokenAmount(userBalance)} ${token?.symbol || ''}`,
                });
              }
            }),
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
                // 不能小于行动的最小参与量
                if (actionParams?.minJoinAmount && amount < actionParams.minJoinAmount) {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `不能小于行动最小参与量 ${formatTokenAmount(actionParams.minJoinAmount, 2)} ${
                      token?.symbol || ''
                    }`,
                  });
                }
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
    [actionParams, additionalStakeAllowed, userBalance, token],
  );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stakedAmount: '',
      description: '',
      minJoinAmount: '',
      maxJoinAmount: '',
    },
    mode: 'onChange',
  });

  // 授权检查
  const stakedAmount = form.watch('stakedAmount');
  const stakedAmountBigInt = stakedAmount ? parseUnits(stakedAmount) : BigInt(0);

  // 当前输入的质押量对应的容量（实时提示用）
  const stakedCapacity = useMemo(() => {
    if (!actionParams?.stakingMultiplier) return BigInt(0);
    if (!stakedAmountBigInt || stakedAmountBigInt <= BigInt(0)) return BigInt(0);
    return stakedAmountBigInt * actionParams.stakingMultiplier;
  }, [actionParams?.stakingMultiplier, stakedAmountBigInt]);

  const {
    allowance,
    isPending: isPendingAllowance,
    error: errorAllowance,
    refetch: refetchAllowance,
  } = useAllowance(
    (actionParams?.stakeTokenAddress || ZERO_ADDRESS) as `0x${string}`,
    (account || ZERO_ADDRESS) as `0x${string}`,
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`,
    !!actionParams?.stakeTokenAddress && !!account,
  );

  const isTokenApproved = allowance !== undefined && allowance >= stakedAmountBigInt;

  // 授权
  const {
    approve,
    isPending: isPendingApprove,
    isConfirming: isConfirmingApprove,
    isConfirmed: isConfirmedApprove,
    writeError: errorApprove,
  } = useApprove((actionParams?.stakeTokenAddress || ZERO_ADDRESS) as `0x${string}`);

  async function handleApprove(values: FormValues) {
    if (!values.stakedAmount || stakedAmountBigInt === BigInt(0)) {
      toast.error('请输入质押代币数');
      return;
    }

    try {
      await approve(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`,
        stakedAmountBigInt,
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

  // 激活链群
  const {
    activateGroup,
    isPending: isPendingActivate,
    isConfirming: isConfirmingActivate,
    isConfirmed: isConfirmedActivate,
    writeError: errorActivate,
  } = useActivateGroup();

  async function handleActivate(values: FormValues) {
    if (!actionParams) {
      toast.error('扩展协议参数未加载完成');
      return;
    }

    if (!finalGroupId) {
      toast.error('请选择要激活的链群');
      return;
    }

    if (!isTokenApproved) {
      toast.error('请先授权质押代币');
      return;
    }

    // 转换参数为 BigInt（formSchema 已经完成验证）
    const minJoinAmountBigInt = values.minJoinAmount ? parseUnits(values.minJoinAmount) : BigInt(0);
    const maxJoinAmountBigInt = values.maxJoinAmount ? parseUnits(values.maxJoinAmount) : BigInt(0);

    try {
      await activateGroup(
        actionParams.tokenAddress as `0x${string}`,
        actionId,
        finalGroupId,
        values.description,
        stakedAmountBigInt,
        minJoinAmountBigInt,
        maxJoinAmountBigInt,
        BigInt(0),
      );
    } catch (error) {
      console.error('Activate group failed', error);
    }
  }

  useEffect(() => {
    if (isConfirmedActivate) {
      toast.success('链群激活成功');
      setTimeout(() => {
        router.push(`/action/info/?id=${actionId.toString()}&symbol=${token?.symbol}&tab=public`);
      }, 1500);
    }
  }, [isConfirmedActivate, router]);

  // 设置最高按钮
  const handleSetMax = () => {
    if (!userBalance || !additionalStakeAllowed) return;

    const maxAmount = userBalance < additionalStakeAllowed ? userBalance : additionalStakeAllowed;
    // 输入框内尽量保留更多精度，避免“最高”后被截断得过多
    form.setValue('stakedAmount', formatTokenAmount(maxAmount, 6));
  };

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorActionParams) handleContractError(errorActionParams, 'extension');
    if (errorExpandable) handleContractError(errorExpandable, 'extension');
    if (errorBalance) handleContractError(errorBalance, 'token');
    if (errorAllowance) handleContractError(errorAllowance, 'token');
    if (errorApprove) handleContractError(errorApprove, 'token');
    if (errorActivate) handleContractError(errorActivate, 'extension');
    if (errorGroups) handleContractError(errorGroups, 'group');
    if (errorActivatedGroups) handleContractError(errorActivatedGroups, 'extension');
    if (errorGovData) handleContractError(errorGovData, 'stake');
  }, [
    errorActionParams,
    errorExpandable,
    errorBalance,
    errorAllowance,
    errorApprove,
    errorActivate,
    errorGroups,
    errorActivatedGroups,
    errorGovData,
    handleContractError,
  ]);

  if (
    isPendingActionParams ||
    isPendingExpandable ||
    isPendingBalance ||
    isPendingGovData ||
    (!groupId && (isPendingGroups || isPendingActivatedGroups))
  ) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载参数中...</p>
      </div>
    );
  }

  // 检查治理票占比是否满足要求
  if (actionParams?.minGovVoteRatioBps) {
    const requiredPercentage = Number(actionParams.minGovVoteRatioBps) / 100;
    if (governancePercentage < requiredPercentage) {
      return (
        <div className="text-center py-12">
          <p className="mb-4">
            治理票必须 <span className="text-secondary"> ≥ {requiredPercentage.toFixed(2)}%</span> 才可以激活链群！
          </p>
          <p className="mb-4">
            请先
            <Link href={`/stake/stakelp/?symbol=${token?.symbol}`}>
              <Button variant="link" className="text-secondary font-normal px-1 text-base">
                获取治理票 &gt;&gt;
              </Button>
            </Link>
          </p>
        </div>
      );
    }
  }

  // 如果没有传入 groupId 且没有可用的 group（考虑已过滤的可用链群）
  if (!isPendingActivate && !groupId && (!availableGroups || availableGroups.length === 0)) {
    return (
      <div className="text-center py-12">
        <p className="mb-4">
          {myGroups && myGroups.length > 0 ? '您的所有链群已经激活，没有可用的链群' : '您当前没有未激活的链群ID'}
        </p>
        <p className="mb-4">
          请先
          <Link href="/extension/groupids/">
            <Button variant="link" className="text-secondary font-normal px-1 text-base">
              铸造链群ID &gt;&gt;
            </Button>
          </Link>
        </p>
      </div>
    );
  }

  if (!actionParams) {
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
          <LeftTitle title="激活链群" />
        </div>

        {/* 链群选择器（如果没有传入 groupId） */}
        {!groupId && (
          <div className="space-y-2">
            <label className="text-sm font-medium">选择链群ID</label>
            <Select value={selectedGroupId?.toString()} onValueChange={(value) => setSelectedGroupId(BigInt(value))}>
              <SelectTrigger className="!ring-secondary-foreground">
                <SelectValue placeholder="请选择要激活的链群" />
              </SelectTrigger>
              <SelectContent>
                {availableGroups?.map((group) => (
                  <SelectItem key={group.tokenId.toString()} value={group.tokenId.toString()}>
                    {group.groupName || `链群 #${group.tokenId.toString()}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedGroupId && <p className="text-xs text-red-500">请选择一个链群</p>}
          </div>
        )}

        {/* 表单 */}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* 质押代币数 */}
            <_GroupStakeTokenPanel
              form={form}
              fieldName="stakedAmount"
              label="质押代币数"
              placeholder="请输入质押代币数"
              tokenSymbol={token?.symbol}
              userBalance={userBalance}
              minAmount={actionParams.minStake}
              maxAmount={additionalStakeAllowed}
              showRange={true}
              onSetMax={handleSetMax}
              additionalInfo={
                <FormDescription className="text-xs">
                  对应的链群容量：<span className="text-secondary">{formatTokenAmount(stakedCapacity, 2)}</span>{' '}
                  {token?.symbol}
                </FormDescription>
              }
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
            <_GroupTokenApproveButtons
              tokenSymbol={token?.symbol}
              isTokenApproved={isTokenApproved}
              isPendingApprove={isPendingApprove}
              isConfirmingApprove={isConfirmingApprove}
              onApprove={() => form.handleSubmit((values) => handleApprove(values))()}
              isPendingAction={isPendingActivate}
              isConfirmingAction={isConfirmingActivate}
              isConfirmedAction={isConfirmedActivate}
              onAction={() => form.handleSubmit((values) => handleActivate(values))()}
              actionLabel="激活链群"
              actionLabelPending="2.提交中..."
              actionLabelConfirming="2.确认中..."
              actionLabelConfirmed="2.已激活"
              disableAction={!finalGroupId}
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
        isLoading={isPendingApprove || isConfirmingApprove || isPendingActivate || isConfirmingActivate}
        text={
          isPendingApprove
            ? '授权中...'
            : isConfirmingApprove
            ? '确认授权...'
            : isPendingActivate
            ? '激活中...'
            : '确认激活...'
        }
      />
    </>
  );
};

export default _GroupOPActivate;
