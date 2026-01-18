'use client';

import React, { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';

import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

import { useContractError } from '@/src/errors/useContractError';
import { formatTokenAmount } from '@/src/lib/format';
import NavigationUtils from '@/src/lib/navigationUtils';

import { useExtensionActionConstCache } from '@/src/hooks/extension/plugins/group/composite/useExtensionActionConstCache';
import { useTrialExit, useTrialJoinedListByProvider } from '@/src/hooks/extension/plugins/group/contracts/useGroupJoin';

interface GroupTrialJoinedListProps {
  extensionAddress: `0x${string}`;
  groupId: bigint;
  actionId: bigint;
}

const _GroupTrialJoinedList: React.FC<GroupTrialJoinedListProps> = ({ extensionAddress, groupId, actionId }) => {
  const { address: account } = useAccount();
  const hasCalledSuccessRef = useRef(false);

  const { constants } = useExtensionActionConstCache({ extensionAddress, actionId });
  const joinTokenSymbol = constants?.joinTokenSymbol;

  const { joinedList, isPending, error } = useTrialJoinedListByProvider(
    extensionAddress,
    groupId,
    (account || '0x0') as `0x${string}`,
  );

  const {
    trialExit,
    isPending: isPendingExit,
    isConfirming: isConfirmingExit,
    isConfirmed: isConfirmedExit,
    writeError: errorExit,
  } = useTrialExit();

  const { handleError } = useContractError();
  useEffect(() => {
    if (error) handleError(error);
    if (errorExit) handleError(errorExit);
  }, [error, errorExit, handleError]);

  useEffect(() => {
    if (isConfirmedExit && !hasCalledSuccessRef.current) {
      hasCalledSuccessRef.current = true;
      toast.success('已成功取消体验');
      setTimeout(() => {
        NavigationUtils.reloadWithOverlay();
      }, 2000);
    }
  }, [isConfirmedExit]);

  const handleTrialExit = async (targetAccount: `0x${string}`) => {
    await trialExit(extensionAddress, targetAccount);
  };

  if (!account) {
    return <div className="text-sm text-gray-500">请先连接钱包</div>;
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center py-6">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载体验中列表...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <table className="table w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-1 text-left w-12">No</th>
            <th className="px-1 text-left">地址 / 加入轮次</th>
            <th className="px-1 text-right">体验代币数量</th>
            <th className="px-1 text-right"> </th>
          </tr>
        </thead>
        <tbody>
          {joinedList.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-sm text-greyscale-400 p-4">
                没有体验中的地址
              </td>
            </tr>
          ) : (
            joinedList.map((item, index) => (
              <tr key={`${item.account}-${index}`} className="border-b border-gray-100">
                <td className="px-1">{index + 1}</td>
                <td className="px-1">
                  <AddressWithCopyButton address={item.account} showCopyButton={true} />
                  <div className="text-xs text-greyscale-400 mt-0.5">第{item.joinedRound.toString()}轮</div>
                </td>
                <td className="px-1 text-right">
                  <span className="font-mono text-secondary">{formatTokenAmount(item.amount)}</span>
                </td>
                <td className="px-1 text-right">
                  <button
                    onClick={() => handleTrialExit(item.account)}
                    disabled={isPendingExit || isConfirmingExit}
                    className="text-sm text-red-500 hover:text-red-600 disabled:text-gray-300 underline"
                  >
                    终止
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <LoadingOverlay
        isLoading={isPendingExit || isConfirmingExit}
        text={isPendingExit ? '正在提交...' : '正在确认...'}
      />
    </div>
  );
};

export default _GroupTrialJoinedList;
