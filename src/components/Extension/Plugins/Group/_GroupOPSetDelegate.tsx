// components/Extension/Plugins/Group/_GroupOPSetDelegate.tsx
// 设置打分代理操作

'use client';

// React
import React, { useContext, useEffect } from 'react';

// Next.js
import { useRouter } from 'next/router';

// 第三方库
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { isAddress } from 'viem';
import { z } from 'zod';

// UI 组件
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import {
  useDelegateByGroupId,
  useSetGroupDelegate,
} from '@/src/hooks/extension/plugins/group/contracts/useGroupVerify';
import { useGroupInfo } from '@/src/hooks/extension/plugins/group/contracts/useGroupManager';

// 工具函数

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

interface GroupOPSetDelegatedProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupId: bigint;
}

const _GroupOPSetDelegate: React.FC<GroupOPSetDelegatedProps> = ({
  actionId,
  actionInfo,
  extensionAddress,
  groupId,
}) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};

  // 获取链群信息
  const { isPending: isPendingInfo, error: errorInfo } = useGroupInfo(
    extensionAddress,
    groupId,
  );

  // 获取打分代理
  const {
    delegatedVerifier,
    isPending: isPendingDelegated,
    error: errorDelegated,
  } = useDelegateByGroupId(extensionAddress, groupId);

  // 表单验证：允许空值，空值表示取消代理
  const formSchema = z.object({
    delegatedVerifier: z.string().refine(
      (val) => {
        if (!val || val.trim() === '') return true; // 空值合法，表示取消代理
        return isAddress(val);
      },
      { message: '请输入有效的以太坊地址' },
    ),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      delegatedVerifier: '',
    },
    mode: 'onChange',
  });

  // 当链群信息加载完成后，填充表单
  useEffect(() => {
    if (delegatedVerifier && delegatedVerifier !== '0x0000000000000000000000000000000000000000') {
      form.reset({
        delegatedVerifier: delegatedVerifier,
      });
    }
  }, [delegatedVerifier, form]);

  // 设置打分代理
  const {
    setGroupDelegate,
    isPending: isPendingSet,
    isConfirming: isConfirmingSet,
    isConfirmed: isConfirmedSet,
  } = useSetGroupDelegate();

  async function handleSetDelegated(values: FormValues) {
    // 如果输入为空，使用零地址（取消代理）
    const address = values.delegatedVerifier?.trim() || '0x0000000000000000000000000000000000000000';

    try {
      await setGroupDelegate(extensionAddress, groupId, address as `0x${string}`);
    } catch (error) {
      console.error('Set delegate failed', error);
    }
  }

  // 快速取消代理
  async function handleCancelDelegated() {
    try {
      await setGroupDelegate(
        extensionAddress,
        groupId,
        '0x0000000000000000000000000000000000000000' as `0x${string}`,
      );
    } catch (error) {
      console.error('Cancel delegate failed', error);
    }
  }

  useEffect(() => {
    if (isConfirmedSet) {
      const message = form.getValues('delegatedVerifier')?.trim() ? '打分代理设置成功' : '打分代理已取消';
      toast.success(message);
      setTimeout(() => {
        router.push(`/extension/group/?groupId=${groupId}&actionId=${actionId}&symbol=${token?.symbol}`);
      }, 1500);
    }
  }, [isConfirmedSet, router, form]);

  // 错误处理

  if (isPendingInfo || isPendingDelegated) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载参数中...</p>
      </div>
    );
  }

  if (delegatedVerifier === undefined) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">未找到扩展参数</p>
      </div>
    );
  }

  const hasDelegated = delegatedVerifier !== '0x0000000000000000000000000000000000000000';

  return (
    <>
      <div className="space-y-6">
        <div>
          <LeftTitle title="设置打分代理" />
        </div>

        {/* 当前代理信息 */}
        {hasDelegated && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-800 mb-2">当前打分代理:</div>
            <div className="flex items-center gap-3">
              <AddressWithCopyButton address={delegatedVerifier} showCopyButton={true} />
              <button
                type="button"
                onClick={handleCancelDelegated}
                disabled={isPendingSet || isConfirmingSet || isConfirmedSet}
                className="text-sm text-blue-600 hover:text-blue-800 underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
              >
                取消代理
              </button>
            </div>
          </div>
        )}

        {/* 表单 */}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* 代理地址 */}
            <FormField
              control={form.control}
              name="delegatedVerifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>代理地址</FormLabel>
                  <FormControl>
                    <Input placeholder="输入代理打分地址" className="!ring-secondary-foreground" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs"></FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 按钮 */}
            <div className="flex justify-center gap-3 pt-4">
              <Button
                disabled={isPendingSet || isConfirmingSet || isConfirmedSet}
                className="w-full max-w-xs"
                type="button"
                onClick={() => {
                  form.handleSubmit((values) => handleSetDelegated(values))();
                }}
              >
                {isPendingSet ? '提交中...' : isConfirmingSet ? '确认中...' : isConfirmedSet ? '已设置' : '确认设置'}
              </Button>
            </div>
          </form>
        </Form>

        {/* 说明 */}
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 打分代理说明</div>
          <div className="space-y-1 text-gray-600">
            <div>• 打分代理可以代替您对链群进行验证打分</div>
            <div>• 代理人不需要是链群所有者</div>
            <div>• 可以随时更换或取消代理</div>
          </div>
        </div>
      </div>

      <LoadingOverlay isLoading={isPendingSet || isConfirmingSet} text={isPendingSet ? '设置中...' : '确认设置...'} />
    </>
  );
};

export default _GroupOPSetDelegate;
