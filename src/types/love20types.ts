export interface ActionHead {
  id: bigint;
  author: `0x${string}`;
  createAtBlock: bigint;
}

export interface ActionBody {
  minStake: bigint;
  maxRandomAccounts: bigint;
  whiteListAddress: `0x${string}`;
  title: string;
  verificationRule: string;
  verificationKeys: string[];
  verificationInfoGuides: string[];
}

export interface ActionInfo {
  head: ActionHead;
  body: ActionBody;
}

// 行动基本信息（去掉 verificationRule 字段以节省缓存空间）
export interface ActionBaseBody {
  minStake: bigint;
  maxRandomAccounts: bigint;
  whiteListAddress: `0x${string}`;
  title: string;
  verificationKeys: string[];
  verificationInfoGuides: string[];
}

export interface ActionBaseInfo {
  head: ActionHead;
  body: ActionBaseBody;
}

export interface ActionSubmitInfo {
  submitter: `0x${string}`;
  actionId: bigint;
}

export interface VotingAction {
  action: ActionInfo;
  submitter: `0x${string}`;
  votesNum: bigint;
  myVotesNum: bigint;
}

export interface JoinableAction {
  action: ActionInfo;
  votesNum: bigint;
  hasReward: boolean;
  joinedAmount: bigint;
  joinedAmountOfAccount: bigint;
  // 扩展行动在前端聚合后的增强字段（可选）
  isConvertedJoinedValueSuccess?: boolean; // joinedAmount 是否来自“转换成功”的 convertedJoinedValue（用于 UI 标记）
}

export interface JoinedAction {
  action: ActionInfo;
  votesNum: bigint;
  votePercentPerTenThousand: bigint;
  hasReward: boolean;
  joinedAmountOfAccount: bigint;
}

export interface VerifyingAction {
  action: ActionInfo;
  votesNum: bigint;
  verificationScore: bigint;
  myVotesNum: bigint;
  myVerificationScore: bigint;
}

export interface MyVerifyingAction {
  action: ActionInfo;
  totalVotesNum: bigint;
  myVotesNum: bigint;
  myVerificationScore: bigint;
}

export interface VerifiedAddress {
  account: `0x${string}`;
  score: bigint;
  reward: bigint;
  isMinted: boolean;
}

export interface RewardInfo {
  round: bigint;
  reward: bigint;
  isMinted: boolean;
}

export interface GovReward {
  actionId: bigint;
  round: bigint;
  reward: bigint;
  verifyReward: bigint;
  boostReward: bigint;
  isMinted: boolean;
}

export interface ActionReward {
  actionId: bigint;
  round: bigint;
  reward: bigint;
  isMinted: boolean;
}

export interface GovData {
  govVotes: bigint;
  slAmount: bigint;
  stAmount: bigint;
  tokenAmountForSl: bigint;
  parentTokenAmountForSl: bigint;
  rewardAvailable: bigint;
}

export interface TokenInfo {
  tokenAddress: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  parentTokenAddress: `0x${string}`;
  parentTokenSymbol: string;
  parentTokenName: string;
  slAddress: `0x${string}`;
  stAddress: `0x${string}`;
  uniswapV2PairAddress: `0x${string}`;
  initialStakeRound: bigint;
}

export interface LaunchInfo {
  parentTokenAddress: `0x${string}`;
  parentTokenFundraisingGoal: bigint;
  secondHalfMinBlocks: bigint;
  launchAmount: bigint;
  startBlock: bigint;
  secondHalfStartBlock: bigint;
  endBlock: bigint;
  hasEnded: boolean;
  participantCount: bigint;
  totalContributed: bigint;
  totalExtraRefunded: bigint;
}

export interface PairInfo {
  pairAddress: `0x${string}`;
  balanceOfToken: bigint;
  balanceOfParentToken: bigint;
  pairReserveToken: bigint;
  pairReserveParentToken: bigint;
}

export interface VerificationInfo {
  account: `0x${string}`;
  infos: string[];
}

export interface TokenStats {
  maxSupply: bigint;
  totalSupply: bigint;
  reservedAvailable: bigint;
  rewardAvailable: bigint;
  pairReserveParentToken: bigint;
  pairReserveToken: bigint;
  totalLpSupply: bigint;
  stakedTokenAmountForSt: bigint;
  joinedTokenAmount: bigint;
  totalSLSupply: bigint;
  totalSTSupply: bigint;
  parentTokenAmountForSl: bigint;
  tokenAmountForSl: bigint;
  parentPool: bigint;
  finishedRounds: bigint;
  actionsCount: bigint;
  joiningActionsCount: bigint;
  childTokensCount: bigint;
  launchingChildTokensCount: bigint;
  launchedChildTokensCount: bigint;
}

export interface ActionVoter {
  account: `0x${string}`;
  voteCount: bigint;
}

export interface AccountVotingAction {
  actionId: bigint;
  round: bigint;
  myVoteCount: bigint;
  totalVoteCount: bigint;
}

export interface VerificationMatrix {
  verifiers: `0x${string}`[];
  verifiees: `0x${string}`[];
  scores: bigint[][];
}
