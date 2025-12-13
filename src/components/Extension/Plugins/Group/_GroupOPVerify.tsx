// components/Extension/Plugins/Group/_GroupOPVerify.tsx
// 链群打分操作

'use client';

import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TokenContext } from '@/src/contexts/TokenContext';
import { ActionInfo } from '@/src/types/love20types';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
import { useScoreByVerifierByActionId } from '@/src/hooks/contracts/useLOVE20Verify';
import {
  useSnapshotAccountsByGroupId,
  useSubmitOriginScore,
} from '@/src/hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupAction';
import { useHandleContractError } from '@/src/lib/errorUtils';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import LeftTitle from '@/src/components/Common/LeftTitle';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

interface GroupOPVerifyProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupId: bigint;
}

interface AccountScore {
  account: `0x${string}`;
  score: string; // 百分比，如 "100" 表示 100%
  ratio: number; // 自动计算的占比
}

const _GroupOPVerify: React.FC<GroupOPVerifyProps> = ({ actionId, actionInfo, extensionAddress, groupId }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取当前轮次
  const { currentRound, isPending: isPendingRound, error: errorRound } = useCurrentRound();

  // 获取我的验证票数
  const {
    scoreByVerifierByActionId: myVerifyVotes,
    isPending: isPendingVerify,
    error: errorVerify,
  } = useScoreByVerifierByActionId(
    token?.address as `0x${string}`,
    currentRound || BigInt(0),
    account as `0x${string}`,
    actionId,
  );

  // 获取被验证者地址列表
  const {
    accounts: snapshotAccounts,
    isPending: isPendingSnapshot,
    error: errorSnapshot,
  } = useSnapshotAccountsByGroupId(extensionAddress, currentRound || BigInt(0), groupId);

  // 打分状态
  const [accountScores, setAccountScores] = useState<AccountScore[]>([]);

  // 初始化打分列表
  useEffect(() => {
    if (snapshotAccounts && snapshotAccounts.length > 0) {
      setAccountScores(
        snapshotAccounts.map((acc) => ({
          account: acc,
          score: '100', // 默认100分
          ratio: 0,
        })),
      );
    }
  }, [snapshotAccounts]);

  // 计算占比
  useEffect(() => {
    const totalScore = accountScores.reduce((sum, item) => sum + parseFloat(item.score || '0'), 0);
    setAccountScores((prev) =>
      prev.map((item) => ({
        ...item,
        ratio: totalScore > 0 ? parseFloat(item.score || '0') / totalScore : 0,
      })),
    );
  }, [accountScores.map((s) => s.score).join(',')]);

  // 打分
  const {
    submitOriginScore,
    isPending: isPendingVerifyGroup,
    isConfirming: isConfirmingVerify,
    isConfirmed: isConfirmedVerify,
    writeError: errorVerifyGroup,
  } = useSubmitOriginScore(extensionAddress);

  // 从剪贴板粘贴分数
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.trim().split('\n');

      const newScores = [...accountScores];
      let updated = 0;

      for (const line of lines) {
        const parts = line.trim().split(/[\t,\s]+/);
        if (parts.length >= 2) {
          const address = parts[0].toLowerCase();
          const score = parts[1];

          const index = newScores.findIndex((s) => s.account.toLowerCase() === address);
          if (index !== -1 && !isNaN(parseFloat(score))) {
            newScores[index].score = score;
            updated++;
          }
        }
      }

      if (updated > 0) {
        setAccountScores(newScores);
        toast.success(`成功导入 ${updated} 个地址的分数`);
      } else {
        toast.error('未找到匹配的地址');
      }
    } catch (error) {
      toast.error('粘贴失败，请检查剪贴板内容');
      console.error('Paste error:', error);
    }
  };

  async function handleVerify() {
    if (!myVerifyVotes || myVerifyVotes === BigInt(0)) {
      toast.error('您没有验证票，无法打分');
      return;
    }

    // 检查是否所有分数都有效
    const hasInvalidScore = accountScores.some((item) => {
      const score = parseFloat(item.score || '0');
      return isNaN(score) || score < 0 || score > 100;
    });

    if (hasInvalidScore) {
      toast.error('请确保所有分数在 0-100 之间');
      return;
    }

    try {
      // 准备分数数据：转换为 bps (basis points, 1% = 100 bps)
      const addresses = accountScores.map((item) => item.account);
      const scores = accountScores.map((item) => BigInt(Math.floor(parseFloat(item.score) * 100)));

      await submitOriginScore(groupId, scores);
    } catch (error) {
      console.error('Verify group failed', error);
    }
  }

  useEffect(() => {
    if (isConfirmedVerify) {
      toast.success('打分提交成功');
      setTimeout(() => {
        router.back();
      }, 1500);
    }
  }, [isConfirmedVerify, router]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorRound) handleContractError(errorRound, 'vote');
    if (errorVerify) handleContractError(errorVerify, 'verify');
    if (errorSnapshot) handleContractError(errorSnapshot, 'extension');
    if (errorVerifyGroup) handleContractError(errorVerifyGroup, 'extension');
  }, [errorRound, errorVerify, errorSnapshot, errorVerifyGroup, handleContractError]);

  if (isPendingRound || isPendingVerify || isPendingSnapshot) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载验证信息...</p>
      </div>
    );
  }

  // 检查是否有打分权限
  if (!myVerifyVotes || myVerifyVotes === BigInt(0)) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>

        <LeftTitle title="验证打分" />

        <div className="text-center py-12">
          <p className="text-red-500 mb-4">您没有打分权限</p>
          <p className="text-sm text-gray-600 mb-6">只有给本行动投过验证票的治理者才能打分</p>
          <Button variant="outline" onClick={() => router.back()}>
            返回
          </Button>
        </div>
      </div>
    );
  }

  if (!snapshotAccounts || snapshotAccounts.length === 0) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>

        <LeftTitle title="验证打分" />

        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">暂无待打分的行动者</p>
          <Button variant="outline" onClick={() => router.back()}>
            返回
          </Button>
        </div>
      </div>
    );
  }

  const handleScoreChange = (index: number, value: string) => {
    const newScores = [...accountScores];
    newScores[index].score = value;
    setAccountScores(newScores);
  };

  return (
    <>
      <div className="space-y-6">
        {/* 返回按钮 */}
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>

        {/* 标题 */}
        <div>
          <LeftTitle title="验证打分" />
          <p className="text-sm text-gray-600 mt-2">为链群 #{groupId.toString()} 中的行动者打分</p>
        </div>

        {/* 我的验证票信息 */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <span className="text-gray-600">您对本行动的验证票: </span>
          <span className="font-medium text-blue-800">{myVerifyVotes.toString()}</span>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={handlePasteFromClipboard}>
            从剪贴板粘贴分数
          </Button>
          <div className="text-sm text-gray-600">共 {accountScores.length} 个行动者</div>
        </div>

        {/* 打分列表 */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* 表头 */}
          <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 border-b border-gray-200 font-medium text-sm text-gray-700">
            <div className="col-span-6">行动者地址</div>
            <div className="col-span-3">打分 (0-100)</div>
            <div className="col-span-3">占比</div>
          </div>

          {/* 列表 */}
          <div className="divide-y divide-gray-200">
            {accountScores.map((item, index) => (
              <div key={item.account} className="grid grid-cols-12 gap-4 p-3 hover:bg-gray-50">
                <div className="col-span-6 flex items-center">
                  <AddressWithCopyButton address={item.account} showCopyButton={true} />
                </div>
                <div className="col-span-3 flex items-center">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={item.score}
                    onChange={(e) => handleScoreChange(index, e.target.value)}
                    className="!ring-secondary-foreground"
                  />
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="text-sm text-gray-600">{(item.ratio * 100).toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex justify-center space-x-4 pt-4">
          <Button variant="outline" onClick={() => router.back()} disabled={isPendingVerifyGroup || isConfirmingVerify}>
            取消
          </Button>
          <Button disabled={isPendingVerifyGroup || isConfirmingVerify || isConfirmedVerify} onClick={handleVerify}>
            {isPendingVerifyGroup
              ? '提交中...'
              : isConfirmingVerify
              ? '确认中...'
              : isConfirmedVerify
              ? '已提交'
              : '提交验证'}
          </Button>
        </div>

        {/* 说明 */}
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 打分说明</div>
          <div className="space-y-1 text-gray-600">
            <div>• 为每个行动者输入 0-100 之间的分数</div>
            <div>• 可以从剪贴板粘贴分数（格式：地址 分数，每行一个）</div>
            <div>• 占比根据分数自动计算</div>
            <div>• 只有给本行动投过验证票的治理者才能打分</div>
          </div>
        </div>
      </div>

      <LoadingOverlay
        isLoading={isPendingVerifyGroup || isConfirmingVerify}
        text={isPendingVerifyGroup ? '提交打分...' : '确认打分...'}
      />
    </>
  );
};

export default _GroupOPVerify;
