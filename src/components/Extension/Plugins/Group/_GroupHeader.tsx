// components/Extension/Plugins/Group/_GroupHeader.tsx
// 链群头部 - 显示基本信息和操作按钮

'use client';

// React
import React, { useContext, useEffect, useState } from 'react';

// Next.js
import Link from 'next/link';
import { useRouter } from 'next/router';

// 第三方库
import { User } from 'lucide-react';
import toast from 'react-hot-toast';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import {
  useCurrentRound as useVerifyCurrentRound,
  useScoreByVerifierByActionId,
} from '@/src/hooks/contracts/useLOVE20Verify';
import { useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite';
import {
  useAccountsByGroupIdCount,
  useDelegatedVerifierByGroupId,
} from '@/src/hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupAction';

// 工具函数
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatTokenAmount } from '@/src/lib/format';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import _GroupManagementDialog from './_GroupManagementDialog';

interface GroupHeaderProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupId: bigint;
  account: `0x${string}` | undefined;
}

const _GroupHeader: React.FC<GroupHeaderProps> = ({ actionId, actionInfo, extensionAddress, groupId, account }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};

  // 管理面板弹窗状态
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);

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

  // 获取参与地址数
  const {
    count: accountsCount,
    isPending: isPendingAccountsCount,
    error: errorAccountsCount,
  } = useAccountsByGroupIdCount(extensionAddress, groupId);

  // 获取打分代理
  const {
    delegatedVerifier,
    isPending: isPendingDelegated,
    error: errorDelegated,
  } = useDelegatedVerifierByGroupId(extensionAddress, groupId);

  // 获取当前轮次（使用 Verify 合约的 round）
  const { currentRound, isPending: isPendingRound, error: errorRound } = useVerifyCurrentRound();

  // 获取我的验证票数（用于判断是否能投不信任票）
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

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorDetail) handleContractError(errorDetail, 'extension');
    if (errorAccountsCount) handleContractError(errorAccountsCount, 'extension');
    if (errorDelegated) handleContractError(errorDelegated, 'extension');
    if (errorRound) handleContractError(errorRound, 'verify');
    if (errorVerify) handleContractError(errorVerify, 'verify');
  }, [errorDetail, errorAccountsCount, errorDelegated, errorRound, errorVerify, handleContractError]);

  if (!token) {
    return <div>Token信息加载中...</div>;
  }

  // 如果数据正在加载或未找到，返回 null（让页面层处理）
  if (isPendingDetail || !groupDetail || delegatedVerifier === undefined) {
    return null;
  }

  const isOwner = account && groupDetail.owner.toLowerCase() === account.toLowerCase();
  const isDelegated =
    account &&
    delegatedVerifier !== '0x0000000000000000000000000000000000000000' &&
    delegatedVerifier.toLowerCase() === account.toLowerCase();
  const canScore = isOwner || isDelegated;
  const hasVoted = myVerifyVotes && myVerifyVotes > BigInt(0);

  // 计算剩余容量
  const remainingCapacity = groupDetail.capacity - groupDetail.totalJoinedAmount;
  const formattedTotalAmount = formatTokenAmount(groupDetail.totalJoinedAmount);
  const formattedRemainingCapacity = formatTokenAmount(remainingCapacity);

  const handleDistrustClick = () => {
    if (!hasVoted) {
      toast.error('投票给本行动的治理者，才可投不信任票');
      return;
    }
    router.push(
      `/extension/action_group_distrust?id=${actionId}&extension=${extensionAddress}&groupId=${groupId}&symbol=${token?.symbol}`,
    );
  };

  return (
    <div className="bg-gray-100 rounded-lg px-4 pt-3 pb-3 text-sm my-4">
      {/* 第一行：链群ID/name + 链群主地址 */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline">
            <span className="text-gray-500 text-sm">#</span>
            <span className="text-secondary text-xl font-semibold">{groupId.toString()}</span>
            <span className="font-semibold text-gray-800 text-lg ml-1">{groupDetail.groupName}</span>
            {!groupDetail.isActive && <span className="text-red-600 font-medium text-xs ml-2">(已关闭)</span>}
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <User className="text-greyscale-400 h-3 w-3" />
            <span className="text-greyscale-400">
              <AddressWithCopyButton address={groupDetail.owner} showCopyButton={true} />
            </span>
          </div>
        </div>
      </div>

      {/* 第二行：参与统计信息 */}
      <div className="space-y-2 text-sm text-gray-500 mb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="">总参与代币:</span>
            <span className="">{formattedTotalAmount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">总参与地址:</span>
            <span className="">{isPendingAccountsCount ? '...' : accountsCount?.toString() || '0'}</span>
          </div>
        </div>
      </div>

      {/* 第三行：操作入口链接 */}
      {account && (
        <div className="mt-4 flex justify-center gap-4">
          {/* 链群打分 - 只有链群主和打分代理显示 */}
          {canScore && (
            <Link
              className="text-secondary hover:text-secondary/80 text-sm cursor-pointer"
              href={`/extension/group_op?actionId=${actionId}&extensionAddress=${extensionAddress}&groupId=${groupId}&op=verify&symbol=${token?.symbol}`}
            >
              链群打分 &gt;&gt;
            </Link>
          )}

          {/* 管理链群 - 只有链群主显示 */}
          {isOwner && (
            <span
              className="text-secondary hover:text-secondary/80 text-sm cursor-pointer"
              onClick={() => setIsManageDialogOpen(true)}
            >
              管理链群 &gt;&gt;
            </span>
          )}

          {/* 投不信任票 - 所有人都显示 */}
          <span
            onClick={handleDistrustClick}
            className={`text-sm cursor-pointer ${
              hasVoted ? 'text-secondary hover:text-secondary/80' : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            投不信任票 &gt;&gt;
          </span>
        </div>
      )}

      {/* 管理面板弹窗 */}
      <_GroupManagementDialog
        open={isManageDialogOpen}
        onOpenChange={setIsManageDialogOpen}
        actionId={actionId}
        groupId={groupId}
      />
    </div>
  );
};

export default _GroupHeader;
