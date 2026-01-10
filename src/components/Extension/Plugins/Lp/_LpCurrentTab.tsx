// components/Extension/Plugins/Lp/_LpCurrentTab.tsx
// LP扩展行动 - 当前参与标签

import React from 'react';
import { useAccount } from 'wagmi';

// my hooks
import { useLpActionAccounts } from '@/src/hooks/extension/plugins/lp/composite/useLpActionAccounts';

// my components
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

// my funcs
import { formatPercentage, formatNumber } from '@/src/lib/format';

interface LpCurrentTabProps {
  extensionAddress: `0x${string}`;
  tokenAddress: `0x${string}` | undefined;
  actionId: bigint;
}

/**
 * LP扩展 - 当前参与标签
 *
 * 实时显示所有参与者的质押状态
 */
const LpCurrentTab: React.FC<LpCurrentTabProps> = ({ extensionAddress, tokenAddress, actionId }) => {
  const { address: account } = useAccount();

  const { participants, isPending, error } = useLpActionAccounts({
    extensionAddress,
    tokenAddress,
    actionId,
  });

  if (isPending) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingIcon />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        <p>加载失败：{error.message || '获取数据失败'}</p>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>暂无参与者</p>
      </div>
    );
  }

  // 按得分排序
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.score > b.score) return -1;
    if (a.score < b.score) return 1;
    return 0;
  });

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-2 text-left">地址</th>
            <th className="px-2 text-right">治理票/LP</th>
            <th className="px-2 text-right">加入轮次</th>
          </tr>
        </thead>
        <tbody>
          {sortedParticipants.map((participant) => (
            <tr
              key={participant.address}
              className={`border-b border-gray-100 ${participant.address === account ? 'text-secondary' : ''}`}
            >
              <td className="px-2">
                <AddressWithCopyButton
                  address={participant.address}
                  showCopyButton={true}
                  word={participant.address === account ? '(我)' : ''}
                />
              </td>
              <td className="px-2 text-right">
                <div className="flex flex-col">
                  <div className="text-xs text-gray-500 mt-1">
                    <div>治理票: {formatPercentage(participant.govVotesRatio * 100)}</div>
                    <div>LP: {formatPercentage(participant.lpRatio * 100)}</div>
                  </div>
                </div>
              </td>
              <td className="px-2 text-right">{formatNumber(participant.joinedRound)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LpCurrentTab;
