'use client';

import { useContext, useEffect, useState, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowUpDown, HelpCircle, Settings, Zap } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// my utils
import { formatTokenAmount, formatUnits, parseUnits } from '@/src/lib/format';
import { formatPhaseText } from '@/src/lib/domainUtils';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';
import { useError } from '@/src/contexts/ErrorContext';

// my hooks
import { useApprove } from '@/src/hooks/contracts/useLOVE20Token';
import { useStakeLpPageData } from '@/src/hooks/composite/useStakeLpPageData';
import { useAccountStakeStatus, useInitialStakeRound } from '@/src/hooks/contracts/useLOVE20Stake';
import { useStakeLiquidity } from '@/src/hooks/contracts/useLOVE20Hub';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

// --------------------------------------------------
// 1. 定义校验规则 (zod schema)
// --------------------------------------------------
/**
 * 注意：
 *  - 使用 regex 校验输入格式必须是数值，且小数位数 <= 12
 *  - 使用 refine 分别校验不能为 0，不能大于对应余额
 */
function buildFormSchema(parentTokenBalance: bigint, tokenBalance: bigint) {
  return z.object({
    parentToken: z.preprocess(
      (val) => {
        if (typeof val !== 'string') return val;
        let sanitized = val.replace(/。/g, '.');
        if (sanitized.startsWith('.')) {
          sanitized = '0' + sanitized;
        }
        return sanitized;
      },
      z
        .string()
        .regex(/^\d+(\.\d{1,18})?$/, '请输入合法数值，最多支持18位小数')
        .refine((val) => {
          const parsed = parseUnits(val);
          return parsed !== null && parsed > BigInt(0);
        }, '质押父币数不能为 0')
        .refine((val) => {
          const parsed = parseUnits(val);
          return parsed !== null && parsed <= parentTokenBalance;
        }, '质押父币数不能超过当前持有'),
    ),

    stakeToken: z.preprocess(
      (val) => {
        if (typeof val !== 'string') return val;
        let sanitized = val.replace(/。/g, '.');
        if (sanitized.startsWith('.')) {
          sanitized = '0' + sanitized;
        }
        return sanitized;
      },
      z
        .string()
        .regex(/^\d+(\.\d{1,18})?$/, '请输入合法数值，最多支持18位小数')
        .refine((val) => {
          const parsed = parseUnits(val);
          return parsed !== null && parsed > BigInt(0);
        }, '质押 token 数不能为 0')
        .refine((val) => {
          const parsed = parseUnits(val);
          return parsed !== null && parsed <= tokenBalance;
        }, '质押 token 数不能超过当前持有'),
    ),

    // 修改解锁期验证规则，要求必须选择
    releasePeriod: z.string().min(1, '请选择解锁期'),
  });
}

// --------------------------------------------------
// 2. 组件主体
// --------------------------------------------------
interface StakeLiquidityPanelProps {}

const StakeLiquidityPanel: React.FC<StakeLiquidityPanelProps> = ({}) => {
  const { address: account } = useAccount();
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('TokenContext 必须在 TokenProvider 内使用');
  }
  const { token, setToken, clearToken } = context;
  const { setError } = useError();
  const { first: isFirstTimeStake } = useRouter().query;

  // 获取质押LP页面数据（包含 pairInfo 和授权信息）
  const {
    pairInfo,
    allowanceToken,
    allowanceParentToken,
    isPending: isPendingStakeLpData,
    error: errorStakeLpData,
  } = useStakeLpPageData({
    account: account as `0x${string}`,
    tokenAddress: token?.address as `0x${string}`,
    parentTokenAddress: token?.parentTokenAddress as `0x${string}`,
  });

  // 从 pairInfo 中读取余额
  const tokenBalance = pairInfo?.balanceOfToken ?? BigInt(0);
  const parentTokenBalance = pairInfo?.balanceOfParentToken ?? BigInt(0);

  // 判断 pairReserve 是否有效
  const pairExists =
    pairInfo && BigInt(pairInfo.pairReserveToken) > BigInt(0) && BigInt(pairInfo.pairReserveParentToken) > BigInt(0);

  // 是否是首次质押
  const [updatedInitialStakeRound, setUpdatedInitialStakeRound] = useState(false);

  // 获取首次质押轮数
  const {
    initialStakeRound,
    isPending: isPendingInitialStakeRound,
    error: errInitialStakeRound,
  } = useInitialStakeRound(token?.address as `0x${string}`);

  // 在文件顶部添加环境变量读取
  const PROMISED_WAITING_PHASES_MIN = Number(process.env.NEXT_PUBLIC_PROMISED_WAITING_PHASES_MIN) || 4;
  const PROMISED_WAITING_PHASES_MAX = Number(process.env.NEXT_PUBLIC_PROMISED_WAITING_PHASES_MAX) || 12;

  // --------------------------------------------------
  // 2.1 使用 React Hook Form
  // --------------------------------------------------
  const form = useForm<z.infer<ReturnType<typeof buildFormSchema>>>({
    resolver: zodResolver(buildFormSchema(parentTokenBalance || BigInt(0), tokenBalance || BigInt(0))),
    defaultValues: {
      parentToken: '',
      stakeToken: '',
      releasePeriod: '',
    },
    mode: 'onChange',
  });

  // --------------------------------------------------
  // 2.1 获取质押状态
  // --------------------------------------------------
  const {
    govVotes,
    promisedWaitingPhases,
    isPending: isPendingAccountStakeStatus,
    error: errAccountStakeStatus,
  } = useAccountStakeStatus(token?.address as `0x${string}`, account as `0x${string}`);

  // --------------------------------------------------
  // 2.2 授权逻辑，使用 useApprove 保持不变
  // --------------------------------------------------
  const [isTokenApproved, setIsTokenApproved] = useState(false);
  const [isParentTokenApproved, setIsParentTokenApproved] = useState(false);

  const {
    approve: approveToken,
    isPending: isPendingApproveToken,
    isConfirming: isConfirmingApproveToken,
    isConfirmed: isConfirmedApproveToken,
    writeError: errApproveToken,
  } = useApprove(token?.address as `0x${string}`);

  const {
    approve: approveParentToken,
    isPending: isPendingApproveParentToken,
    isConfirming: isConfirmingApproveParentToken,
    isConfirmed: isConfirmedApproveParentToken,
    writeError: errApproveParentToken,
  } = useApprove(token?.parentTokenAddress as `0x${string}`);

  async function onApproveToken(data: z.infer<ReturnType<typeof buildFormSchema>>) {
    try {
      const stakeAmount = parseUnits(data.stakeToken);
      if (stakeAmount === null) throw new Error('无效的输入格式');
      await approveToken(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_HUB as `0x${string}`, stakeAmount);
    } catch (error) {
      console.error('Token 授权失败', error);
      toast.error('token 授权失败，请检查输入格式');
    }
  }

  async function onApproveParentToken(data: z.infer<ReturnType<typeof buildFormSchema>>) {
    try {
      const parentAmount = parseUnits(data.parentToken);
      if (parentAmount === null) throw new Error('无效的输入格式');
      await approveParentToken(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_HUB as `0x${string}`, parentAmount);
    } catch (error) {
      console.error('父币授权失败', error);
      toast.error('父币授权失败，请检查输入格式');
    }
  }

  useEffect(() => {
    if (isConfirmedApproveToken) {
      setIsTokenApproved(true);
      toast.success(`授权${token?.symbol}成功`);
    }
  }, [isConfirmedApproveToken]);

  useEffect(() => {
    if (isConfirmedApproveParentToken) {
      setIsParentTokenApproved(true);
      toast.success(`授权${token?.parentTokenSymbol}成功`);
    }
  }, [isConfirmedApproveParentToken]);

  // --------------------------------------------------
  // 2.3 自动计算兑换数量，利用 pairReserve 进行计算
  // --------------------------------------------------
  // 标记是否由用户手动输入，目的是区分"自动计算"与手动输入
  const [isParentTokenChangedByUser, setIsParentTokenChangedByUser] = useState(false);
  const [isTokenChangedByUser, setIsTokenChangedByUser] = useState(false);

  const parentTokenValue = form.watch('parentToken');
  const stakeTokenValue = form.watch('stakeToken');
  const parsedParentToken = parseUnits(parentTokenValue);
  const parsedStakeToken = parseUnits(stakeTokenValue);

  // 当用户修改父币时，根据 pairReserve 计算 token 数量
  useEffect(() => {
    if (pairExists && isParentTokenChangedByUser) {
      if (parsedParentToken !== null && parsedParentToken > BigInt(0)) {
        const computedStakeToken =
          (parsedParentToken * BigInt(pairInfo!.pairReserveToken)) / BigInt(pairInfo!.pairReserveParentToken);
        const computedStakeTokenStr = Number(formatUnits(computedStakeToken))
          .toFixed(12)
          .replace(/\.?0+$/, '');
        form.setValue('stakeToken', computedStakeTokenStr, { shouldValidate: true });
        setIsParentTokenChangedByUser(false);
        setIsTokenChangedByUser(false);
      }
    }
  }, [pairExists, isParentTokenChangedByUser, parsedParentToken, pairInfo, form]);

  // 当用户修改 token 时，根据 pairReserve 计算父币数量
  useEffect(() => {
    if (pairExists && isTokenChangedByUser) {
      if (parsedStakeToken !== null && parsedStakeToken > BigInt(0)) {
        const computedParentToken =
          (parsedStakeToken * BigInt(pairInfo!.pairReserveParentToken)) / BigInt(pairInfo!.pairReserveToken);
        const computedParentTokenStr = Number(formatUnits(computedParentToken))
          .toFixed(12)
          .replace(/\.?0+$/, '');
        form.setValue('parentToken', computedParentTokenStr, { shouldValidate: true });
        setIsParentTokenChangedByUser(false);
        setIsTokenChangedByUser(false);
      }
    }
  }, [pairExists, isTokenChangedByUser, parsedStakeToken, pairInfo, form]);

  // 根据授权额度判断授权状态
  useEffect(() => {
    if (parsedParentToken > BigInt(0) && allowanceParentToken && allowanceParentToken >= parsedParentToken) {
      setIsParentTokenApproved(true);
    } else {
      setIsParentTokenApproved(false);
    }
  }, [parsedParentToken, allowanceParentToken]);

  useEffect(() => {
    if (parsedStakeToken > BigInt(0) && allowanceToken && allowanceToken >= parsedStakeToken) {
      setIsTokenApproved(true);
    } else {
      setIsTokenApproved(false);
    }
  }, [parsedStakeToken, allowanceToken]);

  // --------------------------------------------------
  // 2.4 质押逻辑
  // --------------------------------------------------
  const {
    stakeLiquidity,
    isPending: isPendingStakeLiquidity,
    isConfirming: isConfirmingStakeLiquidity,
    isConfirmed: isConfirmedStakeLiquidity,
    writeError: errStakeLiquidity,
  } = useStakeLiquidity();

  async function onStake(data: z.infer<ReturnType<typeof buildFormSchema>>) {
    // 必须已完成授权
    const bothApproved = isTokenApproved && isParentTokenApproved;
    if (!bothApproved) {
      toast.error('请先完成授权');
      return;
    }

    const stakeAmount = parseUnits(data.stakeToken);
    const parentAmount = parseUnits(data.parentToken);
    if (stakeAmount === null || parentAmount === null) {
      toast.error('转换金额时出错，请检查输入格式');
      return;
    }
    // 添加滑点计算
    const slippageBigInt = BigInt(Math.round(slippage * 10)); // 将百分比转换为千分之一
    const tokenAmountMin = (stakeAmount * (BigInt(1000) - slippageBigInt)) / BigInt(1000);
    const parentTokenAmountMin = (parentAmount * (BigInt(1000) - slippageBigInt)) / BigInt(1000);

    try {
      await stakeLiquidity(
        token?.address as `0x${string}`,
        stakeAmount,
        parentAmount,
        tokenAmountMin,
        parentTokenAmountMin,
        BigInt(data.releasePeriod),
        account as `0x${string}`,
      );
    } catch (error) {
      console.error('Stake failed', error);
      // 使用统一的错误处理
      handleContractError(error, 'stake');
    }
  }

  function handleStakeSuccess() {
    toast.success('质押成功');
    setTimeout(() => {
      window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/gov?symbol=${token?.symbol}`;
    }, 2000);
  }

  useEffect(() => {
    if (isConfirmedStakeLiquidity) {
      if (token?.initialStakeRound && token.initialStakeRound > 0) {
        handleStakeSuccess();
      } else {
        setUpdatedInitialStakeRound(true);
      }
    }
  }, [isConfirmedStakeLiquidity]);

  useEffect(() => {
    if (updatedInitialStakeRound && !isPendingInitialStakeRound) {
      if (!initialStakeRound) {
        clearToken(); // 清除token缓存，下一页重新加载
      }
      handleStakeSuccess();
    }
  }, [updatedInitialStakeRound, isPendingInitialStakeRound]);

  // 更新token缓存：已经有人质押了，所以要更新 token.initialStakeRound
  useEffect(() => {
    if (token && token.initialStakeRound == 0 && initialStakeRound && initialStakeRound > 0) {
      setToken({ ...token, initialStakeRound: Number(initialStakeRound) });
    }
  }, [token, initialStakeRound]);

  // --------------------------------------------------
  // 2.5 错误处理
  // --------------------------------------------------
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorStakeLpData) {
      handleContractError(errorStakeLpData, 'token');
    }
    if (errApproveToken) {
      handleContractError(errApproveToken, 'stake');
    }
    if (errApproveParentToken) {
      handleContractError(errApproveParentToken, 'stake');
    }
    if (errStakeLiquidity) {
      handleContractError(errStakeLiquidity, 'stake');
    }
    if (errInitialStakeRound) {
      handleContractError(errInitialStakeRound, 'stake');
    }
    if (errAccountStakeStatus) {
      handleContractError(errAccountStakeStatus, 'stake');
    }
  }, [
    errorStakeLpData,
    errApproveToken,
    errApproveParentToken,
    errStakeLiquidity,
    errInitialStakeRound,
    errAccountStakeStatus,
  ]);

  // --------------------------------------------------
  // 2.6 其它状态与提示
  // --------------------------------------------------
  const isApproving = isPendingApproveToken || isPendingApproveParentToken;
  const isApproveConfirming = isConfirmingApproveToken || isConfirmingApproveParentToken;
  const hadStartedApprove = isApproving || isApproveConfirming || (isTokenApproved && isParentTokenApproved);

  useEffect(() => {
    if (token && isFirstTimeStake === 'true' && !isPendingInitialStakeRound && !initialStakeRound) {
      setError({
        name: '提示：',
        message: '新部署的代币，需先质押获取治理票，才能后续操作',
      });
    }
  }, [token, isFirstTimeStake, isPendingInitialStakeRound, initialStakeRound]);

  useEffect(() => {
    if (!isPendingStakeLpData && !tokenBalance && !hadStartedApprove && token && token.symbol) {
      setError({
        name: '余额不足',
        message: `您当前${token.symbol}数量为0，请先获取${token.symbol}`,
      });
    }
    if (!isPendingStakeLpData && !parentTokenBalance && !hadStartedApprove && token && token.parentTokenSymbol) {
      setError({
        name: '余额不足',
        message: `您当前${token.parentTokenSymbol}数量为0，请先获取${token.parentTokenSymbol}`,
      });
    }
  }, [tokenBalance, parentTokenBalance, token, isPendingStakeLpData]);

  const approveTokenButtonRef = useRef<HTMLButtonElement>(null);
  const prevIsPendingApproveToken = useRef<boolean>(isPendingApproveToken);

  useEffect(() => {
    if (prevIsPendingApproveToken.current && !isPendingApproveToken) {
      approveTokenButtonRef.current?.blur();
    }
    prevIsPendingApproveToken.current = isPendingApproveToken;
  }, [isPendingApproveToken]);

  // 添加比例显示切换状态
  const [showTokenToParent, setShowTokenToParent] = useState(false);

  // 滑点设置状态
  const [slippage, setSlippage] = useState(2.5); // 默认2.5%
  const [isSlippageDialogOpen, setIsSlippageDialogOpen] = useState(false);
  const [customSlippage, setCustomSlippage] = useState('');

  if (!token || isPendingAccountStakeStatus || isPendingInitialStakeRound) {
    return <LoadingIcon />;
  }

  return (
    <>
      <div className="bg-white px-4">
        <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-full mx-auto space-y-4">
          <div className="w-full flex justify-between items-center">
            <LeftTitle title="质押获取治理票：" />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onStake)} className="space-y-3">
              {/* 存入代币部分 */}
              <Card>
                <CardContent className="p-3 md:p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-semibold">第1步: 填写质押数量</h2>
                      <Link
                        href="/dex/swap"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        获取代币
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* 父币输入 */}
                      <FormField
                        control={form.control}
                        name="parentToken"
                        render={({ field }) => (
                          <FormItem>
                            <Card className="bg-[#f7f8f9] border-none">
                              <CardContent className="py-4 px-2">
                                <div className="flex items-center justify-between mb-3">
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    {...field}
                                    disabled={hadStartedApprove}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      setIsParentTokenChangedByUser(true);
                                    }}
                                    className="text-xl border-none p-0 h-auto bg-transparent focus:ring-0 focus:outline-none mr-2"
                                  />
                                  <div className="flex items-center gap-2">
                                    <div className="bg-white hover:bg-gray-50 px-3 py-1.5 rounded-full transition-colors ">
                                      <span className="font-medium text-gray-800">{token?.parentTokenSymbol}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex gap-1">
                                    {[25, 50].map((percentage) => (
                                      <Button
                                        key={percentage}
                                        variant="outline"
                                        size="sm"
                                        type="button"
                                        onClick={() => {
                                          const amount = (parentTokenBalance * BigInt(percentage)) / BigInt(100);
                                          form.setValue('parentToken', formatUnits(amount), { shouldValidate: true });
                                          setIsParentTokenChangedByUser(true);
                                        }}
                                        disabled={hadStartedApprove || parentTokenBalance <= BigInt(0)}
                                        className="text-xs h-7 px-2 rounded-lg"
                                      >
                                        {percentage}%
                                      </Button>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      type="button"
                                      onClick={() => {
                                        form.setValue('parentToken', formatUnits(parentTokenBalance || BigInt(0)), {
                                          shouldValidate: true,
                                        });
                                        setIsParentTokenChangedByUser(true);
                                      }}
                                      disabled={parentTokenBalance <= BigInt(0)}
                                      className="text-xs h-7 px-2 rounded-lg"
                                    >
                                      最高
                                    </Button>
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    {formatTokenAmount(parentTokenBalance)} {token?.parentTokenSymbol}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Token 输入 */}
                      <FormField
                        control={form.control}
                        name="stakeToken"
                        render={({ field }) => (
                          <FormItem>
                            <Card className="bg-[#f7f8f9] border-none">
                              <CardContent className="py-4 px-2">
                                <div className="flex items-center justify-between mb-3">
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    {...field}
                                    disabled={tokenBalance <= BigInt(0)}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      setIsTokenChangedByUser(true);
                                    }}
                                    className="text-xl border-none p-0 h-auto bg-transparent focus:ring-0 focus:outline-none mr-2"
                                  />
                                  <div className="flex items-center gap-2">
                                    <div className="bg-white hover:bg-gray-50 px-3 py-1.5 rounded-full transition-colors">
                                      <span className="font-medium text-gray-800">{token?.symbol}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex gap-1">
                                    {[25, 50].map((percentage) => (
                                      <Button
                                        key={percentage}
                                        variant="outline"
                                        size="sm"
                                        type="button"
                                        onClick={() => {
                                          const amount = (tokenBalance * BigInt(percentage)) / BigInt(100);
                                          form.setValue('stakeToken', formatUnits(amount), { shouldValidate: true });
                                          setIsTokenChangedByUser(true);
                                        }}
                                        disabled={tokenBalance <= BigInt(0)}
                                        className="text-xs h-7 px-2 rounded-lg"
                                      >
                                        {percentage}%
                                      </Button>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      type="button"
                                      onClick={() => {
                                        form.setValue('stakeToken', formatUnits(tokenBalance || BigInt(0)), {
                                          shouldValidate: true,
                                        });
                                        setIsTokenChangedByUser(true);
                                      }}
                                      disabled={tokenBalance <= BigInt(0)}
                                      className="text-xs h-7 px-2 rounded-lg"
                                    >
                                      最高
                                    </Button>
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    {formatTokenAmount(tokenBalance)} {token?.symbol}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {pairExists && (
                      <div className="space-y-1 text-sm mt-2">
                        <div className="text-gray-600 flex items-center gap-1">
                          <HelpCircle className="w-4 h-4" />
                          质押比例按当前价格计算：
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-gray-600">
                            {showTokenToParent ? (
                              <>
                                1 {token?.symbol} ={' '}
                                {formatTokenAmount(
                                  (BigInt(pairInfo!.pairReserveParentToken) * BigInt(10 ** 18)) /
                                    BigInt(pairInfo!.pairReserveToken),
                                )}{' '}
                                {token?.parentTokenSymbol}
                              </>
                            ) : (
                              <>
                                1 {token?.parentTokenSymbol} ={' '}
                                {formatTokenAmount(
                                  (BigInt(pairInfo!.pairReserveToken) * BigInt(10 ** 18)) /
                                    BigInt(pairInfo!.pairReserveParentToken),
                                )}{' '}
                                {token?.symbol}
                              </>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTokenToParent(!showTokenToParent)}
                            className="h-6 w-6 p-0 hover:bg-gray-100 transition-colors"
                            title="切换比例显示"
                          >
                            <ArrowUpDown className="h-3 w-3 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {/* 滑点设置区域 */}
                    <div className="flex items-center text-sm mt-2">
                      <div className="text-gray-600 flex items-center gap-1 mr-2">
                        <Zap className="w-4 h-4" />
                        滑点上限：{slippage}%
                      </div>
                      <Dialog open={isSlippageDialogOpen} onOpenChange={setIsSlippageDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs hover:bg-gray-100 transition-colors"
                            title="设置滑点"
                          >
                            <Settings className="h-3 w-3" />
                            设置
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>滑点设置</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">选择滑点</label>
                              <div className="grid grid-cols-3 gap-2">
                                {[0.5, 1.0, 2.5].map((preset) => (
                                  <Button
                                    key={preset}
                                    type="button"
                                    variant={slippage === preset ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                      setSlippage(preset);
                                      setCustomSlippage('');
                                      setIsSlippageDialogOpen(false);
                                    }}
                                    className="text-xs"
                                  >
                                    {preset}%
                                  </Button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">自定义滑点</label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  placeholder="输入滑点百分比"
                                  value={customSlippage}
                                  onChange={(e) => setCustomSlippage(e.target.value)}
                                  className="flex-1"
                                  min="0"
                                  max="50"
                                  step="0.1"
                                />
                                <span className="text-sm text-gray-500">%</span>
                              </div>
                              {customSlippage && (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => {
                                    const value = parseFloat(customSlippage);
                                    if (value >= 0 && value <= 50) {
                                      setSlippage(value);
                                      setIsSlippageDialogOpen(false);
                                    } else {
                                      toast.error('滑点应在 0-50% 之间');
                                    }
                                  }}
                                  className="w-full"
                                >
                                  应用自定义滑点
                                </Button>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                              <p>• 滑点是指实际执行价格与预期价格之间的差异</p>
                              <p>• 较低的滑点可能导致交易失败，较高的滑点可能导致不利的价格</p>
                              <p>• 建议设置在 0.5% - 5% 之间</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 解锁期设置 */}
              <Card>
                <CardContent className="p-3 md:p-6">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">第2步: 选择解锁期</h2>
                    </div>

                    <FormField
                      control={form.control}
                      name="releasePeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select onValueChange={(value) => field.onChange(value)} value={field.value}>
                              <SelectTrigger className="w-full !ring-secondary-foreground">
                                <SelectValue placeholder="选择解锁期" />
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
                          <FormDescription>
                            "解锁期" 是指，取消质押后多久才能取回代币 (注意：是从取消质押的阶段结束时开始计算)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 授权并存入 */}
              <Card>
                <CardContent className="p-3 md:p-6">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">第3步: 授权并存入</h2>
                    </div>

                    <div className="flex justify-center lg:justify-start space-x-2">
                      <Button
                        type="button"
                        className="flex-1 lg:w-auto lg:px-4"
                        ref={approveTokenButtonRef}
                        disabled={isPendingApproveToken || isConfirmingApproveToken || isTokenApproved}
                        onClick={form.handleSubmit(onApproveToken)}
                      >
                        {isPendingApproveToken
                          ? `1.提交中...`
                          : isConfirmingApproveToken
                          ? `1.确认中...`
                          : isTokenApproved
                          ? `1.${token?.symbol}已授权`
                          : `1.授权${token?.symbol}`}
                      </Button>

                      <Button
                        type="button"
                        className="flex-1 lg:w-auto lg:px-4"
                        disabled={
                          !isTokenApproved ||
                          isPendingApproveParentToken ||
                          isConfirmingApproveParentToken ||
                          isParentTokenApproved
                        }
                        onClick={form.handleSubmit(onApproveParentToken)}
                      >
                        {isPendingApproveParentToken
                          ? `2.提交中...`
                          : isConfirmingApproveParentToken
                          ? `2.确认中...`
                          : isParentTokenApproved
                          ? `2.${token?.parentTokenSymbol}已授权`
                          : `2.授权${token?.parentTokenSymbol}`}
                      </Button>

                      <Button
                        type="submit"
                        className="flex-1 lg:w-auto lg:px-4"
                        disabled={
                          !isTokenApproved ||
                          !isParentTokenApproved ||
                          isPendingStakeLiquidity ||
                          isConfirmingStakeLiquidity ||
                          isConfirmedStakeLiquidity
                        }
                      >
                        {isPendingStakeLiquidity
                          ? '3.提交中...'
                          : isConfirmingStakeLiquidity
                          ? '3.确认中...'
                          : isConfirmedStakeLiquidity
                          ? '3.已提交'
                          : '3.提交'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        <LoadingOverlay
          isLoading={
            isApproving ||
            isApproveConfirming ||
            isPendingStakeLiquidity ||
            isConfirmingStakeLiquidity ||
            (isPendingInitialStakeRound && updatedInitialStakeRound)
          }
          text={isApproving || isPendingStakeLiquidity ? '提交交易...' : '确认交易...'}
        />
      </div>
    </>
  );
};

export default StakeLiquidityPanel;
