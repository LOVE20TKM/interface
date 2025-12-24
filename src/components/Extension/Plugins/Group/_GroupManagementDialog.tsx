// components/Extension/Plugins/Group/_GroupManagementDialog.tsx
// 链群管理操作弹窗组件 - 可复用

'use client';

// React
import React from 'react';

// Next.js
import { useRouter } from 'next/router';

// 第三方库
import { CheckCircle, PlusCircle, Edit, UserCog, XCircle, Eye } from 'lucide-react';

// UI 组件
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GroupManagementDialogProps {
  /** 是否打开弹窗 */
  open: boolean;
  /** 弹窗状态变化回调 */
  onOpenChange: (open: boolean) => void;
  /** 行动ID */
  actionId: bigint;
  /** 链群NFT */
  groupId: bigint;
  /** 是否显示"查看链群"选项 */
  showViewGroup?: boolean;
}

/**
 * 链群管理操作弹窗组件
 *
 * 提供链群服务者的常用管理操作入口：
 * - 查看链群（可选）
 * - 链群打分
 * - 追加质押
 * - 更新信息
 * - 设置打分代理
 * - 关闭链群
 */
const _GroupManagementDialog: React.FC<GroupManagementDialogProps> = ({
  open,
  onOpenChange,
  actionId,
  groupId,
  showViewGroup = false,
}) => {
  const router = useRouter();

  // 跳转到操作页面
  const handleNavigateToOp = (op: string) => {
    onOpenChange(false);
    router.push(`/extension/group_op/?actionId=${actionId}&groupId=${groupId.toString()}&op=${op}`);
  };

  // 跳转到链群详情页
  const handleViewGroup = () => {
    onOpenChange(false);
    router.push(`/extension/group/?actionId=${actionId}&groupId=${groupId.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>链群管理</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          {showViewGroup && (
            <Button variant="outline" className="w-full justify-start" onClick={handleViewGroup}>
              <Eye className="w-4 h-4 mr-2" />
              查看链群
            </Button>
          )}
          <Button variant="outline" className="w-full justify-start" onClick={() => handleNavigateToOp('verify')}>
            <CheckCircle className="w-4 h-4 mr-2" />
            链群打分
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => handleNavigateToOp('update')}>
            <Edit className="w-4 h-4 mr-2" />
            更新信息
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleNavigateToOp('set_delegated')}
          >
            <UserCog className="w-4 h-4 mr-2" />
            设置打分代理
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700"
            onClick={() => handleNavigateToOp('deactivate')}
          >
            <XCircle className="w-4 h-4 mr-2" />
            关闭链群
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default _GroupManagementDialog;
