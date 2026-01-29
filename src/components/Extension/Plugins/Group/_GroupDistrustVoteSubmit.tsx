// components/Extension/Plugins/Group/_GroupDistrustVoteSubmit.tsx
// 投不信任票 - 第二步：提交投票

'use client';

// React
import React, { useContext, useEffect, useMemo } from 'react';

// 第三方库
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { useAccount } from 'wagmi';
import { z } from 'zod';

// UI 组件
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import {
  useCurrentRound as useVerifyCurrentRound,
  useScoreByVerifierByActionId,
} from '@/src/hooks/contracts/useLOVE20Verify';
import { useExtensionGroupInfosOfAction } from '@/src/hooks/extension/plugins/group/composite';
import { useDistrustVote } from '@/src/hooks/extension/plugins/group/contracts/useGroupVerify';
import { useDistrustVotesByVoterByGroupOwner } from '@/src/hooks/extension/plugins/group/contracts/useGroupVerify';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';
import { formatTokenAmount } from '@/src/lib/format';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

interface GroupDistrustVoteSubmitProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupOwner: `0x${string}`;
  onCancel: () => void;
  onSuccess: () => void;
}

// 投票档位选项（10% 到 100%，共10个选项）
const VOTE_OPTIONS = [
  { label: '10% 不信任票', value: 0.1 },
  { label: '20% 不信任票', value: 0.2 },
  { label: '30% 不信任票', value: 0.3 },
  { label: '40% 不信任票', value: 0.4 },
  { label: '50% 不信任票', value: 0.5 },
  { label: '60% 不信任票', value: 0.6 },
  { label: '70% 不信任票', value: 0.7 },
  { label: '80% 不信任票', value: 0.8 },
  { label: '90% 不信任票', value: 0.9 },
  { label: '100% 不信任票', value: 1.0 },
];

interface FormValues {
  ratio: number;
  reason: string;
}

const _GroupDistrustVoteSubmit: React.FC<GroupDistrustVoteSubmitProps> = ({
  actionId,
  actionInfo,
  extensionAddress,
  groupOwner,
  onCancel,
  onSuccess,
}) => {
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取当前轮次（使用 Verify 合约的 round）
  const { currentRound, isPending: isPendingRound, error: errorRound } = useVerifyCurrentRound();

  // 获取我的验证票数
  const {
    scoreByVerifierByActionId: myVerifyVotes,
    isPending: isPendingVerify,
    error: errorVerify,
  } = useScoreByVerifierByActionId(
    token?.address as `0x${string}`,
    currentRound || BigInt(0),
    account as `0x${string}`,
    actionId,
  );

  // 获取已投不信任票数
  const {
    votes: alreadyVotedAmount,
    isPending: isPendingAlreadyVoted,
    error: errorAlreadyVoted,
  } = useDistrustVotesByVoterByGroupOwner(
    extensionAddress,
    currentRound || BigInt(0),
    account as `0x${string}`,
    groupOwner,
  );

  // 计算剩余可投不信任票数
  const remainingVotes = useMemo(() => {
    // 注意：alreadyVotedAmount 可能是 0n，不能用 !alreadyVotedAmount 判断
    if (
      myVerifyVotes === undefined ||
      myVerifyVotes === null ||
      alreadyVotedAmount === undefined ||
      alreadyVotedAmount === null
    ) {
      return BigInt(0);
    }
    const remaining = myVerifyVotes - alreadyVotedAmount;
    return remaining > BigInt(0) ? remaining : BigInt(0);
  }, [myVerifyVotes, alreadyVotedAmount]);

  // 判断是否已经投完
  const hasVotedAll = useMemo(() => {
    return remainingVotes <= BigInt(100000); // 剩余 <= 100000 wei 认为已投完
  }, [remainingVotes]);

  // 计算加入轮次（验证轮次 + 1）
  const joinRound = useMemo(() => {
    return currentRound ? currentRound + BigInt(1) : undefined;
  }, [currentRound]);

  // 获取服务者管理的链群
  const {
    groups,
    isPending: isPendingGroups,
    error: errorGroups,
  } = useExtensionGroupInfosOfAction({
    extensionAddress,
    round: joinRound,
  });

  const ownerGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter((g) => g.owner.toLowerCase() === groupOwner.toLowerCase());
  }, [groups, groupOwner]);

  // 表单验证
  const formSchema = z.object({
    ratio: z.number().min(0.1).max(1.0, { message: '请选择不信任比例' }),
    reason: z.string().min(1, { message: '请输入不信任的原因' }).max(500, { message: '原因不能超过500字' }),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ratio: 0,
      reason: '',
    },
    mode: 'onChange',
  });

  const selectedRatio = form.watch('ratio');

  // 计算不信任票数（基于剩余可投票数）
  const distrustVotes = useMemo(() => {
    if (!remainingVotes || remainingVotes === BigInt(0) || selectedRatio === 0) return BigInt(0);

    // 使用 BigInt 进行精确计算，避免精度丢失
    // selectedRatio 是 0.1-1.0 的浮点数，转换为整数比例（乘以 10000 以保留 4 位小数精度）
    const ratioMultiplier = BigInt(Math.floor(selectedRatio * 10000));
    const calculatedVotes = (remainingVotes * ratioMultiplier) / BigInt(10000);

    // 确保不会超过剩余票数（安全保护）
    return calculatedVotes > remainingVotes ? remainingVotes : calculatedVotes;
  }, [remainingVotes, selectedRatio]);

  // 提交不信任投票
  const {
    distrustVote,
    isPending: isPendingVote,
    isConfirming: isConfirmingVote,
    isConfirmed: isConfirmedVote,
    writeError: errorVote,
  } = useDistrustVote();

  async function handleSubmit(values: FormValues) {
    if (!myVerifyVotes || myVerifyVotes === BigInt(0)) {
      toast.error('您没有验证票，无法投不信任票');
      return;
    }

    if (hasVotedAll) {
      toast.error('您已经投完所有不信任票');
      return;
    }

    if (distrustVotes === BigInt(0)) {
      toast.error('请选择不信任比例');
      return;
    }

    try {
      await distrustVote(extensionAddress, groupOwner, distrustVotes, values.reason);
    } catch (error) {
      console.error('Distrust vote failed', error);
    }
  }

  useEffect(() => {
    if (isConfirmedVote) {
      toast.success('不信任投票提交成功');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  }, [isConfirmedVote, onSuccess]);

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorRound) handleError(errorRound);
    if (errorVerify) handleError(errorVerify);
    if (errorGroups) handleError(errorGroups);
    if (errorAlreadyVoted) handleError(errorAlreadyVoted);
    if (errorVote) handleError(errorVote);
  }, [errorRound, errorVerify, errorGroups, errorAlreadyVoted, errorVote, handleError]);

  // 检查必要参数是否完整
  if (!token?.address || !account) {
    return (
      <div className="space-y-4">
        <LeftTitle title="对该服务者投不信任票" />
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">请先连接钱包</p>
          <Button variant="outline" onClick={onCancel}>
            返回
          </Button>
        </div>
      </div>
    );
  }

  // 检查是否加载中
  if (isPendingRound || isPendingVerify || isPendingGroups || isPendingAlreadyVoted) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载投票信息...</p>
      </div>
    );
  }

  // 检查是否有投票权限
  // 注意：myVerifyVotes 可能是 BigInt(0) 或 undefined
  // 只有明确查询成功且值为 0 时，才认为没有投票权限
  if (myVerifyVotes === BigInt(0)) {
    console.warn('⚠️ 没有投票权限，myVerifyVotes 为 0');
    return (
      <div className="space-y-4">
        <LeftTitle title="对该服务者投不信任票" />
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">您没有投票权限</p>
          <p className="text-sm text-gray-600 mb-6">只有给本行动投过验证票的治理者才能投不信任票</p>
          <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <div>调试信息：</div>
            <div>Token: {token?.address}</div>
            <div>Round: {currentRound?.toString()}</div>
            <div>Account: {account}</div>
            <div>ActionId: {actionId.toString()}</div>
            <div>MyVerifyVotes: {myVerifyVotes?.toString()}</div>
          </div>
          <Button variant="outline" onClick={onCancel} className="mt-4">
            返回
          </Button>
        </div>
      </div>
    );
  }

  // 检查是否已经投完所有票
  if (hasVotedAll) {
    console.warn('⚠️ 已投完所有不信任票');
    return (
      <div className="space-y-4">
        <LeftTitle title="对该服务者投不信任票" />
        <div className="text-center py-12">
          <p className="text-amber-600 mb-4">您已投完所有不信任票</p>
          <p className="text-sm text-gray-600 mb-6">您对该服务者的不信任票已全部投出</p>
          <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <div>总验证票数: {formatTokenAmount(myVerifyVotes)}</div>
            <div>已投不信任票: {formatTokenAmount(alreadyVotedAmount || BigInt(0))}</div>
            <div>剩余票数: {formatTokenAmount(remainingVotes)}</div>
          </div>
          <Button variant="outline" onClick={onCancel} className="mt-4">
            返回
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <LeftTitle title="对该服务者投不信任票" />

        {/* 服务者信息 */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">服务者：</span>
            <AddressWithCopyButton address={groupOwner} />
          </div>

          {/* 管理的链群列表 */}
          {ownerGroups.length > 0 && (
            <div className="mt-3 text-sm text-gray-600">
              <span className="font-medium">链群：</span>
              {ownerGroups.map((group, idx) => (
                <span key={group.groupId.toString()}>
                  <span className="text-gray-500 text-xs">#</span>
                  <span className="font-semibold ">{group.groupId.toString()}</span>{' '}
                  <span className="font-semibold text-gray-800">{group.groupName}</span>
                  {idx < ownerGroups.length - 1 && ', '}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 我的验证票信息 */}
        {myVerifyVotes !== remainingVotes && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <div className="space-y-1">
              {/* <div>
              <span className="text-gray-600">您对本行动的验证票: </span>
              <span className="font-medium text-blue-800">{formatTokenAmount(myVerifyVotes)}</span>
            </div> */}
              <>
                <div>
                  <span className="text-gray-600">已投不信任票: </span>
                  <span className="font-medium text-amber-700">
                    {formatTokenAmount(alreadyVotedAmount || BigInt(0))}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">剩余可投票数: </span>
                  <span className="font-medium text-green-700">{formatTokenAmount(remainingVotes)}</span>
                </div>
              </>
            </div>
          </div>
        )}

        {/* 投票表单 */}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* 投票档位选择 */}
            <FormField
              control={form.control}
              name="ratio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-greyscale-500 font-normal">选择不信任比例：</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Select
                        value={field.value > 0 ? field.value.toString() : ''}
                        onValueChange={(val) => {
                          field.onChange(parseFloat(val));
                        }}
                      >
                        <SelectTrigger className="!ring-secondary-foreground">
                          <SelectValue placeholder="请选择不信任比例" />
                        </SelectTrigger>
                        <SelectContent>
                          {VOTE_OPTIONS.map((option) => (
                            <SelectItem key={option.value.toString()} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {field.value > 0 && (
                        <div className="text-sm text-gray-600 mt-1">
                          将投 {formatTokenAmount(BigInt(Number(remainingVotes) * field.value))} 不信任票
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 不信任原因 */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-greyscale-500 font-normal">不信任原因：</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请详细说明不信任该服务者的原因..."
                      className="!ring-secondary-foreground min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 按钮 */}
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                className="w-1/2"
                onClick={onCancel}
                disabled={isPendingVote || isConfirmingVote}
              >
                取消
              </Button>
              <Button
                disabled={isPendingVote || isConfirmingVote || isConfirmedVote || hasVotedAll}
                type="button"
                className="w-1/2"
                onClick={() => {
                  form.handleSubmit((values) => handleSubmit(values))();
                }}
              >
                {isPendingVote ? '提交中...' : isConfirmingVote ? '确认中...' : isConfirmedVote ? '已提交' : '提交'}
              </Button>
            </div>
          </form>
        </Form>

        {/* 说明 */}
        <div className="mt-6 text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          <div className="font-medium text-amber-800 mb-1">⚠️ 小贴士</div>
          <div className="space-y-1 text-amber-700">
            <div>• 不信任投票会降低该服务者管理的所有链群的激励</div>
          </div>
        </div>
      </div>

      <LoadingOverlay
        isLoading={isPendingVote || isConfirmingVote}
        text={isPendingVote ? '提交投票...' : '确认投票...'}
      />
    </>
  );
};

export default _GroupDistrustVoteSubmit;
