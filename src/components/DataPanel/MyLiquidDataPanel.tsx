'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React, { useContext } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';

// my hooks
import { formatTokenAmount } from '@/src/lib/format';
import { getMissingStakeReceiptAmount } from '@/src/lib/domainUtils';
import { useAccountStakeStatus } from '@/src/hooks/contracts/useLOVE20Stake';
import { useTokenAmountsBySlAmount } from '@/src/hooks/contracts/useLOVE20SLToken';
import { useBalanceOf } from '@/src/hooks/contracts/useLOVE20Token';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

interface MyLiquidDataPanelProps {}

const MyLiquidDataPanel: React.FC<MyLiquidDataPanelProps> = ({}) => {
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取用户的质押状态，包含 sl 数量
  const {
    slAmount,
    stAmount,
    requestedUnstakeRound,
    isPending: isPendingStakeStatus,
    error: errorStakeStatus,
  } = useAccountStakeStatus((token?.address as `0x${string}`) || '', (account as `0x${string}`) || '');

  // 页面余额显示钱包当前实际持有的 SL/ST；质押记录只用于判断缺口。
  const {
    balance: slBalance,
    isPending: isPendingSlBalance,
    error: errorSlBalance,
  } = useBalanceOf(
    (token?.slTokenAddress as `0x${string}`) || '',
    (account as `0x${string}`) || '',
    !!token?.slTokenAddress && !!account,
  );
  const {
    balance: stBalance,
    isPending: isPendingStBalance,
    error: errorStBalance,
  } = useBalanceOf(
    (token?.stTokenAddress as `0x${string}`) || '',
    (account as `0x${string}`) || '',
    !!token?.stTokenAddress && !!account,
  );

  const hasStake = slAmount !== undefined && slAmount > BigInt(0);
  const isUnstaking = requestedUnstakeRound !== undefined && requestedUnstakeRound > BigInt(0);
  const displayedSlAmount = slBalance ?? BigInt(0);
  const missingSlAmount = getMissingStakeReceiptAmount(slAmount, slBalance, requestedUnstakeRound);
  const missingStAmount = getMissingStakeReceiptAmount(stAmount, stBalance, requestedUnstakeRound);
  const slBalanceReadFailed = !!errorSlBalance || slBalance === undefined;
  const stakeStatusReadFailed = !!errorStakeStatus;
  const convertibleSlAmount = isUnstaking ? slAmount ?? BigInt(0) : slBalance ?? BigInt(0);
  const balanceReadFailed = !!errorSlBalance || !!errorStBalance || slBalance === undefined || stBalance === undefined;

  // 根据 sl 数量获取可以换回的代币数量
  const {
    tokenAmountsBySlAmount,
    isPending: isPendingTokenAmounts,
    error: errorTokenAmounts,
  } = useTokenAmountsBySlAmount((token?.slTokenAddress as `0x${string}`) || '', convertibleSlAmount);
  const conversionReadFailed = stakeStatusReadFailed || !!errorTokenAmounts || slBalanceReadFailed;

  if (!account) {
    return (
      <div className="flex-col items-center px-6">
        <LeftTitle title="我的流动性质押" />
        <div className="text-sm mt-4 text-greyscale-500 text-center">请先连接钱包</div>
      </div>
    );
  }

  // 只有在真正需要等待数据时才显示加载状态
  // 如果stake状态正在加载，显示加载
  // 如果有sl代币且正在查询token amounts，显示加载
  if (
    !token ||
    isPendingStakeStatus ||
    isPendingSlBalance ||
    isPendingStBalance ||
    (convertibleSlAmount > BigInt(0) && isPendingTokenAmounts)
  ) {
    return <LoadingIcon />;
  }

  return (
    <div className="flex-col items-center px-6">
      <LeftTitle title="我的流动性质押" />
      <div className="border rounded-lg my-4">
        <div className="stats w-full">
          <div className="stat place-items-center pb-0">
            <div className="stat-title">钱包流动性质押凭证 sl{token?.symbol} 余额</div>
            <div className="stat-value text-data-personal text-2xl">
              {errorSlBalance ? '读取失败' : formatTokenAmount(displayedSlAmount)}
            </div>
          </div>
        </div>
        <div className="stats rounded-lg w-full grid grid-cols-2 divide-x-0 mt-2">
          <div className="stat place-items-center pt-3 ">
            <div className="stat-title text-sm">可换回 {token?.symbol} 数量</div>
            <div className="stat-value text-xl text-data-personal">
              {conversionReadFailed
                ? '读取失败'
                : formatTokenAmount(tokenAmountsBySlAmount?.tokenAmount || BigInt(0))}
            </div>
          </div>
          <div className="stat place-items-center pt-3 ">
            <div className="stat-title text-sm">可换回 {token?.parentTokenSymbol} 数量</div>
            <div className="stat-value text-xl text-data-personal">
              {conversionReadFailed
                ? '读取失败'
                : formatTokenAmount(tokenAmountsBySlAmount?.parentTokenAmount || BigInt(0))}
            </div>
          </div>
        </div>
      </div>

      {isUnstaking && (
        <div className="mb-4 text-center text-sm text-status-info">
          已申请解锁，可查看进度或取回质押资产。
        </div>
      )}

      {!isUnstaking &&
        (stakeStatusReadFailed ||
          (hasStake && balanceReadFailed) ||
          missingSlAmount > BigInt(0) ||
          missingStAmount > BigInt(0)) && (
        <div className="mb-4 space-y-1 text-center text-sm text-status-error">
          {stakeStatusReadFailed ? (
            <div>质押状态读取失败，暂时无法计算需补充数量。</div>
          ) : balanceReadFailed ? (
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

      <div className="flex justify-center">
        <Button variant="outline" className="w-1/2 text-secondary border-secondary" asChild>
          <Link href={isUnstaking ? `/stake/unstake?symbol=${token?.symbol}` : `/stake/stakelp/?symbol=${token?.symbol}`}>
            {isUnstaking ? '查看解锁进度 >>' : '质押获取治理票 >>'}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default MyLiquidDataPanel;
