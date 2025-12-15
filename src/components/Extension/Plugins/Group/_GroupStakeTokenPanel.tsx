// components/Extension/Plugins/Group/_GroupStakeTokenPanel.tsx
// 质押代币输入面板 - 共用组件

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { formatTokenAmount } from '@/src/lib/format';
import { UseFormReturn } from 'react-hook-form';

interface GroupStakeTokenPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  fieldName: string;
  label: string;
  placeholder?: string;
  tokenSymbol?: string;
  userBalance?: bigint;
  minAmount?: bigint;
  maxAmount?: bigint;
  additionalInfo?: React.ReactNode; // 额外的信息展示（如对应容量）
  onSetMax?: () => void;
  showRange?: boolean; // 是否显示范围
}

const _GroupStakeTokenPanel: React.FC<GroupStakeTokenPanelProps> = ({
  form,
  fieldName,
  label,
  placeholder = '请输入代币数量',
  tokenSymbol = '',
  userBalance,
  minAmount,
  maxAmount,
  additionalInfo,
  onSetMax,
  showRange = false,
}) => {
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {showRange && minAmount !== undefined && maxAmount !== undefined && (
              <span className="font-normal">
                {' '}
                (范围：{formatTokenAmount(minAmount, 4, 'ceil')} ~ {formatTokenAmount(maxAmount)})
              </span>
            )}
          </FormLabel>
          <FormControl>
            <Input placeholder={placeholder} className="!ring-secondary-foreground" {...field} />
          </FormControl>
          <FormMessage />
          {additionalInfo}
          <FormDescription className="flex items-center gap-2 text-xs">
            <span>
              余额：<span className="text-secondary">{formatTokenAmount(userBalance || BigInt(0))}</span> {tokenSymbol}
            </span>
            {onSetMax && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={onSetMax}
                className="text-secondary p-0 h-auto"
                disabled={!userBalance || userBalance <= BigInt(0)}
              >
                最高
              </Button>
            )}
          </FormDescription>
        </FormItem>
      )}
    />
  );
};

export default _GroupStakeTokenPanel;

