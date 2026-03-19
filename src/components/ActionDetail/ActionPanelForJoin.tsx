'use client';
import React, { useEffect, useContext } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/router';

// my hooks
import {
  useCurrentRound,
  useJoinedAmountByActionIdByAccount,
  useJoinedAmountByActionId,
  useWithdraw,
} from '@/src/hooks/contracts/useLOVE20Join';
import { useVerificationInfosByAccount } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useIsSubmitted } from '@/src/hooks/contracts/useLOVE20Submit';
import { useIsActionIdVoted } from '@/src/hooks/contracts/useLOVE20Vote';
// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my types
import { ActionInfo } from '@/src/types/love20types';

// my components
import { formatTokenAmount, formatPercentage } from '@/src/lib/format';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

// my utils
import { LinkIfUrl } from '@/src/lib/stringUtils';
import { calculateTokensNeededFor100Percent, calculateProbability } from '@/src/lib/probabilityUtils';

interface ActionPanelForJoinProps {
  actionId: bigint;
  actionInfo: ActionInfo | undefined;
  onStakedAmountChange?: (stakedAmount: bigint) => void;
  showJoinButton?: boolean;
}

const ActionPanelForJoin: React.FC<ActionPanelForJoinProps> = ({
  actionId,
  actionInfo,
  onStakedAmountChange,
  showJoinButton = true,
}) => {
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const router = useRouter();

  // 获取当前轮次
  const { currentRound, error: errCurrentRound } = useCurrentRound();

  // 获取是否已提交
  const {
    isSubmitted,
    error: errIsSubmitted,
    isPending: isPendingIsSubmitted,
  } = useIsSubmitted((token?.address as `0x${string}`) || '', currentRound, actionId);

  // 获取是否已投票
  const {
    isActionIdVoted,
    error: errIsActionIdVoted,
    isPending: isPendingIsActionIdVoted,
  } = useIsActionIdVoted((token?.address as `0x${string}`) || '', currentRound, actionId);

  // 获取我的行动代币数
  const {
    joinedAmountByActionIdByAccount,
    isPending: isPendingJoinedAmountByAccount,
    error: errorJoinedAmountByAccount,
  } = useJoinedAmountByActionIdByAccount(
    (token?.address as `0x${string}`) || '',
    actionId,
    (account as `0x${string}`) || '',
  );

  // 获取所有用户代币数，计算参与比例
  const {
    joinedAmountByActionId,
    isPending: isPendingJoinedAmount,
    error: errorJoinedAmount,
  } = useJoinedAmountByActionId((token?.address as `0x${string}`) || '', actionId);
  const isJoined =
    joinedAmountByActionIdByAccount &&
    joinedAmountByActionIdByAccount > 0 &&
    joinedAmountByActionId &&
    joinedAmountByActionId > 0;

  // 计算参与占比
  const participationRatio = isJoined
    ? (Number(joinedAmountByActionIdByAccount) / Number(joinedAmountByActionId)) * 100
    : 0;
  const participationRatioStr = formatPercentage(participationRatio);

  // 计算被抽中概率
  const probability =
    isJoined && actionInfo
      ? calculateProbability(
          joinedAmountByActionIdByAccount || BigInt(0),
          joinedAmountByActionId || BigInt(0),
          Number(actionInfo.body.maxRandomAccounts || 0),
        )
      : 0;
  const probabilityStr = formatPercentage(probability);

  // 计算达到100%概率还需要的代币数
  const tokensNeededFor100 =
    isJoined && actionInfo
      ? calculateTokensNeededFor100Percent(
          joinedAmountByActionIdByAccount || BigInt(0),
          joinedAmountByActionId || BigInt(0),
          Number(actionInfo.body.maxRandomAccounts || 0),
        )
      : BigInt(0);

  // 获取验证信息
  const {
    verificationKeys,
    verificationInfos,
    isPending: isPendingVerificationInfo,
    error: errorVerificationInfo,
  } = useVerificationInfosByAccount(
    (token?.address as `0x${string}`) || '',
    actionId,
    (account as `0x${string}`) || '',
  );

  // 取回代币
  const {
    withdraw,
    isPending: isPendingWithdraw,
    isConfirming: isConfirmingWithdraw,
    isConfirmed: isConfirmedWithdraw,
    writeError: errorWithdraw,
  } = useWithdraw();

  const handleWithdraw = async () => {
    // 如果代币为0, toast
    if (joinedAmountByActionIdByAccount != undefined && joinedAmountByActionIdByAccount <= BigInt(2)) {
      toast.error('你还没有参与，无需取回');
      return;
    }
    await withdraw((token?.address as `0x${string}`) || '', actionId);
  };

  useEffect(() => {
    if (isConfirmedWithdraw) {
      toast.success('取回成功');
      // 跳转到个人首页
      router.push('/my');
    }
  }, [isConfirmedWithdraw, router]);

  useEffect(() => {
    if (isPendingJoinedAmountByAccount) {
      return;
    }
    onStakedAmountChange?.(joinedAmountByActionIdByAccount || BigInt(0));
  }, [joinedAmountByActionIdByAccount, isPendingJoinedAmountByAccount]);

  if (isPendingJoinedAmountByAccount || isPendingJoinedAmount || isPendingIsSubmitted || isPendingIsActionIdVoted) {
    return '';
  }

  return (
    <div className="flex flex-col items-center px-0 pt-1">
      {isJoined && (
        <div className="stats w-full grid grid-cols-2 divide-x-0 gap-4">
          <div className="stat place-items-center min-h-[120px] flex flex-col justify-center">
            <div className="stat-title">我的参与</div>
            <div className="stat-value text-2xl text-secondary">
              {isPendingJoinedAmountByAccount ? (
                <LoadingIcon />
              ) : (
                formatTokenAmount(joinedAmountByActionIdByAccount || BigInt(0), 0)
              )}
            </div>
            <div className="stat-desc text-sm mt-2 whitespace-normal break-words text-center">{token?.symbol}数量</div>
          </div>
          <div className="stat place-items-center min-h-[120px] flex flex-col justify-center p-0">
            <div className="stat-title">被抽中验证概率</div>
            <div className="stat-value text-2xl text-secondary">{probabilityStr}</div>
            <div className="stat-desc text-sm mt-2 whitespace-normal break-words text-center">
              我的占比：{participationRatioStr}
            </div>
          </div>
        </div>
      )}
      {probability < 100 && tokensNeededFor100 > BigInt(0) && (
        <div className="text-sm mb-2 text-gray-500 whitespace-normal break-words text-center">
          （要100%概率被抽中，至少还需{' '}
          <span className="text-secondary"> {formatTokenAmount(tokensNeededFor100, 4, 'ceil')}</span> 代币）
        </div>
      )}
      {showJoinButton && (
        <>
          {!isJoined ? (
            isSubmitted && (
              <Button variant="outline" className="w-1/2 text-secondary border-secondary" asChild>
                <Link href={`/acting/join?id=${actionId}&symbol=${token?.symbol}`}>参与行动</Link>
              </Button>
            )
          ) : (
            <>
              <div className="w-full space-y-3 mt-2">
                <div className="flex justify-center space-x-2 w-full">
                  {joinedAmountByActionIdByAccount != undefined && joinedAmountByActionIdByAccount <= BigInt(2) ? (
                    <Button variant="outline" className="flex-1 text-secondary border-secondary" disabled>
                      取回
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="flex-1 text-secondary border-secondary"
                      onClick={handleWithdraw}
                      disabled={isPendingWithdraw || isConfirmingWithdraw || isConfirmedWithdraw}
                    >
                      {isPendingWithdraw
                        ? '提交中'
                        : isConfirmingWithdraw
                        ? '确认中'
                        : isConfirmedWithdraw
                        ? '已取回'
                        : '退出并取回代币'}
                    </Button>
                  )}

                  {!isActionIdVoted ? (
                    <Button variant="outline" className="flex-1" disabled>
                      增加参与代币
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1 text-secondary border-secondary" asChild>
                      <Link href={`/acting/join?id=${actionId}&symbol=${token?.symbol}`}>增加参与代币</Link>
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

              <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-3 mt-3 mb-3 w-full">
                <div className="font-medium text-gray-600 mb-3">💡 小贴士：</div>
                <div className="ml-4 text-gray-600 mb-2">
                  1. 要100%被抽中的代币数 = 总参与代币数 / 最大激励地址数。
                  所以，有其他人增加参与代币，就需要更多代币才能达到100%概率被抽中。
                </div>
                <div className="ml-4 text-gray-600">
                  2. 当前验证的是上一轮的行动结果，所以取回代币，不会影响正在进行的验证，也不会影响上一轮行动的激励。
                </div>
              </div>

              <div className="flex flex-col items-start my-4 w-full">
                <div className="text-sm text-greyscale-600 w-full">
                  {isPendingVerificationInfo && '加载中...'}
                  {joinedAmountByActionIdByAccount != undefined &&
                    joinedAmountByActionIdByAccount > BigInt(2) &&
                    verificationKeys &&
                    verificationKeys.length > 0 && (
                      <>
                        <h3 className="text-base font-medium text-gray-700 mb-3">我提供的验证信息：</h3>
                        <div className="w-full bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <div className="w-full text-left">
                            {verificationKeys.map((key, index) => (
                              <div key={index} className="mb-2">
                                <div className="text-sm font-bold text-greyscale-600">{key}</div>
                                <div className="text-base">
                                  <LinkIfUrl text={verificationInfos[index]} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      <LoadingOverlay
        isLoading={isPendingWithdraw || isConfirmingWithdraw}
        text={isPendingWithdraw ? '提交交易...' : '确认交易...'}
      />
    </div>
  );
};

export default ActionPanelForJoin;
