'use client';

// my hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';

// my components
import Header from '@/src/components/Header';
import VerifyingActionList from '@/src/components/ActionList/VerifyingActionList';

const VerifyPage = () => {
  const { currentRound, error: errorCurrentRound } = useCurrentRound();

  return (
    <>
      <Header title="验证中的行动" showBackButton={true} />
      <main className="flex-grow">
        <VerifyingActionList currentRound={currentRound} />
      </main>
    </>
  );
};

export default VerifyPage;
