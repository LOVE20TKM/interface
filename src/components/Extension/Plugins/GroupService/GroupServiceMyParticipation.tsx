'use client';
import React, { useContext, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useHandleContractError } from '@/src/lib/errorUtils';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import { formatTokenAmount } from '@/src/lib/format';
import { toast } from 'react-hot-toast';

import {
  useJoinedValueByAccount,
  useJoinedValue,
  useExit,
  useRecipientsLatest
} from '@/src/hooks/extension/plugins/group-service/contracts/useLOVE20ExtensionGroupService';

import _GroupServiceSetRecipients from './_GroupServiceSetRecipients';

interface GroupServiceMyParticipationProps {
  extensionAddress: `0x${string}`;
  actionId?: bigint;
}

export default function GroupServiceMyParticipation({ extensionAddress, actionId }: GroupServiceMyParticipationProps) {
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};

  // Data Hooks
  const { joinedValueByAccount, isPending: isJoinedPending } = useJoinedValueByAccount(extensionAddress, account as `0x${string}`);
  const { joinedValue: totalJoinedValue } = useJoinedValue(extensionAddress);
  
  // Recipients Hooks (Read only here for display)
  const { addrs: recipientAddrs, basisPoints: recipientBasisPoints } = useRecipientsLatest(extensionAddress, account as `0x${string}`);

  // Exit Hook
  const { exit, isPending: isExitPending, isConfirming: isExitConfirming, isConfirmed: isExitConfirmed, writeError: exitError } = useExit(extensionAddress);

  // Error Handling
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (exitError) {
      handleContractError(exitError, 'extension');
    }
  }, [exitError, handleContractError]);
  
  useEffect(() => {
      if (isExitConfirmed) {
          toast.success("退出行动成功");
      }
  }, [isExitConfirmed]);

  // Calculations
  const myParticipation = joinedValueByAccount || BigInt(0);
  const totalParticipation = totalJoinedValue || BigInt(1); // avoid div by zero
  
  // Calculate percentage
  let percentage = 0;
  if (myParticipation > 0 && totalJoinedValue && totalJoinedValue > 0) {
      percentage = Number((myParticipation * 10000n) / totalJoinedValue) / 100;
  }
  
  const displayPercentage = (totalJoinedValue && totalJoinedValue > 0)
    ? `${percentage.toFixed(2)}%` 
    : '0.00%';

  const handleExit = async () => {
    if (myParticipation <= 0) {
        toast.error("您没有参与，无需退出");
        return;
    }
    await exit();
  }

  // Loading state for initial data
  if (isJoinedPending) {
      return <div className="p-8 text-center text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Data Area */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">我的参与</div>
            <div className="text-2xl font-bold mt-2 truncate" title={myParticipation.toString()}>
                {formatTokenAmount(myParticipation)}
            </div>
          </CardContent>
        </Card>
        <Card>
           <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">所占比例</div>
            <div className="text-2xl font-bold mt-2">{displayPercentage}</div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Distribution */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">二次分配地址</CardTitle>
          <_GroupServiceSetRecipients extensionAddress={extensionAddress} />
        </CardHeader>
        <CardContent>
          {recipientAddrs && recipientAddrs.length > 0 ? (
            <div className="space-y-2">
              {recipientAddrs.map((addr, idx) => (
                <div key={`${addr}-${idx}`} className="flex justify-between items-center text-sm border-b last:border-0 py-2 border-slate-100">
                  <span className="font-mono text-muted-foreground truncate max-w-[200px] md:max-w-none">{addr}</span>
                  <span className="font-medium bg-slate-100 px-2 py-1 rounded">
                    {recipientBasisPoints ? (Number(recipientBasisPoints[idx]) / 100).toFixed(2) : '0.00'}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-8 text-center bg-slate-50 rounded-md mt-2">
              没有需要二次分配的地址
            </div>
          )}
        </CardContent>
      </Card>

      {/* Buttons */}
      <div className="flex gap-4">
        <Button 
            variant="outline" 
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={handleExit}
            disabled={isExitPending || isExitConfirming || isExitConfirmed || myParticipation <= 0}
        >
          {isExitPending || isExitConfirming ? '退出中...' : isExitConfirmed ? '已退出' : '退出行动'}
        </Button>
        <Link href={`/my/rewardsofaction/?id=${actionId?.toString() || ''}&symbol=${token?.symbol || ''}`} className="flex-1 w-full">
             <Button variant="default" className="w-full">
                查看激励
             </Button>
        </Link>
      </div>
      
      <LoadingOverlay isLoading={isExitPending || isExitConfirming} text={isExitPending ? "提交退出..." : "确认退出..."} />
    </div>
  );
}

