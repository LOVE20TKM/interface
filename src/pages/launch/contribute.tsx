'use client';

import { useContext } from 'react';
import dynamic from 'next/dynamic';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useLaunchInfo } from '@/src/hooks/contracts/useLOVE20Launch';
// my components
import Header from '@/src/components/Header';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import Contribute from '@/src/components/Launch/Contribute';

export default function ContributePage() {
  const { token } = useContext(TokenContext) || {};
  const {
    launchInfo,
    isPending: isLaunchInfoPending,
    error: launchInfoError,
  } = useLaunchInfo(token ? token.address : '0x0000000000000000000000000000000000000000');

  return (
    <>
      <Header title="申购" />
      <main className="flex-grow">
        {isLaunchInfoPending ? (
          <LoadingIcon />
        ) : !launchInfo ? (
          <div className="text-red-500">找不到发射信息</div>
        ) : (
          <Contribute token={token} launchInfo={launchInfo} />
        )}
      </main>
    </>
  );
}
