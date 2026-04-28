import React, { useContext } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 导入context
import { TokenContext } from '@/src/contexts/TokenContext';

// 导入hooks
import { useValidGovVotes, useCurrentRound } from '@/src/hooks/contracts/useLOVE20Stake';
// 导入组件
import Header from '@/src/components/Header';
import TokenTab from '@/src/components/Token/TokenTab';
import GovernanceDataPanel from '@/src/components/DataPanel/GovernanceDataPanel';
import MyVotingPanel from '@/src/components/My/MyVotingPanel';
import MyVerifingPanel from '@/src/components/My/MyVerifingPanel';
import MyVerifyingGroupsPanel from '@/src/components/My/MyVerifyingGroupsPanel';
import Todeploy from '@/src/components/Launch/Todeploy';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import MyGovInfoPanel from '@/src/components/My/MyGovInfoPanel';
import GovQueryPanel from '@/src/components/My/GovQueryPanel';
import GovPublicCard from '@/src/components/Governance/GovPublicCard';

const GovPage = () => {
  // 当前token
  const { token: currentToken } = useContext(TokenContext) || {};
  const { address: account, isConnected } = useAccount();

  // 获取当前轮次
  const {
    currentRound: currentVoteRound,
    error: errorCurrentRound,
    isPending: isPendingCurrentRound,
  } = useCurrentRound();

  // 获取用户的治理票数
  const {
    validGovVotes,
    isPending: isPendingValidGovVotes,
    error: errorValidGovVotes,
  } = useValidGovVotes((currentToken?.address as `0x${string}`) || '', (account as `0x${string}`) || '');

  // 判断是否需要显示治理组件
  const shouldShowGovComponents = validGovVotes > BigInt(0);

  if (isConnected && (isPendingCurrentRound || isPendingValidGovVotes)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingIcon />
      </div>
    );
  }

  return (
    <>
      <Header title="治理首页" />
      <main className="flex-grow">
        {!isConnected ? (
          // 未连接钱包时显示提示
          <div className="flex flex-col items-center p-4 mt-4">
            <div className="text-center mb-4 text-greyscale-500">没有链接钱包，请先连接钱包</div>
          </div>
        ) : !currentToken ? (
          <LoadingIcon />
        ) : currentToken && !currentToken.hasEnded ? (
          // 公平发射未结束时显示提示
          <>
            <TokenTab />
            <div className="flex flex-col items-center p-4 mt-4">
              <div className="text-center mb-4 text-greyscale-500">公平发射未结束，还不能参与治理</div>
              <Button className="w-1/2" asChild>
                <Link href={`/launch?symbol=${currentToken.symbol}`}>查看公平发射</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <Tabs defaultValue="my-assets" className="w-full px-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="my-assets">我的</TabsTrigger>
                <TabsTrigger value="community-assets">社区</TabsTrigger>
              </TabsList>
              <TabsContent value="my-assets">
                <div className="border rounded-lg px-0 py-4 mt-2">
                  <MyGovInfoPanel token={currentToken} enableWithdraw={false} />
                </div>
                {isPendingValidGovVotes ? (
                  <div className="flex justify-center p-4">
                    <LoadingIcon />
                  </div>
                ) : shouldShowGovComponents ? (
                  // 有治理票时显示治理组件
                  <>
                    <MyVotingPanel
                      currentRound={currentVoteRound ? currentVoteRound : BigInt(0)}
                      validGovVotes={validGovVotes}
                      isPendingValidGovVotes={isPendingValidGovVotes}
                    />
                    <MyVerifingPanel currentRound={currentVoteRound > 2 ? currentVoteRound - BigInt(2) : BigInt(0)} />
                    <MyVerifyingGroupsPanel
                      currentRound={currentVoteRound > 2 ? currentVoteRound - BigInt(2) : BigInt(0)}
                    />
                    <Todeploy token={currentToken} />
                  </>
                ) : (
                  <>
                    {/* 无治理票时显示质押按钮 */}
                    <div className="flex flex-col items-center p-4 mt-4">
                      <div className="text-center mb-4 text-greyscale-500">
                        想为自己喜欢的行动投票？想发起好玩有趣的行动？
                      </div>
                      <Button className="w-1/2" asChild>
                        <Link href={`/stake/stakelp/?symbol=${currentToken?.symbol}`}>立即成为治理者</Link>
                      </Button>
                    </div>
                    <GovPublicCard symbol={currentToken?.symbol} className="mt-4 pb-4" />
                  </>
                )}
              </TabsContent>
              <TabsContent value="community-assets">
                <GovernanceDataPanel
                  afterApy={<GovPublicCard symbol={currentToken?.symbol} className="mx-3 mb-4" />}
                />
                {/* 查询组件放在社区tab的最下面 */}
                <GovQueryPanel />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </>
  );
};

export default GovPage;
