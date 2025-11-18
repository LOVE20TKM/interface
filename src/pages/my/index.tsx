'use client';

import { useContext, useState } from 'react';
import { useAccount } from 'wagmi';
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
import MyJoinedActionList from '@/src/components/ActionList/MyJoinedActionList';
import TokenTab from '@/src/components/Token/TokenTab';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

const MyPage = () => {
  // const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { isConnected } = useAccount();

  // 状态管理：追踪质押和行动状态
  const [hasStake, setHasStake] = useState<boolean>(false);
  const [hasActions, setHasActions] = useState<boolean>(false);

  return (
    <>
      <Header title="我的" />
      <main className="flex-grow">
        {!isConnected ? (
          // 未连接钱包时显示提示
          <div className="flex flex-col items-center p-4 mt-4">
            <div className="text-center mb-4 text-greyscale-500">没有链接钱包，请先连接钱包</div>
          </div>
        ) : !token ? (
          <LoadingIcon />
        ) : token && !token.hasEnded ? (
          // 公平发射未结束时显示提示
          <>
            <TokenTab />
            <div className="flex flex-col items-center p-4 mt-4">
              <div className="text-center mb-4 text-greyscale-500">公平发射未结束，还不能查看个人资产</div>
              <Button className="w-1/2" asChild>
                <Link href={`/launch?symbol=${token.symbol}`}>查看公平发射</Link>
              </Button>
            </div>
          </>
        ) : (
          // 正常显示个人资产内容
          <>
            <MyTokenPanel token={token} />

            {/* 条件渲染：当没有质押但有行动时，优先显示行动 */}
            {!hasStake && hasActions ? (
              <>
                <MyJoinedActionList token={token} onActionStatusChange={setHasActions} />
                <div className="flex-col items-center p-4">
                  <div className="flex justify-between items-center mb-2">
                    <LeftTitle title="我的治理资产" />
                    {hasStake && (
                      <Button variant="link" className="text-secondary border-secondary" asChild>
                        <Link href={`/stake/unstake?symbol=${token?.symbol}`}>取消质押</Link>
                      </Button>
                    )}
                  </div>
                  <MyGovernanceAssetsPanel token={token} onStakeStatusChange={setHasStake} />
                </div>
              </>
            ) : (
              <>
                <div className="flex-col items-center p-4">
                  <div className="flex justify-between items-center mb-2">
                    <LeftTitle title="我的治理资产" />
                    {hasStake && (
                      <Button variant="link" className="text-secondary border-secondary" asChild>
                        <Link href={`/stake/unstake?symbol=${token?.symbol}`}>取消质押</Link>
                      </Button>
                    )}
                  </div>
                  <MyGovernanceAssetsPanel token={token} onStakeStatusChange={setHasStake} />
                </div>
                <MyJoinedActionList token={token} onActionStatusChange={setHasActions} />
              </>
            )}
          </>
        )}
      </main>
    </>
  );
};

export default MyPage;
