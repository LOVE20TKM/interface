'use client';
import React, { useContext, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

// my hooks
import { useVerifyingActions } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

// utils
import { formatTokenAmount } from '@/src/lib/format';

interface VerifingActionListProps {
  currentRound: bigint;
}

// 所有需要验证的行动列表
const VerifyingActionList: React.FC<VerifingActionListProps> = ({ currentRound }) => {
  const { token } = useContext(TokenContext) || {};
  const { address } = useAccount();
  const router = useRouter();

  // 获取数据
  const { verifyingActions, isPending, error } = useVerifyingActions(
    (token?.address as `0x${string}`) || '',
    currentRound,
    address as `0x${string}`,
  );

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (error) {
      handleContractError(error, 'dataviewer');
    }
  }, [error]);

  if (!token || isPending) {
    return (
      <div className="p-4 flex justify-center items-center">
        <LoadingIcon />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <LeftTitle title="所有验证中行动" />
        <Button variant="outline" size="sm" className="text-secondary border-secondary" asChild>
          <Link href={`/gov?symbol=${token?.symbol}`}>返回治理首页</Link>
        </Button>
      </div>
      {!verifyingActions?.length && (
        <div className="text-sm mt-4 text-greyscale-500 text-center">本轮没有行动要验证</div>
      )}
      {verifyingActions && verifyingActions.length > 0 && (
        <div className="mt-4 space-y-4">
          {verifyingActions
            ?.sort((a, b) => {
              // 按照 action id 从小到大排序
              const idA = BigInt(a.action.head.id);
              const idB = BigInt(b.action.head.id);
              return idA < idB ? -1 : idA > idB ? 1 : 0;
            })
            ?.map((verifyingAction) => (
              <Card key={verifyingAction.action.head.id} className="shadow-none">
                <Link
                  className="relative block"
                  href={`/action/info/?id=${verifyingAction.action.head.id}&symbol=${token?.symbol}&tab=verify`}
                >
                  <CardHeader className="px-3 pt-2 pb-1 flex-row justify-start items-baseline">
                    <span className="text-greyscale-400 text-sm mr-1">{`No.`}</span>
                    <span className="text-secondary text-xl font-bold mr-2">
                      {String(verifyingAction.action.head.id)}
                    </span>
                    <span className="font-bold text-greyscale-800">{`${verifyingAction.action.body.title}`}</span>
                  </CardHeader>
                  <CardContent className="px-3 pt-1 pb-2">
                    {/* <div className="text-greyscale-500">{verifyingAction.action.body.consensus}</div> */}
                    <div className="text-xs mt-2 flex justify-between">
                      <span>
                        <span className="text-greyscale-400 mr-1">投票数</span>
                        <span className="text-secondary"> {formatTokenAmount(verifyingAction.votesNum)}</span>
                      </span>
                      <span>
                        <span className="text-greyscale-400 mr-1">已验证票数</span>
                        <span className="text-secondary"> {formatTokenAmount(verifyingAction.verificationScore)}</span>
                      </span>
                      <span>
                        <span className="text-greyscale-400 mr-1">进度</span>
                        <span className="text-secondary">
                          {verifyingAction.votesNum > BigInt(0)
                            ? `${Number((verifyingAction.verificationScore * BigInt(100)) / verifyingAction.votesNum)}%`
                            : '0%'}
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

export default VerifyingActionList;
