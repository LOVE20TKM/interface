'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';

// my hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import Header from '@/src/components/Header';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import StepSelectActions from '@/src/components/Vote/StepSelectActions';
import StepVoteSubmit from '@/src/components/Vote/StepVoteSubmit';

/**
 * 批量投票页面：选择多个行动并分配投票
 */
const BatchVotePage = () => {
  const { token } = useContext(TokenContext) || {};
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [selectedIds, setSelectedIds] = useState<bigint[]>([]);
  const { currentRound, isPending: isPendingCurrentRound, error: errCurrentRound } = useCurrentRound();
  const router = useRouter();

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errCurrentRound) {
      handleContractError(errCurrentRound, 'vote');
    }
  }, [errCurrentRound]);

  // 进入下一步
  const handleNext = (ids: bigint[]) => {
    setSelectedIds(ids);
    setCurrentStep(2);
  };

  // 返回上一步
  const handleBack = () => {
    setCurrentStep(1);
  };

  // 投票成功，返回第一步
  const handleSuccess = () => {
    setCurrentStep(1);
    setSelectedIds([]);
    router.push(`/vote/actions/?symbol=${token?.symbol}`);
  };

  const getTitle = () => {
    if (currentStep === 1) {
      return '投票首页';
    }
    return '投票';
  };

  return (
    <>
      <Header title={getTitle()} showBackButton={currentStep === 1} />
      <main className="flex-grow">
        {isPendingCurrentRound ? (
          <LoadingIcon />
        ) : currentStep === 1 ? (
          <StepSelectActions currentRound={currentRound} onNext={handleNext} />
        ) : (
          <StepVoteSubmit
            selectedIds={selectedIds}
            currentRound={currentRound}
            onBack={handleBack}
            onSuccess={handleSuccess}
          />
        )}
      </main>
    </>
  );
};

export default BatchVotePage;
