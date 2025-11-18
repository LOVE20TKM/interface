import React, { useState } from 'react';
import { useRouter } from 'next/router';

// my types
import { ActionInfo } from '@/src/types/love20types';

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

  const [round, setRound] = useState<bigint | null>(null);
  const handleRoundChange = (newRound: bigint) => {
    setRound(newRound);
  };

  // 行动详情
  const [actionInfo, setActionInfo] = useState<ActionInfo | undefined>(undefined);

  return (
    <>
      <Header title="行动详情" showBackButton={true} />
      <main className="flex-grow">
        <ActionPanelForVoting actionId={BigInt(idParam || 0)} onRoundChange={handleRoundChange} />
        <ActionDetail
          actionId={BigInt(idParam || 0)}
          round={BigInt(round || 0)}
          showSubmitter={true}
          onActionInfo={setActionInfo}
        />
      </main>
    </>
  );
};

export default VoteSingleActionPage;
