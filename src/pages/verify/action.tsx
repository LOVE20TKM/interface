'use client';

import { useRouter } from 'next/router';
import Link from 'next/link';
import React, { useContext, useEffect, useState } from 'react';

// my hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { TokenContext } from '@/src/contexts/TokenContext';

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
  const { token } = useContext(TokenContext) || {};
  const { currentRound, error: errorCurrentRound } = useCurrentRound();

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorCurrentRound) {
      handleContractError(errorCurrentRound, 'verify');
    }
  }, [errorCurrentRound]);

  // 状态：剩余票数
  const [remainingVotes, setRemainingVotes] = useState<bigint>(BigInt(-1));
  function onRemainingVotesChange(votes: bigint) {
    setRemainingVotes(votes);
  }

  console.log('remainingVotes', remainingVotes);

  // 行动详情
  const [actionInfo, setActionInfo] = useState<ActionInfo | undefined>(undefined);

  return (
    <>
      <Header title="验证" backUrl={`/verify/?symbol=${token?.symbol}`} />
      <main className="flex-grow">
        {remainingVotes > 0 && (
          <div className="px-2 pt-4">
            <div className="flex justify-between items-center">
              <LeftTitle title="请分配您的验证票：" />
              <Link
                href={`/action/info/?id=${actionId}&symbol=${token?.symbol}&tab=verify&tab2=current`}
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                验证结果&gt;&gt;
              </Link>
            </div>
            <RoundLite currentRound={currentRound} roundType="verify" showCountdown={false} />
          </div>
        )}

        <MyActionVerifingPanel
          currentRound={currentRound}
          actionId={actionId}
          onRemainingVotesChange={onRemainingVotesChange}
        />

        <div className="flex flex-col items-center px-2 py-4">
          {remainingVotes > BigInt(1) && (
            <AddressesForVerifying
              currentRound={currentRound}
              actionId={actionId}
              actionInfo={actionInfo}
              remainingVotes={remainingVotes}
            />
          )}
          {remainingVotes >= BigInt(0) && remainingVotes <= BigInt(1) && (
            <AddressesStatus currentRound={currentRound} actionId={actionId} actionInfo={actionInfo} />
          )}
          {remainingVotes < BigInt(0) && <LoadingIcon />}
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
