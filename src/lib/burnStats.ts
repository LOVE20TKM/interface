export interface CategoryStats {
  amount: bigint;
  score: bigint;
}

export interface BurnStats {
  slTokenLock: CategoryStats;
  stTokenLock: CategoryStats;
  govRewardBurn: CategoryStats;
  actionRewardBurn: CategoryStats;
}

export interface CategoryWeights {
  slTokenLock: bigint;
  stTokenLock: bigint;
  govRewardBurn: bigint;
  actionRewardBurn: bigint;
}

export type BurnActivityNoticePhase = 'not-started' | 'active' | 'finished';

export function getBurnActivityNoticePhaseLabel(phase: BurnActivityNoticePhase) {
  return {
    'not-started': '未开始',
    active: '进行中',
    finished: '已结束',
  }[phase];
}

export function getBurnActivityNoticePhaseClassName(phase: BurnActivityNoticePhase) {
  return {
    'not-started': 'border-amber-200 bg-amber-50 text-amber-700',
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    finished: 'border-greyscale-200 bg-greyscale-100 text-greyscale-700',
  }[phase];
}

export function getBurnActivityRound(currentVoteRound: bigint) {
  return currentVoteRound > BigInt(2) ? currentVoteRound - BigInt(3) : undefined;
}

export function getVoteRoundFromBlock(blockNumber: bigint, originBlocks: bigint, phaseBlocks: bigint) {
  if (phaseBlocks <= BigInt(0) || blockNumber < originBlocks) return BigInt(0);
  return (blockNumber - originBlocks) / phaseBlocks;
}

export function getBurnActivityNoticePhase(
  activityRound: bigint | undefined,
  startRound: bigint,
  endRound: bigint,
): BurnActivityNoticePhase {
  if (activityRound === undefined || activityRound < startRound) return 'not-started';
  return activityRound <= endRound ? 'active' : 'finished';
}

export function getBurnActivityNoticeMarker(
  phase: BurnActivityNoticePhase,
  activityRound: bigint | undefined,
) {
  if (phase === 'not-started') return 'pre-start' as const;
  if (phase === 'finished') return 'ended' as const;
  return activityRound;
}

export function getBurnActivityRoundsRemaining(currentVoteRound: bigint, startRound: bigint, endRound: bigint) {
  const startVoteRound = startRound + BigInt(3);
  if (currentVoteRound < startVoteRound) return { target: 'start' as const, rounds: startVoteRound - currentVoteRound };

  const endVoteRound = endRound + BigInt(4);
  if (currentVoteRound < endVoteRound) return { target: 'end' as const, rounds: endVoteRound - currentVoteRound };
}
