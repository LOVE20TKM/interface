'use client';

import { useEffect } from 'react';

// my hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import Header from '@/src/components/Header';
import ActionListToVerify from '@/src/components/ActionList/ActionListToVerify';

const VerifyPage = () => {
  const { currentRound, error: errorCurrentRound } = useCurrentRound();
  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorCurrentRound) {
      handleContractError(errorCurrentRound, 'verify');
    }
  }, [errorCurrentRound]);

  return (
    <>
      <Header title="验证" showBackButton={true} />
      <main className="flex-grow">
        <ActionListToVerify currentRound={currentRound} />
      </main>
    </>
  );
};

export default VerifyPage;
