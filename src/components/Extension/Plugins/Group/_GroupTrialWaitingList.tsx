'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';

import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import { Button } from '@/components/ui/button';

import { useContractError } from '@/src/errors/useContractError';
import { formatTokenAmount } from '@/src/lib/format';
import NavigationUtils from '@/src/lib/navigationUtils';

import {
  useTrialWaitingListByProvider,
  useTrialWaitingListRemove,
  useTrialWaitingListRemoveAll,
} from '@/src/hooks/extension/plugins/group/contracts/useGroupJoin';
import { Trash2 } from 'lucide-react';

interface GroupTrialWaitingListProps {
  extensionAddress: `0x${string}`;
  groupId: bigint;
  actionId: bigint;
}

const _GroupTrialWaitingList: React.FC<GroupTrialWaitingListProps> = ({ extensionAddress, groupId, actionId }) => {
  const router = useRouter();
  const { address: account } = useAccount();

  const {
    waitingList,
    isPending: isPendingWaitingList,
    error: errorWaitingList,
  } = useTrialWaitingListByProvider(extensionAddress, groupId, (account || '0x0') as `0x${string}`);

  const {
    trialWaitingListRemove,
    isPending: isPendingRemove,
    isConfirming: isConfirmingRemove,
    isConfirmed: isConfirmedRemove,
    writeError: errorRemove,
  } = useTrialWaitingListRemove();

  const {
    trialWaitingListRemoveAll,
    isPending: isPendingRemoveAll,
    isConfirming: isConfirmingRemoveAll,
    isConfirmed: isConfirmedRemoveAll,
    writeError: errorRemoveAll,
  } = useTrialWaitingListRemoveAll();

  const hasCalledSuccessRef = useRef(false);

  const { handleError } = useContractError();
  useEffect(() => {
    if (errorWaitingList) handleError(errorWaitingList);
    if (errorRemove) handleError(errorRemove);
    if (errorRemoveAll) handleError(errorRemoveAll);
  }, [errorWaitingList, errorRemove, errorRemoveAll, handleError]);

  useEffect(() => {
    if ((isConfirmedRemove || isConfirmedRemoveAll) && !hasCalledSuccessRef.current) {
      hasCalledSuccessRef.current = true;
      toast.success('操作成功');
      NavigationUtils.reloadWithOverlay();
    }
  }, [isConfirmedRemove, isConfirmedRemoveAll]);

  const handleRemove = async (address: `0x${string}`) => {
    await trialWaitingListRemove(extensionAddress, groupId, [address]);
  };

  const handleRemoveAll = async () => {
    if (!waitingList || waitingList.length === 0) {
      toast.error('暂无可取消的设置');
      return;
    }
    await trialWaitingListRemoveAll(extensionAddress, groupId);
  };

  const handleAddClick = () => {
    const { symbol } = router.query;
    router.push(
      `/extension/group_trial_add?groupId=${groupId.toString()}&actionId=${actionId.toString()}${
        symbol ? `&symbol=${symbol}` : ''
      }`,
    );
  };

  if (!account) {
    return <div className="text-sm text-gray-500">请先连接钱包</div>;
  }

  if (isPendingWaitingList) {
    return (
      <div className="flex flex-col items-center py-6">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载待使用列表...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <table className="table w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-1 text-left w-12">No</th>
            <th className="px-1 text-left">地址</th>
            <th className="px-1 text-right">体验代币数量</th>
            <th className="px-0 text-right"> </th>
          </tr>
        </thead>
        <tbody>
          {waitingList.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-sm text-greyscale-400 p-4">
                没有待体验地址
              </td>
            </tr>
          ) : (
            waitingList.map((item, index) => (
              <tr key={`${item.account}-${index}`} className="border-b border-gray-100">
                <td className="px-1">{index + 1}</td>
                <td className="px-1">
                  <AddressWithCopyButton address={item.account} showCopyButton={true} />
                </td>
                <td className="px-1 text-right">
                  <span className="font-mono text-secondary">{formatTokenAmount(item.amount)}</span>
                </td>
                <td className="px-0 text-right" style={{ verticalAlign: 'bottom' }}>
                  <button
                    onClick={() => handleRemove(item.account)}
                    disabled={isPendingRemove || isConfirmingRemove}
                    className="text-sm text-red-500 hover:text-red-600 disabled:text-gray-300"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleAddClick}
            variant="outline"
            size="sm"
            className="w-1/2 text-secondary border-secondary"
          >
            增加体验地址
          </Button>
          <Button
            onClick={handleRemoveAll}
            disabled={isPendingRemoveAll || isConfirmingRemoveAll || waitingList.length === 0}
            variant="outline"
            size="sm"
            className="w-1/2 text-secondary border-secondary"
          >
            删除所有地址
          </Button>
        </div>
      </div>

      <LoadingOverlay
        isLoading={isPendingRemove || isConfirmingRemove || isPendingRemoveAll || isConfirmingRemoveAll}
        text={isPendingRemove || isPendingRemoveAll ? '正在提交...' : '正在确认...'}
      />
    </div>
  );
};

export default _GroupTrialWaitingList;
