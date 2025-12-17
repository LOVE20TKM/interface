// hooks/composite/useMyGovData.ts
// 合并获取用户治理票数据的复合hook

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20StakeAbi } from '@/src/abis/LOVE20Stake';
import { LOVE20RoundViewerAbi } from '@/src/abis/LOVE20RoundViewer';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { GovData } from '@/src/types/love20types';

const STAKE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE as `0x${string}`;
const ROUND_VIEWER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_ROUNDVIEWER as `0x${string}`;

export interface MyGovDataParams {
  tokenAddress: `0x${string}` | undefined;
  account: `0x${string}` | undefined;
}

export interface MyGovDataResult {
  // 我的有效治理票数
  validGovVotes: bigint | undefined;
  // 治理数据（包含总治理票数等）
  govData: GovData | undefined;
  // 我的治理票占比（百分比）
  governancePercentage: number;
  // 加载状态
  isPending: boolean;
  // 错误信息
  error: any;
}

/**
 * 复合hook：一次RPC获取用户治理票数据和治理票占比
 * 
 * @param tokenAddress 代币地址
 * @param account 账户地址
 * @returns validGovVotes: 有效治理票数
 * @returns govData: 治理数据
 * @returns governancePercentage: 治理票占比（百分比）
 * @returns isPending: 加载状态
 * @returns error: 错误信息
 */
export const useMyGovData = ({ tokenAddress, account }: MyGovDataParams): MyGovDataResult => {
  const contracts = useMemo(() => {
    if (!tokenAddress || !account) return [];

    return [
      // 获取有效治理票数
      {
        address: STAKE_CONTRACT_ADDRESS,
        abi: LOVE20StakeAbi,
        functionName: 'validGovVotes',
        args: [tokenAddress, account],
      },
      // 获取治理数据
      {
        address: ROUND_VIEWER_CONTRACT_ADDRESS,
        abi: LOVE20RoundViewerAbi,
        functionName: 'govData',
        args: [tokenAddress],
      },
    ];
  }, [tokenAddress, account]);

  const { data, isPending, error } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!tokenAddress && !!account && contracts.length > 0,
    },
  });

  const result = useMemo(() => {
    if (!data || !tokenAddress || !account) {
      return {
        validGovVotes: undefined,
        govData: undefined,
        governancePercentage: 0,
        isPending,
        error,
      };
    }

    const [validGovVotesResult, govDataResult] = data;

    const validGovVotes = validGovVotesResult?.result ? safeToBigInt(validGovVotesResult.result) : undefined;
    const govData = govDataResult?.result as GovData | undefined;

    // 计算治理票占比
    const governancePercentage =
      govData?.govVotes && validGovVotes ? (Number(validGovVotes) / Number(govData.govVotes)) * 100 : 0;

    return {
      validGovVotes,
      govData,
      governancePercentage,
      isPending,
      error,
    };
  }, [data, tokenAddress, account, isPending, error]);

  return result;
};

