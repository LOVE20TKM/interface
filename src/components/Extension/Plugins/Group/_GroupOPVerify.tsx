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
  useVerifyWithOriginScores,
  useVerifiedAccountCount,
} from '@/src/hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupAction';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';
import { LinkIfUrl } from '@/src/lib/stringUtils';

// 复合 hooks
import { useVerificationInfos } from '@/src/hooks/composite/useVerificationInfos';

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
  groupName: string;
}

interface AccountScore {
  account: `0x${string}`;
  score: string; // 百分比，如 "100" 表示 100%
  ratio: number; // 自动计算的占比
}

const _GroupOPVerify: React.FC<GroupOPVerifyProps> = ({
  actionId,
  actionInfo,
  extensionAddress,
  groupId,
  groupName,
}) => {
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

  // 获取被验证者地址列表
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
    verifiedAccountCount,
    isPending: isPendingSubmittedCount,
    error: errorSubmittedCount,
  } = useVerifiedAccountCount(extensionAddress, currentRound || BigInt(0), groupId);

  // 批量获取验证信息
  const {
    verificationInfos,
    isPending: isPendingVerificationInfos,
    error: errorVerificationInfos,
  } = useVerificationInfos({
    tokenAddress: token?.address,
    actionId,
    accounts: accounts || [],
    verificationKeys: actionInfo?.body.verificationKeys || [],
    enabled: !!token?.address && !!actionInfo && (accounts?.length || 0) > 0,
  });

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
    verifyWithOriginScores,
    isPending: isPendingVerifyGroup,
    isConfirming: isConfirmingVerify,
    isConfirmed: isConfirmedVerify,
    writeError: errorVerifyGroup,
  } = useVerifyWithOriginScores(extensionAddress);

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
    if (verifiedAccountCount !== undefined && accounts && verifiedAccountCount >= BigInt(accounts.length)) {
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

      // 使用新的 verifyWithOriginScores 签名：groupId, startIndex, originScores
      // startIndex 设置为 0，表示从第一个账号开始提交
      await verifyWithOriginScores(groupId, BigInt(0), scores);
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
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorRound) handleError(errorRound);
    if (errorOwner) handleError(errorOwner);
    if (errorDelegated) handleError(errorDelegated);
    if (errorGetAccounts) handleError(errorGetAccounts);
    if (errorSubmittedCount) handleError(errorSubmittedCount);
    if (errorVerifyGroup) handleError(errorVerifyGroup);
    if (errorVerificationInfos) handleError(errorVerificationInfos);
  }, [
    errorRound,
    errorOwner,
    errorDelegated,
    errorGetAccounts,
    errorSubmittedCount,
    errorVerifyGroup,
    errorVerificationInfos,
    handleError,
  ]);

  if (
    isPendingRound ||
    isPendingOwner ||
    isPendingDelegated ||
    isPendingGetAccounts ||
    isPendingSubmittedCount ||
    isPendingVerificationInfos
  ) {
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

    // 只允许空字符串或整数
    if (value === '') {
      newScores[index].score = value;
      setAccountScores(newScores);
      return;
    }

    // 检查是否为整数（不包含小数点）
    if (!/^\d+$/.test(value)) {
      toast.error('请输入整数');
      return;
    }

    // 限制分值在 0~100 之间
    const numValue = parseInt(value, 10);
    if (numValue >= 0 && numValue <= 100) {
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
  const isAlreadySubmitted =
    verifiedAccountCount !== undefined && accounts && verifiedAccountCount >= BigInt(accounts.length);

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
          <div className="text-gray-500 mb-2 text-sm">
            <span>链群：</span>
            <span className="text-gray-500 text-xs">#</span>
            <span className="text-secondary text-base font-semibold ">{groupId.toString()}</span>{' '}
            <span className="font-semibold">{groupName}</span>
          </div>
        </div>

        {/* 打分列表 */}
        <div className="w-full max-w-2xl">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-left text-sm text-greyscale-500">行动者地址</th>
                <th className="pb-3 text-left whitespace-nowrap w-16 text-sm text-greyscale-500">打分</th>
                <th className="pb-3 text-center whitespace-nowrap w-12 text-sm text-greyscale-500">占比</th>
              </tr>
            </thead>
            <tbody>
              {accountScoresWithRatio.map((item, index) => {
                // 获取该地址的验证信息
                const verificationInfo = verificationInfos.find(
                  (v) => v.account.toLowerCase() === item.account.toLowerCase(),
                );

                return (
                  <tr key={item.account} className="border-b border-gray-100">
                    <td className="py-1">
                      <div className="text-left">
                        {/* 地址和复制按钮 */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 min-w-[4px]">{index + 1}</span>
                          <div className="font-mono">
                            <AddressWithCopyButton
                              address={item.account}
                              showCopyButton={true}
                              showCopyLast4Button={true}
                            />
                          </div>
                        </div>
                        {/* 验证信息 */}
                        {actionInfo && verificationInfo && (
                          <div className="text-sm text-greyscale-800 ml-3">
                            {actionInfo.body.verificationKeys.map((key, i) => (
                              <div key={i} className="mb-2">
                                <div className="text-xs font-semibold text-gray-600 mb-1">{key}:</div>
                                <div>
                                  <LinkIfUrl text={verificationInfo.infos[i] || ''} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-1 w-18 px-1">
                      <div className="flex items-center text-left">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          pattern="\d*"
                          inputMode="numeric"
                          value={item.score}
                          placeholder="0"
                          onChange={(e) => handleScoreChange(index, e.target.value)}
                          className="w-16 px-1 py-1 border rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </td>
                    <td className="py-1 text-center w-12 whitespace-nowrap px-0">
                      <div className="text-sm text-greyscale-600">{(item.ratio * 100).toFixed(2)}%</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
            <div>• 验证打分范围为：0~100 之间</div>
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
