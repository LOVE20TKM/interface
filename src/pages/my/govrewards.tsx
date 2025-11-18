'use client';

import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Info } from 'lucide-react';

// my functions & types
import { formatTokenAmount, formatRoundForDisplay } from '@/src/lib/format';
import { GovReward } from '@/src/types/love20types';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useGovRewardsByAccountByRounds } from '@/src/hooks/contracts/useLOVE20MintViewer';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';
import { useMintGovReward } from '@/src/hooks/contracts/useLOVE20Mint';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import Header from '@/src/components/Header';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

const REWARDS_PER_PAGE = BigInt(20);

const GovRewardsPage: React.FC = () => {
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();
  const { currentRound, error: errorCurrentRound, isPending: isLoadingCurrentRound } = useCurrentRound();
  const [startRound, setStartRound] = useState<bigint>(BigInt(0));
  const [endRound, setEndRound] = useState<bigint>(BigInt(0));
  const [hasMoreRewards, setHasMoreRewards] = useState(true);

  // 引入参考元素，用于无限滚动加载
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentRound !== undefined && token) {
      if (currentRound <= BigInt(token.initialStakeRound)) {
        setEndRound(BigInt(0));
      } else {
        setEndRound(BigInt(currentRound >= BigInt(1) ? currentRound - BigInt(1) : BigInt(0)));
      }
    }
  }, [currentRound, token]);

  useEffect(() => {
    if (endRound && token) {
      // 初始加载20个轮次数据，如果可加载数量超过20，则初始显示最近20轮，否则显示全部
      if (endRound - BigInt(token.initialStakeRound) >= REWARDS_PER_PAGE) {
        setStartRound(endRound - REWARDS_PER_PAGE);
      } else {
        setStartRound(BigInt(token.initialStakeRound));
      }
    }
  }, [endRound, token]);

  // 获取治理激励数据
  const {
    rewards,
    isPending: isLoadingRewards,
    error: errorLoadingRewards,
  } = useGovRewardsByAccountByRounds(token?.address as `0x${string}`, account as `0x${string}`, startRound, endRound);

  const [rewardList, setRewardList] = useState<GovReward[]>([]);
  useEffect(() => {
    if (rewards) {
      const sortedRewards = [...rewards].sort((a, b) => (a.round > b.round ? -1 : 1)); // 按 round 倒序排列
      setRewardList(sortedRewards);
    }
  }, [rewards]);

  // 根据当前起始轮次判断是否还有更多可以加载
  useEffect(() => {
    if (!token) return;
    const initialStake = BigInt(token.initialStakeRound);
    setHasMoreRewards(startRound > initialStake);
  }, [startRound, token]);

  // 铸造治理激励
  const { mintGovReward, isPending, isConfirming, isConfirmed, writeError: errorMintGovReward } = useMintGovReward();
  const [mintingRound, setMintingRound] = useState<bigint | null>(null);
  useEffect(() => {
    if (isConfirmed) {
      setRewardList((prev) => prev.map((item) => (item.round === mintingRound ? { ...item, isMinted: true } : item)));
      toast.success(`铸造成功`);
    }
  }, [isConfirmed, mintingRound]);

  const handleClaim = async (round: bigint) => {
    if (token?.address && account) {
      setMintingRound(round);
      await mintGovReward(token.address, round);
    }
  };

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorLoadingRewards) {
      handleContractError(errorLoadingRewards, 'dataViewer');
    }
    if (errorCurrentRound) {
      handleContractError(errorCurrentRound, 'mint');
    }
    if (errorMintGovReward) {
      handleContractError(errorMintGovReward, 'mint');
    }
  }, [errorLoadingRewards, errorCurrentRound, errorMintGovReward, handleContractError]);

  // 无限滚动加载更多激励：当滚动到底部时更新 startRound
  const loadMoreRewards = useCallback(() => {
    if (!token) return;
    const initialStake = BigInt(token.initialStakeRound);
    // 使用函数式更新，确保拿到最新的 startRound
    setStartRound((prev) => {
      if (prev > initialStake) {
        const newStart = prev - REWARDS_PER_PAGE >= initialStake ? prev - REWARDS_PER_PAGE : initialStake;
        return newStart;
      }
      return prev;
    });
  }, [token]);

  // 使用 IntersectionObserver 监控底部 sentinel 元素
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const target = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!isLoadingRewards && hasMoreRewards) {
              loadMoreRewards();
            }
          }
        });
      },
      { root: null, rootMargin: '200px', threshold: 0 },
    );
    observer.observe(target);
    return () => {
      observer.unobserve(target);
      observer.disconnect();
    };
  }, [loadMoreRewards, isLoadingRewards, hasMoreRewards]);

  if (isLoadingCurrentRound) {
    return <LoadingIcon />;
  }

  return (
    <>
      <Header title="治理激励" showBackButton={true} />
      <main className="flex-grow">
        {!token ? (
          <LoadingIcon />
        ) : (
          <div className="flex flex-col space-y-2 p-4">
            <LeftTitle title="铸造治理激励" />

            {endRound === BigInt(0) && currentRound !== undefined ? (
              <div className="text-center text-gray-500 py-4">当前还不能铸造激励，请耐心等待</div>
            ) : (
              <>
                <table className="table w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th>轮次</th>
                      <th className="text-center px-1">总激励</th>
                      <th className="text-center px-2">
                        <div className="inline-flex items-center justify-center">
                          <span>验证激励</span>
                          <Link
                            href={`/stake/stakelp/?symbol=${token?.symbol || ''}`}
                            className="ml-1 text-greyscale-500 hover:text-secondary"
                            aria-label="验证激励说明"
                            title="验证激励说明"
                          >
                            <Info size={16} />
                          </Link>
                        </div>
                      </th>
                      <th className="text-center px-2">
                        <div className="inline-flex items-center justify-center">
                          <span>加速激励</span>
                          <Link
                            href={`/stake/staketoken/?symbol=${token?.symbol || ''}`}
                            className="ml-1 text-greyscale-500 hover:text-secondary"
                            aria-label="加速激励说明"
                            title="加速激励说明"
                          >
                            <Info size={16} />
                          </Link>
                        </div>
                      </th>
                      <th className="text-center px-2">结果</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rewardList.length === 0 && !isLoadingRewards ? (
                      <tr>
                        <td colSpan={3} className="text-center text-sm text-gray-500 py-4">
                          暂无数据
                        </td>
                      </tr>
                    ) : (
                      rewardList.map((item) => (
                        <tr key={item.round.toString()} className="border-b border-gray-200">
                          <td>{token ? formatRoundForDisplay(item.round, token).toString() : '-'}</td>
                          <td className="text-center px-1">{formatTokenAmount(item.reward || BigInt(0))}</td>
                          <td className="text-center px-2 bg-greyscale-100">
                            {formatTokenAmount(item.verifyReward || BigInt(0))}
                          </td>
                          <td className="text-center px-2 bg-greyscale-100">
                            {formatTokenAmount(item.boostReward || BigInt(0))}
                          </td>
                          <td className="text-center px-2">
                            {item.reward > BigInt(0) && !item.isMinted ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-secondary border-secondary"
                                onClick={() => handleClaim(item.round)}
                                disabled={isPending || isConfirming}
                              >
                                铸造
                              </Button>
                            ) : item.isMinted ? (
                              <span className="text-greyscale-500">已铸造</span>
                            ) : (
                              <span className="text-greyscale-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div ref={loadMoreRef} className="h-12 flex justify-center items-center">
                  {isLoadingRewards ? (
                    <LoadingIcon />
                  ) : hasMoreRewards ? (
                    <span className="text-sm text-gray-500">加载更多...</span>
                  ) : (
                    <span className="text-sm text-gray-500">没有更多激励</span>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        <LoadingOverlay isLoading={isPending || isConfirming} text={isPending ? '提交交易...' : '确认交易...'} />
      </main>
    </>
  );
};

export default GovRewardsPage;
