'use client';

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { useSetRecipients, useRecipientsLatest, useBasisPointsBase } from '@/src/hooks/extension/plugins/group-service/contracts/useLOVE20ExtensionGroupService';
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
}

export default function _GroupServiceSetRecipients({ extensionAddress }: _GroupServiceSetRecipientsProps) {
  const { address: account } = useAccount();
  const [isOpen, setIsOpen] = useState(false);

  // Contracts
  const { setRecipients, isPending, isConfirming, isConfirmed, writeError } = useSetRecipients(extensionAddress);
  const { addrs: currentAddrs, basisPoints: currentBasisPoints } = useRecipientsLatest(extensionAddress, account as `0x${string}`);
  const { basisPointsBase } = useBasisPointsBase(extensionAddress);

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

  // Initialize form with current data
  useEffect(() => {
    if (isOpen && currentAddrs && currentBasisPoints) {
      const initialData = currentAddrs.map((addr, index) => ({
        address: addr,
        basisPoints: Number(currentBasisPoints[index]),
      }));
      form.reset({ recipients: initialData });
    } else if (isOpen) {
        // If open but no data, reset to empty (or default)
        form.reset({ recipients: [] });
    }
  }, [isOpen, currentAddrs, currentBasisPoints, form]);

  const { handleContractError } = useHandleContractError();

  useEffect(() => {
    if (writeError) {
      handleContractError(writeError, 'extension');
    }
  }, [writeError, handleContractError]);

  useEffect(() => {
    if (isConfirmed) {
      toast.success('二次分配地址设置成功');
      setIsOpen(false);
    }
  }, [isConfirmed]);

  const onSubmit = async (values: FormValues) => {
    const addrs = values.recipients.map((r) => r.address as `0x${string}`);
    const basisPoints = values.recipients.map((r) => BigInt(r.basisPoints));
    
    // Check total percentage
    const total = values.recipients.reduce((sum, r) => sum + r.basisPoints, 0);
    const base = basisPointsBase ? Number(basisPointsBase) : 10000;
    
    if (total > base) {
       form.setError('root', { message: `总比例不能超过 ${(base/100)}% (当前: ${(total/100)}%)` });
       return;
    }

    await setRecipients(addrs, basisPoints);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          <Settings className="w-4 h-4 mr-1" /> 设置地址
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>设置二次分配地址</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             {form.formState.errors.root && (
                <div className="text-red-500 text-sm p-3 bg-red-50 rounded-md border border-red-200">
                    {form.formState.errors.root.message}
                </div>
             )}
             
            <div className="border rounded-md overflow-hidden">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[50%]">地址</TableHead>
                    <TableHead className="w-[20%]">基点数 (100=1%)</TableHead>
                    <TableHead className="w-[20%]">比例</TableHead>
                    <TableHead className="w-[10%]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {fields.map((field, index) => {
                         const currentBasisPoints = form.watch(`recipients.${index}.basisPoints`);
                         return (
                        <TableRow key={field.id}>
                        <TableCell>
                            <FormField
                            control={form.control}
                            name={`recipients.${index}.address`}
                            render={({ field }) => (
                                <FormItem>
                                <FormControl>
                                    <Input placeholder="0x..." {...field} className="font-mono text-sm" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </TableCell>
                        <TableCell>
                            <FormField
                            control={form.control}
                            name={`recipients.${index}.basisPoints`}
                            render={({ field }) => (
                                <FormItem>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {currentBasisPoints ? (currentBasisPoints / 100).toFixed(2) : '0.00'}%
                        </TableCell>
                        <TableCell>
                            <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            >
                            <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                        </TableCell>
                        </TableRow>
                    )})}
                    {fields.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
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
              onClick={() => append({ address: '', basisPoints: 0 })}
            >
              <Plus className="w-4 h-4 mr-2" /> 添加地址
            </Button>

            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>取消</Button>
              <Button type="submit" disabled={isPending || isConfirming}>
                {isPending || isConfirming ? '提交中...' : '提交'}
              </Button>
            </div>
          </form>
        </Form>
        <LoadingOverlay isLoading={isPending || isConfirming} text={isPending ? "正在提交..." : "正在确认..."} />
      </DialogContent>
    </Dialog>
  );
}

