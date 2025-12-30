'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useContext, useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';

// ui components
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';

// my hooks
import { formatTokenAmount, formatUnits, parseUnits, formatPercentage } from '@/src/lib/format';
import { useContractError } from '@/src/errors/useContractError';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';
import { useIsActionIdVoted } from '@/src/hooks/contracts/useLOVE20Vote';
import { useApprove, useBalanceOf, useAllowance } from '@/src/hooks/contracts/useLOVE20Token';
import { useMyLpActionData } from '@/src/hooks/extension/plugins/lp/composite';
import { useJoin, useJoinTokenAddress } from '@/src/hooks/extension/plugins/lp/contracts/useExtensionLp';

// contexts / types / etc
import { ActionInfo } from '@/src/types/love20types';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useError } from '@/src/contexts/ErrorContext';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import LpStatsCard from './_LpStatsCard';

// ------------------------------
//  这里开始：定义表单校验
// ------------------------------

interface FormValues {
  joinAmount: string; // 参与数量
}

interface LpJoinPanelProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
}

const LpJoinPanel: React.FC<LpJoinPanelProps> = ({ actionId, actionInfo, extensionAddress }) => {
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

  // 获取 Join Token 地址（即 LP Token 地址）
  const {
    joinTokenAddress,
    isPending: isPendingJoinToken,
    error: errorJoinToken,
  } = useJoinTokenAddress(extensionAddress);

  // 获取 Lp 扩展数据（用于显示已参与信息）
  const {
    joinedAmount,
    totalJoinedAmount,
    rewardRatio,
    userGovVotes,
    totalGovVotes,
    minGovVotes,
    lpRatio,
    isPending: isPendingData,
    error: errorData,
  } = useMyLpActionData({
    extensionAddress,
    tokenAddress: token?.address as `0x${string}`,
    account: account as `0x${string}`,
  });

  // 计算是否已加入
  const isJoined = joinedAmount && joinedAmount > BigInt(0);

  // 格式化 LP 占比
  const lpRatioStr = formatPercentage(lpRatio);

  // 判断治理票数是否不足
  const isGovVotesInsufficient = userGovVotes !== undefined && minGovVotes !== undefined && userGovVotes < minGovVotes;

  // 判断是否有投票（需要等待数据加载完成）
  const hasVotes = useMemo(() => {
    if (isPendingCurrentRound || isPendingVoted) return true; // 加载中时默认允许，避免误判
    return isActionIdVoted === true;
  }, [isPendingCurrentRound, isPendingVoted, isActionIdVoted]);

  // 获取 LP Token 余额
  const { balance: lpBalance, error: errorLpBalance } = useBalanceOf(
    joinTokenAddress as `0x${string}`,
    account as `0x${string}`,
    !!joinTokenAddress,
  );

  // 获取已授权数量
  const {
    allowance: allowanceLp,
    isPending: isPendingAllowanceLp,
    error: errAllowanceLp,
    refetch: refetchAllowance,
  } = useAllowance(joinTokenAddress as `0x${string}`, account as `0x${string}`, extensionAddress, !!joinTokenAddress);

  // 定义授权状态变量：是否已完成LP授权
  const [isLpApproved, setIsLpApproved] = useState(false);

  // 动态构造 zod schema
  const formSchema = z.object({
    // 参与数量
    joinAmount: z
      .string()
      // 第一步：验证输入的格式（允许纯数字、带千分位逗号、或带小数的数字）
      .refine((val) => val.trim() === '' || /^[0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?$/.test(val.trim()), {
        message: '请输入合法的数字格式',
      })
      // 第二步：去除输入首尾空格，若为空则变为 '0'，否则移除逗号，保证后续数值处理时格式正确
      .transform((val) => (val.trim() === '' ? '0' : val.trim().replace(/,/g, '')))
      // 检查是否为 '0'
      .refine(
        (val) => {
          if (val === '0') {
            return false;
          }
          return true;
        },
        { message: 'LP加入数不能为 0' },
      )
      // 检查输入的数值不能超过持有LP数
      .refine(
        (val) => {
          const inputVal = parseUnits(val);
          return inputVal !== null && lpBalance !== undefined && inputVal <= lpBalance;
        },
        { message: '您的LP余额不足' },
      ),
  });

  // ------------------------------
  //  表单实例
  // ------------------------------
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      joinAmount: '',
    },
    mode: 'onChange',
  });

  // ------------------------------
  //  授权(approve)
  // ------------------------------
  const {
    approve: approveLp,
    isPending: isPendingApproveLp,
    isConfirming: isConfirmingApproveLp,
    isConfirmed: isConfirmedApproveLp,
    writeError: errApproveLp,
  } = useApprove(joinTokenAddress as `0x${string}`);

  // 新增：为授权按钮设置 ref ，用于在授权等待状态结束后调用 blur() 取消 hover 效果
  const approveButtonRef = useRef<HTMLButtonElement>(null);
  const prevIsPendingAllowanceLpRef = useRef(isPendingAllowanceLp);
  useEffect(() => {
    // 当 isPendingAllowanceLp 从 true 变为 false 时调用 blur()
    if (prevIsPendingAllowanceLpRef.current && !isPendingAllowanceLp && approveButtonRef.current) {
      approveButtonRef.current.blur();
    }
    prevIsPendingAllowanceLpRef.current = isPendingAllowanceLp;
  }, [isPendingAllowanceLp]);

  async function handleApprove(values: FormValues) {
    // 检查治理票数是否不足
    if (isGovVotesInsufficient) {
      toast.error('治理票数不足，无法参与行动。');
      return;
    }

    // 确保 joinAmount 始终为 bigint，避免 null
    const joinAmount = parseUnits(values.joinAmount) ?? BigInt(0);
    if (joinAmount === BigInt(0)) {
      toast.error('当前无需授权。');
      return;
    }

    try {
      await approveLp(extensionAddress, joinAmount);
    } catch (error) {
      console.error('Approve failed', error);
    }
  }

  // 监听授权交易确认后更新状态
  useEffect(() => {
    if (isConfirmedApproveLp) {
      setIsLpApproved(true);
      toast.success('授权LP成功');
      // 授权成功后，刷新授权额度
      refetchAllowance();
    }
  }, [isConfirmedApproveLp, refetchAllowance]);

  // 监听用户输入的加入数量及链上返回的授权额度判断是否已授权
  const joinAmount = form.watch('joinAmount');
  const parsedJoinAmount = parseUnits(joinAmount || '0') ?? BigInt(0);
  useEffect(() => {
    if (parsedJoinAmount > BigInt(0) && allowanceLp && allowanceLp > BigInt(0) && allowanceLp >= parsedJoinAmount) {
      setIsLpApproved(true);
    } else {
      setIsLpApproved(false);
    }
  }, [parsedJoinAmount, isPendingAllowanceLp, allowanceLp]);

  // ------------------------------
  //  加入提交
  // ------------------------------
  const {
    join,
    isPending: isPendingJoin,
    isConfirming: isConfirmingJoin,
    isConfirmed: isConfirmedJoin,
    writeError: errorJoin,
  } = useJoin(extensionAddress);

  async function handleJoin(values: FormValues) {
    // 检查治理票数是否不足
    if (isGovVotesInsufficient) {
      toast.error('治理票数不足，无法参与行动。');
      return;
    }

    try {
      // verificationInfos 传空数组（如果不需要验证信息的话）
      await join(parseUnits(values.joinAmount) ?? BigInt(0), []);
    } catch (error) {
      console.error('Join failed', error);
    }
  }

  // ------------------------------
  //  加入成功后的处理
  // ------------------------------
  useEffect(() => {
    if (isConfirmedJoin) {
      toast.success('加入LP成功');
      // 重置表单
      form.reset();
      // 2秒后返回
      setTimeout(() => {
        router.push(`/my/myaction?id=${actionInfo.head.id}&symbol=${token?.symbol}`);
      }, 2000);
    }
  }, [isConfirmedJoin]);

  // ------------------------------
  //  错误处理
  // ------------------------------
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorJoinToken) handleError(errorJoinToken);
    if (errorLpBalance) handleError(errorLpBalance);
    if (errApproveLp) handleError(errApproveLp);
    if (errorJoin) handleError(errorJoin);
    if (errAllowanceLp) handleError(errAllowanceLp);
    if (errorData) handleError(errorData);
    if (errorCurrentRound) handleError(errorCurrentRound);
    if (errorVoted) handleError(errorVoted);
  }, [
    errorJoinToken,
    errorLpBalance,
    errApproveLp,
    errorJoin,
    errAllowanceLp,
    errorData,
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

  // ------------------------------
  //  组件渲染
  // ------------------------------
  if (isPendingJoinToken || isPendingData) {
    return <LoadingIcon />;
  }

  return (
    <>
      {/* 如果已加入，显示参与信息 */}
      {isJoined && (
        <div className="flex flex-col items-center px-4 pt-1">
          <LpStatsCard
            stakedAmount={joinedAmount || BigInt(0)}
            lpRatioStr={lpRatioStr}
            rewardRatio={rewardRatio}
            userGovVotes={userGovVotes}
            totalGovVotes={totalGovVotes}
          />
        </div>
      )}

      {/* 治理票数不足的警告 */}
      {isGovVotesInsufficient && (
        <div className="px-6 py-0">
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 mt-3 w-full">
            <div className="font-medium">⚠️ 治理票数不足</div>
            <div className="mt-1">
              你的治理票数 <span className="font-semibold">{userGovVotes.toString()}</span> 低于最小限制{' '}
              <span className="font-semibold">{formatTokenAmount(minGovVotes)}</span>，无法参与行动。
            </div>
            <div className="text-xs text-red-600 mt-1">您可以增加治理票数，再重新参与行动。</div>
          </div>
        </div>
      )}

      {/* 加入表单 */}
      <div className="px-6 pt-6 pb-2">
        <LeftTitle title={isJoined ? '追加LP' : '加入行动'} />
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4 pt-2">
            {/* LP加入数 */}
            <FormField
              control={form.control}
              name="joinAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-greyscale-500 font-normal">{isJoined ? '' : '质押LP数量：'}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        isJoined ? `最大可追加 ${formatTokenAmount(lpBalance || BigInt(0), 4)}` : `请输入LP加入数量`
                      }
                      type="number"
                      disabled={!lpBalance || lpBalance <= BigInt(0) || isGovVotesInsufficient}
                      className="!ring-secondary-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription className="flex items-center">
                    <span>
                      共有 <span className="text-secondary">{formatTokenAmount(lpBalance || BigInt(0), 4)}</span> LP
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => {
                        if (lpBalance && lpBalance > BigInt(0)) {
                          form.setValue('joinAmount', formatUnits(lpBalance));
                        }
                      }}
                      className="text-secondary p-0 ml-6"
                      disabled={!lpBalance || lpBalance <= BigInt(0) || isGovVotesInsufficient}
                    >
                      全部
                    </Button>
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* 操作按钮 */}
            <div className="flex justify-center space-x-4 pt-2">
              <Button
                ref={approveButtonRef} // 将 ref 绑定到授权按钮上
                className="w-1/2"
                disabled={
                  isPendingAllowanceLp ||
                  isPendingApproveLp ||
                  isConfirmingApproveLp ||
                  isLpApproved ||
                  isGovVotesInsufficient ||
                  !hasVotes
                }
                type="button"
                onClick={() => {
                  form.handleSubmit((values) => handleApprove(values))();
                }}
              >
                {isPendingAllowanceLp ? (
                  <Loader2 className="animate-spin" />
                ) : isPendingApproveLp ? (
                  '1.提交中...'
                ) : isConfirmingApproveLp ? (
                  '1.确认中...'
                ) : isLpApproved ? (
                  '1.LP已授权'
                ) : (
                  '1.授权LP'
                )}
              </Button>

              <Button
                className="w-1/2"
                disabled={
                  !isLpApproved ||
                  isPendingJoin ||
                  isConfirmingJoin ||
                  isConfirmedJoin ||
                  isGovVotesInsufficient ||
                  !hasVotes
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
      </div>

      {/* 增加一个帮助信息 */}
      <div className="px-6 pt-0 pb-4">
        <div className="text-greyscale-500 text-sm">
          提示：加入LP参与扩展行动后，等待一定区块数后可以直接取回LP，取回不会影响已产生的激励
        </div>
      </div>

      <LoadingOverlay
        isLoading={isPendingApproveLp || isConfirmingApproveLp || isPendingJoin || isConfirmingJoin}
        text={isPendingApproveLp || isPendingJoin ? '提交交易...' : '确认交易...'}
      />
    </>
  );
};

export default LpJoinPanel;
