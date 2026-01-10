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
import { useReadContracts } from 'wagmi';
import { UniswapV2FactoryAbi } from '@/src/abis/UniswapV2Factory';
import { UniswapV2PairAbi } from '@/src/abis/UniswapV2Pair';
import { safeToBigInt } from '@/src/lib/clientUtils';

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
interface ReservesData {
  reserves?: [bigint, bigint, number];
  token0?: `0x${string}`;
  token1?: `0x${string}`;
  totalSupply?: bigint;
}

// ==================== 公共辅助函数 ====================

/**
 * 解析交易对地址并过滤零地址
 */
function parsePairAddress(addr: `0x${string}` | undefined): `0x${string}` | undefined {
  if (!addr) return undefined;
  // 过滤零地址
  return addr === '0x0000000000000000000000000000000000000000' ? undefined : addr;
}

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

/**
 * 计算 LP Token 转换结果
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
    return {
      convertedAmount: BigInt(0),
      isSuccess: false,
      isPending: isPendingReserves,
      error: errorReserves,
    };
  }

  const { reserves, token0, token1, totalSupply } = reservesData;

  // 边界检查：验证数据有效性
  if (totalSupply === BigInt(0)) {
    return {
      convertedAmount: BigInt(0),
      isSuccess: false,
      isPending: false,
      error: null,
    };
  }

  const [reserve0, reserve1] = reserves;

  // 确定 toToken 对应的储备量
  // 如果 token0 是目标代币，使用 reserve0，否则使用 reserve1
  const tokenReserve = token0.toLowerCase() === toToken.toLowerCase() ? reserve0 : reserve1;

  // LP 转换公式（参考 Solidity convertLPToTokenValue）：
  // convertedAmount = (tokenReserve * lpAmount * 2) / totalSupply
  const convertedAmount = (tokenReserve * fromAmount * BigInt(2)) / totalSupply;

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
    return {
      convertedAmount: BigInt(0),
      isSuccess: false,
      isPending: isPendingPair,
      error: errorPair,
    };
  }

  // 检查储备数据是否完整（需要 reserves、token0）
  if (!reservesData.reserves || !reservesData.token0) {
    return {
      convertedAmount: BigInt(0),
      isSuccess: false,
      isPending: isPendingReserves,
      error: errorReserves,
    };
  }

  const { reserves, token0 } = reservesData;

  // 边界检查：验证数据有效性
  if (!reserves || !token0) {
    return {
      convertedAmount: BigInt(0),
      isSuccess: false,
      isPending: false,
      error: null,
    };
  }

  const [reserve0, reserve1] = reserves;

  // 边界检查：储备量不能为零
  if (reserve0 === BigInt(0) || reserve1 === BigInt(0)) {
    return {
      convertedAmount: BigInt(0),
      isSuccess: false,
      isPending: false,
      error: null,
    };
  }

  // 确定代币顺序并分配储备量
  // 如果 fromToken 是 token0，则 fromReserve = reserve0, toReserve = reserve1
  // 否则 fromReserve = reserve1, toReserve = reserve0
  const fromIsToken0 = fromToken.toLowerCase() === token0.toLowerCase();
  const fromReserve = fromIsToken0 ? reserve0 : reserve1;
  const toReserve = fromIsToken0 ? reserve1 : reserve0;

  // 普通代币转换公式（参考 Solidity convertViaUniswap）：
  // convertedAmount = (amount * toReserve) / fromReserve
  const convertedAmount = (fromAmount * toReserve) / fromReserve;

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
  } = useReadContracts({
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
  } = useReadContracts({
    contracts: reservesContracts as any,
    query: {
      enabled: reservesContracts.length > 0,
    },
  });

  // ========== 阶段 3：计算转换结果 ==========
  const result = useMemo(() => {
    // ===== 场景 1: 相同代币 - 直接返回原数量 =====
    if (fromToken === toToken) {
      return calculateSameTokenConversion(fromAmount);
    }

    // ===== 场景 2: LP Token 转换 =====
    if (isFromTokenLP) {
      // 解析合约返回数据
      const reserves = reservesData?.[0]?.result as [bigint, bigint, number] | undefined;
      const token0 = reservesData?.[1]?.result as `0x${string}` | undefined;
      const token1 = reservesData?.[2]?.result as `0x${string}` | undefined;
      const totalSupply = safeToBigInt(reservesData?.[3]?.result);

      const reservesDataObj: ReservesData = {
        reserves,
        token0,
        token1,
        totalSupply,
      };

      return calculateLPTokenConversion(fromAmount, toToken, reservesDataObj, isPendingReserves, errorReserves);
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
  } = useReadContracts({
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
  } = useReadContracts({
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

  // ========== 阶段 3：计算转换结果 ==========
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
          return {
            convertedAmount: BigInt(0),
            isSuccess: false,
            isPending: isPendingReserves,
            error: errorReserves,
          };
        }

        return calculateLPTokenConversion(fromAmount, toToken, reservesData, isPendingReserves, errorReserves);
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
      (pairContracts.length > 0 ? isPendingPair : false) || (reservesContracts.length > 0 ? isPendingReserves : false)
    );
  }, [conversions, pairContracts.length, reservesContracts.length, isPendingPair, isPendingReserves]);

  const error = useMemo(() => {
    return errorPair || errorReserves;
  }, [errorPair, errorReserves]);

  return {
    results,
    isPending,
    error,
  };
};
