'use client';

import React, { useEffect, useRef } from 'react';
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
  useBasisPointsBase,
  useMaxRecipients,
} from '@/src/hooks/extension/plugins/group-service/contracts/useLOVE20ExtensionGroupService';
import { useHandleContractError } from '@/src/lib/errorUtils';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

// Schema
const recipientSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '无效的地址格式'),
  basisPoints: z.coerce.number().min(1, '基点数必须大于0').max(10000, '基点数不能超过10000'),
});

const formSchema = z.object({
  recipients: z.array(recipientSchema),
});

type FormValues = z.infer<typeof formSchema>;

interface _GroupServiceSetRecipientsProps {
  extensionAddress: `0x${string}`;
  actionId: bigint;
  actionTitle: string;
  groupId: bigint;
  groupName: string | undefined;
  currentAddrs?: `0x${string}`[];
  currentBasisPoints?: bigint[];
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
  currentBasisPoints,
  open,
  onOpenChange,
  onSuccess,
}: _GroupServiceSetRecipientsProps) {
  // Contracts
  const { setRecipients, isPending, isConfirming, isConfirmed, writeError } = useSetRecipients(extensionAddress);
  const { basisPointsBase } = useBasisPointsBase(extensionAddress);
  const { maxRecipients } = useMaxRecipients(extensionAddress);

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
  useEffect(() => {
    if (open && currentAddrs && currentBasisPoints) {
      const initialData = currentAddrs.map((addr, index) => ({
        address: addr,
        basisPoints: Number(currentBasisPoints[index]),
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
  }, [open, currentAddrs, currentBasisPoints, form]);

  const { handleContractError } = useHandleContractError();

  useEffect(() => {
    if (writeError) {
      handleContractError(writeError, 'extension');
    }
  }, [writeError, handleContractError]);

  useEffect(() => {
    // 只有在确认成功且未调用过成功回调时才触发
    if (isConfirmed && !hasCalledSuccessRef.current) {
      hasCalledSuccessRef.current = true;
      onSuccess?.();
      onOpenChange(false);
    }
  }, [isConfirmed, onSuccess, onOpenChange]);

  const onSubmit = async (values: FormValues) => {
    const addrs = values.recipients.map((r) => r.address as `0x${string}`);
    const basisPoints = values.recipients.map((r) => BigInt(r.basisPoints));

    // Check total percentage
    const total = values.recipients.reduce((sum, r) => sum + r.basisPoints, 0);
    const base = basisPointsBase ? Number(basisPointsBase) : 10000;

    if (total > base) {
      form.setError('root', { message: `总比例不能超过 ${base / 100}% (当前: ${total / 100}%)` });
      return;
    }

    // Call contract with actionId and groupId
    await setRecipients(actionId, groupId, addrs, basisPoints);
  };

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
                    <TableHead className="w-16 px-1 sm:px-2 hidden sm:table-cell text-center">基点数</TableHead>
                    <TableHead className="w-16 px-1 sm:px-0 sm:w-16 text-center">
                      <span className="sm:hidden">基点数</span>
                      <span className="hidden sm:inline">占比</span>
                    </TableHead>
                    <TableHead className="w-10 px-1 sm:px-2"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const currentBasisPoints = form.watch(`recipients.${index}.basisPoints`);
                    return (
                      <TableRow key={field.id}>
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
                                    className="font-mono text-xs sm:text-sm h-8 px-1 sm:px-2"
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="px-1 sm:px-2 hidden sm:table-cell">
                          <FormField
                            control={form.control}
                            name={`recipients.${index}.basisPoints`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" {...field} className="h-8 px-1 sm:px-2 max-w-20" />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="px-1 sm:px-0">
                          {/* 小屏幕：显示输入框和比例 */}
                          <div className="sm:hidden space-y-1">
                            <FormField
                              control={form.control}
                              name={`recipients.${index}.basisPoints`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      placeholder="基点数"
                                      className="h-8 px-2 text-sm max-w-16"
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <div className="text-muted-foreground text-xs text-center">
                              {currentBasisPoints ? (currentBasisPoints / 100).toFixed(2) : '0.00'}%
                            </div>
                          </div>
                          {/* 大屏幕：只显示比例 */}
                          <div className="hidden sm:block text-muted-foreground text-sm">
                            {currentBasisPoints ? (currentBasisPoints / 100).toFixed(2) : '0.00'}%
                          </div>
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
                      <TableCell colSpan={4} className="text-center text-muted-foreground h-24 text-xs sm:text-sm">
                        暂无接收地址，点击下方按钮添加
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
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
              <Button type="submit" disabled={isPending || isConfirming}>
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
