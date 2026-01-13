/**
 * 链群 NFT 转移组件
 */

'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAccount } from 'wagmi';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';

// 地址转换工具
import { normalizeAddressInput, validateAddressInput } from '@/src/lib/addressUtils';

// UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from '@/components/ui/form';

// my hooks
import { useTransferFrom } from '@/src/hooks/extension/base/contracts/useLOVE20Group';
import { useGroupNameOf } from '@/src/hooks/extension/base/contracts/useLOVE20Group';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

// 表单 Schema
const getTransferFormSchema = () =>
  z.object({
    to: z
      .string()
      .nonempty('请输入目标地址')
      .refine(
        (val) => {
          const error = validateAddressInput(val);
          return error === null;
        },
        { message: '请输入有效的地址格式（支持 0x、TH 格式）' },
      ),
  });

// 手动定义类型避免 infer 的问题
type TransferFormValues = {
  to: string;
};

interface GroupTransferProps {
  tokenId: bigint;
}

const GroupTransfer: React.FC<GroupTransferProps> = ({ tokenId }) => {
  const router = useRouter();
  const { address: account } = useAccount();
  const [addressConversionInfo, setAddressConversionInfo] = useState<string>('');
  const [convertedAddress, setConvertedAddress] = useState<`0x${string}` | null>(null);
  const [lastProcessedTxHash, setLastProcessedTxHash] = useState<string | null>(null);

  // 获取 NFT 名称
  const { groupName, isPending: isPendingGroupName, error: groupNameError } = useGroupNameOf(tokenId);

  // 表单设置
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(getTransferFormSchema()),
    defaultValues: {
      to: '',
    },
    mode: 'onChange',
  });

  // 监听地址输入变化，提供转换提示
  const watchedToAddress = form.watch('to');
  useEffect(() => {
    if (!watchedToAddress || watchedToAddress.trim() === '') {
      setAddressConversionInfo('');
      setConvertedAddress(null);
      return;
    }

    const trimmed = watchedToAddress.trim();
    const normalized = normalizeAddressInput(trimmed);

    if (!normalized) {
      setAddressConversionInfo('');
      setConvertedAddress(null);
      return;
    }

    // 如果输入的不是0x格式，显示转换后的地址
    if (!trimmed.startsWith('0x')) {
      setAddressConversionInfo('将转换为:');
      setConvertedAddress(normalized as `0x${string}`);
    } else if (trimmed.toLowerCase() !== normalized) {
      setAddressConversionInfo('地址已标准化');
      setConvertedAddress(normalized as `0x${string}`);
    } else {
      setAddressConversionInfo('');
      setConvertedAddress(null);
    }
  }, [watchedToAddress]);

  // NFT 转移
  const {
    transferFrom,
    isPending: isPendingTransfer,
    isConfirming: isConfirmingTransfer,
    isConfirmed: isConfirmedTransfer,
    writeError: errTransfer,
    hash: transferTxHash,
  } = useTransferFrom();

  const isTransferring = isPendingTransfer || isConfirmingTransfer;
  const isTransferConfirmed = isConfirmedTransfer;

  // 监听转移成功
  useEffect(() => {
    if (isTransferConfirmed && transferTxHash && transferTxHash !== lastProcessedTxHash) {
      toast.success(`转移链群NFT成功`);
      // 清空表单
      form.reset();
      // 记录已处理的交易哈希，避免重复处理
      setLastProcessedTxHash(transferTxHash);
      // 等待2秒后跳转到链群NFT管理页面
      setTimeout(() => {
        router.push('/extension/groupids');
      }, 2000);
    }
  }, [isTransferConfirmed, transferTxHash, lastProcessedTxHash, form, router]);

  // 处理转移
  const handleTransfer = form.handleSubmit(async (data) => {
    if (!account) {
      toast.error('请先连接钱包');
      return;
    }

    // 标准化地址输入，支持TH、0x等格式
    const normalizedAddress = normalizeAddressInput(data.to);
    if (!normalizedAddress) {
      toast.error('地址格式无效，请检查输入');
      return;
    }

    try {
      const toAddress = normalizedAddress as `0x${string}`;
      console.log('执行NFT转移:', { from: account, to: toAddress, tokenId });
      await transferFrom(account, toAddress, tokenId);
    } catch (error: any) {
      console.error('Transfer error:', error);
      // 错误会通过 errorUtils 处理，这里不需要额外的toast
    }
  });

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errTransfer) {
      handleContractError(errTransfer, 'group');
    }
  }, [errTransfer, handleContractError]);

  // 加载状态
  if (isPendingGroupName) {
    return (
      <div className="p-6">
        <LeftTitle title="转移链群NFT" />
        <div className="flex justify-center py-8">
          <LoadingIcon />
        </div>
      </div>
    );
  }

  if (groupNameError) {
    return (
      <div className="p-6">
        <LeftTitle title="转移链群NFT" />
        <div className="text-center text-red-500 mt-4">加载NFT信息失败: {groupNameError.message}</div>
      </div>
    );
  }

  if (!groupName) {
    return (
      <div className="p-6">
        <LeftTitle title="转移链群NFT" />
        <div className="text-center text-gray-500 mt-4">未找到NFT信息</div>
      </div>
    );
  }

  const isDisabled = !account;

  return (
    <div className="p-6">
      <LeftTitle title="转移链群NFT" />
      <div className="w-full max-w-md mx-auto mt-4">
        <Form {...form}>
          <form className="space-y-4">
            {/* NFT 名称显示 */}
            <div className="mb-4">
              <FormLabel className="text-sm font-medium text-gray-700">链群 NFT</FormLabel>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="mr-2 text-sm text-gray-500 font-mono">(ID: {tokenId.toString()})</span>
                <span className="font-medium text-gray-800">{groupName}</span>
              </div>
            </div>

            {/* 目标地址输入 */}
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">目标地址</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="请输入目标钱包地址（支持 0x、TH 格式）"
                      {...field}
                      disabled={isDisabled}
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  {addressConversionInfo && (
                    <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <span>{addressConversionInfo}</span>
                      {convertedAddress && (
                        <AddressWithCopyButton
                          address={convertedAddress}
                          showCopyButton={true}
                          showAddress={true}
                          colorClassName="text-blue-600"
                        />
                      )}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 转移按钮 */}
            <div className="flex space-x-2 pt-4">
              <Button className="w-full" onClick={handleTransfer} disabled={isTransferring || isDisabled} size="lg">
                {isTransferring ? '转移中...' : '确认转移'}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <LoadingOverlay isLoading={isTransferring} text="转移中..." />
    </div>
  );
};

export default GroupTransfer;
