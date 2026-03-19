'use client';
import React, { useEffect, useContext } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { HelpCircle } from 'lucide-react';

// my hooks
import { useIsAccountJoined } from '@/src/hooks/extension/base/contracts/useExtensionCenter';
import { useMyLpActionData } from '@/src/hooks/extension/plugins/lp/composite/useMyLpActionData';
import { useExit } from '@/src/hooks/extension/plugins/lp/contracts/useExtensionLp';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my types
import { ActionInfo } from '@/src/types/love20types';

// my components
import { formatTokenAmount, formatPercentage, formatSeconds } from '@/src/lib/format';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import LpStatsCard from '@/src/components/Extension/Plugins/Lp/_LpStatsCard';

interface LpMyParticipationProps {
  actionId: bigint;
  actionInfo: ActionInfo | undefined;
  extensionAddress: `0x${string}`;
}

/**
 * LP 我的行动参与组件
 *
 * 功能：
 * 1. 显示用户的 LP 加入数量
 * 2. 显示激励占比（LP部分）
 * 3. 提供退出LP、增加LP、查看激励的操作入口
 */
const LpMyParticipation: React.FC<LpMyParticipationProps> = ({ actionId, actionInfo, extensionAddress }) => {
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const router = useRouter();

  // 获取我的 LP 扩展数据
  const {
    joinedAmount,
    rewardRatio,
    userGovVotes,
    totalGovVotes,
    minGovRatio,
    userGovRatio,
    lpRatio,
    govRatioMultiplier,
    joinedBlock,
    exitableBlock,
    currentBlock,
    waitingBlocks,
    canExitNow,
    remainingBlocks,
    isPending: isPendingData,
    error: errorData,
  } = useMyLpActionData({
    extensionAddress,
    tokenAddress: token?.address as `0x${string}`,
    account: account as `0x${string}`,
  });

  // 判断是否已加入行动
  const {
    isJoined,
    isPending: isPendingJoined,
    error: errorJoined,
  } = useIsAccountJoined(token?.address as `0x${string}`, actionId, account as `0x${string}`);

  // 格式化 LP 占比
  const lpRatioStr = formatPercentage(lpRatio);

  // 退出 LP（直接退出）
  const {
    exit,
    isPending: isPendingExit,
    isConfirming: isConfirmingExit,
    isConfirmed: isConfirmedExit,
  } = useExit(extensionAddress);

  const handleExit = async () => {
    // 如果加入数量为0, toast
    if (!joinedAmount || joinedAmount <= BigInt(0)) {
      toast.error('你还没有加入LP，无需退出');
      return;
    }
    // 如果还不能退出
    if (!canExitNow) {
      toast.error(`还需等待 ${remainingBlocks} 个区块才能退出`);
      return;
    }
    await exit();
  };

  useEffect(() => {
    if (isConfirmedExit) {
      toast.success('退出LP成功');
      // 跳转到个人首页
      router.push('/my');
    }
  }, [isConfirmedExit, router]);

  // 错误处理

  if (isPendingData || isPendingJoined) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="text-center">
          <LoadingIcon />
          <p className="mt-4 text-gray-600">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-1">
      {isJoined && (
        <>
          <LpStatsCard
            stakedAmount={joinedAmount || BigInt(0)}
            lpRatioStr={lpRatioStr}
            rewardRatio={rewardRatio}
            userGovVotes={userGovVotes}
            totalGovVotes={totalGovVotes}
          />

          {/* 治理票占比不足的警告 */}
          {userGovRatio < minGovRatio && (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-3 w-full">
              <div className="font-medium">⚠️ 治理票占比不足</div>
              <div className="mt-1">
                你的治理票占比{' '}
                <span className="font-semibold">{formatPercentage((Number(userGovRatio) / 1e18) * 100)}</span>{' '}
                低于最小门槛{' '}
                <span className="font-semibold">{formatPercentage((Number(minGovRatio) / 1e18) * 100)}</span>
                ，无法获得得分和激励。
              </div>
              <div className="text-xs text-amber-600 mt-1">请质押更多代币以增加治理票数。</div>
            </div>
          )}
        </>
      )}

      {/* 操作按钮 */}
      {!isJoined ? (
        <Button variant="outline" className="w-1/2 text-secondary border-secondary" asChild>
          <Link href={`/acting/join?id=${actionId}&symbol=${token?.symbol}`}>加入LP参与</Link>
        </Button>
      ) : (
        <>
          <div className="w-full space-y-3 mt-6">
            <div className="flex justify-center space-x-2 w-full">
              {/* 退出LP按钮 */}
              {!joinedAmount || joinedAmount <= BigInt(0) ? (
                <Button variant="outline" className="flex-1 text-secondary border-secondary" disabled>
                  退出并取回代币
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="flex-1 text-secondary border-secondary"
                  onClick={handleExit}
                  disabled={!canExitNow || isPendingExit || isConfirmingExit || isConfirmedExit}
                >
                  {isPendingExit ? '提交中' : isConfirmingExit ? '确认中' : isConfirmedExit ? '已退出' : '退出并取回代币'}
                </Button>
              )}

              {/* 增加LP按钮 */}
              <Button variant="outline" className="flex-1 text-secondary border-secondary" asChild>
                <Link href={`/acting/join?id=${actionId}&symbol=${token?.symbol}`}>增加LP</Link>
              </Button>
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

          {/* 等待退出的提示 */}
          {isJoined && !canExitNow && (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-3 w-full">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-800 pb-2">
                <HelpCircle className="w-4 h-4" />
                小贴士
              </div>
              <div className="mt-1">
                加入后需要等待 <span className="font-semibold">{waitingBlocks.toString()}</span> 个区块后才能退出
                <span className="text-sm text-amber-600 mt-1">
                  （你在区块 <span className="font-semibold">{joinedBlock.toString()}</span> 加入，当前区块{' '}
                  {currentBlock.toString()}，还需等待 {remainingBlocks.toString()} 个区块，大约需要{' '}
                  {formatSeconds((Number(remainingBlocks) * Number(process.env.NEXT_PUBLIC_BLOCK_TIME_MS)) / 1000)}）
                </span>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-3 mt-6 mb-3 w-full">
            <div className="font-medium text-gray-600 mb-2">💡 计算说明：</div>
            <div className="ml-4 text-gray-600 space-y-1">
              <div>• LP占比 = 你参与的LP数量 / 本行动的LP总量</div>
              <div>• 治理票占比 = 你的治理票 / 总治理票</div>
              <div>• 激励占比 = LP占比 和 (你的治理票占比 × {Number(govRatioMultiplier)}) 中的最小值</div>
            </div>
          </div>
        </>
      )}

      <LoadingOverlay
        isLoading={isPendingExit || isConfirmingExit}
        text={isPendingExit ? '提交退出交易...' : '确认退出交易...'}
      />
    </div>
  );
};

export default LpMyParticipation;
