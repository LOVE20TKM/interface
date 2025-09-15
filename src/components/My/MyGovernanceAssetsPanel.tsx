import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { useAccount, useChainId } from 'wagmi';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// my funcs
import { formatTokenAmount, formatRoundForDisplay } from '@/src/lib/format';
import { formatPhaseText } from '@/src/lib/domainUtils';

// my hooks
import { useHandleContractError } from '@/src/lib/errorUtils';
import { useAccountStakeStatus, useUnstake, useWithdraw, useValidGovVotes } from '@/src/hooks/contracts/useLOVE20Stake';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
import { useApprove as useApproveST } from '@/src/hooks/contracts/useLOVE20STToken';
import { useApprove as useApproveSL } from '@/src/hooks/contracts/useLOVE20SLToken';
import { useAllowance } from '@/src/hooks/contracts/useLOVE20Token';

// my contexts
import { Token } from '@/src/contexts/TokenContext';

// my components
import AddToMetamask from '@/src/components/Common/AddToMetamask';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

interface MyGovernanceAssetsPanelProps {
  token: Token | null | undefined;
  enableWithdraw?: boolean;
  onStakeStatusChange?: (hasStake: boolean) => void;
}

const MyGovernanceAssetsPanel: React.FC<MyGovernanceAssetsPanelProps> = ({
  token,
  enableWithdraw = false,
  onStakeStatusChange,
}) => {
  const { address: account } = useAccount();

  // Hook：获取当前轮次
  const { currentRound, isPending: isPendingCurrentRound, error: errorCurrentRound } = useCurrentRound();

  // Hook：获取质押状态
  const {
    slAmount,
    stAmount,
    promisedWaitingPhases,
    requestedUnstakeRound,
    govVotes,
    isPending: isPendingAccountStakeStatus,
    error: errorAccountStakeStatus,
  } = useAccountStakeStatus(token?.address as `0x${string}`, account as `0x${string}`);

  // 检查输入条件
  const checkInput = () => {
    if (!slAmount || slAmount <= BigInt(0)) {
      toast.error('流动性质押数量为0，不用取消质押');
      return false;
    }
    return true;
  };

  // 使用 useAllowance 检查授权状态（分别检查流动性质押与质押代币）
  const {
    allowance: allowanceSL,
    isPending: isPendingAllowanceSL,
    error: errAllowanceSL,
  } = useAllowance(
    token?.slTokenAddress as `0x${string}`,
    account as `0x${string}`,
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE as `0x${string}`,
    enableWithdraw,
  );

  const {
    allowance: allowanceST,
    isPending: isPendingAllowanceST,
    error: errAllowanceST,
  } = useAllowance(
    token?.stTokenAddress as `0x${string}`,
    account as `0x${string}`,
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE as `0x${string}`,
    enableWithdraw,
  );

  // 我的治理票&总有效票数
  const {
    validGovVotes,
    isPending: isPendingValidGovVotes,
    error: errorValidGovVotes,
  } = useValidGovVotes((token?.address as `0x${string}`) || '', (account as `0x${string}`) || '');

  // 状态变量：判断各 token 是否已授权
  const [isSlTokenApproved, setIsSlTokenApproved] = useState(false);
  const [isStTokenApproved, setIsStTokenApproved] = useState(false);

  // 授权相关 hook
  const {
    isPending: isPendingApproveST,
    isConfirming: isConfirmingApproveST,
    isConfirmed: isConfirmedApproveST,
    writeError: approveSTWriteError,
    approve: approveST,
  } = useApproveST(token?.stTokenAddress as `0x${string}`);
  const {
    isPending: isPendingApproveSL,
    isConfirming: isConfirmingApproveSL,
    isConfirmed: isConfirmedApproveSL,
    writeError: approveSLWriteError,
    approve: approveSL,
  } = useApproveSL(token?.slTokenAddress as `0x${string}`);

  // 分离授权流程：分别为流动性质押的 slToken 与质押代币 stToken 授权
  const handleApproveSL = async () => {
    if (!checkInput()) return;
    try {
      if (slAmount && slAmount > BigInt(0) && !isSlTokenApproved) {
        await approveSL(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE as `0x${string}`, slAmount);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleApproveST = async () => {
    if (!checkInput()) return;
    try {
      if (stAmount && stAmount > BigInt(0) && !isStTokenApproved) {
        await approveST(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE as `0x${string}`, stAmount);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 根据 slAmount 与 allowanceSL 判断流动性质押代币是否已授权
  useEffect(() => {
    if (isConfirmedApproveSL) {
      setIsSlTokenApproved(true);
    } else if (slAmount && slAmount > BigInt(0) && allowanceSL && allowanceSL >= slAmount) {
      setIsSlTokenApproved(true);
    } else {
      setIsSlTokenApproved(false);
    }
  }, [slAmount, allowanceSL, isPendingAllowanceSL, isConfirmedApproveSL]);

  // 根据 stAmount 与 allowanceST 判断质押代币是否已授权
  // 若 stAmount 为 0，则认为无需授权（视为已授权）
  useEffect(() => {
    if (isConfirmedApproveST) {
      setIsStTokenApproved(true);
    } else if (!stAmount || stAmount <= BigInt(0)) {
      setIsStTokenApproved(true);
    } else if (allowanceST && allowanceST >= stAmount) {
      setIsStTokenApproved(true);
    } else {
      setIsStTokenApproved(false);
    }
  }, [stAmount, allowanceST, isPendingAllowanceST, isConfirmedApproveST]);

  // 取消质押逻辑
  const {
    isWriting: isPendingUnstake,
    isConfirming: isConfirmingUnstake,
    isConfirmed: isConfirmedUnstake,
    writeError: unstakeWriteError,
    unstake,
  } = useUnstake();
  const handleUnstake = async () => {
    try {
      await unstake(token?.address as `0x${string}`);
    } catch (error) {
      console.error(error);
    }
  };

  // 取消质押成功后跳转
  useEffect(() => {
    if (isConfirmedUnstake) {
      toast.success('取消质押成功');
      setTimeout(() => {
        window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/my?symbol=${token?.symbol}`;
      }, 2000);
    }
  }, [isConfirmedUnstake]);

  // 取回代币逻辑
  const {
    isWriting: isPendingWithdraw,
    isConfirming: isConfirmingWithdraw,
    isConfirmed: isConfirmedWithdraw,
    writeError: withdrawWriteError,
    withdraw,
  } = useWithdraw();
  const handleWithdraw = async () => {
    try {
      await withdraw(token?.address as `0x${string}`);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    if (isConfirmedWithdraw) {
      toast.success('取回代币成功');
      setTimeout(() => {
        window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/my?symbol=${token?.symbol}`;
      }, 2000);
    }
  }, [isConfirmedWithdraw]);

  // 通知父组件质押状态变化
  useEffect(() => {
    if (onStakeStatusChange && !isPendingAccountStakeStatus) {
      const hasStake = Boolean(slAmount && slAmount > BigInt(0));
      onStakeStatusChange(hasStake);
    }
  }, [slAmount, isPendingAccountStakeStatus, onStakeStatusChange]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorAccountStakeStatus) {
      handleContractError(errorAccountStakeStatus, 'stake');
    }
    if (approveSTWriteError) {
      handleContractError(approveSTWriteError, 'stToken');
    }
    if (approveSLWriteError) {
      handleContractError(approveSLWriteError, 'slToken');
    }
    if (unstakeWriteError) {
      handleContractError(unstakeWriteError, 'stake');
    }
    if (withdrawWriteError) {
      handleContractError(withdrawWriteError, 'stake');
    }
    if (errorCurrentRound) {
      handleContractError(errorCurrentRound, 'stake');
    }
    if (errAllowanceSL) {
      handleContractError(errAllowanceSL, 'slToken');
    }
    if (errAllowanceST) {
      handleContractError(errAllowanceST, 'stToken');
    }
  }, [
    errorAccountStakeStatus,
    approveSTWriteError,
    approveSLWriteError,
    unstakeWriteError,
    withdrawWriteError,
    errorCurrentRound,
    errAllowanceSL,
    errAllowanceST,
  ]);

  if (!account) {
    return <div className="text-sm mt-4 text-greyscale-500 text-center">请先连接钱包</div>;
  }
  if (!token || (enableWithdraw && isPendingCurrentRound) || isPendingAccountStakeStatus) {
    return <LoadingIcon />;
  }
  if (!isPendingAccountStakeStatus && !slAmount) {
    return <div className="text-sm mt-4 text-greyscale-500 text-center">您没有质押</div>;
  }

  // 状态标记：分别用于显示授权中的状态
  const isApprovingSL = isPendingApproveSL || isConfirmingApproveSL;
  const isApprovingST = isPendingApproveST || isConfirmingApproveST;
  const allApproved = isSlTokenApproved && isStTokenApproved;

  // 是否可以取回代币
  const canWithdraw =
    requestedUnstakeRound && currentRound > requestedUnstakeRound + (promisedWaitingPhases || BigInt(0));

  return (
    <>
      <div className="stats w-full grid grid-cols-2 divide-x-0 ">
        <div className="stat place-items-center pt-0 pb-1 pl-1">
          <div className="stat-title text-sm">我的治理票数</div>
          <div className="stat-value text-xl text-secondary">
            {isPendingAccountStakeStatus ? <LoadingIcon /> : formatTokenAmount(govVotes || BigInt(0))}
          </div>
          <div className="stat-desc text-xs mb-2 mt-1">
            {requestedUnstakeRound && requestedUnstakeRound > BigInt(0) && '注意：解锁期内治理票数为0'}
          </div>
        </div>
        <div className="stat place-items-center pt-0 pb-1 pl-1">
          <div className="stat-title text-sm">我承诺的解锁期</div>
          <div className="stat-value text-lg">
            <span className="text-secondary">
              {isPendingAccountStakeStatus ? <LoadingIcon /> : `${promisedWaitingPhases || BigInt(0)} `}
            </span>
            <span className="text-sm text-gray-600"> 阶段</span>
          </div>
          <div className="stat-desc text-xs mb-2 mt-1">{`${formatPhaseText(
            Number(promisedWaitingPhases || BigInt(0)),
            true,
          )}`}</div>
        </div>
      </div>
      <div className="stats w-full grid grid-cols-2 divide-x-0">
        <div className="stat place-items-center pt-0 pb-1 pl-1">
          <div className="stat-title text-sm flex items-center">
            流动性质押凭证SL代币
            <AddressWithCopyButton address={token.slTokenAddress as `0x${string}`} showAddress={false} />
            <AddToMetamask
              tokenAddress={token.slTokenAddress as `0x${string}`}
              tokenSymbol={'sl' + token.symbol}
              tokenDecimals={token.decimals}
            />
          </div>
          <div className="stat-value text-xl text-gray-600">
            {isPendingAccountStakeStatus ? <LoadingIcon /> : formatTokenAmount(slAmount || BigInt(0))}
          </div>
          <div className="stat-desc text-xs">
            <Button variant="link" className="text-secondary font-normal border-secondary" asChild>
              <Link href={`/gov/stakelp/?symbol=${token.symbol}`}>质押 获取治理票&nbsp;&gt;&gt;</Link>
            </Button>
          </div>
        </div>
        <div className="stat place-items-center pt-0 pb-1 pl-3">
          <div className="stat-title text-sm flex items-center">
            代币质押凭证ST代币
            <AddressWithCopyButton address={token.stTokenAddress as `0x${string}`} showAddress={false} />
            <AddToMetamask
              tokenAddress={token.stTokenAddress as `0x${string}`}
              tokenSymbol={'st' + token.symbol}
              tokenDecimals={token.decimals}
            />
          </div>
          <div className="stat-value text-xl text-gray-600">
            {isPendingAccountStakeStatus ? <LoadingIcon /> : formatTokenAmount(stAmount || BigInt(0))}
          </div>
          <div className="stat-desc text-xs">
            <Button variant="link" className="text-secondary font-normal border-secondary" asChild>
              <Link href={`/gov/staketoken?symbol=${token.symbol}`}>质押 增加治理收益&nbsp;&gt;&gt;</Link>
            </Button>
          </div>
        </div>
      </div>
      {validGovVotes <= BigInt(0) && govVotes && govVotes > BigInt(0) && (
        <div className="text-sm mb-4 text-greyscale-500 text-center">
          <div className="text-red-500">当前 sl 或 st 代币余额不足，导致有效治理票为0，请及时补足</div>
        </div>
      )}

      {enableWithdraw && (
        <>
          {/* 当用户还未申请取消质押时，显示三个按钮（从左至右依次为：授权 slToken、授权 stToken、取消质押） */}
          {!requestedUnstakeRound && (
            <>
              <div className="flex justify-center space-x-2 mt-2">
                <Button className="w-1/3" onClick={handleApproveSL} disabled={isApprovingSL || isSlTokenApproved}>
                  {isApprovingSL
                    ? '1.提交中...'
                    : isConfirmingApproveSL
                    ? '1.确认中...'
                    : isSlTokenApproved
                    ? `1.sl${token?.symbol} 已授权`
                    : `1.授权 sl${token?.symbol}`}
                </Button>
                <Button
                  className="w-1/3"
                  onClick={handleApproveST}
                  disabled={!isSlTokenApproved || isApprovingST || isStTokenApproved}
                >
                  {isApprovingST
                    ? '2.提交中...'
                    : isConfirmingApproveST
                    ? '2.确认中...'
                    : isStTokenApproved
                    ? `2.st${token?.symbol} 已授权`
                    : `2.授权 st${token?.symbol}`}
                </Button>
                <Button
                  className="w-1/3"
                  onClick={handleUnstake}
                  disabled={!allApproved || isPendingUnstake || isConfirmingUnstake || isConfirmedUnstake}
                >
                  {isPendingUnstake
                    ? '3.提交中'
                    : isConfirmingUnstake
                    ? '3.确认中'
                    : isConfirmedUnstake
                    ? '3.已取消质押'
                    : '3.取消质押'}
                </Button>
              </div>
              <div className="text-center mt-4 text-sm text-greyscale-600">
                解锁期，是从取消质押的阶段结束时开始计算
                <br />
                （现在取消质押后，投票轮第
                <span className="text-secondary mx-1">{`${
                  formatRoundForDisplay(currentRound, token) + (promisedWaitingPhases || BigInt(0)) + BigInt(1)
                } `}</span>
                轮才能取回代币）
              </div>
            </>
          )}
          {requestedUnstakeRound && (
            <>
              <div className="flex w-full justify-center mt-2">
                <Button
                  className="w-1/2"
                  onClick={handleWithdraw}
                  disabled={!canWithdraw || isPendingWithdraw || isConfirmingWithdraw || isConfirmedWithdraw}
                >
                  {!canWithdraw
                    ? '已取消,第' +
                      (formatRoundForDisplay(requestedUnstakeRound, token) +
                        (promisedWaitingPhases || BigInt(0)) +
                        BigInt(1)) +
                      '轮才可取回'
                    : isPendingWithdraw
                    ? '提交中'
                    : isConfirmingWithdraw
                    ? '确认中'
                    : isConfirmedWithdraw
                    ? '已取回'
                    : '取回质押代币'}
                </Button>
              </div>
            </>
          )}
        </>
      )}
      {!enableWithdraw && (
        <div className="flex justify-center space-x-4">
          <Button variant="outline" className="w-1/2 text-secondary border-secondary" asChild>
            <Link href={`/my/govrewards?symbol=${token.symbol}`}>铸造 治理激励 &gt;&gt;</Link>
          </Button>
          {requestedUnstakeRound && (
            <Button
              variant="outline"
              className={`w-1/2 ${
                canWithdraw ? 'text-secondary border-secondary' : 'text-greyscale-400 border-greyscale-400'
              } `}
              disabled={!canWithdraw}
              asChild
            >
              <Link href={`/gov/unstake/?symbol=${token.symbol}`}>
                {!canWithdraw
                  ? '已取消, 第' +
                    (formatRoundForDisplay(requestedUnstakeRound, token) +
                      (promisedWaitingPhases || BigInt(0)) +
                      BigInt(1)) +
                    '轮可取回'
                  : '取回质押代币'}
              </Link>
            </Button>
          )}
        </div>
      )}
      <LoadingOverlay
        isLoading={
          isApprovingSL ||
          isApprovingST ||
          isPendingWithdraw ||
          isPendingUnstake ||
          isConfirmingWithdraw ||
          isConfirmingUnstake
        }
        text={
          isPendingApproveSL || isPendingApproveST || isPendingWithdraw || isPendingUnstake
            ? '提交交易...'
            : '确认交易...'
        }
      />
    </>
  );
};

export default MyGovernanceAssetsPanel;
