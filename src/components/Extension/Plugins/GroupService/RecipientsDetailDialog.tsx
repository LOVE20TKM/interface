'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import { formatTokenAmount, formatPercentage } from '@/src/lib/format';
import { useRecipientsDetailByAccountByRound } from '@/src/hooks/extension/plugins/group-service/composite/useRecipientsDetailByAccountByRound';

interface RecipientsDetailDialogProps {
  /** Extension 合约地址 */
  extensionAddress: `0x${string}` | undefined;
  /** Token 地址 */
  tokenAddress: `0x${string}` | undefined;
  /** 链群主账户地址 */
  account: `0x${string}` | undefined;
  /** 轮次 */
  round: bigint | undefined;
  /** Dialog 打开状态 */
  open: boolean;
  /** Dialog 状态变化回调 */
  onOpenChange: (open: boolean) => void;
}

/**
 * 二次分配明细展示 Dialog 组件
 *
 * 功能：
 * - 展示链群主在某一轮的二次分配明细
 * - 按行动分组展示，每个行动包含多个链群的分配明细
 * - 显示接收地址、比例、金额等信息
 */
export default function RecipientsDetailDialog({
  extensionAddress,
  tokenAddress,
  account,
  round,
  open,
  onOpenChange,
}: RecipientsDetailDialogProps) {
  // 获取二次分配明细数据
  const { actionInfosWithGroups, isPending, error } = useRecipientsDetailByAccountByRound({
    extensionAddress,
    tokenAddress,
    account,
    round: open && round !== undefined ? round : undefined, // 只在 Dialog 打开时查询
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {account && round !== undefined
              ? `第 ${round.toString()} 轮二次分配明细 - ${account.slice(0, 6)}...${account.slice(-4)}`
              : '二次分配明细'}
          </DialogTitle>
        </DialogHeader>

        {isPending ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingIcon />
            <p className="mt-4 text-sm text-gray-600">加载明细数据...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p className="text-sm">加载失败，请稍后重试</p>
            {error instanceof Error && <p className="text-xs mt-2 text-gray-500">{error.message}</p>}
          </div>
        ) : !actionInfosWithGroups || actionInfosWithGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">暂无二次分配明细</p>
          </div>
        ) : (
          <div className="space-y-6">
            {actionInfosWithGroups.map((actionInfo) => (
              <div key={actionInfo.actionId.toString()} className="border rounded-lg p-4">
                {/* 行动标题 */}
                <h3 className="text-base font-semibold mb-3 text-gray-900">
                  {actionInfo.actionBaseInfo.body.title || `行动 #${actionInfo.actionId.toString()}`}
                </h3>

                {/* 链群列表 */}
                {actionInfo.groups.length === 0 ? (
                  <p className="text-sm text-gray-500">该行动下暂无链群二次分配</p>
                ) : (
                  <div className="space-y-4">
                    {actionInfo.groups.map((group) => (
                      <div key={group.groupId.toString()} className="border rounded-md overflow-hidden">
                        {/* 链群名称 */}
                        <div className="bg-gray-50 px-3 py-2 border-b">
                          <p className="text-sm font-medium text-gray-700">
                            {group.groupName || `链群 #${group.groupId.toString()}`}
                          </p>
                        </div>

                        {/* 分配明细表格 */}
                        {group.distribution ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="px-3 py-2 text-left text-xs font-medium">地址</TableHead>
                                  <TableHead className="px-3 py-2 text-right text-xs font-medium">比例</TableHead>
                                  <TableHead className="px-3 py-2 text-right text-xs font-medium">金额</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {/* 接收地址列表 */}
                                {group.distribution.addrs.map((addr, index) => {
                                  const basisPoints = group.distribution!.basisPoints[index];
                                  const amount = group.distribution!.amounts[index];
                                  const percentage = basisPoints ? Number(basisPoints) / 100 : 0;

                                  return (
                                    <TableRow key={`${addr}_${index}`}>
                                      <TableCell className="px-3 py-2">
                                        <AddressWithCopyButton address={addr} showCopyButton={true} />
                                      </TableCell>
                                      <TableCell className="px-3 py-2 text-right text-sm">
                                        {formatPercentage(percentage)}
                                      </TableCell>
                                      <TableCell className="px-3 py-2 text-right text-sm font-medium">
                                        {formatTokenAmount(amount)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}

                                {/* 链群主金额 */}
                                {group.distribution.ownerAmount > BigInt(0) && (
                                  <TableRow className="bg-gray-50 font-medium">
                                    <TableCell className="px-3 py-2">
                                      <span className="text-sm text-gray-600">链群主保留</span>
                                    </TableCell>
                                    <TableCell className="px-3 py-2 text-right text-sm text-gray-600">-</TableCell>
                                    <TableCell className="px-3 py-2 text-right text-sm">
                                      {formatTokenAmount(group.distribution.ownerAmount)}
                                    </TableCell>
                                  </TableRow>
                                )}

                                {/* 汇总行 */}
                                <TableRow className="bg-gray-100 font-semibold">
                                  <TableCell className="px-3 py-2">
                                    <span className="text-sm">汇总</span>
                                  </TableCell>
                                  <TableCell className="px-3 py-2 text-right text-sm">
                                    {formatPercentage(
                                      group.distribution.addrs.reduce(
                                        (sum, _, idx) => sum + Number(group.distribution!.basisPoints[idx]) / 100,
                                        0,
                                      ),
                                    )}
                                  </TableCell>
                                  <TableCell className="px-3 py-2 text-right text-sm">
                                    {formatTokenAmount(
                                      group.distribution.addrs.reduce(
                                        (sum, _, idx) => sum + group.distribution!.amounts[idx],
                                        BigInt(0),
                                      ) + group.distribution.ownerAmount,
                                    )}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="px-3 py-4 text-center text-sm text-gray-500">暂无分配明细</div>
                        )}
                      </div>
                    ))}
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

