import { useMemo, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { useActionRewardsByAccountOfLastRounds } from '@/src/hooks/contracts/useLOVE20MintViewer';
import { useMyJoinedActionsData } from '@/src/hooks/composite/useMyJoinedActionsData';
import { useMintActionReward } from '@/src/hooks/contracts/useLOVE20Mint';
import { useStakeLpRewardsByLastRounds } from '@/src/hooks/composite/useStakeLpRewardsByLastRounds';
import { useActionsExtensionInfo, ActionExtensionInfo } from '@/src/hooks/composite/useActionsExtensionInfo';
import { JoinedAction, ActionReward } from '@/src/types/love20types';
import { StakeLpReward } from '@/src/hooks/composite/useStakeLpRewardsByLastRounds';
import {
  setActionRewardNeedMinted,
  loadActionRewardNotice,
  buildActionRewardNoticeKey,
} from '@/src/lib/actionRewardNotice';

const EXTENSION_FACTORY_STAKELP = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_STAKELP as `0x${string}`;

export interface ActionRewardsGroup {
  action: JoinedAction;
  coreRewards: ActionReward[];
  extensionInfo?: ActionExtensionInfo;
  stakeLpRewards?: StakeLpReward[];
}

export interface UseActionRewardsDataParams {
  tokenAddress: `0x${string}` | undefined;
  lastRounds: bigint;
}

export interface UseActionRewardsDataResult {
  // 分组后的行动激励数据
  displayedGroups: ActionRewardsGroup[];

  // 加载状态
  isLoading: boolean;

  // 铸造普通激励相关
  isPending: boolean;
  isConfirming: boolean;
  handleClaimCoreReward: (round: bigint, actionId: bigint) => void;

  // 铸造扩展激励相关
  locallyMinted: Set<string>;
  handleExtensionMintSuccess: (extensionAddress: string, round: string) => void;

  // 错误信息
  errors: {
    coreRewards?: any;
    actions?: any;
    extensionInfo?: any;
    stakeLpRewards?: any;
    mint?: any;
  };
}

/**
 * 行动激励数据管理Hook
 *
 * 功能：
 * 1. 获取并整合所有激励数据（普通 + 扩展）
 * 2. 管理铸造状态和本地已铸造集合
 * 3. 处理缓存清理逻辑
 */
export const useActionRewardsData = ({
  tokenAddress,
  lastRounds,
}: UseActionRewardsDataParams): UseActionRewardsDataResult => {
  const { address: account } = useAccount();

  // 获取最近 N 轮的普通行动激励
  const {
    rewards: coreRewards,
    isPending: isLoadingCoreRewards,
    error: errorLoadingCoreRewards,
  } = useActionRewardsByAccountOfLastRounds(tokenAddress as `0x${string}`, account as `0x${string}`, lastRounds);

  // 获取所有参与的行动（包括core和扩展协议）
  const {
    joinedActions,
    isPending: isLoadingActions,
    error: errorLoadingActions,
  } = useMyJoinedActionsData({
    tokenAddress,
  });

  // 获取所有行动的扩展信息
  const actionIds = useMemo(() => {
    return (joinedActions || []).map((ja) => ja.action.head.id);
  }, [joinedActions]);

  const {
    extensionInfos,
    isPending: isLoadingExtensionInfo,
    error: errorLoadingExtensionInfo,
  } = useActionsExtensionInfo({
    tokenAddress,
    actionIds,
  });

  // 提取质押LP扩展行动的地址列表
  const stakeLpExtensionAddresses = useMemo(() => {
    return extensionInfos
      .filter(
        (info) =>
          info.isExtension &&
          info.extensionAddress &&
          info.factoryAddress?.toLowerCase() === EXTENSION_FACTORY_STAKELP?.toLowerCase(),
      )
      .map((info) => info.extensionAddress!);
  }, [extensionInfos]);

  // 获取质押LP扩展行动的激励数据
  const {
    rewardsMap: stakeLpRewardsMap,
    isPending: isLoadingStakeLpRewards,
    error: errorLoadingStakeLpRewards,
  } = useStakeLpRewardsByLastRounds({
    extensionAddresses: stakeLpExtensionAddresses,
    lastRounds,
  });

  // 将激励按行动分组
  const grouped = useMemo<ActionRewardsGroup[]>(() => {
    if (!joinedActions) return [];

    // 创建普通激励映射
    const coreRewardsByAction = new Map<string, ActionReward[]>();
    if (coreRewards) {
      for (const r of coreRewards) {
        if (r.reward <= BigInt(0)) continue;
        const key = r.actionId.toString();
        if (!coreRewardsByAction.has(key)) coreRewardsByAction.set(key, []);
        coreRewardsByAction.get(key)!.push(r);
      }
    }

    // 创建扩展信息映射
    const extensionInfoMap = new Map<string, ActionExtensionInfo>();
    for (const extInfo of extensionInfos) {
      extensionInfoMap.set(extInfo.actionId.toString(), extInfo);
    }

    // 为所有参与的行动创建分组
    const list: ActionRewardsGroup[] = [];
    for (const joinedAction of joinedActions) {
      const actionIdStr = String(joinedAction.action.head.id);
      const actionCoreRewards = coreRewardsByAction.get(actionIdStr) || [];

      // 如果有激励，按轮次倒序排序
      if (actionCoreRewards.length > 0) {
        actionCoreRewards.sort((a, b) => (a.round > b.round ? -1 : 1));
      }

      const extInfo = extensionInfoMap.get(actionIdStr);
      const stakeLpRewards = extInfo?.extensionAddress ? stakeLpRewardsMap.get(extInfo.extensionAddress) : undefined;

      list.push({
        action: joinedAction,
        coreRewards: actionCoreRewards,
        extensionInfo: extInfo,
        stakeLpRewards,
      });
    }

    // 按行动 id 倒序
    list.sort((a, b) => (BigInt(a.action.action.head.id) > BigInt(b.action.action.head.id) ? -1 : 1));
    return list;
  }, [joinedActions, coreRewards, extensionInfos, stakeLpRewardsMap]);

  // 铸造普通行动激励
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
      if (typeof window !== 'undefined' && tokenAddress && account) {
        setActionRewardNeedMinted(account, tokenAddress, false);
      }
    }
  }, [isConfirmed, mintingTarget, tokenAddress, account]);

  // 账号或 Token 切换时重置本地已铸造集合
  useEffect(() => {
    setLocallyMinted(new Set());
  }, [tokenAddress, account]);

  // 检查是否有未铸造的激励，如果没有则清除 localStorage 缓存
  useEffect(() => {
    if (!tokenAddress || !account || isLoadingCoreRewards || !coreRewards) return;

    // 检查是否存在未铸造的普通激励
    const hasUnmintedCoreRewards = coreRewards.some((r) => r.reward > BigInt(0) && !r.isMinted);

    // 检查是否存在未铸造的扩展激励
    let hasUnmintedExtensionRewards = false;
    for (const rewards of stakeLpRewardsMap.values()) {
      if (rewards.some((r) => r.reward > BigInt(0) && !r.isMinted)) {
        hasUnmintedExtensionRewards = true;
        break;
      }
    }

    // 如果没有未铸造的激励，且本地缓存显示需要铸造，则清除缓存
    if (!hasUnmintedCoreRewards && !hasUnmintedExtensionRewards) {
      const cached = loadActionRewardNotice(account, tokenAddress);
      if (cached?.needMinted) {
        // 清除 localStorage 缓存
        const cacheKey = buildActionRewardNoticeKey(account, tokenAddress);
        localStorage.removeItem(cacheKey);
        // 触发全局事件通知其他组件更新
        setActionRewardNeedMinted(account, tokenAddress, false);
      }
    }
  }, [tokenAddress, account, isLoadingCoreRewards, coreRewards, stakeLpRewardsMap]);

  const handleClaimCoreReward = async (round: bigint, actionId: bigint) => {
    if (tokenAddress && account) {
      setMintingTarget({ actionId, round });
      await mintActionReward(tokenAddress, round, actionId);
    }
  };

  const handleExtensionMintSuccess = (extensionAddress: string, round: string) => {
    const key = `${extensionAddress}-${round}`;
    setLocallyMinted((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    if (typeof window !== 'undefined' && tokenAddress && account) {
      setActionRewardNeedMinted(account, tokenAddress, false);
    }
  };

  // 结合本地已铸造集合覆盖 UI 展示
  const displayedGroups = useMemo(() => {
    if (!grouped) return [];
    return grouped.map((g) => ({
      ...g,
      coreRewards: g.coreRewards.map((r) => {
        const key = `${BigInt(g.action.action.head.id).toString()}-${r.round.toString()}`;
        return locallyMinted.has(key) || r.isMinted ? { ...r, isMinted: true } : r;
      }),
    }));
  }, [grouped, locallyMinted]);

  const isLoading = isLoadingCoreRewards || isLoadingActions || isLoadingExtensionInfo || isLoadingStakeLpRewards;

  return {
    displayedGroups,
    isLoading,
    isPending,
    isConfirming,
    handleClaimCoreReward,
    locallyMinted,
    handleExtensionMintSuccess,
    errors: {
      coreRewards: errorLoadingCoreRewards,
      actions: errorLoadingActions,
      extensionInfo: errorLoadingExtensionInfo,
      stakeLpRewards: errorLoadingStakeLpRewards,
      mint: writeError,
    },
  };
};
