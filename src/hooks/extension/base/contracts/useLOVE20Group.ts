// hooks/extension/base/contracts/useLOVE20Group.ts
import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { LOVE20GroupAbi } from '@/src/abis/LOVE20Group';
import { safeToBigInt } from '@/src/lib/clientUtils';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP as `0x${string}`;

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for BASE_DIVISOR
 * 获取基础除数
 */
export const useBaseDivisor = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'BASE_DIVISOR',
    args: [],
  });

  return { baseDivisor: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for BYTES_THRESHOLD
 * 获取字节阈值
 */
export const useBytesThreshold = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'BYTES_THRESHOLD',
    args: [],
  });

  return { bytesThreshold: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for MULTIPLIER
 * 获取乘数
 */
export const useMultiplier = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'MULTIPLIER',
    args: [],
  });

  return { multiplier: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for MAX_GROUP_NAME_LENGTH
 * 获取最大组名长度
 */
export const useMaxGroupNameLength = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'MAX_GROUP_NAME_LENGTH',
    args: [],
  });

  return { maxGroupNameLength: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for love20Token
 * 获取 LOVE20 代币地址
 */
export const useLove20Token = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'LOVE20_TOKEN_ADDRESS',
    args: [],
  });

  return { love20Token: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for balanceOf
 * 获取账户持有的 NFT 数量
 */
export const useBalanceOf = (owner: `0x${string}`, enabled: boolean = true) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'balanceOf',
    args: [owner],
    query: {
      enabled: !!owner && enabled,
    },
  });

  return { balance: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for ownerOf
 * 获取指定 tokenId 的所有者
 */
export const useOwnerOf = (tokenId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'ownerOf',
    args: [tokenId],
    query: {
      enabled: tokenId !== undefined,
    },
  });

  return { owner: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for name
 * 获取 NFT 合约名称
 */
export const useName = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'name',
    args: [],
  });

  return { name: data as string | undefined, isPending, error };
};

/**
 * Hook for symbol
 * 获取 NFT 合约符号
 */
export const useSymbol = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'symbol',
    args: [],
  });

  return { symbol: data as string | undefined, isPending, error };
};

/**
 * Hook for totalSupply
 * 获取 NFT 总供应量
 */
export const useTotalSupply = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'totalSupply',
    args: [],
  });

  return { totalSupply: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for totalBurnedForMint
 * 获取为铸造而销毁的 LOVE20 代币总量
 */
export const useTotalBurnedForMint = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'totalBurnedForMint',
    args: [],
  });

  return { totalBurnedForMint: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for holdersCount
 * 获取持有者总数
 */
export const useHoldersCount = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'holdersCount',
    args: [],
  });

  return { holdersCount: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for calculateMintCost
 * 计算铸造指定组名的成本
 */
export const useCalculateMintCost = (groupName: string) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'calculateMintCost',
    args: [groupName],
    query: {
      enabled: !!groupName,
    },
  });

  return { mintCost: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for isGroupNameUsed
 * 检查组名是否已被使用
 */
export const useIsGroupNameUsed = (groupName: string) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'isGroupNameUsed',
    args: [groupName],
    query: {
      enabled: !!groupName,
    },
  });

  return { isUsed: data as boolean | undefined, isPending, error };
};

/**
 * Hook for groupNameOf
 * 根据 tokenId 获取组名
 */
export const useGroupNameOf = (tokenId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'groupNameOf',
    args: [tokenId],
    query: {
      enabled: tokenId !== undefined,
    },
  });

  return { groupName: data as string | undefined, isPending, error };
};

/**
 * Hook for tokenIdOf
 * 根据组名获取 tokenId
 */
export const useTokenIdOf = (groupName: string) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'tokenIdOf',
    args: [groupName],
    query: {
      enabled: !!groupName,
    },
  });

  return { tokenId: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for tokenByIndex
 * 根据索引获取 tokenId
 */
export const useTokenByIndex = (index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'tokenByIndex',
    args: [index],
    query: {
      enabled: index !== undefined,
    },
  });

  return { tokenId: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for holdersAtIndex
 * 根据索引获取持有者地址
 */
export const useHoldersAtIndex = (index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'holdersAtIndex',
    args: [index],
    query: {
      enabled: index !== undefined,
    },
  });

  return { holder: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for tokenOfOwnerByIndex
 * 根据所有者和索引获取 tokenId
 */
export const useTokenOfOwnerByIndex = (owner: `0x${string}`, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'tokenOfOwnerByIndex',
    args: [owner, index],
    query: {
      enabled: !!owner && index !== undefined,
    },
  });

  return { tokenId: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for tokenURI
 * 获取 tokenURI
 */
export const useTokenURI = (tokenId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'tokenURI',
    args: [tokenId],
    query: {
      enabled: tokenId !== undefined,
    },
  });

  return { tokenURI: data as string | undefined, isPending, error };
};

/**
 * Hook for normalizedNameOf
 * 获取标准化的群名称
 */
export const useNormalizedNameOf = (groupName: string) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'normalizedNameOf',
    args: [groupName],
    query: {
      enabled: !!groupName,
    },
  });

  return { normalizedName: data as string | undefined, isPending, error };
};

/**
 * Hook for getApproved
 * 获取已批准的地址
 */
export const useGetApproved = (tokenId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'getApproved',
    args: [tokenId],
    query: {
      enabled: tokenId !== undefined,
    },
  });

  return { approved: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for isApprovedForAll
 * 检查操作者是否被批准管理所有者的所有 NFT
 */
export const useIsApprovedForAll = (owner: `0x${string}`, operator: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupAbi,
    functionName: 'isApprovedForAll',
    args: [owner, operator],
    query: {
      enabled: !!owner && !!operator,
    },
  });

  return { isApprovedForAll: data as boolean | undefined, isPending, error };
};

// =======================
// ===== Write Hooks =====
// =======================

/**
 * Hook for mint
 * 铸造组 NFT
 */
export function useMint() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20GroupAbi,
    CONTRACT_ADDRESS,
    'mint',
  );

  const mint = async (groupName: string) => {
    console.log('提交mint交易:', { groupName, isTukeMode });
    return await execute([groupName]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('mint tx hash:', hash);
    }
    if (error) {
      console.log('提交mint交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    mint,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for approve
 * 批准地址使用指定的 tokenId
 */
export function useApprove() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20GroupAbi,
    CONTRACT_ADDRESS,
    'approve',
  );

  const approve = async (to: `0x${string}`, tokenId: bigint) => {
    console.log('提交approve交易:', { to, tokenId, isTukeMode });
    return await execute([to, tokenId]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('approve tx hash:', hash);
    }
    if (error) {
      console.log('提交approve交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    approve,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for setApprovalForAll
 * 设置操作者是否被批准管理所有 NFT
 */
export function useSetApprovalForAll() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20GroupAbi,
    CONTRACT_ADDRESS,
    'setApprovalForAll',
  );

  const setApprovalForAll = async (operator: `0x${string}`, approved: boolean) => {
    console.log('提交setApprovalForAll交易:', { operator, approved, isTukeMode });
    return await execute([operator, approved]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('setApprovalForAll tx hash:', hash);
    }
    if (error) {
      console.log('提交setApprovalForAll交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    setApprovalForAll,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for transferFrom
 * 转移 NFT
 */
export function useTransferFrom() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20GroupAbi,
    CONTRACT_ADDRESS,
    'transferFrom',
  );

  const transferFrom = async (from: `0x${string}`, to: `0x${string}`, tokenId: bigint) => {
    console.log('提交transferFrom交易:', { from, to, tokenId, isTukeMode });
    return await execute([from, to, tokenId]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('transferFrom tx hash:', hash);
    }
    if (error) {
      console.log('提交transferFrom交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    transferFrom,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for safeTransferFrom (without data)
 * 安全转移 NFT（不带数据）
 */
export function useSafeTransferFrom() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20GroupAbi,
    CONTRACT_ADDRESS,
    'safeTransferFrom',
  );

  const safeTransferFrom = async (from: `0x${string}`, to: `0x${string}`, tokenId: bigint) => {
    console.log('提交safeTransferFrom交易:', { from, to, tokenId, isTukeMode });
    return await execute([from, to, tokenId]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('safeTransferFrom tx hash:', hash);
    }
    if (error) {
      console.log('提交safeTransferFrom交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    safeTransferFrom,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for safeTransferFrom (with data)
 * 安全转移 NFT（带数据）
 */
export function useSafeTransferFromWithData() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20GroupAbi,
    CONTRACT_ADDRESS,
    'safeTransferFrom',
  );

  const safeTransferFromWithData = async (
    from: `0x${string}`,
    to: `0x${string}`,
    tokenId: bigint,
    data: `0x${string}`,
  ) => {
    console.log('提交safeTransferFromWithData交易:', { from, to, tokenId, data, isTukeMode });
    return await execute([from, to, tokenId, data]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('safeTransferFromWithData tx hash:', hash);
    }
    if (error) {
      console.log('提交safeTransferFromWithData交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    safeTransferFromWithData,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}
