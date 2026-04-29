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
import { useGroupNamesWithCache } from '@/src/hooks/extension/base/composite/useGroupNamesWithCache';
import { useFormatLPSymbol } from '@/src/hooks/extension/base/composite/useFormatLPSymbol';
import { useExtensionActionParam } from '@/src/hooks/extension/plugins/group/composite';
import {
  useActivateGroup,
  useActiveGroupIdsByOwner,
} from '@/src/hooks/extension/plugins/group/contracts/useGroupManager';
import { useValidGovVotes, useGovVotesNum } from '@/src/hooks/contracts/useLOVE20Stake';

// 工具函数
import { formatTokenAmount, formatPercentage, parseUnits } from '@/src/lib/format';
import { defaultGroupActivationFormValues } from '@/src/lib/groupActivationDefaults';

// 组件
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import _GroupActionTips from './_GroupActionTips';
import _GroupTokenApproveButtons from './_GroupTokenApproveButtons';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const AMOUNT_INPUT_PATTERN = /^\d+(\.\d+)?$/;
const INTEGER_INPUT_PATTERN = /^\d+$/;

const normalizeTokenAmountInput = (value: string) => value.replace(/,/g, '').trim();

const isValidTokenAmountInput = (value: string, allowZero: boolean) => {
  const normalizedValue = normalizeTokenAmountInput(value);
  if (!normalizedValue || !AMOUNT_INPUT_PATTERN.test(normalizedValue)) return false;

  const decimals = parseInt(process.env.NEXT_PUBLIC_TOKEN_DECIMALS || '18', 10);
  const fractionDigits = normalizedValue.split('.')[1]?.length || 0;
  if (fractionDigits > decimals) return false;

  const amount = parseUnits(normalizedValue);
  return allowZero ? amount >= BigInt(0) : amount > BigInt(0);
};

interface GroupOPActivateProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupId?: bigint;
}

const getSafeReturnPath = (returnTo: string | string[] | undefined) => {
  const path = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  if (!path || !path.startsWith('/') || path.startsWith('//')) return undefined;
  return path;
};

const _GroupOPActivate: React.FC<GroupOPActivateProps> = ({ actionId, actionInfo, extensionAddress, groupId }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();
  const mintGroupHref = `/group/mint?returnTo=${encodeURIComponent(router.asPath)}`;
  const returnPath = getSafeReturnPath(router.query.returnTo);

  // 如果没有传入 groupId，需要从用户的 group NFT 中选择
  const { myGroups, isPending: isPendingGroups, error: errorGroups } = useMyGroups(account);
  const [selectedGroupId, setSelectedGroupId] = useState<bigint | undefined>(groupId);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // 如果传入了 groupId，直接使用；否则使用选中的 groupId
  const finalGroupId = groupId || selectedGroupId;
  const directGroupIds = useMemo(() => (groupId ? [groupId] : undefined), [groupId]);
  const {
    groupNameMap: directGroupNameMap,
    isPending: isPendingDirectGroupName,
  } = useGroupNamesWithCache({
    groupIds: directGroupIds,
    enabled: !!groupId,
  });
  const directGroupName = groupId ? directGroupNameMap.get(groupId) : undefined;

  // 获取已经激活的 groupId 列表
  const {
    activeGroupIds: activatedGroupIds,
    isPending: isPendingActivatedGroups,
    error: errorActivatedGroups,
  } = useActiveGroupIdsByOwner(extensionAddress, (account || ZERO_ADDRESS) as `0x${string}`);

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

  // 格式化 joinTokenSymbol（如果是 LP 代币，会格式化为 LP(token0,token1)）
  const { formattedSymbol: formattedJoinTokenSymbol, isPending: isPendingFormattedSymbol } = useFormatLPSymbol({
    tokenAddress: actionParams?.joinTokenAddress,
    tokenSymbol: actionParams?.joinTokenSymbol,
    enabled: !!actionParams?.joinTokenAddress,
  });

  // 获取固定的质押量要求（用于授权）
  const stakeAmount = actionParams?.groupActivationStakeAmount || BigInt(0);

  // 获取用户治理票占比（用于验证最小治理票比例）
  const { validGovVotes: userGovVotes } = useValidGovVotes(
    (actionParams?.tokenAddress || ZERO_ADDRESS) as `0x${string}`,
    (account || ZERO_ADDRESS) as `0x${string}`,
    !!actionParams?.tokenAddress && !!account,
  );
  const { govVotesNum: totalGovVotes } = useGovVotesNum((actionParams?.tokenAddress || ZERO_ADDRESS) as `0x${string}`);

  // 计算用户治理票占比（wei 格式，1e18 = 100%）
  const userGovRatio = useMemo(() => {
    if (!userGovVotes || !totalGovVotes || totalGovVotes === BigInt(0)) return BigInt(0);
    // 计算 (userGovVotes * 1e18) / totalGovVotes
    return (userGovVotes * BigInt(10 ** 18)) / totalGovVotes;
  }, [userGovVotes, totalGovVotes]);

  // 获取最小治理票比例要求
  const minGovRatio = actionParams?.activationMinGovRatio || BigInt(0);

  // 判断治理票占比是否不足
  const isGovRatioInsufficient = userGovRatio < minGovRatio;

  // 获取用户余额（用于授权验证）
  const {
    balance: userBalance,
    isPending: isPendingBalance,
    error: errorBalance,
  } = useBalanceOf(
    (actionParams?.tokenAddress || ZERO_ADDRESS) as `0x${string}`,
    (account || ZERO_ADDRESS) as `0x${string}`,
    !!actionParams?.tokenAddress && !!account,
  );

  // 表单验证
  const formSchema = useMemo(
    () =>
      z
        .object({
          maxCapacity: z.string().refine(
            (val) => {
              const normalizedValue = normalizeTokenAmountInput(val);
              if (!normalizedValue || normalizedValue === '0') return true;
              return isValidTokenAmountInput(val, true);
            },
            { message: '请输入有效的容量上限' },
          ),
          description: z
            .string()
            .trim()
            .min(1, { message: '链群描述不能为空' })
            .max(2000, { message: '描述不能超过2000字' }),
          minJoinAmount: z
            .string()
            .refine(
              (val) => {
                if (!val || val.trim() === '') return false;
                if (normalizeTokenAmountInput(val) === '0') return false;
                return isValidTokenAmountInput(val, false);
              },
              { message: '最小参与代币数不能为空且必须大于0' },
            )
            .superRefine((val, ctx) => {
              if (!val || val === '0') {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: '最小参与代币数不能为0',
                });
                return;
              }
              const amount = parseUnits(normalizeTokenAmountInput(val));
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
                const normalizedValue = normalizeTokenAmountInput(val);
                if (!normalizedValue || normalizedValue === '0') return true;
                return isValidTokenAmountInput(val, true);
              },
              { message: '请输入有效的代币数' },
            )
            .superRefine((val, ctx) => {
              if (!val || val === '0') return;
              const amount = parseUnits(normalizeTokenAmountInput(val));
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
              const normalizedValue = val.trim();
              if (!normalizedValue || normalizedValue === '0') return true;
              return INTEGER_INPUT_PATTERN.test(normalizedValue);
            },
            { message: '请输入有效的非负整数' },
          ),
        })
        .refine(
          (data) => {
            // 交叉验证：最大参与量不能小于最小参与量（最小参与量必须大于0，最大参与量为0表示无限制）
            const minAmount = parseUnits(normalizeTokenAmountInput(data.minJoinAmount || '0'));
            const maxAmount = parseUnits(normalizeTokenAmountInput(data.maxJoinAmount || '0'));
            // 如果最大参与量不为0（有限制），则必须大于等于最小参与量
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
    defaultValues: defaultGroupActivationFormValues,
    mode: 'onChange',
  });

  const {
    allowance,
    isPending: isPendingAllowance,
    error: errorAllowance,
    refetch: refetchAllowance,
  } = useAllowance(
    (actionParams?.tokenAddress || ZERO_ADDRESS) as `0x${string}`,
    (account || ZERO_ADDRESS) as `0x${string}`,
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`,
    !!actionParams?.tokenAddress && !!account,
  );

  const isTokenApproved = allowance !== undefined && allowance >= stakeAmount;

  // 授权
  const {
    approve,
    isPending: isPendingApprove,
    isConfirming: isConfirmingApprove,
    isConfirmed: isConfirmedApprove,
  } = useApprove((actionParams?.tokenAddress || ZERO_ADDRESS) as `0x${string}`);

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
  } = useActivateGroup();

  async function handleActivate(values: FormValues) {
    if (!actionParams) {
      toast.error('扩展协议参数未加载完成');
      return;
    }

    if (!finalGroupId) {
      toast.error('点击选择NFT');
      return;
    }

    if (!isTokenApproved) {
      toast.error('请先授权质押代币');
      return;
    }

    // 检查治理票占比是否不足
    if (isGovRatioInsufficient) {
      toast.error('治理票占比不足，无法激活链群');
      return;
    }

    // 转换参数为 BigInt（formSchema 已经完成验证）
    const maxCapacityValue = normalizeTokenAmountInput(values.maxCapacity);
    const minJoinAmountValue = normalizeTokenAmountInput(values.minJoinAmount);
    const maxJoinAmountValue = normalizeTokenAmountInput(values.maxJoinAmount);
    const maxAccountsValue = values.maxAccounts.trim();
    const maxCapacityBigInt = maxCapacityValue ? parseUnits(maxCapacityValue) : BigInt(0);
    // 最小参与代币数不能为0，必须提供有效值
    if (!minJoinAmountValue || minJoinAmountValue === '0') {
      toast.error('最小参与代币数不能为0');
      return;
    }
    const minJoinAmountBigInt = parseUnits(minJoinAmountValue);
    if (minJoinAmountBigInt <= BigInt(0)) {
      toast.error('最小参与代币数必须大于0');
      return;
    }
    const maxJoinAmountBigInt = maxJoinAmountValue ? parseUnits(maxJoinAmountValue) : BigInt(0);
    // maxAccounts 是地址数量（整数），不是代币数量，所以直接转换为 BigInt
    const maxAccountsBigInt = maxAccountsValue && maxAccountsValue !== '0' ? BigInt(maxAccountsValue) : BigInt(0);

    try {
      await activateGroup(
        extensionAddress,
        finalGroupId,
        values.description.trim(),
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
      setIsRedirecting(true); // 标记为跳转中
      setTimeout(() => {
        router.replace(returnPath || `/action/info/?id=${actionId.toString()}&symbol=${token?.symbol}&tab=group-manage`);
      }, 1500);
    }
  }, [isConfirmedActivate, router, returnPath, actionId, token?.symbol]);

  // 错误处理

  if (
    isPendingActionParams ||
    isPendingBalance ||
    isPendingFormattedSymbol ||
    (groupId && isPendingDirectGroupName) ||
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
  // 在跳转中时不显示"没有可用链群"提示，保持显示表单界面
  if (!isPendingActivate && !isRedirecting && !groupId && (!availableGroups || availableGroups.length === 0)) {
    return (
      <div className="text-center py-12">
        <p className="mb-2 text-gray-700 font-medium">当前账号没有可在该行动下激活的 NFT</p>
        <p className="mb-4 text-sm text-gray-500">
          {myGroups && myGroups.length > 0
            ? '已有 NFT 都已在该行动下激活。请先铸造一个新的链上社群名字 NFT。'
            : '请先铸造一个属于链上社群名字的 NFT，再回来激活该行动。'}
        </p>
        <p className="mb-4">
          <Link href={mintGroupHref}>
            <Button variant="outline" className="w-1/2 text-secondary border-secondary">
              去铸造链群 NFT &gt;&gt;
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

        {/* 治理票占比不足的警告 */}
        {isGovRatioInsufficient && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            <div className="font-medium">⚠️ 治理票占比不足</div>
            <div className="mt-1">
              你的治理票占比{' '}
              <span className="font-semibold">{formatPercentage((Number(userGovRatio) * 100) / 1e18)}</span>{' '}
              低于最小限制 <span className="font-semibold">{formatPercentage((Number(minGovRatio) * 100) / 1e18)}</span>
              ，无法激活链群。
            </div>
            <div className="text-xs text-red-600 mt-1">您可以增加治理票数，再尝试激活链群。</div>
          </div>
        )}

        {/* 已从上个页面指定待激活 NFT */}
        {groupId && (
          <div className="space-y-2">
            <label className="text-sm font-medium">（必填）待激活NFT</label>
            <div className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="text-gray-500 text-xs">#</span>
              <span className="text-secondary font-semibold">{groupId.toString()}</span>
              <span className="min-w-0 truncate text-greyscale-800">{directGroupName || '未命名链群'}</span>
            </div>
          </div>
        )}

        {/* 链群选择器（如果没有传入 groupId） */}
        {!groupId && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">（必填）选择一个代表链群的NFT</label>
              <Button asChild variant="outline" size="sm" className="shrink-0 text-secondary border-secondary">
                <Link href={mintGroupHref}>铸造新NFT</Link>
              </Button>
            </div>
            <Select
              value={selectedGroupId?.toString() || ''}
              onValueChange={(value) => setSelectedGroupId(BigInt(value))}
            >
              <SelectTrigger className="!ring-secondary-foreground">
                <SelectValue placeholder="点击选择NFT" />
              </SelectTrigger>
              <SelectContent>
                {availableGroups?.map((group) => (
                  <SelectItem key={group.tokenId.toString()} value={group.tokenId.toString()}>
                    {group.groupName || `链群 #${group.tokenId.toString()}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedGroupId && <p className="text-xs text-red-500">请选择一个NFT</p>}
          </div>
        )}
        {/* 表单 */}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* 链群描述 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>（必填）链群描述</FormLabel>
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
                  <FormLabel>
                    （必填）单地址最小参与代币数{' '}
                    <span className="text-gray-500 text-xs font-normal">{formattedJoinTokenSymbol}</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="请填写数量，必须大于0" className="!ring-secondary-foreground" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">最小参与代币数必须大于0</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 链群容量上限 */}
            <FormField
              control={form.control}
              name="maxCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    （可选）链群容量上限{' '}
                    <span className="text-gray-500 text-xs font-normal">{formattedJoinTokenSymbol}</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="0 为不限制" className="!ring-secondary-foreground flex-1" {...field} />
                  </FormControl>
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
                  <FormLabel>
                    （可选）单地址最大参与代币数{' '}
                    <span className="text-gray-500 text-xs font-normal">{formattedJoinTokenSymbol}</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="0 为不做限制" className="!ring-secondary-foreground" {...field} />
                  </FormControl>
                  {actionParams?.joinMaxAmount && actionParams.joinMaxAmount > BigInt(0) && (
                    <FormDescription className="text-xs">
                      扩展行动当前最大参与量：{formatTokenAmount(actionParams.joinMaxAmount)}
                    </FormDescription>
                  )}
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
                  <FormLabel>（可选）行动者最大地址数</FormLabel>
                  <FormControl>
                    <Input placeholder="0 为不做限制" className="!ring-secondary-foreground" {...field} />
                  </FormControl>
                  {/* <FormDescription className="text-xs">设置为0表示不做限制</FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 质押代币提醒 */}
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
                <span className="flex items-center gap-1">
                  {formatTokenAmount(stakeAmount, 4, 'ceil')}{' '}
                  <span className="text-sm text-gray-600">{actionParams?.stakeTokenSymbol}</span>
                </span>
              </div>
              <div
                className={`text-xs mt-1 ${
                  userBalance !== undefined && userBalance < stakeAmount ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                当前余额：{formatTokenAmount(userBalance || BigInt(0))}
              </div>
              {userBalance !== undefined && userBalance < stakeAmount && (
                <div className="text-xs text-red-700 font-medium mt-2">⚠️ 余额不足，无法激活链群</div>
              )}
            </div>

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
              disableApprove={isGovRatioInsufficient}
              disableAction={
                !finalGroupId || (userBalance !== undefined && userBalance < stakeAmount) || isGovRatioInsufficient
              }
            />
          </form>
        </Form>
        {/* 小贴士（算法 + 数值） */}
        <_GroupActionTips
          activationMinGovRatio={actionParams?.activationMinGovRatio}
          maxJoinAmountRatio={actionParams?.maxJoinAmountRatio}
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
