'use client';

// my hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';

// my components
import Header from '@/src/components/Header';
import ActionListToVerify from '@/src/components/ActionList/ActionListToVerify';

const VerifyPage = () => {
  const { currentRound, error: errorCurrentRound } = useCurrentRound();

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
