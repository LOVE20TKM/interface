/**
 * 代币数量转换 Hook
 *
 * 功能：根据 fromAmount 数量的 fromToken，计算同等价值的 toToken 数量
 *
 * 支持三种场景：
 * 1. 相同代币转换（直接返回原数量）
 * 2. LP Token 转换为普通代币
 * 3. 普通代币之间的转换（通过 Uniswap V2 流动性池）
 *
 * 包含单个和批量两个版本：
 * - useConvertTokenAmount: 单个转换
 * - useConvertTokenAmounts: 批量转换
 *
 * 使用示例：
 * ```typescript
 * // 单个转换
 * const { convertedAmount, isSuccess, isPending } = useConvertTokenAmount({
 *   fromToken: '0x123...',
 *   isFromTokenLP: false,
 *   fromAmount: BigInt(1000000),
 *   toToken: '0x456...',
 * });
 *
 * // 批量转换
 * const { results, isPending } = useConvertTokenAmounts({
 *   conversions: [
 *     { fromToken: '0x123...', isFromTokenLP: false, fromAmount: BigInt(1000000), toToken: '0x456...' },
 *     { fromToken: '0x789...', isFromTokenLP: true, fromAmount: BigInt(2000000), toToken: '0xabc...' },
 *   ],
 * });
 * ```
 */

import { useMemo } from 'react';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { UniswapV2FactoryAbi } from '@/src/abis/UniswapV2Factory';
import { UniswapV2PairAbi } from '@/src/abis/UniswapV2Pair';
import { safeToBigInt } from '@/src/lib/clientUtils';
import {
  addressesEqual,
  type PairReservesData,
  type IndirectLPPricingRoute,
  convertLPToDirectTokenValue,
  convertLPToTokenValueViaRoute,
  convertViaPairMidPrice,
  isTokenInPair,
  parsePairAddress,
  selectPreferredIndirectLPRoute,
} from '@/src/lib/uniswapValuation';

// ==================== 常量 ====================

// UniswapV2Factory 合约地址
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_FACTORY as `0x${string}`;

// ==================== 类型定义 ====================

/**
 * useConvertTokenAmount 输入参数
 */
export interface UseConvertTokenAmountParams {
  fromToken: `0x${string}`; // 源代币地址
  isFromTokenLP: boolean; // fromToken 是否为 LP Token (UniswapV2Pair)
  fromAmount: bigint; // 源代币数量
  toToken: `0x${string}`; // 目标代币地址
}

/**
 * useConvertTokenAmount 返回值
 */
export interface UseConvertTokenAmountResult {
  convertedAmount: bigint; // 转换后的数量
  isSuccess: boolean; // 转换是否成功
  isPending: boolean; // 加载状态
  error: any; // 错误对象
}

/**
 * useConvertTokenAmounts 输入参数
 */
export interface UseConvertTokenAmountsParams {
  /** 转换请求数组 */
  conversions: UseConvertTokenAmountParams[];
}

/**
 * useConvertTokenAmounts 返回值
 */
export interface UseConvertTokenAmountsResult {
  /** 转换结果数组（与输入数组索引一一对应） */
  results: UseConvertTokenAmountResult[];
  /** 整体加载状态 */
  isPending: boolean;
  /** 错误对象 */
  error: any;
}

// ==================== 辅助类型 ====================

/**
 * 索引映射信息（用于追踪每个合约调用对应的原始转换请求索引）
 */
interface IndexMapping {
  conversionIndex: number; // 原始转换请求的索引
}

/**
 * 储备数据接口
 */
type ReservesData = PairReservesData;

interface BridgePairLookupData {
  token0PairAddress?: `0x${string}`;
  token1PairAddress?: `0x${string}`;
}

interface BridgePairData {
  pairAddress?: `0x${string}`;
  reserves?: [bigint, bigint, number];
  token0?: `0x${string}`;
}

interface BridgeReservesByCandidate {
  token0Candidate: BridgePairData;
  token1Candidate: BridgePairData;
}

// ==================== 公共辅助函数 ====================

/**
 * 计算相同代币转换结果
 */
function calculateSameTokenConversion(fromAmount: bigint): UseConvertTokenAmountResult {
  return {
    convertedAmount: fromAmount,
    isSuccess: true,
    isPending: false,
    error: null,
  };
}

function calculateFailedConversion(isPending: boolean, error: any): UseConvertTokenAmountResult {
  return {
    convertedAmount: BigInt(0),
    isSuccess: false,
    isPending,
    error,
  };
}

/**
 * 计算 LP Token 直接转换结果
 */
function calculateLPTokenConversion(
  fromAmount: bigint,
  toToken: `0x${string}`,
  reservesData: ReservesData,
  isPendingReserves: boolean,
  errorReserves: any,
): UseConvertTokenAmountResult {
  // 检查数据是否完整（需要 reserves、token0、token1、totalSupply）
  if (
    !reservesData.reserves ||
    !reservesData.token0 ||
    !reservesData.token1 ||
    reservesData.totalSupply === undefined
  ) {
    return calculateFailedConversion(isPendingReserves, errorReserves);
  }

  const convertedAmount = convertLPToDirectTokenValue(fromAmount, toToken, reservesData);
  if (convertedAmount === undefined) {
    return calculateFailedConversion(false, null);
  }

  return {
    convertedAmount,
    isSuccess: true,
    isPending: false,
    error: null,
  };
}

/**
 * 计算 LP Token 间接转换结果
 */
function calculateLPTokenIndirectConversion(
  fromAmount: bigint,
  toToken: `0x${string}`,
  lpReservesData: ReservesData,
  route: IndirectLPPricingRoute | undefined,
  bridgePairData: BridgePairData,
  isPending: boolean,
  error: any,
): UseConvertTokenAmountResult {
  if (!route || !bridgePairData.pairAddress || !bridgePairData.reserves || !bridgePairData.token0) {
    return calculateFailedConversion(isPending, error);
  }

  const convertedAmount = convertLPToTokenValueViaRoute(fromAmount, toToken, lpReservesData, route, bridgePairData);
  if (convertedAmount === undefined) {
    return calculateFailedConversion(false, null);
  }

  return {
    convertedAmount,
    isSuccess: true,
    isPending: false,
    error: null,
  };
}

/**
 * 计算普通代币转换结果
 */
function calculateNormalTokenConversion(
  fromToken: `0x${string}`,
  toToken: `0x${string}`,
  fromAmount: bigint,
  pairAddress: `0x${string}` | undefined,
  reservesData: ReservesData,
  isPendingPair: boolean,
  errorPair: any,
  isPendingReserves: boolean,
  errorReserves: any,
): UseConvertTokenAmountResult {
  // 检查是否找到交易对
  if (!pairAddress) {
    return calculateFailedConversion(isPendingPair, errorPair);
  }

  // 检查储备数据是否完整（需要 reserves、token0）
  if (!reservesData.reserves || !reservesData.token0) {
    return calculateFailedConversion(isPendingReserves, errorReserves);
  }

  const convertedAmount = convertViaPairMidPrice(fromAmount, fromToken, toToken, reservesData);
  if (convertedAmount === undefined) {
    return calculateFailedConversion(false, null);
  }

  return {
    convertedAmount,
    isSuccess: true,
    isPending: false,
    error: null,
  };
}

// ==================== Hook 实现 ====================

/**
 * 代币数量转换复合 Hook（单个版本）
 *
 * @param params - 转换参数
 * @returns 转换结果
 */
export const useConvertTokenAmount = ({
  fromToken,
  isFromTokenLP,
  fromAmount,
  toToken,
}: UseConvertTokenAmountParams): UseConvertTokenAmountResult => {
  // ========== 阶段 1：获取交易对地址（仅普通代币场景） ==========
  const pairContracts = useMemo(() => {
    // 相同代币或 LP 场景，跳过此阶段
    if (fromToken === toToken || isFromTokenLP) return [];

    return [
      {
        address: FACTORY_ADDRESS,
        abi: UniswapV2FactoryAbi,
        functionName: 'getPair',
        args: [fromToken, toToken],
      },
    ];
  }, [fromToken, toToken, isFromTokenLP]);

  const {
    data: pairData,
    isPending: isPendingPair,
    error: errorPair,
  } = useUniversalReadContracts({
    contracts: pairContracts as any,
    query: { enabled: pairContracts.length > 0 },
  });

  // 解析交易对地址并过滤零地址
  const pairAddress = useMemo(() => {
    if (!pairData?.[0]?.result) return undefined;
    const addr = pairData[0].result as `0x${string}`;
    return parsePairAddress(addr);
  }, [pairData]);

  // ========== 阶段 2：获取储备量和代币信息 ==========
  const reservesContracts = useMemo(() => {
    // 相同代币场景，跳过
    if (fromToken === toToken) return [];

    // 确定目标地址（LP 场景使用 fromToken，普通场景使用 pairAddress）
    const targetAddress = isFromTokenLP ? fromToken : pairAddress;
    if (!targetAddress) return [];

    const contracts: any[] = [
      {
        address: targetAddress,
        abi: UniswapV2PairAbi,
        functionName: 'getReserves',
        args: [],
      },
      {
        address: targetAddress,
        abi: UniswapV2PairAbi,
        functionName: 'token0',
        args: [],
      },
      {
        address: targetAddress,
        abi: UniswapV2PairAbi,
        functionName: 'token1',
        args: [],
      },
    ];

    // LP 场景需要额外查询 totalSupply
    if (isFromTokenLP) {
      contracts.push({
        address: targetAddress,
        abi: UniswapV2PairAbi,
        functionName: 'totalSupply',
        args: [],
      });
    }

    return contracts;
  }, [fromToken, toToken, isFromTokenLP, pairAddress]);

  const {
    data: reservesData,
    isPending: isPendingReserves,
    error: errorReserves,
  } = useUniversalReadContracts({
    contracts: reservesContracts as any,
    query: {
      enabled: reservesContracts.length > 0,
    },
  });

  const lpReservesDataObj = useMemo<ReservesData>(() => {
    if (!isFromTokenLP) {
      return {};
    }

    return {
      reserves: reservesData?.[0]?.result as [bigint, bigint, number] | undefined,
      token0: reservesData?.[1]?.result as `0x${string}` | undefined,
      token1: reservesData?.[2]?.result as `0x${string}` | undefined,
      totalSupply: reservesData?.[3]?.result !== undefined ? safeToBigInt(reservesData?.[3]?.result) : undefined,
    };
  }, [isFromTokenLP, reservesData]);

  const needsIndirectLPPairLookup = useMemo(() => {
    return (
      isFromTokenLP &&
      !!lpReservesDataObj.token0 &&
      !!lpReservesDataObj.token1 &&
      !isTokenInPair(toToken, lpReservesDataObj)
    );
  }, [isFromTokenLP, lpReservesDataObj.token0, lpReservesDataObj.token1, toToken]);

  // ========== 阶段 3：LP 间接转换时，查找桥接 pair ==========
  const indirectPairContracts = useMemo(() => {
    if (!needsIndirectLPPairLookup || !lpReservesDataObj.token0 || !lpReservesDataObj.token1) {
      return [];
    }

    return [
      {
        address: FACTORY_ADDRESS,
        abi: UniswapV2FactoryAbi,
        functionName: 'getPair',
        args: [lpReservesDataObj.token0, toToken],
        contractType: 'token0ToTargetPair',
      },
      {
        address: FACTORY_ADDRESS,
        abi: UniswapV2FactoryAbi,
        functionName: 'getPair',
        args: [lpReservesDataObj.token1, toToken],
        contractType: 'token1ToTargetPair',
      },
    ];
  }, [lpReservesDataObj.token0, lpReservesDataObj.token1, needsIndirectLPPairLookup, toToken]);

  const {
    data: indirectPairData,
    isPending: isPendingIndirectPair,
    error: errorIndirectPair,
  } = useUniversalReadContracts({
    contracts: indirectPairContracts as any,
    query: {
      enabled: indirectPairContracts.length > 0,
    },
  });

  const indirectPairLookup = useMemo<BridgePairLookupData>(() => {
    return {
      token0PairAddress: parsePairAddress(indirectPairData?.[0]?.result as `0x${string}` | undefined),
      token1PairAddress: parsePairAddress(indirectPairData?.[1]?.result as `0x${string}` | undefined),
    };
  }, [indirectPairData]);

  // ========== 阶段 4：读取桥接 pair 储备 ==========
  const indirectReservesContracts = useMemo(() => {
    if (!needsIndirectLPPairLookup) {
      return [];
    }

    const contracts: any[] = [];

    if (indirectPairLookup.token0PairAddress) {
      contracts.push(
        {
          address: indirectPairLookup.token0PairAddress,
          abi: UniswapV2PairAbi,
          functionName: 'getReserves',
          args: [],
          contractType: 'token0Candidate_getReserves',
        },
        {
          address: indirectPairLookup.token0PairAddress,
          abi: UniswapV2PairAbi,
          functionName: 'token0',
          args: [],
          contractType: 'token0Candidate_token0',
        },
      );
    }

    if (indirectPairLookup.token1PairAddress) {
      contracts.push(
        {
          address: indirectPairLookup.token1PairAddress,
          abi: UniswapV2PairAbi,
          functionName: 'getReserves',
          args: [],
          contractType: 'token1Candidate_getReserves',
        },
        {
          address: indirectPairLookup.token1PairAddress,
          abi: UniswapV2PairAbi,
          functionName: 'token0',
          args: [],
          contractType: 'token1Candidate_token0',
        },
      );
    }

    return contracts;
  }, [indirectPairLookup.token0PairAddress, indirectPairLookup.token1PairAddress, needsIndirectLPPairLookup]);

  const {
    data: indirectReservesData,
    isPending: isPendingIndirectReserves,
    error: errorIndirectReserves,
  } = useUniversalReadContracts({
    contracts: indirectReservesContracts as any,
    query: {
      enabled: indirectReservesContracts.length > 0,
    },
  });

  const indirectBridgeReserves = useMemo<BridgeReservesByCandidate>(() => {
    const bridgeData: BridgeReservesByCandidate = {
      token0Candidate: {
        pairAddress: indirectPairLookup.token0PairAddress,
      },
      token1Candidate: {
        pairAddress: indirectPairLookup.token1PairAddress,
      },
    };

    indirectReservesContracts.forEach((contract, index) => {
      const result = indirectReservesData?.[index];
      if (!result?.result) {
        return;
      }

      if (contract.contractType === 'token0Candidate_getReserves') {
        bridgeData.token0Candidate.reserves = result.result as [bigint, bigint, number];
      } else if (contract.contractType === 'token0Candidate_token0') {
        bridgeData.token0Candidate.token0 = result.result as `0x${string}`;
      } else if (contract.contractType === 'token1Candidate_getReserves') {
        bridgeData.token1Candidate.reserves = result.result as [bigint, bigint, number];
      } else if (contract.contractType === 'token1Candidate_token0') {
        bridgeData.token1Candidate.token0 = result.result as `0x${string}`;
      }
    });

    return bridgeData;
  }, [indirectPairLookup.token0PairAddress, indirectPairLookup.token1PairAddress, indirectReservesContracts, indirectReservesData]);

  // ========== 阶段 5：计算转换结果 ==========
  const result = useMemo(() => {
    // ===== 场景 1: 相同代币 - 直接返回原数量 =====
    if (fromToken === toToken) {
      return calculateSameTokenConversion(fromAmount);
    }

    // ===== 场景 2: LP Token 转换 =====
    if (isFromTokenLP) {
      if (
        !lpReservesDataObj.reserves ||
        !lpReservesDataObj.token0 ||
        !lpReservesDataObj.token1 ||
        lpReservesDataObj.totalSupply === undefined
      ) {
        return calculateFailedConversion(isPendingReserves, errorReserves);
      }

      if (isTokenInPair(toToken, lpReservesDataObj)) {
        return calculateLPTokenConversion(fromAmount, toToken, lpReservesDataObj, isPendingReserves, errorReserves);
      }

      if (indirectPairContracts.length > 0 && isPendingIndirectPair) {
        return calculateFailedConversion(true, errorIndirectPair);
      }

      if (!indirectPairLookup.token0PairAddress && !indirectPairLookup.token1PairAddress) {
        return calculateFailedConversion(false, errorIndirectPair);
      }

      if (indirectReservesContracts.length > 0 && isPendingIndirectReserves) {
        return calculateFailedConversion(true, errorIndirectReserves);
      }

      const route = selectPreferredIndirectLPRoute(
        toToken,
        lpReservesDataObj,
        indirectBridgeReserves.token0Candidate,
        indirectBridgeReserves.token1Candidate,
      );

      const bridgePairData =
        route && lpReservesDataObj.token0 && addressesEqual(route.intermediateToken, lpReservesDataObj.token0)
          ? indirectBridgeReserves.token0Candidate
          : indirectBridgeReserves.token1Candidate;

      return calculateLPTokenIndirectConversion(
        fromAmount,
        toToken,
        lpReservesDataObj,
        route,
        bridgePairData,
        false,
        errorIndirectReserves || errorIndirectPair,
      );
    }

    // ===== 场景 3: 普通代币转换 =====
    // 解析合约返回数据
    const reserves = reservesData?.[0]?.result as [bigint, bigint, number] | undefined;
    const token0 = reservesData?.[1]?.result as `0x${string}` | undefined;

    const reservesDataObj: ReservesData = {
      reserves,
      token0,
    };

    return calculateNormalTokenConversion(
      fromToken,
      toToken,
      fromAmount,
      pairAddress,
      reservesDataObj,
      isPendingPair,
      errorPair,
      isPendingReserves,
      errorReserves,
    );
  }, [
    fromToken,
    toToken,
    isFromTokenLP,
    fromAmount,
    pairAddress,
    reservesData,
    lpReservesDataObj,
    needsIndirectLPPairLookup,
    indirectPairContracts.length,
    indirectPairLookup,
    indirectBridgeReserves,
    indirectReservesContracts.length,
    isPendingIndirectPair,
    errorIndirectPair,
    isPendingIndirectReserves,
    errorIndirectReserves,
    isPendingReserves,
    errorReserves,
    isPendingPair,
    errorPair,
  ]);

  return result;
};

/**
 * 批量代币数量转换复合 Hook
 *
 * @param params - 转换参数
 * @returns 转换结果数组
 */
export const useConvertTokenAmounts = ({ conversions }: UseConvertTokenAmountsParams): UseConvertTokenAmountsResult => {
  // ========== 阶段 1：批量获取交易对地址（仅普通代币场景） ==========
  const pairContracts = useMemo(() => {
    if (!conversions || conversions.length === 0) return [];

    const contracts: (any & IndexMapping)[] = [];

    conversions.forEach((conversion, index) => {
      const { fromToken, toToken, isFromTokenLP } = conversion;
      // 相同代币或 LP 场景，跳过此阶段
      if (fromToken === toToken || isFromTokenLP) return;

      contracts.push({
        address: FACTORY_ADDRESS,
        abi: UniswapV2FactoryAbi,
        functionName: 'getPair',
        args: [fromToken, toToken],
        conversionIndex: index,
      });
    });

    return contracts;
  }, [conversions]);

  const {
    data: pairData,
    isPending: isPendingPair,
    error: errorPair,
  } = useUniversalReadContracts({
    contracts: pairContracts as any,
    query: { enabled: pairContracts.length > 0 },
  });

  // 解析交易对地址并过滤零地址，同时维护索引映射
  const pairAddresses = useMemo(() => {
    if (!pairData || pairData.length === 0) return new Map<number, `0x${string}` | undefined>();

    const addresses = new Map<number, `0x${string}` | undefined>();

    pairContracts.forEach((contract, contractIndex) => {
      const result = pairData[contractIndex];
      if (result?.result) {
        const addr = result.result as `0x${string}`;
        addresses.set(contract.conversionIndex, parsePairAddress(addr));
      } else {
        addresses.set(contract.conversionIndex, undefined);
      }
    });

    return addresses;
  }, [pairData, pairContracts]);

  // ========== 阶段 2：批量获取储备量和代币信息 ==========
  const reservesContracts = useMemo(() => {
    if (!conversions || conversions.length === 0) return [];

    const contracts: (any & IndexMapping)[] = [];

    conversions.forEach((conversion, index) => {
      const { fromToken, toToken, isFromTokenLP } = conversion;
      // 相同代币场景，跳过
      if (fromToken === toToken) return;

      // 确定目标地址（LP 场景使用 fromToken，普通场景使用 pairAddress）
      const pairAddress = pairAddresses.get(index);
      const targetAddress = isFromTokenLP ? fromToken : pairAddress;
      if (!targetAddress) return;

      // 添加 getReserves、token0、token1 调用
      contracts.push(
        {
          address: targetAddress,
          abi: UniswapV2PairAbi,
          functionName: 'getReserves',
          args: [],
          conversionIndex: index,
          contractType: 'getReserves',
        },
        {
          address: targetAddress,
          abi: UniswapV2PairAbi,
          functionName: 'token0',
          args: [],
          conversionIndex: index,
          contractType: 'token0',
        },
        {
          address: targetAddress,
          abi: UniswapV2PairAbi,
          functionName: 'token1',
          args: [],
          conversionIndex: index,
          contractType: 'token1',
        },
      );

      // LP 场景需要额外查询 totalSupply
      if (isFromTokenLP) {
        contracts.push({
          address: targetAddress,
          abi: UniswapV2PairAbi,
          functionName: 'totalSupply',
          args: [],
          conversionIndex: index,
          contractType: 'totalSupply',
        });
      }
    });

    return contracts;
  }, [conversions, pairAddresses]);

  const {
    data: reservesData,
    isPending: isPendingReserves,
    error: errorReserves,
  } = useUniversalReadContracts({
    contracts: reservesContracts as any,
    query: {
      enabled: reservesContracts.length > 0,
    },
  });

  // 组织储备数据：按转换索引分组
  const reservesDataByConversion = useMemo(() => {
    if (!reservesData || reservesData.length === 0) return new Map<number, ReservesData>();

    const dataMap = new Map<number, ReservesData>();

    reservesContracts.forEach((contract, contractIndex) => {
      const result = reservesData[contractIndex];
      const conversionIndex = contract.conversionIndex;
      const contractType = (contract as any).contractType;

      if (!dataMap.has(conversionIndex)) {
        dataMap.set(conversionIndex, {});
      }

      const data = dataMap.get(conversionIndex)!;

      if (result?.result) {
        if (contractType === 'getReserves') {
          data.reserves = result.result as [bigint, bigint, number];
        } else if (contractType === 'token0') {
          data.token0 = result.result as `0x${string}`;
        } else if (contractType === 'token1') {
          data.token1 = result.result as `0x${string}`;
        } else if (contractType === 'totalSupply') {
          data.totalSupply = safeToBigInt(result.result);
        }
      }
    });

    return dataMap;
  }, [reservesData, reservesContracts]);

  // ========== 阶段 3：批量查找 LP 间接转换的桥接 pair ==========
  const indirectPairContracts = useMemo(() => {
    if (!conversions || conversions.length === 0) return [];

    const contracts: (any & IndexMapping)[] = [];

    conversions.forEach((conversion, index) => {
      const { fromToken, toToken, isFromTokenLP } = conversion;
      if (fromToken === toToken || !isFromTokenLP) return;

      const lpData = reservesDataByConversion.get(index);
      if (!lpData?.token0 || !lpData?.token1 || isTokenInPair(toToken, lpData)) return;

      contracts.push(
        {
          address: FACTORY_ADDRESS,
          abi: UniswapV2FactoryAbi,
          functionName: 'getPair',
          args: [lpData.token0, toToken],
          conversionIndex: index,
          contractType: 'token0ToTargetPair',
        },
        {
          address: FACTORY_ADDRESS,
          abi: UniswapV2FactoryAbi,
          functionName: 'getPair',
          args: [lpData.token1, toToken],
          conversionIndex: index,
          contractType: 'token1ToTargetPair',
        },
      );
    });

    return contracts;
  }, [conversions, reservesDataByConversion]);

  const {
    data: indirectPairData,
    isPending: isPendingIndirectPair,
    error: errorIndirectPair,
  } = useUniversalReadContracts({
    contracts: indirectPairContracts as any,
    query: {
      enabled: indirectPairContracts.length > 0,
    },
  });

  const indirectPairLookupByConversion = useMemo(() => {
    const lookupMap = new Map<number, BridgePairLookupData>();

    indirectPairContracts.forEach((contract, contractIndex) => {
      const result = indirectPairData?.[contractIndex];
      const existing = lookupMap.get(contract.conversionIndex) || {};
      const parsedAddress = parsePairAddress(result?.result as `0x${string}` | undefined);

      if ((contract as any).contractType === 'token0ToTargetPair') {
        existing.token0PairAddress = parsedAddress;
      } else if ((contract as any).contractType === 'token1ToTargetPair') {
        existing.token1PairAddress = parsedAddress;
      }

      lookupMap.set(contract.conversionIndex, existing);
    });

    return lookupMap;
  }, [indirectPairContracts, indirectPairData]);

  // ========== 阶段 4：批量读取桥接 pair 储备 ==========
  const indirectReservesContracts = useMemo(() => {
    if (!conversions || conversions.length === 0) return [];

    const contracts: (any & IndexMapping)[] = [];

    conversions.forEach((conversion, index) => {
      const { fromToken, toToken, isFromTokenLP } = conversion;
      if (fromToken === toToken || !isFromTokenLP) return;

      const lpData = reservesDataByConversion.get(index);
      if (!lpData?.token0 || !lpData?.token1 || isTokenInPair(toToken, lpData)) return;

      const pairLookup = indirectPairLookupByConversion.get(index);

      if (pairLookup?.token0PairAddress) {
        contracts.push(
          {
            address: pairLookup.token0PairAddress,
            abi: UniswapV2PairAbi,
            functionName: 'getReserves',
            args: [],
            conversionIndex: index,
            contractType: 'token0Candidate_getReserves',
          },
          {
            address: pairLookup.token0PairAddress,
            abi: UniswapV2PairAbi,
            functionName: 'token0',
            args: [],
            conversionIndex: index,
            contractType: 'token0Candidate_token0',
          },
        );
      }

      if (pairLookup?.token1PairAddress) {
        contracts.push(
          {
            address: pairLookup.token1PairAddress,
            abi: UniswapV2PairAbi,
            functionName: 'getReserves',
            args: [],
            conversionIndex: index,
            contractType: 'token1Candidate_getReserves',
          },
          {
            address: pairLookup.token1PairAddress,
            abi: UniswapV2PairAbi,
            functionName: 'token0',
            args: [],
            conversionIndex: index,
            contractType: 'token1Candidate_token0',
          },
        );
      }
    });

    return contracts;
  }, [conversions, reservesDataByConversion, indirectPairLookupByConversion]);

  const {
    data: indirectReservesData,
    isPending: isPendingIndirectReserves,
    error: errorIndirectReserves,
  } = useUniversalReadContracts({
    contracts: indirectReservesContracts as any,
    query: {
      enabled: indirectReservesContracts.length > 0,
    },
  });

  const indirectBridgeReservesByConversion = useMemo(() => {
    const dataMap = new Map<number, BridgeReservesByCandidate>();

    conversions.forEach((_, index) => {
      const pairLookup = indirectPairLookupByConversion.get(index);
      if (!pairLookup) return;

      dataMap.set(index, {
        token0Candidate: {
          pairAddress: pairLookup.token0PairAddress,
        },
        token1Candidate: {
          pairAddress: pairLookup.token1PairAddress,
        },
      });
    });

    indirectReservesContracts.forEach((contract, contractIndex) => {
      const result = indirectReservesData?.[contractIndex];
      const conversionIndex = contract.conversionIndex;

      if (!dataMap.has(conversionIndex)) {
        dataMap.set(conversionIndex, {
          token0Candidate: {},
          token1Candidate: {},
        });
      }

      const bridgeData = dataMap.get(conversionIndex)!;

      if (!result?.result) {
        return;
      }

      if ((contract as any).contractType === 'token0Candidate_getReserves') {
        bridgeData.token0Candidate.reserves = result.result as [bigint, bigint, number];
      } else if ((contract as any).contractType === 'token0Candidate_token0') {
        bridgeData.token0Candidate.token0 = result.result as `0x${string}`;
      } else if ((contract as any).contractType === 'token1Candidate_getReserves') {
        bridgeData.token1Candidate.reserves = result.result as [bigint, bigint, number];
      } else if ((contract as any).contractType === 'token1Candidate_token0') {
        bridgeData.token1Candidate.token0 = result.result as `0x${string}`;
      }
    });

    return dataMap;
  }, [conversions, indirectPairLookupByConversion, indirectReservesContracts, indirectReservesData]);

  // ========== 阶段 5：计算转换结果 ==========
  const results = useMemo(() => {
    if (!conversions || conversions.length === 0) return [];

    return conversions.map((conversion, index) => {
      const { fromToken, toToken, isFromTokenLP, fromAmount } = conversion;

      // ===== 场景 1: 相同代币 - 直接返回原数量 =====
      if (fromToken === toToken) {
        return calculateSameTokenConversion(fromAmount);
      }

      // ===== 场景 2: LP Token 转换 =====
      if (isFromTokenLP) {
        const reservesData = reservesDataByConversion.get(index);
        if (!reservesData) {
          return calculateFailedConversion(isPendingReserves, errorReserves);
        }

        if (
          !reservesData.reserves ||
          !reservesData.token0 ||
          !reservesData.token1 ||
          reservesData.totalSupply === undefined
        ) {
          return calculateFailedConversion(isPendingReserves, errorReserves);
        }

        if (isTokenInPair(toToken, reservesData)) {
          return calculateLPTokenConversion(fromAmount, toToken, reservesData, isPendingReserves, errorReserves);
        }

        const pairLookup = indirectPairLookupByConversion.get(index);
        if (indirectPairContracts.length > 0 && isPendingIndirectPair) {
          return calculateFailedConversion(true, errorIndirectPair);
        }

        if (!pairLookup?.token0PairAddress && !pairLookup?.token1PairAddress) {
          return calculateFailedConversion(false, errorIndirectPair);
        }

        if (indirectReservesContracts.length > 0 && isPendingIndirectReserves) {
          return calculateFailedConversion(true, errorIndirectReserves);
        }

        const bridgeData = indirectBridgeReservesByConversion.get(index) || {
          token0Candidate: {
            pairAddress: pairLookup?.token0PairAddress,
          },
          token1Candidate: {
            pairAddress: pairLookup?.token1PairAddress,
          },
        };

        const route = selectPreferredIndirectLPRoute(
          toToken,
          reservesData,
          bridgeData.token0Candidate,
          bridgeData.token1Candidate,
        );

        const selectedBridgePair =
          route && reservesData.token0 && addressesEqual(route.intermediateToken, reservesData.token0)
            ? bridgeData.token0Candidate
            : bridgeData.token1Candidate;

        return calculateLPTokenIndirectConversion(
          fromAmount,
          toToken,
          reservesData,
          route,
          selectedBridgePair,
          false,
          errorIndirectReserves || errorIndirectPair,
        );
      }

      // ===== 场景 3: 普通代币转换 =====
      const pairAddress = pairAddresses.get(index);
      const reservesData = reservesDataByConversion.get(index);

      return calculateNormalTokenConversion(
        fromToken,
        toToken,
        fromAmount,
        pairAddress,
        reservesData || {},
        isPendingPair,
        errorPair,
        isPendingReserves,
        errorReserves,
      );
    });
  }, [
    conversions,
    pairAddresses,
    reservesDataByConversion,
    indirectPairContracts.length,
    indirectPairLookupByConversion,
    indirectBridgeReservesByConversion,
    indirectReservesContracts.length,
    isPendingIndirectPair,
    errorIndirectPair,
    isPendingIndirectReserves,
    errorIndirectReserves,
    isPendingReserves,
    errorReserves,
    isPendingPair,
    errorPair,
  ]);

  // ========== 聚合状态 ==========
  const isPending = useMemo(() => {
    // 如果没有转换请求，直接返回 false
    if (!conversions || conversions.length === 0) {
      return false;
    }
    // 只有当对应的 contracts 数组不为空时，才检查对应的 isPending 状态
    return (
      (pairContracts.length > 0 ? isPendingPair : false) ||
      (reservesContracts.length > 0 ? isPendingReserves : false) ||
      (indirectPairContracts.length > 0 ? isPendingIndirectPair : false) ||
      (indirectReservesContracts.length > 0 ? isPendingIndirectReserves : false)
    );
  }, [
    conversions,
    pairContracts.length,
    reservesContracts.length,
    indirectPairContracts.length,
    indirectReservesContracts.length,
    isPendingPair,
    isPendingReserves,
    isPendingIndirectPair,
    isPendingIndirectReserves,
  ]);

  const error = useMemo(() => {
    return errorPair || errorReserves || errorIndirectPair || errorIndirectReserves;
  }, [errorPair, errorReserves, errorIndirectPair, errorIndirectReserves]);

  return {
    results,
    isPending,
    error,
  };
};
