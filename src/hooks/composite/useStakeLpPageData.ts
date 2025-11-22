import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20TokenViewerAbi } from '@/src/abis/LOVE20TokenViewer';
import { LOVE20TokenAbi } from '@/src/abis/LOVE20Token';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { PairInfo } from '@/src/types/love20types';

const TOKEN_VIEWER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_TOKENVIEWER as `0x${string}`;
const HUB_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_HUB as `0x${string}`;

export interface UseStakeLpPageDataParams {
  account: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
  parentTokenAddress: `0x${string}` | undefined;
}

export interface StakeLpPageData {
  // 交易对信息
  pairInfo: PairInfo | undefined;

  // 授权额度
  allowanceToken: bigint | undefined;
  allowanceParentToken: bigint | undefined;

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
      // 获取 token 对 hub 的授权额度
      {
        address: tokenAddress,
        abi: LOVE20TokenAbi,
        functionName: 'allowance',
        args: [account, HUB_CONTRACT_ADDRESS],
      },
      // 获取 parentToken 对 hub 的授权额度
      {
        address: parentTokenAddress,
        abi: LOVE20TokenAbi,
        functionName: 'allowance',
        args: [account, HUB_CONTRACT_ADDRESS],
      },
    ];
  }, [account, tokenAddress, parentTokenAddress]);

  const { data, isPending, error } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!account && !!tokenAddress && !!parentTokenAddress && contracts.length > 0,
    },
  });

  const stakeLpPageData = useMemo(() => {
    if (!data || !account || !tokenAddress || !parentTokenAddress) {
      return {
        pairInfo: undefined,
        allowanceToken: undefined,
        allowanceParentToken: undefined,
        isPending,
        error,
      };
    }

    const [pairInfoResult, allowanceTokenResult, allowanceParentTokenResult] = data;

    const pairInfo = pairInfoResult?.result as PairInfo | undefined;
    const allowanceToken = allowanceTokenResult?.result ? safeToBigInt(allowanceTokenResult.result) : undefined;
    const allowanceParentToken = allowanceParentTokenResult?.result
      ? safeToBigInt(allowanceParentTokenResult.result)
      : undefined;

    return {
      pairInfo,
      allowanceToken,
      allowanceParentToken,
      isPending,
      error,
    };
  }, [data, account, tokenAddress, parentTokenAddress, isPending, error]);

  return stakeLpPageData;
};
