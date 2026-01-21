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
import { useTrialMode } from '@/src/contexts/TrialModeContext';

// hooks
import { useAllowance, useApprove, useBalanceOf } from '@/src/hooks/contracts/useLOVE20Token';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';
import { useIsActionIdVoted } from '@/src/hooks/contracts/useLOVE20Vote';
import { useAccountVerificationInfos } from '@/src/hooks/extension/base/composite';
import { useIsAccountJoined } from '@/src/hooks/extension/base/contracts/useExtensionCenter';
import { useExtensionActionConstCache } from '@/src/hooks/extension/plugins/group/composite/useExtensionActionConstCache';
import { useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite/useExtensionGroupDetail';
import { useJoin, useJoinInfo, useTrialJoin } from '@/src/hooks/extension/plugins/group/contracts/useGroupJoin';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';
import { formatTokenAmount, formatUnits, parseUnits } from '@/src/lib/format';
import { getMaxJoinAmount, getMaxIncreaseAmount } from '@/src/lib/extensionGroup';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import InfoTooltip from '@/src/components/Common/InfoTooltip';
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

  // 获取体验模式状态
  const { isTrialMode, provider, trialAmount } = useTrialMode();
  /**
   * 体验模式 UI 锁存
   * - TrialModeContext 的 isTrialMode 依赖 waitingList（加入后可能立刻变成 false）
   * - 为避免交易确认/跳转前 UI 闪回普通模式（出现两个按钮），这里一旦进入体验模式就锁存到组件卸载
   */
  const [isTrialModeLocked, setIsTrialModeLocked] = useState(false);
  useEffect(() => {
    if (isTrialMode) setIsTrialModeLocked(true);
  }, [isTrialMode]);
  const uiIsTrialMode = isTrialMode || isTrialModeLocked;

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
  } = useJoinInfo(extensionAddress, account as `0x${string}`);

  // 判断是否已加入行动
  const {
    isJoined,
    isPending: isPendingJoined,
    error: errorJoined,
  } = useIsAccountJoined(token?.address as `0x${string}`, actionId, account as `0x${string}`);

  // 获取链群详情
  const {
    groupDetail,
    isPending: isPendingDetail,
    error: errorDetail,
  } = useExtensionGroupDetail({
    extensionAddress,
    groupId,
  });

  // 计算新用户最大参与量
  const maxJoinResult = useMemo(() => {
    if (!groupDetail) return { amount: BigInt(0), reason: '' };
    return getMaxJoinAmount(groupDetail);
  }, [groupDetail]);

  // 计算老用户最大追加量
  const maxIncreaseResult = useMemo(() => {
    if (!isJoined || !groupDetail || !joinedAmount) {
      return { amount: BigInt(0), reason: '' };
    }
    return getMaxIncreaseAmount(groupDetail, joinedAmount);
  }, [isJoined, groupDetail, joinedAmount]);

  // 根据场景选择使用哪个结果
  const effectiveMaxAmount = isJoined ? maxIncreaseResult.amount : maxJoinResult.amount;
  // const effectiveReason = isJoined ? maxIncreaseResult.reason : maxJoinResult.reason;

  // 检查新加入时地址数是否已满
  const isAccountsFull = useMemo(() => {
    if (isJoined || !groupDetail) return false;
    // maxAccounts 为 0 表示不限制
    if (groupDetail.maxAccounts === BigInt(0)) return false;
    return groupDetail.accountCount >= groupDetail.maxAccounts;
  }, [isJoined, groupDetail]);

  // 综合检查是否可以加入（仅在首次加入时检查）
  const cannotJoin = useMemo(() => {
    if (isJoined || !groupDetail) return { blocked: false, reason: '' };

    // 检查地址数限制
    if (isAccountsFull) {
      return { blocked: true, reason: '链群人数已达到上限' };
    }

    // 检查可参与代币量
    if (maxJoinResult.amount <= BigInt(0)) {
      return { blocked: true, reason: maxJoinResult.reason };
    }

    return { blocked: false, reason: '' };
  }, [isJoined, groupDetail, isAccountsFull, maxJoinResult]);

  // 综合检查是否可以追加（仅在追加代币时检查）
  const cannotIncrease = useMemo(() => {
    if (!isJoined || !groupDetail) return { blocked: false, reason: '' };

    // 检查可追加代币量
    if (maxIncreaseResult.amount <= BigInt(0)) {
      return { blocked: true, reason: maxIncreaseResult.reason || '无法追加代币' };
    }

    return { blocked: false, reason: '' };
  }, [isJoined, groupDetail, maxIncreaseResult]);

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
          // 体验模式下跳过余额检查
          if (uiIsTrialMode) return true;
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
          return inputVal !== null && inputVal <= effectiveMaxAmount;
        },
        {
          message: `参与代币数不能大于最大值 ${
            effectiveMaxAmount > BigInt(0) ? formatTokenAmount(effectiveMaxAmount, 2) : '不限'
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
      joinAmount: uiIsTrialMode ? formatUnits(trialAmount) : '',
      verificationInfos: defaultVerificationInfos,
    },
    mode: 'onChange',
  });

  // 体验模式下，当 trialAmount 变化时更新表单
  useEffect(() => {
    if (uiIsTrialMode && trialAmount > BigInt(0)) {
      form.setValue('joinAmount', formatUnits(trialAmount));
    }
  }, [uiIsTrialMode, trialAmount, form]);

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

  // 体验加入提交
  const {
    trialJoin,
    isPending: isPendingTrialJoin,
    isConfirming: isConfirmingTrialJoin,
    isConfirmed: isConfirmedTrialJoin,
    writeError: errorTrialJoin,
  } = useTrialJoin();

  async function handleJoin(values: FormValues) {
    try {
      // 体验模式：使用 trialJoin
      if (isTrialMode && provider) {
        // 一旦发起体验加入，就锁存 UI，避免 waitingList 更新导致 isTrialMode 变 false
        setIsTrialModeLocked(true);
        await trialJoin(extensionAddress, groupId, provider, values.verificationInfos || []);
      } else {
        // 普通模式：加入时同时提交验证信息
        await join(
          extensionAddress,
          groupId,
          parseUnits(values.joinAmount) ?? BigInt(0),
          values.verificationInfos || [],
        );
      }
    } catch (error) {
      console.error('Join failed', error);
    }
  }

  /**
   * 处理"最高"按钮点击 - 根据场景设置最大可参与数量
   */
  const handleSetMaxAmount = () => {
    if (!balance || balance <= BigInt(0) || !groupDetail) return;

    const maxAmount = balance < effectiveMaxAmount ? balance : effectiveMaxAmount;
    form.setValue('joinAmount', formatUnits(maxAmount));
  };

  // 加入成功后跳转到我的页面
  useEffect(() => {
    if (isConfirmedJoin || isConfirmedTrialJoin) {
      toast.success(uiIsTrialMode ? '体验加入成功' : '加入链群成功');
      setTimeout(() => {
        router.push(`/my/myaction?id=${actionId.toString()}&symbol=${token?.symbol || ''}`);
      }, 1000);
    }
  }, [isConfirmedJoin, isConfirmedTrialJoin, uiIsTrialMode, router, actionId, token?.symbol]);

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorDetail) handleError(errorDetail);
    if (errorJoinInfo) handleError(errorJoinInfo);
    if (errorBalance) handleError(errorBalance);
    if (errorAllowance) handleError(errorAllowance);
    if (errorApprove) handleError(errorApprove);
    if (errorJoin) handleError(errorJoin);
    if (errorTrialJoin) handleError(errorTrialJoin);
    if (errorVerificationInfos) handleError(errorVerificationInfos);
    if (errorConstants) handleError(errorConstants);
    if (errorCurrentRound) handleError(errorCurrentRound);
    if (errorVoted) handleError(errorVoted);
    if (errorJoined) handleError(errorJoined);
  }, [
    errorDetail,
    errorJoinInfo,
    errorBalance,
    errorAllowance,
    errorApprove,
    errorJoin,
    errorTrialJoin,
    errorVerificationInfos,
    errorConstants,
    errorCurrentRound,
    errorVoted,
    errorJoined,
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

  if (isPendingDetail || isPendingJoinInfo || isPendingConstants || isPendingJoined) {
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
      <div className="px-4 pt-0 pb-2">
        {/* 追加时显示参与统计 */}
        {isJoined && (
          <div className="my-4">
            <_GroupParticipationStats actionId={actionId} extensionAddress={extensionAddress} groupId={groupId} />
          </div>
        )}

        {!isJoined && (
          <>
            {/* 体验模式标识 */}
            {isTrialMode && (
              <div className="mt-4 mb-6 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-orange-600 font-semibold">🎉 恭喜您获得体验资格</span>
                </div>
                <div className="text-sm text-orange-600 mt-1">每天记得来铸造你的行动激励！</div>
              </div>
            )}
          </>
        )}

        {/* <LeftTitle title={isJoined ? '追加代币' : '加入行动'} /> */}

        {/* 行动标题 */}
        <div className="flex items-baseline mt-4">
          <span className="text-gray-400 text-xs mr-1">No.</span>
          <span className="text-secondary text-xl font-bold mr-2 leading-none">{actionInfo.head.id.toString()}</span>
          <span className="font-bold text-gray-800 text-lg leading-tight">{actionInfo.body.title}</span>
        </div>

        {/* 链群信息（样式对齐表单项） */}
        <div className="mt-2">
          <div className="flex min-h-10 w-full items-center justify-between gap-3 rounded-md bg-gray-50/60 px-3 py-2 text-sm">
            <div className="flex items-baseline min-w-0">
              <span className="text-greyscale-500 font-normal text-sm shrink-0">链群</span>
              <span className="text-gray-400 text-xs">#</span>
              <span className="text-gray-700 text-sm mr-2 leading-none">{groupDetail.groupId.toString()}</span>
              <span className="font-semibold text-gray-700 text-sm truncate">{groupDetail.groupName}</span>
            </div>
            {/* {!isJoined && !isTrialMode && (
              <Button
                variant="link"
                size="sm"
                onClick={() => router.push(`/acting/join?id=${actionId}&symbol=${token?.symbol || ''}`)}
                className="text-secondary p-0 h-auto text-xs shrink-0"
              >
                切换链群
              </Button>
            )} */}
          </div>
        </div>

        {/* 表单 */}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6 pt-6">
            {/* 参与代币数 */}
            <FormField
              control={form.control}
              name="joinAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-greyscale-500 font-normal">
                    {!isJoined ? (
                      <>
                        {isTrialMode ? '体验代币数：' : '参与代币数：'}{' '}
                        {hasVotes &&
                          (isTrialMode ? (
                            <span className="text-sm text-blue-600">（体验模式，无需支付代币）</span>
                          ) : cannotJoin.blocked ? (
                            <span className="text-red-600 text-sm">{cannotJoin.reason}</span>
                          ) : (
                            <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                              限 {formatTokenAmount(groupDetail.actualMinJoinAmount, 4, 'ceil')} ~{' '}
                              {formatTokenAmount(maxJoinResult.amount)}
                              <InfoTooltip title="参与上限说明" content={maxJoinResult.reason} />
                            </span>
                          ))}
                      </>
                    ) : (
                      <>
                        追加代币数：{' '}
                        {hasVotes &&
                          (cannotIncrease.blocked ? (
                            <span className="text-red-600 text-sm">{cannotIncrease.reason}</span>
                          ) : (
                            <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                              最大 {formatTokenAmount(maxIncreaseResult.amount)}
                              <InfoTooltip title="追加上限说明" content={maxIncreaseResult.reason} />
                            </span>
                          ))}
                      </>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`请输入参与代币数量`}
                      type="number"
                      disabled={
                        isTrialMode || !balance || balance <= BigInt(0) || cannotJoin.blocked || cannotIncrease.blocked
                      }
                      className={`!ring-secondary-foreground ${isTrialMode ? 'bg-gray-100 text-gray-600' : ''}`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  {isTrialMode && (
                    <FormDescription className="text-xs">
                      本次行动参与代币，由 <AddressWithCopyButton address={groupDetail.owner} showCopyButton={true} />{' '}
                      代为提供
                    </FormDescription>
                  )}
                  {!isTrialMode && (
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
                        disabled={!balance || balance <= BigInt(0) || cannotJoin.blocked || cannotIncrease.blocked}
                      >
                        最高
                      </Button>
                    </div>
                  )}
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
              {/* 体验模式下隐藏授权按钮 */}
              {!uiIsTrialMode && (
                <Button
                  ref={approveButtonRef}
                  className="w-1/2"
                  disabled={
                    isPendingAllowance ||
                    isPendingApprove ||
                    isConfirmingApprove ||
                    isTokenApproved ||
                    cannotJoin.blocked ||
                    cannotIncrease.blocked ||
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
              )}

              <Button
                className={uiIsTrialMode ? 'w-full' : 'w-1/2'}
                disabled={
                  // 体验模式下不检查授权状态
                  (!uiIsTrialMode && !isTokenApproved) ||
                  isPendingJoin ||
                  isConfirmingJoin ||
                  isConfirmedJoin ||
                  isPendingTrialJoin ||
                  isConfirmingTrialJoin ||
                  isConfirmedTrialJoin ||
                  cannotJoin.blocked ||
                  cannotIncrease.blocked ||
                  !hasVotes
                }
                type="button"
                onClick={() => {
                  form.handleSubmit((values) => handleJoin(values))();
                }}
              >
                {isPendingJoin || isPendingTrialJoin
                  ? uiIsTrialMode
                    ? '提交中...'
                    : '2.提交中...'
                  : isConfirmingJoin || isConfirmingTrialJoin
                  ? uiIsTrialMode
                    ? '确认中...'
                    : '2.确认中...'
                  : isConfirmedJoin || isConfirmedTrialJoin
                  ? uiIsTrialMode
                    ? '已加入'
                    : '2.已加入'
                  : uiIsTrialMode
                  ? '加入行动'
                  : isJoined
                  ? '2.追加代币'
                  : '2.加入行动'}
              </Button>
            </div>
          </form>
        </Form>

        {/* 提示信息 */}
        <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-2">💡 小贴士</div>
          <div className="space-y-0 text-gray-600">
            {uiIsTrialMode ? (
              <>
                <div>• 体验结束，可自行退出行动</div>
                <div>
                  • 也可由{` `}
                  <AddressWithCopyButton address={groupDetail.owner} showCopyButton={true} /> 代为退出行动
                </div>
                <div>
                  • 参与代币返还给 <AddressWithCopyButton address={groupDetail.owner} showCopyButton={true} />
                </div>
              </>
            ) : (
              <>
                {verificationKeys && verificationKeys.length > 0 && (
                  <div>• 验证信息用于链群服务者验证您的行动完成情况</div>
                )}
                <div>• 可以随时取回参与的代币</div>
                {verificationKeys && verificationKeys.length > 0 && <div>• 加入后可以随时修改验证信息</div>}
              </>
            )}
          </div>
        </div>
      </div>

      <LoadingOverlay
        isLoading={
          isPendingApprove ||
          isConfirmingApprove ||
          isPendingJoin ||
          isConfirmingJoin ||
          isPendingTrialJoin ||
          isConfirmingTrialJoin
        }
        text={isPendingApprove || isPendingJoin || isPendingTrialJoin ? '提交交易...' : '确认交易...'}
      />
    </>
  );
};

export default _GroupJoinSubmit;
