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
import { useAccountsByGroupIdCount } from '@/src/hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupAction';
import { useDeactivateGroup, useGroupInfo } from '@/src/hooks/extension/plugins/group/contracts/useLOVE20GroupManager';

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
  } = useGroupInfo(token?.address as `0x${string}`, actionId, groupId);

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
      await deactivateGroup(token?.address as `0x${string}`, actionId, groupId);
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

  const hasParticipants = groupDetail.totalJoinedAmount > BigInt(0);

  // 检查是否在激活的同一轮次（不能在激活的同一轮次关闭）
  const isInActivationRound = activatedRound === currentRound;
  const canDeactivate = !hasParticipants && groupDetail.isActive && !isInActivationRound;

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
          <LeftTitle title="关闭链群" />
          <p className="text-sm text-gray-600 mt-2">关闭链群 #{groupId.toString()} 并取回质押代币</p>
        </div>

        {/* 警告 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-red-800 mb-1">⚠️ 重要提示</div>
              <div className="text-sm text-red-700 space-y-1">
                <div>• 关闭链群后将无法再接受新的参与者</div>
                <div>• 关闭前必须确保所有参与者已退出</div>
                <div>• 关闭后可以取回全部质押代币</div>
                <div>• 此操作不可撤销</div>
              </div>
            </div>
          </div>
        </div>

        {/* 链群状态 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">链群状态:</span>
              <span className={`font-medium ${groupDetail.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                {groupDetail.isActive ? '活跃中' : '已关闭'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">当前容量:</span>
              <span className="font-medium">
                {formatTokenAmount(groupDetail.totalJoinedAmount, 2)} / {formatTokenAmount(groupDetail.maxCapacity, 2)}{' '}
                {token?.symbol}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">参与人数:</span>
              <span className="font-medium">{accountsCount?.toString() || '0'} 人</span>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center space-x-4 pt-4">
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
        {hasParticipants && (
          <div className="text-center text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            ⚠️ 当前还有参与者，无法关闭链群。请等待所有参与者退出后再关闭。
          </div>
        )}

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

        {/* 说明 */}
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 关闭说明</div>
          <div className="space-y-1 text-gray-600">
            <div>• 只有活跃的链群才能关闭</div>
            <div>• 关闭前必须确保没有参与者</div>
            <div>• 关闭后会自动返还质押代币</div>
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
