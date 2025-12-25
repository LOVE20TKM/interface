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
import ActionPanelForSubmit from '@/src/components/ActionDetail/ActionPanelForSubmit';

/**
 * 推举行动页面
 * URL参数:
 * - id: 行动ID
 * - submitted: 是否已推举 ('true' | 'false')
 */
const SubmitActionPage = () => {
  const router = useRouter();
  const { id, submitted } = router.query;
  const idParam = id as string;
  const submittedParam = submitted as string;
  const actionId = id ? BigInt(id as string) : undefined;
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};

  const [round, setRound] = useState<bigint | null>(null);
  const handleRoundChange = (newRound: bigint) => {
    setRound(newRound);
  };

  // 获取行动详情数据（包括扩展信息）
  const { isExtensionAction, extensionAddress, factory } = useActionDetailData({
    tokenAddress: token?.address,
    actionId,
    account,
  });

  return (
    <>
      <Header title="行动详情" showBackButton={true} />
      <main className="flex-grow">
        <ActionPanelForSubmit
          actionId={BigInt(idParam || 0)}
          submitted={submittedParam === 'true'}
          onRoundChange={handleRoundChange}
        />
        <ActionDetail
          actionId={BigInt(idParam || 0)}
          round={BigInt(round || 0)}
          showSubmitter={false}
          isExtensionAction={isExtensionAction}
          extensionAddress={extensionAddress}
          factory={factory}
        />
      </main>
    </>
  );
};

export default SubmitActionPage;
