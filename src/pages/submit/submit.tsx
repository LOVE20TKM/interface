import React, { useState } from 'react';
import { useRouter } from 'next/router';

// my types
import { ActionInfo } from '@/src/types/love20types';

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
        <ActionPanelForSubmit
          actionId={BigInt(idParam || 0)}
          submitted={submittedParam === 'true'}
          onRoundChange={handleRoundChange}
        />
        <ActionDetail
          actionId={BigInt(idParam || 0)}
          round={BigInt(round || 0)}
          showSubmitter={false}
          onActionInfo={setActionInfo}
        />
      </main>
    </>
  );
};

export default SubmitActionPage;
