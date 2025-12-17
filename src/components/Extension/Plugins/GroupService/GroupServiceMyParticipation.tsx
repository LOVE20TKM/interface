'use client';
import React, { useContext, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useHandleContractError } from '@/src/lib/errorUtils';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import { formatTokenAmount } from '@/src/lib/format';
import { toast } from 'react-hot-toast';

import {
  useJoinedValueByAccount,
  useJoinedValue,
  useExit,
  useRecipientsLatest,
} from '@/src/hooks/extension/plugins/group-service/contracts/useLOVE20ExtensionGroupService';

import _GroupServiceSetRecipients from './_GroupServiceSetRecipients';
import LeftTitle from '@/src/components/Common/LeftTitle';

interface GroupServiceMyParticipationProps {
  extensionAddress: `0x${string}`;
  actionId?: bigint;
}

export default function GroupServiceMyParticipation({ extensionAddress, actionId }: GroupServiceMyParticipationProps) {
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};

  // Data Hooks
  const { joinedValueByAccount, isPending: isJoinedPending } = useJoinedValueByAccount(
    extensionAddress,
    account as `0x${string}`,
  );
  const { joinedValue: totalJoinedValue } = useJoinedValue(extensionAddress);

  // Recipients Hooks (Read only here for display)
  const { addrs: recipientAddrs, basisPoints: recipientBasisPoints } = useRecipientsLatest(
    extensionAddress,
    account as `0x${string}`,
  );

  // Exit Hook
  const {
    exit,
    isPending: isExitPending,
    isConfirming: isExitConfirming,
    isConfirmed: isExitConfirmed,
    writeError: exitError,
  } = useExit(extensionAddress);

  // Error Handling
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (exitError) {
      handleContractError(exitError, 'extension');
    }
  }, [exitError, handleContractError]);

  useEffect(() => {
    if (isExitConfirmed) {
      toast.success('退出行动成功');
    }
  }, [isExitConfirmed]);

  // Calculations
  const myParticipation = joinedValueByAccount || BigInt(0);
  const totalParticipation = totalJoinedValue || BigInt(1); // avoid div by zero

  // Calculate percentage
  let percentage = 0;
  if (myParticipation > 0 && totalJoinedValue && totalJoinedValue > 0) {
    percentage = Number((BigInt(myParticipation) * BigInt(10000)) / totalJoinedValue) / 100;
  }

  const displayPercentage = totalJoinedValue && totalJoinedValue > 0 ? `${percentage.toFixed(2)}%` : '0.00%';

  const handleExit = async () => {
    if (myParticipation <= 0) {
      toast.error('您没有参与，无需退出');
      return;
    }
    await exit();
  };

  // Loading state for initial data
  if (isJoinedPending) {
    return <div className="p-8 text-center text-muted-foreground">加载中...</div>;
  }

  return (
    <div>
      {/* 数据区 */}
      <div className="stats w-full grid grid-cols-2 divide-x-0 gap-4">
        {/* 我的参与 */}
        <div className="stat place-items-center flex flex-col justify-center">
          <div className="stat-title">我的参与</div>
          <div className="stat-value text-2xl text-secondary">{formatTokenAmount(myParticipation)}</div>
          <div className="stat-desc text-sm mt-2 whitespace-normal break-words text-center">{token?.symbol}</div>
        </div>

        {/* 所占比例 */}
        <div className="stat place-items-center flex flex-col justify-center">
          <div className="stat-title">占总服务量</div>
          <div className="stat-value text-2xl text-secondary">{displayPercentage}</div>
          <div className="stat-desc text-sm mt-2 whitespace-normal break-words text-center">
            总量 {formatTokenAmount(totalParticipation)}
          </div>
        </div>
      </div>

      {/* 按钮区 */}
      <div className="flex justify-center space-x-2 w-full">
        {/* 退出行动 */}
        <Button
          variant="outline"
          className="flex-1 text-secondary border-secondary"
          onClick={handleExit}
          disabled={isExitPending || isExitConfirming || isExitConfirmed || myParticipation <= 0}
        >
          {isExitPending ? '提交中' : isExitConfirming ? '确认中' : isExitConfirmed ? '已退出' : '退出行动'}
        </Button>

        {/* 查看激励 */}
        <Button variant="outline" className="flex-1 text-secondary border-secondary" asChild>
          <Link href={`/my/rewardsofaction?id=${actionId?.toString() || ''}&symbol=${token?.symbol || ''}`}>
            查看激励
          </Link>
        </Button>
      </div>

      {/* 二次分配地址 */}
      <div className="w-full mt-6">
        <div className="flex items-center justify-between">
          <LeftTitle title="二次分配地址" />
          <_GroupServiceSetRecipients extensionAddress={extensionAddress} />
        </div>

        {recipientAddrs && recipientAddrs.length > 0 ? (
          <table className="table w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-1 text-left">序号</th>
                <th className="px-1 text-left">地址</th>
                <th className="px-1 text-right">分配比例</th>
              </tr>
            </thead>
            <tbody>
              {recipientAddrs.map((addr, idx) => (
                <tr key={`${addr}-${idx}`} className="border-b border-gray-100">
                  <td className="px-1 text-greyscale-400">{idx + 1}</td>
                  <td className="px-1">
                    <div className="inline-flex items-center bg-gray-50 rounded-md px-2 py-1">
                      <AddressWithCopyButton address={addr as `0x${string}`} showCopyButton={true} />
                    </div>
                  </td>
                  <td className="px-1 text-right font-mono text-secondary">
                    {recipientBasisPoints ? (Number(recipientBasisPoints[idx]) / 100).toFixed(2) : '0.00'}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center text-sm text-greyscale-400 p-4 bg-gray-50 rounded-lg">暂无二次分配地址</div>
        )}
      </div>

      <LoadingOverlay
        isLoading={isExitPending || isExitConfirming}
        text={isExitPending ? '提交退出...' : '确认退出...'}
      />
    </div>
  );
}
