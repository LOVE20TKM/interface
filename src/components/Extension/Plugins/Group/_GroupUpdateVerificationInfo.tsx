// components/Extension/Plugins/Group/_GroupUpdateVerificationInfo.tsx
// 第三步：填写验证信息

'use client';

import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'react-hot-toast';

// ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';

// my hooks
import { useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite';
import {
  useVerificationInfo,
  useUpdateVerificationInfo,
  useJoinInfo,
} from '@/src/hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupAction';
import { useActionInfo } from '@/src/hooks/contracts/useLOVE20Submit';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatTokenAmount } from '@/src/lib/format';

// contexts / types
import { TokenContext } from '@/src/contexts/TokenContext';
import { ActionInfo } from '@/src/types/love20types';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import LeftTitle from '@/src/components/Common/LeftTitle';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

interface GroupUpdateVerificationInfoProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupId: bigint;
}

const _GroupUpdateVerificationInfo: React.FC<GroupUpdateVerificationInfoProps> = ({
  actionId,
  actionInfo,
  extensionAddress,
  groupId,
}) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取链群详情
  const {
    groupDetail,
    isPending: isPendingDetail,
    error: errorDetail,
  } = useExtensionGroupDetail({
    extensionAddress,
    groupId,
  });

  // 获取加入信息
  const { joinedRound, amount, error: errorJoinInfo } = useJoinInfo(extensionAddress, account as `0x${string}`);

  // 获取行动详细信息（包含验证字段定义）
  const {
    actionInfo: fullActionInfo,
    isPending: isPendingActionInfo,
    error: errorActionInfo,
  } = useActionInfo(token?.address as `0x${string}`, actionId);

  // 解析验证字段
  const verificationFields = useMemo(() => {
    if (!fullActionInfo?.body?.verificationKeys) return [];

    const keys = fullActionInfo.body.verificationKeys as string[];
    const guides = (fullActionInfo.body.verificationInfoGuides as string[]) || [];

    return keys.map((key, index) => ({
      key,
      guide: guides[index] || '',
    }));
  }, [fullActionInfo]);

  // 获取已填写的验证信息
  const [existingVerificationInfo, setExistingVerificationInfo] = useState<Record<string, string>>({});
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);

  useEffect(() => {
    const loadExistingInfo = async () => {
      if (!extensionAddress || !account || verificationFields.length === 0) {
        setIsLoadingExisting(false);
        return;
      }

      try {
        const infoMap: Record<string, string> = {};

        // 这里需要遍历每个验证字段，调用 verificationInfo 获取已填写的值
        // 由于 useVerificationInfo 是单个调用，我们需要在组件外部处理
        // 为了简化，这里先设置为空，实际使用时需要批量获取

        setExistingVerificationInfo(infoMap);
      } catch (error) {
        console.error('Failed to load existing verification info:', error);
      } finally {
        setIsLoadingExisting(false);
      }
    };

    loadExistingInfo();
  }, [extensionAddress, account, verificationFields]);

  // 动态构造 zod schema
  const formSchema = useMemo(() => {
    const schemaFields: Record<string, z.ZodString> = {};

    verificationFields.forEach((field) => {
      schemaFields[field.key] = z.string().min(1, { message: `${field.key}不能为空` });
    });

    return z.object(schemaFields);
  }, [verificationFields]);

  type FormValues = z.infer<typeof formSchema>;

  // 表单实例
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: verificationFields.reduce((acc, field) => {
      acc[field.key] = existingVerificationInfo[field.key] || '';
      return acc;
    }, {} as Record<string, string>),
    mode: 'onChange',
  });

  // 当已有验证信息加载完成时，更新表单默认值
  useEffect(() => {
    if (!isLoadingExisting && Object.keys(existingVerificationInfo).length > 0) {
      verificationFields.forEach((field) => {
        if (existingVerificationInfo[field.key]) {
          form.setValue(field.key, existingVerificationInfo[field.key]);
        }
      });
    }
  }, [isLoadingExisting, existingVerificationInfo, verificationFields, form]);

  // 更新验证信息
  const {
    updateVerificationInfo,
    isPending: isPendingUpdate,
    isConfirming: isConfirmingUpdate,
    isConfirmed: isConfirmedUpdate,
    writeError: errorUpdate,
  } = useUpdateVerificationInfo(extensionAddress);

  async function handleSubmit(values: FormValues) {
    try {
      // 将表单值转换为数组，顺序与 verificationKeys 一致
      const verificationInfos = verificationFields.map((field) => values[field.key] || '');
      await updateVerificationInfo(verificationInfos);
    } catch (error) {
      console.error('Update verification info failed', error);
    }
  }

  // 提交成功后跳转
  useEffect(() => {
    if (isConfirmedUpdate) {
      toast.success('验证信息提交成功');
      setTimeout(() => {
        router.push(`/my/myaction?id=${actionId}&symbol=${token?.symbol}`);
      }, 2000);
    }
  }, [isConfirmedUpdate, router, actionId, token?.symbol]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorDetail) handleContractError(errorDetail, 'extension');
    if (errorJoinInfo) handleContractError(errorJoinInfo, 'extension');
    if (errorActionInfo) handleContractError(errorActionInfo, 'submit');
    if (errorUpdate) handleContractError(errorUpdate, 'extension');
  }, [errorDetail, errorJoinInfo, errorActionInfo, errorUpdate, handleContractError]);

  if (isPendingDetail || isPendingActionInfo || isLoadingExisting) {
    return (
      <div className="flex flex-col items-center px-4 pt-6">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载验证信息...</p>
      </div>
    );
  }

  if (!groupDetail) {
    return (
      <div className="flex flex-col items-center px-6 pt-6">
        <p className="text-red-500">链群信息加载失败</p>
      </div>
    );
  }

  // 如果没有验证字段，直接跳过
  if (verificationFields.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 pt-6">
        <LeftTitle title="完成加入" />
        <div className="text-center py-8">
          <div className="text-green-600 text-lg font-medium mb-4">✓ 加入链群成功</div>
          <p className="text-gray-600 mb-6">本行动无需填写验证信息</p>
          <Button onClick={() => router.push(`/my/myaction?id=${actionId}&symbol=${token?.symbol}`)}>
            查看我的参与
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-6 pt-6 pb-2">
        <LeftTitle title="更新验证信息" />

        {/* 行动和链群信息 */}
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">行动：</span>
            <span className="text-gray-800">
              #{actionId.toString()} {actionInfo.body.title}
            </span>
          </div>

          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">链群：</span>
            <span className="text-gray-800">
              #{groupDetail.groupId.toString()} {groupDetail.groupName}
            </span>
          </div>

          <div className="text-sm text-gray-600 flex items-center gap-2">
            <span className="font-medium">服务者：</span>
            <AddressWithCopyButton address={groupDetail.owner} showCopyButton={true} />
          </div>

          {amount && amount > BigInt(0) && (
            <div className="text-sm text-gray-600 mt-2">
              <span className="font-medium">参与代币数：</span>
              <span className="text-secondary font-medium">
                {formatTokenAmount(amount, 2)} {token?.symbol}
              </span>
            </div>
          )}
        </div>

        {/* 验证信息表单 */}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4 pt-4">
            {verificationFields.map((field) => (
              <FormField
                key={field.key}
                control={form.control}
                name={field.key}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel className="text-greyscale-500 font-normal">{field.key}：</FormLabel>
                    <FormControl>
                      {field.guide.length > 50 ? (
                        <Textarea
                          placeholder={field.guide || `请输入${field.key}`}
                          className="!ring-secondary-foreground min-h-[100px]"
                          {...formField}
                        />
                      ) : (
                        <Input
                          placeholder={field.guide || `请输入${field.key}`}
                          className="!ring-secondary-foreground"
                          {...formField}
                        />
                      )}
                    </FormControl>
                    {field.guide && <FormDescription className="text-xs">{field.guide}</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            {/* 提交按钮 */}
            <div className="flex justify-center pt-4">
              <Button
                className="w-full max-w-xs"
                disabled={isPendingUpdate || isConfirmingUpdate || isConfirmedUpdate}
                type="button"
                onClick={() => {
                  form.handleSubmit((values) => handleSubmit(values))();
                }}
              >
                {isPendingUpdate
                  ? '提交中...'
                  : isConfirmingUpdate
                  ? '确认中...'
                  : isConfirmedUpdate
                  ? '已提交'
                  : '提交'}
              </Button>
            </div>
          </form>
        </Form>

        {/* 提示信息 */}
        <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 关于验证信息</div>
          <div className="space-y-1 text-gray-600">
            <div>• 验证信息用于链群服务者验证您的行动完成情况</div>
            <div>• 填写准确的信息有助于获得更高的验证分数</div>
            <div>• 您可以随时修改验证信息</div>
          </div>
        </div>
      </div>

      <LoadingOverlay
        isLoading={isPendingUpdate || isConfirmingUpdate}
        text={isPendingUpdate ? '提交交易...' : '确认交易...'}
      />
    </>
  );
};

export default _GroupUpdateVerificationInfo;
