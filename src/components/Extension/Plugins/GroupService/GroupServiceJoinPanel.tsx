// components/Extension/Plugins/GroupService/GroupServiceJoinPanel.tsx
// 加入链群服务行动面板

'use client';

// React
import React, { useContext, useEffect, useMemo } from 'react';

// Next.js
import Link from 'next/link';
import { useRouter } from 'next/router';

// 第三方库
import { HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAccount } from 'wagmi';

// UI 组件
import { Button } from '@/components/ui/button';
import { CardHeader } from '@/components/ui/card';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';
import { useError } from '@/src/contexts/ErrorContext';

// hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';
import { useIsActionIdVoted } from '@/src/hooks/contracts/useLOVE20Vote';
import {
  useHasActiveGroups,
  useJoin,
  useJoinInfo,
} from '@/src/hooks/extension/plugins/group-service/contracts/useExtensionGroupService';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';

// 组件
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import LeftTitle from '@/src/components/Common/LeftTitle';

interface GroupServiceJoinPanelProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
}

const GroupServiceJoinPanel: React.FC<GroupServiceJoinPanelProps> = ({ actionId, actionInfo, extensionAddress }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();
  const { setError } = useError();

  // 获取当前轮次
  const { currentRound, isPending: isPendingCurrentRound, error: errorCurrentRound } = useCurrentRound();

  // 获取行动是否已投票
  const {
    isActionIdVoted,
    isPending: isPendingVoted,
    error: errorVoted,
  } = useIsActionIdVoted(token?.address as `0x${string}`, currentRound || BigInt(0), actionId);

  // 获取加入信息
  const {
    joinedRound,
    isPending: isPendingJoinInfo,
    error: errorJoinInfo,
  } = useJoinInfo(extensionAddress, account as `0x${string}`);

  // 检查当前地址是否有已激活链群
  const {
    hasActiveGroups,
    isPending: isPendingHasActiveGroups,
    error: errorHasActiveGroups,
  } = useHasActiveGroups(extensionAddress, account as `0x${string}`);

  // 判断是否已加入（joinedRound > 0 表示已加入）
  const isJoined = joinedRound && joinedRound > BigInt(0);

  // 是否没有激活链群（只有明确为 false 才判定没有）
  const hasNoActiveGroups = useMemo(() => hasActiveGroups === false, [hasActiveGroups]);

  // 质押入口链接（symbol 来自 TokenContext）
  const stakeHref = useMemo(() => {
    const symbol = token?.symbol ? encodeURIComponent(token.symbol) : '';
    return `/stake/stakelp/?symbol=${symbol}`;
  }, [token?.symbol]);

  // 判断是否有投票（需要等待数据加载完成）
  const hasVotes = useMemo(() => {
    if (isPendingCurrentRound || isPendingVoted) return true; // 加载中时默认允许，避免误判
    return isActionIdVoted === true;
  }, [isPendingCurrentRound, isPendingVoted, isActionIdVoted]);

  // 加入提交
  const {
    join,
    isPending: isPendingJoin,
    isConfirming: isConfirmingJoin,
    isConfirmed: isConfirmedJoin,
  } = useJoin(extensionAddress);

  async function handleJoin() {
    try {
      // 链群服务行动不需要填写验证信息，传入空数组
      await join([]);
    } catch (error) {
      console.error('Join failed', error);
    }
  }

  // 加入成功后跳转到我的页面
  useEffect(() => {
    if (isConfirmedJoin) {
      toast.success('加入链群服务行动成功');
      setTimeout(() => {
        router.push(`/my/myaction?id=${actionId.toString()}&symbol=${token?.symbol}`);
      }, 1000);
    }
  }, [isConfirmedJoin, router, actionId, token?.symbol]);

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorJoinInfo) handleError(errorJoinInfo);
    if (errorCurrentRound) handleError(errorCurrentRound);
    if (errorVoted) handleError(errorVoted);
    if (errorHasActiveGroups) handleError(errorHasActiveGroups);
  }, [errorJoinInfo, errorCurrentRound, errorVoted, errorHasActiveGroups, handleError]);

  // 检查投票状态并显示错误提示
  useEffect(() => {
    // 只在数据加载完成且未投票时设置错误
    if (!isPendingCurrentRound && !isPendingVoted && isActionIdVoted === false) {
      setError({
        name: '无法参加',
        message: '当前行动未投票，不能参加',
      });
    }
    // 注意：有投票时不操作，避免清除其他错误信息
  }, [isPendingCurrentRound, isPendingVoted, isActionIdVoted, setError]);

  if (isPendingJoinInfo) {
    return (
      <div className="flex flex-col items-center px-4 pt-6">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载行动信息...</p>
      </div>
    );
  }

  return (
    <>
      <div className="px-6 pt-6 pb-2">
        <LeftTitle title="加入链群服务行动：" />

        {/* 行动信息 */}
        <CardHeader className="mt-4 px-3 pt-2 pb-1 flex-row justify-between items-baseline">
          <div className="flex items-baseline">
            <span className="text-greyscale-400 text-sm">{`No.`}</span>
            <span className="text-secondary text-xl font-bold mr-2">{String(actionId)}</span>
            <span className="font-bold text-greyscale-800">{actionInfo.body.title}</span>
          </div>
        </CardHeader>

        {/* 已加入提示 */}
        {isJoined && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-700">
              <span className="font-medium">✓ 您已加入此链群服务行动</span>
            </div>
            <div className="text-xs text-blue-600 mt-1">加入轮次：#{joinedRound?.toString()}</div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-center pt-6">
          <Button
            className="w-full max-w-md"
            disabled={
              isJoined ||
              isPendingJoin ||
              isConfirmingJoin ||
              isConfirmedJoin ||
              !hasVotes ||
              (hasNoActiveGroups && !isPendingHasActiveGroups)
            }
            type="button"
            onClick={handleJoin}
          >
            {isPendingJoin
              ? '提交中...'
              : isConfirmingJoin
              ? '确认中...'
              : isConfirmedJoin
              ? '已加入'
              : isJoined
              ? '已加入此行动'
              : hasNoActiveGroups && !isPendingHasActiveGroups
              ? '没有激活链群，无法加入'
              : '确认加入'}
          </Button>
        </div>

        {/* 提示信息 / 帮助 */}
        {hasNoActiveGroups && !isPendingHasActiveGroups ? (
          <div className="mt-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            <div className="flex items-center gap-2 font-medium text-red-700 mb-1">
              <HelpCircle className="w-4 h-4" />
              <span>如何激活链群：</span>
            </div>
            <div className="space-y-1">
              <div>
                1. 铸造链群NFT{' '}
                <Link href="/group/groupids/" className="underline font-medium">
                  去铸造 &gt;
                </Link>
              </div>
              <div>
                2. 成为治理者{' '}
                <Link href={stakeHref} className="underline font-medium">
                  去质押获取治理票 &gt;
                </Link>
              </div>
              <div>3. 选择对应行动，在行动下激活链群</div>
            </div>
          </div>
        ) : (
          <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
            <div className="font-medium text-gray-700 mb-1">💡 小贴士</div>
            <div className="space-y-1 text-gray-600">
              <div>• 有激活链群的地址，才可参加本行动</div>
              <div>• 可在验证阶段设置激励分配地址和比例</div>
            </div>
          </div>
        )}
      </div>

      <LoadingOverlay
        isLoading={isPendingJoin || isConfirmingJoin}
        text={isPendingJoin ? '提交交易...' : '确认交易...'}
      />
    </>
  );
};

export default GroupServiceJoinPanel;
