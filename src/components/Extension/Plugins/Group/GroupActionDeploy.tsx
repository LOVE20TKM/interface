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
} from '@/src/hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupActionFactory';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

interface GroupActionDeployProps {
  factoryAddress: `0x${string}`;
}

/**
 * 链群行动扩展部署组件
 */
export default function GroupActionDeploy({ factoryAddress }: GroupActionDeployProps) {
  const context = useContext(TokenContext);
  const tokenAddress = context?.token?.address || ('' as `0x${string}`);
  const tokenSymbol = context?.token?.symbol || '';

  // 从环境变量中获取固定的合约地址
  const groupManagerAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`;
  const groupDistrustAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_DISTRUST as `0x${string}`;

  // 表单状态
  const [stakeTokenAddress, setStakeTokenAddress] = useState(''); // 质押代币地址
  const [activationStakeAmount, setActivationStakeAmount] = useState(''); // 激活需质押代币数量
  const [maxJoinAmountMultiplier, setMaxJoinAmountMultiplier] = useState(''); // 最大参与代币倍数
  const [verifyCapacityMultiplier, setVerifyCapacityMultiplier] = useState(''); // 验证容量倍数

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

  // // 等待交易回执并解析事件获取扩展地址
  // const { data: receipt } = useWaitForTransactionReceipt({
  //   hash,
  // });

  // // 等待授权的交易回执
  // const { data: approveReceipt } = useWaitForTransactionReceipt({
  //   hash: approveHash,
  // });

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
    // 验证环境变量中的合约地址
    if (!groupManagerAddress || !isAddress(groupManagerAddress)) {
      toast.error('链群管理合约地址未配置或格式无效');
      return false;
    }

    if (!groupDistrustAddress || !isAddress(groupDistrustAddress)) {
      toast.error('链群不信任合约地址未配置或格式无效');
      return false;
    }

    // 验证质押代币地址
    if (!stakeTokenAddress) {
      toast.error('请输入质押代币地址');
      return false;
    }
    if (!isAddress(stakeTokenAddress)) {
      toast.error('质押代币地址格式无效');
      return false;
    }

    // 验证激活需质押代币数量
    if (!activationStakeAmount) {
      toast.error('请输入激活需质押代币数量');
      return false;
    }
    const activationStakeAmountNum = parseFloat(activationStakeAmount);
    if (isNaN(activationStakeAmountNum) || activationStakeAmountNum <= 0) {
      toast.error('激活需质押代币数量必须大于0');
      return false;
    }

    // 验证最大参与代币倍数
    if (!maxJoinAmountMultiplier) {
      toast.error('请输入最大参与代币倍数');
      return false;
    }
    const maxJoinAmountMultiplierNum = parseFloat(maxJoinAmountMultiplier);
    if (isNaN(maxJoinAmountMultiplierNum) || maxJoinAmountMultiplierNum <= 0) {
      toast.error('最大参与代币倍数必须是大于0的整数');
      return false;
    }

    // 验证容量倍数
    if (!verifyCapacityMultiplier) {
      toast.error('请输入验证容量倍数');
      return false;
    }
    const verifyCapacityMultiplierNum = parseFloat(verifyCapacityMultiplier);
    if (isNaN(verifyCapacityMultiplierNum) || verifyCapacityMultiplierNum <= 0) {
      toast.error('验证容量倍数必须是大于0的整数');
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
      // 将 activationStakeAmount 从 eth 转换为 wei
      const activationStakeAmountWei = parseEther(activationStakeAmount);

      await createExtension(
        tokenAddress,
        groupManagerAddress as `0x${string}`,
        groupDistrustAddress as `0x${string}`,
        stakeTokenAddress as `0x${string}`,
        activationStakeAmountWei,
        BigInt(maxJoinAmountMultiplier),
        BigInt(verifyCapacityMultiplier),
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
        <CardTitle className="text-xl md:text-2xl">部署链群行动扩展合约</CardTitle>
        <CardDescription className="text-sm">每1个新的链群行动，都对应1个专属扩展合约</CardDescription>
      </CardHeader>
      <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
        <form className="space-y-4 md:space-y-6">
          {/* 质押代币地址 */}
          <div className="space-y-2">
            <Label htmlFor="stakeTokenAddress">1. 质押代币合约地址</Label>
            <Input
              id="stakeTokenAddress"
              type="text"
              placeholder="0x..."
              value={stakeTokenAddress}
              onChange={(e) => setStakeTokenAddress(e.target.value)}
              disabled={approvalStep !== 'idle'}
            />
            <p className="text-sm text-greyscale-500">所在社群的代币合约地址，也可设置为 LP 地址等</p>
          </div>

          {/* 激活需质押代币数量 */}
          <div className="space-y-2">
            <Label htmlFor="activationStakeAmount">2. 激活需质押代币数量</Label>
            <Input
              id="activationStakeAmount"
              type="number"
              placeholder="比如 1000"
              value={activationStakeAmount}
              onChange={(e) => setActivationStakeAmount(e.target.value)}
              disabled={approvalStep !== 'idle'}
              min="0"
              step="0.000001"
              className="max-w-40 md:max-w-xs"
            />
            <p className="text-sm text-greyscale-500">链群服务者激活链群时需质押的代币数量</p>
          </div>

          {/* 最大参与代币倍数 */}
          <div className="space-y-2">
            <Label htmlFor="maxJoinAmountMultiplier">3. 最大参与代币倍数</Label>
            <Input
              id="maxJoinAmountMultiplier"
              type="number"
              placeholder="比如 10000"
              value={maxJoinAmountMultiplier}
              onChange={(e) => setMaxJoinAmountMultiplier(e.target.value)}
              disabled={approvalStep !== 'idle'}
              min="1"
              className="max-w-40 md:max-w-xs"
            />
            <p className="text-sm text-greyscale-500">单个行动者最大参与代币数 = 已铸造代币总量 / 最大参与代币倍数</p>
          </div>

          {/* 验证容量倍数 */}
          <div className="space-y-2">
            <Label htmlFor="verifyCapacityMultiplier">4. 验证容量倍数</Label>
            <Input
              id="verifyCapacityMultiplier"
              type="number"
              placeholder="比如 10"
              value={verifyCapacityMultiplier}
              onChange={(e) => setVerifyCapacityMultiplier(e.target.value)}
              disabled={approvalStep !== 'idle'}
              min="1"
              className="max-w-40 md:max-w-xs"
            />
            <p className="text-sm text-greyscale-500">
              理论最大容量 = 治理票占比 × (已铸造代币量 - 流动性质押量 - 加速激励质押量) × 验证容量倍数
            </p>
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
