import { type BurnStats } from './burnStats';

const WAD = BigInt('1000000000000000000');
const CATEGORY_KEYS = ['slTokenLock', 'stTokenLock', 'govRewardBurn', 'actionRewardBurn'] as const;

export function calculateAccountCategoryRatio(accountScore: bigint, communityScore: bigint) {
  return communityScore > BigInt(0) ? (accountScore * WAD) / communityScore : BigInt(0);
}

export function calculateAccountCommunityShare(community: BurnStats, account: BurnStats) {
  const activeCategories = CATEGORY_KEYS.filter((key) => community[key].score > BigInt(0));
  if (activeCategories.length === 0) return BigInt(0);

  const ratioTotal = activeCategories.reduce(
    (total, key) => total + calculateAccountCategoryRatio(account[key].score, community[key].score),
    BigInt(0),
  );
  return ratioTotal / BigInt(activeCategories.length);
}
