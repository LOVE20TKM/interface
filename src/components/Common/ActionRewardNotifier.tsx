'use client';

import React, { useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';

// my lib
import { loadActionRewardNotice, saveActionRewardNotice } from '@/src/lib/actionRewardNotice';
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';
import { useHasUnmintedActionRewardOfLastRounds } from '@/src/hooks/contracts/useLOVE20MintViewer';

// my components
import AlertBox from '@/src/components/Common/AlertBox';

// 最近检查的轮数范围
const LAST_ROUNDS = BigInt(7);

type RewardNoticeState = {
  round: number;
  needMinted: boolean;
  updatedAt: number;
};

/**
 * 全局行动激励提示器
 * - 依赖当前选中 Token 与已连接账户
 * - 每当链上轮次变更时，最多检查一次（最近 LAST_ROUNDS 轮）
 * - 若存在未铸造激励，则在页面顶部显示持续提示
 */
const ActionRewardNotifier: React.FC = () => {
  const router = useRouter();
  const isOnActionRewardsPage = router.pathname === '/my/actionrewards';
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 当前轮次（用于“每轮检查一次”）
  const { currentRound } = useCurrentRound(!!token && token.hasEnded);

  // UI 展示用的 needMinted
  const [needMinted, setNeedMinted] = useState<boolean>(false);

  // 监听本地缓存变更事件（由 setActionRewardNeedMinted 触发），实现即时 UI 更新
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const { detail } = e as CustomEvent<{ account: string; tokenAddress: string; needMinted: boolean }>;
        if (!detail) return;
        if (!token?.address || !account) return;
        if (
          detail.account?.toLowerCase() === account.toLowerCase() &&
          detail.tokenAddress?.toLowerCase() === token.address.toLowerCase()
        ) {
          setNeedMinted(!!detail.needMinted);
        }
      } catch {}
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('love20:actionReward:changed', handler as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('love20:actionReward:changed', handler as EventListener);
      }
    };
  }, [token?.address, account]);

  // 计算本轮是否需要触发读取链上“是否有未铸造激励”
  const shouldTriggerCheck = useMemo(() => {
    if (isOnActionRewardsPage) return false;
    if (!token?.address || !account || currentRound === undefined || currentRound === null) return false;
    if (currentRound <= BigInt(0)) return false;
    const cached = loadActionRewardNotice(account as `0x${string}`, token.address);
    if (!cached) return true;
    // 如果本地记录的轮次落后，则需要触发本轮检查
    return BigInt(cached.round) < currentRound;
  }, [isOnActionRewardsPage, token?.address, account, currentRound]);

  // 读取：最近 LAST_ROUNDS 轮是否存在未铸造
  const gateRounds = shouldTriggerCheck ? LAST_ROUNDS : BigInt(0); // 通过 latestRounds 是否为 BigInt(0) 控制内部启用
  const { hasUnmintedActionRewardOfLastRounds } = useHasUnmintedActionRewardOfLastRounds(
    (token?.address || '0x') as `0x${string}`,
    (account || '0x') as `0x${string}`,
    gateRounds,
  );

  // 根据读取结果更新缓存与展示状态
  useEffect(() => {
    if (!token?.address || !account) {
      setNeedMinted(false);
      return;
    }

    // 初始时尝试从缓存恢复一次
    const cached = loadActionRewardNotice(account, token.address);
    if (cached) setNeedMinted(!!cached.needMinted);
  }, [token?.address, account]);

  // 触发读取后的回写
  useEffect(() => {
    if (!token?.address || !account) return;
    if (!shouldTriggerCheck) return;
    if (currentRound === undefined || currentRound === null || currentRound <= BigInt(0)) return;

    // 只有当 hook 被启用时才会返回布尔值
    if (gateRounds === BigInt(0)) return;

    if (typeof hasUnmintedActionRewardOfLastRounds === 'boolean') {
      const nextState: RewardNoticeState = {
        round: Number(currentRound),
        needMinted: hasUnmintedActionRewardOfLastRounds,
        updatedAt: Date.now(),
      };
      saveActionRewardNotice(account, token.address, nextState);
      setNeedMinted(nextState.needMinted);
    }
  }, [hasUnmintedActionRewardOfLastRounds, shouldTriggerCheck, token?.address, account, currentRound, gateRounds]);

  if (isOnActionRewardsPage) return null;
  if (!token?.address || !account) return null;
  if (!needMinted) return null;

  return (
    <div className="px-4 py-6">
      <AlertBox
        type="error"
        className="w-full"
        message={
          <span>
            恭喜！您有新的行动激励，请点击
            <Link href="/my/actionrewards" className="text-secondary underline ml-1">
              铸造
            </Link>
          </span>
        }
      />
    </div>
  );
};

export default ActionRewardNotifier;
