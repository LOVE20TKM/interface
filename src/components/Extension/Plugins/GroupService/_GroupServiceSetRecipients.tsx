'use client';

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import {
  useSetRecipients,
  usePrecision,
  useMaxRecipients,
} from '@/src/hooks/extension/plugins/group-service/contracts/useExtensionGroupService';
import { useContractError } from '@/src/errors/useContractError';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import { isValidEthAddress, normalizeAddressInput } from '@/src/lib/addressUtils';

// Schema - 优化验证，确保类型正确
const recipientSchema = z.object({
  address: z
    .string()
    .trim() // 自动去除前后空格
    .regex(/^0x[a-fA-F0-9]{40}$/, '无效的地址格式'),
  basisPoints: z.coerce
    .number({ invalid_type_error: '百分比必须是数字' })
    .min(0, '百分比不能为负')
    .max(100, '百分比不能超过100'),
});

type FormValues = {
  recipients: Array<{
    address: string;
    basisPoints: number;
  }>;
};

interface _GroupServiceSetRecipientsProps {
  extensionAddress: `0x${string}`;
  actionId: bigint;
  actionTitle: string;
  groupId: bigint;
  groupName: string | undefined;
  currentAddrs?: `0x${string}`[];
  currentRatios?: bigint[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function _GroupServiceSetRecipients({
  extensionAddress,
  actionId,
  actionTitle,
  groupId,
  groupName,
  currentAddrs,
  currentRatios,
  open,
  onOpenChange,
  onSuccess,
}: _GroupServiceSetRecipientsProps) {
  // Contracts
  const { setRecipients, isPending, isConfirming, isConfirmed, writeError } = useSetRecipients(extensionAddress);
  const { precision } = usePrecision(extensionAddress);
  const { maxRecipients } = useMaxRecipients(extensionAddress);

  // 用户输入的是百分比，最大值是 100
  // basisPointsBase (1e18) 只在转换为 wei 时使用
  const base = 100;

  // 创建动态 schema，使用 basisPointsBase
  const formSchema = useMemo(
    () =>
      z
        .object({
          recipients: z.array(recipientSchema),
        })
        .refine(
          (data) => {
            const total = data.recipients.reduce((sum, r) => sum + (r.basisPoints || 0), 0);
            return total <= base;
          },
          {
            message: `所有地址的百分比总和不能超过 ${base}%`,
            path: ['root'],
          },
        )
        .refine(
          (data) => {
            // 检查地址是否重复（同一个行动下的同一个链群下的地址不能重复）
            const addresses = data.recipients
              .map((r) => r.address.toLowerCase())
              .filter((addr) => addr && addr.match(/^0x[a-fA-F0-9]{40}$/));
            const uniqueAddresses = new Set(addresses);
            return addresses.length === uniqueAddresses.size;
          },
          {
            message: '存在重复的地址，同一链群下每个地址只能设置一次',
            path: ['root'],
          },
        ),
    [base],
  );

  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipients: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'recipients',
  });

  // 使用 ref 追踪是否已经处理过成功回调，避免重复触发
  const hasCalledSuccessRef = useRef(false);

  // Initialize form with current data when dialog opens
  // 从合约读取的是 wei，需要转为百分比显示
  useEffect(() => {
    if (open && currentAddrs && currentRatios) {
      const initialData = currentAddrs.map((addr, index) => ({
        address: addr,
        basisPoints: Number(currentRatios[index]) / 1e16, // wei 转百分比
      }));
      form.reset({ recipients: initialData });
      // 重置成功回调标记
      hasCalledSuccessRef.current = false;
    } else if (open) {
      // If open but no data, reset to empty
      form.reset({ recipients: [] });
      // 重置成功回调标记
      hasCalledSuccessRef.current = false;
    }
  }, [open, currentAddrs, currentRatios, form]);

  const { handleError } = useContractError();

  useEffect(() => {
    if (writeError) handleError(writeError);
  }, [writeError, handleError]);

  useEffect(() => {
    // 只有在确认成功且未调用过成功回调时才触发
    if (isConfirmed && !hasCalledSuccessRef.current) {
      hasCalledSuccessRef.current = true;
      onSuccess?.();
      onOpenChange(false);
    }
  }, [isConfirmed, onSuccess, onOpenChange]);

  const onSubmit = async (values: FormValues) => {
    // 格式化和验证地址
    const normalizedAddrs: string[] = [];
    const invalidAddressIndices: number[] = [];

    values.recipients.forEach((r, index) => {
      const normalized = normalizeAddressInput(r.address);
      if (!normalized || !isValidEthAddress(normalized)) {
        invalidAddressIndices.push(index);
      } else {
        normalizedAddrs.push(normalized);
      }
    });

    // 检查是否有无效地址
    if (invalidAddressIndices.length > 0) {
      form.setError('root', { message: '存在无效的地址格式，请检查并修正所有地址（支持 0x、XE 或 TH 格式）' });
      return;
    }

    // 使用格式化后的地址
    const addrs = normalizedAddrs.map((addr) => addr as `0x${string}`);

    // 将百分比转为 wei (percentage = 20 → wei = 0.2 * 1e18)
    const ratios = values.recipients.map((r) => {
      const percentage = r.basisPoints;
      const wei = BigInt(Math.floor(percentage * 1e16)); // 1e16 = 1e18 / 100
      return wei;
    });

    // Check total percentage - 确保每个行动下，每个链群的所有待分配地址的百分比之和不能超过 100%
    const total = values.recipients.reduce((sum, r) => sum + (r.basisPoints || 0), 0);

    if (total > base) {
      form.setError('root', { message: `总比例不能超过 ${base}% (当前: ${total.toFixed(2)}%)` });
      return;
    }

    // 检查是否有重复地址
    const addressesLower = addrs.map((addr) => addr.toLowerCase());
    const uniqueAddresses = new Set(addressesLower);
    if (addressesLower.length !== uniqueAddresses.size) {
      form.setError('root', { message: '存在重复的地址，同一链群下每个地址只能设置一次' });
      return;
    }

    // 检查每个地址的百分比是否都为 0
    const zeroPercentageIndices = values.recipients
      .map((r, index) => {
        const percentage = Number(r.basisPoints);
        return percentage === 0 || isNaN(percentage) ? index : -1;
      })
      .filter((index) => index !== -1);
    if (zeroPercentageIndices.length > 0) {
      form.setError('root', { message: '每个地址的百分比不能为 0，请为所有地址设置有效的百分比' });
      return;
    }

    // Call contract with actionId and groupId
    await setRecipients(actionId, groupId, addrs, ratios);
  };

  // 实时计算总百分比（强制转换为数字类型，避免字符串拼接）
  const watchedRecipients = form.watch('recipients');
  const totalBasisPoints = watchedRecipients.reduce((sum, r) => sum + (Number(r.basisPoints) || 0), 0);
  const totalPercentage = totalBasisPoints.toFixed(2); // 用户输入的就是百分比，不需要除以 100
  const isTotalExceeded = totalBasisPoints > base; // base = 100
  const remainingBasisPoints = base - totalBasisPoints; // base = 100

  // 检测重复地址
  const getDuplicateAddresses = () => {
    const addressMap = new Map<string, number[]>();
    watchedRecipients.forEach((r, index) => {
      if (r.address && r.address.match(/^0x[a-fA-F0-9]{40}$/)) {
        const lowerAddr = r.address.toLowerCase();
        if (!addressMap.has(lowerAddr)) {
          addressMap.set(lowerAddr, []);
        }
        addressMap.get(lowerAddr)!.push(index);
      }
    });
    // 返回重复地址的索引数组
    const duplicateIndices = new Set<number>();
    addressMap.forEach((indices) => {
      if (indices.length > 1) {
        indices.forEach((idx) => duplicateIndices.add(idx));
      }
    });
    return duplicateIndices;
  };

  const duplicateAddressIndices = getDuplicateAddresses();
  const hasDuplicateAddresses = duplicateAddressIndices.size > 0;

  // 地址输入处理函数 - 在失去焦点时自动去除前后空格
  const handleAddressBlur = useCallback(
    (fieldOnChange: (value: any) => void) => (e: React.FocusEvent<HTMLInputElement>) => {
      // 失去焦点时自动去除前后空格
      const value = e.target.value;
      const trimmed = value.trim();
      if (trimmed !== value) {
        fieldOnChange(trimmed);
      }
    },
    [],
  );

  // 百分比输入处理函数 - 限制输入值在合理范围内
  const handleBasisPointsChange = useCallback(
    (fieldOnChange: (value: any) => void, maxForThisInput: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const numValue = Number(value);

      // 限制输入：不能为负数，不能超过最大值
      if (value === '' || value === '-') {
        fieldOnChange('');
      } else if (!isNaN(numValue)) {
        if (numValue < 0) {
          fieldOnChange(0);
        } else if (numValue > maxForThisInput) {
          fieldOnChange(maxForThisInput);
          toast.error(`该地址最多可分配 ${maxForThisInput.toFixed(2)}%`);
        } else {
          fieldOnChange(numValue);
        }
      }
    },
    [],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle>编辑激励分配地址</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            {form.formState.errors.root && (
              <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md border border-red-200">
                {form.formState.errors.root.message}
              </div>
            )}

            <div className="border rounded-md overflow-hidden -mx-2 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-auto px-1 sm:px-2 text-center">地址</TableHead>
                    <TableHead className="w-16 px-1 sm:px-2 text-center">百分比</TableHead>
                    <TableHead className="w-10 px-1 sm:px-2"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    // 计算当前输入框的最大值：剩余百分比 + 当前输入框的值
                    const otherBasisPointsSum = watchedRecipients.reduce(
                      (sum, r, i) => (i !== index ? sum + (Number(r.basisPoints) || 0) : sum),
                      0,
                    );
                    const maxForThisInput = base - otherBasisPointsSum; // base = 100
                    const isDuplicate = duplicateAddressIndices.has(index);

                    return (
                      <TableRow key={field.id} className={isDuplicate ? 'bg-red-50' : ''}>
                        <TableCell className="px-1 sm:px-2">
                          <FormField
                            control={form.control}
                            name={`recipients.${index}.address`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="0x..."
                                    {...field}
                                    onBlur={handleAddressBlur(field.onChange)}
                                    className={`font-mono text-xs sm:text-sm h-8 px-1 sm:px-2 ${
                                      isDuplicate ? 'border-red-500 focus-visible:ring-red-500' : ''
                                    }`}
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                                {isDuplicate && <p className="text-xs text-red-600 mt-1">该地址重复</p>}
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="px-1 sm:px-2">
                          <FormField
                            control={form.control}
                            name={`recipients.${index}.basisPoints`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative inline-block">
                                    <Input
                                      type="number"
                                      min={0}
                                      max={maxForThisInput}
                                      placeholder="0-100"
                                      {...field}
                                      onChange={handleBasisPointsChange(field.onChange, maxForThisInput)}
                                      className="h-8 px-1 sm:px-2 pr-6 max-w-20"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-xs sm:text-sm">
                                      %
                                    </span>
                                  </div>
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="px-0 sm:px-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {fields.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground h-24 text-xs sm:text-sm">
                        暂无接收地址，点击下方按钮添加
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* 显示总百分比 */}
            {fields.length > 0 && (
              <div
                className={`text-sm p-2 rounded-md border ${
                  isTotalExceeded || hasDuplicateAddresses
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>总百分比：</span>
                  <span className="font-semibold">
                    {totalPercentage}% / {base}%
                  </span>
                </div>
                {!isTotalExceeded && !hasDuplicateAddresses && remainingBasisPoints > 0 && (
                  <div className="text-xs mt-1">剩余可分配：{remainingBasisPoints.toFixed(2)}%</div>
                )}
                {isTotalExceeded && (
                  <div className="text-xs mt-1 text-red-600">警告：总比例超过 100%，请调整百分比</div>
                )}
                {hasDuplicateAddresses && (
                  <div className="text-xs mt-1 text-red-600">警告：存在重复地址，请修改或删除</div>
                )}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              disabled={isTotalExceeded || totalBasisPoints >= base}
              onClick={() => {
                // 检查是否超过最大接收者数量限制
                if (maxRecipients !== undefined && fields.length >= Number(maxRecipients)) {
                  toast.error(`激励分配地址数量不能超过最大限制 ${maxRecipients.toString()}`);
                  return;
                }
                append({ address: '', basisPoints: 0 });
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> 添加地址
            </Button>

            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isPending || isConfirming || isTotalExceeded || hasDuplicateAddresses}>
                {isPending || isConfirming ? '提交中...' : '提交'}
              </Button>
            </div>
          </form>
        </Form>
        <LoadingOverlay isLoading={isPending || isConfirming} text={isPending ? '正在提交...' : '正在确认...'} />
      </DialogContent>
    </Dialog>
  );
}
