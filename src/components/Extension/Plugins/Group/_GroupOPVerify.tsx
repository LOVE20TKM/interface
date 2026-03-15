// components/Extension/Plugins/Group/_GroupOPVerify.tsx
// 链群打分操作

'use client';

// React
import React, { useContext, useEffect, useMemo, useState } from 'react';

// Next.js
import { useRouter } from 'next/router';

// 第三方库
import { toast } from 'react-hot-toast';
import { useAccount } from 'wagmi';

// UI 组件
import { Button } from '@/components/ui/button';
import { Copy, Download, Upload } from 'lucide-react';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';
import { useAccountsByGroupIdByRound } from '@/src/hooks/extension/plugins/group/composite/useAccountsByGroupIdByRound';
import {
  useCanVerify,
  useSubmitOriginScores,
  useVerifiedAccountCount,
} from '@/src/hooks/extension/plugins/group/contracts/useGroupVerify';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';
import { copyWithToast } from '@/src/lib/clipboardUtils';
import { LocalCache } from '@/src/lib/LocalCache';
import { LinkIfUrl } from '@/src/lib/stringUtils';

// 复合 hooks
import { useVerificationInfos } from '@/src/hooks/composite/useVerificationInfos';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import ManualPasteDialog from '@/src/components/Common/ManualPasteDialog';

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

  // 打分缓存 key（按 extensionAddress + groupId + currentRound 唯一标识）
  const cacheKey = useMemo(
    () => (currentRound ? `group_verify_scores_${extensionAddress}_${groupId}_${currentRound}` : ''),
    [extensionAddress, groupId, currentRound],
  );

  // 检查是否有打分权限
  const {
    canVerify,
    isPending: isPendingCanVerify,
    error: errorCanVerify,
  } = useCanVerify(extensionAddress, account || ('0x' as `0x${string}`), groupId);

  // 获取被验证者地址列表
  const {
    accounts: accounts,
    isPending: isPendingGetAccounts,
    error: errorGetAccounts,
  } = useAccountsByGroupIdByRound({
    extensionAddress: extensionAddress as `0x${string}`,
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
    round: currentRound || BigInt(0),
    enabled: !!token?.address && !!actionInfo && (accounts?.length || 0) > 0,
  });

  // 打分状态
  const [accountScores, setAccountScores] = useState<AccountScore[]>([]);
  const [showManualPasteDialog, setShowManualPasteDialog] = useState(false);

  // 初始化打分列表（优先从 LocalCache 恢复缓存分数）
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const cached = cacheKey ? LocalCache.get<Record<string, string>>(cacheKey) : null;
      setAccountScores(
        accounts.map((acc) => ({
          account: acc,
          score: cached?.[acc.toLowerCase()] ?? '0', // 有缓存用缓存，否则默认100分
        })),
      );
    }
  }, [accounts, cacheKey]);

  // 分数变更时自动保存到 LocalCache
  useEffect(() => {
    if (cacheKey && accountScores.length > 0) {
      const map: Record<string, string> = {};
      accountScores.forEach((s) => {
        map[s.account.toLowerCase()] = s.score;
      });
      LocalCache.set(cacheKey, map);
    }
  }, [accountScores, cacheKey]);

  // 打分
  const {
    submitOriginScores,
    isPending: isPendingVerifyGroup,
    isConfirming: isConfirmingVerify,
    isConfirmed: isConfirmedVerify,
    writeError: errorVerifyGroup,
  } = useSubmitOriginScores();

  // 复制当前所有分数到剪贴板（每行一个分数）
  const handleCopyScores = async () => {
    if (!accountScores || accountScores.length === 0) {
      toast.error('没有可复制的分数');
      return;
    }
    const scoresList = accountScores.map((item) => item.score || '0');
    const textToCopy = scoresList.join('\n');
    await copyWithToast(textToCopy, `已复制 ${scoresList.length} 个分数到剪贴板`);
  };

  // 复制所有地址及验证信息到剪贴板
  const handleCopyAddresses = async () => {
    try {
      if (!accountScores || accountScores.length === 0) {
        toast.error('没有可复制的地址');
        return;
      }

      const lines: string[] = [];

      // 第一行：标题行
      const verificationKeys = actionInfo?.body.verificationKeys || [];
      const headerParts = ['地址', '后4位', ...verificationKeys];
      lines.push(headerParts.join('\t'));

      // 数据行：每个地址及其验证信息
      accountScores.forEach((item) => {
        const address = item.account;
        const last4 = address.slice(-4);
        const info = verificationInfos.find((v) => v.account.toLowerCase() === address.toLowerCase());
        const verificationValues = info?.infos || [];
        lines.push([address, last4, ...verificationValues].join('\t'));
      });

      const textToCopy = lines.join('\n');
      await copyWithToast(textToCopy, `已复制 ${accountScores.length} 个地址信息到剪贴板`);
    } catch (error) {
      toast.error('复制失败，请手动复制');
      console.error('Copy error:', error);
    }
  };

  // 处理剪贴板文本的通用函数
  const processClipboardText = (clipboardText: string) => {
    const lines = clipboardText
      .trim()
      .split('\n')
      .filter((line) => line.trim().length > 0);

    const newScores = [...accountScores];
    let updated = 0;

    // 检查格式：如果所有行都只有1个部分（只有分数），则按顺序匹配
    const allLinesHaveOnePart = lines.every((line) => {
      const parts = line.trim().split(/[\t,\s]+/);
      return parts.length === 1;
    });

    if (allLinesHaveOnePart && lines.length === newScores.length) {
      for (let i = 0; i < lines.length && i < newScores.length; i++) {
        const score = lines[i].trim();
        if (!isNaN(parseFloat(score))) {
          newScores[i].score = score;
          updated++;
        }
      }
    } else {
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
    }

    if (updated > 0) {
      setAccountScores(newScores);
      toast.success(`成功导入 ${updated} 个地址的分数`);
    } else {
      if (allLinesHaveOnePart) {
        toast.error(`分数行数（${lines.length}）与地址数量（${newScores.length}）不匹配`);
      } else {
        toast.error('未找到匹配的地址，请确保格式为：分数（每行一个）');
      }
    }
  };

  // 从剪贴板粘贴分数（兼容手机钱包浏览器）
  const handlePasteFromClipboard = async () => {
    try {
      let clipboardText = '';
      let useManualPaste = false;

      const isTrustWallet = /Trust/i.test(navigator.userAgent);

      if (navigator.clipboard && navigator.clipboard.readText && !isTrustWallet) {
        try {
          const permission = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
          if (permission.state === 'denied') {
            useManualPaste = true;
          } else {
            clipboardText = await navigator.clipboard.readText();
          }
        } catch (clipboardError) {
          console.warn('Clipboard API 读取失败:', clipboardError);
          useManualPaste = true;
        }
      } else {
        useManualPaste = true;
      }

      if (useManualPaste || !clipboardText) {
        setShowManualPasteDialog(true);
        return;
      }

      processClipboardText(clipboardText);
    } catch (error) {
      console.error('粘贴功能出错:', error);
      setShowManualPasteDialog(true);
    }
  };

  async function handleVerify() {
    if (!canVerify) {
      toast.error('您没有打分权限');
      return;
    }

    // 检查是否已经提交过打分
    if (verifiedAccountCount !== undefined && accounts && verifiedAccountCount >= BigInt(accounts.length)) {
      toast.error('本轮打分已经完成，无需重复提交');
      return;
    }

    // 检查是否所有分数都有效（0~100 之间）
    const hasInvalidScore = accountScores.some((item) => {
      const score = parseFloat(item.score || '0');
      return isNaN(score) || score < 0 || score > 100;
    });

    if (hasInvalidScore) {
      toast.error('请确保所有分数都在 0~100 之间');
      return;
    }

    try {
      // 准备分数数据：直接使用原始整数
      const scores = accountScores.map((item) => {
        const score = parseInt(item.score);
        return BigInt(isNaN(score) || score < 0 ? 0 : score);
      });

      // 使用新的 submitOriginScores 签名：extensionAddress, groupId, startIndex, originScores
      // startIndex 设置为 0，表示从第一个账号开始提交
      await submitOriginScores(extensionAddress, groupId, BigInt(0), scores as bigint[]);
    } catch (error) {
      console.error('Verify group failed', error);
    }
  }

  useEffect(() => {
    if (isConfirmedVerify) {
      // 提交成功后清除打分缓存
      if (cacheKey) {
        LocalCache.remove(cacheKey);
      }
      toast.success('打分提交成功');
      setTimeout(() => {
        router.push(`/extension/my_verifying_groups?symbol=${token?.symbol}`);
      }, 1500);
    }
  }, [isConfirmedVerify, router, cacheKey]);

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorRound) handleError(errorRound);
    if (errorCanVerify) handleError(errorCanVerify);
    if (errorGetAccounts) handleError(errorGetAccounts);
    if (errorSubmittedCount) handleError(errorSubmittedCount);
    if (errorVerifyGroup) handleError(errorVerifyGroup);
    if (errorVerificationInfos) handleError(errorVerificationInfos);
  }, [
    errorRound,
    errorCanVerify,
    errorGetAccounts,
    errorSubmittedCount,
    errorVerifyGroup,
    errorVerificationInfos,
    handleError,
  ]);

  if (
    isPendingRound ||
    isPendingCanVerify ||
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
  if (!canVerify) {
    return (
      <div className="space-y-4">
        <LeftTitle title="链群验证" />

        <div className="text-center py-12">
          <p className="text-red-500 mb-4">您没有打分权限</p>
          <p className="text-sm text-gray-600 mb-6">只有链群服务者和打分代理才能打分</p>
        </div>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="space-y-4">
        <LeftTitle title="链群验证" />

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
          <LeftTitle title="链群验证" />
          <p className="text-sm text-gray-600 mt-2">为链群 #{groupId.toString()} 中的行动者打分</p>
        </div>

        {/* 已完成提示 */}
        <div className="text-center py-6">
          <div className="mb-6">
            <p className="text-lg font-medium text-gray-900 mb-2">打分已完成</p>
            <p className="text-sm text-gray-600">本轮已为 {accounts?.length} 个行动者提交打分</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* 标题 */}
        <div>
          <LeftTitle title="链群验证" />
          {/* 行动信息 */}
          <div className="text-gray-500 mb-2 text-sm">
            <span>行动：</span>
            <span className="text-greyscale-400 text-sm">No.</span>
            <span className="text-secondary text-xl font-bold mr-2">{actionId.toString()}</span>
            <span className="font-bold text-greyscale-800 text-base">{actionInfo?.body.title || ''}</span>
          </div>
          {/* 链群信息 */}
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
              </tr>
            </thead>
            <tbody>
              {accountScores.map((item, index) => {
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 按钮 */}
        <div className="flex flex-col items-center gap-2 pb-4">
          {/* 第一行：主操作按钮 */}
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
          {/* 第二行：辅助操作按钮 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!accountScores || accountScores.length === 0}
              onClick={handleCopyAddresses}
              title="复制地址及验证信息（包含地址、后4位、验证信息）"
            >
              <Copy size={14} />
              复制地址
            </Button>
            <Button
              variant="outline"
              disabled={!accountScores || accountScores.length === 0}
              onClick={handleCopyScores}
              title="复制当前所有分数到剪贴板（每行一个分数）"
            >
              <Upload size={14} />
              复制分数
            </Button>
            <Button variant="outline" onClick={handlePasteFromClipboard}>
              <Download size={14} />
              粘贴分数
            </Button>
          </div>
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

      <ManualPasteDialog
        isOpen={showManualPasteDialog}
        onClose={() => setShowManualPasteDialog(false)}
        onConfirm={processClipboardText}
        title="粘贴分数数据"
        description="请将复制的分数数据粘贴到下方文本框中（每行一个分数，或每行：地址 分数）"
        placeholder="请粘贴分数数据...&#10;例如：&#10;80&#10;90&#10;100"
      />
    </>
  );
};

export default _GroupOPVerify;
