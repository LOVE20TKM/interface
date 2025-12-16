// components/Extension/Plugins/Group/GroupMyParticipation.tsx
// 我的链群参与详情组件

'use client';

// React
import React, { useContext, useEffect } from 'react';

// Next.js
import Link from 'next/link';
import { useRouter } from 'next/router';

// 第三方库
import { ChevronRight, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAccount } from 'wagmi';

// UI 组件
import { Button } from '@/components/ui/button';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
import { useAccountVerificationInfos } from '@/src/hooks/extension/base/composite';
import { useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite';
import {
  useExit,
  useJoinInfo,
  useTotalJoinedAmountByRound,
} from '@/src/hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupAction';

// 工具函数
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatPercentage, formatTokenAmount } from '@/src/lib/format';
import { LinkIfUrl } from '@/src/lib/stringUtils';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

interface GroupMyParticipationProps {
  actionId: bigint;
  actionInfo: ActionInfo | undefined;
  extensionAddress: `0x${string}`;
}

const GroupMyParticipation: React.FC<GroupMyParticipationProps> = ({ actionId, actionInfo, extensionAddress }) => {
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const router = useRouter();

  // 获取当前轮次
  const { currentRound, isPending: isPendingRound, error: errorRound } = useCurrentRound();

  // 获取加入信息
  const {
    joinedRound,
    amount: joinedAmount,
    groupId,
    isPending: isPendingJoinInfo,
    error: errorJoinInfo,
  } = useJoinInfo(extensionAddress, account as `0x${string}`);

  // 获取链群详情
  const {
    groupDetail,
    isPending: isPendingDetail,
    error: errorDetail,
  } = useExtensionGroupDetail({
    extensionAddress,
    actionId,
    groupId: groupId || BigInt(0),
  });

  // 获取当前轮次的总参与量（用于计算仓位）
  const {
    totalJoinedAmount: currentRoundTotalAmount,
    isPending: isPendingTotalAmount,
    error: errorTotalAmount,
  } = useTotalJoinedAmountByRound(extensionAddress, currentRound || BigInt(0));

  // 获取验证信息
  const verificationKeys = actionInfo?.body?.verificationKeys as string[] | undefined;
  const {
    verificationInfos,
    isPending: isPendingVerificationInfos,
    error: errorVerificationInfos,
  } = useAccountVerificationInfos({
    tokenAddress: token?.address as `0x${string}`,
    actionId,
    account: account as `0x${string}`,
    verificationKeys,
  });

  // 计算是否已加入
  const isJoined = joinedAmount && joinedAmount > BigInt(0);

  // 计算还可以追加的代币数（考虑链群剩余容量）
  // additionalAllowed = min(actualMaxJoinAmount - joinedAmount, remainingCapacity)
  const additionalAllowed =
    groupDetail && joinedAmount
      ? (() => {
          const maxByLimit = groupDetail.actualMaxJoinAmount - joinedAmount;
          const maxByCapacity = groupDetail.remainingCapacity;
          return maxByLimit < maxByCapacity ? maxByLimit : maxByCapacity;
        })()
      : BigInt(0);

  // 计算仓位百分比（我的参与 / (我的参与 + 还可追加)）
  const positionRatio =
    groupDetail && joinedAmount && additionalAllowed !== undefined
      ? (() => {
          const totalPossible = joinedAmount + additionalAllowed;
          return totalPossible > BigInt(0) ? Number(joinedAmount) / Number(totalPossible) : 0;
        })()
      : 0;

  // 退出
  const {
    exit,
    isPending: isPendingExit,
    isConfirming: isConfirmingExit,
    isConfirmed: isConfirmedExit,
    writeError: errorExit,
  } = useExit(extensionAddress);

  const handleExit = async () => {
    if (!joinedAmount || joinedAmount <= BigInt(0)) {
      toast.error('您还没有参与，无需退出');
      return;
    }
    await exit();
  };

  useEffect(() => {
    if (isConfirmedExit) {
      toast.success('取回代币成功');
      router.push('/my');
    }
  }, [isConfirmedExit, router]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorRound) handleContractError(errorRound, 'vote');
    if (errorJoinInfo) handleContractError(errorJoinInfo, 'extension');
    if (errorDetail) handleContractError(errorDetail, 'extension');
    if (errorTotalAmount) handleContractError(errorTotalAmount, 'extension');
    if (errorExit) handleContractError(errorExit, 'extension');
    if (errorVerificationInfos) handleContractError(errorVerificationInfos, 'extension');
  }, [
    errorRound,
    errorJoinInfo,
    errorDetail,
    errorTotalAmount,
    errorExit,
    errorVerificationInfos,
    handleContractError,
  ]);

  if (isPendingRound || isPendingJoinInfo || isPendingDetail || isPendingTotalAmount) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="text-center">
          <LoadingIcon />
          <p className="mt-4 text-gray-600">加载数据中...</p>
        </div>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="flex flex-col items-center pt-8">
        <p className="text-gray-600 mb-6">您还没有参与此链群行动</p>
        <Button variant="outline" className="text-secondary border-secondary" asChild>
          <Link href={`/acting/join?id=${actionId}&symbol=${token?.symbol}`}>加入链群参与</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-1">
      {/* 数据区 */}
      <div className="stats w-full grid grid-cols-2 divide-x-0 gap-4 mb-6">
        {/* 我的参与 */}
        <div className="stat place-items-center flex flex-col justify-center">
          <div className="stat-title">我的参与</div>
          <div className="stat-value text-2xl text-secondary">{formatTokenAmount(joinedAmount || BigInt(0), 2)}</div>
          <div className="stat-desc text-sm mt-2 whitespace-normal break-words text-center">
            占链群{' '}
            {groupDetail?.totalJoinedAmount && groupDetail.totalJoinedAmount > BigInt(0)
              ? formatPercentage((Number(joinedAmount || BigInt(0)) * 100) / Number(groupDetail.totalJoinedAmount))
              : '0.00%'}
          </div>
        </div>

        {/* 仓位 */}
        <div className="stat place-items-center flex flex-col justify-center">
          <div className="stat-title">还可追加</div>
          <div className="stat-value text-2xl text-secondary">{formatTokenAmount(additionalAllowed)}</div>
          <div className="stat-desc text-sm mt-2 whitespace-normal break-words text-center">{token?.symbol}</div>
        </div>
      </div>

      {/* 所属链群 */}
      {groupDetail && (
        <div className="w-full mb-6">
          <div className="text-sm text-gray-600 mb-2 font-medium">所属链群</div>
          <Link
            href={`/extension/group?groupId=${groupId?.toString()}&actionId=${actionId.toString()}&symbol=${
              token?.symbol
            }`}
          >
            <div className="border border-gray-200 rounded-lg p-4 hover:border-secondary hover:bg-secondary/5 cursor-pointer transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 mb-1">
                    #{groupDetail.groupId.toString()} {groupDetail.groupName}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span>服务者:</span>
                    <AddressWithCopyButton address={groupDetail.owner} showCopyButton={true} />
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 验证信息 */}
      {verificationKeys && verificationKeys.length > 0 && (
        <div className="w-full mb-6">
          <div className="text-sm text-gray-600 mb-2 font-medium flex items-center justify-between">
            <span>我提供的验证信息</span>
            <Button
              variant="link"
              size="sm"
              className="text-secondary p-0 h-auto"
              onClick={() =>
                router.push(
                  `/acting/join?tab=update_verification_info&groupId=${groupId?.toString()}&id=${actionId}&symbol=${
                    token?.symbol
                  }`,
                )
              }
            >
              <Edit className="w-3 h-3 mr-1" />
              修改
            </Button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            {isPendingVerificationInfos ? (
              <div className="text-sm text-gray-500">加载中...</div>
            ) : (
              <div className="space-y-3">
                {verificationKeys.map((key, index) => (
                  <div key={key} className="last:mb-0">
                    <div className="text-sm font-semibold text-gray-700 mb-1">{key}</div>
                    <div className="text-base text-gray-800">
                      {verificationInfos[index] ? (
                        <LinkIfUrl text={verificationInfos[index] || ''} />
                      ) : (
                        <span className="text-gray-400">未填写</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 按钮区 */}
      <div className="flex justify-center space-x-2 w-full">
        {/* 取回代币 */}
        <Button
          variant="outline"
          className="flex-1 text-secondary border-secondary"
          onClick={handleExit}
          disabled={!joinedAmount || joinedAmount <= BigInt(0) || isPendingExit || isConfirmingExit || isConfirmedExit}
        >
          {isPendingExit ? '提交中' : isConfirmingExit ? '确认中' : isConfirmedExit ? '已取回' : '取回代币'}
        </Button>

        {/* 查看激励 */}
        <Button variant="outline" className="flex-1 text-secondary border-secondary" asChild>
          <Link href={`/my/rewardsofaction?id=${actionId}&symbol=${token?.symbol}`}>查看激励</Link>
        </Button>

        {/* 增加参与代币 */}
        <Button variant="outline" className="flex-1 text-secondary border-secondary" asChild>
          <Link href={`/acting/join?tab=join&groupId=${groupId?.toString()}&id=${actionId}&symbol=${token?.symbol}`}>
            增加代币
          </Link>
        </Button>
      </div>

      {/* 说明 */}
      <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2 w-full">
        <div className="font-medium text-gray-700 mb-1">💡 小贴士</div>
        <div className="space-y-1 text-gray-600">
          <div>• 您的激励将基于链群服务者的验证打分</div>
          <div>• 可以随时取回参与的代币，不影响已产生的激励</div>
        </div>
      </div>

      <LoadingOverlay
        isLoading={isPendingExit || isConfirmingExit}
        text={isPendingExit ? '提交取回交易...' : '确认取回交易...'}
      />
    </div>
  );
};

export default GroupMyParticipation;
