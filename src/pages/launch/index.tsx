'use client';

import { useContext, useEffect } from 'react';

// my contexts
import { Token, TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useLaunchInfo } from '@/src/hooks/contracts/useLOVE20Launch';

// my components
import Header from '@/src/components/Header';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LaunchStatus from '@/src/components/Launch/LaunchStatus';
import ContributeInfo from '@/src/components/Launch/ContributeInfo';
import Claim from '@/src/components/Launch/Claim';
import TokenTab from '@/src/components/Token/TokenTab';

export default function TokenFairLaunch() {
  const { token, setToken } = useContext(TokenContext) || { token: null, setToken: null };

  // 获取发射信息
  const {
    launchInfo,
    isPending: isLaunchInfoPending,
    error: launchInfoError,
  } = useLaunchInfo(token ? token.address : '0x0000000000000000000000000000000000000000');

  // 如果发射已结束，检查更新 token 的 hasEnded 状态
  useEffect(() => {
    if (launchInfo && token && launchInfo.hasEnded && !token.hasEnded) {
      setToken({ ...token, hasEnded: true } as Token);
    }
  }, [launchInfo, token]);

  if (!isLaunchInfoPending && !launchInfo) {
    return <div className="text-red-500">找不到发射信息</div>;
  }

  return (
    <>
      <Header title="公平发射" showBackButton={launchInfo?.hasEnded || false} />
      <main className="flex-grow">
        <TokenTab />
        {isLaunchInfoPending || !launchInfo ? (
          <LoadingIcon />
        ) : (
          <>
            {token &&
              (launchInfo.hasEnded ? (
                <Claim token={token} launchInfo={launchInfo} />
              ) : (
                <ContributeInfo token={token} launchInfo={launchInfo} />
              ))}
            <LaunchStatus token={token} launchInfo={launchInfo} />
          </>
        )}
      </main>
    </>
  );
}
