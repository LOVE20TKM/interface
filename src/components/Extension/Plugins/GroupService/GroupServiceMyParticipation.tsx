'use client';
import React, { useContext, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useContractError } from '@/src/errors/useContractError';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import { formatTokenAmount, formatPercentage } from '@/src/lib/format';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useIsAccountJoined } from '@/src/hooks/extension/base/contracts/useExtensionCenter';

import {
  useJoinedAmountByAccount,
  useJoinedAmount,
  useExit,
} from '@/src/hooks/extension/plugins/group-service/contracts/useExtensionGroupService';

import { useActionGroupRecipientsData } from '@/src/hooks/extension/plugins/group-service/composite/useActionGroupRecipientsData';
import { useExtensionParams } from '@/src/hooks/extension/plugins/group-service/composite/useExtensionParams';
import { useSymbol } from '@/src/hooks/contracts/useLOVE20Token';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';
import _GroupServiceSetRecipients from './_GroupServiceSetRecipients';
import LeftTitle from '@/src/components/Common/LeftTitle';

interface GroupServiceMyParticipationProps {
  extensionAddress: `0x${string}`;
  actionId?: bigint;
}

export default function GroupServiceMyParticipation({ extensionAddress, actionId }: GroupServiceMyParticipationProps) {
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const queryClient = useQueryClient();

  // 判断是否已加入行动（仅在 actionId 存在时）
  const {
    isJoined,
    isPending: isPendingJoined,
    error: errorJoined,
  } = useIsAccountJoined(token?.address as `0x${string}`, actionId ?? BigInt(0), account as `0x${string}`);

  // Data Hooks
  const { joinedAmountByAccount, isPending: isJoinedPending } = useJoinedAmountByAccount(
    extensionAddress,
    account as `0x${string}`,
  );
  const { joinedAmount: totalJoinedAmount } = useJoinedAmount(extensionAddress);

  // Get extension params to fetch groupActionTokenAddress
  const { groupActionTokenAddress } = useExtensionParams(extensionAddress);

  // Get symbol for groupActionTokenAddress
  const { symbol: groupActionTokenSymbol } = useSymbol(groupActionTokenAddress || ('0x' as `0x${string}`));

  // 验证轮轮次（recipients 需要）
  const { currentRound } = useCurrentRound();

  // Fetch all action-group recipients data（按验证轮查询）
  const {
    actionGroupRecipientsData,
    isPending: isRecipientsPending,
    error: recipientsError,
  } = useActionGroupRecipientsData({
    tokenAddress: groupActionTokenAddress,
    account: account as `0x${string}`,
    extensionAddress,
    round: currentRound,
  });

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{
    actionId: bigint;
    actionTitle: string;
    groupId: bigint;
    groupName: string | undefined;
    addrs?: `0x${string}`[];
    ratios?: bigint[];
  } | null>(null);

  const handleEditClick = (action: any, group: any) => {
    setEditingGroup({
      actionId: action.actionId,
      actionTitle: action.actionTitle,
      groupId: group.groupId,
      groupName: group.groupName,
      addrs: group.addrs,
      ratios: group.ratios,
    });
    setEditDialogOpen(true);
  };

  // 处理对话框关闭，清空编辑状态
  const handleDialogOpenChange = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      // 延迟清空 editingGroup，确保对话框关闭动画完成
      setTimeout(() => {
        setEditingGroup(null);
      }, 300);
    }
  };

  // Exit Hook
  const {
    exit,
    isPending: isExitPending,
    isConfirming: isExitConfirming,
    isConfirmed: isExitConfirmed,
    writeError: exitError,
  } = useExit(extensionAddress);

  // Error Handling
  const { handleError } = useContractError();
  useEffect(() => {
    if (exitError) {
      handleError(exitError);
    }
  }, [exitError, handleError]);

  useEffect(() => {
    if (recipientsError) {
      handleError(recipientsError);
    }
  }, [recipientsError, handleError]);

  useEffect(() => {
    if (errorJoined) {
      handleError(errorJoined);
    }
  }, [errorJoined, handleError]);

  useEffect(() => {
    if (isExitConfirmed) {
      toast.success('退出行动成功');
    }
  }, [isExitConfirmed]);

  // Calculations
  const myParticipation = joinedAmountByAccount || BigInt(0);
  const totalParticipation = totalJoinedAmount || BigInt(1); // avoid div by zero

  // Calculate percentage
  let percentage = 0;
  if (myParticipation > 0 && totalJoinedAmount && totalJoinedAmount > 0) {
    percentage = Number((BigInt(myParticipation) * BigInt(10000)) / totalJoinedAmount) / 100;
  }

  const displayPercentage = formatPercentage(percentage);

  const handleExit = async () => {
    if (myParticipation <= 0) {
      toast.error('您没有参与，无需退出');
      return;
    }
    await exit();
  };

  // Loading state for initial data
  if (isJoinedPending || (actionId && isPendingJoined)) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="text-center">
          <LoadingIcon />
          <p className="mt-4 text-gray-600">加载数据中...</p>
        </div>
      </div>
    );
  }

  // 如果 actionId 存在且用户未加入，显示提示信息
  if (actionId && !isJoined) {
    return (
      <div className="flex flex-col items-center pt-8">
        <p className="text-gray-600 mb-6">您还没有参与此链群服务行动</p>
        <Button variant="outline" className="text-secondary border-secondary" asChild>
          <Link href={`/acting/join?id=${actionId}&symbol=${token?.symbol || ''}`}>加入链群服务行动</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* 数据区 */}
      <div className="stats w-full grid grid-cols-2 divide-x-0 gap-4">
        {/* 我的参与 */}
        <div className="stat place-items-center flex flex-col justify-center">
          <div className="stat-title">我的参与</div>
          <div className="stat-value text-2xl text-secondary">{formatTokenAmount(myParticipation)}</div>
          <div className="stat-desc text-sm mt-2 whitespace-normal break-words text-center">
            {groupActionTokenSymbol || '-'}
          </div>
        </div>

        {/* 所占比例 */}
        <div className="stat place-items-center flex flex-col justify-center">
          <div className="stat-title">占总参与量</div>
          <div className="stat-value text-2xl text-secondary">{displayPercentage}</div>
          <div className="stat-desc text-sm mt-2 whitespace-normal break-words text-center">
            总量 {formatTokenAmount(totalParticipation)}
          </div>
        </div>
      </div>

      {/* 按钮区 */}
      <div className="flex justify-center space-x-2 w-full">
        {/* 退出行动 */}
        <Button
          variant="outline"
          className="flex-1 text-secondary border-secondary"
          onClick={handleExit}
          disabled={isExitPending || isExitConfirming || isExitConfirmed || myParticipation <= 0}
        >
          {isExitPending ? '提交中' : isExitConfirming ? '确认中' : isExitConfirmed ? '已退出' : '退出行动'}
        </Button>

        {/* 查看激励 */}
        <Button variant="outline" className="flex-1 text-secondary border-secondary" asChild>
          <Link href={`/my/rewardsofaction?id=${actionId?.toString() || ''}&symbol=${token?.symbol || ''}`}>
            查看激励
          </Link>
        </Button>
      </div>

      {/* 二次分配地址 */}
      <div className="w-full mt-6">
        <LeftTitle title="我的链群" />

        {isRecipientsPending ? (
          <div className="flex justify-center p-8">
            <LoadingIcon />
          </div>
        ) : !actionGroupRecipientsData || actionGroupRecipientsData.length === 0 ? (
          <div className="text-center text-sm text-greyscale-400 p-4 bg-gray-50 rounded-lg mt-4">
            暂无二次分配地址配置
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {actionGroupRecipientsData.map((action) => (
              <div key={action.actionId.toString()} className="border rounded-lg p-3">
                <div className="flex items-baseline mb-2">
                  <span className="text-greyscale-400 text-sm">{`No.`}</span>
                  <span className="text-secondary text-xl font-bold mr-2">{String(action.actionId)}</span>
                  <span className="font-bold text-greyscale-800">{action.actionTitle}</span>
                </div>

                <div className="space-y-1">
                  {action.groups.map((group) => (
                    <div key={group.groupId.toString()} className="border-t pt-4 first:border-t-0 first:pt-0">
                      <div className="flex items-center justify-between">
                        <div className="text-gray-800">
                          <span className="text-gray-500 text-xs">#</span>
                          <span className="text-secondary text-base font-semibold ">
                            {group.groupId.toString()}
                          </span>{' '}
                          <span>{group.groupName || `链群 #${group.groupId}`}</span>
                        </div>
                        <Button
                          className="gap-0 px-2 text-secondary"
                          variant="link"
                          size="sm"
                          onClick={() => handleEditClick(action, group)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          编辑分配地址 &gt;&gt;
                        </Button>
                      </div>

                      {group.addrs && group.addrs.length > 0 ? (
                        <table className="table w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="py-1 px-1 text-left">序号</th>
                              <th className="py-1 px-1 text-left">地址</th>
                              <th className="py-1 px-1 text-right">分配比例</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.addrs.map((addr, idx) => (
                              <tr key={`${addr}-${idx}`} className="border-b border-gray-100">
                                <td className="py-1 px-1 text-greyscale-400">{idx + 1}</td>
                                <td className="py-1 px-1">
                                  <div className="inline-flex items-center bg-gray-50 rounded-md px-2 py-1">
                                    <AddressWithCopyButton address={addr} showCopyButton={true} />
                                  </div>
                                </td>
                                <td className="py-1 px-1 text-right font-mono text-secondary">
                                  {group.ratios ? (Number(group.ratios[idx]) / 1e16).toFixed(2) : '0.00'}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-sm text-greyscale-400 p-2 bg-gray-50 rounded">未设置分配地址</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {editingGroup && (
        <_GroupServiceSetRecipients
          extensionAddress={extensionAddress}
          actionId={editingGroup.actionId}
          actionTitle={editingGroup.actionTitle}
          groupId={editingGroup.groupId}
          groupName={editingGroup.groupName}
          currentAddrs={editingGroup.addrs}
          currentRatios={editingGroup.ratios}
          open={editDialogOpen}
          onOpenChange={handleDialogOpenChange}
          onSuccess={() => {
            toast.success('二次分配设置已更新');
            handleDialogOpenChange(false);
            // 刷新所有 readContracts 查询，特别是 recipientsLatest 相关的
            queryClient.invalidateQueries({
              predicate: (query) => {
                const queryKey = query.queryKey;
                if (Array.isArray(queryKey) && queryKey[0] === 'readContracts') {
                  const contracts = (queryKey[1] as any)?.contracts;
                  if (Array.isArray(contracts)) {
                    return contracts.some((contract: any) => contract?.functionName === 'recipientsLatest');
                  }
                }
                return false;
              },
            });
          }}
        />
      )}

      <LoadingOverlay
        isLoading={isExitPending || isExitConfirming}
        text={isExitPending ? '提交退出...' : '确认退出...'}
      />
    </div>
  );
}
