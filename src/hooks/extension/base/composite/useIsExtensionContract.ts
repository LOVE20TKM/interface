// hooks/extension/base/composite/useIsExtensionContract.ts
// 判断一个地址是否是扩展合约

import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { ILOVE20ExtensionAbi } from '@/src/abis/ILOVE20Extension';

/**
 * Hook: 判断一个地址是否是扩展合约
 *
 * 原理：尝试调用 factory() 方法，如果成功返回地址且不是零地址，说明是扩展合约
 *
 * @param address 要检查的地址
 * @returns 是否是扩展合约、factory地址、加载状态
 */
export const useIsExtensionContract = (address: `0x${string}` | undefined) => {
  const { data, isPending, error } = useReadContract({
    address,
    abi: ILOVE20ExtensionAbi,
    functionName: 'factory',
    query: {
      enabled: !!address && address !== '0x0000000000000000000000000000000000000000',
      // 即使失败也不要抛出错误，我们用error来判断
      retry: false,
    },
  });

  const result = useMemo(() => {
    // 如果没有地址，直接返回不是扩展合约
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      return {
        isExtensionContract: false,
        factoryAddress: undefined,
        isPending: false,
        error: null,
      };
    }

    // 如果有错误，说明不是扩展合约
    if (error) {
      return {
        isExtensionContract: false,
        factoryAddress: undefined,
        isPending: false,
        error,
      };
    }

    // 如果正在加载
    if (isPending) {
      return {
        isExtensionContract: undefined, // 未知状态
        factoryAddress: undefined,
        isPending: true,
        error: null,
      };
    }

    // 如果成功获取到factory地址且不是零地址
    const factoryAddress = data as `0x${string}` | undefined;
    const isValid = !!(factoryAddress && factoryAddress !== '0x0000000000000000000000000000000000000000');

    return {
      isExtensionContract: isValid,
      factoryAddress: isValid ? factoryAddress : undefined,
      isPending: false,
      error: null,
    };
  }, [address, data, isPending, error]);

  return result;
};
