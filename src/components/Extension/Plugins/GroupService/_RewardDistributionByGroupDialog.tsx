'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import { formatTokenAmount, formatPercentage } from '@/src/lib/format';
import { useRewardDistribution } from '@/src/hooks/extension/plugins/group-service/contracts/useLOVE20ExtensionGroupService';

interface _RewardDistributionByGroupDialogProps {
  /** Extension 合约地址 */
  extensionAddress: `0x${string}` | undefined;
  /** Token 地址 */
  tokenAddress: `0x${string}` | undefined;
  /** 服务者地址 */
  verifier: `0x${string}`;
  /** 轮次 */
  round: bigint | undefined;
  /** 行动 ID */
  actionId: bigint;
  /** 行动标题 */
  actionTitle: string;
  /** 链群 ID */
  groupId: bigint;
  /** 链群名称 */
  groupName: string | undefined;
  /** Dialog 打开状态 */
  open: boolean;
  /** Dialog 状态变化回调 */
  onOpenChange: (open: boolean) => void;
}

/**
 * 二次分配明细展示 Dialog 组件
 *
 * 功能：
 * - 展示链群服务者在某一轮的某个行动某个链群的二次分配明细
 * - 显示接收地址、比例、金额等信息
 */
export default function _RewardDistributionByGroupDialog({
  extensionAddress,
  tokenAddress,
  verifier,
  round,
  actionId,
  actionTitle,
  groupId,
  groupName,
  open,
  onOpenChange,
}: _RewardDistributionByGroupDialogProps) {
  // 获取二次分配明细数据
  const { addrs, basisPoints, amounts, ownerAmount, isPending, error } = useRewardDistribution(
    extensionAddress as `0x${string}`,
    round as bigint,
    verifier,
    actionId,
    groupId,
  );

  // 计算总额
  const totalAmount =
    addrs && amounts
      ? amounts.reduce((sum, amount) => sum + amount, BigInt(0)) + (ownerAmount || BigInt(0))
      : BigInt(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto py-6 px-4">
        <DialogHeader>
          <DialogTitle>二次分配明细</DialogTitle>
        </DialogHeader>

        {/* 行动和链群信息 */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="flex items-baseline mb-2">
            <span className="text-greyscale-400 text-sm">{`No.`}</span>
            <span className="text-secondary text-xl font-bold mr-2">{String(actionId)}</span>
            <span className="font-bold text-greyscale-800">{actionTitle}</span>
          </div>
          <div className="text-gray-800">
            <span className="text-gray-500 text-xs">链群 #</span>
            <span className="text-secondary text-base font-semibold">{groupId.toString()}</span>{' '}
            <span>{groupName || `链群 #${groupId}`}</span>
          </div>
        </div>

        {isPending ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingIcon />
            <p className="mt-4 text-sm text-gray-600">加载分配明细...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p className="text-sm">加载失败，请稍后重试</p>
            {error instanceof Error && <p className="text-xs mt-2 text-gray-500">{error.message}</p>}
          </div>
        ) : !addrs || addrs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">暂无分配明细</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-3 py-2 text-left text-xs font-medium">地址</TableHead>
                  <TableHead className="px-3 py-2 text-right text-xs font-medium">比例</TableHead>
                  <TableHead className="px-3 py-2 text-right text-xs font-medium">激励数量</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* 接收地址列表 */}
                {addrs.map((addr, index) => {
                  const basisPoint = basisPoints?.[index] || BigInt(0);
                  const amount = amounts?.[index] || BigInt(0);
                  const percentage = basisPoint ? Number(basisPoint) / 1e16 : 0; // wei 转百分比

                  return (
                    <TableRow key={`${addr}_${index}`}>
                      <TableCell className="px-3 py-2">
                        <AddressWithCopyButton address={addr} showCopyButton={true} />
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right text-sm">{formatPercentage(percentage)}</TableCell>
                      <TableCell className="px-3 py-2 text-right text-sm font-mono">
                        {formatTokenAmount(amount)}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* 服务者保留金额 */}
                {ownerAmount && ownerAmount > BigInt(0) && (
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell className="px-3 py-2">
                      <span className="text-sm text-gray-600">服务者保留</span>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right text-sm text-gray-600">-</TableCell>
                    <TableCell className="px-3 py-2 text-right text-sm font-mono">
                      {formatTokenAmount(ownerAmount)}
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
                      addrs.reduce((sum, _, idx) => sum + Number(basisPoints?.[idx] || BigInt(0)) / 1e16, 0),
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right text-sm font-mono">
                    {formatTokenAmount(totalAmount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

