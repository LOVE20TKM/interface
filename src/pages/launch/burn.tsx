'use client';

import { useContext } from 'react';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useLaunchInfo } from '@/src/hooks/contracts/useLOVE20Launch';
// my components
import Burn from '@/src/components/Launch/Burn';
import Header from '@/src/components/Header';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

export default function BurnPage() {
  const { token } = useContext(TokenContext) || {};
  const {
    launchInfo,
    isPending: isLaunchInfoPending,
    error: launchInfoError,
  } = useLaunchInfo(token ? token.address : '0x0000000000000000000000000000000000000000');

  return (
    <>
      <Header title="换回父币" />
      <main className="flex-grow">
        {isLaunchInfoPending ? (
          <LoadingIcon />
        ) : !launchInfo ? (
          <div className="text-red-500">找不到发射信息</div>
        ) : (
          <Burn token={token} launchInfo={launchInfo} />
        )}
      </main>
    </>
  );
}
