// components/Extension/Plugins/Group/_GroupJoinSubmit.tsx
// 第二步：确认加入链群

'use client';

// React
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';

// Next.js
import Link from 'next/link';
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
import { useApprove } from '@/src/hooks/contracts/useLOVE20Token';
import { useExtensionsByActionIdsWithCache } from '@/src/hooks/extension/base/composite/useExtensionsByActionIdsWithCache';
import { useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite/useExtensionGroupDetail';
import { useGetInfoForJoin } from '@/src/hooks/extension/plugins/group/composite/useGetInfoForJoin';
import { useJoin, useTrialJoin } from '@/src/hooks/extension/plugins/group/contracts/useGroupJoin';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';
import { formatTokenAmount, formatUnits, parseUnits } from '@/src/lib/format';
import { getMaxJoinAmount, getMaxIncreaseAmount } from '@/src/lib/extensionGroup';
import { LocalCache } from '@/src/lib/LocalCache';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import InfoTooltip from '@/src/components/Common/InfoTooltip';
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

  // 获取扩展常量数据（包括 joinTokenAddress 和 joinTokenSymbol）
  const {
    extensions,
    isPending: isPendingConstants,
    error: errorConstants,
  } = useExtensionsByActionIdsWithCache({
    token: token || ({ address: '0x0000000000000000000000000000000000000000' as `0x${string}` } as any),
    actionIds: [actionId],
    enabled: !!token && actionId !== undefined,
  });

  const joinTokenAddress = extensions[0]?.joinedAmountTokenAddress;
  const joinTokenSymbol = extensions[0]?.joinedAmountTokenSymbol;
  const joinedAmountTokenIsLP = extensions[0]?.joinedAmountTokenIsLP;

  // 获取验证信息的 key 列表
  const verificationKeys = actionInfo?.body?.verificationKeys as string[] | undefined;

  // 批量获取加入所需的所有信息
  const {
    currentRound,
    isActionIdVoted,
    joinedAmount,
    balance,
    allowance,
    verificationInfos: existingVerificationInfos,
    isPending: isPendingJoinInfo,
    isPendingAllowance,
    error: errorJoinInfo,
    refetchAllowance,
  } = useGetInfoForJoin({
    tokenAddress: token?.address as `0x${string}`,
    extensionAddress,
    account: account as `0x${string}`,
    actionId,
    joinTokenAddress,
    verificationKeys,
    groupJoinContractAddress: GROUP_JOIN_CONTRACT_ADDRESS,
  });

  // 使用 joinedAmount 判断是否已加入
  const isJoined = useMemo(() => {
    return joinedAmount !== undefined && joinedAmount > BigInt(0);
  }, [joinedAmount]);

  // 获取链群详情
  const {
    groupDetail,
    isPending: isPendingDetail,
    error: errorDetail,
  } = useExtensionGroupDetail({
    extensionAddress,
    groupId,
    round: currentRound,
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
    // 如果用户已加入，永远不限制（允许追加代币）
    if (isJoined) return false;
    // 如果 join 信息还在加载，暂不判定为满（避免数据未加载完成时误判）
    if (isPendingJoinInfo) return false;
    // 如果链群详情没有，不判定为满
    if (!groupDetail) return false;
    // maxAccounts 为 0 表示不限制
    if (groupDetail.maxAccounts === BigInt(0)) return false;
    return groupDetail.accountCount >= groupDetail.maxAccounts;
  }, [isJoined, isPendingJoinInfo, groupDetail]);

  // 综合检查是否可以加入（仅在首次加入时检查）
  const cannotJoin = useMemo(() => {
    if (isJoined || !groupDetail) return { blocked: false, reason: '' };

    // 检查地址数限制
    if (isAccountsFull) {
      return { blocked: true, reason: '链群地址数已达到上限' };
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
    if (isPendingJoinInfo) return true; // 加载中时默认允许，避免误判
    return isActionIdVoted === true;
  }, [isPendingJoinInfo, isActionIdVoted]);

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
          message: `参与代币数不能小于最小值 ${groupDetail ? formatTokenAmount(groupDetail.actualMinJoinAmount) : '0'}`,
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
            effectiveMaxAmount > BigInt(0) ? formatTokenAmount(effectiveMaxAmount) : '不限'
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
    if (!isPendingJoinInfo && existingVerificationInfos && verificationKeys) {
      const updatedInfos = verificationKeys.map((key, index) => existingVerificationInfos[index] || '');
      form.setValue('verificationInfos', updatedInfos);
    }
  }, [isPendingJoinInfo, existingVerificationInfos, verificationKeys, form]);

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

  /**
   * 加入状态 UI 锁存
   * - 当加入成功后，数据刷新可能导致 isJoined 变成 true
   * - 为避免界面从"加入"变成"已加入"，在加入成功到跳转期间锁存为 false
   */
  const [isJoinedLocked, setIsJoinedLocked] = useState(false);
  useEffect(() => {
    if (isConfirmedJoin || isConfirmedTrialJoin) {
      setIsJoinedLocked(true);
    }
  }, [isConfirmedJoin, isConfirmedTrialJoin]);
  // UI 使用锁存后的值，保持界面状态不变
  const uiIsJoined = isJoinedLocked ? false : isJoined;

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

      // 加入时缓存 groupId
      LocalCache.set(`joined_group_id`, groupId.toString());

      setTimeout(() => {
        router.push(`/my/myaction?id=${actionId.toString()}&symbol=${token?.symbol || ''}`);
      }, 1000);
    }
  }, [isConfirmedJoin, isConfirmedTrialJoin, uiIsTrialMode, router, actionId, token?.symbol, groupId]);

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorDetail) handleError(errorDetail);
    if (errorJoinInfo) handleError(errorJoinInfo);
    if (errorApprove) handleError(errorApprove);
    if (errorJoin) handleError(errorJoin);
    if (errorTrialJoin) handleError(errorTrialJoin);
    if (errorConstants) handleError(errorConstants);
  }, [errorDetail, errorJoinInfo, errorApprove, errorJoin, errorTrialJoin, errorConstants, handleError]);

  // 检查投票状态并显示错误提示
  useEffect(() => {
    // 只在数据加载完成且未投票时设置错误
    if (!isPendingJoinInfo && isActionIdVoted === false) {
      setError({
        name: '无法参加',
        message: '当前行动未投票，不能参加',
      });
    }
    // 注意：有投票时不操作，避免清除其他错误信息
  }, [isPendingJoinInfo, isActionIdVoted, setError]);

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
      <div className="px-4 pt-0 pb-2">
        {/* 追加时显示参与统计 */}
        {uiIsJoined && (
          <div className="my-4">
            <_GroupParticipationStats actionId={actionId} extensionAddress={extensionAddress} groupId={groupId} />
          </div>
        )}

        {!uiIsJoined && (
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
                  <FormLabel className="text-greyscale-500 font-normal flex items-center justify-between">
                    <span>
                      {!uiIsJoined ? (
                        <>
                          <span className="font-bold text-gray-900">
                            {isTrialMode ? '体验代币数：' : '参与代币数：'}
                          </span>{' '}
                          {hasVotes &&
                            (cannotJoin.blocked ? (
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
                          <span className="font-bold text-gray-900">追加代币数：</span>{' '}
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
                    </span>
                    {joinedAmountTokenIsLP && !uiIsTrialMode && (
                      <Link
                        href="/dex/?tab=liquidity"
                        className="text-sm text-secondary hover:text-secondary/80 hover:underline ml-2"
                      >
                        获取LP代币 &gt;&gt;
                      </Link>
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
                    <FormDescription className="text-xs text-gray-600">
                      体验模式，由 <AddressWithCopyButton address={groupDetail.owner} showCopyButton={true} />{' '}
                      代为提供参与代币
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
                  {isPendingJoinInfo ? (
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
                                <FormLabel className="text-greyscale-500 font-normal">
                                  <span className="font-bold text-gray-900">{key}：</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={`请输入${key}`}
                                    className="!ring-secondary-foreground"
                                    {...field}
                                  />
                                </FormControl>
                                {guide && (
                                  <FormDescription className="text-xs text-gray-600">提示：{guide}</FormDescription>
                                )}
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
                    `1.代币已授权`
                  ) : (
                    `1.授权代币`
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
                  : uiIsJoined
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
          isConfirmingTrialJoin ||
          isConfirmedJoin ||
          isConfirmedTrialJoin
        }
        text={
          isConfirmedJoin || isConfirmedTrialJoin
            ? '加入成功，即将跳转...'
            : isPendingApprove || isPendingJoin || isPendingTrialJoin
            ? '提交交易...'
            : '确认交易...'
        }
      />
    </>
  );
};

export default _GroupJoinSubmit;
