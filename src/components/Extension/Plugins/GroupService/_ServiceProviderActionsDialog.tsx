'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import { formatTokenAmount } from '@/src/lib/format';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';
import { useActionsWithActiveGroupsByOwner } from '@/src/hooks/extension/plugins/group-service/composite/useActionsWithActiveGroupsByOwner';
import { useExtensionParams } from '@/src/hooks/extension/plugins/group-service/composite/useExtensionParams';

interface ServiceProviderActionsDialogProps {
  /** Extension 合约地址 */
  extensionAddress: `0x${string}` | undefined;
  /** 服务者地址 */
  serviceProvider: `0x${string}` | undefined;
  /** Dialog 打开状态 */
  open: boolean;
  /** Dialog 状态变化回调 */
  onOpenChange: (open: boolean) => void;
}

/**
 * 服务者行动与链群展示 Dialog 组件
 *
 * 功能：
 * - 展示服务者的所有行动和链群
 * - 按行动分组展示，每个行动包含链群列表
 * - 显示链群ID、名称、代币参与量
 */
export default function ServiceProviderActionsDialog({
  extensionAddress,
  serviceProvider,
  open,
  onOpenChange,
}: ServiceProviderActionsDialogProps) {
  // 获取当前加入轮次
  const { currentRound } = useCurrentRound();

  // 从 extensionAddress 获取 groupActionTokenAddress
  const { groupActionTokenAddress } = useExtensionParams(extensionAddress! as `0x${string}`);

  // 获取服务者的所有行动和链群数据
  const { actionsWithGroups, isPending, error } = useActionsWithActiveGroupsByOwner({
    groupActionTokenAddress,
    account: open && serviceProvider ? serviceProvider : undefined, // 只在 Dialog 打开时查询
    round: currentRound,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto py-8 px-4">
        <DialogHeader>
          <DialogTitle>服务者行动与链群</DialogTitle>
        </DialogHeader>

        {/* 服务者地址 */}
        {serviceProvider && (
          <div className="flex items-center mb-4 bg-gray-50 px-3 py-2 rounded">
            <span className="text-sm text-greyscale-500 mr-2">服务者:</span>
            <AddressWithCopyButton address={serviceProvider} showCopyButton={true} />
          </div>
        )}

        {isPending ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingIcon />
            <p className="mt-4 text-sm text-gray-600">加载数据...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p className="text-sm">加载失败，请稍后重试</p>
            {error instanceof Error && <p className="text-xs mt-2 text-gray-500">{error.message}</p>}
          </div>
        ) : !actionsWithGroups || actionsWithGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">该服务者暂无激活的行动和链群</p>
          </div>
        ) : (
          <div className="space-y-6">
            {actionsWithGroups.map((actionWithGroups) => (
              <div key={actionWithGroups.actionId.toString()} className="">
                {/* 行动标题 */}
                <div className="flex items-baseline mb-3">
                  <span className="text-greyscale-400 text-sm">{`No.`}</span>
                  <span className="text-secondary text-xl font-bold mr-2">{String(actionWithGroups.actionId)}</span>
                  <span className="font-bold text-greyscale-800">{actionWithGroups.actionTitle}</span>
                </div>

                {/* 链群列表表格 */}
                {actionWithGroups.groups.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">该行动下暂无链群</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="px-2 py-2 text-left text-sm">链群</th>
                          <th className="px-2 py-2 text-right text-sm">代币参与量</th>
                        </tr>
                      </thead>
                      <tbody>
                        {actionWithGroups.groups.map((group) => (
                          <tr key={group.groupId.toString()} className="border-b border-gray-100">
                            <td className="px-2 py-2">
                              <span className="text-gray-500 text-xs">#</span>
                              <span className="text-secondary text-base font-semibold">{group.groupId.toString()}</span>
                              <span className="text-sm ml-1">{group.groupName || `链群 #${group.groupId}`}</span>
                            </td>
                            <td className="px-2 py-2 text-right">
                              <div className="font-mono text-sm">{formatTokenAmount(group.totalJoinedAmount)}</div>
                            </td>
                          </tr>
                        ))}

                        {/* 汇总行 */}
                        <tr className="bg-gray-50 font-semibold">
                          <td className="px-2 py-2 text-left">汇总</td>
                          <td className="px-2 py-2 text-right">
                            <div className="font-mono text-sm">
                              {formatTokenAmount(
                                actionWithGroups.groups.reduce((sum, g) => sum + g.totalJoinedAmount, BigInt(0)),
                              )}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
