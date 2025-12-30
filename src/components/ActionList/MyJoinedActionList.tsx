'use client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronRight, UserPen } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';

// my hooks
import { useHandleContractError } from '@/src/lib/errorUtils';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';
import { useJoinedActions } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useMyJoinedExtensionActions } from '@/src/hooks/extension/base/composite';

// my contexts
import { Token } from '@/src/contexts/TokenContext';

// my types & funcs
import { JoinedAction } from '@/src/types/love20types';
import { formatPercentage, formatTokenAmount } from '@/src/lib/format';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import RoundLite from '@/src/components/Common/RoundLite';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AddressWithCopyButton from '../Common/AddressWithCopyButton';
import { Button } from '@/components/ui/button';

interface MyJoinedActionListProps {
  token: Token | null | undefined;
  onActionStatusChange?: (hasActions: boolean) => void;
}

const MyJoinedActionList: React.FC<MyJoinedActionListProps> = ({ token, onActionStatusChange }) => {
  const { currentRound } = useCurrentRound();
  const { address: account } = useAccount();

  // 获取 core 协议中的参与行动
  const {
    joinedActions: coreActions,
    isPending: isPendingCore,
    error: errorCore,
  } = useJoinedActions(token?.address as `0x${string}`, account as `0x${string}`);

  // 获取扩展协议中的参与行动
  const {
    joinedExtensionActions: extensionActions,
    isPending: isPendingExtension,
    error: errorExtension,
  } = useMyJoinedExtensionActions({
    tokenAddress: token?.address as `0x${string}`,
    account: account as `0x${string}`,
  });

  // 合并 core 和扩展行动，过滤掉重复的行动
  const joinedActions = useMemo(() => {
    // 确保两个数组都存在，避免 undefined 问题
    const safeCore = coreActions || [];
    const safeExtension = extensionActions || [];

    if (safeCore.length === 0 && safeExtension.length === 0) {
      return [];
    }

    // 创建 core 行动 ID 的 Set，用于去重
    const coreActionIds = new Set(safeCore.map((action) => action.action.head.id.toString()));

    // 过滤掉在 core 中已存在的扩展行动
    const uniqueExtensionActions = safeExtension.filter(
      (action) => !coreActionIds.has(action.action.head.id.toString()),
    );

    // 合并结果
    return [...safeCore, ...uniqueExtensionActions];
  }, [coreActions, extensionActions]);

  // 计算总的加载状态
  const isPendingJoinedActions = isPendingCore || isPendingExtension;

  // 通知父组件行动状态变化
  useEffect(() => {
    if (onActionStatusChange && !isPendingJoinedActions) {
      const hasActions = Boolean(joinedActions && joinedActions.length > 0);
      onActionStatusChange(hasActions);
    }
  }, [joinedActions, isPendingJoinedActions, onActionStatusChange]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorCore) {
      handleContractError(errorCore, 'dataViewer');
    }
    if (errorExtension) {
      handleContractError(errorExtension, 'extension');
    }
  }, [errorCore, errorExtension, handleContractError]);

  if (isPendingJoinedActions) {
    return (
      <>
        <div className="pt-4 px-4">
          <LeftTitle title="我参与的行动" />
          <div className="text-sm mt-4 text-greyscale-500 text-center">
            <LoadingIcon />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="pt-4 px-4">
      <LeftTitle title="我参与的行动" />
      <RoundLite currentRound={currentRound} roundType="act" />
      {!joinedActions?.length ? (
        <div className="text-sm text-greyscale-500 text-center my-6">没有参与行动，请先参与</div>
      ) : (
        <>
          <div className="mt-4 space-y-4">
            {[...joinedActions]
              .sort((a, b) => {
                // 首先按有无激励和是否投票排序，有激励且有投票的排在前面
                const aIsGood = a.hasReward && a.votesNum > 0;
                const bIsGood = b.hasReward && b.votesNum > 0;

                if (aIsGood && !bIsGood) return -1;
                if (!aIsGood && bIsGood) return 1;

                // 然后按参与代币数量从大到小排序
                return Number(b.joinedAmountOfAccount) - Number(a.joinedAmountOfAccount);
              })
              .map((action: JoinedAction, index: number) => {
                // 根据是否有激励且有投票设置背景色和标题颜色
                const isGoodAction = action.hasReward && action.votesNum > 0;
                const cardClassName = isGoodAction ? 'shadow-none' : 'shadow-none bg-gray-50';

                return (
                  <Card key={action.action.head.id} className={cardClassName}>
                    <Link
                      href={`/my/myaction?id=${action.action.head.id}&symbol=${token?.symbol}`}
                      key={action.action.head.id}
                      className="relative block"
                    >
                      <CardHeader className="px-3 pt-2 pb-1 flex-row justify-between items-baseline">
                        <div className="flex items-baseline">
                          <span className="text-greyscale-400 text-sm">{`No.`}</span>
                          <span className="text-secondary text-xl font-bold mr-2">{String(action.action.head.id)}</span>
                          <span
                            className={`font-bold ${isGoodAction ? 'text-greyscale-800' : 'text-greyscale-400'}`}
                          >{`${action.action.body.title}`}</span>
                        </div>
                        {action.votesNum > 0 ? (
                          action.hasReward ? (
                            <></>
                          ) : (
                            <span className="text-error text-xs">无铸币激励</span>
                          )
                        ) : (
                          <span className="text-error text-xs">未投票</span>
                        )}
                      </CardHeader>
                      <CardContent className="px-3 pt-1 pb-2">
                        <div className="flex justify-between mt-1 text-sm">
                          <span className="flex items-center">
                            <UserPen className="text-greyscale-400 mr-1 h-3 w-3 -translate-y-0.5" />
                            <span className="text-greyscale-400">
                              <AddressWithCopyButton
                                address={action.action.head.author as `0x${string}`}
                                showCopyButton={false}
                                colorClassName2="text-secondary"
                              />
                            </span>
                          </span>
                          {action.votesNum > 0 && (
                            <span>
                              <span className="text-greyscale-400 mr-1">投票</span>
                              <span className="text-secondary">
                                {formatPercentage(Number(action.votePercentPerTenThousand) / 100)}
                              </span>
                            </span>
                          )}
                          <span>
                            <span className="text-greyscale-400 mr-1">我参与代币</span>
                            <span className="text-secondary">{formatTokenAmount(action.joinedAmountOfAccount)}</span>
                          </span>
                        </div>
                      </CardContent>
                      <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-greyscale-400 pointer-events-none" />
                    </Link>
                  </Card>
                );
              })}
          </div>

          <div className="flex justify-center space-x-4 mt-4">
            <Button variant="outline" className="w-1/2 text-secondary border-secondary" asChild>
              <Link href={`/my/actionrewards?symbol=${token?.symbol}`}>铸造 行动激励 &gt;&gt;</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default MyJoinedActionList;
