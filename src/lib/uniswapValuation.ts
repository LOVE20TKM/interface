import { ZERO_ADDRESS } from './errorHandlingGuards';

export type Address = `0x${string}`;

export interface PairReservesData {
  pairAddress?: Address;
  reserves?: [bigint, bigint, number];
  token0?: Address;
  token1?: Address;
  totalSupply?: bigint;
}

export interface IndirectLPPricingRoute {
  intermediateToken: Address;
  pairAddress: Address;
}

export const addressesEqual = (left?: string | null, right?: string | null) =>
  !!left && !!right && left.toLowerCase() === right.toLowerCase();

export const parsePairAddress = (addr?: Address): Address | undefined => {
  if (!addr || addressesEqual(addr, ZERO_ADDRESS)) {
    return undefined;
  }

  return addr;
};

export const isTokenInPair = (
  token: Address,
  pairData: Pick<PairReservesData, 'token0' | 'token1'>,
): boolean => {
  return addressesEqual(token, pairData.token0) || addressesEqual(token, pairData.token1);
};

export const hasUsableReserves = (pairData: Pick<PairReservesData, 'reserves'>): boolean => {
  if (!pairData.reserves) {
    return false;
  }

  const [reserve0, reserve1] = pairData.reserves;
  return reserve0 > BigInt(0) && reserve1 > BigInt(0);
};

const getReserveForToken = (
  token: Address,
  pairData: Pick<PairReservesData, 'reserves' | 'token0' | 'token1'>,
): bigint | undefined => {
  if (!pairData.reserves || !pairData.token0 || !pairData.token1) {
    return undefined;
  }

  const [reserve0, reserve1] = pairData.reserves;

  if (addressesEqual(token, pairData.token0)) {
    return reserve0;
  }

  if (addressesEqual(token, pairData.token1)) {
    return reserve1;
  }

  return undefined;
};

export const convertViaPairMidPrice = (
  fromAmount: bigint,
  fromToken: Address,
  toToken: Address,
  pairData: Pick<PairReservesData, 'reserves' | 'token0'>,
): bigint | undefined => {
  if (addressesEqual(fromToken, toToken)) {
    return fromAmount;
  }

  if (!pairData.reserves || !pairData.token0 || !hasUsableReserves(pairData)) {
    return undefined;
  }

  const [reserve0, reserve1] = pairData.reserves;

  if (addressesEqual(fromToken, pairData.token0)) {
    return (fromAmount * reserve1) / reserve0;
  }

  if (addressesEqual(toToken, pairData.token0)) {
    return (fromAmount * reserve0) / reserve1;
  }

  return undefined;
};

export const calculateLPShareTokenAmount = (
  lpAmount: bigint,
  token: Address,
  lpData: Pick<PairReservesData, 'reserves' | 'token0' | 'token1' | 'totalSupply'>,
): bigint | undefined => {
  if (!lpData.reserves || !lpData.token0 || !lpData.token1 || lpData.totalSupply === undefined || lpData.totalSupply <= BigInt(0)) {
    return undefined;
  }

  const reserve = getReserveForToken(token, lpData);
  if (reserve === undefined) {
    return undefined;
  }

  return (reserve * lpAmount) / lpData.totalSupply;
};

export const convertLPToDirectTokenValue = (
  lpAmount: bigint,
  toToken: Address,
  lpData: Pick<PairReservesData, 'reserves' | 'token0' | 'token1' | 'totalSupply'>,
): bigint | undefined => {
  const shareAmount = calculateLPShareTokenAmount(lpAmount, toToken, lpData);
  if (shareAmount === undefined) {
    return undefined;
  }

  return shareAmount * BigInt(2);
};

export const isPairUsableForQuote = (
  fromToken: Address,
  toToken: Address,
  pairData: Pick<PairReservesData, 'pairAddress' | 'reserves' | 'token0'>,
): boolean => {
  return !!pairData.pairAddress && convertViaPairMidPrice(BigInt(1), fromToken, toToken, pairData) !== undefined;
};

export const selectPreferredIndirectLPRoute = (
  toToken: Address,
  lpData: Pick<PairReservesData, 'token0' | 'token1'>,
  token0Candidate: Pick<PairReservesData, 'pairAddress' | 'reserves' | 'token0'>,
  token1Candidate: Pick<PairReservesData, 'pairAddress' | 'reserves' | 'token0'>,
): IndirectLPPricingRoute | undefined => {
  if (!lpData.token0 || !lpData.token1 || isTokenInPair(toToken, lpData)) {
    return undefined;
  }

  if (isPairUsableForQuote(lpData.token0, toToken, token0Candidate)) {
    return {
      intermediateToken: lpData.token0,
      pairAddress: token0Candidate.pairAddress!,
    };
  }

  if (isPairUsableForQuote(lpData.token1, toToken, token1Candidate)) {
    return {
      intermediateToken: lpData.token1,
      pairAddress: token1Candidate.pairAddress!,
    };
  }

  return undefined;
};

export const convertLPToTokenValueViaRoute = (
  lpAmount: bigint,
  toToken: Address,
  lpData: Pick<PairReservesData, 'reserves' | 'token0' | 'token1' | 'totalSupply'>,
  route: IndirectLPPricingRoute,
  bridgePairData: Pick<PairReservesData, 'pairAddress' | 'reserves' | 'token0'>,
): bigint | undefined => {
  const shareAmount = calculateLPShareTokenAmount(lpAmount, route.intermediateToken, lpData);
  if (shareAmount === undefined) {
    return undefined;
  }

  return convertViaPairMidPrice(shareAmount * BigInt(2), route.intermediateToken, toToken, bridgePairData);
};
