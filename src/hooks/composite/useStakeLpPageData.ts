// TODO： 自动的LP扩展行动上线后，这个可能要去掉？
import { useMemo } from 'react';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { LOVE20TokenViewerAbi } from '@/src/abis/LOVE20TokenViewer';
import { PairInfo } from '@/src/types/love20types';

const TOKEN_VIEWER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_TOKENVIEWER as `0x${string}`;

export interface UseStakeLpPageDataParams {
  account: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
  parentTokenAddress: `0x${string}` | undefined;
}

export interface StakeLpPageData {
  // 交易对信息
  pairInfo: PairInfo | undefined;

  // 加载状态
  isPending: boolean;
  error: any;
}

export const useStakeLpPageData = ({
  account,
  tokenAddress,
  parentTokenAddress,
}: UseStakeLpPageDataParams): StakeLpPageData => {
  const contracts = useMemo(() => {
    if (!account || !tokenAddress || !parentTokenAddress) return [];

    return [
      // 获取交易对信息
      {
        address: TOKEN_VIEWER_CONTRACT_ADDRESS,
        abi: LOVE20TokenViewerAbi,
        functionName: 'tokenPairInfoWithAccount',
        args: [account, tokenAddress],
      },
    ];
  }, [account, tokenAddress, parentTokenAddress]);

  const { data, isPending, error } = useUniversalReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!account && !!tokenAddress && !!parentTokenAddress && contracts.length > 0,
    },
  });

  const stakeLpPageData = useMemo(() => {
    if (!data || !account || !tokenAddress || !parentTokenAddress) {
      return {
        pairInfo: undefined,
        isPending,
        error,
      };
    }

    const [pairInfoResult] = data;

    const pairInfo = pairInfoResult?.result as PairInfo | undefined;

    return {
      pairInfo,
      isPending,
      error,
    };
  }, [data, account, tokenAddress, parentTokenAddress, isPending, error]);

  return stakeLpPageData;
};
