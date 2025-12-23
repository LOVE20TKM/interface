'use client';

import React, { useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/router';
import Link from 'next/link';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useActionRewardsByAccountOfLastRounds } from '@/src/hooks/contracts/useLOVE20MintViewer';
import { useJoinedActions } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useMintActionReward } from '@/src/hooks/contracts/useLOVE20Mint';
import { useEstimateAccountScoresByActionIdsByRounds } from '@/src/hooks/composite/useEstimateAccountScoresByActionIdsByRounds';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import Header from '@/src/components/Header';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import InfoTooltip from '@/src/components/Common/InfoTooltip';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

// utils
import { formatTokenAmount, formatRoundForDisplay } from '@/src/lib/format';
import {
  setActionRewardNeedMinted,
  loadActionRewardNotice,
  buildActionRewardNoticeKey,
} from '@/src/lib/actionRewardNotice';

// types
import { JoinedAction, ActionReward } from '@/src/types/love20types';

const LAST_ROUNDS = BigInt(6);

type ActionRewardsGroup = {
  action: JoinedAction;
  rewards: ActionReward[];
};

const ActRewardsPage: React.FC = () => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取最近 N 轮的行动激励
  const {
    rewards,
    isPending: isLoadingRewards,
    error: errorLoadingRewards,
  } = useActionRewardsByAccountOfLastRounds(token?.address as `0x${string}`, account as `0x${string}`, LAST_ROUNDS);

  // 获取所有参与的行动
  const {
    joinedActions,
    isPending: isLoadingActions,
    error: errorLoadingActions,
  } = useJoinedActions(token?.address as `0x${string}`, account as `0x${string}`);

  // 将激励按行动分组（显示所有行动，没有激励的显示提示）
  const grouped = useMemo<ActionRewardsGroup[]>(() => {
    if (!joinedActions || !rewards) return [];

    // 创建激励映射
    const rewardsByAction = new Map<string, ActionReward[]>();
    for (const r of rewards) {
      if (r.reward <= BigInt(0)) continue;
      const key = r.actionId.toString();
      if (!rewardsByAction.has(key)) rewardsByAction.set(key, []);
      rewardsByAction.get(key)!.push(r);
    }

    // 为所有参与的行动创建分组，包括没有激励的行动
    const list: ActionRewardsGroup[] = [];
    for (const joinedAction of joinedActions) {
      const actionIdStr = String(joinedAction.action.head.id);
      const actionRewards = rewardsByAction.get(actionIdStr) || [];

      // 如果有激励，按轮次倒序排序
      if (actionRewards.length > 0) {
        actionRewards.sort((a, b) => (a.round > b.round ? -1 : 1));
      }

      list.push({ action: joinedAction, rewards: actionRewards });
    }

    // 按行动 id 倒序
    list.sort((a, b) => (BigInt(a.action.action.head.id) > BigInt(b.action.action.head.id) ? -1 : 1));
    return list;
  }, [joinedActions, rewards]);

  // 准备得分查询参数：从 rewards 中提取实际存在的 (actionId, round) 组合
  const scoreQueryParams = useMemo(() => {
    if (!rewards || rewards.length === 0) {
      return { actionRoundPairs: [], enabled: false };
    }

    // 从 rewards 中提取所有有激励的 (actionId, round) 组合
    // 按轮次倒序排列，确保最新轮次优先加载
    const pairs = rewards
      .filter((r) => r.reward > BigInt(0)) // 只查询有激励的记录
      .map((r) => ({
        actionId: r.actionId,
        round: r.round,
      }))
      .sort((a, b) => (a.round > b.round ? -1 : 1)); // 按轮次倒序

    return {
      actionRoundPairs: pairs,
      enabled: pairs.length > 0,
    };
  }, [rewards]);

  // 获取得分数据
  const {
    scores: accountScores,
    isLoading: isLoadingScores,
    hasError: hasScoreError,
  } = useEstimateAccountScoresByActionIdsByRounds({
    account: account as `0x${string}`,
    tokenAddress: token?.address as `0x${string}`,
    actionRoundPairs: scoreQueryParams.actionRoundPairs,
    // enabled: scoreQueryParams.enabled && !!account && !!token?.address,
    enabled: false,
  });

  // 铸造行动激励
  const { mintActionReward, isPending, isConfirming, isConfirmed, writeError } = useMintActionReward();
  const [mintingTarget, setMintingTarget] = useState<{ actionId: bigint; round: bigint } | null>(null);
  const [locallyMinted, setLocallyMinted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isConfirmed) {
      toast.success('铸造成功');
      if (mintingTarget) {
        const key = `${mintingTarget.actionId.toString()}-${mintingTarget.round.toString()}`;
        setLocallyMinted((prev) => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      }
      if (typeof window !== 'undefined' && token?.address && account) {
        setActionRewardNeedMinted(account, token.address, false);
      }
    }
  }, [isConfirmed, mintingTarget, token?.address, account]);

  // 账号或 Token 切换时重置本地已铸造集合
  useEffect(() => {
    setLocallyMinted(new Set());
  }, [token?.address, account]);

  // 检查是否有未铸造的激励，如果没有则清除 localStorage 缓存
  useEffect(() => {
    if (!token?.address || !account || isLoadingRewards || !rewards) return;

    // 检查是否存在未铸造的激励
    const hasUnmintedRewards = rewards.some((r) => r.reward > BigInt(0) && !r.isMinted);

    // 如果没有未铸造的激励，且本地缓存显示需要铸造，则清除缓存
    if (!hasUnmintedRewards) {
      const cached = loadActionRewardNotice(account, token.address);
      if (cached?.needMinted) {
        // 清除 localStorage 缓存
        const cacheKey = buildActionRewardNoticeKey(account, token.address);
        localStorage.removeItem(cacheKey);
        // 触发全局事件通知其他组件更新
        setActionRewardNeedMinted(account, token.address, false);
      }
    }
  }, [token?.address, account, isLoadingRewards, rewards]);

  const handleClaim = async (round: bigint, actionId: bigint) => {
    if (token?.address && account) {
      setMintingTarget({ actionId, round });
      await mintActionReward(token.address, round, actionId);
    }
  };

  // 结合本地已铸造集合和得分数据覆盖 UI 展示
  const displayedGroups = useMemo(() => {
    if (!grouped) return [];
    return grouped.map((g) => ({
      ...g,
      rewards: g.rewards.map((r) => {
        const key = `${BigInt(g.action.action.head.id).toString()}-${r.round.toString()}`;
        const actionIdStr = g.action.action.head.id.toString();
        const roundStr = r.round.toString();

        // 获取该行动该轮次的得分
        const score = accountScores?.[actionIdStr]?.[roundStr];

        // 判断该得分是否还在加载中
        // 如果整体还在加载且该得分不存在，说明还未加载到这个轮次
        const isScoreLoading = isLoadingScores && !score;

        return {
          ...r,
          isMinted: locallyMinted.has(key) || r.isMinted,
          score: score || '0.0', // 添加得分字段
          isScoreLoading, // 添加加载状态字段
        };
      }),
    }));
  }, [grouped, locallyMinted, accountScores, isLoadingScores]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorLoadingRewards) handleContractError(errorLoadingRewards, 'dataViewer');
    if (errorLoadingActions) handleContractError(errorLoadingActions, 'dataViewer');
    if (writeError) handleContractError(writeError, 'mint');
  }, [errorLoadingRewards, errorLoadingActions, writeError, handleContractError]);

  return (
    <>
      <Header title="行动激励" showBackButton={true} />
      <main className="flex-grow">
        {!token ? (
          <LoadingIcon />
        ) : (
          <div className="flex flex-col space-y-6 p-4">
            <div className="flex justify-between items-center">
              <LeftTitle title="铸造行动激励" />
              <button
                onClick={() => router.push(`/my/queryaction?symbol=${token?.symbol}`)}
                className="text-secondary hover:text-secondary/80 text-sm bg-transparent border-none cursor-pointer"
              >
                查看已退出行动激励&nbsp;&gt;&gt;
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-500 text-sm">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">小贴士：</span>
                  <br />
                  如果对激励打分有疑问，可以
                  <br />
                  1. 仔细阅读行动打分规则，检查是否按要求打卡；
                  <br />
                  2. 请教周围的治理者或志愿者；
                </div>
              </div>
            </div>

            {isLoadingRewards || isLoadingActions ? (
              <LoadingIcon />
            ) : displayedGroups.length > 0 ? (
              displayedGroups.map((group) => (
                <div key={group.action.action.head.id} className="border border-gray-100 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="flex items-baseline  mr-2">
                      <span className="text-greyscale-500">No.</span>
                      <span className="text-secondary text-xl font-bold mr-2">
                        {String(group.action.action.head.id)}
                      </span>
                      <span className="font-bold text-greyscale-800">{`${group.action.action.body.title}`}</span>
                    </div>
                  </div>

                  {group.rewards.length > 0 ? (
                    <>
                      <table className="table w-full table-auto">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left px-0">轮次</th>
                            {/* <th className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                验证得分
                                <InfoTooltip
                                  title="验证得分说明"
                                  content="这个得分，是根据最终激励，估算的平均得分。   （具体算法：将所有地址中实际得分最高者，作为100分，然后将你的实际得分等比例换算到0~100）"
                                />
                              </div>
                            </th> */}
                            <th className="text-center">可铸造激励</th>
                            <th className="text-center">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.rewards.map((item, index) => (
                            <tr
                              key={`${group.action.action.head.id}-${item.round.toString()}`}
                              className={
                                index === group.rewards.length - 1 ? 'border-none' : 'border-b border-gray-100'
                              }
                            >
                              <td className="px-1">{formatRoundForDisplay(item.round, token).toString()}</td>
                              {/* <td className="text-center px-1">
                                {item.isScoreLoading ? (
                                  <div className="flex justify-center items-center">
                                    <LoadingIcon />
                                  </div>
                                ) : item.score && parseFloat(item.score) > 0 ? (
                                  <Link
                                    href={`/verify/detail?symbol=${
                                      token?.symbol
                                    }&id=${group.action.action.head.id.toString()}&round=${item.round.toString()}`}
                                    rel="noopener noreferrer"
                                    className="text-secondary hover:text-secondary/80 underline text-sm"
                                  >
                                    {item.score}
                                  </Link>
                                ) : (
                                  <span className="text-greyscale-500">-</span>
                                )}
                              </td> */}
                              <td className="text-center px-1">{formatTokenAmount(item.reward || BigInt(0))}</td>
                              <td className="text-center px-1">
                                {item.reward > BigInt(0) && !item.isMinted ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-secondary border-secondary"
                                    onClick={() => handleClaim(item.round, BigInt(group.action.action.head.id))}
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
                          ))}
                        </tbody>
                      </table>
                    </>
                  ) : (
                    <div className="text-center text-greyscale-500 py-4">
                      该行动最近 {LAST_ROUNDS.toString()} 轮没有获得激励
                    </div>
                  )}

                  <div className="text-center">
                    <button
                      onClick={() => router.push(`/my/rewardsofaction?id=${group.action.action.head.id}`)}
                      className="text-secondary hover:text-secondary/80 underline text-sm bg-transparent border-none cursor-pointer"
                    >
                      查看更多激励 &gt;&gt;
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-greyscale-500 py-8">没有参与任何行动</div>
            )}
          </div>
        )}
        <LoadingOverlay isLoading={isPending || isConfirming} text={isPending ? '提交交易...' : '确认交易...'} />
      </main>
    </>
  );
};

export default ActRewardsPage;
