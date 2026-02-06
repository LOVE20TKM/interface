// components/Extension/Plugins/Group/_GroupJoinSelect.tsx
// 第一步：输入要加入的链群名称

'use client';

// React
import React, { useContext, useEffect, useState } from 'react';

// Next.js
import { useRouter } from 'next/router';

// 第三方库
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// UI 组件
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';
import { useTokenIdOf, useGroupNameOf } from '@/src/hooks/extension/base/contracts/useLOVE20Group';
import { useExtensionGroupInfosOfAction } from '@/src/hooks/extension/plugins/group/composite';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';
import { LocalCache } from '@/src/lib/LocalCache';

// 组件
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

interface FormValues {
  groupName: string;
}

interface GroupJoinSelectProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
}

const _GroupJoinSelect: React.FC<GroupJoinSelectProps> = ({ actionId, actionInfo, extensionAddress }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};

  // 获取当前加入轮次
  const { currentRound } = useCurrentRound();

  // 获取行动的所有活跃链群列表
  const {
    groups,
    isPending: isPendingGroups,
    error: errorGroups,
  } = useExtensionGroupInfosOfAction({
    extensionAddress,
    round: currentRound,
  });

  // 读取缓存的 groupId（加入时设置）
  const cachedGroupIdStr = LocalCache.get<string>(`joined_group_id`);
  const cachedGroupId = cachedGroupIdStr ? BigInt(cachedGroupIdStr) : null;

  // 如果有缓存的 groupId，获取对应的 groupName
  const { groupName: cachedGroupName, isPending: isPendingCachedGroupName } = useGroupNameOf(
    cachedGroupId || BigInt(0),
  );

  // 用户输入的链群名称
  const [inputGroupName, setInputGroupName] = useState<string>('');

  // 查询输入的链群名称对应的 groupId
  const { tokenId: groupId, isPending: isPendingGroupId, error: errorGroupId } = useTokenIdOf(inputGroupName);

  // 表单验证 schema（基础验证）
  const formSchema = z.object({
    groupName: z.string().min(1, { message: '请输入链群名称' }),
  });

  // 表单实例
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupName: '',
    },
    mode: 'onChange',
  });

  // 如果有缓存的 groupName，设置为表单默认值
  useEffect(() => {
    if (cachedGroupName && !isPendingCachedGroupName) {
      form.setValue('groupName', cachedGroupName);
    }
  }, [cachedGroupName, isPendingCachedGroupName, form]);

  // 监听表单输入，更新查询状态
  const watchedGroupName = form.watch('groupName');
  useEffect(() => {
    // 延迟查询，避免频繁请求
    const timer = setTimeout(() => {
      setInputGroupName(watchedGroupName.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [watchedGroupName]);

  // 验证链群是否有效
  const [validationError, setValidationError] = useState<string>('');
  useEffect(() => {
    // 如果输入为空或正在查询，清空错误
    if (!inputGroupName || isPendingGroupId) {
      setValidationError('');
      return;
    }

    // 如果查询出错
    if (errorGroupId) {
      setValidationError('查询链群信息失败');
      return;
    }

    // 如果 groupId 为 0，说明链群不存在
    if (!groupId || groupId === BigInt(0)) {
      setValidationError('链群名称不存在或未激活');
      return;
    }

    // 检查该链群是否在行动的活跃链群列表中
    const isInActionGroups = groups?.some((g) => g.groupId === groupId);
    if (!isInActionGroups) {
      setValidationError('该链群不在此行动的可用链群列表中');
      return;
    }

    // 验证通过
    setValidationError('');
  }, [inputGroupName, groupId, isPendingGroupId, errorGroupId, groups]);

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorGroups) {
      handleError(errorGroups);
    }
  }, [errorGroups, handleError]);

  // 处理表单提交
  const handleSubmit = (values: FormValues) => {
    if (!groupId || groupId === BigInt(0)) {
      return;
    }

    // 跳转到第二步
    router.push(
      `/acting/join?tab=join&groupId=${groupId.toString()}&id=${actionId.toString()}&symbol=${token?.symbol}`,
    );
  };

  if (isPendingGroups) {
    return (
      <div className="flex flex-col items-center px-4 pt-6">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载链群列表...</p>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 pt-6">
        <LeftTitle title="还没有已激活的链群" />
        <div className="text-center py-8 text-gray-500">
          <p>链群行动，需要先激活链群，才能加入行动</p>
          <div className="mt-4 flex justify-center">
            <Link href={`/extension/group_op?actionId=${actionId.toString()}&op=activate`}>
              <Button className="text-secondary border-secondary" variant="outline">
                去激活链群 &gt;&gt;
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-6 pb-2">
      <LeftTitle title="输入要加入的链群" />

      {/* 行动信息
      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-600 mb-2">
          <span className="font-medium">行动：</span>
          <span className="text-gray-800">
            #{actionId.toString()} {actionInfo.body.title}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          此行动有 <span className="text-secondary font-medium">{groups.length}</span> 个可用链群
        </div>
      </div> */}

      {/* 表单 */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
          {/* 链群名称输入框 */}
          <FormField
            control={form.control}
            name="groupName"
            render={({ field }) => (
              <FormItem>
                {/* <FormLabel className="text-greyscale-500 font-normal">链群名称：</FormLabel> */}
                <FormControl>
                  <Input placeholder="请输入链群名称" className="!ring-secondary-foreground" {...field} />
                </FormControl>
                <FormMessage />
                {isPendingGroupId && inputGroupName && <div className="text-xs text-gray-500">验证链群中...</div>}
                {validationError && !isPendingGroupId && <div className="text-xs text-red-500">{validationError}</div>}
                {!isPendingGroupId && !validationError && groupId && groupId > BigInt(0) && (
                  <div className="text-xs text-green-600">✓ 链群验证通过</div>
                )}
              </FormItem>
            )}
          />

          {/* 提交按钮 */}
          <div className="flex justify-center pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={
                !form.formState.isValid || isPendingGroupId || !!validationError || !groupId || groupId === BigInt(0)
              }
            >
              下一步
            </Button>
          </div>
        </form>
      </Form>

      {/* 提示信息 */}
      <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
        <div className="font-medium text-gray-700 mb-1">💡 小贴士</div>
        <div className="space-y-1 text-gray-600">
          <div>如不知道链群名称，可询问链群服务者或周围朋友</div>
        </div>
      </div>
    </div>
  );
};

export default _GroupJoinSelect;
