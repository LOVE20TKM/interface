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
import { useMyGroups } from '@/src/hooks/extension/base/composite/useMyGroups';
import { useExtensionActionParam } from '@/src/hooks/extension/plugins/group/composite';
import {
  useActivateGroup,
  useActiveGroupIdsByOwner,
  useMaxVerifyCapacityByOwner,
} from '@/src/hooks/extension/plugins/group/contracts/useLOVE20GroupManager';

// 工具函数
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatTokenAmount, parseUnits } from '@/src/lib/format';

// 组件
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import _GroupActionTips from './_GroupActionTips';
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

  // 获取固定的质押量要求（用于授权）
  const stakeAmount = actionParams?.groupActivationStakeAmount || BigInt(0);

  // 获取服务者的最大容量上限
  const {
    maxVerifyCapacity,
    isPending: isPendingMaxCapacity,
    error: errorMaxCapacity,
  } = useMaxVerifyCapacityByOwner(
    (actionParams?.tokenAddress || (token?.address as `0x${string}`) || ZERO_ADDRESS) as `0x${string}`,
    actionId,
    (account || ZERO_ADDRESS) as `0x${string}`,
  );

  // 获取用户余额（用于授权验证）
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
          maxAccounts: z.string().refine(
            (val) => {
              if (!val || val === '0') return true;
              const num = parseInt(val, 10);
              return !isNaN(num) && num >= 0 && Number.isInteger(num);
            },
            { message: '请输入有效的非负整数' },
          ),
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
      maxAccounts: '',
    },
    mode: 'onChange',
  });

  // 授权检查 - 使用固定的质押量
  const maxCapacity = form.watch('maxCapacity');
  const maxCapacityBigInt = maxCapacity ? parseUnits(maxCapacity) : BigInt(0);

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

  const isTokenApproved = allowance !== undefined && allowance >= stakeAmount;

  // 授权
  const {
    approve,
    isPending: isPendingApprove,
    isConfirming: isConfirmingApprove,
    isConfirmed: isConfirmedApprove,
    writeError: errorApprove,
  } = useApprove((actionParams?.stakeTokenAddress || ZERO_ADDRESS) as `0x${string}`);

  async function handleApprove(values: FormValues) {
    if (!stakeAmount || stakeAmount === BigInt(0)) {
      toast.error('激活需质押代币数量未设置');
      return;
    }

    // 验证余额是否足够
    if (userBalance !== undefined && userBalance < stakeAmount) {
      toast.error(`余额不足，需要 ${formatTokenAmount(stakeAmount)} ${token?.symbol}`);
      return;
    }

    try {
      await approve(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`, stakeAmount);
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
    const maxCapacityBigInt = values.maxCapacity ? parseUnits(values.maxCapacity) : BigInt(0);
    const minJoinAmountBigInt = values.minJoinAmount ? parseUnits(values.minJoinAmount) : BigInt(0);
    const maxJoinAmountBigInt = values.maxJoinAmount ? parseUnits(values.maxJoinAmount) : BigInt(0);
    // maxAccounts 是地址数量（整数），不是代币数量，所以直接转换为 BigInt
    const maxAccountsBigInt =
      values.maxAccounts && values.maxAccounts !== '0' ? BigInt(parseInt(values.maxAccounts, 10)) : BigInt(0);

    try {
      await activateGroup(
        actionParams.tokenAddress as `0x${string}`,
        actionId,
        finalGroupId,
        values.description,
        maxCapacityBigInt,
        minJoinAmountBigInt,
        maxJoinAmountBigInt,
        maxAccountsBigInt,
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

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorActionParams) handleContractError(errorActionParams, 'extension');
    if (errorMaxCapacity) handleContractError(errorMaxCapacity, 'extension');
    if (errorBalance) handleContractError(errorBalance, 'token');
    if (errorAllowance) handleContractError(errorAllowance, 'token');
    if (errorApprove) handleContractError(errorApprove, 'token');
    if (errorActivate) handleContractError(errorActivate, 'extension');
    if (errorGroups) handleContractError(errorGroups, 'group');
    if (errorActivatedGroups) handleContractError(errorActivatedGroups, 'extension');
  }, [
    errorActionParams,
    errorMaxCapacity,
    errorBalance,
    errorAllowance,
    errorApprove,
    errorActivate,
    errorGroups,
    errorActivatedGroups,
    handleContractError,
  ]);

  if (
    isPendingActionParams ||
    isPendingMaxCapacity ||
    isPendingBalance ||
    (!groupId && (isPendingGroups || isPendingActivatedGroups))
  ) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载参数中...</p>
      </div>
    );
  }

  // 如果没有传入 groupId 且没有可用的 group（考虑已过滤的可用链群）
  if (!isPendingActivate && !groupId && (!availableGroups || availableGroups.length === 0)) {
    return (
      <div className="text-center py-12">
        <p className="mb-4">
          {myGroups && myGroups.length > 0 ? '您的所有链群已激活，没有未激活链群' : '您当前没有未激活的链群ID'}
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
      <div className="space-y-4">
        <div>
          <LeftTitle title="激活链群" />
        </div>
        <div
          className={`p-4 border rounded-lg ${
            userBalance !== undefined && userBalance < stakeAmount
              ? 'bg-red-50 border-red-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <div
            className={`text-sm mb-1 ${
              userBalance !== undefined && userBalance < stakeAmount ? 'text-red-800' : 'text-gray-800'
            }`}
          >
            激活链群需质押代币：
          </div>
          <div
            className={`text-lg font-semibold ${
              userBalance !== undefined && userBalance < stakeAmount ? 'text-red-900' : 'text-blue-900'
            }`}
          >
            {formatTokenAmount(stakeAmount, 4, 'ceil')} <span className="text-sm text-gray-600">{token?.symbol}</span>
          </div>
          <div
            className={`text-xs mt-1 ${
              userBalance !== undefined && userBalance < stakeAmount ? 'text-red-600' : 'text-gray-600'
            }`}
          >
            当前余额：{formatTokenAmount(userBalance || BigInt(0))} {token?.symbol}
          </div>
          {userBalance !== undefined && userBalance < stakeAmount && (
            <div className="text-xs text-red-700 font-medium mt-2">⚠️ 余额不足，无法激活链群</div>
          )}
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
            {/* 链群容量上限 */}
            <FormField
              control={form.control}
              name="maxCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>链群容量上限 ({token?.symbol})</FormLabel>
                  <FormControl>
                    <Input placeholder="请填写数量" className="!ring-secondary-foreground flex-1" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    当前您的最大容量为 {formatTokenAmount(maxVerifyCapacity || BigInt(0))} {token?.symbol}
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
                      placeholder="例如：一些注意事项，以及如何联系到链群服务者，如何加入所在链群的行动者群（例如：QQ 群、微信验证群）等"
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
                    <Input placeholder="请填写数量" className="!ring-secondary-foreground" {...field} />
                  </FormControl>
                  {/* <FormDescription className="text-xs">设置为0表示任何大于0的参与量都可以</FormDescription> */}
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
                    <Input placeholder="0 为不做限制" className="!ring-secondary-foreground" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    扩展行动默认值当前最大参与量：{formatTokenAmount(actionParams.joinMaxAmount)} {token?.symbol}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 行动者最大地址数 */}
            <FormField
              control={form.control}
              name="maxAccounts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>行动者最大地址数</FormLabel>
                  <FormControl>
                    <Input placeholder="0 为不做限制" className="!ring-secondary-foreground" {...field} />
                  </FormControl>
                  {/* <FormDescription className="text-xs">设置为0表示不做限制</FormDescription> */}
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
              disableAction={!finalGroupId || (userBalance !== undefined && userBalance < stakeAmount)}
            />
          </form>
        </Form>
        {/* 小贴士（算法 + 数值） */}
        <_GroupActionTips
          verifyCapacityMultiplier={actionParams?.verifyCapacityMultiplier}
          maxJoinAmountMultiplier={actionParams?.maxJoinAmountMultiplier}
          joinMaxAmount={actionParams?.joinMaxAmount}
          groupActivationStakeAmount={actionParams?.groupActivationStakeAmount}
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
