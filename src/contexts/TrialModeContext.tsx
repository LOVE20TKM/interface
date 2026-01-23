// contexts/TrialModeContext.tsx
// 体验模式上下文 - 管理体验模式的状态和数据

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { useTrialAccountsWaiting } from '@/src/hooks/extension/plugins/group/contracts/useGroupJoin';

interface TrialModeContextType {
  // 是否处于体验模式
  isTrialMode: boolean;
  // 体验提供者地址
  provider: `0x${string}` | undefined;
  // 当前用户的体验代币数量
  trialAmount: bigint;
  // 是否正在加载
  isPending: boolean;
  // 错误信息
  error: Error | null;
}

const TrialModeContext = createContext<TrialModeContextType | undefined>(undefined);

interface TrialModeProviderProps {
  children: ReactNode;
  extensionAddress: `0x${string}` | undefined;
  groupId: bigint | undefined;
}

/**
 * TrialModeProvider - 体验模式提供者
 *
 * 根据 URL 中的 provider 参数判断是否启用体验模式
 * 如果启用，则查询当前用户是否在提供者的体验列表中
 */
export const TrialModeProvider: React.FC<TrialModeProviderProps> = ({ children, extensionAddress, groupId }) => {
  const router = useRouter();
  const { address: account } = useAccount();
  const { provider: providerParam } = router.query;

  // 提取 provider 地址
  const provider = useMemo(() => {
    if (!providerParam || typeof providerParam !== 'string') return undefined;
    // 验证地址格式
    if (!/^0x[a-fA-F0-9]{40}$/.test(providerParam)) return undefined;
    return providerParam as `0x${string}`;
  }, [providerParam]);

  // 查询体验等待列表
  const { waitingList, isPending, error } = useTrialAccountsWaiting(
    extensionAddress || ('0x0' as `0x${string}`),
    groupId || BigInt(0),
    provider || ('0x0' as `0x${string}`),
  );

  // 检查当前用户是否在体验列表中，并获取体验代币数量
  const { isInTrialList, trialAmount } = useMemo(() => {
    if (!account || !waitingList || waitingList.length === 0) {
      return { isInTrialList: false, trialAmount: BigInt(0) };
    }

    const userInList = waitingList.find((item) => item.account.toLowerCase() === account.toLowerCase());

    return {
      isInTrialList: !!userInList,
      trialAmount: userInList?.amount || BigInt(0),
    };
  }, [account, waitingList]);

  // 只有当 URL 有 provider 参数，且当前用户在体验列表中时，才启用体验模式
  const isTrialMode = !!provider && isInTrialList && trialAmount > BigInt(0);

  const value = useMemo(
    () => ({
      isTrialMode,
      provider,
      trialAmount,
      isPending,
      error,
    }),
    [isTrialMode, provider, trialAmount, isPending, error],
  );

  return <TrialModeContext.Provider value={value}>{children}</TrialModeContext.Provider>;
};

/**
 * useTrialMode - 使用体验模式钩子
 *
 * @returns 体验模式的状态和数据
 */
export const useTrialMode = (): TrialModeContextType => {
  const context = useContext(TrialModeContext);
  if (context === undefined) {
    throw new Error('useTrialMode 必须在 TrialModeProvider 内部使用');
  }
  return context;
};
