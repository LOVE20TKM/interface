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
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';
import { useAccountVerificationInfos } from '@/src/hooks/extension/base/composite';
import { useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite/useExtensionGroupDetail';
import { useExit, useJoinInfo } from '@/src/hooks/extension/plugins/group/contracts/useGroupJoin';

// 工具函数
import { LinkIfUrl } from '@/src/lib/stringUtils';

// 组件
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import _GroupParticipationStats from './_GroupParticipationStats';

interface GroupMyParticipationProps {
  actionId: bigint;
  actionInfo: ActionInfo | undefined;
  extensionAddress: `0x${string}`;
}

const GroupMyParticipation: React.FC<GroupMyParticipationProps> = ({ actionId, actionInfo, extensionAddress }) => {
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const router = useRouter();

  // 获取当前加入轮次
  const { currentRound } = useCurrentRound();

  // 获取加入信息
  const {
    amount: joinedAmount,
    provider: trialProviderAddress,
    groupId,
    isPending: isPendingJoinInfo,
    error: errorJoinInfo,
  } = useJoinInfo(extensionAddress, currentRound || BigInt(0), account as `0x${string}`);

  // 判断是否是体验模式
  const isTrialMode = trialProviderAddress && trialProviderAddress !== '0x0000000000000000000000000000000000000000';

  // 获取链群详情
  const {
    groupDetail,
    isPending: isPendingDetail,
    error: errorDetail,
  } = useExtensionGroupDetail({
    extensionAddress,
    groupId: groupId || BigInt(0),
    round: currentRound,
  });

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

  // 判断是否已加入行动：joinedAmount > 0 表示已加入
  const isJoined = (joinedAmount ?? BigInt(0)) > BigInt(0);

  // 退出
  const { exit, isPending: isPendingExit, isConfirming: isConfirmingExit, isConfirmed: isConfirmedExit } = useExit();

  const handleExit = async () => {
    if (!joinedAmount || joinedAmount <= BigInt(0)) {
      toast.error('您还没有参与，无需退出');
      return;
    }
    await exit(extensionAddress);
  };

  useEffect(() => {
    if (isConfirmedExit) {
      toast.success('取回代币成功');
      router.push('/my');
    }
  }, [isConfirmedExit, router]);

  // 错误处理

  if (isPendingJoinInfo || isPendingDetail) {
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
      {/* 链群关闭提示 */}
      {groupDetail && !groupDetail.isActive && (
        <div className="w-full mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          此链群已关闭！ 请退出行动并取回代币。
        </div>
      )}

      {/* 数据区 - 我的参与统计 */}
      <_GroupParticipationStats
        actionId={actionId}
        extensionAddress={extensionAddress}
        groupId={groupId || BigInt(0)}
      />

      {/* 所属链群 */}
      {groupDetail && (
        <div className="w-full mb-2">
          <div className="text-sm text-gray-600 mb-2 font-medium flex items-center justify-between">
            <span>所属链群：</span>
            <span className="flex items-center">
              <span className="text-gray-500 text-xs">#</span>
              <Link
                href={`/extension/group?groupId=${groupId?.toString()}&actionId=${actionId.toString()}&symbol=${
                  token?.symbol
                }`}
                className="text-secondary hover:underline flex items-center gap-1"
              >
                {groupDetail.groupId.toString()} {groupDetail.groupName}
                {/* <ChevronRight className="w-3 h-3" /> */}
                &nbsp;&gt;&gt;
              </Link>
            </span>
          </div>
        </div>
      )}

      {/* 验证信息 */}
      {verificationKeys && verificationKeys.length > 0 && (
        <div className="w-full mb-6">
          <div className="text-sm text-gray-600 mb-2 font-medium flex items-center justify-between">
            <span>我提供的验证信息：</span>
            <Button
              variant="link"
              size="sm"
              className="text-secondary p-0 h-auto gap-0"
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
      <div className="w-full space-y-3">
        <div className="flex justify-center space-x-2 w-full">
          {/* 取回代币 */}
          <Button
            variant="outline"
            className="flex-1 text-secondary border-secondary"
            onClick={handleExit}
            disabled={
              !joinedAmount || joinedAmount <= BigInt(0) || isPendingExit || isConfirmingExit || isConfirmedExit
            }
          >
            {isPendingExit
              ? '提交中'
              : isConfirmingExit
              ? '确认中'
              : isConfirmedExit
              ? isTrialMode
                ? '已退出'
                : '已取回'
              : isTrialMode
              ? '退出体验'
              : '退出并取回代币'}
          </Button>

          {/* 增加参与代币 */}
          {isTrialMode ? (
            <Button variant="outline" className="flex-1 text-secondary border-secondary" disabled>
              追加代币
            </Button>
          ) : (
            <Button variant="outline" className="flex-1 text-secondary border-secondary" asChild>
              <Link
                href={`/acting/join?tab=join&groupId=${groupId?.toString()}&id=${actionId}&symbol=${token?.symbol}`}
              >
                追加代币
              </Link>
            </Button>
          )}
        </div>

        {/* 查看激励链接 */}
        <div className="flex justify-center">
          <Link
            href={`/my/rewardsofaction?id=${actionId}&symbol=${token?.symbol}`}
            className="text-secondary hover:underline"
          >
            查看行动激励 &gt;&gt;
          </Link>
        </div>
      </div>

      {/* 说明 */}
      <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2 w-full">
        <div className="font-medium text-gray-700 mb-1">💡 小贴士</div>
        <div className="space-y-1 text-gray-600">
          <div>可以随时取回参与的代币，不影响已产生的激励</div>
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
