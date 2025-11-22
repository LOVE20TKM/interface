'use client';

import { useState, useContext, useEffect } from 'react';
import { TokenContext } from '@/src/contexts/TokenContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateExtension } from '@/src/hooks/extension/plugins/lp/contracts';
import { LOVE20ExtensionFactoryStakeLpAbi } from '@/src/abis/LOVE20ExtensionFactoryStakeLp';
import { useTransfer } from '@/src/hooks/contracts/useLOVE20Token';
import { clearContractInfoCache } from "@/src/hooks/extension/base/composite/useExtensionBaseData";
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
  const [actionId, setActionId] = useState('');
  const [anotherTokenAddress, setAnotherTokenAddress] = useState('');
  const [waitingPhases, setWaitingPhases] = useState('');
  const [govRatioMultiplier, setGovRatioMultiplier] = useState('');
  const [minGovVotes, setMinGovVotes] = useState('');

  const { createExtension, isPending, isConfirming, isConfirmed, writeError, hash } =
    useCreateExtension(factoryAddress);

  // 转移代币的hook
  const {
    transfer,
    isPending: isTransferPending,
    isConfirming: isTransferConfirming,
    isConfirmed: isTransferConfirmed,
    writeError: transferError,
    hash: transferHash,
  } = useTransfer(tokenAddress);

  // 等待交易回执并解析事件获取扩展地址
  const { data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  // 等待转移代币的交易回执
  const { data: transferReceipt } = useWaitForTransactionReceipt({
    hash: transferHash,
  });

  // 存储部署的扩展地址
  const [deployedExtensionAddress, setDeployedExtensionAddress] = useState<`0x${string}` | null>(null);

  // 从交易回执中提取扩展地址
  useEffect(() => {
    if (receipt && receipt.logs) {
      try {
        // 解析 ExtensionCreated 事件
        const logs = parseEventLogs({
          abi: LOVE20ExtensionFactoryStakeLpAbi,
          eventName: 'ExtensionCreated',
          logs: receipt.logs,
        });

        if (logs.length > 0 && logs[0].args.extension) {
          const extensionAddress = logs[0].args.extension as `0x${string}`;
          setDeployedExtensionAddress(extensionAddress);
          console.log('扩展合约已部署，地址:', extensionAddress);
          toast.success('扩展部署成功！现在需要转移1个代币给扩展合约');
        }
      } catch (error) {
        console.error('解析扩展地址失败:', error);
      }
    }
  }, [receipt]);

  // 监听转移代币成功
  useEffect(() => {
    if (isTransferConfirmed && actionId && tokenAddress) {
      // 清除该行动的缓存，以便重新查询最新的扩展信息
      clearContractInfoCache(tokenAddress, BigInt(actionId));
      console.log(`✅ 已清除 ActionId ${actionId} 的扩展信息缓存`);

      toast.success('代币转移成功！扩展部署流程已完成');
    }
  }, [isTransferConfirmed, actionId, tokenAddress]);

  // 监听转移代币错误
  useEffect(() => {
    if (transferError) {
      toast.error(`转移代币失败: ${transferError.message}`);
    }
  }, [transferError]);

  /**
   * 验证表单数据
   */
  const validateForm = (): boolean => {
    if (!actionId) {
      toast.error('请输入行动ID');
      return false;
    }

    if (!anotherTokenAddress) {
      toast.error('请输入LP配对代币地址');
      return false;
    }

    if (!isAddress(anotherTokenAddress)) {
      toast.error('LP配对代币地址格式无效');
      return false;
    }

    if (!waitingPhases) {
      toast.error('请输入等待阶段数');
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

    // 验证数字有效性
    const actionIdNum = parseFloat(actionId);
    const waitingPhasesNum = parseFloat(waitingPhases);
    const govRatioMultiplierNum = parseFloat(govRatioMultiplier);
    const minGovVotesNum = parseFloat(minGovVotes);

    if (isNaN(actionIdNum) || actionIdNum < 0) {
      toast.error('行动ID必须是非负整数');
      return false;
    }

    if (isNaN(waitingPhasesNum) || waitingPhasesNum < 0) {
      toast.error('等待阶段数必须是非负整数');
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

    return true;
  };

  /**
   * 提交表单
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // 将 minGovVotes 从 eth 转换为 wei
      const minGovVotesWei = parseEther(minGovVotes);

      await createExtension(
        tokenAddress,
        BigInt(actionId),
        anotherTokenAddress as `0x${string}`,
        BigInt(waitingPhases),
        BigInt(govRatioMultiplier),
        minGovVotesWei,
      );

      toast.success('部署扩展交易已提交！');
    } catch (error: any) {
      console.error('部署扩展失败:', error);
      toast.error(error?.message || '部署扩展失败');
    }
  };

  /**
   * 转移1个代币给扩展合约
   */
  const handleTransferToken = async () => {
    if (!deployedExtensionAddress) {
      toast.error('扩展地址不存在');
      return;
    }

    try {
      // 转移1个代币（1 token = 1e18 wei）
      const amount = parseEther('1');
      await transfer(deployedExtensionAddress, amount);
      toast.success('代币转移交易已提交！');
    } catch (error: any) {
      console.error('转移代币失败:', error);
      toast.error(error?.message || '转移代币失败');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>部署质押LP扩展</CardTitle>
        <CardDescription>创建一个新的质押LP代币的扩展行动</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 行动ID */}
          <div className="space-y-2">
            <Label htmlFor="actionId">
              行动ID<span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="actionId"
              type="number"
              placeholder="输入行动ID"
              value={actionId}
              onChange={(e) => setActionId(e.target.value)}
              disabled={isPending || isConfirming || !!deployedExtensionAddress}
              min="0"
            />
            <p className="text-sm text-greyscale-500">该扩展关联的行动ID</p>
          </div>

          {/* LP配对代币地址 */}
          <div className="space-y-2">
            <Label htmlFor="anotherTokenAddress">
              LP配对代币地址<span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="anotherTokenAddress"
              type="text"
              placeholder="0x..."
              value={anotherTokenAddress}
              onChange={(e) => setAnotherTokenAddress(e.target.value)}
              disabled={isPending || isConfirming || !!deployedExtensionAddress}
            />
            <p className="text-sm text-greyscale-500">用于组成LP的另一个代币地址</p>
          </div>

          {/* 等待阶段数 */}
          <div className="space-y-2">
            <Label htmlFor="waitingPhases">
              等待阶段数<span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="waitingPhases"
              type="number"
              placeholder="输入等待阶段数"
              value={waitingPhases}
              onChange={(e) => setWaitingPhases(e.target.value)}
              disabled={isPending || isConfirming || !!deployedExtensionAddress}
              min="0"
            />
            <p className="text-sm text-greyscale-500">质押后需要等待的阶段数</p>
          </div>

          {/* 治理比率乘数 */}
          <div className="space-y-2">
            <Label htmlFor="govRatioMultiplier">
              治理比率乘数<span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="govRatioMultiplier"
              type="number"
              placeholder="输入治理比率乘数"
              value={govRatioMultiplier}
              onChange={(e) => setGovRatioMultiplier(e.target.value)}
              disabled={isPending || isConfirming || !!deployedExtensionAddress}
              min="0"
            />
            <p className="text-sm text-greyscale-500">治理权重的乘数（1 = 100%）</p>
          </div>

          {/* 最小治理票数 */}
          <div className="space-y-2">
            <Label htmlFor="minGovVotes">
              最小治理票数 (ETH)<span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="minGovVotes"
              type="number"
              placeholder="输入最小治理票数"
              value={minGovVotes}
              onChange={(e) => setMinGovVotes(e.target.value)}
              disabled={isPending || isConfirming || !!deployedExtensionAddress}
              min="0"
              step="0.000001"
            />
            <p className="text-sm text-greyscale-500">参与治理所需的最小票数（单位：ETH）</p>
          </div>

          {/* 错误信息 */}
          {writeError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">错误: {writeError.message}</p>
            </div>
          )}

          {/* 部署成功 - 显示扩展地址和步骤提示 */}
          {deployedExtensionAddress && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎉</span>
                <p className="text-base font-semibold text-green-700">
                  {isTransferConfirmed ? '扩展部署完成！' : '扩展部署成功！'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-greyscale-600">扩展合约地址:</p>
                <AddressWithCopyButton address={deployedExtensionAddress} showAddress={true} />
              </div>
              {!isTransferConfirmed && (
                <p className="text-sm text-amber-600 font-medium">⚠️ 下一步：请转移1个代币给扩展合约以完成部署流程</p>
              )}
              {isTransferConfirmed && <p className="text-sm text-green-600">✅ 代币已转移，扩展可以使用了！</p>}
            </div>
          )}

          {/* 转移代币错误信息 */}
          {transferError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">转移代币错误: {transferError.message}</p>
            </div>
          )}

          {/* 部署扩展按钮 - 部署成功后隐藏 */}
          {!deployedExtensionAddress && (
            <Button type="submit" className="w-full" disabled={isPending || isConfirming}>
              {isPending || isConfirming ? '处理中...' : '部署扩展'}
            </Button>
          )}

          {/* 转移代币按钮 - 部署成功后显示 */}
          {deployedExtensionAddress && !isTransferConfirmed && (
            <Button
              type="button"
              className="w-full"
              onClick={handleTransferToken}
              disabled={isTransferPending || isTransferConfirming}
            >
              {isTransferPending || isTransferConfirming ? '转移中...' : '转移1个代币给扩展合约'}
            </Button>
          )}

          {/* 已完成提示 */}
          {isTransferConfirmed && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 text-center">
                ✨ 扩展部署已部署！请一定先复制合约地址，创建行动时将此地址设置为白名单！
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
