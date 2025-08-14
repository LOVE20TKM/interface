'use client';
import React, { useEffect, useContext } from 'react';
import { useAccount, useChainId } from 'wagmi';
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
import { useHandleContractError } from '@/src/lib/errorUtils';

// my funcs
import { checkWalletConnectionByChainId } from '@/src/lib/web3';

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

interface ActionPanelForJoinProps {
  actionId: bigint;
  onRoundChange: (currentRound: bigint) => void;
  actionInfo: ActionInfo | undefined;
  onStakedAmountChange?: (stakedAmount: bigint) => void;
  showJoinButton?: boolean;
}

const ActionPanelForJoin: React.FC<ActionPanelForJoinProps> = ({
  actionId,
  onRoundChange,
  actionInfo,
  onStakedAmountChange,
  showJoinButton = true,
}) => {
  const { address: account } = useAccount();
  const chainId = useChainId();
  const { token } = useContext(TokenContext) || {};
  const router = useRouter();

  // 获取当前轮次, 并设置状态给父组件
  const { currentRound, error: errCurrentRound } = useCurrentRound();
  useEffect(() => {
    if (onRoundChange && typeof onRoundChange === 'function') {
      onRoundChange(currentRound);
    }
  }, [currentRound, onRoundChange]);

  // 获取是否已提交
  const {
    isSubmitted,
    error: errIsSubmitted,
    isPending: isPendingIsSubmitted,
  } = useIsSubmitted((token?.address as `0x${string}`) || '', currentRound, actionId);

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
  const participationRatio = isJoined
    ? (Number(joinedAmountByActionIdByAccount) / Number(joinedAmountByActionId)) * 100
    : 0;
  const participationRatioStr = formatPercentage(participationRatio);
  const probabilityStr = isJoined
    ? formatPercentage(Math.min(participationRatio * Number(actionInfo?.body.maxRandomAccounts), 100))
    : '0%';

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
    if (!checkWalletConnectionByChainId(chainId)) {
      return;
    }
    // 如果代币为0, toast
    if (joinedAmountByActionIdByAccount != undefined && joinedAmountByActionIdByAccount <= 2n) {
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

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorJoinedAmountByAccount) {
      handleContractError(errorJoinedAmountByAccount, 'join');
    }
    if (errorJoinedAmount) {
      handleContractError(errorJoinedAmount, 'join');
    }
    if (errorVerificationInfo) {
      handleContractError(errorVerificationInfo, 'join');
    }
    if (errCurrentRound) {
      handleContractError(errCurrentRound, 'join');
    }
    if (errorWithdraw) {
      handleContractError(errorWithdraw, 'join');
    }
    if (errIsSubmitted) {
      handleContractError(errIsSubmitted, 'submit');
    }
  }, [
    errorJoinedAmountByAccount,
    errorJoinedAmount,
    errorVerificationInfo,
    errCurrentRound,
    errorWithdraw,
    errIsSubmitted,
  ]);

  if (isPendingJoinedAmountByAccount || isPendingJoinedAmount || isPendingIsSubmitted) {
    return '';
  }

  return (
    <div className="flex flex-col items-center px-4 pt-1">
      {isJoined && (
        <div className="stats w-full grid grid-cols-2 divide-x-0">
          <div className="stat place-items-center">
            <div className="stat-title">我的参与</div>
            <div className="stat-value text-2xl text-secondary">
              {isPendingJoinedAmount ? (
                <LoadingIcon />
              ) : (
                formatTokenAmount(joinedAmountByActionIdByAccount || BigInt(0), 0)
              )}
            </div>
            <div className="stat-desc text-sm mt-2">参与本行动的代币</div>
          </div>
          <div className="stat place-items-center">
            <div className="stat-title">我的占比</div>
            <div className="stat-value text-2xl text-secondary">{participationRatioStr}</div>
            <div className="stat-desc text-sm mt-2">被抽中验证概率 {probabilityStr}</div>
          </div>
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
              <div className="flex justify-center space-x-2 mt-2 w-full">
                {joinedAmountByActionIdByAccount != undefined && joinedAmountByActionIdByAccount <= 2n ? (
                  <Button variant="outline" className="w-1/3 text-secondary border-secondary" disabled>
                    取回
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-1/3 text-secondary border-secondary"
                    onClick={handleWithdraw}
                    disabled={isPendingWithdraw || isConfirmingWithdraw || isConfirmedWithdraw}
                  >
                    {isPendingWithdraw
                      ? '提交中'
                      : isConfirmingWithdraw
                      ? '确认中'
                      : isConfirmedWithdraw
                      ? '已取回'
                      : '取回代币'}
                  </Button>
                )}

                <Button variant="outline" className="w-1/3 text-secondary border-secondary" asChild>
                  <Link href={`/my/rewardsofaction?id=${actionId}&symbol=${token?.symbol}`}>查看激励</Link>
                </Button>
                <Button variant="outline" className="w-1/3 text-secondary border-secondary" asChild>
                  <Link href={`/acting/join?id=${actionId}&symbol=${token?.symbol}`}>增加参与代币</Link>
                </Button>
              </div>
              <div className="flex flex-col items-center mt-2 mb-4">
                <div className="text-sm text-greyscale-600">
                  {isPendingVerificationInfo && '加载中...'}
                  {joinedAmountByActionIdByAccount != undefined &&
                    joinedAmountByActionIdByAccount > 2n &&
                    verificationKeys &&
                    verificationKeys.length > 0 && (
                      <div>
                        {verificationKeys.map((key, index) => (
                          <div key={index}>
                            {key}: <LinkIfUrl text={verificationInfos[index]} />
                          </div>
                        ))}
                      </div>
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
