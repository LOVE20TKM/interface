// components/Extension/Plugins/GroupService/GroupServiceJoinPanel.tsx
// 加入链群服务行动面板

'use client';

// React
import React, { useContext, useEffect } from 'react';

// Next.js
import { useRouter } from 'next/router';

// 第三方库
import { toast } from 'react-hot-toast';
import { useAccount } from 'wagmi';

// UI 组件
import { Button } from '@/components/ui/button';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import {
  useJoin,
  useJoinInfo,
} from '@/src/hooks/extension/plugins/group-service/contracts/useLOVE20ExtensionGroupService';

// 工具函数
import { useHandleContractError } from '@/src/lib/errorUtils';

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

  // 获取加入信息
  const {
    joinedRound,
    isPending: isPendingJoinInfo,
    error: errorJoinInfo,
  } = useJoinInfo(extensionAddress, account as `0x${string}`);

  // 判断是否已加入（joinedRound > 0 表示已加入）
  const isJoined = joinedRound && joinedRound > BigInt(0);

  // 加入提交
  const {
    join,
    isPending: isPendingJoin,
    isConfirming: isConfirmingJoin,
    isConfirmed: isConfirmedJoin,
    writeError: errorJoin,
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
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorJoinInfo) handleContractError(errorJoinInfo, 'extension');
    if (errorJoin) handleContractError(errorJoin, 'extension');
  }, [errorJoinInfo, errorJoin, handleContractError]);

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
        <LeftTitle title="加入链群服务行动" />

        {/* 行动信息 */}
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600">
            <span className="font-medium">行动：</span>
            <span className="text-gray-800">
              #{actionId.toString()} {actionInfo.body.title}
            </span>
          </div>
        </div>

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
            disabled={isJoined || isPendingJoin || isConfirmingJoin || isConfirmedJoin}
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
              : '确认加入'}
          </Button>
        </div>

        {/* 提示信息 */}
        <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 关于链群服务行动</div>
          <div className="space-y-1 text-gray-600">
            <div>• 链群服务行动用于激励链群服务者</div>
            <div>• 服务者在链群行动中激活链群并服务参与者</div>
            <div>• 激励将根据服务的所有行动的链群铸币激励自动计算</div>
            <div>• 可在验证阶段设置激励分配地址和比例</div>
          </div>
        </div>
      </div>

      <LoadingOverlay
        isLoading={isPendingJoin || isConfirmingJoin}
        text={isPendingJoin ? '提交交易...' : '确认交易...'}
      />
    </>
  );
};

export default GroupServiceJoinPanel;
