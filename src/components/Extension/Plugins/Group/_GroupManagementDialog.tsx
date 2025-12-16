// components/Extension/Plugins/Group/_GroupManagementDialog.tsx
// 链群管理操作弹窗组件 - 可复用

'use client';

// React
import React from 'react';

// Next.js
import { useRouter } from 'next/router';

// 第三方库
import { Settings } from 'lucide-react';

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
  /** 链群ID */
  groupId: bigint;
}

/**
 * 链群管理操作弹窗组件
 * 
 * 提供链群服务者的常用管理操作入口：
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
}) => {
  const router = useRouter();

  // 跳转到操作页面
  const handleNavigateToOp = (op: string) => {
    onOpenChange(false);
    router.push(`/extension/group_op?actionId=${actionId}&groupId=${groupId.toString()}&op=${op}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>链群管理</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <Button variant="outline" className="w-full justify-start" onClick={() => handleNavigateToOp('verify')}>
            <Settings className="w-4 h-4 mr-2" />
            链群打分
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => handleNavigateToOp('expand')}>
            <Settings className="w-4 h-4 mr-2" />
            追加质押
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => handleNavigateToOp('update')}>
            <Settings className="w-4 h-4 mr-2" />
            更新信息
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleNavigateToOp('set_delegated')}
          >
            <Settings className="w-4 h-4 mr-2" />
            设置打分代理
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700"
            onClick={() => handleNavigateToOp('deactivate')}
          >
            <Settings className="w-4 h-4 mr-2" />
            关闭链群
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default _GroupManagementDialog;

