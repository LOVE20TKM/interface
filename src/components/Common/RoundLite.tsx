'use client';
import React, { useContext, useEffect, useState } from 'react';
import { useBlockNumber } from 'wagmi';

// my context
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import LeftTime from '@/src/components/Common/LeftTime';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

interface RoundProps {
  currentRound: bigint;
  roundType: string;
  showCountdown?: boolean; // 可选参数，控制是否显示倒计时
}

const RoundLite: React.FC<RoundProps> = ({ currentRound, roundType, showCountdown = true }) => {
  const { data: blockNumber } = useBlockNumber();
  const context = useContext(TokenContext);
  const token = context ? context.token : undefined;

  // 计算加载状态。注意：此处仅用于渲染判断，不影响 Hook 的调用顺序
  const isLoading = !blockNumber || !token || token.voteOriginBlocks === undefined;

  const [currentTokenRound, setCurrentTokenRound] = useState(BigInt(0));

  // 计算剩余时间相关变量
  const ROUND_BLOCKS = Number(process.env.NEXT_PUBLIC_PHASE_BLOCKS) || 0;
  const BLOCK_TIME = Number(process.env.NEXT_PUBLIC_BLOCK_TIME_MS) || 0;

  // 使用默认值防止 undefined 导致 NaN
  const voteOriginBlocks = token ? Number(token.voteOriginBlocks) : 0;

  // 根据当前区块数计算初始剩余区块数及剩余时间（秒）
  const leftBlocksStatic = ROUND_BLOCKS - ((Number(blockNumber) - voteOriginBlocks) % ROUND_BLOCKS);
  const initialTimeLeft = leftBlocksStatic > 0 ? Math.ceil((leftBlocksStatic * BLOCK_TIME) / 1000) : 0;

  // State: 保存倒计时剩余秒数，由 LeftTime 组件的 onTick 回调更新
  const [currentTimeLeft, setCurrentTimeLeft] = useState(initialTimeLeft);

  // 当 blockNumber 改变时重新同步剩余时间
  useEffect(() => {
    if (!blockNumber) return;
    const updatedLeftBlocks = ROUND_BLOCKS - ((Number(blockNumber) - voteOriginBlocks) % ROUND_BLOCKS);
    const updatedTimeLeft = updatedLeftBlocks > 0 ? Math.ceil((updatedLeftBlocks * BLOCK_TIME) / 1000) : 0;
    setCurrentTimeLeft(updatedTimeLeft);
  }, [blockNumber, ROUND_BLOCKS, BLOCK_TIME, voteOriginBlocks]);

  // 计算当前轮次
  useEffect(() => {
    if (currentRound > BigInt(0)) {
      setCurrentTokenRound(currentRound);
    }
  }, [currentRound]);

  // 计算轮次名称
  const roundName = roundType === 'vote' ? '投票' : roundType === 'verify' ? '验证' : '行动';

  // 如果 currentRound 为空，则设置默认值，否则转换为字符串
  const displayRound = currentTokenRound != null ? currentTokenRound.toString() : '0';

  if (currentTokenRound <= BigInt(0)) {
    return <></>;
  }

  // 当尚未加载相关数据时，返回加载中状态
  if (isLoading || currentTokenRound == null || currentTokenRound < BigInt(0)) {
    if (currentTokenRound == null || currentTokenRound < BigInt(0)) {
      console.log('currentTokenRound', currentTokenRound);
      console.log('currentRound', currentRound);
    }
    return <LoadingIcon />;
  }

  return (
    <div className="flex items-center mb-3">
      <span className="text-sm text-greyscale-400">
        (第<span className="text-greyscale-400">{displayRound}</span>轮{roundName}阶段，
        <span className="text-greyscale-400">剩余</span>
        <span className="text-greyscale-400">{Math.ceil((currentTimeLeft * 1000) / BLOCK_TIME)}</span>
        <span className="text-greyscale-400 mr-1">块, 约</span>
        {showCountdown ? (
          <>
            <LeftTime initialTimeLeft={initialTimeLeft} onTick={setCurrentTimeLeft} />
          </>
        ) : (
          <span className="text-greyscale-400">
            {currentTimeLeft < 60
              ? `${currentTimeLeft}秒`
              : currentTimeLeft <= 300
              ? `${Math.floor(currentTimeLeft / 60)}分钟${currentTimeLeft % 60}秒`
              : currentTimeLeft < 3600
              ? `${Math.floor(currentTimeLeft / 60)}分钟`
              : `${Math.floor(currentTimeLeft / 3600)}小时${Math.floor((currentTimeLeft % 3600) / 60)}分钟`}
          </span>
        )}
        <span className="text-greyscale-400">)</span>
      </span>
    </div>
  );
};

export default RoundLite;
