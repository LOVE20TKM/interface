// components/Extension/Plugins/Group/_GroupHeader.tsx
// 链群头部 - 显示基本信息和操作按钮

'use client';

import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TokenContext } from '@/src/contexts/TokenContext';
import { ActionInfo } from '@/src/types/love20types';
import { useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite';
import { useGroupNameOf } from '@/src/hooks/extension/base/contracts/useLOVE20Group';
import { useGroupInfo } from '@/src/hooks/extension/plugins/group/contracts/useLOVE20GroupManager';
import { useDelegatedVerifierByGroupId } from '@/src/hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupAction';
import { useScoreByVerifierByActionId } from '@/src/hooks/contracts/useLOVE20Verify';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatTokenAmount } from '@/src/lib/format';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import toast from 'react-hot-toast';

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

  // 获取链群名称
  const { groupName, isPending: isPendingName } = useGroupNameOf(groupId);

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

  // 获取链群信息（用于获取打分代理）
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

  // 获取当前轮次
  const { currentRound, isPending: isPendingRound, error: errorRound } = useCurrentRound();

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
    if (errorInfo) handleContractError(errorInfo, 'extension');
    if (errorDelegated) handleContractError(errorDelegated, 'extension');
    if (errorRound) handleContractError(errorRound, 'vote');
    if (errorVerify) handleContractError(errorVerify, 'verify');
  }, [errorDetail, errorInfo, errorDelegated, errorRound, errorVerify, handleContractError]);

  if (isPendingName || isPendingDetail || isPendingInfo || isPendingDelegated) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载链群信息...</p>
      </div>
    );
  }

  if (!groupDetail || delegatedVerifier === undefined) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">未找到链群信息</p>
      </div>
    );
  }

  const isOwner = account && groupDetail.owner.toLowerCase() === account.toLowerCase();
  const isDelegated =
    account &&
    delegatedVerifier !== '0x0000000000000000000000000000000000000000' &&
    delegatedVerifier.toLowerCase() === account.toLowerCase();
  const canScore = isOwner || isDelegated;
  const hasVoted = myVerifyVotes && myVerifyVotes > BigInt(0);
  const canDistrust = hasVoted;

  // 计算剩余容量
  const remainingCapacity = groupDetail.capacity - groupDetail.totalJoinedAmount;

  const handleDistrustClick = () => {
    if (!hasVoted) {
      toast.error('只有投票给本行动的治理者，才能投不信任票');
      return;
    }
    router.push(
      `/extension/action_group_distrust?id=${actionId}&extension=${extensionAddress}&groupId=${groupId}&symbol=${token?.symbol}`,
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* 返回按钮 */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>
      </div>

      {/* 第一行：链群ID/name + 状态 */}
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          #{groupId.toString()} {groupName}
        </h1>
        {!groupDetail.isActive && <span className="text-red-600 font-medium">已关闭</span>}
      </div>

      {/* 第二行：链群服务者地址组件, 参与地址数, 参与代币数, 还可参与代币数 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* 链群服务者 */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">链群服务者</div>
          <AddressWithCopyButton address={groupDetail.owner} showCopyButton={true} />
        </div>

        {/* 参与地址数 */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs text-gray-500 mb-1">参与地址数</div>
          <div className="text-lg font-bold text-blue-800">-</div>
        </div>

        {/* 参与代币数 */}
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-xs text-gray-500 mb-1">参与代币数</div>
          <div className="text-lg font-bold text-green-800">{formatTokenAmount(groupDetail.totalJoinedAmount, 2)}</div>
          <div className="text-xs text-green-600 mt-1">{token?.symbol}</div>
        </div>

        {/* 还可参与代币数 */}
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-xs text-gray-500 mb-1">还可参与代币数</div>
          <div className="text-lg font-bold text-purple-800">{formatTokenAmount(remainingCapacity, 2)}</div>
          <div className="text-xs text-purple-600 mt-1">{token?.symbol}</div>
        </div>
      </div>

      {/* 第三行：操作入口链接 */}
      <div className="flex flex-wrap gap-2">
        {/* 链群打分 - 只有链群主和打分代理显示 */}
        {canScore && (
          <Link
            href={`/extension/group_op?actionId=${actionId}&extensionAddress=${extensionAddress}&groupId=${groupId}&op=verify&symbol=${token?.symbol}`}
          >
            <Button variant="outline" size="sm">
              链群打分 &gt;&gt;
            </Button>
          </Link>
        )}

        {/* 管理链群 - 只有链群主显示 */}
        {isOwner && (
          <Link
            href={`/extension/group_op?actionId=${actionId}&extensionAddress=${extensionAddress}&groupId=${groupId}&symbol=${token?.symbol}`}
          >
            <Button variant="default" size="sm">
              管理链群 &gt;&gt;
            </Button>
          </Link>
        )}

        {/* 投不信任票 - 所有人都显示，但只有投过票的治理者有权限 */}
        <Button variant="outline" size="sm" onClick={handleDistrustClick} className={!canDistrust ? 'opacity-60' : ''}>
          投不信任票 &gt;&gt;
        </Button>
      </div>
    </div>
  );
};

export default _GroupHeader;
