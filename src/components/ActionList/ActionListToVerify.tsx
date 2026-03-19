'use client';
import React, { useContext } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

// my hooks
import { useVerifingActionsByAccount } from '@/src/hooks/contracts/useLOVE20RoundViewer';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

// utils
import { formatPercentage, formatTokenAmount } from '@/src/lib/format';

interface VerifingActionListProps {
  currentRound: bigint;
}

// 【某个地址】待验证行动列表
const ActionListToVerify: React.FC<VerifingActionListProps> = ({ currentRound }) => {
  const { token } = useContext(TokenContext) || {};
  const { address } = useAccount();
  const router = useRouter();

  // 使用 useVerifyingActions 获取待验证行动列表
  const { myVerifyingActions, isPending, error } = useVerifingActionsByAccount(
    (token?.address as `0x${string}`) || '',
    currentRound || BigInt(0),
    address as `0x${string}`,
  );

  // // 如果只有1个行动，直接跳转到行动详情页
  // if (myVerifyingActions && myVerifyingActions.length === 1) {
  //   const actionId = myVerifyingActions[0].action.head.id;
  //   router.push(`/verify/action?id=${actionId}&symbol=${token?.symbol}&auto=true`);
  //   return null;
  // }

  if (!token || isPending) {
    return (
      <div className="p-4 flex justify-center items-center">
        <LoadingIcon />
      </div>
    );
  }

  console.log(myVerifyingActions);

  // 按照ID从小到大排序
  const sortedActions = myVerifyingActions?.slice().sort((a, b) => {
    return Number(a.action.head.id - b.action.head.id);
  });

  return (
    <div className="p-4">
      <LeftTitle title="我需验证的行动" />
      {!sortedActions?.length && <div className="text-sm mt-4 text-greyscale-500 text-center">没有待验证行动</div>}
      {sortedActions && sortedActions.length > 0 && (
        <div className="mt-4 space-y-4">
          {sortedActions.map((verifyingAction) => (
            <Card key={verifyingAction.action.head.id} className="shadow-none">
              <Link
                className="relative block"
                href={`/verify/action?id=${verifyingAction.action.head.id}&symbol=${token?.symbol}`}
              >
                <CardHeader className="px-3 pt-2 pb-1 flex-row justify-start items-baseline">
                  <span className="text-greyscale-400 text-sm mr-1">{`No.${verifyingAction.action.head.id}`}</span>
                  <span className="font-bold text-greyscale-800">{`${verifyingAction.action.body.title}`}</span>
                </CardHeader>
                <CardContent className="px-3 pt-1 pb-2">
                  <div className="text-xs text-greyscale-400 mt-2 flex justify-between">
                    <span>
                      总票数: <span className="text-secondary">{formatTokenAmount(verifyingAction.totalVotesNum)}</span>
                    </span>
                    <span>
                      我的票数: <span className="text-secondary">{formatTokenAmount(verifyingAction.myVotesNum)}</span>
                    </span>
                    <span>
                      我的占比:{' '}
                      <span className="text-secondary">
                        {formatPercentage(
                          Number((verifyingAction.myVotesNum * BigInt(10000)) / verifyingAction.totalVotesNum) / 100,
                        )}
                      </span>
                    </span>
                  </div>
                </CardContent>
                <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-greyscale-400 pointer-events-none" />
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionListToVerify;
