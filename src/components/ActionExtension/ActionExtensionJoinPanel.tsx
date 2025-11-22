'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useContext, useEffect, useState, useRef } from 'react';
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
import { useHandleContractError } from '@/src/lib/errorUtils';
import { useApprove, useBalanceOf, useAllowance } from '@/src/hooks/contracts/useLOVE20Token';
import { useStakeLpActionData } from '@/src/hooks/composite/useStakeLpActionData';
import { useStakeLp, useLpTokenAddress } from '@/src/hooks/extension/plugins/lp/contracts';

// contexts / types / etc
import { ActionInfo } from '@/src/types/love20types';
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import StakeLpStatsCard from './StakeLpStatsCard';

// ------------------------------
//  这里开始：定义表单校验
// ------------------------------

interface FormValues {
  stakeAmount: string; // 参与数量
}

interface ActionExtensionJoinPanelProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
}

const ActionExtensionJoinPanel: React.FC<ActionExtensionJoinPanelProps> = ({
  actionId,
  actionInfo,
  extensionAddress,
}) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取 LP Token 地址
  const { lpTokenAddress, isPending: isPendingLpToken, error: errorLpToken } = useLpTokenAddress(extensionAddress);

  // 获取 StakeLp 扩展数据（用于显示已参与信息）
  const {
    stakedAmount,
    totalStakedAmount,
    userScore,
    totalScore,
    userGovVotes,
    totalGovVotes,
    minGovVotes,
    lpRatio,
    isPending: isPendingData,
    error: errorData,
  } = useStakeLpActionData({
    extensionAddress,
    tokenAddress: token?.address as `0x${string}`,
    account: account as `0x${string}`,
  });

  // 计算是否已质押
  const isStaked = stakedAmount && stakedAmount > BigInt(0);

  // 格式化 LP 占比
  const lpRatioStr = formatPercentage(lpRatio);

  // 获取 LP Token 余额
  const { balance: lpBalance, error: errorLpBalance } = useBalanceOf(
    lpTokenAddress as `0x${string}`,
    account as `0x${string}`,
    !!lpTokenAddress,
  );

  // 获取已授权数量
  const {
    allowance: allowanceLp,
    isPending: isPendingAllowanceLp,
    error: errAllowanceLp,
  } = useAllowance(lpTokenAddress as `0x${string}`, account as `0x${string}`, extensionAddress, !!lpTokenAddress);

  // 定义授权状态变量：是否已完成LP授权
  const [isLpApproved, setIsLpApproved] = useState(false);

  // 动态构造 zod schema
  const formSchema = z.object({
    // 参与数量
    stakeAmount: z
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
        { message: 'LP质押数不能为 0' },
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
      stakeAmount: '',
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
  } = useApprove(lpTokenAddress as `0x${string}`);

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
    // 确保 stakeAmount 始终为 bigint，避免 null
    const stakeAmount = parseUnits(values.stakeAmount) ?? BigInt(0);
    if (stakeAmount === BigInt(0)) {
      toast.error('当前无需授权。');
      return;
    }

    try {
      await approveLp(extensionAddress, stakeAmount);
    } catch (error) {
      console.error('Approve failed', error);
    }
  }

  // 监听授权交易确认后更新状态
  useEffect(() => {
    if (isConfirmedApproveLp) {
      setIsLpApproved(true);
      toast.success('授权LP成功');
    }
  }, [isConfirmedApproveLp]);

  // 监听用户输入的质押数量及链上返回的授权额度判断是否已授权
  const stakeAmount = form.watch('stakeAmount');
  const parsedStakeAmount = parseUnits(stakeAmount || '0') ?? BigInt(0);
  useEffect(() => {
    if (parsedStakeAmount > BigInt(0) && allowanceLp && allowanceLp > BigInt(0) && allowanceLp >= parsedStakeAmount) {
      setIsLpApproved(true);
    } else {
      setIsLpApproved(false);
    }
  }, [parsedStakeAmount, isPendingAllowanceLp, allowanceLp]);

  // ------------------------------
  //  质押提交
  // ------------------------------
  const {
    stakeLp,
    isPending: isPendingStake,
    isConfirming: isConfirmingStake,
    isConfirmed: isConfirmedStake,
    writeError: errorStake,
  } = useStakeLp(extensionAddress);

  async function handleStake(values: FormValues) {
    try {
      await stakeLp(parseUnits(values.stakeAmount) ?? BigInt(0));
    } catch (error) {
      console.error('Stake failed', error);
    }
  }

  // ------------------------------
  //  质押成功后的处理
  // ------------------------------
  useEffect(() => {
    if (isConfirmedStake) {
      toast.success('质押LP成功');
      // 重置表单
      form.reset();
      // 2秒后返回
      setTimeout(() => {
        router.push(`/my/myaction?id=${actionInfo.head.id}&symbol=${token?.symbol}`);
      }, 2000);
    }
  }, [isConfirmedStake]);

  // ------------------------------
  //  错误处理
  // ------------------------------
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorLpToken) {
      handleContractError(errorLpToken, 'extension');
    }
    if (errorLpBalance) {
      handleContractError(errorLpBalance, 'token');
    }
    if (errApproveLp) {
      handleContractError(errApproveLp, 'token');
    }
    if (errorStake) {
      handleContractError(errorStake, 'extension');
    }
    if (errAllowanceLp) {
      handleContractError(errAllowanceLp, 'token');
    }
    if (errorData) {
      handleContractError(errorData, 'extension');
    }
  }, [errorLpToken, errorLpBalance, errApproveLp, errorStake, errAllowanceLp, errorData]);

  // ------------------------------
  //  组件渲染
  // ------------------------------
  if (isPendingLpToken || isPendingData) {
    return <LoadingIcon />;
  }

  return (
    <>
      {/* 如果已质押，显示参与信息 */}
      {isStaked && (
        <div className="flex flex-col items-center px-4 pt-1">
          <StakeLpStatsCard
            stakedAmount={stakedAmount || BigInt(0)}
            lpRatioStr={lpRatioStr}
            userScore={userScore}
            totalScore={totalScore}
            userGovVotes={userGovVotes}
            totalGovVotes={totalGovVotes}
          />

          {/* 治理票数不足的警告 */}
          {userGovVotes < minGovVotes && (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-3 w-full">
              <div className="font-medium">⚠️ 治理票数不足</div>
              <div className="mt-1">
                你的治理票数 <span className="font-semibold">{userGovVotes.toString()}</span> 低于最小门槛{' '}
                <span className="font-semibold">{minGovVotes.toString()}</span>，无法获得得分和激励。
              </div>
              <div className="text-xs text-amber-600 mt-1">请质押更多代币以增加治理票数。</div>
            </div>
          )}
        </div>
      )}

      {/* 质押表单 */}
      <div className="px-6 pt-6 pb-2">
        <LeftTitle title={isStaked ? '增加LP质押' : '质押LP参与'} />
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4 pt-2">
            {/* LP质押数 */}
            <FormField
              control={form.control}
              name="stakeAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-greyscale-500 font-normal">{isStaked ? '' : 'LP质押数：'}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        isStaked ? `最大可追加 ${formatTokenAmount(lpBalance || BigInt(0), 4)}` : `请输入LP质押数量`
                      }
                      type="number"
                      disabled={!lpBalance || lpBalance <= BigInt(0)}
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
                          form.setValue('stakeAmount', formatUnits(lpBalance));
                        }
                      }}
                      className="text-secondary p-0 ml-6"
                      disabled={!lpBalance || lpBalance <= BigInt(0)}
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
                disabled={isPendingAllowanceLp || isPendingApproveLp || isConfirmingApproveLp || isLpApproved}
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
                disabled={!isLpApproved || isPendingStake || isConfirmingStake || isConfirmedStake}
                type="button"
                onClick={() => {
                  form.handleSubmit((values) => handleStake(values))();
                }}
              >
                {isPendingStake
                  ? '2.提交中...'
                  : isConfirmingStake
                  ? '2.确认中...'
                  : isConfirmedStake
                  ? '2.已质押'
                  : '2.质押'}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* 增加一个帮助信息 */}
      <div className="px-6 pt-0 pb-4">
        <div className="text-greyscale-500 text-sm">
          提示：质押LP参与扩展行动后，可以随时取回LP，取回不会影响已产生的激励
        </div>
      </div>

      <LoadingOverlay
        isLoading={isPendingApproveLp || isConfirmingApproveLp || isPendingStake || isConfirmingStake}
        text={isPendingApproveLp || isPendingStake ? '提交交易...' : '确认交易...'}
      />
    </>
  );
};

export default ActionExtensionJoinPanel;
