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
import { useWaitForTransactionReceipt } from 'wagmi';
import { z } from 'zod';

// UI 组件
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useApprove } from '@/src/hooks/contracts/useLOVE20Token';
import { useCreateExtension } from '@/src/hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupActionFactory';

// ABI
import { LOVE20ExtensionGroupActionFactoryAbi } from '@/src/abis/LOVE20ExtensionGroupActionFactory';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

interface GroupActionDeployProps {
  factoryAddress: `0x${string}`;
}

// 表单验证 schema
const formSchema = z.object({
  stakeTokenAddress: z
    .string()
    .min(1, { message: '请输入质押代币地址' })
    .refine((val): val is string => isAddress(val), { message: '质押代币地址格式无效' }),
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
  maxVerifyCapacityFactor: z
    .string()
    .min(1, { message: '请输入验证容量系数' })
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
      },
      { message: '验证容量系数必须是非负实数' },
    ),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * 链群行动扩展部署组件
 */
export default function GroupActionDeploy({ factoryAddress }: GroupActionDeployProps) {
  const context = useContext(TokenContext);
  const tokenAddress = context?.token?.address || ('' as `0x${string}`);
  const tokenSymbol = context?.token?.symbol || '';

  // 表单实例
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stakeTokenAddress: '',
      joinTokenAddress: '',
      activationStakeAmount: '',
      maxJoinAmountRatio: '',
      maxVerifyCapacityFactor: '',
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
        // 解析 ExtensionCreate 事件
        const logs = parseEventLogs({
          abi: LOVE20ExtensionGroupActionFactoryAbi,
          eventName: 'ExtensionCreate',
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
      // 将 activationStakeAmount 从 eth 转换为 wei
      const activationStakeAmountWei = parseEther(values.activationStakeAmount);

      // 最大参与代币占比：百分比 -> wei (1e18 = 100%)
      // 公式：百分比 × 1e18 / 100 = wei
      const maxJoinAmountRatioWei = (parseUnits(values.maxJoinAmountRatio, 18) * BigInt(1)) / BigInt(100);

      // 验证容量系数：实数 -> wei
      const maxVerifyCapacityFactorWei = parseEther(values.maxVerifyCapacityFactor);

      await createExtension(
        tokenAddress,
        values.stakeTokenAddress as `0x${string}`,
        values.joinTokenAddress as `0x${string}`,
        activationStakeAmountWei,
        maxJoinAmountRatioWei,
        maxVerifyCapacityFactorWei,
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
          <CardDescription className="text-sm">每1个新的链群行动，都对应1个专属扩展合约</CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 md:space-y-6">
              {/* 质押代币地址 */}
              <FormField
                control={form.control}
                name="stakeTokenAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>1. 服务者质押代币合约地址</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="0x..." disabled={approvalStep !== 'idle'} {...field} />
                    </FormControl>
                    <FormDescription className="text-sm text-greyscale-500">
                      所在社群的代币合约地址，也可设置为 LP 地址等
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 加入代币地址 */}
              <FormField
                control={form.control}
                name="joinTokenAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>2. 参与行动时使用的代币地址</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="0x..." disabled={approvalStep !== 'idle'} {...field} />
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
                    <FormLabel>3. 激活链群需质押的代币数</FormLabel>
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
                    <FormLabel>4. 最大参与代币占比（%）</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2 max-w-40 md:max-w-xs">
                        <Input
                          type="number"
                          placeholder="0.1 表示 0.1%"
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

              {/* 验证容量系数 */}
              <FormField
                control={form.control}
                name="maxVerifyCapacityFactor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>5. 最大验证容量系数</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="比如 1.5"
                        disabled={approvalStep !== 'idle'}
                        min="0"
                        step="0.01"
                        className="max-w-40 md:max-w-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-greyscale-500">
                      单个服务者理论最大容量 = 已铸造代币量 × 治理票占比 × 最大验证容量系数
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
                        : '1.授权 1' + tokenSymbol}
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

                  <div>
                    <div className="flex items-center gap-2 mt-2 mb-1">
                      <div className="text-sm font-medium text-gray-700 mb-1">💡 小贴士：</div>
                    </div>
                    <p className="text-sm text-greyscale-500">需转 1个 {tokenSymbol} 给合约地址，用于扩展协议初始化</p>
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
