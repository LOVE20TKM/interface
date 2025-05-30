'use client';

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

// ui
import { Button } from '@/components/ui/button';

// my context
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import Header from '@/src/components/Header';
import LeftTitle from '@/src/components/Common/LeftTitle';
import MyTokenPanel from '@/src/components/My/MyTokenPanel';
import MyGovernanceAssetsPanel from '@/src/components/My/MyGovernanceAssetsPanel';
import MyStakedActionList from '@/src/components/ActionList/MyStakedActionList';

const MyPage = () => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};

  useEffect(() => {
    if (token && !token.hasEnded) {
      // 如果发射未结束，跳转到发射页面
      router.push(`/launch?symbol=${token.symbol}`);
    } else if (token && !token.initialStakeRound) {
      // 如果还没有人质押，跳转到质押页面
      router.push(`/gov/stakelp/?symbol=${token.symbol}&first=true`);
    }
  }, [token]);

  return (
    <>
      <Header title="我的" />
      <main className="flex-grow">
        <MyTokenPanel token={token} />
        <div className="flex-col items-center p-4">
          <div className="flex justify-between items-center mb-2">
            <LeftTitle title="我的治理资产" />
            <Button variant="link" className="text-secondary border-secondary" asChild>
              <Link href={`/gov/unstake?symbol=${token?.symbol}`}>取消质押</Link>
            </Button>
          </div>
          <MyGovernanceAssetsPanel token={token} />
        </div>
        <MyStakedActionList token={token} />
      </main>
    </>
  );
};

export default MyPage;
