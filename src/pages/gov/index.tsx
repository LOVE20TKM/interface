import React, { useContext } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 导入context
import { TokenContext } from '@/src/contexts/TokenContext';

// 导入hooks
import { useValidGovVotes, useCurrentRound } from '@/src/hooks/contracts/useLOVE20Stake';
import { useHandleContractError } from '@/src/lib/errorUtils';

// 导入组件
import Header from '@/src/components/Header';
import TokenTab from '@/src/components/Token/TokenTab';
import GovernanceDataPanel from '@/src/components/DataPanel/GovernanceDataPanel';
import MyVotingPanel from '@/src/components/My/MyVotingPanel';
import MyVerifingPanel from '@/src/components/My/MyVerifingPanel';
import Todeploy from '@/src/components/Launch/Todeploy';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import MyGovInfoPanel from '@/src/components/My/MyGovInfoPanel';
import GovQueryPanel from '@/src/components/My/GovQueryPanel';
import LeftTitle from '@/src/components/Common/LeftTitle';
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card';

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

  // 错误处理
  const { handleContractError } = useHandleContractError();
  React.useEffect(() => {
    if (errorValidGovVotes) {
      handleContractError(errorValidGovVotes, 'stake');
    }
    if (errorCurrentRound) {
      handleContractError(errorCurrentRound, 'vote');
    }
  }, [errorValidGovVotes, errorCurrentRound]);

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
                  // 有治理票时显示三个治理组件
                  <>
                    <MyVotingPanel
                      currentRound={currentVoteRound ? currentVoteRound : BigInt(0)}
                      validGovVotes={validGovVotes}
                      isPendingValidGovVotes={isPendingValidGovVotes}
                    />
                    <MyVerifingPanel currentRound={currentVoteRound > 2 ? currentVoteRound - BigInt(2) : BigInt(0)} />
                    <Todeploy token={currentToken} />
                  </>
                ) : (
                  <>
                    {/* 无治理票时显示质押按钮 */}
                    <div className="flex flex-col items-center p-4 mt-4">
                      <div className="text-center mb-4 text-greyscale-500">您当前没有治理票，获取治理票后才能治理</div>
                      <Button className="w-1/2" asChild>
                        <Link href={`/stake/stakelp/?symbol=${currentToken?.symbol}`}>质押获取治理票</Link>
                      </Button>
                    </div>
                    <div className="flex space-x-8 mt-4 justify-center text-sm pb-4">
                      <Link
                        href={`/vote/actions/?symbol=${currentToken?.symbol}`}
                        className="text-secondary hover:text-blue-800"
                      >
                        投票中的行动 &gt;&gt;
                      </Link>
                      <Link
                        href={`/verify/actions/?symbol=${currentToken?.symbol}`}
                        className="text-secondary hover:text-blue-800"
                      >
                        验证中的行动 &gt;&gt;
                      </Link>
                    </div>
                  </>
                )}
              </TabsContent>
              <TabsContent value="community-assets">
                <GovernanceDataPanel />
                {/* 查询组件放在社区tab的最下面 */}
                <GovQueryPanel />
                <div className="mt-4">
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle className="text-lg">治理公示</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-8 justify-center text-sm">
                        <Button className="w-1/2 text-secondary border-secondary" asChild variant="outline">
                          <Link href={`/vote/actions/?symbol=${currentToken?.symbol}`}>投票中的行动 &gt;&gt;</Link>
                        </Button>
                        <Button className="w-1/2 text-secondary border-secondary" asChild variant="outline">
                          <Link href={`/verify/actions/?symbol=${currentToken?.symbol}`}>验证中的行动 &gt;&gt;</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </>
  );
};

export default GovPage;
