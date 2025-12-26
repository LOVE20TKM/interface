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
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';
import {
  useEstimateAccountScoresByActionIdsByRounds,
  getScoreCache,
} from '@/src/hooks/composite/useEstimateAccountScoresByActionIdsByRounds';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import Header from '@/src/components/Header';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import InfoTooltip from '@/src/components/Common/InfoTooltip';
import ActionRewardScoreCell from '@/src/components/My/ActionRewardScoreCell';
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
  rewards: (ActionReward & { notSelected?: boolean })[];
};

const ActRewardsPage: React.FC = () => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取当前轮次
  const { currentRound, isPending: isLoadingCurrentRound } = useCurrentRound();

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

  // 将激励按行动分组（显示所有行动，包括未抽中的轮次）
  const grouped = useMemo<ActionRewardsGroup[]>(() => {
    if (!joinedActions || !rewards || currentRound === undefined) return [];

    // 计算需要显示的轮次范围
    const startRound = currentRound > LAST_ROUNDS ? currentRound - LAST_ROUNDS - BigInt(1) : BigInt(0);
    const endRound = currentRound - BigInt(1);

    // 创建激励映射：actionId -> round -> ActionReward
    const rewardsByActionAndRound = new Map<string, Map<string, ActionReward>>();
    for (const r of rewards) {
      if (r.reward <= BigInt(0)) continue;
      const actionKey = r.actionId.toString();
      const roundKey = r.round.toString();

      if (!rewardsByActionAndRound.has(actionKey)) {
        rewardsByActionAndRound.set(actionKey, new Map());
      }
      rewardsByActionAndRound.get(actionKey)!.set(roundKey, r);
    }

    // 为所有参与的行动创建分组，包括完整的轮次列表
    const list: ActionRewardsGroup[] = [];
    for (const joinedAction of joinedActions) {
      const actionId = joinedAction.action.head.id;
      const actionIdStr = actionId.toString();
      const actionRewardsMap = rewardsByActionAndRound.get(actionIdStr);

      // 生成完整的轮次列表（从 startRound 到 endRound）
      const completeRewards: (ActionReward & { notSelected?: boolean })[] = [];
      for (let round = endRound; round >= startRound; round--) {
        const roundStr = round.toString();
        const existingReward = actionRewardsMap?.get(roundStr);

        if (existingReward) {
          // 有激励记录
          completeRewards.push(existingReward);
        } else {
          // 没有激励记录，标记为未抽中
          completeRewards.push({
            actionId: actionId,
            round: round,
            reward: BigInt(0),
            isMinted: false,
            notSelected: true, // 标记为未抽中
          });
        }
      }

      list.push({ action: joinedAction, rewards: completeRewards });
    }

    // 按行动 id 倒序
    list.sort((a, b) => (BigInt(a.action.action.head.id) > BigInt(b.action.action.head.id) ? -1 : 1));
    return list;
  }, [joinedActions, rewards, currentRound]);

  // 计算每个行动的最后一轮（有记录的数据中 round 值最大的）
  const lastRoundByAction = useMemo(() => {
    const map = new Map<string, bigint>();
    if (!rewards) return map;

    for (const r of rewards) {
      const actionIdStr = r.actionId.toString();
      const existing = map.get(actionIdStr);
      if (!existing || r.round > existing) {
        map.set(actionIdStr, r.round);
      }
    }
    return map;
  }, [rewards]);

  // 准备得分查询参数：只查询每个行动的最后一轮
  const scoreQueryParams = useMemo(() => {
    if (!rewards || rewards.length === 0 || lastRoundByAction.size === 0) {
      return { actionRoundPairs: [], enabled: false };
    }

    // 只提取每个行动的最后一轮
    const pairs: { actionId: bigint; round: bigint }[] = [];
    lastRoundByAction.forEach((round, actionIdStr) => {
      pairs.push({
        actionId: BigInt(actionIdStr),
        round,
      });
    });

    return {
      actionRoundPairs: pairs,
      enabled: pairs.length > 0,
    };
  }, [rewards, lastRoundByAction]);

  // 自动加载每个行动的最后一轮得分数据
  const {
    scores: accountScores,
    isLoading: isLoadingScores,
    hasError: hasScoreError,
  } = useEstimateAccountScoresByActionIdsByRounds({
    account: account as `0x${string}`,
    tokenAddress: token?.address as `0x${string}`,
    actionRoundPairs: scoreQueryParams.actionRoundPairs,
    enabled: scoreQueryParams.enabled, // 自动加载每个行动的最后一轮
  });

  // 手动加载请求的轮次（用于非最后一轮的按需加载）
  const [manualLoadRequests, setManualLoadRequests] = useState<Set<string>>(new Set());

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

  // 获取缓存数据
  const scoreCache = useMemo(() => {
    if (!account || !token?.address) return {};
    return getScoreCache(account, token.address);
  }, [account, token?.address, accountScores]); // accountScores 变化时重新读取缓存

  // 结合本地已铸造集合和得分数据覆盖 UI 展示
  const displayedGroups = useMemo(() => {
    if (!grouped) return [];
    return grouped.map((g) => {
      const actionIdStr = g.action.action.head.id.toString();
      const lastRound = lastRoundByAction.get(actionIdStr);

      return {
        ...g,
        rewards: g.rewards.map((r) => {
          const key = `${actionIdStr}-${r.round.toString()}`;
          const roundStr = r.round.toString();
          const cacheKey = `${actionIdStr}_${roundStr}`;

          // 是否是最后一轮（用于区分自动加载和手动加载）
          const isLastRound = lastRound !== undefined && r.round === lastRound;

          // 从 accountScores 或缓存中获取得分
          const score = accountScores?.[actionIdStr]?.[roundStr] ?? scoreCache[cacheKey] ?? null;

          // 判断该得分是否还在加载中
          // 最后一轮：使用批量加载状态；非最后一轮：使用手动加载状态
          const isScoreLoading = isLastRound ? isLoadingScores : false;

          // 是否需要显示加载按钮
          // 最后一轮：如果正在加载或已有得分则不显示按钮
          // 非最后一轮：如果没有得分且未被抽中则显示按钮
          const needManualLoad = isLastRound ? false : score === null && !r.notSelected;

          // 是否正在手动加载
          const isManualLoading = manualLoadRequests.has(cacheKey);

          return {
            ...r,
            isMinted: locallyMinted.has(key) || r.isMinted,
            score: score ?? null,
            isScoreLoading,
            isLastRound,
            needManualLoad,
            isManualLoading,
            notSelected: r.notSelected,
            cacheKey,
          };
        }),
      };
    });
  }, [grouped, locallyMinted, accountScores, isLoadingScores, lastRoundByAction, scoreCache, manualLoadRequests]);

  // 处理手动加载请求
  const handleManualLoad = (actionId: bigint, round: bigint) => {
    const cacheKey = `${actionId.toString()}_${round.toString()}`;
    setManualLoadRequests((prev) => new Set(prev).add(cacheKey));
  };

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

            {isLoadingRewards || isLoadingActions || isLoadingCurrentRound ? (
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
                            <th className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                估算验证得分
                                <InfoTooltip
                                  title="验证得分说明"
                                  content="这个得分，是根据最终激励，估算的平均得分。（具体算法：将所有地址中实际得分最高者，作为100分，然后将你的实际得分等比例换算到0~100）"
                                />
                              </div>
                            </th>
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
                              <td className="text-center px-1">
                                <ActionRewardScoreCell
                                  account={account as `0x${string}`}
                                  tokenAddress={token?.address as `0x${string}`}
                                  actionId={BigInt(group.action.action.head.id)}
                                  round={item.round}
                                  symbol={token?.symbol || ''}
                                  score={item.score}
                                  isScoreLoading={item.isScoreLoading}
                                  needManualLoad={item.needManualLoad}
                                  isManualLoading={item.isManualLoading}
                                  notSelected={item.notSelected || false}
                                  onManualLoad={() => handleManualLoad(BigInt(group.action.action.head.id), item.round)}
                                />
                              </td>
                              <td className="text-center px-1">
                                {item.notSelected ? (
                                  <span className="text-greyscale-500">未抽中</span>
                                ) : (
                                  formatTokenAmount(item.reward || BigInt(0))
                                )}
                              </td>
                              <td className="text-center px-1">
                                {item.notSelected ? (
                                  <span className="text-greyscale-500">-</span>
                                ) : item.reward > BigInt(0) && !item.isMinted ? (
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
