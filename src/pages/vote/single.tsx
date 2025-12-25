import React, { useState, useContext } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useActionDetailData } from '@/src/hooks/composite/useActionDetailData';

// my components
import Header from '@/src/components/Header';
import ActionDetail from '@/src/components/ActionDetail/ActionDetail';
import ActionPanelForVoting from '@/src/components/ActionDetail/ActionPanelForVoting';

/**
 * 投票行动页面
 * URL参数:
 * - id: 行动ID
 */
const VoteSingleActionPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const idParam = id as string;
  const actionId = id ? BigInt(id as string) : undefined;
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};

  const [round, setRound] = useState<bigint | null>(null);
  const handleRoundChange = (newRound: bigint) => {
    setRound(newRound);
  };

  // 获取行动详情数据（包括扩展信息）
  const {
    isExtensionAction,
    extensionAddress,
    factory,
  } = useActionDetailData({
    tokenAddress: token?.address,
    actionId,
    account,
  });

  return (
    <>
      <Header title="行动详情" showBackButton={true} />
      <main className="flex-grow">
        <ActionPanelForVoting actionId={BigInt(idParam || 0)} onRoundChange={handleRoundChange} />
        <ActionDetail
          actionId={BigInt(idParam || 0)}
          round={BigInt(round || 0)}
          showSubmitter={true}
          isExtensionAction={isExtensionAction}
          extensionAddress={extensionAddress}
          factory={factory}
        />
      </main>
    </>
  );
};

export default VoteSingleActionPage;
