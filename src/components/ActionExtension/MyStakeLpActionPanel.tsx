'use client';
import React, { useEffect, useContext } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/router';

// my hooks
import { useStakeLpActionData } from '@/src/hooks/composite/useStakeLpActionData';
import { useUnstakeLp, useWithdrawLp } from '@/src/hooks/contracts/useLOVE20ExtensionStakeLp';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my types
import { ActionInfo } from '@/src/types/love20types';

// my components
import { formatPercentage } from '@/src/lib/format';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import StakeLpStatsCard from './StakeLpStatsCard';

interface MyStakeLpActionPanelProps {
  actionId: bigint;
  actionInfo: ActionInfo | undefined;
  extensionAddress: `0x${string}`;
}

/**
 * 我的 StakeLp 行动面板组件
 *
 * 功能：
 * 1. 显示用户的 LP 质押数量
 * 2. 显示激励占比（LP部分 + SL部分）
 * 3. 提供取回LP、增加LP、查看激励的操作入口
 */
const MyStakeLpActionPanel: React.FC<MyStakeLpActionPanelProps> = ({ actionId, actionInfo, extensionAddress }) => {
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const router = useRouter();

  // 获取 StakeLp 扩展数据
  const {
    stakedAmount,
    totalStakedAmount,
    userScore,
    totalScore,
    userGovVotes,
    totalGovVotes,
    minGovVotes,
    lpRatio,
    govRatioMultiplier,
    requestedUnstakeRound,
    currentRound,
    waitingPhases,
    canWithdrawAtRound,
    canWithdrawNow,
    remainingRounds,
    isPending: isPendingData,
    error: errorData,
  } = useStakeLpActionData({
    extensionAddress,
    tokenAddress: token?.address as `0x${string}`,
    account: account as `0x${string}`,
  });

  // 计算是否已质押
  const isStaked = stakedAmount && stakedAmount > BigInt(0);

  // 格式化 LP 占比
  const lpRatioStr = formatPercentage(lpRatio);

  // 判断是否已经请求解除质押
  const hasRequestedUnstake = requestedUnstakeRound && requestedUnstakeRound > BigInt(0);

  // 解除 LP 质押（第一步）
  const {
    unstakeLp,
    isPending: isPendingUnstake,
    isConfirming: isConfirmingUnstake,
    isConfirmed: isConfirmedUnstake,
    writeError: errorUnstake,
  } = useUnstakeLp(extensionAddress);

  const handleUnstakeLp = async () => {
    // 如果质押数量为0, toast
    if (!stakedAmount || stakedAmount <= BigInt(0)) {
      toast.error('你还没有质押LP，无需解除');
      return;
    }
    await unstakeLp();
  };

  useEffect(() => {
    if (isConfirmedUnstake) {
      toast.success(`解除LP质押成功，等待 ${waitingPhases} 个阶段后可取回LP`);
    }
  }, [isConfirmedUnstake, waitingPhases]);

  // 取回 LP（第二步）
  const {
    withdrawLp,
    isPending: isPendingWithdraw,
    isConfirming: isConfirmingWithdraw,
    isConfirmed: isConfirmedWithdraw,
    writeError: errorWithdraw,
  } = useWithdrawLp(extensionAddress);

  const handleWithdrawLp = async () => {
    if (!canWithdrawNow) {
      toast.error(`还需等待 ${remainingRounds} 个阶段才能取回LP`);
      return;
    }
    await withdrawLp();
  };

  useEffect(() => {
    if (isConfirmedWithdraw) {
      toast.success('取回LP成功');
      // 跳转到个人首页
      router.push('/my');
    }
  }, [isConfirmedWithdraw, router]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorData) {
      handleContractError(errorData, 'extension');
    }
    if (errorUnstake) {
      handleContractError(errorUnstake, 'extension');
    }
    if (errorWithdraw) {
      handleContractError(errorWithdraw, 'extension');
    }
  }, [errorData, errorUnstake, errorWithdraw, handleContractError]);

  if (isPendingData) {
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
      {isStaked && (
        <>
          <StakeLpStatsCard
            stakedAmount={stakedAmount || BigInt(0)}
            lpRatioStr={lpRatioStr}
            userScore={userScore}
            totalScore={totalScore}
            userGovVotes={userGovVotes}
            totalGovVotes={totalGovVotes}
          />

          {/* 治理票数不足的警告 */}
          {userGovVotes < minGovVotes && (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-3 w-full">
              <div className="font-medium">⚠️ 治理票数不足</div>
              <div className="mt-1">
                你的治理票数 <span className="font-semibold">{userGovVotes.toString()}</span> 低于最小门槛{' '}
                <span className="font-semibold">{minGovVotes.toString()}</span>，无法获得得分和激励。
              </div>
              <div className="text-xs text-amber-600 mt-1">请质押更多代币以增加治理票数。</div>
            </div>
          )}
        </>
      )}

      {/* 操作按钮 */}
      {!isStaked ? (
        <Button variant="outline" className="w-1/2 text-secondary border-secondary" asChild>
          <Link href={`/acting/join?id=${actionId}&symbol=${token?.symbol}`}>质押LP参与</Link>
        </Button>
      ) : (
        <>
          <div className="flex justify-center space-x-2 mt-6 w-full">
            {/* 解除LP质押/取回LP按钮 */}
            {!stakedAmount || stakedAmount <= BigInt(0) ? (
              <Button variant="outline" className="w-1/3 text-secondary border-secondary" disabled>
                解除质押
              </Button>
            ) : !hasRequestedUnstake ? (
              // 第一步：解除LP质押
              <Button
                variant="outline"
                className="w-1/3 text-secondary border-secondary"
                onClick={handleUnstakeLp}
                disabled={isPendingUnstake || isConfirmingUnstake || isConfirmedUnstake}
              >
                {isPendingUnstake
                  ? '提交中'
                  : isConfirmingUnstake
                  ? '确认中'
                  : isConfirmedUnstake
                  ? '已解除'
                  : '解除质押'}
              </Button>
            ) : (
              // 第二步：取回LP
              <Button
                variant="outline"
                className="w-1/3 text-secondary border-secondary"
                onClick={handleWithdrawLp}
                disabled={!canWithdrawNow || isPendingWithdraw || isConfirmingWithdraw || isConfirmedWithdraw}
              >
                {isPendingWithdraw
                  ? '提交中'
                  : isConfirmingWithdraw
                  ? '确认中'
                  : isConfirmedWithdraw
                  ? '已取回'
                  : canWithdrawNow
                  ? '取回LP'
                  : `等待中...`}
              </Button>
            )}

            {/* 查看激励按钮 */}
            <Button variant="outline" className="w-1/3 text-secondary border-secondary" asChild>
              <Link href={`/my/rewardsofaction?id=${actionId}&symbol=${token?.symbol}`}>查看激励</Link>
            </Button>

            {/* 增加LP按钮 */}
            <Button variant="outline" className="w-1/3 text-secondary border-secondary" asChild>
              <Link href={`/acting/join?id=${actionId}&symbol=${token?.symbol}`}>增加LP</Link>
            </Button>
          </div>

          {/* 等待取回LP的提示 */}
          {hasRequestedUnstake && !canWithdrawNow && (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-3 w-full">
              <div className="font-medium">⏳ 等待解除质押</div>
              <div className="mt-1">
                已请求解除质押，还需等待 <span className="font-semibold">{remainingRounds.toString()}</span> 个阶段
              </div>
              <div className="text-xs text-amber-600 mt-1">
                第 {canWithdrawAtRound.toString()} 轮可取回LP（当前第 {currentRound.toString()} 轮）
              </div>
            </div>
          )}

          <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-3 mt-6 mb-3 w-full">
            <div className="font-medium text-gray-600 mb-2">💡 激励占比说明：</div>
            <div className="ml-4 text-gray-600 space-y-1">
              <div>• LP占比：你质押的LP / LP Token总供应量</div>
              <div>• 治理票占比：你的治理票 / 总治理票</div>
              <div>
                • 实际激励占比：通过合约算法计算（LP占比 和 治理票占比 × {Number(govRatioMultiplier)} 的最小值）
              </div>
              <div>• 解锁LP时，当时验证轮不会产生激励</div>
            </div>
          </div>
        </>
      )}

      <LoadingOverlay
        isLoading={isPendingUnstake || isConfirmingUnstake || isPendingWithdraw || isConfirmingWithdraw}
        text={
          isPendingUnstake
            ? '提交解除质押交易...'
            : isConfirmingUnstake
            ? '确认解除质押交易...'
            : isPendingWithdraw
            ? '提交取回LP交易...'
            : '确认取回LP交易...'
        }
      />
    </div>
  );
};

export default MyStakeLpActionPanel;
