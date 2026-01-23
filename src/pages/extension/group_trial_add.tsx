// pages/extension/group_trial_add.tsx
// 增加体验地址页面

'use client';

import React, { useContext, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

import AlertBox from '@/src/components/Common/AlertBox';
import Header from '@/src/components/Header';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

import { useContractError } from '@/src/errors/useContractError';
import { parseUnits, formatTokenAmount } from '@/src/lib/format';
import { isValidEthAddress, normalizeAddressInput } from '@/src/lib/addressUtils';
import { getMaxJoinAmount } from '@/src/lib/extensionGroup';

import { useTrialAccountsWaitingAdd } from '@/src/hooks/extension/plugins/group/contracts/useGroupJoin';
import { useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite/useExtensionGroupDetail';
import { useActionInfo } from '@/src/hooks/contracts/useLOVE20Submit';
import { useExtensionByActionInfoWithCache } from '@/src/hooks/extension/base/composite/useExtensionsByActionInfosWithCache';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useApprove, useAllowance } from '@/src/hooks/contracts/useLOVE20Token';

const GROUP_JOIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;

type FormValues = {
  items: Array<{
    address: string;
    amount: string;
  }>;
};

const GroupTrialAddPage: React.FC = () => {
  const router = useRouter();
  const { groupId, actionId: actionIdParam } = router.query;
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();
  const hasCalledSuccessRef = useRef(false);

  // 从 query 获取必要参数
  const actionId = actionIdParam ? BigInt(actionIdParam as string) : undefined;
  const groupIdBigInt = groupId ? BigInt(groupId as string) : undefined;

  // 获取行动信息
  const {
    actionInfo,
    isPending: isPendingAction,
    error: errorAction,
  } = useActionInfo(token?.address as `0x${string}`, actionId || BigInt(0));

  // 获取扩展合约地址
  const {
    contractInfo,
    isPending: isPendingExtension,
    error: errorExtension,
  } = useExtensionByActionInfoWithCache({
    tokenAddress: token?.address as `0x${string}`,
    actionInfo,
  });
  const extensionAddress = contractInfo?.extension;

  // 获取链群详情
  const {
    groupDetail,
    isPending: isPendingGroupDetail,
    error: errorGroupDetail,
  } = useExtensionGroupDetail({
    extensionAddress: extensionAddress || ('0x0' as `0x${string}`),
    groupId: groupIdBigInt,
  });

  // 计算最大参与量
  const maxJoinResult = useMemo(() => {
    if (!groupDetail) return { amount: BigInt(0), reason: '' };
    return getMaxJoinAmount(groupDetail);
  }, [groupDetail]);

  // 动态创建 itemSchema，包含最小值和最大值验证
  const itemSchema = useMemo(
    () =>
      z.object({
        address: z.string().trim().min(1, '请输入地址'),
        amount: z
          .string()
          .trim()
          .refine((val) => !!val && !isNaN(Number(val)) && Number(val) > 0, { message: '请输入大于0的代币数量' })
          .refine(
            (val) => {
              if (!groupDetail) return true;
              const inputVal = parseUnits(val);
              return inputVal !== null && inputVal >= groupDetail.actualMinJoinAmount;
            },
            {
              message: `不能小于 ${groupDetail ? formatTokenAmount(groupDetail.actualMinJoinAmount, 2) : '0'}`,
            },
          )
          .refine(
            (val) => {
              if (!groupDetail) return true;
              // maxJoinResult.amount 为 0 表示不限，不需要做最大值校验
              if (maxJoinResult.amount <= BigInt(0)) return true;
              const inputVal = parseUnits(val);
              return inputVal !== null && inputVal <= maxJoinResult.amount;
            },
            {
              message: `不能大于 ${
                maxJoinResult.amount > BigInt(0) ? formatTokenAmount(maxJoinResult.amount, 2) : '不限'
              }`,
            },
          ),
      }),
    [groupDetail, maxJoinResult],
  );

  const {
    trialAccountsWaitingAdd,
    isPending: isPendingAdd,
    isConfirming: isConfirmingAdd,
    isConfirmed: isConfirmedAdd,
    writeError: errorAdd,
  } = useTrialAccountsWaitingAdd();

  // 代币授权相关
  const {
    approve,
    isPending: isPendingApprove,
    isConfirming: isConfirmingApprove,
    isConfirmed: isConfirmedApprove,
    writeError: errorApprove,
  } = useApprove(contractInfo?.joinedAmountTokenAddress as `0x${string}`);

  // 获取授权额度
  const {
    allowance,
    isPending: isPendingAllowance,
    error: errorAllowance,
    refetch: refetchAllowance,
  } = useAllowance(
    contractInfo?.joinedAmountTokenAddress as `0x${string}`,
    account as `0x${string}`,
    GROUP_JOIN_CONTRACT_ADDRESS,
    !!contractInfo?.joinedAmountTokenAddress && !!account && !!GROUP_JOIN_CONTRACT_ADDRESS,
  );

  const formSchema = useMemo(
    () =>
      z
        .object({
          items: z.array(itemSchema),
        })
        .refine(
          (data) => {
            const addresses = data.items.map((item) => item.address.toLowerCase().trim()).filter(Boolean);
            const uniqueAddresses = new Set(addresses);
            return addresses.length === uniqueAddresses.size;
          },
          {
            message: '存在重复的地址，请检查后再提交',
            path: ['root'],
          },
        ),
    [itemSchema],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [{ address: '', amount: '' }],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // 监听表单值变化 - 使用 useWatch 确保响应性
  const watchedItems = useWatch({
    control: form.control,
    name: 'items',
  });

  // 计算所有体验金额的总数
  const totalTrialAmount = useMemo(() => {
    if (!watchedItems || watchedItems.length === 0) return BigInt(0);
    const amounts = watchedItems.map((item) => {
      const amount = parseUnits(item?.amount || '0');
      return amount || BigInt(0);
    });
    return amounts.reduce((sum, amount) => sum + amount, BigInt(0));
  }, [watchedItems]);

  // 检查是否有任何数量输入框有输入（非空且不是纯空格）
  const hasAmountInput = useMemo(() => {
    if (!watchedItems || watchedItems.length === 0) return false;
    return watchedItems.some((item) => {
      const amount = item?.amount;
      return amount !== undefined && amount !== null && String(amount).trim() !== '';
    });
  }, [watchedItems]);

  // 显示提示的条件：有输入或总金额大于0
  const shouldShowAmountHint = hasAmountInput || totalTrialAmount > BigInt(0);

  // 检查是否已授权
  const isTokenApproved = useMemo(() => {
    if (!allowance || totalTrialAmount === BigInt(0)) return false;
    return allowance >= totalTrialAmount;
  }, [allowance, totalTrialAmount]);

  const { handleError } = useContractError();
  useEffect(() => {
    if (errorAction) handleError(errorAction);
    if (errorExtension) handleError(errorExtension);
    if (errorGroupDetail) handleError(errorGroupDetail);
    if (errorAdd) handleError(errorAdd);
    if (errorApprove) handleError(errorApprove);
    if (errorAllowance) handleError(errorAllowance);
  }, [errorAction, errorExtension, errorGroupDetail, errorAdd, errorApprove, errorAllowance, handleError]);

  // 监听授权成功
  useEffect(() => {
    if (isConfirmedApprove) {
      toast.success('授权成功');
      refetchAllowance();
    }
  }, [isConfirmedApprove, refetchAllowance]);

  useEffect(() => {
    if (isConfirmedAdd && !hasCalledSuccessRef.current) {
      hasCalledSuccessRef.current = true;
      toast.success('添加成功');
      // 返回体验列表页面
      router.push(
        `/extension/group_trial?groupId=${groupIdBigInt?.toString()}&actionId=${actionId?.toString()}&symbol=${
          token?.symbol
        }`,
      );
    }
  }, [isConfirmedAdd, router, groupIdBigInt, actionId, token?.symbol]);

  // 处理代币授权
  const handleApprove = async () => {
    if (!GROUP_JOIN_CONTRACT_ADDRESS || totalTrialAmount === BigInt(0)) {
      toast.error('请先添加体验地址和金额');
      return;
    }

    try {
      await approve(GROUP_JOIN_CONTRACT_ADDRESS, totalTrialAmount);
    } catch (error) {
      console.error('授权失败:', error);
    }
  };

  console.log('GROUP_JOIN_CONTRACT_ADDRESS', GROUP_JOIN_CONTRACT_ADDRESS);

  const onSubmit = async (values: FormValues) => {
    if (!extensionAddress || !groupIdBigInt) {
      toast.error('参数不完整');
      return;
    }

    // 检查是否已授权
    if (!isTokenApproved) {
      toast.error('请先完成代币授权');
      return;
    }

    const normalizedAddrs: string[] = [];
    const invalidIndices: number[] = [];

    values.items.forEach((item, index) => {
      const normalized = normalizeAddressInput(item.address);
      if (!normalized || !isValidEthAddress(normalized)) {
        invalidIndices.push(index);
      } else {
        normalizedAddrs.push(normalized);
      }
    });

    if (invalidIndices.length > 0) {
      form.setError('root', { message: '存在无效的地址格式，请检查并修正后再提交' });
      return;
    }

    const trialAccounts = normalizedAddrs.map((addr) => addr as `0x${string}`);
    const trialAmounts = values.items.map((item) => parseUnits(item.amount || '0'));

    const zeroAmountIndex = trialAmounts.findIndex((amount) => amount <= BigInt(0));
    if (zeroAmountIndex !== -1) {
      form.setError('root', { message: '体验代币数量必须大于0' });
      return;
    }

    await trialAccountsWaitingAdd(extensionAddress, groupIdBigInt, trialAccounts, trialAmounts);
  };

  if (!account) {
    return (
      <>
        <Header title="增加体验地址" showBackButton={true} />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="text-sm text-gray-500">请先连接钱包</div>
          </div>
        </main>
      </>
    );
  }

  if (isPendingAction || isPendingExtension || isPendingGroupDetail) {
    return (
      <>
        <Header title="增加体验地址" showBackButton={true} />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col items-center py-12">
              <LoadingIcon />
              <p className="mt-4 text-gray-600">加载中...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!actionInfo || !extensionAddress || !groupIdBigInt) {
    return (
      <>
        <Header title="增加体验地址" showBackButton={true} />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <AlertBox type="error" message="未找到行动或扩展信息" />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="增加体验地址" showBackButton={true} />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {form.formState.errors.root && (
                <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md border border-red-200">
                  {form.formState.errors.root.message}
                </div>
              )}

              {/* 添加体验地址 */}
              <div>
                <LeftTitle title="增加新的体验地址" />
                <table className="table w-full mt-6">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-1 text-left w-12">No</th>
                      <th className="px-1 text-left min-w-[200px]">地址</th>
                      <th className="px-1 text-right w-28">体验代币数量</th>
                      <th className="px-1 text-right"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-sm text-greyscale-400 p-4">
                          暂无体验地址，点击下方按钮添加
                        </td>
                      </tr>
                    ) : (
                      fields.map((field, index) => (
                        <tr key={field.id} className="border-b border-gray-100">
                          <td className="px-1">{index + 1}</td>
                          <td className="px-1 min-w-[200px]">
                            <FormField
                              control={form.control}
                              name={`items.${index}.address`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      placeholder="0x..."
                                      {...field}
                                      className="font-mono text-sm h-8 px-1 sm:px-2 w-full"
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="px-1 text-right w-20">
                            <FormField
                              control={form.control}
                              name={`items.${index}.amount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      step="any"
                                      placeholder="0"
                                      {...field}
                                      className="h-8 px-1 sm:px-2 text-right w-full"
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="px-0 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              className="h-8 w-8 px-0 mx-0"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div className="flex justify-center mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-1/2 text-secondary border-secondary"
                    onClick={() => append({ address: '', amount: '' })}
                  >
                    <Plus className="w-4 h-4 mr-2" /> 增加体验地址
                  </Button>
                </div>

                {/* 参与范围提示 */}
                {groupDetail && (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span>体验代币数量范围：</span>
                      <span className="font-mono text-secondary">
                        {formatTokenAmount(groupDetail.actualMinJoinAmount, 2)} ~{' '}
                        {maxJoinResult.amount > BigInt(0) ? formatTokenAmount(maxJoinResult.amount) : '不限'}
                      </span>
                    </div>
                    {maxJoinResult.reason && maxJoinResult.amount && (
                      <div className="text-xs text-gray-500 mt-1">限制: {maxJoinResult.reason}</div>
                    )}
                  </div>
                )}
              </div>

              {/* 授权和提交按钮 */}
              <div className="flex space-x-4 w-full mt-8">
                <Button
                  type="button"
                  onClick={handleApprove}
                  className="w-1/2"
                  disabled={
                    isPendingApprove || isConfirmingApprove || isTokenApproved || totalTrialAmount === BigInt(0)
                  }
                >
                  {isPendingApprove
                    ? '1.提交中...'
                    : isConfirmingApprove
                    ? '1.确认中...'
                    : isTokenApproved
                    ? '1.代币已授权'
                    : '1.代币授权'}
                </Button>

                <Button type="submit" className="w-1/2" disabled={isPendingAdd || isConfirmingAdd || !isTokenApproved}>
                  {isPendingAdd ? '2.提交中...' : isConfirmingAdd ? '2.确认中...' : '2.提交'}
                </Button>
              </div>
              {/* 授权金额提示 */}
              {shouldShowAmountHint && (
                <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded px-3 py-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span>需质押代币：</span>
                    <span>
                      <span className="font-mono text-secondary mr-2">{formatTokenAmount(totalTrialAmount)}</span>
                      <span className="text-greyscale-500">{contractInfo?.joinedAmountTokenSymbol || ''}</span>
                    </span>
                  </div>
                </div>
              )}
            </form>
          </Form>

          <LoadingOverlay
            isLoading={isPendingAdd || isConfirmingAdd || isPendingApprove || isConfirmingApprove}
            text={
              isPendingApprove
                ? '正在提交授权...'
                : isConfirmingApprove
                ? '正在确认授权...'
                : isPendingAdd
                ? '正在提交...'
                : '正在确认...'
            }
          />
        </div>
      </main>
    </>
  );
};

export default GroupTrialAddPage;
