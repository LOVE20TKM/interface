// components/Extension/Plugins/Group/_GroupParticipants.tsx
// 链群参与地址列表

'use client';

// React
import React, { useContext, useEffect, useMemo, useState } from 'react';

// Next.js
import { useRouter } from 'next/router';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';
import { useAccountInfosByGroupIdByRound } from '@/src/hooks/extension/plugins/group/composite/useAccountInfosByGroupIdByRound';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';
import { formatTokenAmount } from '@/src/lib/format';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import ChangeRound from '@/src/components/Common/ChangeRound';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

interface GroupParticipantsProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupId: bigint;
}

const _GroupParticipants: React.FC<GroupParticipantsProps> = ({ actionId, actionInfo, extensionAddress, groupId }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};

  // 获取当前轮次
  const { currentRound, isPending: isPendingRound, error: errorRound } = useCurrentRound();

  // 从URL获取round参数
  const { round: urlRound } = router.query;
  const [selectedRound, setSelectedRound] = useState<bigint>(currentRound || BigInt(1));

  // 初始化轮次状态
  useEffect(() => {
    if (urlRound && !isNaN(Number(urlRound))) {
      setSelectedRound(BigInt(urlRound as string));
    } else if (currentRound && currentRound > BigInt(0)) {
      setSelectedRound(currentRound);
    }
  }, [urlRound, currentRound]);

  // 获取指定轮次的参与地址信息
  const {
    accountInfos,
    isPending: isPendingAccounts,
    error: errorAccounts,
  } = useAccountInfosByGroupIdByRound({
    extensionAddress: extensionAddress as `0x${string}`,
    tokenAddress: token?.address as `0x${string}`,
    actionId,
    groupId,
    round: selectedRound,
  });

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorRound) handleError(errorRound);
    if (errorAccounts) handleError(errorAccounts);
  }, [errorRound, errorAccounts, handleError]);

  const handleChangedRound = (round: number) => {
    const newRound = BigInt(round);
    setSelectedRound(newRound);

    // 更新URL参数
    const currentQuery = { ...router.query };
    currentQuery.round = newRound.toString();

    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true },
    );
  };

  // 按参与代币数从高到低排序
  const sortedAccountInfos = useMemo(() => {
    if (!accountInfos) return [];
    return [...accountInfos].sort((a, b) => {
      // 从高到低排序
      if (a.amount > b.amount) return -1;
      if (a.amount < b.amount) return 1;
      return 0;
    });
  }, [accountInfos]);

  // 只有在初次加载且还没有数据时才显示整页加载状态
  if (isPendingRound) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="flex flex-col items-center py-8">
          <LoadingIcon />
          <p className="mt-4 text-gray-600">加载参与地址...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <div>Token信息加载中...</div>;
  }

  return (
    <div className="relative pb-4">
      {selectedRound === BigInt(0) && (
        <div className="flex items-center justify-center">
          <div className="text-center text-sm text-greyscale-500">暂无参与数据</div>
        </div>
      )}
      <div className="flex items-center">
        {selectedRound > 0 && (
          <>
            <LeftTitle title={`第 ${selectedRound.toString()} 轮参与地址`} />
            <span className="text-sm text-greyscale-500 ml-2">(</span>
            <ChangeRound currentRound={currentRound || BigInt(0)} handleChangedRound={handleChangedRound} />
            <span className="text-sm text-greyscale-500">)</span>
          </>
        )}
      </div>

      {/* 加载状态 */}
      {isPendingAccounts && (
        <div className="flex justify-center py-8">
          <LoadingIcon />
        </div>
      )}

      {/* 错误状态 */}
      {errorAccounts && (
        <div className="alert alert-error">
          <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>加载参与地址失败</span>
        </div>
      )}

      {/* 参与地址列表 */}
      {!isPendingAccounts &&
        !errorAccounts &&
        selectedRound > 0 &&
        (sortedAccountInfos.length === 0 ? (
          <div className="text-center text-sm text-greyscale-400 p-4">该轮次暂无参与地址</div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-1 text-left">No</th>
                <th className="px-1 text-center">行动者地址</th>
                <th className="px-1 text-center">参与代币</th>
                <th className="px-1 text-center">加入轮次</th>
              </tr>
            </thead>
            <tbody>
              {sortedAccountInfos.map((item, index) => (
                <tr key={`${item.address}-${index}`} className="border-b border-gray-100">
                  <td className="px-1 text-greyscale-700">{index + 1}</td>
                  <td className="px-1">
                    <AddressWithCopyButton address={item.address} showCopyButton={true} />
                  </td>
                  <td className="px-1 text-right font-mono text-secondary">{formatTokenAmount(item.amount)}</td>
                  <td className="px-1 text-right text-greyscale-700">{item.joinedRound.toString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
    </div>
  );
};

export default _GroupParticipants;
