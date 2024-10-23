import { useRouter } from 'next/router';
import React, { useState } from 'react';

import { useCurrentRound } from '../../hooks/contracts/useLOVE20Verify';

import Header from '../../components/Header';
import ActionDetail from '../../components/ActionDetail/ActionDetail';
import MyActionVerifingPanel from '../../components/My/MyActionVerifingPanel';
import VerifyAddresses from '../../components/Verify/VerifyAddresses';

const VerifyPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const actionId = BigInt((id as string) || '0');

  const { currentRound } = useCurrentRound();

  // 状态：剩余票数
  const [remainingVotes, setRemainingVotes] = useState<bigint>(BigInt(0));
  function onRemainingVotesChange(votes: bigint) {
    setRemainingVotes(votes);
  }

  return (
    <>
      <Header title="验证页面" />
      <main className="flex-grow">
        <div className="flex flex-col items-center p-4 border-t border-gray-200 bg-base-100 mb-4">
          <MyActionVerifingPanel
            currentRound={currentRound}
            actionId={actionId}
            onRemainingVotesChange={onRemainingVotesChange}
          />
          <VerifyAddresses currentRound={currentRound} actionId={actionId} remainingVotes={remainingVotes} />
        </div>
        <ActionDetail actionId={actionId} round={BigInt(currentRound || 0)} showSubmitter={true} />
      </main>
    </>
  );
};

export default VerifyPage;
