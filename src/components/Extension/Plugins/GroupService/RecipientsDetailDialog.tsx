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
  /** 链群服务者账户地址 */
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
 * - 展示链群服务者在某一轮的二次分配明细
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto py-8 px-4">
        <DialogHeader>
          <DialogTitle>
            {account && round !== undefined ? `第 ${round.toString()} 轮二次分配明细` : '二次分配明细'}
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
              <div key={actionInfo.actionId.toString()} className="">
                {/* 行动标题 */}
                <div className="flex items-baseline mb-2">
                  <span className="text-greyscale-400 text-sm">{`No.`}</span>
                  <span className="text-secondary text-xl font-bold mr-2">{String(actionInfo.actionId)}</span>
                  <span className="font-bold text-greyscale-800">
                    {actionInfo.actionBaseInfo.body.title || `行动 #${actionInfo.actionId.toString()}`}
                  </span>
                </div>

                {/* 链群列表 */}
                {actionInfo.groups.length === 0 ? (
                  <p className="text-sm text-gray-500">该行动下暂无链群二次分配</p>
                ) : (
                  <div className="space-y-2">
                    {actionInfo.groups.map((group) => (
                      <div key={group.groupId.toString()} className="border-t pt-4 first:border-t-0 first:pt-0">
                        {/* 链群名称 */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-gray-800">
                            <span className="text-gray-500 text-xs">&nbsp;链群 #</span>
                            <span className="text-secondary text-base font-semibold ">
                              {group.groupId.toString()}
                            </span>{' '}
                            <span>{group.groupName || `链群 #${group.groupId}`}</span>
                          </div>
                        </div>

                        {/* 分配明细表格 */}
                        {group.distribution ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="px-3 py-2 text-left text-xs font-medium">地址</TableHead>
                                  <TableHead className="px-3 py-2 text-right text-xs font-medium">比例</TableHead>
                                  <TableHead className="px-3 py-2 text-right text-xs font-medium">激励</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {/* 接收地址列表 */}
                                {group.distribution.addrs.map((addr, index) => {
                                  const ratio = group.distribution!.ratios[index];
                                  const amount = group.distribution!.amounts[index];
                                  const percentage = ratio ? Number(ratio) / 1e16 : 0; // wei 转百分比

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

                                {/* 链群服务者金额 */}
                                {group.distribution.ownerAmount > BigInt(0) && (
                                  <TableRow className="bg-gray-50 font-medium">
                                    <TableCell className="px-3 py-2">
                                      <span className="text-sm text-gray-600">链群服务者保留</span>
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
                                        (sum, _, idx) => sum + Number(group.distribution!.ratios[idx]) / 1e16,
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
