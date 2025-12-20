'use client';

import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';

// my hooks
import { useHandleContractError } from '@/src/lib/errorUtils';
import { useAccountRewardsOfRound } from '@/src/hooks/extension/plugins/group-service/composite/useAccountRewardsOfRound';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my types
import { ActionInfo } from '@/src/types/love20types';

// my components
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import ChangeRound from '@/src/components/Common/ChangeRound';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import { Button } from '@/components/ui/button';
import RecipientsDetailDialog from './RecipientsDetailDialog';

// my funcs
import { formatRoundForDisplay, formatTokenAmount, formatPercentage } from '@/src/lib/format';

interface GroupServiceActionPublicTabsProps {
  currentJoinRound: bigint;
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress?: `0x${string}`; // Optional, consistent with hook usage if needed later
}

const GroupServiceActionPublicTabs: React.FC<GroupServiceActionPublicTabsProps> = ({
  currentJoinRound,
  actionId,
  actionInfo,
  extensionAddress,
}) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();
  const [selectedRound, setSelectedRound] = useState(BigInt(0));
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<`0x${string}` | undefined>(undefined);

  // 从URL获取round参数
  const { round: urlRound } = router.query;

  // 初始化轮次状态 (默认为上一轮)
  useEffect(() => {
    if (urlRound && !isNaN(Number(urlRound))) {
      setSelectedRound(BigInt(urlRound as string));
    } else if (token && currentJoinRound - BigInt(token.initialStakeRound) >= BigInt(1)) {
      // 默认为上一轮
      setSelectedRound(currentJoinRound - BigInt(1));
    }
  }, [urlRound, currentJoinRound, token]);

  // 获取某一轮次的所有参与地址与所获激励
  const { accountRewards, isPending, error } = useAccountRewardsOfRound({
    extensionAddress: extensionAddress,
    tokenAddress: token?.address as `0x${string}`,
    actionId,
    round: selectedRound > BigInt(0) ? selectedRound : undefined,
  });

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (error) {
      handleContractError(error, 'extension');
    }
  }, [error, handleContractError]);

  // 处理轮次切换
  const handleChangedRound = (round: number) => {
    const newRound = BigInt(round);
    setSelectedRound(newRound);

    // 更新URL参数并添加到历史记录
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

  // 数据处理：计算总激励、排序
  const { sortedRewards, totalReward } = useMemo(() => {
    if (!accountRewards || accountRewards.length === 0) {
      return { sortedRewards: [], totalReward: BigInt(0) };
    }

    const total = accountRewards.reduce((sum, item) => sum + item.amount, BigInt(0));

    // 按激励从高到低排序
    const sorted = [...accountRewards].sort((a, b) => {
      if (a.amount > b.amount) return -1;
      if (a.amount < b.amount) return 1;
      return 0;
    });

    return { sortedRewards: sorted, totalReward: total };
  }, [accountRewards]);

  // 显示的轮次
  const displayRound =
    token && currentJoinRound ? formatRoundForDisplay(currentJoinRound - BigInt(1), token) : BigInt(0);

  // 处理查看明细
  const handleViewDetail = (account: `0x${string}`) => {
    setSelectedAccount(account);
    setDetailDialogOpen(true);
  };

  return (
    <div className="relative pb-4">
      {/* 顶部：标题与轮次切换 */}
      {selectedRound === BigInt(0) && (
        <div className="flex items-center justify-center">
          <div className="text-center text-sm text-greyscale-500">暂无激励结果</div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {selectedRound > 0 && (
            <>
              <LeftTitle title={`第 ${selectedRound.toString()} 轮激励结果`} />

              <span className="text-sm text-greyscale-500 ml-2">(</span>
              <ChangeRound currentRound={displayRound} handleChangedRound={handleChangedRound} />
              <span className="text-sm text-greyscale-500">)</span>
            </>
          )}
        </div>
      </div>

      {/* 数据展示区 */}
      {isPending ? (
        <div className="flex justify-center items-center h-40">
          <LoadingIcon />
        </div>
      ) : !sortedRewards || sortedRewards.length === 0 ? (
        selectedRound > BigInt(0) && (
          <div className="text-center text-sm text-greyscale-400 p-8 border rounded-lg bg-gray-50">
            本轮暂无激励数据
          </div>
        )
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-greyscale-500">
                <th className="px-2 py-3 text-left font-medium">地址</th>
                <th className="px-2 py-3 text-right font-medium">激励</th>
                <th className="px-2 py-3 text-right font-medium">占比</th>
                <th className="px-2 py-3 text-center font-medium">二次分配</th>
              </tr>
            </thead>
            <tbody>
              {sortedRewards.map((item) => (
                <tr
                  key={item.account}
                  className={`border-b border-gray-50 hover:bg-gray-50 ${
                    item.account === account ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <td className="px-2 py-3">
                    <AddressWithCopyButton
                      address={item.account}
                      showCopyButton={true}
                      word={item.account === account ? '(我)' : ''}
                    />
                  </td>
                  <td className="px-2 py-3 text-right font-medium text-greyscale-900">
                    {formatTokenAmount(item.amount)}
                  </td>
                  <td className="px-2 py-3 text-right text-greyscale-600">
                    {totalReward > BigInt(0)
                      ? formatPercentage(Number((BigInt(item.amount) * BigInt(10000)) / totalReward) / 100)
                      : '0%'}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {item.hasRecipients ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(item.account)}
                        className="h-7 px-3 text-xs"
                      >
                        查看
                      </Button>
                    ) : (
                      <span className="text-greyscale-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}

              {/* 汇总行 */}
              <tr className="bg-gray-50 font-medium text-greyscale-900">
                <td className="px-2 py-3 text-left">汇总</td>
                <td className="px-2 py-3 text-right">{formatTokenAmount(totalReward)}</td>
                <td className="px-2 py-3 text-right">100%</td>
                <td className="px-2 py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 二次分配明细 Dialog */}
      <RecipientsDetailDialog
        extensionAddress={extensionAddress}
        tokenAddress={token?.address as `0x${string}`}
        account={selectedAccount}
        round={selectedRound > BigInt(0) ? selectedRound : undefined}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
};

export default GroupServiceActionPublicTabs;
