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
