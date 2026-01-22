// components/Extension/Plugins/GroupService/_GroupServiceAddressesTab.tsx
// 链群服务扩展行动 - 地址公示标签

import React, { useContext, useState } from 'react';
import { useAccount } from 'wagmi';
import { ChevronRight } from 'lucide-react';

// my hooks
import { useGroupServiceActionAccounts } from '@/src/hooks/extension/plugins/group-service/composite';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import ServiceProviderActionsDialog from './_ServiceProviderActionsDialog';

// my funcs
import { formatNumber } from '@/src/lib/format';

interface GroupServiceAddressesTabProps {
  extensionAddress: `0x${string}`;
  actionId: bigint;
}

/**
 * 链群服务扩展 - 地址公示标签
 *
 * 显示所有参与者的地址、加入轮次，点击行可查看详细的行动和链群信息
 */
const GroupServiceAddressesTab: React.FC<GroupServiceAddressesTabProps> = ({ extensionAddress, actionId }) => {
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<`0x${string}` | undefined>(undefined);

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

  // 处理点击行
  const handleRowClick = (address: `0x${string}`) => {
    setSelectedProvider(address);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-0 text-center"> </th>
              <th className="px-2 text-left">链群服务者</th>
              <th className="px-2 text-center">加入轮次</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedParticipants.map((participant, index) => (
              <tr
                key={participant.address}
                onClick={() => handleRowClick(participant.address)}
                className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  participant.address === account ? 'text-secondary' : ''
                }`}
              >
                <td className="px-0 text-center">{index + 1}</td>
                <td className="px-2">
                  <AddressWithCopyButton
                    address={participant.address}
                    showCopyButton={true}
                    word={participant.address === account ? '(我)' : ''}
                  />
                </td>
                <td className="px-2 text-center">{formatNumber(participant.joinedRound)}</td>
                <td className="px-2 text-center">
                  <ChevronRight className="h-5 w-5 text-gray-400 inline-block" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 服务者行动与链群对话框 */}
      <ServiceProviderActionsDialog
        extensionAddress={extensionAddress}
        serviceProvider={selectedProvider}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};

export default GroupServiceAddressesTab;
