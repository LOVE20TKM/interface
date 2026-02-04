'use client';

import { useState, useContext, useEffect } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { isAddress, parseEther, parseUnits, parseEventLogs } from 'viem';
import { useWaitForTransactionReceipt } from 'wagmi';
import { z } from 'zod';
import { TokenContext } from '@/src/contexts/TokenContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCreateExtension } from '@/src/hooks/extension/plugins/lp/contracts/useExtensionLpFactory';
import { ExtensionLpFactoryAbi } from '@/src/abis/ExtensionLpFactory';
import { useApprove } from '@/src/hooks/contracts/useLOVE20Token';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

interface LpDeployProps {
  factoryAddress: `0x${string}`;
}

// 表单验证 schema
const formSchema = z.object({
  joinTokenAddress: z
    .string()
    .min(1, { message: '请输入LP Token地址' })
    .refine((val): val is string => isAddress(val), { message: 'LP Token地址格式无效' }),
  govRatioMultiplier: z
    .string()
    .min(1, { message: '请输入治理比率乘数' })
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0 && Number.isInteger(num);
      },
      { message: '治理比率乘数必须是非负整数' },
    ),
  minGovRatio: z
    .string()
    .min(1, { message: '请输入最小治理票占比' })
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 100;
      },
      { message: '最小治理票占比必须在 0% ~ 100% 之间' },
    ),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * LP扩展部署组件
 */
export default function LpDeploy({ factoryAddress }: LpDeployProps) {
  const context = useContext(TokenContext);
  const tokenAddress = context?.token?.address || ('' as `0x${string}`);
  const tokenSymbol = context?.token?.symbol || '';

  // 表单实例
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      joinTokenAddress: '',
      govRatioMultiplier: '',
      minGovRatio: '',
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

  // 等待交易回执并解析事件获取扩展地址
  const { data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  // 等待授权的交易回执
  const { data: approveReceipt } = useWaitForTransactionReceipt({
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
          abi: ExtensionLpFactoryAbi,
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

  /**
   * 步骤1: 授权代币
   */
  const handleApprove = async () => {
    if (!tokenAddress) {
      toast.error('未选择代币');
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
      // 最小治理票占比：百分比 -> wei (1e18 = 100%)
      // 公式：百分比 × 1e18 / 100 = wei
      const minGovRatioWei = (parseUnits(values.minGovRatio, 18) * BigInt(1)) / BigInt(100);

      await createExtension(
        tokenAddress,
        values.joinTokenAddress as `0x${string}`,
        BigInt(values.govRatioMultiplier),
        minGovRatioWei,
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
          <CardTitle className="text-xl md:text-2xl">部署LP池行动扩展合约</CardTitle>
          <CardDescription className="text-sm"></CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 md:space-y-6">
              {/* LP Token地址 */}
              <FormField
                control={form.control}
                name="joinTokenAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>1. LP代币合约地址</FormLabel>
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
                      包含当前行动所在代币的 LP 代币（Uniswap V2 Pair）合约地址
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 治理比率乘数 */}
              <FormField
                control={form.control}
                name="govRatioMultiplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>2. 治理比率乘数</FormLabel>
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
                      LP占比超过 (治理票占比 × 治理比率乘数) 的部分，不再有铸币激励
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 最小治理票占比 */}
              <FormField
                control={form.control}
                name="minGovRatio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>3. 加入行动所需最小治理票占比</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2 max-w-40 md:max-w-xs">
                        <Input
                          type="number"
                          placeholder="例如 0.1"
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
                      用户治理票占比低于此值时，无法加入行动
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
                        approvalStep === 'deployed'
                      }
                    >
                      {isApprovePending
                        ? '1.提交中...'
                        : isApproveConfirming
                        ? '1.确认中...'
                        : approvalStep === 'approved' || approvalStep === 'deploying' || approvalStep === 'deployed'
                        ? '1.代币已授权'
                        : '1.代币授权'}
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
