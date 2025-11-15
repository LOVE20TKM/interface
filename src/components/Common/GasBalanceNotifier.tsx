'use client';

import React, { useMemo } from 'react';
import { useAccount, useBalance } from 'wagmi';

// my components
import AlertBox from '@/src/components/Common/AlertBox';

// my lib
import { formatTokenAmount } from '@/src/lib/format';

// Gas 余额阈值（TKM）
const GAS_THRESHOLD = BigInt(3e18); // 1 TKM

/**
 * 全局 Gas 余额提示器
 * - 监控当前连接账户的 ETH/TKM 余额
 * - 当余额低于 1 TKM 时显示警告提示
 * - 提示会持续显示，直到余额充足
 */
const GasBalanceNotifier: React.FC = () => {
  const { address: account, isConnected } = useAccount();

  // 获取账户余额
  const { data: balance } = useBalance({
    address: account,
    query: {
      enabled: !!account && isConnected,
      refetchInterval: 30000, // 每 30 秒刷新一次
    },
  });

  // 判断是否需要显示提示
  const shouldShowWarning = useMemo(() => {
    if (!balance || typeof balance.value !== 'bigint') return false;
    return balance.value < GAS_THRESHOLD;
  }, [balance]);

  // 格式化余额显示
  const formattedBalance = useMemo(() => {
    if (!balance || typeof balance.value !== 'bigint') return '0';
    return formatTokenAmount(balance.value);
  }, [balance]);

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
            ⚠️ 当前 <span className="font-semibold">TKM</span> 余额
            <span className="font-semibold ml-1">{formattedBalance}</span>
            &nbsp;过低，为避免交易失败，请及时充值！
          </span>
        }
      />
    </div>
  );
};

export default GasBalanceNotifier;
