'use client';

import { useContext, useEffect, useMemo, useRef } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { toast } from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// shadcn/ui
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

// my funcs
import { formatPercentage, formatTokenAmount, formatUnits, parseUnits } from '@/src/lib/format';
import { formatPhaseText } from '@/src/lib/domainUtils';

// my hooks
import { useAccountStakeStatus, useStakeToken } from '@/src/hooks/contracts/useLOVE20Stake';
import { useTokenApproval } from '@/src/hooks/contracts/useTokenApproval';
import { useMaxGovBoostRewardMultiplier } from '@/src/hooks/contracts/useLOVE20Mint';
import { useMyGovData } from '@/src/hooks/composite/useMyGovData';
// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import LoadingIcon from '../Common/LoadingIcon';
import InfoTooltip from '@/src/components/Common/InfoTooltip';

interface StakeTokenPanelProps {
  tokenBalance: bigint;
}

const RECOMMENDATION_RATIO_PRECISION = BigInt('1000000000000000000');

// 1. 定义 Zod 校验规则
//   - 质押代币数不能为0
//   - 质押代币数不能大于持有代币数
//   - releasePeriod 必须选择
function stakeSchemaFactory(tokenBalance: bigint) {
  return z.object({
    stakeTokenAmount: z
      .string()
      .refine((val) => val.trim() !== '', {
        message: '请输入质押数量',
      })
      .refine((val) => Number(val) > 0, {
        message: '质押代币数不能为0',
      })
      .refine((val) => parseUnits(val) <= tokenBalance, {
        message: '质押代币数不能大于持有代币数',
      }),
    // 修改解锁期验证规则，要求必须选择
    releasePeriod: z.string().min(1, '请选择解锁期'),
  });
}

const StakeTokenPanel: React.FC<StakeTokenPanelProps> = ({ tokenBalance }) => {
  const { address: account } = useAccount();
  const chainId = useChainId();
  const { token } = useContext(TokenContext) || {};

  const {
    stakeToken,
    isPending: isPendingStakeToken,
    isConfirming: isConfirmingStakeToken,
    isConfirmed: isConfirmedStakeToken,
    writeError: errStakeToken,
  } = useStakeToken();

  // 0. 获取质押状态(解锁期)
  const {
    stAmount,
    promisedWaitingPhases,
    isPending: isPendingAccountStakeStatus,
    error: errAccountStakeStatus,
  } = useAccountStakeStatus(token?.address as `0x${string}`, account as `0x${string}`);

  const {
    validGovVotes,
    govData,
    isPending: isPendingGovData,
  } = useMyGovData({
    tokenAddress: token?.address as `0x${string}`,
    account: account as `0x${string}`,
  });
  const {
    maxGovBoostRewardMultiplier,
    isPending: isPendingMaxGovBoostRewardMultiplier,
  } = useMaxGovBoostRewardMultiplier();

  // 在文件顶部添加环境变量读取
  const PROMISED_WAITING_PHASES_MIN = Number(process.env.NEXT_PUBLIC_PROMISED_WAITING_PHASES_MIN) || 1;
  const PROMISED_WAITING_PHASES_MAX = Number(process.env.NEXT_PUBLIC_PROMISED_WAITING_PHASES_MAX) || 2;

  // 2. 初始化表单
  const form = useForm<z.infer<ReturnType<typeof stakeSchemaFactory>>>({
    resolver: zodResolver(stakeSchemaFactory(tokenBalance)),
    defaultValues: {
      stakeTokenAmount: '',
      releasePeriod: '', // 移除默认值
    },
    mode: 'onChange',
  });

  const stakeTokenAmountValue = form.watch('stakeTokenAmount');
  const parsedStakeToken = parseUnits(stakeTokenAmountValue || '0');

  const {
    isApproved: isTokenApproved,
    isChecking: isPendingAllowanceToken,
    isApprovingTx: isPendingApproveToken,
    isConfirming: isConfirmingApproveToken,
    approve: approveToken,
    error: errApproveToken,
    approvalActionText,
  } = useTokenApproval({
    token: token?.address as `0x${string}` | undefined,
    owner: account as `0x${string}` | undefined,
    spender: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE as `0x${string}`,
    amount: parsedStakeToken,
    enabled: !!token?.address && !!account,
    successMessage: `授权${token?.symbol}成功`,
  });

  // 新增：为授权按钮创建 ref
  const approveButtonRef = useRef<HTMLButtonElement>(null);
  // 保存 isPendingAllowanceToken 的上一个值
  const prevIsPendingAllowance = useRef(isPendingAllowanceToken);

  // 当 isPendingAllowanceToken 从 true 变为 false 时，调用按钮的 blur() 方法
  useEffect(() => {
    if (prevIsPendingAllowance.current && !isPendingAllowanceToken) {
      approveButtonRef.current?.blur();
    }
    prevIsPendingAllowance.current = isPendingAllowanceToken;
  }, [isPendingAllowanceToken]);

  // 3. 授权按钮点击
  const handleApprove = async (data: z.infer<ReturnType<typeof stakeSchemaFactory>>) => {
    try {
      await approveToken();
    } catch (error: any) {
      console.error('Approve failed', error);
      console.error('Approve error:', error);
    }
  };

  // 4. 质押按钮点击
  const handleStake = async (data: z.infer<ReturnType<typeof stakeSchemaFactory>>) => {
    try {
      await stakeToken(
        token?.address as `0x${string}`,
        parseUnits(data.stakeTokenAmount),
        BigInt(data.releasePeriod),
        account as `0x${string}`,
      );
    } catch (error) {
      console.error('Stake failed', error);
      console.error('Stake error:', error);
    }
  };

  // 监听质押成功
  useEffect(() => {
    if (isConfirmedStakeToken) {
      toast.success('质押成功');
      // 重置表单
      form.reset();
      // 2秒后刷新页面，跳转到治理首页
      setTimeout(() => {
        window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/gov?symbol=${token?.symbol}`;
      }, 2000);
    }
  }, [isConfirmedStakeToken, form, token?.symbol]);

  const recommendedStakeTokenData = useMemo(() => {
    if (validGovVotes === undefined || !govData || maxGovBoostRewardMultiplier === undefined) {
      return null;
    }

    const totalGovVotes = govData.govVotes || BigInt(0);
    const totalStakedTokenAmount = govData.stAmount || BigInt(0);
    const currentStakedTokenAmount = stAmount || BigInt(0);

    const govCapRatio =
      totalGovVotes > BigInt(0)
        ? (validGovVotes * RECOMMENDATION_RATIO_PRECISION * maxGovBoostRewardMultiplier) / totalGovVotes
        : BigInt(0);

    if (govCapRatio >= RECOMMENDATION_RATIO_PRECISION) {
      return {
        theoreticalAmount: undefined,
        govCapRatio,
        denominatorRatio: BigInt(0),
        numeratorAmount: BigInt(0),
        totalGovVotes,
        validGovVotes,
        totalStakedTokenAmount,
        currentStakedTokenAmount,
        maxGovBoostRewardMultiplier,
        noFiniteReason: '我的治理票上限占比已大于等于 100%，理论上没有有限推荐上限。',
      };
    }

    const denominatorRatio = RECOMMENDATION_RATIO_PRECISION - govCapRatio;
    const numerator = govCapRatio * totalStakedTokenAmount - currentStakedTokenAmount * RECOMMENDATION_RATIO_PRECISION;
    const numeratorAmount = (govCapRatio * totalStakedTokenAmount) / RECOMMENDATION_RATIO_PRECISION - currentStakedTokenAmount;
    const theoreticalAmount = numerator > BigInt(0) ? numerator / denominatorRatio : BigInt(0);

    return {
      theoreticalAmount,
      recommendedAmount: theoreticalAmount,
      govCapRatio,
      denominatorRatio,
      numeratorAmount,
      totalGovVotes,
      validGovVotes,
      totalStakedTokenAmount,
      currentStakedTokenAmount,
      maxGovBoostRewardMultiplier,
      noFiniteReason: '',
    };
  }, [validGovVotes, govData, maxGovBoostRewardMultiplier, stAmount]);

  const isPendingRecommendedStakeToken =
    (isPendingGovData || isPendingMaxGovBoostRewardMultiplier) && !recommendedStakeTokenData;
  const recommendedStakeTokenText = isPendingRecommendedStakeToken
    ? '计算中...'
    : !recommendedStakeTokenData
    ? '-'
    : recommendedStakeTokenData.recommendedAmount === undefined
    ? '不限'
    : formatTokenAmount(recommendedStakeTokenData.recommendedAmount, 4);
  const hasRecommendedStakeTokenAmount =
    recommendedStakeTokenData?.recommendedAmount !== undefined &&
    (recommendedStakeTokenData?.recommendedAmount || BigInt(0)) > BigInt(0);
  const recommendedStakeTokenHelp = useMemo(() => {
    if (!recommendedStakeTokenData) {
      return <div className="text-sm text-gray-600">正在读取治理票和质押数据。</div>;
    }

    const govCapRatioText = formatPercentage(
      (Number(recommendedStakeTokenData.govCapRatio) / Number(RECOMMENDATION_RATIO_PRECISION)) * 100,
    );
    const denominatorRatioText = formatPercentage(
      (Number(recommendedStakeTokenData.denominatorRatio) / Number(RECOMMENDATION_RATIO_PRECISION)) * 100,
    );
    const formatSignedTokenAmount = (amount: bigint) => {
      if (amount < BigInt(0)) return `-${formatTokenAmount(-amount, 4)}`;
      return formatTokenAmount(amount, 4);
    };

    return (
      <div className="space-y-2 text-sm leading-relaxed">
        <p>推荐（估算）值是本次可提交的追加质押数量，目标是降低加速激励溢出。</p>
        <p>简化假设：所有治理者都会投票并参与验证，因此用全局 ST 质押量估算加速激励占比。</p>
        <p>估算上限占比 r = 我的有效治理票 / 总治理票 × 加速激励倍数。</p>
        <p>理论追加量 x = (r × 当前总加速质押 - 我已加速质押) / (1 - r)。</p>
        <div className="space-y-1 rounded border border-gray-200 bg-gray-50 p-3">
          <div className="flex justify-between gap-3">
            <span>我的有效治理票</span>
            <span className="font-mono text-secondary">{formatTokenAmount(recommendedStakeTokenData.validGovVotes, 4)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>总治理票</span>
            <span className="font-mono text-secondary">{formatTokenAmount(recommendedStakeTokenData.totalGovVotes, 4)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>加速激励倍数</span>
            <span className="font-mono text-secondary">
              {recommendedStakeTokenData.maxGovBoostRewardMultiplier.toString()}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span>上限占比 r</span>
            <span className="font-mono text-secondary">{govCapRatioText}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>当前总加速质押 T</span>
            <span className="font-mono text-secondary">
              {formatTokenAmount(recommendedStakeTokenData.totalStakedTokenAmount, 4)}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span>我已加速质押 A</span>
            <span className="font-mono text-secondary">
              {formatTokenAmount(recommendedStakeTokenData.currentStakedTokenAmount, 4)}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-2 text-xs text-gray-600">公式：x = (r × T - A) / (1 - r)</div>
          {recommendedStakeTokenData.theoreticalAmount === undefined ? (
            <div className="text-secondary">{recommendedStakeTokenData.noFiniteReason}</div>
          ) : (
            <>
              <div className="flex justify-between gap-3">
                <span>r × T - A</span>
                <span className="font-mono text-secondary">
                  {formatSignedTokenAmount(recommendedStakeTokenData.numeratorAmount)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>1 - r</span>
                <span className="font-mono text-secondary">{denominatorRatioText}</span>
              </div>
              <div className="flex justify-between gap-3 font-medium">
                <span>理论追加 x</span>
                <span className="font-mono text-secondary">
                  {formatTokenAmount(recommendedStakeTokenData.theoreticalAmount, 4)}
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between gap-3 font-medium">
            <span>本次推荐（估算）</span>
            <span className="font-mono text-secondary">{recommendedStakeTokenText}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">这是按当前全局治理票和 ST 质押量的简化估算。</p>
      </div>
    );
  }, [recommendedStakeTokenData, recommendedStakeTokenText]);

  if (isPendingAccountStakeStatus) {
    return (
      <div className="w-full flex flex-col items-center pt-0 p-6">
        <LoadingIcon />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center pt-0 p-6">
      <div className="w-full text-left mb-4">
        <LeftTitle title="质押增加治理收益" />
      </div>

      {/* 5. 使用 shadcn/ui 的 Form 组件，结合 react-hook-form */}
      <Form {...form}>
        {/* 用于阻止默认提交，这里手动分别处理"授权""质押" */}
        <form onSubmit={(e) => e.preventDefault()} className="w-full max-w-md space-y-4">
          {/* 质押数量 */}
          <FormField
            control={form.control}
            name="stakeTokenAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">质押数：</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={`输入 ${token?.symbol} 数量`}
                    className="!ring-secondary-foreground"
                    {...field}
                  />
                </FormControl>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between items-center">
                    <span>
                      持有 <span className="mr-2">{formatTokenAmount(tokenBalance)}</span>
                      {token?.symbol}
                    </span>
                    <Button
                      variant="link"
                      size="sm"
                      type="button"
                      onClick={() => {
                        form.setValue('stakeTokenAmount', formatUnits(tokenBalance || BigInt(0)));
                      }}
                      disabled={tokenBalance <= BigInt(0)}
                      className="text-secondary mr-2"
                    >
                      全部
                    </Button>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="min-w-0 inline-flex flex-wrap items-center gap-1 break-words">
                      <span>
                        推荐质押（估算） <span className="text-secondary">{recommendedStakeTokenText}</span> {token?.symbol}
                      </span>
                      <InfoTooltip title="推荐质押（估算）数量说明" content={recommendedStakeTokenHelp} className="p-0" />
                    </span>
                    <Button
                      variant="link"
                      size="sm"
                      type="button"
                      onClick={() => {
                        if (hasRecommendedStakeTokenAmount && recommendedStakeTokenData?.recommendedAmount !== undefined) {
                          form.setValue('stakeTokenAmount', formatUnits(recommendedStakeTokenData.recommendedAmount), {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }
                      }}
                      disabled={!hasRecommendedStakeTokenAmount}
                      className="text-secondary mr-2 shrink-0"
                    >
                      推荐
                    </Button>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="releasePeriod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>解锁期：</FormLabel>
                <FormControl>
                  <Select onValueChange={(value) => field.onChange(value)} value={field.value}>
                    <SelectTrigger className="w-full !ring-secondary-foreground">
                      <SelectValue placeholder="选择解锁期长度" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        { length: PROMISED_WAITING_PHASES_MAX - PROMISED_WAITING_PHASES_MIN + 1 },
                        (_, i) => i + PROMISED_WAITING_PHASES_MIN,
                      )
                        .filter((item) => item >= promisedWaitingPhases)
                        .map((item) => (
                          <SelectItem key={item} value={String(item)}>
                            {formatPhaseText(item)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>提示：取消质押后，需等待解锁期过后才能取回代币</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 按钮组：1.授权；2.质押 */}
          <div className="flex justify-center space-x-4">
            {/* <Button type="button" className="w" disabled={true}>
              第1次内测体验, 暂时关闭加速质押
            </Button> */}
            <Button
              // 为授权按钮添加 ref
              ref={approveButtonRef}
              className="w-1/2"
              disabled={isPendingAllowanceToken || isPendingApproveToken || isConfirmingApproveToken || isTokenApproved}
              onClick={() => form.handleSubmit(handleApprove)()}
            >
              {isPendingAllowanceToken ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : isPendingApproveToken ? (
                '1.授权中...'
              ) : isConfirmingApproveToken ? (
                '1.确认中...'
              ) : isTokenApproved ? (
                `1.${token?.symbol}已授权`
              ) : (
                `1.${approvalActionText}${token?.symbol}`
              )}
            </Button>
            <Button
              className="w-1/2"
              disabled={!isTokenApproved || isPendingStakeToken || isConfirmingStakeToken || isConfirmedStakeToken}
              onClick={() => form.handleSubmit(handleStake)()}
            >
              {isPendingStakeToken
                ? '2.质押中...'
                : isConfirmingStakeToken
                ? '2.确认中...'
                : isConfirmedStakeToken
                ? '2.已质押'
                : '2.质押'}
            </Button>
          </div>
        </form>
      </Form>

      {/* Loading遮罩 */}
      <LoadingOverlay
        isLoading={isPendingApproveToken || isConfirmingApproveToken || isPendingStakeToken || isConfirmingStakeToken}
        text={isPendingApproveToken || isPendingStakeToken ? '提交交易...' : '确认交易...'}
      />
    </div>
  );
};

export default StakeTokenPanel;
