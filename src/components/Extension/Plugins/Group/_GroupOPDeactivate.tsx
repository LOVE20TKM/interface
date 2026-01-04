// components/Extension/Plugins/Group/_GroupOPDeactivate.tsx
// 关闭链群操作

'use client';

// React
import React, { useContext, useEffect } from 'react';

// Next.js
import { useRouter } from 'next/router';

// 第三方库
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

// UI 组件
import { Button } from '@/components/ui/button';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
import { useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite';
import { useAccountsByGroupIdCount } from '@/src/hooks/extension/plugins/group/contracts/useGroupJoin';
import { useDeactivateGroup, useGroupInfo } from '@/src/hooks/extension/plugins/group/contracts/useGroupManager';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';
import { formatTokenAmount } from '@/src/lib/format';

// 组件
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

interface GroupOPDeactivateProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupId: bigint;
}

const _GroupOPDeactivate: React.FC<GroupOPDeactivateProps> = ({ actionId, actionInfo, extensionAddress, groupId }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};

  // 获取链群详情
  const {
    groupDetail,
    isPending: isPendingDetail,
    error: errorDetail,
  } = useExtensionGroupDetail({
    extensionAddress,
    actionId,
    groupId,
  });

  // 获取链群信息（用于获取激活轮次）
  const {
    activatedRound,
    isPending: isPendingInfo,
    error: errorInfo,
  } = useGroupInfo(extensionAddress, groupId);

  // 获取参与人数
  const {
    count: accountsCount,
    isPending: isPendingAccountsCount,
    error: errorAccountsCount,
  } = useAccountsByGroupIdCount(extensionAddress, groupId);

  // 获取当前轮次
  const { currentRound, isPending: isPendingRound, error: errorRound } = useCurrentRound();

  // 关闭链群
  const {
    deactivateGroup,
    isPending: isPendingDeactivate,
    isConfirming: isConfirmingDeactivate,
    isConfirmed: isConfirmedDeactivate,
    writeError: errorDeactivate,
  } = useDeactivateGroup();

  async function handleDeactivate() {
    if (!groupDetail) {
      toast.error('未找到链群信息');
      return;
    }

    try {
      await deactivateGroup(extensionAddress, groupId);
    } catch (error) {
      console.error('Deactivate group failed', error);
    }
  }

  useEffect(() => {
    if (isConfirmedDeactivate) {
      toast.success('链群关闭成功');
      setTimeout(() => {
        router.back();
      }, 1500);
    }
  }, [isConfirmedDeactivate, router]);

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorDetail) handleError(errorDetail);
    if (errorInfo) handleError(errorInfo);
    if (errorAccountsCount) handleError(errorAccountsCount);
    if (errorRound) handleError(errorRound);
    if (errorDeactivate) handleError(errorDeactivate);
  }, [errorDetail, errorInfo, errorAccountsCount, errorRound, errorDeactivate, handleError]);

  if (isPendingDetail || isPendingInfo || isPendingAccountsCount || isPendingRound) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载链群信息...</p>
      </div>
    );
  }

  if (!groupDetail || activatedRound === undefined) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">未找到链群信息</p>
      </div>
    );
  }

  // 检查是否在激活的同一轮次（不能在激活的同一轮次关闭）
  const isInActivationRound = activatedRound === currentRound;
  const canDeactivate = groupDetail.isActive && !isInActivationRound;

  return (
    <>
      <div className="space-y-6">
        {/* 标题 */}
        <div>
          <LeftTitle title="关闭链群" />
          <p className="text-sm text-gray-600 mt-2">
            关闭链群 <span className="text-gray-500 text-xs">#</span>
            <span className="text-secondary text-base font-semibold">{groupId.toString()}</span>
            <span className="font-semibold text-gray-800 text-sm ml-1">{groupDetail.groupName}</span> 并取回质押代币
          </p>
        </div>

        {/* 链群状态 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">链群状态:</span>
              <span className={`ftext-sm ${groupDetail.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                {groupDetail.isActive ? '活跃中' : '已关闭'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">当前容量:</span>
              <span className="text-sm">
                {formatTokenAmount(groupDetail.totalJoinedAmount, 2)} / {formatTokenAmount(groupDetail.maxCapacity, 2)}{' '}
                {token?.symbol}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">参与人数:</span>
              <span className="text-sm">{accountsCount?.toString() || '0'} 人</span>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isPendingDeactivate || isConfirmingDeactivate}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            disabled={!canDeactivate || isPendingDeactivate || isConfirmingDeactivate || isConfirmedDeactivate}
            onClick={handleDeactivate}
          >
            {isPendingDeactivate
              ? '提交中...'
              : isConfirmingDeactivate
              ? '确认中...'
              : isConfirmedDeactivate
              ? '已关闭'
              : isInActivationRound
              ? '请等待下一轮次再关闭'
              : '确认关闭'}
          </Button>
        </div>

        {/* 阻止关闭的原因 */}
        {isInActivationRound && groupDetail.isActive && (
          <div className="text-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            ⚠️ 在激活链群的同一轮次内无法关闭，请等待下一轮次再操作。
          </div>
        )}

        {!groupDetail.isActive && (
          <div className="text-center text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
            链群已关闭
          </div>
        )}

        {/* 警告 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="font-medium text-red-800 mb-1">⚠️ 重要提示</div>
              <div className="text-sm text-red-700 space-y-1">
                <div>• 链群关闭后将无法再验证，也不再有激励</div>
                <div>• 链群关闭后，新的参与者无法再加入</div>
                <div>• 链群关闭后可以取回全部质押代币</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LoadingOverlay
        isLoading={isPendingDeactivate || isConfirmingDeactivate}
        text={isPendingDeactivate ? '关闭中...' : '确认关闭...'}
      />
    </>
  );
};

export default _GroupOPDeactivate;
