export const GOV_RATIO_PRECISION = BigInt('1000000000000000000');

const ceilDiv = (a: bigint, b: bigint) => (a + b - BigInt(1)) / b;

export const estimateRequiredSlAmount = ({
  targetRatio,
  userGovVotes,
  totalGovVotes,
  govRatioMultiplier,
  slAmount,
  waitingPhases,
}: {
  targetRatio: bigint;
  userGovVotes: bigint;
  totalGovVotes: bigint;
  govRatioMultiplier: bigint;
  slAmount: bigint;
  waitingPhases: bigint;
}) => {
  if (targetRatio <= BigInt(0) || govRatioMultiplier <= BigInt(0) || waitingPhases <= BigInt(0)) return BigInt(0);

  const maxRatio = govRatioMultiplier * GOV_RATIO_PRECISION;
  const updatedUserGovVotes = slAmount * waitingPhases;
  const upgradedGovVotes = updatedUserGovVotes > userGovVotes ? updatedUserGovVotes - userGovVotes : BigInt(0);
  if (totalGovVotes <= BigInt(0)) return targetRatio <= maxRatio ? BigInt(1) : undefined;
  if (userGovVotes * maxRatio >= targetRatio * totalGovVotes) return BigInt(0);

  const denominator = maxRatio - targetRatio;
  if (denominator <= BigInt(0)) return undefined;

  const baseGap = targetRatio * totalGovVotes - userGovVotes * maxRatio;
  if (baseGap <= upgradedGovVotes * denominator) return BigInt(0);

  return ceilDiv(baseGap - upgradedGovVotes * denominator, denominator * waitingPhases);
};

