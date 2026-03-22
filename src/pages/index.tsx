'use client';

import { useAccount } from 'wagmi';
import type { NextPage } from 'next';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';

// my utils
import { NavigationUtils } from '@/src/lib/navigationUtils';

// my context
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useClaimInfo } from '@/src/hooks/contracts/useLOVE20Launch';

const Home: NextPage = () => {
  const router = useRouter();
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const [hasRedirected, setHasRedirected] = useState(false);

  const {
    receivedTokenAmount,
    extraRefund,
    isClaimed: claimed,
    isPending: isClaimInfoPending,
    error: claimInfoError,
  } = useClaimInfo(token?.address as `0x${string}`, account as `0x${string}`);

  useEffect(() => {
    if (hasRedirected) {
      return;
    }

    // 尝试处理钱包环境中的重定向问题
    const handled = NavigationUtils.handleIndexRedirect(router);
    if (handled) {
      setHasRedirected(true);
      return;
    }

    let target = '';
    const symbol = router.query.symbol as string;
    if (!symbol) {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('currentToken');
          console.log('[success]clear local storage');
        }
      } catch (e) {
        console.error('清理本地缓存失败：', e);
      }
    }

    console.log('[token]', token);
    if (token && (!account || !isClaimInfoPending)) {
      const needClaim = account ? receivedTokenAmount > 0 && !claimed : false;
      if (symbol) {
        setHasRedirected(true);
        target = token?.hasEnded && !needClaim ? `/acting/?symbol=${symbol}` : `/launch/?symbol=${symbol}`;
      } else {
        target = token?.hasEnded && !needClaim ? `/acting/` : `/launch/`;
      }
      router.push(target).catch((err) => {
        console.log('路由跳转被取消或出错：', err);
      });
    }
  }, [router, hasRedirected, token, isClaimInfoPending, claimed]);

  return <LoadingIcon />;
};

export default Home;
