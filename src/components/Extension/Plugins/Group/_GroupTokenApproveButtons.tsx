// components/Extension/Plugins/Group/_GroupTokenApproveButtons.tsx
// 授权和执行双按钮组 - 共用组件

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface GroupTokenApproveButtonsProps {
  tokenSymbol?: string;
  isTokenApproved: boolean;
  isPendingApprove: boolean;
  isConfirmingApprove: boolean;
  onApprove: () => void;
  isPendingAction: boolean;
  isConfirmingAction: boolean;
  isConfirmedAction: boolean;
  onAction: () => void;
  actionLabel: string; // 操作标签，如"激活链群"、"追加质押"
  actionLabelPending?: string; // 操作中的标签
  actionLabelConfirming?: string; // 确认中的标签
  actionLabelConfirmed?: string; // 已完成的标签
  disableAction?: boolean; // 额外的禁用条件
}

const _GroupTokenApproveButtons: React.FC<GroupTokenApproveButtonsProps> = ({
  tokenSymbol = '',
  isTokenApproved,
  isPendingApprove,
  isConfirmingApprove,
  onApprove,
  isPendingAction,
  isConfirmingAction,
  isConfirmedAction,
  onAction,
  actionLabel,
  actionLabelPending,
  actionLabelConfirming,
  actionLabelConfirmed,
  disableAction = false,
}) => {
  return (
    <div className="flex justify-center space-x-4 pt-4">
      <Button
        className="w-1/2"
        disabled={isPendingApprove || isConfirmingApprove || isTokenApproved}
        type="button"
        onClick={onApprove}
      >
        {isTokenApproved ? `1.${tokenSymbol}已授权` : `1.授权${tokenSymbol}`}
      </Button>
      <Button
        className="w-1/2"
        disabled={!isTokenApproved || isPendingAction || isConfirmingAction || isConfirmedAction || disableAction}
        type="button"
        onClick={onAction}
      >
        {isPendingAction
          ? actionLabelPending || '2.提交中...'
          : isConfirmingAction
          ? actionLabelConfirming || '2.确认中...'
          : isConfirmedAction
          ? actionLabelConfirmed || '2.已完成'
          : `2.${actionLabel}`}
      </Button>
    </div>
  );
};

export default _GroupTokenApproveButtons;

