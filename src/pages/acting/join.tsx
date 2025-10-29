'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { HelpCircle } from 'lucide-react';

// my hooks
import { useActionInfo } from '@/src/hooks/contracts/useLOVE20Submit';
import { useExtension } from '@/src/hooks/contracts/useLOVE20ExtensionCenter';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatPercentage, formatSeconds } from '@/src/lib/format';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import Header from '@/src/components/Header';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import ActionPanelForJoin from '@/src/components/ActionDetail/ActionPanelForJoin';
import SubmitJoin from '@/src/components/Join/SubmitJoin';
import ActionExtensionJoinPanel from '@/src/components/ActionExtension/ActionExtensionJoinPanel';

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
    extensionAddress,
    isPending: isPendingExtension,
    error: errorExtension,
  } = useExtension((token?.address as `0x${string}`) || '', actionId === undefined ? BigInt(0) : BigInt(actionId));

  // 判断是否是扩展行动（扩展地址不为零地址）
  const isExtensionAction =
    extensionAddress && extensionAddress !== '0x0000000000000000000000000000000000000000' ? true : false;

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
            {isExtensionAction && extensionAddress ? (
              <>
                {/* 扩展行动：显示 ActionExtensionJoinPanel */}
                <ActionExtensionJoinPanel
                  actionId={BigInt(actionId)}
                  actionInfo={actionInfo}
                  extensionAddress={extensionAddress as `0x${string}`}
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
            <div className="flex flex-col w-full p-4">
              <div className="bg-blue-50/30 border-l-4 border-l-blue-50 rounded-r-lg p-4 mb-8 text-sm">
                <div className="flex items-center gap-2 text-base font-bold text-blue-800 pb-2">
                  <HelpCircle className="w-4 h-4" />
                  小贴士
                </div>
                <div className="text-base font-bold text-blue-700 pt-2 pb-1">行动激励：</div>
                <div className="text-sm text-blue-700">
                  1、验证阶段会随机抽取地址验证打分，然后按得分比例给这些地址分配代币激励
                </div>
                <div className="text-sm text-blue-700">
                  2、只有当1个行动获得的投票数，达到该轮总投票数
                  {formatPercentage(Number(process.env.NEXT_PUBLIC_ACTION_REWARD_MIN_VOTE_PER_THOUSAND) / 10)}
                  时，参与该行动才有激励
                </div>
                <div className="text-base font-bold text-blue-700 pt-2 pb-1">参与代币：</div>
                <div className="text-sm text-blue-700">1、参与代币越多，被选中验证并获得激励的概率越大</div>
                <div className="text-sm text-blue-700">2、参与的代币可随时取回，如不取回则自动参与此行动的后续轮次</div>
                <div className="text-base font-bold text-blue-700 pt-2 pb-1">加入限制：</div>
                <div className="text-sm text-blue-700">
                  每个行动阶段，最后{process.env.NEXT_PUBLIC_JOIN_END_PHASE_BLOCKS}
                  个区块（约
                  {formatSeconds(
                    (Number(process.env.NEXT_PUBLIC_JOIN_END_PHASE_BLOCKS) *
                      Number(process.env.NEXT_PUBLIC_BLOCK_TIME_MS)) /
                      1000,
                  )}
                  ），无法参与行动报名
                </div>
              </div>
            </div>
            {/* <ActionDetail actionId={BigInt(actionId)} round={currentRound} showSubmitter={false} /> */}
          </>
        )}
      </main>
    </>
  );
};

export default JoinPage;
