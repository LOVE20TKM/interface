'use client';

import { useState, useContext, useEffect } from 'react';
import { TokenContext } from '@/src/contexts/TokenContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateExtension } from '@/src/hooks/extension/plugins/lp/contracts';
import { LOVE20ExtensionFactoryLpAbi } from '@/src/abis/LOVE20ExtensionFactoryLp';
import { useApprove } from '@/src/hooks/contracts/useLOVE20Token';
import { clearContractInfoCache } from '@/src/hooks/extension/base/composite/useExtensionBaseData';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import toast from 'react-hot-toast';
import { isAddress, parseEther, parseEventLogs } from 'viem';
import { useWaitForTransactionReceipt } from 'wagmi';

interface LpDeployProps {
  factoryAddress: `0x${string}`;
}

/**
 * LP扩展部署组件
 */
export default function LpDeploy({ factoryAddress }: LpDeployProps) {
  const context = useContext(TokenContext);
  const tokenAddress = context?.token?.address || ('' as `0x${string}`);

  // 表单状态
  const [joinTokenAddress, setJoinTokenAddress] = useState(''); // LP Token地址
  const [waitingBlocks, setWaitingBlocks] = useState(''); // 等待区块数
  const [govRatioMultiplier, setGovRatioMultiplier] = useState('');
  const [minGovVotes, setMinGovVotes] = useState('');
  const [lpRatioPrecision, setLpRatioPrecision] = useState(''); // LP比率精度

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
        // 解析 ExtensionCreated 事件
        const logs = parseEventLogs({
          abi: LOVE20ExtensionFactoryLpAbi,
          eventName: 'ExtensionCreated',
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
      toast.success('扩展部署成功！');
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
    if (!joinTokenAddress) {
      toast.error('请输入LP Token地址');
      return false;
    }

    if (!isAddress(joinTokenAddress)) {
      toast.error('LP Token地址格式无效');
      return false;
    }

    if (!waitingBlocks) {
      toast.error('请输入等待区块数');
      return false;
    }

    if (!govRatioMultiplier) {
      toast.error('请输入治理比率乘数');
      return false;
    }

    if (!minGovVotes) {
      toast.error('请输入最小治理票数');
      return false;
    }

    if (!lpRatioPrecision) {
      toast.error('请输入LP比率精度');
      return false;
    }

    // 验证数字有效性
    const waitingBlocksNum = parseFloat(waitingBlocks);
    const govRatioMultiplierNum = parseFloat(govRatioMultiplier);
    const minGovVotesNum = parseFloat(minGovVotes);
    const lpRatioPrecisionNum = parseFloat(lpRatioPrecision);

    if (isNaN(waitingBlocksNum) || waitingBlocksNum < 0) {
      toast.error('等待区块数必须是非负整数');
      return false;
    }

    if (isNaN(govRatioMultiplierNum) || govRatioMultiplierNum < 0) {
      toast.error('治理比率乘数必须是非负整数');
      return false;
    }

    if (isNaN(minGovVotesNum) || minGovVotesNum < 0) {
      toast.error('最小治理票数必须是非负整数');
      return false;
    }

    if (isNaN(lpRatioPrecisionNum) || lpRatioPrecisionNum < 0) {
      toast.error('LP比率精度必须是非负整数');
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
      // 将 minGovVotes 从 eth 转换为 wei
      const minGovVotesWei = parseEther(minGovVotes);

      await createExtension(
        tokenAddress,
        joinTokenAddress as `0x${string}`,
        BigInt(waitingBlocks),
        BigInt(govRatioMultiplier),
        minGovVotesWei,
        BigInt(lpRatioPrecision),
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
        <CardTitle className="text-xl md:text-2xl">部署LP池行动扩展合约</CardTitle>
        <CardDescription className="text-sm">每1个新的LP池行动，都对应1个专属扩展合约</CardDescription>
      </CardHeader>
      <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
        <form className="space-y-4 md:space-y-6">
          {/* LP Token地址 */}
          <div className="space-y-2">
            <Label htmlFor="joinTokenAddress">1. LP代币地址</Label>
            <Input
              id="joinTokenAddress"
              type="text"
              placeholder="0x..."
              value={joinTokenAddress}
              onChange={(e) => setJoinTokenAddress(e.target.value)}
              disabled={approvalStep !== 'idle'}
            />
            <p className="text-sm text-greyscale-500">即 Uniswap V2 Pair 合约地址</p>
          </div>

          {/* 等待区块数 */}
          <div className="space-y-2">
            <Label htmlFor="waitingBlocks">2.等待区块数</Label>
            <Input
              id="waitingBlocks"
              type="number"
              placeholder="比如 10"
              value={waitingBlocks}
              onChange={(e) => setWaitingBlocks(e.target.value)}
              disabled={approvalStep !== 'idle'}
              min="0"
              className="max-w-40 md:max-w-xs"
            />
            <p className="text-sm text-greyscale-500">加入行动后，需等多少区块才能退出</p>
          </div>

          {/* 治理比率乘数 */}
          <div className="space-y-2">
            <Label htmlFor="govRatioMultiplier">3.治理比率乘数</Label>
            <Input
              id="govRatioMultiplier"
              type="number"
              placeholder="比如 2"
              value={govRatioMultiplier}
              onChange={(e) => setGovRatioMultiplier(e.target.value)}
              disabled={approvalStep !== 'idle'}
              min="0"
              className="max-w-40 md:max-w-xs"
            />
            <p className="text-sm text-greyscale-500">"治理票占比" 是 "LP占比" 的多少倍</p>
          </div>

          {/* 最小治理票数 */}
          <div className="space-y-2">
            <Label htmlFor="minGovVotes">4.最小治理票数</Label>
            <Input
              id="minGovVotes"
              type="number"
              placeholder="比如 10,000"
              value={minGovVotes}
              onChange={(e) => setMinGovVotes(e.target.value)}
              disabled={approvalStep !== 'idle'}
              min="0"
              step="0.000001"
              className="max-w-40 md:max-w-xs"
            />
          </div>

          {/* LP比率精度 */}
          <div className="space-y-2">
            <Label htmlFor="lpRatioPrecision">5.LP比率精度</Label>
            <Input
              id="lpRatioPrecision"
              type="number"
              placeholder="比如 10,000"
              value={lpRatioPrecision}
              onChange={(e) => setLpRatioPrecision(e.target.value)}
              disabled={approvalStep !== 'idle'}
              min="0"
              className="max-w-40 md:max-w-xs"
            />
            {/* <p className="text-sm text-greyscale-500">LP比率计算的精度（通常设置为1000000）</p> */}
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
                  : '1.授权代币'}
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
          )}
        </form>
      </CardContent>
    </Card>
  );
}
