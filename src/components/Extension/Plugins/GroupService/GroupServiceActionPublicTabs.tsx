'use client';

import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';

// my hooks
import { useContractError } from '@/src/errors/useContractError';
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
import _RewardDetailByVerifier from './_RewardDetailByVerifier';

// my funcs
import { formatTokenAmount, formatPercentage } from '@/src/lib/format';

interface GroupServiceActionPublicTabsProps {
  currentJoinRound: bigint;
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress?: `0x${string}`; // Optional, consistent with hook usage if needed later
}

/**
 * 链群服务激励公示页面容器组件
 *
 * 功能：
 * - 展示某一轮次所有参与者的激励列表
 * - 支持轮次切换
 * - 支持查看二次分配明细
 * - 支持点击地址查看该服务者的详细激励情况（通过状态切换）
 */
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
  const [showDetail, setShowDetail] = useState(false);
  const [selectedVerifier, setSelectedVerifier] = useState<`0x${string}` | undefined>(undefined);

  // 从URL获取round参数
  const { round: urlRound } = router.query;

  // 初始化轮次状态 (默认为上一轮)
  useEffect(() => {
    if (urlRound && !isNaN(Number(urlRound))) {
      setSelectedRound(BigInt(urlRound as string));
    } else if (token && currentJoinRound - BigInt(token.initialStakeRound) >= BigInt(2)) {
      // 默认为上一轮
      setSelectedRound(currentJoinRound - BigInt(2));
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
  const { handleError } = useContractError();
  useEffect(() => {
    if (error) {
      handleError(error);
    }
  }, [error, handleError]);

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

  // 处理查看服务者详细激励
  const handleViewDetail = (verifier: `0x${string}`) => {
    setSelectedVerifier(verifier);
    setShowDetail(true);
  };

  // 处理返回列表
  const handleBack = () => {
    setShowDetail(false);
    setSelectedVerifier(undefined);
  };

  // 如果显示详情且有选中的服务者，显示服务者激励明细
  if (showDetail && selectedVerifier) {
    return (
      <_RewardDetailByVerifier
        extensionAddress={extensionAddress}
        verifier={selectedVerifier}
        currentJoinRound={currentJoinRound}
        onBack={handleBack}
      />
    );
  }

  // 否则显示激励列表
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
              <ChangeRound currentRound={currentJoinRound - BigInt(2)} handleChangedRound={handleChangedRound} />
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
          <table className="table w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-1 text-left">No.</th>
                <th className="px-1 text-center">地址</th>
                <th className="px-1 text-center">激励</th>
                <th className="px-1 text-center">明细</th>
              </tr>
            </thead>
            <tbody>
              {sortedRewards.map((item, index) => (
                <tr
                  key={item.account}
                  className={`border-b border-gray-100 ${item.account === account ? 'bg-blue-50/50' : ''}`}
                >
                  <td className="px-1 text-greyscale-400">{index + 1}</td>
                  <td className="px-1">
                    <div onClick={() => handleViewDetail(item.account)} className="cursor-pointer hover:opacity-80">
                      <AddressWithCopyButton
                        address={item.account}
                        showCopyButton={true}
                        word={item.account === account ? '(我)' : ''}
                      />
                    </div>
                  </td>
                  <td className="px-1 text-center">
                    <div className="font-mono text-secondary">{formatTokenAmount(item.amount)}</div>
                    <div className="text-greyscale-500 text-xs">
                      (
                      {totalReward > BigInt(0)
                        ? formatPercentage(Number((BigInt(item.amount) * BigInt(10000)) / totalReward) / 100)
                        : '0%'}
                      )
                    </div>
                  </td>
                  <td className="px-1 text-center">
                    <Button
                      variant="link"
                      className="text-secondary text-sm font-normal"
                      size="sm"
                      onClick={() => handleViewDetail(item.account)}
                    >
                      查看
                    </Button>
                  </td>
                </tr>
              ))}

              {/* 汇总行 */}
              <tr className="text-greyscale-900">
                <td className="px-1 text-left"></td>
                <td className="px-1 text-left">汇总</td>
                <td className="px-1 text-center">
                  <div className="font-mono text-secondary">{formatTokenAmount(totalReward)}</div>
                  <div className="text-greyscale-500 text-xs">(100%)</div>
                </td>
                <td className="px-1"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GroupServiceActionPublicTabs;
