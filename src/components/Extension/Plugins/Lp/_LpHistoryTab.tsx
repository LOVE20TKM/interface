// components/Extension/Plugins/Lp/_LpHistoryTab.tsx
// 质押LP扩展行动 - 激励公示标签

import React, { useState, useEffect, useContext } from 'react';
import { useAccount } from 'wagmi';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useLpVerifyHistoryData } from '@/src/hooks/extension/plugins/lp/composite/useLpVerifyHistoryData';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';

// my components
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import ChangeRound from '@/src/components/Common/ChangeRound';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';

// my funcs
import { formatPercentage, formatRoundForDisplay, formatNumber, formatTokenAmount } from '@/src/lib/format';

interface LpHistoryTabProps {
  extensionAddress: `0x${string}`;
  currentRound: bigint; // 行动轮次
  actionId: bigint;
}

/**
 * 质押LP扩展 - 激励公示标签
 *
 * 显示历史激励分配结果
 */
const LpHistoryTab: React.FC<LpHistoryTabProps> = ({
  extensionAddress,
  currentRound, // 行动轮次
  actionId,
}) => {
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};

  // 内部状态：选择的验证轮次（基于行动轮次 - 2）
  const [selectedRound, setSelectedRound] = useState<bigint>(BigInt(0));

  // 初始化选择的轮次（行动轮次 - 2）
  useEffect(() => {
    if (currentRound > BigInt(2)) {
      setSelectedRound(currentRound - BigInt(2));
    }
  }, [currentRound]);

  // 内部轮次切换处理
  const handleChangedRound = (round: number) => {
    setSelectedRound(BigInt(round));
  };

  const { participants, totalScore, isEmpty, isPending, error } = useLpVerifyHistoryData({
    extensionAddress,
    tokenAddress: token?.address as `0x${string}` | undefined,
    actionId,
    round: selectedRound,
  });

  // 获取当前验证轮次
  const { currentRound: currentVerifyRound } = useCurrentRound();
  const isCurrentVerifyRound = selectedRound === currentVerifyRound;

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

  // 按激励金额排序（score 已废弃）
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.reward > b.reward) return -1;
    if (a.reward < b.reward) return 1;
    return 0;
  });

  return (
    <div className="relative pb-4">
      {/* 轮次选择器 */}
      {selectedRound === BigInt(0) && (
        <div className="flex items-center justify-center">
          <div className="text-center text-sm text-greyscale-500">暂无激励结果</div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {selectedRound > 0 && (
            <>
              <LeftTitle title={`第 ${selectedRound.toString()} 轮激励`} />
              <span className="text-sm text-greyscale-500 ml-2">(</span>
              <ChangeRound
                currentRound={
                  token && currentRound > BigInt(2) ? formatRoundForDisplay(currentRound - BigInt(2), token) : BigInt(0)
                }
                handleChangedRound={handleChangedRound}
              />
              <span className="text-sm text-greyscale-500">)</span>
            </>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      {isEmpty ? (
        <div className="text-center text-sm text-greyscale-400 p-4">
          {isCurrentVerifyRound ? '该轮激励结果还没生成好，请稍等' : '该轮没有激励结果'}
        </div>
      ) : selectedRound > BigInt(0) && participants.length > 0 ? (
        <div className="overflow-x-auto mt-4">
          <table className="table w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-2 text-left">地址</th>
                {/* <th className="px-2 text-right">得分</th> */}
                <th className="px-2 text-right">溢出销毁激励</th>
                <th className="px-2 text-right">可铸造激励</th>
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
                  {/* <td className="px-2 text-right">{formatNumber(participant.score)}</td> */}
                  <td className="px-2 text-right text-greyscale-500">
                    {participant.burnReward !== BigInt(0) ? `-${formatTokenAmount(participant.burnReward)}` : formatTokenAmount(participant.burnReward)}
                  </td>
                  <td className="px-2 text-right">{formatTokenAmount(participant.reward)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
};

export default LpHistoryTab;
