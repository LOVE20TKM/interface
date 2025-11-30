'use client';

import React, { useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/router';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useActionRewardsByAccountOfLastRounds } from '@/src/hooks/contracts/useLOVE20MintViewer';
import { useJoinedActions } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useMintActionReward } from '@/src/hooks/contracts/useLOVE20Mint';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import Header from '@/src/components/Header';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import { Button } from '@/components/ui/button';

// utils
import { formatTokenAmount, formatRoundForDisplay } from '@/src/lib/format';
import {
  setActionRewardNeedMinted,
  loadActionRewardNotice,
  buildActionRewardNoticeKey,
} from '@/src/lib/actionRewardNotice';

// types
import { JoinedAction, ActionReward } from '@/src/types/love20types';

const LAST_ROUNDS = BigInt(15);

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
  console.log('rewards', rewards);

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

  // 结合本地已铸造集合覆盖 UI 展示
  const displayedGroups = useMemo(() => {
    if (!grouped) return [];
    return grouped.map((g) => ({
      ...g,
      rewards: g.rewards.map((r) => {
        const key = `${BigInt(g.action.action.head.id).toString()}-${r.round.toString()}`;
        return locallyMinted.has(key) || r.isMinted ? { ...r, isMinted: true } : r;
      }),
    }));
  }, [grouped, locallyMinted]);

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
                            <th>轮次</th>
                            <th className="text-center">可铸造激励</th>
                            <th className="text-center">结果</th>
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
                              <td>{formatRoundForDisplay(item.round, token).toString()}</td>
                              <td className="text-center">{formatTokenAmount(item.reward || BigInt(0))}</td>
                              <td className="text-center">
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
