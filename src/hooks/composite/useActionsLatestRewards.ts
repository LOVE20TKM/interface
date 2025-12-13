import { useMemo, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { useActionRewardsByAccountOfLastRounds } from '@/src/hooks/contracts/useLOVE20MintViewer';
import { useJoinedActions } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useMyJoinedExtensionActions } from '@/src/hooks/extension/base/composite';
import { useMintActionReward } from '@/src/hooks/contracts/useLOVE20Mint';
import {
  useExtensionActionsLatestRewards,
  ExtensionActionRewardWithAddress,
} from '@/src/hooks/extension/base/composite';
import { ExtensionContractInfo } from '@/src/hooks/extension/base/composite/useExtensionBaseData';
import { JoinedAction, ActionReward } from '@/src/types/love20types';
import {
  setActionRewardNeedMinted,
  loadActionRewardNotice,
  buildActionRewardNoticeKey,
} from '@/src/lib/actionRewardNotice';

export interface ActionRewardsGroup {
  action: JoinedAction;
  coreRewards: ActionReward[];
  extensionInfo?: ExtensionContractInfo;
  extensionRewards?: ExtensionActionRewardWithAddress[];
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
    extensionRewards?: any;
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
export const useActionsLatestRewards = ({
  tokenAddress,
  lastRounds,
}: UseActionRewardsDataParams): UseActionRewardsDataResult => {
  const { address: account } = useAccount();

  // 第1步：获取 core 协议最近 N 轮的普通行动激励
  const {
    rewards: coreRewards,
    isPending: isLoadingCoreRewards,
    error: errorLoadingCoreRewards,
  } = useActionRewardsByAccountOfLastRounds(
    tokenAddress || ('' as `0x${string}`),
    account || ('' as `0x${string}`),
    lastRounds,
  );

  // 第2步：获取 core 协议中的参与行动
  const {
    joinedActions: coreActions,
    isPending: isLoadingCoreActions,
    error: errorLoadingCoreActions,
  } = useJoinedActions(tokenAddress || ('' as `0x${string}`), account || ('' as `0x${string}`));

  // 第3步：获取扩展协议中的参与行动（同时获取扩展合约信息）
  const {
    joinedExtensionActions: extensionActions,
    extensionContractInfos: contractInfos,
    isPending: isLoadingExtensionActions,
    error: errorLoadingExtensionActions,
  } = useMyJoinedExtensionActions({
    tokenAddress,
    account: account as `0x${string}`,
    currentRound: undefined, // actionrewards 页面不需要投票信息
  });

  // 第4步：提取扩展地址，获取扩展协议最近 N 轮的行动激励
  const extensionAddresses = useMemo(() => {
    return contractInfos.filter((info) => info.isExtension && info.extension).map((info) => info.extension!);
  }, [contractInfos]);

  const {
    rewardsMap: extensionRewardsMap,
    isPending: isLoadingExtensionRewards,
    error: errorLoadingExtensionRewards,
  } = useExtensionActionsLatestRewards({
    extensionAddresses,
    lastRounds,
    account: account as `0x${string}`,
  });

  // 第5步：将激励按行动分组，拼接所有数据
  const grouped = useMemo<ActionRewardsGroup[]>(() => {
    const safeCore = coreActions || [];
    const safeExtension = extensionActions || [];

    if (safeCore.length === 0 && safeExtension.length === 0) {
      return [];
    }

    // 创建 core 激励映射
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
    const extensionInfoMap = new Map<string, ExtensionContractInfo>();
    for (const extInfo of contractInfos) {
      extensionInfoMap.set(extInfo.actionId.toString(), extInfo);
    }

    // 创建扩展行动 Set，用于判断是否有扩展
    const extensionActionIds = new Set(safeExtension.map((action) => action.action.head.id.toString()));

    const list: ActionRewardsGroup[] = [];

    // 处理 core 行动
    for (const joinedAction of safeCore) {
      const actionIdStr = String(joinedAction.action.head.id);
      const actionCoreRewards = coreRewardsByAction.get(actionIdStr) || [];

      if (actionCoreRewards.length > 0) {
        actionCoreRewards.sort((a, b) => (a.round > b.round ? -1 : 1));
      }

      // 如果该行动也在扩展中，添加扩展信息和扩展激励
      const extInfo = extensionActionIds.has(actionIdStr) ? extensionInfoMap.get(actionIdStr) : undefined;
      const extensionRewards = extInfo?.extension ? extensionRewardsMap.get(extInfo.extension) : undefined;

      list.push({
        action: joinedAction,
        coreRewards: actionCoreRewards,
        extensionInfo: extInfo,
        extensionRewards,
      });
    }

    // 处理仅在扩展中的行动（不在 core 中）
    const coreActionIds = new Set(safeCore.map((action) => action.action.head.id.toString()));
    for (const joinedAction of safeExtension) {
      const actionIdStr = String(joinedAction.action.head.id);

      if (coreActionIds.has(actionIdStr)) {
        continue;
      }

      const actionCoreRewards = coreRewardsByAction.get(actionIdStr) || [];
      if (actionCoreRewards.length > 0) {
        actionCoreRewards.sort((a, b) => (a.round > b.round ? -1 : 1));
      }

      const extInfo = extensionInfoMap.get(actionIdStr);
      const extensionRewards = extInfo?.extension ? extensionRewardsMap.get(extInfo.extension) : undefined;

      list.push({
        action: joinedAction,
        coreRewards: actionCoreRewards,
        extensionInfo: extInfo,
        extensionRewards,
      });
    }

    list.sort((a, b) => (BigInt(a.action.action.head.id) > BigInt(b.action.action.head.id) ? -1 : 1));
    return list;
  }, [coreActions, extensionActions, coreRewards, contractInfos, extensionRewardsMap]);

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
    for (const rewards of extensionRewardsMap.values()) {
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
  }, [tokenAddress, account, isLoadingCoreRewards, coreRewards, extensionRewardsMap]);

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

  const isLoading =
    isLoadingCoreRewards || isLoadingCoreActions || isLoadingExtensionActions || isLoadingExtensionRewards;

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
      actions: errorLoadingCoreActions || errorLoadingExtensionActions,
      extensionRewards: errorLoadingExtensionRewards,
      mint: writeError,
    },
  };
};
