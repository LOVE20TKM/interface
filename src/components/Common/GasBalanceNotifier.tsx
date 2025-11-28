'use client';

import React, { useMemo } from 'react';
import { useAccount, useBalance } from 'wagmi';

// my components
import AlertBox from '@/src/components/Common/AlertBox';

// my hooks
import { useIsGovernor } from '@/src/hooks/composite/useIsGovernor';

// my lib
import { formatTokenAmount } from '@/src/lib/format';

// 原生代币符号
const NATIVE_TOKEN_SYMBOL = process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL || 'TKM';

// Gas 余额阈值
const GOVERNOR_GAS_THRESHOLD = BigInt(10e18); // 治理者阈值：10 个原生代币
const NORMAL_GAS_THRESHOLD = BigInt(1e18); // 普通用户阈值：1 个原生代币

/**
 * 全局 Gas 余额提示器
 * - 监控当前连接账户的原生代币余额
 * - 根据用户身份动态调整报警阈值：
 *   - 治理者（有效治理票 > 1）：余额 < 10 个原生代币时报警
 *   - 普通用户：余额 < 2 个原生代币时报警
 * - 提示会持续显示，直到余额充足
 */
const GasBalanceNotifier: React.FC = () => {
  const { address: account, isConnected } = useAccount();

  // 判断是否是治理者
  const { isGovernor } = useIsGovernor(account);

  // 获取账户余额
  const { data: balance } = useBalance({
    address: account,
    query: {
      enabled: !!account && isConnected,
      refetchInterval: 30000, // 每 30 秒刷新一次
    },
  });

  // 根据用户身份动态确定阈值
  const gasThreshold = useMemo(() => {
    return isGovernor ? GOVERNOR_GAS_THRESHOLD : NORMAL_GAS_THRESHOLD;
  }, [isGovernor]);

  // 判断是否需要显示提示
  const shouldShowWarning = useMemo(() => {
    if (!balance || typeof balance.value !== 'bigint') return false;
    return balance.value < gasThreshold;
  }, [balance, gasThreshold]);

  // 格式化余额显示
  const formattedBalance = useMemo(() => {
    if (!balance || typeof balance.value !== 'bigint') return '0';
    return formatTokenAmount(balance.value);
  }, [balance]);

  // 格式化阈值显示
  const formattedThreshold = useMemo(() => {
    return formatTokenAmount(gasThreshold);
  }, [gasThreshold]);

  // 未连接钱包或余额充足时不显示
  if (!isConnected || !account) return null;
  if (!shouldShowWarning) return null;

  return (
    <div className="px-4 py-6">
      <AlertBox
        type="error"
        className="w-full"
        message={
          <span>
            ⚠️ 当前 <span className="font-semibold">{NATIVE_TOKEN_SYMBOL}</span> 余额
            <span className="font-semibold ml-1">{formattedBalance}</span>
            &nbsp;过低，为避免交易失败，请及时充值！
          </span>
        }
      />
    </div>
  );
};

export default GasBalanceNotifier;
