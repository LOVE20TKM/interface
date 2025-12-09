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
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';

// my hooks
import { formatTokenAmount, formatUnits, parseUnits } from '@/src/lib/format';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { useApprove, useBalanceOf, useAllowance } from '@/src/hooks/contracts/useLOVE20Token';
import { useJoin, useJoinedAmountByActionId } from '@/src/hooks/contracts/useLOVE20Join';
import { useVerificationInfosByAccount } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { calculateTokensFor100Percent } from '@/src/lib/probabilityUtils';

// contexts / types / etc
import { ActionInfo } from '@/src/types/love20types';
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

// ------------------------------
//  这里开始：定义表单校验
// ------------------------------

interface FormValues {
  additionalStakeAmount: string; // 参与数量
  rounds: string; // 轮数
  verificationInfos: string[]; // 多项验证信息
}

interface SubmitJoinProps {
  actionInfo: ActionInfo;
  stakedAmount: bigint | undefined;
}

const SubmitJoin: React.FC<SubmitJoinProps> = ({ actionInfo, stakedAmount: myStakedAmount }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取代币余额
  const { balance: tokenBalance, error: errorTokenBalance } = useBalanceOf(
    token?.address as `0x${string}`,
    account as `0x${string}`,
  );

  // 获取已授权数量
  const {
    allowance: allowanceToken,
    isPending: isPendingAllowanceToken,
    error: errAllowanceToken,
  } = useAllowance(
    token?.address as `0x${string}`,
    account as `0x${string}`,
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN as `0x${string}`,
  );

  // 获取验证信息
  const {
    verificationKeys,
    verificationInfos: oldUserVerificationInfos,
    isPending: isPendingVerificationInfo,
    error: errorVerificationInfo,
  } = useVerificationInfosByAccount(
    (token?.address as `0x${string}`) || '',
    BigInt(actionInfo.head.id),
    account as `0x${string}`,
  );

  // 获取总代币数，用于计算100%概率所需代币
  const { joinedAmountByActionId, error: errorJoinedAmount } = useJoinedAmountByActionId(
    (token?.address as `0x${string}`) || '',
    BigInt(actionInfo.head.id),
  );

  // 定义授权状态变量：是否已完成代币授权
  const [isTokenApproved, setIsTokenApproved] = useState(false);

  // 计算达到100%概率所需的代币数
  const tokensFor100Percent =
    joinedAmountByActionId && joinedAmountByActionId > BigInt(0)
      ? calculateTokensFor100Percent(joinedAmountByActionId, Number(actionInfo.body.maxRandomAccounts || 0))
      : BigInt(0);

  // 动态构造 zod schema
  const formSchema = z.object({
    // 参与数量
    additionalStakeAmount: z
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
        { message: '参与代币数不能为 0' },
      )
      // 检查输入的数值不小于活动最小限制。但是追加的话不用检查
      .refine(
        (val) => {
          const inputVal = parseUnits(val);
          if (myStakedAmount && myStakedAmount > BigInt(0)) {
            return inputVal !== null && inputVal > BigInt(0);
          }
          return inputVal !== null && inputVal >= BigInt(actionInfo.body.minStake);
        },
        { message: '参与代币数不能小于最小参与限制' },
      )
      // 检查输入的数值不能超过持有代币数
      .refine(
        (val) => {
          const inputVal = parseUnits(val);
          return inputVal !== null && tokenBalance !== undefined && inputVal <= tokenBalance;
        },
        { message: '您的代币余额不足' },
      ),

    // 多项验证信息
    verificationInfos: z.array(z.string().min(1, { message: '验证信息不能为空' })),
  });

  // ------------------------------
  //  表单实例
  // ------------------------------
  const defaultVerificationInfos = actionInfo.body.verificationKeys.map(() => '');
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      additionalStakeAmount: '',
      verificationInfos: defaultVerificationInfos,
    },
    mode: 'onChange',
  });

  // 修改后的 useEffect：将 verificationKeys 和 verificationInfos 生成映射字典，再构造最终数组填入表单
  useEffect(() => {
    if (oldUserVerificationInfos && oldUserVerificationInfos.length > 0 && verificationKeys) {
      // 构造映射字典：key 为 verificationKeys 中的值，value 为对应位置的 verificationInfos
      const verificationMap: Record<string, string> = {};
      verificationKeys.forEach((key, index) => {
        verificationMap[key] = oldUserVerificationInfos[index];
      });

      // 根据 actionInfo.body.verificationKeys 的顺序构造最终数组，如果找不到则填空字符串
      const finalVerificationInfos = actionInfo.body.verificationKeys.map((key) => {
        return verificationMap[key] ?? '';
      });

      form.setValue('verificationInfos', finalVerificationInfos);
    }
  }, [oldUserVerificationInfos, verificationKeys, form, actionInfo.body.verificationKeys]);

  // ------------------------------
  //  授权(approve)
  // ------------------------------
  const {
    approve: approveToken,
    isPending: isPendingApprove,
    isConfirming: isConfirmingApprove,
    isConfirmed: isConfirmedApprove,
    writeError: errApprove,
  } = useApprove(token?.address as `0x${string}`);

  // 新增：为授权按钮设置 ref ，用于在授权等待状态结束后调用 blur() 取消 hover 效果
  const approveButtonRef = useRef<HTMLButtonElement>(null);
  const prevIsPendingAllowanceTokenRef = useRef(isPendingAllowanceToken);
  useEffect(() => {
    // 当 isPendingAllowanceToken 从 true 变为 false 时调用 blur()
    if (prevIsPendingAllowanceTokenRef.current && !isPendingAllowanceToken && approveButtonRef.current) {
      approveButtonRef.current.blur();
    }
    prevIsPendingAllowanceTokenRef.current = isPendingAllowanceToken;
  }, [isPendingAllowanceToken]);

  async function handleApprove(values: FormValues) {
    // 确保 newStake 始终为 bigint，避免 null
    const newStake = parseUnits(values.additionalStakeAmount) ?? BigInt(0);
    if (newStake === BigInt(0) && myStakedAmount && myStakedAmount > BigInt(0)) {
      toast.error('当前无需授权。');
      return;
    }

    try {
      await approveToken(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN as `0x${string}`, newStake);
    } catch (error) {
      console.error('Approve failed', error);
    }
  }

  // 监听授权交易确认后更新状态
  useEffect(() => {
    if (isConfirmedApprove) {
      setIsTokenApproved(true);
      toast.success(`授权${token?.symbol}成功`);
    }
  }, [isConfirmedApprove, token?.symbol]);

  // 监听用户输入的质押数量及链上返回的授权额度判断是否已授权
  const additionalStakeAmount = form.watch('additionalStakeAmount');
  const parsedStakeAmount = parseUnits(additionalStakeAmount || '0') ?? BigInt(0);
  useEffect(() => {
    if (
      parsedStakeAmount > BigInt(0) &&
      allowanceToken &&
      allowanceToken > BigInt(0) &&
      allowanceToken >= parsedStakeAmount
    ) {
      setIsTokenApproved(true);
    } else {
      setIsTokenApproved(false);
    }
  }, [parsedStakeAmount, isPendingAllowanceToken, allowanceToken]);

  // ------------------------------
  //  加入提交
  // ------------------------------
  const {
    join,
    isPending: isPendingJoin,
    isConfirming: isConfirmingJoin,
    isConfirmed: isConfirmedJoin,
    writeError: errorJoin,
  } = useJoin();

  async function handleJoin(values: FormValues) {
    try {
      // 检查用户是否之前填写过验证信息
      const isFirstTimeSubmit =
        !oldUserVerificationInfos || oldUserVerificationInfos.every((info) => !info || info.trim() === '');

      // 检查当前表单值是否与原有值完全相同
      let verificationInfosToSubmit = values.verificationInfos;

      if (!isFirstTimeSubmit && oldUserVerificationInfos && verificationKeys) {
        // 比较新旧值是否完全相同
        const isSameAsOld =
          verificationKeys.length === values.verificationInfos.length &&
          (verificationKeys as string[]).every((key, index) => {
            const oldMapIndex = (verificationKeys as string[]).indexOf(key);
            return oldMapIndex >= 0 && oldUserVerificationInfos[oldMapIndex] === values.verificationInfos[index];
          });

        // 如果完全相同，提交空数组
        if (isSameAsOld) {
          verificationInfosToSubmit = [];
        }
      } else if (isFirstTimeSubmit) {
        // 首次提交，检查是否所有项都已填写
        const hasEmptyFields = values.verificationInfos.some((info) => !info || info.trim() === '');
        if (hasEmptyFields) {
          toast.error('首次提交需要填写所有验证信息');
          return;
        }
      }

      await join(
        token?.address as `0x${string}`,
        BigInt(actionInfo.head.id),
        parseUnits(values.additionalStakeAmount) ?? BigInt(0),
        verificationInfosToSubmit,
      );
    } catch (error) {
      console.error('Join failed', error);
    }
  }

  // ------------------------------
  //  加入成功后的处理
  // ------------------------------
  useEffect(() => {
    if (isConfirmedJoin) {
      toast.success('加入成功');
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
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorTokenBalance) {
      handleContractError(errorTokenBalance, 'token');
    }
    if (errorVerificationInfo) {
      handleContractError(errorVerificationInfo, 'join');
    }
    if (errApprove) {
      handleContractError(errApprove, 'token');
    }
    if (errorJoin) {
      handleContractError(errorJoin, 'join');
    }
    if (errAllowanceToken) {
      handleContractError(errAllowanceToken, 'token');
    }
    if (errorJoinedAmount) {
      handleContractError(errorJoinedAmount, 'join');
    }
  }, [errorTokenBalance, errorVerificationInfo, errApprove, errorJoin, errAllowanceToken, errorJoinedAmount]);

  // ------------------------------
  //  组件渲染
  // ------------------------------
  if (isPendingVerificationInfo) {
    return <LoadingIcon />;
  }

  return (
    <>
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-1 mb-4">
          <LeftTitle title={myStakedAmount ? '增加参与代币' : '参与行动'} />
        </div>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* 参与代币数 */}
            <FormField
              control={form.control}
              name="additionalStakeAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-greyscale-500 font-normal">
                    {myStakedAmount ? '' : '参与代币数:'}{' '}
                    {tokensFor100Percent > BigInt(0) && !myStakedAmount && (
                      <span className="text-sm text-gray-500">
                        (100%概率抽中，至少需{' '}
                        <span className="text-secondary">{formatTokenAmount(tokensFor100Percent, 4, 'ceil')}</span>
                        代币)
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        myStakedAmount
                          ? `最大可追加 ${formatTokenAmount(tokenBalance || BigInt(0))}`
                          : `最小参与代币数 ${formatTokenAmount(BigInt(actionInfo.body.minStake))}`
                      }
                      type="number"
                      disabled={!tokenBalance || tokenBalance <= BigInt(0)}
                      className="!ring-secondary-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription className="flex items-center">
                    <span>
                      共有 <span className="text-secondary">{formatTokenAmount(tokenBalance || BigInt(0))}</span>{' '}
                      {token?.symbol}
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => {
                        if (tokenBalance && tokenBalance > BigInt(0)) {
                          form.setValue('additionalStakeAmount', formatUnits(tokenBalance));
                        }
                      }}
                      className="text-secondary p-0 ml-6"
                      disabled={!tokenBalance || tokenBalance <= BigInt(0)}
                    >
                      全部
                    </Button>
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* 多项验证信息：根据 verificationKeys 动态生成输入框 */}
            {actionInfo.body.verificationKeys.map((key, index) => (
              <FormField
                key={key + index}
                control={form.control}
                // 注意这里的 name，需要用 `verificationInfos.${index}`
                name={`verificationInfos.${index}`}
                render={({ field }) => (
                  <FormItem>
                    {/* label 显示对应的 key */}
                    <FormLabel className="text-greyscale-500 font-normal">{key}</FormLabel>
                    <FormControl>
                      {/* placeholder 显示对应的 verificationInfoGuides[index] */}
                      <Textarea
                        placeholder={actionInfo.body.verificationInfoGuides[index] || ''}
                        className="!ring-secondary-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            {/* 操作按钮 */}
            <div className="flex justify-center space-x-4 pt-2">
              <Button
                ref={approveButtonRef} // 将 ref 绑定到授权按钮上
                className="w-1/2"
                disabled={isPendingAllowanceToken || isPendingApprove || isConfirmingApprove || isTokenApproved}
                type="button"
                onClick={() => {
                  form.handleSubmit((values) => handleApprove(values))();
                }}
              >
                {isPendingAllowanceToken ? (
                  <Loader2 className="animate-spin" />
                ) : isPendingApprove ? (
                  '1.提交中...'
                ) : isConfirmingApprove ? (
                  '1.确认中...'
                ) : isTokenApproved ? (
                  `1.${token?.symbol}已授权`
                ) : (
                  `1.授权${token?.symbol}`
                )}
              </Button>

              <Button
                className="w-1/2"
                disabled={!isTokenApproved || isPendingJoin || isConfirmingJoin || isConfirmedJoin}
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
        <div className="text-greyscale-500 text-sm">提示：加入行动后，可以随时取回参与代币，无等待期</div>
      </div>

      <LoadingOverlay
        isLoading={isPendingApprove || isConfirmingApprove || isPendingJoin || isConfirmingJoin}
        text={isPendingApprove || isPendingJoin ? '提交交易...' : '确认交易...'}
      />
    </>
  );
};

export default SubmitJoin;
