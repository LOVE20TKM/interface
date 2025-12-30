'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// my hooks
import { useActionInfo } from '@/src/hooks/contracts/useLOVE20Submit';
import { useExtensionContractInfo } from '@/src/hooks/extension/base/composite';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import Header from '@/src/components/Header';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import ActionPanelForJoin from '@/src/components/ActionDetail/ActionPanelForJoin';
import SubmitJoin from '@/src/components/Join/SubmitJoin';
import ExtensionActionJoinPanel from '@/src/components/Extension/Base/Action/ExtensionActionJoinPanel';

const JoinPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const actionId = id as string;
  const [stakedAmount, setStakedAmount] = useState<bigint | undefined>(undefined);
  function onStakedAmountChange(stakedAmount: bigint) {
    setStakedAmount(stakedAmount);
  }

  const { token } = useContext(TokenContext) || {};
  // const { currentRound, isPending: isPendingCurrentRound, error: errorCurrentRound } = useCurrentRound();

  // 获取行动详情
  const {
    actionInfo,
    isPending: isPendingActionInfo,
    error: errorActionInfo,
  } = useActionInfo(token?.address as `0x${string}`, actionId === undefined ? undefined : BigInt(actionId));

  // 检查是否是扩展行动
  const {
    contractInfo,
    isPending: isPendingExtension,
    error: errorExtension,
  } = useExtensionContractInfo({
    tokenAddress: token?.address as `0x${string}`,
    actionInfo,
  });

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorActionInfo) {
      handleContractError(errorActionInfo, 'submit');
    }
    if (errorExtension) {
      handleContractError(errorExtension, 'extension');
    }
  }, [errorActionInfo, errorExtension]);

  return (
    <>
      <Header title="加入行动" showBackButton={true} />
      <main className="flex-grow">
        {!id || Array.isArray(id) || isPendingActionInfo || isPendingExtension ? (
          <LoadingIcon />
        ) : (
          <>
            {/* 根据是否是扩展行动，显示不同的组件 */}
            {contractInfo?.isExtension && contractInfo?.extension && contractInfo?.factory ? (
              <>
                {/* 扩展行动：显示 ExtensionActionJoinPanel（根据类型自动选择对应组件） */}
                <ExtensionActionJoinPanel
                  actionId={BigInt(actionId)}
                  actionInfo={actionInfo}
                  extensionAddress={contractInfo.extension}
                  factory={contractInfo.factory.address}
                />
              </>
            ) : (
              <>
                {/* 普通行动：显示 ActionPanelForJoin + SubmitJoin */}
                <ActionPanelForJoin
                  actionId={BigInt(actionId)}
                  actionInfo={actionInfo}
                  onStakedAmountChange={onStakedAmountChange}
                  showJoinButton={false}
                />
                <SubmitJoin actionInfo={actionInfo} stakedAmount={stakedAmount} />
              </>
            )}

            {/* <ActionDetail actionId={BigInt(actionId)} round={currentRound} showSubmitter={false} /> */}
          </>
        )}
      </main>
    </>
  );
};

export default JoinPage;
