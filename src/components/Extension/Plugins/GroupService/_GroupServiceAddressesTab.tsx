// components/Extension/Plugins/GroupService/_GroupServiceAddressesTab.tsx
// 链群服务扩展行动 - 地址公示标签

import React, { useContext } from 'react';
import { useAccount } from 'wagmi';

// my hooks
import { useGroupServiceActionAccounts } from '@/src/hooks/extension/plugins/group-service/composite';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

// my funcs
import { formatNumber } from '@/src/lib/format';

interface GroupServiceAddressesTabProps {
  extensionAddress: `0x${string}`;
  actionId: bigint;
}

/**
 * 渲染链群信息组件
 */
const renderGroups = (groupIds: bigint[], groupNames: string[]) => {
  if (groupIds.length === 0) {
    return <span className="text-gray-400">无</span>;
  }

  return (
    <div className="space-y-1">
      {groupIds.map((groupId, index) => (
        <div key={groupId.toString()}>
          <span className="text-gray-500 text-xs">#</span>
          <span className="text-secondary text-base font-semibold">{groupId.toString()}</span>{' '}
          <span className="font-semibold">{groupNames[index] || ''}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * 链群服务扩展 - 地址公示标签
 *
 * 显示所有参与者的地址、加入轮次和链群信息
 */
const GroupServiceAddressesTab: React.FC<GroupServiceAddressesTabProps> = ({ extensionAddress, actionId }) => {
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};

  const { participants, isPending, error } = useGroupServiceActionAccounts({
    extensionAddress,
    tokenAddress: token?.address as `0x${string}`,
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

  // 按加入轮次排序（轮次小的在前）
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.joinedRound < b.joinedRound) return -1;
    if (a.joinedRound > b.joinedRound) return 1;
    return 0;
  });

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-2 text-left">服务者地址</th>
            <th className="px-2 text-center">加入轮次</th>
            <th className="px-2 text-left hidden md:table-cell">链群列表</th>
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
                {/* 小屏：在地址下方显示链群信息 */}
                <div className="md:hidden mt-2">{renderGroups(participant.groupIds, participant.groupNames)}</div>
              </td>
              <td className="px-2 text-center">{formatNumber(participant.joinedRound)}</td>
              {/* 大屏：链群信息单独一列 */}
              <td className="px-2 hidden md:table-cell">
                {renderGroups(participant.groupIds, participant.groupNames)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GroupServiceAddressesTab;
