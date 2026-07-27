export interface ActionBurnQuota {
  actionId: bigint;
  unusedQuotaAmount: bigint;
}

export interface ActionBurnAllocation {
  actionId: bigint;
  amount: bigint;
}

export function allocateActionBurn(
  requestedAmount: bigint,
  quotas: readonly ActionBurnQuota[],
): ActionBurnAllocation[] {
  if (requestedAmount < BigInt(0)) throw new RangeError('行动销毁数量不能为负数');
  if (requestedAmount === BigInt(0)) return [];

  let remaining = requestedAmount;
  const allocations: ActionBurnAllocation[] = [];
  const availableQuotas = quotas
    .filter(({ unusedQuotaAmount }) => unusedQuotaAmount > BigInt(0))
    .sort((a, b) => (a.actionId < b.actionId ? -1 : a.actionId > b.actionId ? 1 : 0));

  for (const quota of availableQuotas) {
    const amount = remaining < quota.unusedQuotaAmount ? remaining : quota.unusedQuotaAmount;
    allocations.push({ actionId: quota.actionId, amount });
    remaining -= amount;
    if (remaining === BigInt(0)) break;
  }

  if (remaining > BigInt(0)) throw new RangeError('行动销毁数量超过可用额度');
  return allocations;
}
