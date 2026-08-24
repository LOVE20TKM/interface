import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { formatUnits } from 'viem';

// my funcs
import { formatPercentage, formatTokenAmount } from '@/src/lib/format';
import { formatPhaseText, getMissingStakeReceiptAmount } from '@/src/lib/domainUtils';

// my hooks
import { useAccountStakeStatus } from '@/src/hooks/contracts/useLOVE20Stake';
import { useMyGovData } from '@/src/hooks/composite/useMyGovData';
import { useEstimatedGovRewardOfCurrentRound } from '@/src/hooks/contracts/useLOVE20MintViewer';
import { useBalanceOf } from '@/src/hooks/contracts/useLOVE20Token';

// my contexts
import { Token } from '@/src/contexts/TokenContext';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import { GovernanceApyCard } from '@/src/components/DataPanel/GovernanceDataPanel';

interface MyGovInfoPanelProps {
  token: Token | null | undefined;
  enableWithdraw?: boolean;
}

const MyGovInfoPanel: React.FC<MyGovInfoPanelProps> = ({ token }) => {
  const { address: account } = useAccount();

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
  const hasStake = slAmount !== undefined && slAmount > BigInt(0);

  const {
    balance: slBalance,
    isPending: isPendingSlBalance,
    error: errorSlBalance,
  } = useBalanceOf(
    token?.slTokenAddress as `0x${string}`,
    account as `0x${string}`,
    hasStake && !!token?.slTokenAddress && !!account,
  );
  const {
    balance: stBalance,
    isPending: isPendingStBalance,
    error: errorStBalance,
  } = useBalanceOf(
    token?.stTokenAddress as `0x${string}`,
    account as `0x${string}`,
    hasStake && !!token?.stTokenAddress && !!account,
  );

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
  const { reward: expectedReward, isPending: isPendingEstimatedGovReward } = useEstimatedGovRewardOfCurrentRound(
    (token?.address as `0x${string}`) || '',
  );

  // 加速激励只对当前有效治理者生效：SL/ST 任一凭证不足时，治理票和加速占比都归零。
  const tokenStakedPercentage =
    validGovVotes && validGovVotes > BigInt(0) && stAmount && govData?.stAmount
      ? (Number(stAmount) / Number(govData.stAmount)) * 100
      : 0;

  const isPendingGovRewards = isPendingGovData || isPendingAccountStakeStatus;

  if (
    !token ||
    isPendingAccountStakeStatus ||
    (hasStake && (isPendingSlBalance || isPendingStBalance))
  ) {
    return <LoadingIcon />;
  }
  if (errorAccountStakeStatus) {
    return <div className="py-4 text-center text-sm text-status-error">质押状态读取失败，暂时无法判断治理资产</div>;
  }
  if (!isPendingAccountStakeStatus && !slAmount) {
    return (
      <div className="py-1">
        <GovernanceApyCard
          isPending={isPendingGovData || isPendingEstimatedGovReward}
          expectedReward={expectedReward}
          tokenAmountForSl={govData?.tokenAmountForSl}
          stAmount={govData?.stAmount}
        />
      </div>
    );
  }

  const balanceReadFailed = !!errorSlBalance || !!errorStBalance || slBalance === undefined || stBalance === undefined;
  const missingSlAmount = getMissingStakeReceiptAmount(slAmount, slBalance, requestedUnstakeRound);
  const missingStAmount = getMissingStakeReceiptAmount(stAmount, stBalance, requestedUnstakeRound);

  return (
    <>
      <div className="stats w-full grid grid-cols-2 divide-x-0 ">
        <div className="stat place-items-center pt-0 pb-1 pl-1">
          <div className="stat-title text-sm">我的有效治理票数</div>
          <div className="stat-value text-xl text-data-personal">
            {isPendingGovData ? (
              <LoadingIcon />
            ) : errorGovData || validGovVotes === undefined ? (
              '读取失败'
            ) : (
              formatTokenAmount(validGovVotes)
            )}
          </div>
          <div className="stat-desc text-xs mb-2 mt-1">
            {requestedUnstakeRound && requestedUnstakeRound > BigInt(0) && '注意：已申请解锁，治理票数为0'}
          </div>
        </div>
        <div className="stat place-items-center pt-0 pb-1 pl-1">
          <div className="stat-title text-sm">我承诺的解锁期</div>
          <div className="stat-value text-lg">
            <span className="text-data-personal">
              {isPendingAccountStakeStatus ? <LoadingIcon /> : `${promisedWaitingPhases || BigInt(0)} `}
            </span>
            <span className="text-sm text-greyscale-600"> 阶段</span>
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
          <div className="stat-value text-xl text-data-personal">
            {isPendingGovData ? (
              <LoadingIcon />
            ) : errorGovData || validGovVotes === undefined || !govData ? (
              '读取失败'
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
          <div className="stat-value text-xl text-data-personal">
            {isPendingGovRewards ? (
              <LoadingIcon />
            ) : errorGovData || validGovVotes === undefined || !govData ? (
              '读取失败'
            ) : (
              formatPercentage(tokenStakedPercentage.toString())
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
        !errorGovData &&
        validGovVotes !== undefined &&
        govVotes !== undefined &&
        validGovVotes <= BigInt(0) &&
        govVotes > BigInt(0) && (
          <div className="mb-4 space-y-1 text-center text-sm text-status-error">
            {balanceReadFailed ? (
              <div>SL/ST 凭证余额读取失败，暂时无法计算需补充数量。</div>
            ) : (
              <>
                <div>治理票已失效，请补充：</div>
                {missingSlAmount > BigInt(0) && (
                  <div title={`精确数量：${formatUnits(missingSlAmount, token.decimals)}`}>
                    SL 凭证 {formatTokenAmount(missingSlAmount, 4, 'ceil')}
                  </div>
                )}
                {missingStAmount > BigInt(0) && (
                  <div title={`精确数量：${formatUnits(missingStAmount, token.decimals)}`}>
                    ST 凭证 {formatTokenAmount(missingStAmount, 4, 'ceil')}
                  </div>
                )}
                <div>补足后可恢复治理票，继续参与治理或取消质押。</div>
              </>
            )}
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
