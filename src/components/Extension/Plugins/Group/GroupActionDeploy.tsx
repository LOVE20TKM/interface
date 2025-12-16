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
  const [minGovVoteRatioBps, setMinGovVoteRatioBps] = useState(''); // 最小治理票占比（基点，10000=100%）
  const [capacityMultiplier, setCapacityMultiplier] = useState(''); // 容量倍数
  const [stakingMultiplier, setStakingMultiplier] = useState(''); // 质押倍数
  const [maxJoinAmountMultiplier, setMaxJoinAmountMultiplier] = useState(''); // 最大参与代币倍数
  const [minJoinAmount, setMinJoinAmount] = useState(''); // 最小参与代币量

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

    // 验证最小治理票占比
    if (!minGovVoteRatioBps) {
      toast.error('请输入最小治理票占比');
      return false;
    }
    const minGovVoteRatioBpsNum = parseFloat(minGovVoteRatioBps);
    if (isNaN(minGovVoteRatioBpsNum) || minGovVoteRatioBpsNum < 0 || minGovVoteRatioBpsNum > 10000) {
      toast.error('最小治理票占比必须是0-10000之间的整数（10000=100%）');
      return false;
    }

    // 验证容量倍数
    if (!capacityMultiplier) {
      toast.error('请输入容量倍数');
      return false;
    }
    const capacityMultiplierNum = parseFloat(capacityMultiplier);
    if (isNaN(capacityMultiplierNum) || capacityMultiplierNum <= 0) {
      toast.error('容量倍数必须是大于0的整数');
      return false;
    }

    // 验证质押倍数
    if (!stakingMultiplier) {
      toast.error('请输入质押倍数');
      return false;
    }
    const stakingMultiplierNum = parseFloat(stakingMultiplier);
    if (isNaN(stakingMultiplierNum) || stakingMultiplierNum <= 0) {
      toast.error('质押倍数必须是大于0的整数');
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

    // 验证最小参与代币量
    if (!minJoinAmount) {
      toast.error('请输入最小参与代币量');
      return false;
    }
    const minJoinAmountNum = parseFloat(minJoinAmount);
    if (isNaN(minJoinAmountNum) || minJoinAmountNum < 0) {
      toast.error('最小参与代币量必须是非负数');
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
      // 将 minJoinAmount 从 eth 转换为 wei
      const minJoinAmountWei = parseEther(minJoinAmount);

      await createExtension(
        tokenAddress,
        groupManagerAddress as `0x${string}`,
        groupDistrustAddress as `0x${string}`,
        stakeTokenAddress as `0x${string}`,
        BigInt(minGovVoteRatioBps),
        BigInt(capacityMultiplier),
        BigInt(stakingMultiplier),
        BigInt(maxJoinAmountMultiplier),
        minJoinAmountWei,
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
            <Label htmlFor="stakeTokenAddress">1. 参与行动代币地址</Label>
            <Input
              id="stakeTokenAddress"
              type="text"
              placeholder="0x..."
              value={stakeTokenAddress}
              onChange={(e) => setStakeTokenAddress(e.target.value)}
              disabled={approvalStep !== 'idle'}
            />
          </div>

          {/* 最小治理票占比 */}
          <div className="space-y-2">
            <Label htmlFor="minGovVoteRatioBps">2. 最小治理票占比</Label>
            <Input
              id="minGovVoteRatioBps"
              type="number"
              placeholder="比如 100（表示1%）"
              value={minGovVoteRatioBps}
              onChange={(e) => setMinGovVoteRatioBps(e.target.value)}
              disabled={approvalStep !== 'idle'}
              min="0"
              max="10000"
              className="max-w-40 md:max-w-xs"
            />
            <p className="text-sm text-greyscale-500">治理票大于等于此比例的治理者可创建链群（10000=100%）</p>
          </div>

          {/* 容量倍数 */}
          <div className="space-y-2">
            <Label htmlFor="capacityMultiplier">3. 容量倍数</Label>
            <Input
              id="capacityMultiplier"
              type="number"
              placeholder="比如 10"
              value={capacityMultiplier}
              onChange={(e) => setCapacityMultiplier(e.target.value)}
              disabled={approvalStep !== 'idle'}
              min="1"
              className="max-w-40 md:max-w-xs"
            />
            <p className="text-sm text-greyscale-500">链群容量上限 = 基础容量 × 容量倍数</p>
          </div>

          {/* 质押倍数 */}
          <div className="space-y-2">
            <Label htmlFor="stakingMultiplier">4. 质押倍数</Label>
            <Input
              id="stakingMultiplier"
              type="number"
              placeholder="比如 100"
              value={stakingMultiplier}
              onChange={(e) => setStakingMultiplier(e.target.value)}
              disabled={approvalStep !== 'idle'}
              min="1"
              className="max-w-40 md:max-w-xs"
            />
            <p className="text-sm text-greyscale-500">链群容量 = 质押量 × 质押倍数</p>
          </div>

          {/* 最大参与代币倍数 */}
          <div className="space-y-2">
            <Label htmlFor="maxJoinAmountMultiplier">5. 最大参与代币倍数</Label>
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
            <p className="text-sm text-greyscale-500">单个行动者最大参与量 = 已铸造总量 / 此倍数</p>
          </div>

          {/* 最小参与代币量 */}
          <div className="space-y-2">
            <Label htmlFor="minJoinAmount">6. 最小参与代币量</Label>
            <Input
              id="minJoinAmount"
              type="number"
              placeholder="比如 100"
              value={minJoinAmount}
              onChange={(e) => setMinJoinAmount(e.target.value)}
              disabled={approvalStep !== 'idle'}
              min="0"
              step="0.000001"
              className="max-w-40 md:max-w-xs"
            />
            <p className="text-sm text-greyscale-500">单个行动者参与行动时最少需要的代币数量</p>
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
                    ? '7.提交中...'
                    : isApproveConfirming
                    ? '7.确认中...'
                    : approvalStep === 'approved' || approvalStep === 'deploying' || approvalStep === 'deployed'
                    ? '7.代币已授权'
                    : '7.授权 1' + tokenSymbol}
                </Button>

                <Button
                  type="button"
                  onClick={handleDeploy}
                  className="w-1/2"
                  disabled={(approvalStep !== 'approved' && approvalStep !== 'deploying') || isPending || isConfirming}
                >
                  {isPending ? '8.部署中...' : isConfirming ? '8.确认中...' : '8.部署扩展'}
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
