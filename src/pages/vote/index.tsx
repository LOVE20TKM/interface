'use client';

import { useEffect } from 'react';

// my hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import Header from '@/src/components/Header';
import VotingActionList from '@/src/components/ActionList/VotingActionList';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

const VotePage = () => {
  const { currentRound, isPending: isPendingCurrentRound, error: errCurrentRound } = useCurrentRound();

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errCurrentRound) {
      handleContractError(errCurrentRound, 'vote');
    }
  }, [errCurrentRound]);

  if (isPendingCurrentRound) {
    return <LoadingIcon />;
  }

  return (
    <>
      <Header title="投票首页" />
      <main className="flex-grow">
        <VotingActionList currentRound={currentRound} />
      </main>
    </>
  );
};

export default VotePage;
