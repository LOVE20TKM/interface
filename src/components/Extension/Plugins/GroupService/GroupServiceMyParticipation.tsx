'use client';
import React, { useContext, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useHandleContractError } from '@/src/lib/errorUtils';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import { formatTokenAmount } from '@/src/lib/format';
import { toast } from 'react-hot-toast';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';

import {
  useJoinedValueByAccount,
  useJoinedValue,
  useExit,
} from '@/src/hooks/extension/plugins/group-service/contracts/useLOVE20ExtensionGroupService';

import { useActionGroupRecipientsData } from '@/src/hooks/extension/plugins/group-service/composite';

import _GroupServiceSetRecipients from './_GroupServiceSetRecipients';
import LeftTitle from '@/src/components/Common/LeftTitle';

interface GroupServiceMyParticipationProps {
  extensionAddress: `0x${string}`;
  actionId?: bigint;
}

export default function GroupServiceMyParticipation({ extensionAddress, actionId }: GroupServiceMyParticipationProps) {
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};

  // Data Hooks
  const { joinedValueByAccount, isPending: isJoinedPending } = useJoinedValueByAccount(
    extensionAddress,
    account as `0x${string}`,
  );
  const { joinedValue: totalJoinedValue } = useJoinedValue(extensionAddress);

  // Get current round for fetching recipients data
  const { currentRound } = useCurrentRound();

  // Fetch all action-group recipients data
  const {
    actionGroupRecipientsData,
    isPending: isRecipientsPending,
    error: recipientsError,
  } = useActionGroupRecipientsData({
    tokenAddress: token?.address,
    verifyRound: currentRound,
    account: account as `0x${string}`,
    extensionAddress,
  });

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{
    actionId: bigint;
    actionTitle: string;
    groupId: bigint;
    groupName: string | undefined;
    addrs?: `0x${string}`[];
    basisPoints?: bigint[];
  } | null>(null);

  const handleEditClick = (action: any, group: any) => {
    setEditingGroup({
      actionId: action.actionId,
      actionTitle: action.actionTitle,
      groupId: group.groupId,
      groupName: group.groupName,
      addrs: group.addrs,
      basisPoints: group.basisPoints,
    });
    setEditDialogOpen(true);
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
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (exitError) {
      handleContractError(exitError, 'extension');
    }
  }, [exitError, handleContractError]);

  useEffect(() => {
    if (recipientsError) {
      handleContractError(recipientsError, 'extension');
    }
  }, [recipientsError, handleContractError]);

  useEffect(() => {
    if (isExitConfirmed) {
      toast.success('退出行动成功');
    }
  }, [isExitConfirmed]);

  // Calculations
  const myParticipation = joinedValueByAccount || BigInt(0);
  const totalParticipation = totalJoinedValue || BigInt(1); // avoid div by zero

  // Calculate percentage
  let percentage = 0;
  if (myParticipation > 0 && totalJoinedValue && totalJoinedValue > 0) {
    percentage = Number((BigInt(myParticipation) * BigInt(10000)) / totalJoinedValue) / 100;
  }

  const displayPercentage = totalJoinedValue && totalJoinedValue > 0 ? `${percentage.toFixed(2)}%` : '0.00%';

  const handleExit = async () => {
    if (myParticipation <= 0) {
      toast.error('您没有参与，无需退出');
      return;
    }
    await exit();
  };

  // Loading state for initial data
  if (isJoinedPending) {
    return <div className="p-8 text-center text-muted-foreground">加载中...</div>;
  }

  return (
    <div>
      {/* 数据区 */}
      <div className="stats w-full grid grid-cols-2 divide-x-0 gap-4">
        {/* 我的参与 */}
        <div className="stat place-items-center flex flex-col justify-center">
          <div className="stat-title">我的参与</div>
          <div className="stat-value text-2xl text-secondary">{formatTokenAmount(myParticipation)}</div>
          <div className="stat-desc text-sm mt-2 whitespace-normal break-words text-center">{token?.symbol}</div>
        </div>

        {/* 所占比例 */}
        <div className="stat place-items-center flex flex-col justify-center">
          <div className="stat-title">占总服务量</div>
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
        <LeftTitle title="二次分配地址" />

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
              <div key={action.actionId.toString()} className="border rounded-lg p-4">
                <h3 className="font-medium text-base mb-4">
                  行动 #{action.actionId.toString()}: {action.actionTitle}
                </h3>

                <div className="space-y-4">
                  {action.groups.map((group) => (
                    <div key={group.groupId.toString()} className="border-t pt-4 first:border-t-0 first:pt-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-sm">
                          {group.groupName || `链群 #${group.groupId}`}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(action, group)}>
                          <Edit className="w-3 h-3 mr-1" />
                          编辑
                        </Button>
                      </div>

                      {group.addrs && group.addrs.length > 0 ? (
                        <table className="table w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="px-1 text-left">序号</th>
                              <th className="px-1 text-left">地址</th>
                              <th className="px-1 text-right">分配比例</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.addrs.map((addr, idx) => (
                              <tr key={`${addr}-${idx}`} className="border-b border-gray-100">
                                <td className="px-1 text-greyscale-400">{idx + 1}</td>
                                <td className="px-1">
                                  <div className="inline-flex items-center bg-gray-50 rounded-md px-2 py-1">
                                    <AddressWithCopyButton address={addr} showCopyButton={true} />
                                  </div>
                                </td>
                                <td className="px-1 text-right font-mono text-secondary">
                                  {group.basisPoints
                                    ? (Number(group.basisPoints[idx]) / 100).toFixed(2)
                                    : '0.00'}
                                  %
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-sm text-greyscale-400 p-2 bg-gray-50 rounded">暂未设置二次分配地址</div>
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
          currentBasisPoints={editingGroup.basisPoints}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => {
            toast.success('二次分配设置已更新');
            setEditDialogOpen(false);
            // Data will auto-refresh due to wagmi cache invalidation
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
