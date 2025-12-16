'use client';

// React
import { useContext, useEffect, useState } from 'react';

// 第三方库
import toast from 'react-hot-toast';
import { isAddress, parseEther } from 'viem';

// UI 组件
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useApprove } from '@/src/hooks/contracts/useLOVE20Token';
import {
  useCreateExtension,
  useExtensionsAtIndex,
  useExtensionsCount,
} from '@/src/hooks/extension/plugins/group-service/contracts/useLOVE20ExtensionGroupServiceFactory';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

interface GroupServiceActionDeployProps {
  factoryAddress: `0x${string}`;
}

/**
 * 链群服务扩展部署组件
 */
export default function GroupServiceActionDeploy({ factoryAddress }: GroupServiceActionDeployProps) {
  const context = useContext(TokenContext);
  const tokenAddress = context?.token?.address || ('' as `0x${string}`);
  const tokenSymbol = context?.token?.symbol || '';

  // 表单状态
  const [groupActionTokenAddress, setGroupActionTokenAddress] = useState(''); // 链群行动所在代币地址
  const [maxRecipients, setMaxRecipients] = useState(''); // 激励分配地址数上限

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

  // 存储部署的扩展地址
  const [deployedExtensionAddress, setDeployedExtensionAddress] = useState<`0x${string}` | null>(null);
  const [shouldQueryExtension, setShouldQueryExtension] = useState(false);

  // 查询扩展总数
  const { count: extensionsCount, isPending: isCountPending } = useExtensionsCount(factoryAddress);

  // 查询最新的扩展地址（只在交易确认后查询）
  const { extension: latestExtension, isPending: isExtensionPending } = useExtensionsAtIndex(
    factoryAddress,
    shouldQueryExtension && extensionsCount !== undefined ? extensionsCount - BigInt(1) : BigInt(0),
  );

  // 交易确认后，触发查询最新扩展
  useEffect(() => {
    if (isConfirmed && hash && !deployedExtensionAddress) {
      console.log('交易已确认，准备查询最新扩展地址');
      setShouldQueryExtension(true);
    }
  }, [isConfirmed, hash, deployedExtensionAddress]);

  // 获取到最新扩展地址后保存
  useEffect(() => {
    if (shouldQueryExtension && latestExtension && !deployedExtensionAddress) {
      setDeployedExtensionAddress(latestExtension);
      console.log('扩展合约已部署，地址:', latestExtension);
      toast.success('扩展部署成功！');
      setShouldQueryExtension(false);
    }
  }, [shouldQueryExtension, latestExtension, deployedExtensionAddress]);

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
   * 验证表单数据
   */
  const validateForm = (): boolean => {
    // 验证链群行动所在代币地址
    if (!groupActionTokenAddress) {
      toast.error('请输入链群行动所在代币地址');
      return false;
    }
    if (!isAddress(groupActionTokenAddress)) {
      toast.error('链群行动所在代币地址格式无效');
      return false;
    }

    // 验证链群行动扩展协议工厂合约地址
    if (!groupActionFactoryAddress) {
      toast.error('链群行动扩展协议工厂合约地址未配置');
      return false;
    }
    if (!isAddress(groupActionFactoryAddress)) {
      toast.error('链群行动扩展协议工厂合约地址格式无效');
      return false;
    }

    // 验证激励分配地址数上限
    if (!maxRecipients) {
      toast.error('请输入激励分配地址数上限');
      return false;
    }
    const maxRecipientsNum = parseFloat(maxRecipients);
    if (isNaN(maxRecipientsNum) || maxRecipientsNum <= 0 || !Number.isInteger(maxRecipientsNum)) {
      toast.error('激励分配地址数上限必须是大于0的整数');
      return false;
    }

    return true;
  };

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
  const handleDeploy = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setApprovalStep('deploying');

      await createExtension(
        tokenAddress,
        groupActionTokenAddress as `0x${string}`,
        groupActionFactoryAddress as `0x${string}`,
        BigInt(maxRecipients),
      );
    } catch (error: any) {
      console.error('部署扩展失败:', error);
      toast.error(error?.message || '部署扩展失败');
      setApprovalStep('approved');
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-4 md:px-6 pb-4 md:pb-6 pt-4 md:pt-6">
        <CardTitle className="text-xl md:text-2xl">部署链群服务扩展合约</CardTitle>
        <CardDescription className="text-sm">每1个新的链群服务行动，都对应1个专属扩展合约</CardDescription>
      </CardHeader>
      <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
        <form className="space-y-4 md:space-y-6">
          {/* 链群行动所在代币地址 */}
          <div className="space-y-2">
            <Label htmlFor="groupActionTokenAddress">1. 链群行动所在代币地址</Label>
            <Input
              id="groupActionTokenAddress"
              type="text"
              placeholder="0x..."
              value={groupActionTokenAddress}
              onChange={(e) => setGroupActionTokenAddress(e.target.value)}
              disabled={approvalStep !== 'idle'}
            />
            <p className="text-sm text-greyscale-500">仅限链群服务所在代币地址或其子币地址</p>
          </div>

          {/* 激励分配地址数上限 */}
          <div className="space-y-2">
            <Label htmlFor="maxRecipients">2. 激励分配地址数上限</Label>
            <Input
              id="maxRecipients"
              type="number"
              placeholder="比如 10"
              value={maxRecipients}
              onChange={(e) => setMaxRecipients(e.target.value)}
              disabled={approvalStep !== 'idle'}
              min="1"
              step="1"
              className="max-w-40 md:max-w-xs"
            />
            <p className="text-sm text-greyscale-500">设置链群服务激励可分配的最大地址数量</p>
          </div>

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
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-700">✨ 扩展已部署！请复制合约地址，在创建行动时设置为扩展地址。</p>
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
                  onClick={handleDeploy}
                  className="w-1/2"
                  disabled={(approvalStep !== 'approved' && approvalStep !== 'deploying') || isPending || isConfirming}
                >
                  {isPending ? '2.部署中...' : isConfirming ? '2.确认中...' : '2.部署扩展'}
                </Button>
              </div>

              <div>
                <div className="flex items-center gap-2 mt-2 mb-1">
                  <div className="text-sm font-medium text-gray-700 mb-1">💡 小贴士：</div>
                </div>
                <p className="text-sm text-greyscale-500">需转 1个 {tokenSymbol} 给合约地址，用于加入行动</p>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
