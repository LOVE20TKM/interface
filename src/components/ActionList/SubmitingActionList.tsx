'use client';
import React, { useContext, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Link from 'next/link';

// my hooks
import { useActionInfosByPage, useActionSubmits } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my context
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import { ActionInfo } from '@/src/types/love20types';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';
import AddressWithCopyButton from '../Common/AddressWithCopyButton';
import { UserPen } from 'lucide-react';

interface SubmitingActionListProps {
  currentRound: bigint;
}

const SubmitingActionList: React.FC<SubmitingActionListProps> = ({ currentRound }) => {
  const { token } = useContext(TokenContext) || {};

  const {
    actionInfos,
    isPending: isPendingActionInfosByPage,
    error: errorActionInfosByPage,
  } = useActionInfosByPage((token?.address as `0x${string}`) || '', BigInt(0), BigInt(100));

  const {
    actionSubmits,
    isPending: isPendingActionSubmits,
    error: errorActionSubmits,
  } = useActionSubmits((token?.address as `0x${string}`) || '', currentRound);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorActionInfosByPage) {
      handleContractError(errorActionInfosByPage, 'submit');
    }
    if (errorActionSubmits) {
      handleContractError(errorActionSubmits, 'submit');
    }
  }, [errorActionInfosByPage, errorActionSubmits]);

  if (!token) {
    return <LoadingIcon />;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <LeftTitle title="未推举的行动" />
        <Link href="/extension/factories/">
          <Button variant="outline" size="sm" className="text-secondary border-secondary">
            发起新行动
          </Button>
        </Link>
      </div>
      {isPendingActionInfosByPage || isPendingActionSubmits ? (
        <LoadingIcon />
      ) : (
        <div className="space-y-4">
          {actionInfos?.length === 0 && <div className="text-sm mt-4 text-greyscale-500 text-center">暂无行动</div>}

          {actionInfos &&
            actionInfos?.length > 0 &&
            actionInfos
              ?.filter((action: ActionInfo) => {
                const isSubmitted = actionSubmits?.some((submit) => submit.actionId === action.head.id);
                return !isSubmitted; // 只显示未推举的行动
              })
              ?.sort((a, b) => Number(b.head.id - a.head.id)) // 按id倒序排序，最新的在前
              ?.map((action: ActionInfo, index: number) => {
                return (
                  <Card key={action.head.id} className="shadow-none">
                    <Link
                      href={`/submit/submit?id=${action.head.id}&symbol=${token.symbol}&submitted=false`}
                      key={action.head.id}
                    >
                      <CardHeader className="px-3 pt-2 pb-1 flex-row justify-start items-baseline">
                        <span className="text-greyscale-400 text-sm">{`No.`}</span>
                        <span className="text-secondary text-xl font-bold mr-2">{String(action.head.id)}</span>
                        <span className="font-bold text-greyscale-800">{`${action.body.title}`}</span>
                      </CardHeader>
                      <CardContent className="px-3 pt-1 pb-2">
                        {/* <div className="text-base text-greyscale-600">{action.body.consensus}</div> */}
                        <div className="flex justify-between mt-1 text-sm">
                          <span className="flex items-center">
                            <UserPen className="text-greyscale-400 mr-1 h-3 w-3 -translate-y-0.5" />
                            <span className="text-greyscale-400">
                              <AddressWithCopyButton
                                address={action.head.author as `0x${string}`}
                                showCopyButton={false}
                                colorClassName2="text-secondary"
                              />
                            </span>
                          </span>
                          <span className="text-sm text-greyscale-600">未推举</span>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                );
              })}
        </div>
      )}
    </div>
  );
};

export default SubmitingActionList;
