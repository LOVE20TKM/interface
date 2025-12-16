// components/Extension/Plugins/Group/_GroupOPVerify.tsx
// 链群打分操作

'use client';

// React
import React, { useContext, useEffect, useState } from 'react';

// Next.js
import { useRouter } from 'next/router';

// 第三方库
import { toast } from 'react-hot-toast';
import { useAccount } from 'wagmi';

// UI 组件
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';
import { useOwnerOf } from '@/src/hooks/extension/base/contracts/useLOVE20Group';
import { useAccountsByGroupIdByRound } from '@/src/hooks/extension/plugins/group/composite/useAccountsByGroupIdByRound';
import {
  useDelegatedVerifierByGroupId,
  useSubmitOriginScore,
  useSubmittedCount,
} from '@/src/hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupAction';

// 工具函数
import { useHandleContractError } from '@/src/lib/errorUtils';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

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

  // 获取链群主地址
  const { owner: groupOwner, isPending: isPendingOwner, error: errorOwner } = useOwnerOf(groupId);

  // 获取打分代理地址
  const {
    delegatedVerifier,
    isPending: isPendingDelegated,
    error: errorDelegated,
  } = useDelegatedVerifierByGroupId(extensionAddress, groupId);

  // 检查是否有打分权限（链群主或打分代理）
  const hasVerifyPermission =
    account &&
    (account.toLowerCase() === groupOwner?.toLowerCase() || account.toLowerCase() === delegatedVerifier?.toLowerCase());

  // 获取被验证者地址列表（使用新的 hook）
  const {
    accounts: accounts,
    isPending: isPendingGetAccounts,
    error: errorGetAccounts,
  } = useAccountsByGroupIdByRound({
    extensionAddress,
    groupId,
    round: currentRound || BigInt(0),
  });

  // 获取已提交的打分数量
  const {
    submittedCount,
    isPending: isPendingSubmittedCount,
    error: errorSubmittedCount,
  } = useSubmittedCount(extensionAddress, currentRound || BigInt(0), groupId);

  // 打分状态
  const [accountScores, setAccountScores] = useState<AccountScore[]>([]);

  // 初始化打分列表
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      setAccountScores(
        accounts.map((acc) => ({
          account: acc,
          score: '100', // 默认100分
          ratio: 0,
        })),
      );
    }
  }, [accounts]);

  // 计算占比 - 使用 useMemo 而不是 useEffect 来避免无限循环
  const accountScoresWithRatio = React.useMemo(() => {
    const totalScore = accountScores.reduce((sum, item) => sum + parseFloat(item.score || '0'), 0);
    return accountScores.map((item) => ({
      ...item,
      ratio: totalScore > 0 ? parseFloat(item.score || '0') / totalScore : 0,
    }));
  }, [accountScores]);

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
    if (!hasVerifyPermission) {
      toast.error('您没有打分权限');
      return;
    }

    // 检查是否已经提交过打分
    if (submittedCount !== undefined && accounts && submittedCount >= BigInt(accounts.length)) {
      toast.error('本轮打分已经完成，无需重复提交');
      return;
    }

    // 检查是否所有分数都有效（0~100 之间）
    const hasInvalidScore = accountScoresWithRatio.some((item) => {
      const score = parseFloat(item.score || '0');
      return isNaN(score) || score < 0 || score > 100;
    });

    if (hasInvalidScore) {
      toast.error('请确保所有分数都在 0~100 之间');
      return;
    }

    try {
      // 准备分数数据：直接使用原始整数
      const scores = accountScoresWithRatio.map((item) => {
        const score = parseInt(item.score);
        return BigInt(isNaN(score) || score < 0 ? 0 : score);
      });

      // 使用新的 submitOriginScore 签名：groupId, startIndex, originScores
      // startIndex 设置为 0，表示从第一个账号开始提交
      await submitOriginScore(groupId, BigInt(0), scores);
    } catch (error) {
      console.error('Verify group failed', error);
    }
  }

  useEffect(() => {
    if (isConfirmedVerify) {
      toast.success('打分提交成功');
      setTimeout(() => {
        router.push(
          `/extension/group/?groupId=${groupId.toString()}&actionId=${actionId.toString()}&symbol=${
            token?.symbol
          }&tab=scores`,
        );
      }, 1500);
    }
  }, [isConfirmedVerify, router]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorRound) handleContractError(errorRound, 'vote');
    if (errorOwner) handleContractError(errorOwner, 'group');
    if (errorDelegated) handleContractError(errorDelegated, 'extension');
    if (errorGetAccounts) handleContractError(errorGetAccounts, 'extension');
    if (errorSubmittedCount) handleContractError(errorSubmittedCount, 'extension');
    if (errorVerifyGroup) handleContractError(errorVerifyGroup, 'extension');
  }, [
    errorRound,
    errorOwner,
    errorDelegated,
    errorGetAccounts,
    errorSubmittedCount,
    errorVerifyGroup,
    handleContractError,
  ]);

  if (isPendingRound || isPendingOwner || isPendingDelegated || isPendingGetAccounts || isPendingSubmittedCount) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载验证信息...</p>
      </div>
    );
  }

  // 检查是否有打分权限
  if (!hasVerifyPermission) {
    return (
      <div className="space-y-4">
        <LeftTitle title="验证打分" />

        <div className="text-center py-12">
          <p className="text-red-500 mb-4">您没有打分权限</p>
          <p className="text-sm text-gray-600 mb-6">只有链群主和打分代理才能打分</p>
        </div>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="space-y-4">
        <LeftTitle title="验证打分" />

        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">暂无待打分的行动者</p>
        </div>
      </div>
    );
  }

  const handleScoreChange = (index: number, value: string) => {
    const newScores = [...accountScores];
    // 限制分值在 0~100 之间
    const numValue = parseFloat(value);
    if (value === '' || (numValue >= 0 && numValue <= 100)) {
      newScores[index].score = value;
      setAccountScores(newScores);
    } else if (numValue > 100) {
      newScores[index].score = '100';
      setAccountScores(newScores);
      toast.error('分数不能超过 100');
    } else if (numValue < 0) {
      newScores[index].score = '0';
      setAccountScores(newScores);
      toast.error('分数不能小于 0');
    }
  };

  // 检查是否已经打分完成
  const isAlreadySubmitted = submittedCount !== undefined && accounts && submittedCount >= BigInt(accounts.length);

  // 如果已经打分完成，只显示查看按钮
  if (isAlreadySubmitted) {
    return (
      <div className="space-y-6">
        {/* 标题 */}
        <div>
          <LeftTitle title="验证打分" />
          <p className="text-sm text-gray-600 mt-2">为链群 #{groupId.toString()} 中的行动者打分</p>
        </div>

        {/* 已完成提示 */}
        <div className="text-center py-6">
          <div className="mb-6">
            <p className="text-lg font-medium text-gray-900 mb-2">打分已完成</p>
            <p className="text-sm text-gray-600">本轮已为 {accounts?.length} 个行动者提交打分</p>
          </div>

          <Button
            onClick={() => {
              router.push(
                `/extension/group/?groupId=${groupId.toString()}&actionId=${actionId.toString()}&symbol=${
                  token?.symbol
                }&tab=scores`,
              );
            }}
          >
            查看打分
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* 标题 */}
        <div>
          <LeftTitle title="验证打分" />
          <p className="text-sm text-gray-600 mt-2">为链群 #{groupId.toString()} 中的行动者打分</p>
        </div>

        {/* 打分列表 */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* 表头 */}
          <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 border-b border-gray-200 font-medium text-sm text-gray-700">
            <div className="col-span-6">行动者地址</div>
            <div className="col-span-3">打分</div>
            <div className="col-span-3">占比</div>
          </div>

          {/* 列表 */}
          <div className="divide-y divide-gray-200">
            {accountScoresWithRatio.map((item, index) => (
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
          <Button className="w-1/2" variant="outline" onClick={handlePasteFromClipboard}>
            从剪贴板粘贴分数
          </Button>
          <Button
            className="w-1/2"
            disabled={isPendingVerifyGroup || isConfirmingVerify || isConfirmedVerify}
            onClick={handleVerify}
          >
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
          <div className="font-medium text-gray-700 mb-1">💡 小贴士</div>
          <div className="space-y-1 text-gray-600">
            <div>• 为每个行动者输入整数分数（0~100 之间）</div>
            <div>• 可以从剪贴板粘贴分数（格式：每行一个分数）</div>
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
