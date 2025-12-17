import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import Link from 'next/link';

// my funcs
import { formatPercentage, formatTokenAmount } from '@/src/lib/format';
import { formatPhaseText } from '@/src/lib/domainUtils';

// my hooks
import { useHandleContractError } from '@/src/lib/errorUtils';
import { useAccountStakeStatus, useCurrentRound } from '@/src/hooks/contracts/useLOVE20Stake';
import { useMyGovData } from '@/src/hooks/composite/useMyGovData';

// my contexts
import { Token } from '@/src/contexts/TokenContext';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';

interface MyGovInfoPanelProps {
  token: Token | null | undefined;
  enableWithdraw?: boolean;
}

const MyGovInfoPanel: React.FC<MyGovInfoPanelProps> = ({ token, enableWithdraw = false }) => {
  const { address: account } = useAccount();

  // Hook：获取当前轮次
  const { currentRound, isPending: isPendingCurrentRound, error: errorCurrentRound } = useCurrentRound(enableWithdraw);

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

  // 获取治理票数据（合并RPC调用）
  const {
    validGovVotes,
    govData,
    governancePercentage,
    isPending: isPendingGovData,
    error: errorGovData,
  } = useMyGovData({
    tokenAddress: token?.address as `0x${string}`,
    account: account as `0x${string}`,
  });

  // // 获取上一轮次的治理奖励（用于计算加速激励倍数）
  // const {
  //   rewards: govRewards,
  //   isPending: isPendingGovRewards,
  //   error: errorGovRewards,
  // } = useGovRewardsByAccountByRounds(
  //   (token?.address as `0x${string}`) || '',
  //   (account as `0x${string}`) || '',
  //   currentRound > BigInt(3) ? currentRound - BigInt(3) : BigInt(0),
  //   currentRound > BigInt(3) ? currentRound - BigInt(3) : BigInt(0),
  // );

  // 我的加速激励的质押占比
  const tokenStakedPercentage = stAmount && govData?.stAmount ? (Number(stAmount) / Number(govData.stAmount)) * 100 : 0;

  // // 计算加速激励倍数
  // const lastRoundReward = govRewards?.[0];
  // const boostMultiplier =
  //   lastRoundReward?.verifyReward && lastRoundReward?.boostReward
  //     ? (Number(lastRoundReward.boostReward) * 100) / Number(lastRoundReward.verifyReward)
  //     : 0;

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorAccountStakeStatus) {
      handleContractError(errorAccountStakeStatus, 'stake');
    }

    if (errorCurrentRound) {
      handleContractError(errorCurrentRound, 'stake');
    }

    // if (errorGovRewards) {
    //   handleContractError(errorGovRewards, 'stake');
    // }

    if (errorGovData) {
      handleContractError(errorGovData, 'common');
    }
  }, [errorAccountStakeStatus, errorCurrentRound, errorGovData]);

  const isPendingGovRewards = isPendingGovData || isPendingAccountStakeStatus;

  if (!token || (enableWithdraw && isPendingCurrentRound) || isPendingAccountStakeStatus) {
    return <LoadingIcon />;
  }
  if (!isPendingAccountStakeStatus && !slAmount) {
    return <div className="text-sm mt-4 text-greyscale-500 text-center">您没有质押</div>;
  }

  return (
    <>
      <div className="stats w-full grid grid-cols-2 divide-x-0 ">
        <div className="stat place-items-center pt-0 pb-1 pl-1">
          <div className="stat-title text-sm">我的治理票数</div>
          <div className="stat-value text-xl text-secondary">
            {isPendingAccountStakeStatus ? <LoadingIcon /> : formatTokenAmount(validGovVotes || BigInt(0))}
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
          <div className="stat-title text-sm flex items-center">我的治理票占比</div>
          <div className="stat-value text-xl text-secondary">
            {isPendingGovData || isPendingGovData ? (
              <LoadingIcon />
            ) : (
              `${formatPercentage(governancePercentage.toString())}`
            )}
          </div>
          <div className="stat-desc text-xs">
            <Button variant="link" className="text-secondary font-normal border-secondary" asChild>
              <Link href={`/stake/stakelp/?symbol=${token.symbol}`}>质押 获取治理票&nbsp;&gt;&gt;</Link>
            </Button>
          </div>
        </div>
        <div className="stat place-items-center pt-0 pb-1 pl-1">
          <div className="stat-title text-sm flex items-center">加速激励质押占比</div>
          <div className="stat-value text-xl text-secondary">
            {isPendingGovRewards || !currentRound ? (
              <LoadingIcon />
            ) : tokenStakedPercentage > 0 ? (
              formatPercentage(tokenStakedPercentage.toString())
            ) : (
              '-'
            )}
          </div>
          <div className="stat-desc text-xs">
            <Button variant="link" className="text-secondary font-normal border-secondary" asChild>
              <Link href={`/stake/staketoken?symbol=${token.symbol}`}>质押 增加治理收益&nbsp;&gt;&gt;</Link>
            </Button>
          </div>
        </div>
      </div>
      {!isPendingGovData &&
        !isPendingAccountStakeStatus &&
        validGovVotes !== undefined &&
        govVotes !== undefined &&
        validGovVotes <= BigInt(0) &&
        govVotes > BigInt(0) && (
          <div className="text-sm mb-4 text-greyscale-500 text-center">
            <div className="text-red-500">当前 sl 或 st 代币余额不足，导致有效治理票为0，请及时补足</div>
          </div>
        )}

      <div className="flex justify-center space-x-4">
        <Button variant="outline" className="w-1/2 text-secondary border-secondary" asChild>
          <Link href={`/my/govrewards?symbol=${token.symbol}`}>铸造 治理激励 &gt;&gt;</Link>
        </Button>
      </div>
    </>
  );
};

export default MyGovInfoPanel;
