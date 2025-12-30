// components/Extension/Plugins/Group/_GroupJoinSubmit.tsx
// 第二步：确认加入链群

'use client';

// React
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';

// Next.js
import { useRouter } from 'next/router';

// 第三方库
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { useAccount } from 'wagmi';
import { z } from 'zod';

// UI 组件
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';
import { useError } from '@/src/contexts/ErrorContext';

// hooks
import { useAllowance, useApprove, useBalanceOf } from '@/src/hooks/contracts/useLOVE20Token';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';
import { useIsActionIdVoted } from '@/src/hooks/contracts/useLOVE20Vote';
import { useAccountVerificationInfos } from '@/src/hooks/extension/base/composite';
import { useExtensionActionConstCache, useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite';
import { useJoin, useJoinInfo } from '@/src/hooks/extension/plugins/group/contracts/useGroupJoin';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';
import { formatTokenAmount, formatUnits, parseUnits } from '@/src/lib/format';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import _GroupParticipationStats from './_GroupParticipationStats';

interface FormValues {
  joinAmount: string;
  verificationInfos: string[]; // 验证信息数组
}

interface GroupJoinSubmitProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupId: bigint;
}

const GROUP_JOIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;

const _GroupJoinSubmit: React.FC<GroupJoinSubmitProps> = ({ actionId, actionInfo, extensionAddress, groupId }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();
  const { setError } = useError();

  // 获取当前轮次
  const { currentRound, isPending: isPendingCurrentRound, error: errorCurrentRound } = useCurrentRound();

  // 获取行动是否已投票
  const {
    isActionIdVoted,
    isPending: isPendingVoted,
    error: errorVoted,
  } = useIsActionIdVoted(token?.address as `0x${string}`, currentRound || BigInt(0), actionId);

  // 获取扩展常量数据（包括 joinTokenAddress 和 joinTokenSymbol）
  const {
    constants,
    isPending: isPendingConstants,
    error: errorConstants,
  } = useExtensionActionConstCache({ extensionAddress, actionId });

  const joinTokenAddress = constants?.joinTokenAddress;
  const joinTokenSymbol = constants?.joinTokenSymbol;

  // 获取加入信息
  const {
    amount: joinedAmount,
    isPending: isPendingJoinInfo,
    error: errorJoinInfo,
  } = useJoinInfo(token?.address as `0x${string}`, actionId, account as `0x${string}`);

  // 判断是否已加入
  const isJoined = joinedAmount && joinedAmount > BigInt(0);

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

  // 计算还可以追加的代币数量（仅在追加参与时使用）
  // remainingQuota = min(actualMaxJoinAmount - joinedAmount, remainingCapacity)
  const remainingQuota = useMemo(() => {
    if (!isJoined || !groupDetail || !joinedAmount) {
      return BigInt(0);
    }
    const maxByLimit = groupDetail.actualMaxJoinAmount - joinedAmount;
    const maxByCapacity = groupDetail.remainingCapacity;
    return maxByLimit < maxByCapacity ? maxByLimit : maxByCapacity;
  }, [isJoined, groupDetail, joinedAmount]);

  // 判断链群是否已满（仅在首次加入时检查）
  const isGroupFull = useMemo(() => {
    if (isJoined || !groupDetail) return false;
    return groupDetail.remainingCapacity <= BigInt(0);
  }, [isJoined, groupDetail]);

  // 判断是否有投票（需要等待数据加载完成）
  const hasVotes = useMemo(() => {
    if (isPendingCurrentRound || isPendingVoted) return true; // 加载中时默认允许，避免误判
    return isActionIdVoted === true;
  }, [isPendingCurrentRound, isPendingVoted, isActionIdVoted]);

  // 获取代币余额
  const { balance, error: errorBalance } = useBalanceOf(
    joinTokenAddress as `0x${string}`,
    account as `0x${string}`,
    !!joinTokenAddress && !!account,
  );

  // 获取已授权数量
  const {
    allowance,
    isPending: isPendingAllowance,
    error: errorAllowance,
    refetch: refetchAllowance,
  } = useAllowance(
    joinTokenAddress as `0x${string}`,
    account as `0x${string}`,
    GROUP_JOIN_CONTRACT_ADDRESS,
    !!joinTokenAddress && !!account,
  );

  // 获取已填写的验证信息
  const verificationKeys = actionInfo?.body?.verificationKeys as string[] | undefined;
  const {
    verificationInfos: existingVerificationInfos,
    isPending: isPendingVerificationInfos,
    error: errorVerificationInfos,
  } = useAccountVerificationInfos({
    account: account as `0x${string}`,
    tokenAddress: token?.address as `0x${string}`,
    actionId,
    verificationKeys,
  });

  // 授权状态
  const [isTokenApproved, setIsTokenApproved] = useState(false);

  // 动态构造 zod schema
  const formSchema = z.object({
    joinAmount: z
      .string()
      .refine((val) => val.trim() === '' || /^[0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?$/.test(val.trim()), {
        message: '请输入合法的数字格式',
      })
      .transform((val) => (val.trim() === '' ? '0' : val.trim().replace(/,/g, '')))
      .refine((val) => val !== '0', { message: '参与代币数不能为 0' })
      .refine(
        (val) => {
          const inputVal = parseUnits(val);
          return inputVal !== null && balance !== undefined && inputVal <= balance;
        },
        { message: '您的代币余额不足' },
      )
      .refine(
        (val) => {
          // 追加参与时跳过最小值检查（已满足首次要求）
          if (isJoined) return true;
          if (!groupDetail) return true;
          const inputVal = parseUnits(val);
          return inputVal !== null && inputVal >= groupDetail.actualMinJoinAmount;
        },
        {
          message: `参与代币数不能小于最小值 ${
            groupDetail ? formatTokenAmount(groupDetail.actualMinJoinAmount, 2) : '0'
          }`,
        },
      )
      .refine(
        (val) => {
          if (!groupDetail) return true;
          const inputVal = parseUnits(val);

          if (isJoined) {
            // 追加参与：使用剩余配额
            return inputVal !== null && inputVal <= remainingQuota;
          } else {
            // 首次加入：实际上限 = min(行动上限, 群上限, 链群剩余容量)
            const effectiveMaxAmount =
              groupDetail.actualMaxJoinAmount < groupDetail.remainingCapacity
                ? groupDetail.actualMaxJoinAmount
                : groupDetail.remainingCapacity;
            return inputVal !== null && inputVal <= effectiveMaxAmount;
          }
        },
        {
          message: `参与代币数不能大于最大值 ${
            groupDetail
              ? isJoined
                ? formatTokenAmount(remainingQuota, 2)
                : formatTokenAmount(
                    groupDetail.actualMaxJoinAmount < groupDetail.remainingCapacity
                      ? groupDetail.actualMaxJoinAmount
                      : groupDetail.remainingCapacity,
                    2,
                  )
              : '0'
          }`,
        },
      ),
    // 验证信息数组（如果有验证字段）
    verificationInfos: z.array(z.string().min(1, { message: '验证信息不能为空' })),
  });

  // 表单实例
  const defaultVerificationInfos = verificationKeys ? verificationKeys.map(() => '') : [];
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      joinAmount: '',
      verificationInfos: defaultVerificationInfos,
    },
    mode: 'onChange',
  });

  // 当已有验证信息加载完成时，更新表单默认值
  useEffect(() => {
    if (!isPendingVerificationInfos && existingVerificationInfos && verificationKeys) {
      const updatedInfos = verificationKeys.map((key, index) => existingVerificationInfos[index] || '');
      form.setValue('verificationInfos', updatedInfos);
    }
  }, [isPendingVerificationInfos, existingVerificationInfos, verificationKeys, form]);

  // 授权
  const {
    approve,
    isPending: isPendingApprove,
    isConfirming: isConfirmingApprove,
    isConfirmed: isConfirmedApprove,
    writeError: errorApprove,
  } = useApprove(joinTokenAddress as `0x${string}`);

  const approveButtonRef = useRef<HTMLButtonElement>(null);
  const prevIsPendingAllowanceRef = useRef(isPendingAllowance);

  useEffect(() => {
    if (prevIsPendingAllowanceRef.current && !isPendingAllowance && approveButtonRef.current) {
      approveButtonRef.current.blur();
    }
    prevIsPendingAllowanceRef.current = isPendingAllowance;
  }, [isPendingAllowance]);

  async function handleApprove(values: FormValues) {
    const joinAmount = parseUnits(values.joinAmount) ?? BigInt(0);
    if (joinAmount === BigInt(0)) {
      toast.error('当前无需授权');
      return;
    }

    try {
      await approve(GROUP_JOIN_CONTRACT_ADDRESS, joinAmount);
    } catch (error) {
      console.error('Approve failed', error);
    }
  }

  useEffect(() => {
    if (isConfirmedApprove) {
      setIsTokenApproved(true);
      toast.success('授权代币成功');
      // 授权成功后，刷新授权额度
      refetchAllowance();
    }
  }, [isConfirmedApprove, refetchAllowance]);

  // 监听用户输入的加入数量及链上返回的授权额度判断是否已授权
  const joinAmount = form.watch('joinAmount');
  const parsedJoinAmount = parseUnits(joinAmount || '0') ?? BigInt(0);

  useEffect(() => {
    if (parsedJoinAmount > BigInt(0) && allowance && allowance > BigInt(0) && allowance >= parsedJoinAmount) {
      setIsTokenApproved(true);
    } else {
      setIsTokenApproved(false);
    }
  }, [parsedJoinAmount, isPendingAllowance, allowance]);

  // 加入提交
  const {
    join,
    isPending: isPendingJoin,
    isConfirming: isConfirmingJoin,
    isConfirmed: isConfirmedJoin,
    writeError: errorJoin,
  } = useJoin();

  async function handleJoin(values: FormValues) {
    try {
      // 加入时同时提交验证信息
      await join(
        token?.address as `0x${string}`,
        actionId,
        groupId,
        parseUnits(values.joinAmount) ?? BigInt(0),
        values.verificationInfos || [],
      );
    } catch (error) {
      console.error('Join failed', error);
    }
  }

  /**
   * 处理"最高"按钮点击 - 根据场景设置最大可参与数量
   */
  const handleSetMaxAmount = () => {
    if (!balance || balance <= BigInt(0) || !groupDetail) return;

    let maxAmount: bigint;

    if (isJoined) {
      // 追加场景：min(余额, 剩余配额)
      maxAmount = balance < remainingQuota ? balance : remainingQuota;
    } else {
      // 首次加入：min(余额, actualMaxJoinAmount, remainingCapacity)
      const effectiveMaxAmount =
        groupDetail.actualMaxJoinAmount < groupDetail.remainingCapacity
          ? groupDetail.actualMaxJoinAmount
          : groupDetail.remainingCapacity;
      maxAmount = balance < effectiveMaxAmount ? balance : effectiveMaxAmount;
    }

    form.setValue('joinAmount', formatUnits(maxAmount));
  };

  // 加入成功后跳转到我的页面
  useEffect(() => {
    if (isConfirmedJoin) {
      toast.success('加入链群成功');
      setTimeout(() => {
        router.push(`/my/myaction?id=${actionId.toString()}&symbol=${joinTokenSymbol || token?.symbol || ''}`);
      }, 1000);
    }
  }, [isConfirmedJoin, router, actionId, joinTokenSymbol, token?.symbol]);

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorDetail) handleError(errorDetail);
    if (errorJoinInfo) handleError(errorJoinInfo);
    if (errorBalance) handleError(errorBalance);
    if (errorAllowance) handleError(errorAllowance);
    if (errorApprove) handleError(errorApprove);
    if (errorJoin) handleError(errorJoin);
    if (errorVerificationInfos) handleError(errorVerificationInfos);
    if (errorConstants) handleError(errorConstants);
    if (errorCurrentRound) handleError(errorCurrentRound);
    if (errorVoted) handleError(errorVoted);
  }, [
    errorDetail,
    errorJoinInfo,
    errorBalance,
    errorAllowance,
    errorApprove,
    errorJoin,
    errorVerificationInfos,
    errorConstants,
    errorCurrentRound,
    errorVoted,
    handleError,
  ]);

  // 检查投票状态并显示错误提示
  useEffect(() => {
    // 只在数据加载完成且未投票时设置错误
    if (!isPendingCurrentRound && !isPendingVoted && isActionIdVoted === false) {
      setError({
        name: '无法参加',
        message: '当前行动未投票，不能参加',
      });
    }
    // 注意：有投票时不操作，避免清除其他错误信息
  }, [isPendingCurrentRound, isPendingVoted, isActionIdVoted, setError]);

  if (isPendingDetail || isPendingJoinInfo || isPendingConstants) {
    return (
      <div className="flex flex-col items-center px-4 pt-6">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载链群信息...</p>
      </div>
    );
  }

  if (!groupDetail) {
    return (
      <div className="flex flex-col items-center px-6 pt-6">
        <p className="text-red-500">链群信息加载失败</p>
      </div>
    );
  }

  return (
    <>
      <div className="px-6 pt-0 pb-2">
        {/* 追加时显示参与统计 */}
        {isJoined && (
          <div className="my-4">
            <_GroupParticipationStats actionId={actionId} extensionAddress={extensionAddress} groupId={groupId} />
          </div>
        )}

        <LeftTitle title={isJoined ? '追加代币' : '加入行动'} />

        {!isJoined && (
          <div className="mt-4 px-4 pt-4 pb-2 bg-gray-50 border border-gray-200 rounded-lg">
            {/* 链群信息 */}
            <div className="text-sm text-gray-600 flex items-center justify-between">
              <div>
                <span className="text-sm">链群：</span>
                <span className="text-gray-500 text-xs">#</span>
                <span className="text-secondary text-base font-semibold ">{groupDetail.groupId.toString()}</span>{' '}
                <span className="font-semibold text-gray-800">{groupDetail.groupName}</span>
              </div>
              {!isJoined && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => router.push(`/acting/join?id=${actionId}&symbol=${token?.symbol || ''}`)}
                  className="text-secondary p-0 h-auto"
                >
                  切换链群
                </Button>
              )}
            </div>

            {/* 服务者 */}
            <div className="text-gray-600 flex items-center gap-2">
              <span className="text-sm">服务者：</span>
              <AddressWithCopyButton address={groupDetail.owner} showCopyButton={true} />
            </div>

            {/* 代币信息  */}
            <div className="text-gray-600 mt-2 flex items-center gap-2">
              <span className="text-sm">参与代币：</span>
              <span className="text-sm">
                {joinTokenSymbol}{' '}
                {joinTokenAddress && (
                  <span className="pl-2">
                    <AddressWithCopyButton
                      address={joinTokenAddress}
                      showCopyButton={true}
                      showAddress={true}
                      colorClassName="text-greyscale-500"
                    />
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* 表单 */}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4 pt-4">
            {/* 参与代币数 */}
            <FormField
              control={form.control}
              name="joinAmount"
              render={({ field }) => (
                <FormItem>
                  {!isJoined && (
                    <FormLabel className="text-greyscale-500 font-normal">
                      <>
                        参与代币数：{' '}
                        {isGroupFull ? (
                          <span className="text-red-600 text-sm">链群已满，无法加入</span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            (限 {formatTokenAmount(groupDetail.actualMinJoinAmount, 4, 'ceil')} ~{' '}
                            {formatTokenAmount(
                              groupDetail.actualMaxJoinAmount < groupDetail.remainingCapacity
                                ? groupDetail.actualMaxJoinAmount
                                : groupDetail.remainingCapacity,
                            )}
                            )
                          </span>
                        )}
                      </>
                    </FormLabel>
                  )}
                  <FormControl>
                    <Input
                      placeholder={`请输入参与代币数量`}
                      type="number"
                      disabled={!balance || balance <= BigInt(0) || isGroupFull}
                      className="!ring-secondary-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      我的余额：<span className="text-secondary">{formatTokenAmount(balance || BigInt(0), 4)}</span>{' '}
                      {joinTokenSymbol}
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={handleSetMaxAmount}
                      className="text-secondary p-0 h-auto"
                      disabled={!balance || balance <= BigInt(0) || isGroupFull}
                    >
                      最高
                    </Button>
                  </div>
                </FormItem>
              )}
            />

            {/* 验证信息字段 */}
            {verificationKeys && verificationKeys.length > 0 && (
              <>
                <div>
                  {isPendingVerificationInfos ? (
                    <div className="text-sm text-gray-500">加载已有验证信息...</div>
                  ) : (
                    <>
                      {verificationKeys.map((key, index) => {
                        const guide = (actionInfo.body.verificationInfoGuides as string[])?.[index] || '';
                        return (
                          <FormField
                            key={key + index}
                            control={form.control}
                            name={`verificationInfos.${index}`}
                            render={({ field }) => (
                              <FormItem className="mb-4">
                                <FormLabel className="text-greyscale-500 font-normal">{key}：</FormLabel>
                                <FormControl>
                                  {guide.length > 50 ? (
                                    <Textarea
                                      placeholder={guide || `请输入${key}`}
                                      className="!ring-secondary-foreground min-h-[100px]"
                                      {...field}
                                    />
                                  ) : (
                                    <Input
                                      placeholder={guide || `请输入${key}`}
                                      className="!ring-secondary-foreground"
                                      {...field}
                                    />
                                  )}
                                </FormControl>
                                {guide && <FormDescription className="text-xs">提示信息：{guide}</FormDescription>}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      })}
                    </>
                  )}
                </div>
              </>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-center space-x-4 pt-2">
              <Button
                ref={approveButtonRef}
                className="w-1/2"
                disabled={
                  isPendingAllowance ||
                  isPendingApprove ||
                  isConfirmingApprove ||
                  isTokenApproved ||
                  isGroupFull ||
                  !hasVotes
                }
                type="button"
                onClick={() => {
                  form.handleSubmit((values) => handleApprove(values))();
                }}
              >
                {isPendingAllowance ? (
                  <Loader2 className="animate-spin" />
                ) : isPendingApprove ? (
                  '1.提交中...'
                ) : isConfirmingApprove ? (
                  '1.确认中...'
                ) : isTokenApproved ? (
                  `1.${joinTokenSymbol || token?.symbol || ''}已授权`
                ) : (
                  `1.授权${joinTokenSymbol || token?.symbol || ''}`
                )}
              </Button>

              <Button
                className="w-1/2"
                disabled={
                  !isTokenApproved || isPendingJoin || isConfirmingJoin || isConfirmedJoin || isGroupFull || !hasVotes
                }
                type="button"
                onClick={() => {
                  form.handleSubmit((values) => handleJoin(values))();
                }}
              >
                {isPendingJoin
                  ? '2.提交中...'
                  : isConfirmingJoin
                  ? '2.确认中...'
                  : isConfirmedJoin
                  ? '2.已加入'
                  : '2.加入'}
              </Button>
            </div>
          </form>
        </Form>

        {/* 提示信息 */}
        <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 小贴士</div>
          <div className="space-y-1 text-gray-600">
            {verificationKeys && verificationKeys.length > 0 && <div>• 验证信息用于链群服务者验证您的行动完成情况</div>}
            <div>• 可以随时取回参与的代币</div>
            {verificationKeys && verificationKeys.length > 0 && <div>• 加入后可以随时修改验证信息</div>}
          </div>
        </div>
      </div>

      <LoadingOverlay
        isLoading={isPendingApprove || isConfirmingApprove || isPendingJoin || isConfirmingJoin}
        text={isPendingApprove || isPendingJoin ? '提交交易...' : '确认交易...'}
      />
    </>
  );
};

export default _GroupJoinSubmit;
