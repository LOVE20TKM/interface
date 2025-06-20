'use client';

import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

// my hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my types
import { ActionInfo } from '@/src/types/love20types';

// my components
import Header from '@/src/components/Header';
import ActionDetail from '@/src/components/ActionDetail/ActionDetail';
import LeftTitle from '@/src/components/Common/LeftTitle';
import MyActionVerifingPanel from '@/src/components/My/MyActionVerifingPanel';
import RoundLite from '@/src/components/Common/RoundLite';
import AddressesForVerifying from '@/src/components/Verify/AddressesForVerifying';
import AddressesStatus from '@/src/components/Verify/AddressesStatus';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

const VerifyPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const actionId = BigInt((id as string) || '0');

  const { currentRound, error: errorCurrentRound } = useCurrentRound();

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorCurrentRound) {
      handleContractError(errorCurrentRound, 'verify');
    }
  }, [errorCurrentRound]);

  // 状态：剩余票数
  const [remainingVotes, setRemainingVotes] = useState<bigint>(BigInt(-1n));
  function onRemainingVotesChange(votes: bigint) {
    setRemainingVotes(votes);
  }

  console.log('remainingVotes', remainingVotes);

  // 行动详情
  const [actionInfo, setActionInfo] = useState<ActionInfo | undefined>(undefined);

  return (
    <>
      <Header title="验证" />
      <main className="flex-grow">
        {remainingVotes > 0 && (
          <div className="px-4 pt-4">
            <LeftTitle title="请分配您的验证票：" />
            <RoundLite currentRound={currentRound} roundType="verify" showCountdown={false} />
          </div>
        )}

        <MyActionVerifingPanel
          currentRound={currentRound}
          actionId={actionId}
          onRemainingVotesChange={onRemainingVotesChange}
        />

        <div className="flex flex-col items-center p-4">
          {remainingVotes > 1n && (
            <AddressesForVerifying
              currentRound={currentRound}
              actionId={actionId}
              actionInfo={actionInfo}
              remainingVotes={remainingVotes}
            />
          )}
          {remainingVotes >= 0n && remainingVotes <= 1n && (
            <AddressesStatus
              currentRound={currentRound}
              actionId={actionId}
              actionInfo={actionInfo}
              remainingVotes={remainingVotes}
            />
          )}
          {remainingVotes < 0n && <LoadingIcon />}
        </div>

        <ActionDetail
          actionId={actionId}
          round={BigInt(currentRound || 0)}
          showSubmitter={true}
          onActionInfo={setActionInfo}
        />
      </main>
    </>
  );
};

export default VerifyPage;
