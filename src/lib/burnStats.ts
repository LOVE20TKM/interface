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

export function getBurnActivityRoundsRemaining(currentVoteRound: bigint, startRound: bigint, endRound: bigint) {
  const startVoteRound = startRound + BigInt(3);
  if (currentVoteRound < startVoteRound) return { target: 'start' as const, rounds: startVoteRound - currentVoteRound };

  const endVoteRound = endRound + BigInt(4);
  if (currentVoteRound < endVoteRound) return { target: 'end' as const, rounds: endVoteRound - currentVoteRound };
}
