// hooks/composite/useCanSubmit.ts
// 使用批量RPC调用检查用户是否可以提交行动

import { useContext, useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { useAccount } from 'wagmi';
import { TokenContext } from '@/src/contexts/TokenContext';
import { LOVE20StakeAbi } from '@/src/abis/LOVE20Stake';
import { LOVE20RoundViewerAbi } from '@/src/abis/LOVE20RoundViewer';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { GovData } from '@/src/types/love20types';

const STAKE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE as `0x${string}`;
const ROUND_VIEWER_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_ROUNDVIEWER as `0x${string}`;
const SUBMIT_MIN_PERCENTAGE = Number(process.env.NEXT_PUBLIC_SUBMIT_MIN_PER_THOUSAND || '0') / 1000;

export interface CanSubmitResult {
  // 是否有足够的治理票权
  hasEnoughVotes: boolean;
  // 治理票占比（0-1之间的小数）
  percentage: number;
  // 我的有效治理票数
  validGovVotes: bigint | undefined;
  // 治理数据（包含总治理票数等）
  govData: GovData | undefined;
  // 最小提交比例要求
  SUBMIT_MIN_PERCENTAGE: number;
  // 加载状态
  isPending: boolean;
  // 错误信息
  error: any;
}

/**
 * 复合hook：使用批量RPC调用检查用户是否可以提交行动
 * 
 * 一次RPC调用获取：
 * 1. 用户的有效治理票数 (validGovVotes)
 * 2. 代币的治理数据 (govData)
 * 
 * @returns hasEnoughVotes: 是否有足够的治理票权
 * @returns percentage: 治理票占比（0-1之间的小数）
 * @returns validGovVotes: 有效治理票数
 * @returns govData: 治理数据
 * @returns SUBMIT_MIN_PERCENTAGE: 最小提交比例要求
 * @returns isPending: 加载状态
 * @returns error: 错误信息
 */
export const useCanSubmit = (): CanSubmitResult => {
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  const contracts = useMemo(() => {
    if (!token?.address || !account) return [];

    return [
      // 获取有效治理票数
      {
        address: STAKE_CONTRACT_ADDRESS,
        abi: LOVE20StakeAbi,
        functionName: 'validGovVotes',
        args: [token.address as `0x${string}`, account as `0x${string}`],
      },
      // 获取治理数据
      {
        address: ROUND_VIEWER_CONTRACT_ADDRESS,
        abi: LOVE20RoundViewerAbi,
        functionName: 'govData',
        args: [token.address as `0x${string}`],
      },
    ];
  }, [token?.address, account]);

  const { data, isPending, error } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!token?.address && !!account && contracts.length > 0,
    },
  });

  const result = useMemo(() => {
    if (!data || !token?.address || !account) {
      return {
        hasEnoughVotes: false,
        percentage: 0,
        validGovVotes: undefined,
        govData: undefined,
        SUBMIT_MIN_PERCENTAGE,
        isPending,
        error,
      };
    }

    const [validGovVotesResult, govDataResult] = data;

    const validGovVotes = validGovVotesResult?.result ? safeToBigInt(validGovVotesResult.result) : undefined;
    const govData = govDataResult?.result as GovData | undefined;

    // 计算治理票占比（0-1之间的小数）
    const percentage =
      validGovVotes && govData?.govVotes && govData.govVotes !== BigInt(0)
        ? Number(validGovVotes) / Number(govData.govVotes)
        : 0;

    // 检查是否有足够的治理票权
    const hasEnoughVotes = percentage >= SUBMIT_MIN_PERCENTAGE;

    return {
      hasEnoughVotes,
      percentage,
      validGovVotes,
      govData,
      SUBMIT_MIN_PERCENTAGE,
      isPending,
      error,
    };
  }, [data, token?.address, account, isPending, error]);

  return result;
};

