'use client';

import { useEffect, useContext } from 'react';
import { useRouter } from 'next/router';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Submit';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import Header from '@/src/components/Header';
import SubmitingActionList from '@/src/components/ActionList/SubmitingActionList';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

const Actions4SubmitPage = () => {
  const { currentRound, isPending, error: errorCurrentRound } = useCurrentRound();

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorCurrentRound) {
      handleContractError(errorCurrentRound, 'submit');
    }
  }, [errorCurrentRound]);

  // 如果还没有人质押，跳转到质押页面
  const router = useRouter();
  const { token: currentToken } = useContext(TokenContext) || {};
  useEffect(() => {
    if (currentToken && !currentToken.hasEnded) {
      // 如果发射未结束，跳转到发射页面
      router.push(`/launch?symbol=${currentToken.symbol}`);
    } else if (currentToken && !currentToken.initialStakeRound) {
      // 如果还没有人质押，跳转到质押页面
      router.push(`/gov/stakelp/?symbol=${currentToken.symbol}&first=true`);
    }
  }, [currentToken]);

  return (
    <>
      <Header title="推举" showBackButton={true} />
      <main className="flex-grow">
        {isPending ? <LoadingIcon /> : <SubmitingActionList currentRound={currentRound} />}
      </main>
    </>
  );
};

export default Actions4SubmitPage;
