import { useMemo, useEffect, useState } from 'react';
import { useValidGovVotes } from '@/src/hooks/contracts/useLOVE20Stake';
import useTokenContext from '@/src/hooks/context/useTokenContext';

// 缓存键前缀
const CACHE_KEY_PREFIX = 'governor_status_';
// 缓存有效期：1天（毫秒）
const CACHE_DURATION = 24 * 60 * 60 * 1000;
// 治理者判定阈值：有效治理票 > 1
const GOVERNOR_THRESHOLD = BigInt(1);

/**
 * 缓存数据结构
 */
interface CachedGovernorStatus {
  isGovernor: boolean;
  timestamp: number;
}

/**
 * 从 localStorage 读取缓存的治理者状态
 */
const getCachedGovernorStatus = (account: string): boolean | null => {
  if (typeof window === 'undefined') return null;

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${account}`;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return null;

    const data: CachedGovernorStatus = JSON.parse(cached);
    const now = Date.now();

    // 检查缓存是否过期
    if (now - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return data.isGovernor;
  } catch (error) {
    console.error('读取治理者状态缓存失败:', error);
    return null;
  }
};

/**
 * 将治理者状态保存到 localStorage
 */
const setCachedGovernorStatus = (account: string, isGovernor: boolean): void => {
  if (typeof window === 'undefined') return;

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${account}`;
    const data: CachedGovernorStatus = {
      isGovernor,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.error('保存治理者状态缓存失败:', error);
  }
};

/**
 * 判断用户是否是治理者
 *
 * 判断逻辑：
 * - 通过 LOVE20Stake 合约的 validGovVotes 方法获取有效治理票数
 * - 如果有效治理票 > 1，则认为是治理者
 * - 结果会缓存 1 天，减少不必要的链上查询
 *
 * @param account 用户账户地址
 * @returns isGovernor: 是否是治理者
 * @returns isPending: 是否正在加载
 * @returns error: 错误信息
 */
export const useIsGovernor = (account: `0x${string}` | undefined) => {
  // 从 context 获取当前 token 地址
  const { token } = useTokenContext();
  const tokenAddress = token?.address;

  // 缓存状态
  const [cachedStatus, setCachedStatus] = useState<boolean | null>(null);

  // 初始化时读取缓存（当 account 或 tokenAddress 变化时重新读取）
  useEffect(() => {
    if (!account || !tokenAddress) {
      setCachedStatus(null);
      return;
    }

    const cached = getCachedGovernorStatus(account);
    setCachedStatus(cached);
  }, [account, tokenAddress]);

  // 获取有效治理票数（如果有缓存则不查询）
  const shouldFetchGovVotes = cachedStatus === null && !!tokenAddress && !!account;
  const { validGovVotes, isPending, error } = useValidGovVotes(
    tokenAddress || '0x0000000000000000000000000000000000000000',
    account || '0x0000000000000000000000000000000000000000',
    shouldFetchGovVotes,
  );

  // 计算是否是治理者
  const isGovernor = useMemo(() => {
    // 如果没有 token 地址或账户，返回 false
    if (!tokenAddress || !account) {
      return false;
    }

    // 如果有缓存，优先使用缓存
    if (cachedStatus !== null) {
      return cachedStatus;
    }

    // 如果正在加载或出错，返回 false
    if (isPending || error) {
      return false;
    }

    // 判断是否是治理者
    const result = validGovVotes > GOVERNOR_THRESHOLD;

    // 保存到缓存
    setCachedGovernorStatus(account, result);
    setCachedStatus(result);

    return result;
  }, [cachedStatus, validGovVotes, isPending, error, account, tokenAddress]);

  return {
    isGovernor,
    isPending: cachedStatus === null && isPending,
    error,
  };
};
