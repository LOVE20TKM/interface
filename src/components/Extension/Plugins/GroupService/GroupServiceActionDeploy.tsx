'use client';

// React
import { useContext, useEffect, useState } from 'react';

// Next.js
import Link from 'next/link';

// 第三方库
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { isAddress, parseEther, parseEventLogs } from 'viem';
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
import { useCreateExtension } from '@/src/hooks/extension/plugins/group-service/contracts/useExtensionGroupServiceFactory';

// utils
import { formatPercentage } from '@/src/lib/format';

// ABI
import { ExtensionGroupServiceFactoryAbi } from '@/src/abis/ExtensionGroupServiceFactory';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

interface GroupServiceActionDeployProps {
  factoryAddress: `0x${string}`;
}

// 表单验证 schema
const formSchema = z.object({
  groupActionTokenAddress: z
    .string()
    .min(1, { message: '请输入链群行动所在代币地址' })
    .refine((val): val is string => isAddress(val), { message: '链群行动所在代币地址格式无效' }),
  govRatioMultiplier: z
    .string()
    .min(1, { message: '请输入治理票占比倍数' })
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0 && Number.isInteger(num);
      },
      { message: '治理票占比倍数必须是非负整数' },
    ),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * 链群服务扩展部署组件
 */
export default function GroupServiceActionDeploy({ factoryAddress }: GroupServiceActionDeployProps) {
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
      groupActionTokenAddress: tokenAddress || '',
      govRatioMultiplier: '',
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

  // 部署状态管理
  const [approvalStep, setApprovalStep] = useState<'idle' | 'approving' | 'approved' | 'deploying' | 'deployed'>(
    'idle',
  );

  // 当tokenAddress变化时，更新表单默认值
  useEffect(() => {
    if (tokenAddress) {
      form.setValue('groupActionTokenAddress', tokenAddress);
    }
  }, [tokenAddress, form]);

  // 等待交易回执并解析事件获取扩展地址
  const { data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  // 存储部署的扩展地址
  const [deployedExtensionAddress, setDeployedExtensionAddress] = useState<`0x${string}` | null>(null);

  // 从交易回执中提取扩展地址
  useEffect(() => {
    if (receipt && receipt.logs) {
      try {
        // 解析 CreateExtension 事件
        const logs = parseEventLogs({
          abi: ExtensionGroupServiceFactoryAbi,
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

      await createExtension(
        tokenAddress,
        values.groupActionTokenAddress as `0x${string}`,
        BigInt(values.govRatioMultiplier),
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
          <CardTitle className="text-xl md:text-2xl">部署链群服务行动扩展合约</CardTitle>
          <CardDescription className="text-sm"></CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 md:space-y-6">
              {/* 链群行动所在代币地址 */}
              <FormField
                control={form.control}
                name="groupActionTokenAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>1. 链群行动所在代币合约地址</FormLabel>
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
                      仅限链群服务所在代币地址或其子币地址
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 治理票占比倍数 */}
              <FormField
                control={form.control}
                name="govRatioMultiplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>2. 治理票占比倍数</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="比如 2"
                        disabled={approvalStep !== 'idle'}
                        min="0"
                        step="1"
                        className="max-w-40 md:max-w-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-greyscale-500">
                      服务者所属链群，参与代币总量占比，超过 (治理票占比 × 治理票占比倍数) 的部分，不再有铸币激励
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
