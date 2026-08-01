import { type BurnStats, type CategoryWeights } from './burnStats';

const WAD = BigInt('1000000000000000000');
const CATEGORY_KEYS = ['slTokenLock', 'stTokenLock', 'govRewardBurn', 'actionRewardBurn'] as const;

export function calculateAccountCategoryRatio(accountScore: bigint, communityScore: bigint) {
  return communityScore > BigInt(0) ? (accountScore * WAD) / communityScore : BigInt(0);
}

export function calculateCategoryWeightRatio(weight: bigint, weights: CategoryWeights) {
  const totalWeight = CATEGORY_KEYS.reduce((total, key) => total + weights[key], BigInt(0));
  return totalWeight > BigInt(0) ? (weight * WAD) / totalWeight : BigInt(0);
}

export function calculateAccountCommunityShare(community: BurnStats, account: BurnStats, weights: CategoryWeights) {
  const activeCategories = CATEGORY_KEYS.filter((key) => community[key].score > BigInt(0));
  const activeWeight = activeCategories.reduce((total, key) => total + weights[key], BigInt(0));
  if (activeWeight === BigInt(0)) return BigInt(0);

  const ratioTotal = activeCategories.reduce(
    (total, key) => total + calculateAccountCategoryRatio(account[key].score, community[key].score) * weights[key],
    BigInt(0),
  );
  return ratioTotal / activeWeight;
}
