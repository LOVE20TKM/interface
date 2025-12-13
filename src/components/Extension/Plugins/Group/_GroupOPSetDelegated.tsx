// components/Extension/Plugins/Group/_GroupOPSetDelegated.tsx
// 设置打分代理操作

'use client';

import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { isAddress } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { TokenContext } from '@/src/contexts/TokenContext';
import { ActionInfo } from '@/src/types/love20types';
import { useGroupInfo } from '@/src/hooks/extension/plugins/group/contracts/useLOVE20GroupManager';
import {
  useSetGroupDelegatedVerifier,
  useDelegatedVerifierByGroupId,
} from '@/src/hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupAction';
import { useHandleContractError } from '@/src/lib/errorUtils';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import LeftTitle from '@/src/components/Common/LeftTitle';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

interface GroupOPSetDelegatedProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupId: bigint;
}

const _GroupOPSetDelegated: React.FC<GroupOPSetDelegatedProps> = ({
  actionId,
  actionInfo,
  extensionAddress,
  groupId,
}) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};

  // 获取链群信息
  const { isPending: isPendingInfo, error: errorInfo } = useGroupInfo(
    token?.address as `0x${string}`,
    actionId,
    groupId,
  );

  // 获取打分代理
  const {
    delegatedVerifier,
    isPending: isPendingDelegated,
    error: errorDelegated,
  } = useDelegatedVerifierByGroupId(extensionAddress, groupId);

  // 表单验证
  const formSchema = z.object({
    delegatedVerifier: z
      .string()
      .min(1, { message: '请输入代理地址' })
      .refine((val) => isAddress(val), { message: '请输入有效的以太坊地址' }),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      delegatedVerifier: '0x0000000000000000000000000000000000000000' as `0x${string}`,
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
    setGroupDelegatedVerifier,
    isPending: isPendingSet,
    isConfirming: isConfirmingSet,
    isConfirmed: isConfirmedSet,
    writeError: errorSet,
  } = useSetGroupDelegatedVerifier(extensionAddress);

  async function handleSetDelegated(values: FormValues) {
    try {
      await setGroupDelegatedVerifier(groupId, values.delegatedVerifier as `0x${string}`);
    } catch (error) {
      console.error('Set delegated verifier failed', error);
    }
  }

  useEffect(() => {
    if (isConfirmedSet) {
      toast.success('打分代理设置成功');
      setTimeout(() => {
        router.back();
      }, 1500);
    }
  }, [isConfirmedSet, router]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorInfo) handleContractError(errorInfo, 'extension');
    if (errorDelegated) handleContractError(errorDelegated, 'extension');
    if (errorSet) handleContractError(errorSet, 'extension');
  }, [errorInfo, errorDelegated, errorSet, handleContractError]);

  if (isPendingInfo || isPendingDelegated) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载链群信息...</p>
      </div>
    );
  }

  if (delegatedVerifier === undefined) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">未找到链群信息</p>
      </div>
    );
  }

  const hasDelegated = delegatedVerifier !== '0x0000000000000000000000000000000000000000';

  return (
    <>
      <div className="space-y-6">
        {/* 返回按钮 */}
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>

        {/* 标题 */}
        <div>
          <LeftTitle title="设置打分代理" />
          <p className="text-sm text-gray-600 mt-2">为链群 #{groupId.toString()} 设置打分代理人</p>
        </div>

        {/* 当前代理信息 */}
        {hasDelegated && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-800 mb-2">当前打分代理:</div>
            <AddressWithCopyButton address={delegatedVerifier} showCopyButton={true} />
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
                  <FormLabel className="text-greyscale-500 font-normal">代理地址*</FormLabel>
                  <FormControl>
                    <Input placeholder="0x..." className="!ring-secondary-foreground" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    输入零地址 (0x0000000000000000000000000000000000000000) 可取消代理
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 按钮 */}
            <div className="flex justify-center space-x-4 pt-4">
              <Button variant="outline" onClick={() => router.back()} disabled={isPendingSet || isConfirmingSet}>
                取消
              </Button>
              <Button
                disabled={isPendingSet || isConfirmingSet || isConfirmedSet}
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
            <div>• 输入零地址可以取消代理，恢复自己打分</div>
          </div>
        </div>
      </div>

      <LoadingOverlay isLoading={isPendingSet || isConfirmingSet} text={isPendingSet ? '设置中...' : '确认设置...'} />
    </>
  );
};

export default _GroupOPSetDelegated;
