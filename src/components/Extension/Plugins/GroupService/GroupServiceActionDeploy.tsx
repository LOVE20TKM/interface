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
import { useCreateExtension } from '@/src/hooks/extension/plugins/group-service/contracts/useLOVE20ExtensionGroupServiceFactory';

// ABI
import { LOVE20ExtensionGroupServiceFactoryAbi } from '@/src/abis/LOVE20ExtensionGroupServiceFactory';

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
});

type FormValues = z.infer<typeof formSchema>;

/**
 * 链群服务扩展部署组件
 */
export default function GroupServiceActionDeploy({ factoryAddress }: GroupServiceActionDeployProps) {
  const context = useContext(TokenContext);
  const tokenAddress = context?.token?.address || ('' as `0x${string}`);
  const tokenSymbol = context?.token?.symbol || '';

  // 表单实例
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupActionTokenAddress: '',
    },
    mode: 'onChange', // 实时验证
  });

  // 链群行动扩展协议工厂合约地址（从环境变量获取）
  const groupActionFactoryAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_GROUP_ACTION ||
    '') as `0x${string}`;

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
          abi: LOVE20ExtensionGroupServiceFactoryAbi,
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
    // 验证链群行动扩展协议工厂合约地址
    if (!groupActionFactoryAddress) {
      toast.error('链群行动扩展协议工厂合约地址未配置');
      return;
    }
    if (!isAddress(groupActionFactoryAddress)) {
      toast.error('链群行动扩展协议工厂合约地址格式无效');
      return;
    }

    try {
      setApprovalStep('deploying');

      await createExtension(
        tokenAddress,
        values.groupActionTokenAddress as `0x${string}`,
        groupActionFactoryAddress as `0x${string}`,
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
          <CardTitle className="text-xl md:text-2xl">部署链群服务扩展合约</CardTitle>
          <CardDescription className="text-sm">每1个新的链群服务行动，都对应1个专属扩展合约</CardDescription>
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
                    <FormLabel>链群行动所在代币地址</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="0x..." disabled={approvalStep !== 'idle'} {...field} />
                    </FormControl>
                    <FormDescription className="text-sm text-greyscale-500">
                      仅限链群服务所在代币地址或其子币地址
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
