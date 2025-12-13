// components/Extension/Plugins/Group/_GroupOPActivate.tsx
// 激活链群操作

'use client';

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAccount } from 'wagmi';
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
import {
  useExpandableInfo,
  useActivateGroup,
} from '@/src/hooks/extension/plugins/group/contracts/useLOVE20GroupManager';
import { useAllowance, useBalanceOf, useApprove } from '@/src/hooks/contracts/useLOVE20Token';
import { useMyGroups } from '@/src/hooks/extension/base/composite/useMyGroups';
import { useExtensionActionParam } from '@/src/hooks/extension/plugins/group/composite';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { parseUnits, formatTokenAmount } from '@/src/lib/format';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import LeftTitle from '@/src/components/Common/LeftTitle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

function safeParseUnits(val: string | undefined): bigint {
  if (!val) return BigInt(0);
  return parseUnits(val);
}

function formatBpsToPercent(bps: bigint): string {
  // 100 bps = 1.00%
  const integer = bps / BigInt(100);
  const frac = (bps % BigInt(100)).toString().padStart(2, '0');
  return `${integer.toString()}.${frac}%`;
}

function minBigInt(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
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

  // 如果没有传入 groupId，需要从用户的 group NFT 中选择
  const { myGroups, isPending: isPendingGroups, error: errorGroups } = useMyGroups(account);
  const [selectedGroupId, setSelectedGroupId] = useState<bigint | undefined>(groupId);

  // 如果传入了 groupId，直接使用；否则使用选中的 groupId
  const finalGroupId = groupId || selectedGroupId;

  // 获取链群行动整体参数（扩展基本常量 + 实时数据）
  const {
    params: actionParams,
    isPending: isPendingActionParams,
    error: errorActionParams,
  } = useExtensionActionParam({ extensionAddress });

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
  const formSchema = z.object({
    stakedAmount: z
      .string()
      .min(1, { message: '请输入质押代币数' })
      .refine(
        (val) => {
          const amount = parseFloat(val);
          return !isNaN(amount) && amount > 0;
        },
        { message: '请输入有效的质押代币数' },
      ),
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
      stakedAmount: '',
      description: '',
      minJoinAmount: '0',
      maxJoinAmount: '0',
    },
    mode: 'onChange',
  });

  // 授权检查
  const stakedAmount = form.watch('stakedAmount');
  const stakedAmountBigInt = stakedAmount ? parseUnits(stakedAmount) : BigInt(0);
  const minJoinAmountValue = form.watch('minJoinAmount');
  const maxJoinAmountValue = form.watch('maxJoinAmount');

  // 当前输入的质押量对应的容量（实时提示用）
  const stakedCapacity = useMemo(() => {
    if (!actionParams?.stakingMultiplier) return BigInt(0);
    if (!stakedAmountBigInt || stakedAmountBigInt <= BigInt(0)) return BigInt(0);
    return stakedAmountBigInt * actionParams.stakingMultiplier;
  }, [actionParams?.stakingMultiplier, stakedAmountBigInt]);

  const actualCapacity = useMemo(() => {
    if (!stakedCapacity || stakedCapacity <= BigInt(0)) return BigInt(0);
    // maxCapacity 来自 expandableInfo（链上计算的治理上限），若为空则只显示质押容量
    if (maxCapacity === undefined || maxCapacity <= BigInt(0)) return stakedCapacity;
    return minBigInt(stakedCapacity, maxCapacity);
  }, [stakedCapacity, maxCapacity]);

  const {
    allowance,
    isPending: isPendingAllowance,
    error: errorAllowance,
  } = useAllowance(
    (actionParams?.stakeTokenAddress || ZERO_ADDRESS) as `0x${string}`,
    (account || ZERO_ADDRESS) as `0x${string}`,
    extensionAddress,
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
      await approve(extensionAddress, stakedAmountBigInt);
    } catch (error) {
      console.error('Approve failed', error);
    }
  }

  useEffect(() => {
    if (isConfirmedApprove) {
      toast.success('授权成功');
    }
  }, [isConfirmedApprove]);

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

    // 验证质押代币数
    if (actionParams.minStake > BigInt(0) && stakedAmountBigInt < actionParams.minStake) {
      toast.error(`质押代币数不能小于最小质押量 ${formatTokenAmount(actionParams.minStake, 2)} ${token?.symbol}`);
      return;
    }
    if (
      additionalStakeAllowed !== undefined &&
      additionalStakeAllowed > BigInt(0) &&
      stakedAmountBigInt > additionalStakeAllowed
    ) {
      toast.error(`质押代币数不能大于最大质押量 ${formatTokenAmount(additionalStakeAllowed, 2)} ${token?.symbol}`);
      return;
    }
    if (userBalance !== undefined && userBalance > BigInt(0) && stakedAmountBigInt > userBalance) {
      toast.error(`质押代币数不能大于余额 ${formatTokenAmount(userBalance, 2)} ${token?.symbol}`);
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
      await activateGroup(
        actionParams.tokenAddress as `0x${string}`,
        actionId,
        finalGroupId,
        values.description,
        stakedAmountBigInt,
        minJoinAmountBigInt,
        maxJoinAmountBigInt,
      );
    } catch (error) {
      console.error('Activate group failed', error);
    }
  }

  useEffect(() => {
    if (isConfirmedActivate) {
      toast.success('链群激活成功');
      setTimeout(() => {
        router.back();
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

  // 额外校验：把“范围约束”实时反馈到输入框下方（参照 StakeTokenPanel 的体验）
  useEffect(() => {
    if (!actionParams) return;

    const staked = safeParseUnits(stakedAmount);
    const minStake = actionParams.minStake || BigInt(0);
    const maxStakeAllowed = additionalStakeAllowed || BigInt(0);

    // stakedAmount
    if (stakedAmount && staked > BigInt(0)) {
      if (minStake > BigInt(0) && staked < minStake) {
        form.setError('stakedAmount', {
          type: 'validate',
          message: `质押代币数不能小于最小质押量 ${formatTokenAmount(minStake, 2)} ${token?.symbol}`,
        });
      } else if (maxStakeAllowed > BigInt(0) && staked > maxStakeAllowed) {
        form.setError('stakedAmount', {
          type: 'validate',
          message: `质押代币数不能大于最大质押量 ${formatTokenAmount(maxStakeAllowed, 2)} ${token?.symbol}`,
        });
      } else if (userBalance !== undefined && userBalance > BigInt(0) && staked > userBalance) {
        form.setError('stakedAmount', {
          type: 'validate',
          message: `质押代币数不能大于余额 ${formatTokenAmount(userBalance, 2)} ${token?.symbol}`,
        });
      } else {
        form.clearErrors('stakedAmount');
      }
    }

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
  }, [
    actionParams,
    additionalStakeAllowed,
    form,
    maxJoinAmountValue,
    minJoinAmountValue,
    stakedAmount,
    token?.symbol,
    userBalance,
  ]);

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
  }, [
    errorActionParams,
    errorExpandable,
    errorBalance,
    errorAllowance,
    errorApprove,
    errorActivate,
    errorGroups,
    handleContractError,
  ]);

  if (isPendingActionParams || isPendingExpandable || isPendingBalance || (!groupId && isPendingGroups)) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载参数中...</p>
      </div>
    );
  }

  // 如果没有传入 groupId 且没有可用的 group
  if (!groupId && (!myGroups || myGroups.length === 0)) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-2">您目前没有可用的链群</p>
        <p className="text-sm text-gray-600">
          请先铸造一个链群ID，
          <Link href="/extension/groupids/" className="text-blue-500 hover:text-blue-700 underline">
            去铸造&gt;&gt;
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
                {myGroups?.map((group) => (
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
            <FormField
              control={form.control}
              name="stakedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>质押代币数 ({token?.symbol})</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="请输入质押代币数" className="!ring-secondary-foreground flex-1" {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" onClick={handleSetMax}>
                      最高
                    </Button>
                  </div>
                  <FormDescription className="text-xs">
                    质押范围：
                    {formatTokenAmount(actionParams.minStake || BigInt(0), 2)} ~{' '}
                    {formatTokenAmount(additionalStakeAllowed || BigInt(0), 2)} {token?.symbol}
                  </FormDescription>
                  <FormDescription className="text-xs">
                    您的余额：{formatTokenAmount(userBalance || BigInt(0), 2)} {token?.symbol}
                  </FormDescription>
                  <FormDescription className="text-xs">
                    当前质押容量：{formatTokenAmount(stakedCapacity, 2)} {token?.symbol}； 实际容量：
                    {formatTokenAmount(actualCapacity, 2)} {token?.symbol}
                    {maxCapacity !== undefined && maxCapacity > BigInt(0)
                      ? `（治理上限 ${formatTokenAmount(maxCapacity, 2)} ${token?.symbol}）`
                      : ''}
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
                  <FormLabel>最小参与代币数 ({token?.symbol})</FormLabel>
                  <FormControl>
                    <Input placeholder="0 表示使用行动默认值" className="!ring-secondary-foreground" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    全局最小参与量：{formatTokenAmount(actionParams.minJoinAmount, 2)} {token?.symbol}（填0使用）
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
                    <Input placeholder="0 表示使用行动默认值" className="!ring-secondary-foreground" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    全局最大参与量：{formatTokenAmount(actionParams.joinMaxAmount, 2)} {token?.symbol}（填0使用）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 按钮 */}
            <div className="flex justify-center space-x-4 pt-4">
              <Button
                className="w-1/2"
                disabled={isPendingAllowance || isPendingApprove || isConfirmingApprove || isTokenApproved}
                type="button"
                onClick={() => {
                  form.handleSubmit((values) => handleApprove(values))();
                }}
              >
                {isTokenApproved ? `1.${token?.symbol}已授权` : `1.授权${token?.symbol}`}
              </Button>
              <Button
                className="w-1/2"
                disabled={
                  !finalGroupId || !isTokenApproved || isPendingActivate || isConfirmingActivate || isConfirmedActivate
                }
                type="button"
                onClick={() => {
                  form.handleSubmit((values) => handleActivate(values))();
                }}
              >
                {isPendingActivate
                  ? '2.提交中...'
                  : isConfirmingActivate
                  ? '2.确认中...'
                  : isConfirmedActivate
                  ? '2.已激活'
                  : '2.激活链群'}
              </Button>
            </div>
          </form>
        </Form>

        {/* 小贴士（算法 + 数值） */}
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">小贴士</div>
          <div className="space-y-1 text-gray-600">
            <div>
              • 链群容量（质押容量）= 质押量 × 质押倍数（stakingMultiplier）
              {actionParams?.stakingMultiplier ? ` = 质押量 × ${actionParams.stakingMultiplier.toString()}` : ''}
            </div>
            <div>
              • 链群最大容量（理论）= expandableInfo.maxCapacity（链上计算）
              {maxCapacity !== undefined ? ` = ${formatTokenAmount(maxCapacity, 2)} ${token?.symbol}` : ''}
            </div>
            <div>
              • 最大质押量（本次可质押上限）= additionalStakeAllowed（链上返回）
              {additionalStakeAllowed !== undefined
                ? ` = ${formatTokenAmount(additionalStakeAllowed, 2)} ${token?.symbol}`
                : ''}
            </div>
            <div>
              • 最小质押量 = (totalSupply × minGovVoteRatioBps × capacityMultiplier / 1e4) / stakingMultiplier
              {actionParams?.minStake ? ` = ${formatTokenAmount(actionParams.minStake, 2)} ${token?.symbol}` : ''}
            </div>
            <div>
              • 激活链群最低治理占比：minGovVoteRatioBps
              {actionParams?.minGovVoteRatioBps !== undefined
                ? ` = ${formatBpsToPercent(actionParams.minGovVoteRatioBps)}`
                : ''}
            </div>
            <div>
              • 全局最大参与代币量：joinMaxAmount
              {actionParams?.joinMaxAmount !== undefined
                ? ` = ${formatTokenAmount(actionParams.joinMaxAmount, 2)} ${token?.symbol}`
                : ''}
            </div>
            <div>
              • 全局最小参与代币量：minJoinAmount
              {actionParams?.minJoinAmount !== undefined
                ? ` = ${formatTokenAmount(actionParams.minJoinAmount, 2)} ${token?.symbol}`
                : ''}
            </div>
            <div>
              • 最大质押量（理论上限）= expandableInfo.maxStake（链上计算）
              {maxStake !== undefined ? ` = ${formatTokenAmount(maxStake, 2)} ${token?.symbol}` : ''}
            </div>
            <div>
              • 当前质押量 = expandableInfo.currentStake
              {currentStake !== undefined ? ` = ${formatTokenAmount(currentStake, 2)} ${token?.symbol}` : ''}
            </div>
          </div>
        </div>

        {/* 说明 */}
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 激活说明</div>
          <div className="space-y-1 text-gray-600">
            <div>• 激活链群需要质押 {token?.symbol} 代币</div>
            <div>• 质押越多，链群容量越大</div>
            <div>• 激活后可以开始接受参与者加入</div>
          </div>
        </div>
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
