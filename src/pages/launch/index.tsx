'use client';

import { useContext, useEffect } from 'react';

// my contexts
import { Token, TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useLaunches } from '@/src/hooks/contracts/useLOVE20Launch';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import Header from '@/src/components/Header';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LaunchStatus from '@/src/components/Launch/LaunchStatus';
import ContributeInfo from '@/src/components/Launch/ContributeInfo';
import Claim from '@/src/components/Launch/Claim';
import TokenTab from '@/src/components/Token/TokenTab';
import Todeploy from '@/src/components/Launch/Todeploy';

export default function TokenFairLaunch() {
  const { token, setToken } = useContext(TokenContext) || { token: null, setToken: null };

  // 获取发射信息
  const {
    launchInfo,
    isPending: isLaunchInfoPending,
    error: launchInfoError,
  } = useLaunches(token ? token.address : '0x0');

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (launchInfoError) {
      handleContractError(launchInfoError, 'launch');
    }
  }, [launchInfoError]);

  // 如果发射已结束，检查更新 token 的 hasEnded 状态
  useEffect(() => {
    if (launchInfo && token && launchInfo.hasEnded && !token.hasEnded && setToken) {
      setToken({ ...token, hasEnded: true } as Token);
    }
  }, [launchInfo, token, setToken]);

  if (isLaunchInfoPending) {
    return <LoadingIcon />;
  }
  if (!launchInfo) {
    return <div className="text-red-500">找不到发射信息</div>;
  }

  return (
    <>
      <Header title="公平发射" />
      <main className="flex-grow">
        <TokenTab />
        <LaunchStatus token={token} launchInfo={launchInfo} />
        {!launchInfo.hasEnded && token && <ContributeInfo token={token} launchInfo={launchInfo} />}
        {launchInfo.hasEnded && token && <Claim token={token} launchInfo={launchInfo} />}
      </main>
    </>
  );
}
