'use client';

// React
import { useContext, useEffect, useState } from 'react';

// Next.js
import Link from 'next/link';

// 第三方库
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { isAddress, parseEther, parseUnits, parseEventLogs } from 'viem';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { z } from 'zod';

// UI 组件
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';
import { useError } from '@/src/contexts/ErrorContext';

// hooks
import { useApprove, useBalanceOf } from '@/src/hooks/contracts/useLOVE20Token';
import { useTokenApprovalPreference } from '@/src/hooks/contracts/useTokenApproval';
import { useCanSubmit } from '@/src/hooks/composite/useCanSubmit';
import { useCreateExtension } from '@/src/hooks/extension/plugins/group/contracts/useExtensionGroupActionFactory';

// utils
import { formatPercentage } from '@/src/lib/format';

// ABI
import { ExtensionGroupActionFactoryAbi } from '@/src/abis/ExtensionGroupActionFactory';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

interface GroupActionDeployProps {
  factoryAddress: `0x${string}`;
}

// 表单验证 schema
const formSchema = z.object({
  joinTokenAddress: z
    .string()
    .min(1, { message: '请输入加入代币地址' })
    .refine((val): val is string => isAddress(val), { message: '加入代币地址格式无效' }),
  activationStakeAmount: z
    .string()
    .min(1, { message: '请输入激活需质押代币数量' })
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: '激活需质押代币数量必须大于0' },
    ),
  maxJoinAmountRatio: z
    .string()
    .min(1, { message: '请输入最大参与代币占比' })
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0.001 && num <= 100;
      },
      { message: '最大参与代币占比必须在 0.001% ~ 100% 之间' },
    ),
  activationMinGovRatio: z
    .string()
    .min(1, { message: '请输入激活链群最小治理票比例' })
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 100;
      },
      { message: '激活链群最小治理票比例必须在 0% ~ 100% 之间' },
    ),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * 链群行动扩展部署组件
 */
export default function GroupActionDeploy({ factoryAddress }: GroupActionDeployProps) {
  const { approvalActionText } = useTokenApprovalPreference();
  const context = useContext(TokenContext);
  const tokenAddress = context?.token?.address || ('' as `0x${string}`);
  const tokenSymbol = context?.token?.symbol || '';

  // 获取当前连接的账户地址
  const { address: accountAddress } = useAccount();
  // 获取错误上下文
  const { setError } = useError();
  // 获取用户代币余额
  const { balance: tokenBalance } = useBalanceOf(tokenAddress, accountAddress as `0x${string}`, !!accountAddress);

  // 检查是否可以提交（治理票检查）
  const {
    hasEnoughVotes,
    percentage: accountPercentage,
    validGovVotes,
    govData: totalGovVotes,
    SUBMIT_MIN_PERCENTAGE: SUBMIT_PERCENTAGE,
  } = useCanSubmit();

  // 表单实例
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      joinTokenAddress: tokenAddress || '',
      activationStakeAmount: '',
      maxJoinAmountRatio: '0.1',
      activationMinGovRatio: '0.1',
    },
    mode: 'onChange', // 实时验证
  });

  const { createExtension, isPending, isConfirming, isConfirmed, writeError, hash } =
    useCreateExtension(factoryAddress);

  // 授权代币的hook - 需要授权1个代币给factory
  const {
    approve,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isConfirmed: isApproveConfirmed,
    writeError: approveError,
    hash: approveHash,
  } = useApprove(tokenAddress);

  // 当tokenAddress变化时，更新表单默认值
  useEffect(() => {
    if (tokenAddress) {
      form.setValue('joinTokenAddress', tokenAddress);
    }
  }, [tokenAddress, form]);

  // 部署状态管理
  const [approvalStep, setApprovalStep] = useState<'idle' | 'approving' | 'approved' | 'deploying' | 'deployed'>(
    'idle',
  );

  // 等待交易回执并解析事件获取扩展地址
  const { data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  // 等待授权的交易回执
  useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // 存储部署的扩展地址
  const [deployedExtensionAddress, setDeployedExtensionAddress] = useState<`0x${string}` | null>(null);

  // 从交易回执中提取扩展地址
  useEffect(() => {
    if (receipt && receipt.logs) {
      try {
        // 解析 CreateExtension 事件
        const logs = parseEventLogs({
          abi: ExtensionGroupActionFactoryAbi,
          eventName: 'CreateExtension',
          logs: receipt.logs,
        });

        if (logs.length > 0 && logs[0].args.extension) {
          const extensionAddress = logs[0].args.extension as `0x${string}`;
          setDeployedExtensionAddress(extensionAddress);
          console.log('扩展合约已部署，地址:', extensionAddress);
          toast.success('扩展部署成功！');
        }
      } catch (error) {
        console.error('解析扩展地址失败:', error);
      }
    }
  }, [receipt]);

  // 监听授权完成
  useEffect(() => {
    if (isApproveConfirmed && approvalStep === 'approving') {
      setApprovalStep('approved');
      toast.success('授权成功！');
    }
  }, [isApproveConfirmed, approvalStep]);

  // 监听部署成功
  useEffect(() => {
    if (isConfirmed && deployedExtensionAddress) {
      setApprovalStep('deployed');
    }
  }, [isConfirmed, deployedExtensionAddress]);

  // 监听授权错误
  useEffect(() => {
    if (approveError) {
      toast.error(`授权失败: ${approveError.message}`);
      setApprovalStep('idle');
    }
  }, [approveError]);

  // 检查用户余额是否足够（需要1个token）
  useEffect(() => {
    if (tokenBalance !== undefined && tokenBalance < parseEther('1')) {
      setError({
        name: '代币余额不足',
        message: `部署扩展合约，需要1个${tokenSymbol}，请先充值`,
      });
    }
  }, [tokenBalance, tokenSymbol, setError]);

  // 检查治理票是否足够
  useEffect(() => {
    if (!hasEnoughVotes && validGovVotes !== undefined && totalGovVotes) {
      setError({
        name: '治理票不足',
        message: `有效治理票，须达到总治理票的${formatPercentage(
          SUBMIT_PERCENTAGE * 100,
          1,
        )}，才能部署扩展合约（您当前有效治理票占比${formatPercentage(accountPercentage * 100, 3)}）`,
      });
    }
  }, [hasEnoughVotes, validGovVotes, totalGovVotes, SUBMIT_PERCENTAGE, accountPercentage, setError]);

  /**
   * 步骤1: 授权代币
   */
  const handleApprove = async () => {
    if (!tokenAddress) {
      toast.error('未选择代币');
      return;
    }

    // 在授权前先验证表单
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error('请先完整填写表单');
      return;
    }

    try {
      setApprovalStep('approving');
      // 授权 1 个代币给 factory
      await approve(factoryAddress, parseEther('1'));
    } catch (error: any) {
      console.error('授权失败:', error);
      toast.error(error?.message || '授权失败');
      setApprovalStep('idle');
    }
  };

  /**
   * 步骤2: 部署扩展
   */
  const handleDeploy = async (values: FormValues) => {
    try {
      setApprovalStep('deploying');
      // 将 activationStakeAmount 从 eth 转换为 wei
      const activationStakeAmountWei = parseEther(values.activationStakeAmount);

      // 最大参与代币占比：百分比 -> wei (1e18 = 100%)
      // 公式：百分比 × 1e18 / 100 = wei
      const maxJoinAmountRatioWei = (parseUnits(values.maxJoinAmountRatio, 18) * BigInt(1)) / BigInt(100);

      // 激活链群最小治理票比例：百分比 -> wei (1e18 = 100%)
      const activationMinGovRatioWei = (parseUnits(values.activationMinGovRatio, 18) * BigInt(1)) / BigInt(100);

      await createExtension(
        tokenAddress,
        activationMinGovRatioWei,
        activationStakeAmountWei,
        values.joinTokenAddress as `0x${string}`,
        maxJoinAmountRatioWei,
      );
    } catch (error: any) {
      console.error('部署扩展失败:', error);
      toast.error(error?.message || '部署扩展失败');
      setApprovalStep('approved');
    }
  };

  return (
    <>
      <Card className="border-0 shadow-none">
        <CardHeader className="px-4 md:px-6 pb-4 md:pb-6 pt-4 md:pt-6">
          <CardTitle className="text-xl md:text-2xl">部署链群行动扩展合约</CardTitle>
          <CardDescription className="text-sm"></CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 md:space-y-6">
              {/* 加入代币地址 */}
              <FormField
                control={form.control}
                name="joinTokenAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>1. 参与行动所需代币的合约地址</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="0x..."
                        disabled={approvalStep !== 'idle'}
                        {...field}
                        onChange={(event) => {
                          const nextValue = event.target.value.replace(/\s+/g, '');
                          field.onChange(nextValue);
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-greyscale-500">
                      可以是普通代币地址或 LP 代币地址
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 激活需质押代币数量 */}
              <FormField
                control={form.control}
                name="activationStakeAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>2. 激活链群需质押代币数</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="比如 1000"
                        disabled={approvalStep !== 'idle'}
                        min="0"
                        step="0.000001"
                        className="max-w-40 md:max-w-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 最大参与代币占比 */}
              <FormField
                control={form.control}
                name="maxJoinAmountRatio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>3. 最大参与代币占比</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2 max-w-40 md:max-w-xs">
                        <Input
                          type="number"
                          placeholder="例如 0.1"
                          disabled={approvalStep !== 'idle'}
                          min="0.001"
                          max="100"
                          step="0.001"
                          className="flex-1"
                          {...field}
                        />
                        <span className="text-greyscale-500 text-base whitespace-nowrap">%</span>
                      </div>
                    </FormControl>
                    <FormDescription className="text-sm text-greyscale-500">
                      单个行动者最大参与代币数 = 已铸造代币总量 × 最大参与代币占比 × 该行动投票率
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 激活链群最小治理票比例 */}
              <FormField
                control={form.control}
                name="activationMinGovRatio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>4. 激活链群最小治理票比例</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2 max-w-40 md:max-w-xs">
                        <Input
                          type="number"
                          placeholder="例如 0.001"
                          disabled={approvalStep !== 'idle'}
                          min="0"
                          max="100"
                          step="0.001"
                          className="flex-1"
                          {...field}
                        />
                        <span className="text-greyscale-500 text-base whitespace-nowrap">%</span>
                      </div>
                    </FormControl>
                    <FormDescription className="text-sm text-greyscale-500">
                      服务者激活链群时，其治理票占比需不低于此值
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 错误信息 */}
              {writeError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">错误: {writeError.message}</p>
                </div>
              )}

              {/* 部署成功 - 显示扩展地址 */}
              {deployedExtensionAddress && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎉</span>
                    <p className="text-base font-semibold text-green-700">扩展部署完成！</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-greyscale-600">扩展合约地址:</p>
                    <AddressWithCopyButton address={deployedExtensionAddress} showAddress={true} />
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded space-y-3">
                    <p className="text-sm text-blue-700">✨ 扩展已部署！现在可以使用此扩展地址创建行动。</p>
                    <Button className="w-full" asChild>
                      <Link
                        href={`/action/new/?symbol=${tokenSymbol}&extension=${deployedExtensionAddress}`}
                        rel="noopener noreferrer"
                      >
                        立即创建行动
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {/* 授权和部署按钮 */}
              {!deployedExtensionAddress && (
                <>
                  <div className="flex space-x-4 w-full">
                    <Button
                      type="button"
                      onClick={handleApprove}
                      className="w-1/2"
                      disabled={
                        isApprovePending ||
                        isApproveConfirming ||
                        approvalStep === 'approved' ||
                        approvalStep === 'deploying' ||
                        approvalStep === 'deployed' ||
                        !hasEnoughVotes ||
                        (tokenBalance !== undefined && tokenBalance < parseEther('1'))
                      }
                    >
                      {isApprovePending
                        ? '1.提交中...'
                        : isApproveConfirming
                        ? '1.确认中...'
                        : approvalStep === 'approved' || approvalStep === 'deploying' || approvalStep === 'deployed'
                        ? '1.代币已授权'
                        : `1.${approvalActionText}代币`}
                    </Button>

                    <Button
                      type="button"
                      onClick={() => form.handleSubmit(handleDeploy)()}
                      className="w-1/2"
                      disabled={
                        (approvalStep !== 'approved' && approvalStep !== 'deploying') || isPending || isConfirming
                      }
                    >
                      {isPending ? '2.部署中...' : isConfirming ? '2.确认中...' : '2.部署扩展'}
                    </Button>
                  </div>

                  {/* 提示信息 */}
                  <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                    <div className="font-medium text-gray-700 mb-1">💡 小贴士</div>
                    <div className="space-y-1 text-gray-600">
                      <div>• 每个新的扩展行动，都需部署1个专属扩展合约</div>
                      <div>• 部署时会将 1个 {tokenSymbol} 转给扩展合约，用于扩展合约初始化</div>
                    </div>
                  </div>
                </>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
      <LoadingOverlay
        isLoading={isApprovePending || isApproveConfirming || isPending || isConfirming}
        text={
          isApprovePending
            ? '提交授权交易...'
            : isApproveConfirming
            ? '确认授权交易...'
            : isPending
            ? '提交部署交易...'
            : '确认部署交易...'
        }
      />
    </>
  );
}
