// pages/group/export_groups.tsx
// 导出指定扩展行动的所有链群参与地址，供打分使用

'use client';

import React, { useContext, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';

import { TokenContext } from '@/src/contexts/TokenContext';
import { useActionInfo } from '@/src/hooks/contracts/useLOVE20Submit';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';
import { useExtensionByActionInfoWithCache } from '@/src/hooks/extension/base/composite/useExtensionsByActionInfosWithCache';
import { useExtensionGroupInfosOfAction } from '@/src/hooks/extension/plugins/group/composite/useExtensionGroupInfosOfAction';
import { useAllGroupsAccountsOfAction } from '@/src/hooks/extension/plugins/group/composite/useAllGroupsAccountsOfAction';
import { useVerificationInfos } from '@/src/hooks/composite/useVerificationInfos';
import { useContractError } from '@/src/errors/useContractError';

import Header from '@/src/components/Header';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import { Button } from '@/components/ui/button';

// ==================== 工具函数 ====================

/**
 * 生成 TSV 文本内容
 * 格式：
 *   {groupId}\t{groupName}
 *   地址\t后4位\t{key1}\t{key2}...
 *   0x...\t2266\tvalue1\tvalue2
 *   (空行)
 *   下一个群...
 */
function buildTsvContent(
  groups: { groupId: bigint; groupName: string }[],
  groupAccountsMap: Map<string, `0x${string}`[]>,
  verificationInfosMap: Map<string, string[]>,
  verificationKeys: string[],
): string {
  const sections: string[] = [];

  for (const group of groups) {
    const accounts = groupAccountsMap.get(group.groupId.toString()) || [];
    if (accounts.length === 0) continue;

    const lines: string[] = [];

    // 群标题行
    lines.push(`${group.groupId.toString()} ${group.groupName}`);

    // // 列头行
    // const header = ['地址', '后4位', ...verificationKeys];
    // lines.push(header.join('\t'));

    // 数据行
    for (const address of accounts) {
      const last4 = address.slice(-4);
      const infos = verificationInfosMap.get(address.toLowerCase()) || [];
      lines.push([address, last4, ...infos].join('\t'));
    }

    sections.push(lines.join('\n'));
  }

  return sections.join('\n\n');
}

/**
 * 触发浏览器下载 TSV 文件（加 UTF-8 BOM 防 Excel 乱码）
 */
function downloadTsv(content: string, filename: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/tab-separated-values;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ==================== 页面组件 ====================

const ExportGroupsPage: React.FC = () => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};

  // 从 URL 获取 actionId
  const actionId = useMemo(() => {
    const raw = router.query.actionId;
    if (!raw || typeof raw !== 'string') return undefined;
    try {
      return BigInt(raw);
    } catch {
      return undefined;
    }
  }, [router.query.actionId]);

  // 获取行动信息（含 verificationKeys）
  const {
    actionInfo,
    isPending: isPendingAction,
    error: errorAction,
  } = useActionInfo(token?.address as `0x${string}`, actionId);

  // 获取扩展合约地址
  const {
    contractInfo,
    isPending: isPendingExtension,
    error: errorExtension,
  } = useExtensionByActionInfoWithCache({
    tokenAddress: token?.address as `0x${string}`,
    actionInfo,
  });
  const extensionAddress = contractInfo?.extension;

  // 获取当前打分轮次
  const { currentRound, isPending: isPendingRound, error: errorRound } = useCurrentRound();

  // 获取所有活跃链群（含 accountCount）
  const {
    groups,
    isPending: isPendingGroups,
    error: errorGroups,
  } = useExtensionGroupInfosOfAction({
    extensionAddress,
    round: currentRound,
  });

  // 批量获取所有群的成员地址（单次 RPC）
  const {
    groupAccountsMap,
    allAccounts,
    isPending: isPendingAccounts,
    error: errorAccounts,
  } = useAllGroupsAccountsOfAction({
    extensionAddress,
    round: currentRound,
    groups,
  });

  // 按参与代币数从高到低排序（与链群列表页保持一致）
  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => (b.totalJoinedAmount > a.totalJoinedAmount ? 1 : b.totalJoinedAmount < a.totalJoinedAmount ? -1 : 0)),
    [groups],
  );

  // verificationKeys
  const verificationKeys: string[] = useMemo(() => actionInfo?.body?.verificationKeys || [], [actionInfo]);

  // 批量获取所有地址的验证信息（单次 RPC）
  const {
    verificationInfos,
    isPending: isPendingVerification,
    error: errorVerification,
  } = useVerificationInfos({
    tokenAddress: token?.address,
    actionId: actionId || BigInt(0),
    accounts: allAccounts,
    verificationKeys,
    round: currentRound || BigInt(0),
    enabled: !!token?.address && !!actionId && allAccounts.length > 0 && verificationKeys.length > 0,
  });

  // address.toLowerCase() -> infos[]，方便 O(1) 查询
  const verificationInfosMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const item of verificationInfos) {
      map.set(item.account.toLowerCase(), item.infos);
    }
    return map;
  }, [verificationInfos]);

  // 统计总地址数
  const totalAccounts = useMemo(() => {
    let count = 0;
    for (const accs of groupAccountsMap.values()) count += accs.length;
    return count;
  }, [groupAccountsMap]);

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorAction) handleError(errorAction);
    if (errorExtension) handleError(errorExtension);
    if (errorRound) handleError(errorRound);
    if (errorGroups) handleError(errorGroups);
    if (errorAccounts) handleError(errorAccounts);
    if (errorVerification) handleError(errorVerification);
  }, [errorAction, errorExtension, errorRound, errorGroups, errorAccounts, errorVerification, handleError]);

  // 整体加载状态（各阶段串行）
  const isLoading =
    isPendingAction ||
    isPendingExtension ||
    isPendingRound ||
    isPendingGroups ||
    isPendingAccounts ||
    isPendingVerification;

  // 加载阶段描述
  const loadingText = useMemo(() => {
    if (isPendingAction || isPendingExtension) return '加载行动信息...';
    if (isPendingRound) return '获取当前轮次...';
    if (isPendingGroups) return '加载链群列表...';
    if (isPendingAccounts) return '加载成员地址...';
    if (isPendingVerification) return '加载验证信息...';
    return '';
  }, [isPendingAction, isPendingExtension, isPendingRound, isPendingGroups, isPendingAccounts, isPendingVerification]);

  // 下载 TSV 文件
  const handleDownload = () => {
    const content = buildTsvContent(sortedGroups, groupAccountsMap, verificationInfosMap, verificationKeys);
    const filename = `groups_action${actionId}_round${currentRound}.tsv`;
    downloadTsv(content, filename);
  };

  // 参数校验
  if (!actionId) {
    return (
      <>
        <Header title="导出链群参与地址" showBackButton={true} />
        <main className="flex-grow p-4">
          <p className="text-red-500 text-center mt-8">缺少参数：actionId</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="导出链群参与地址" showBackButton={true} />
      <main className="flex-grow p-4 space-y-4">
        {/* 行动信息 */}
        <div className="text-sm text-gray-600">
          <span>行动：</span>
          <span className="text-greyscale-400 text-sm">No.</span>
          <span className="text-secondary text-xl font-bold mr-2">{actionId.toString()}</span>
          {actionInfo?.body?.title && (
            <span className="font-bold text-greyscale-800 text-base">{actionInfo.body.title}</span>
          )}
        </div>

        {/* 轮次 & 统计 */}
        {currentRound !== undefined && (
          <div className="text-sm text-gray-500">
            <span>打分轮次：</span>
            <span className="font-semibold text-secondary">{currentRound.toString()}</span>
          </div>
        )}

        {/* 下载按钮 */}
        {!isLoading && sortedGroups.length > 0 && (
          <div>
            <Button onClick={handleDownload} disabled={totalAccounts === 0} className="w-full">
              下载 TSV 文件（可直接用 Excel 打开）
            </Button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              文件包含所有链群的参与地址及验证信息，用 Excel 打开后即可打分
            </p>
          </div>
        )}

        {/* 加载状态 / 群列表摘要 */}
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <LoadingIcon />
            <div className="text-gray-500 text-sm">{loadingText}</div>
          </div>
        ) : sortedGroups.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">暂无活跃链群</p>
        ) : (
          <div className="space-y-2">
            {/* 汇总 */}
            <div className="text-sm text-gray-600">
              共 <span className="font-semibold text-secondary">{sortedGroups.length}</span> 个链群， 共{' '}
              <span className="font-semibold text-secondary">{totalAccounts}</span> 个参与地址
            </div>

            {/* 每个群的简要信息 */}
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {sortedGroups.map((group) => {
                const count = groupAccountsMap.get(group.groupId.toString())?.length ?? Number(group.accountCount);
                return (
                  <div key={group.groupId.toString()} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs">#</span>
                      <span className="text-secondary font-semibold mr-1">{group.groupId.toString()}</span>
                      <span className="text-gray-800">{group.groupName}</span>
                    </div>
                    <span className="text-gray-500">{count} 个地址</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default ExportGroupsPage;
