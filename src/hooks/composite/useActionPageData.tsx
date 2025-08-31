import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20SubmitAbi } from '@/src/abis/LOVE20Submit';
import { LOVE20JoinAbi } from '@/src/abis/LOVE20Join';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { ActionInfo } from '@/src/types/love20types';

const SUBMIT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SUBMIT as `0x${string}`;
const JOIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN as `0x${string}`;

export interface UseActionPageDataParams {
  tokenAddress: `0x${string}` | undefined;
  actionId: bigint | undefined;
  account?: `0x${string}`;
}

export interface ActionPageData {
  // 行动基本信息
  actionInfo: ActionInfo | undefined;
  
  // 参与统计
  participantCount: bigint | undefined;
  totalAmount: bigint | undefined;
  
  // 用户参与状态
  userJoinedAmount: bigint | undefined;
  isJoined: boolean;
  
  // 当前轮次
  currentRound: bigint | undefined;
  
  // 加载状态
  isPending: boolean;
  error: any;
}

export const useActionPageData = ({ 
  tokenAddress, 
  actionId, 
  account 
}: UseActionPageDataParams): ActionPageData => {
  
  const contracts = useMemo(() => {
    if (!tokenAddress || actionId === undefined) return [];
    
    const baseContracts = [
      // 行动基本信息
      {
        address: SUBMIT_CONTRACT_ADDRESS,
        abi: LOVE20SubmitAbi,
        functionName: 'actionInfo',
        args: [tokenAddress, actionId],
      },
      // 总参与代币量
      {
        address: JOIN_CONTRACT_ADDRESS,
        abi: LOVE20JoinAbi,
        functionName: 'amountByActionId',
        args: [tokenAddress, actionId],
      },
      // 参与地址数
      {
        address: JOIN_CONTRACT_ADDRESS,
        abi: LOVE20JoinAbi,
        functionName: 'numOfAccounts',
        args: [tokenAddress, actionId],
      },
      // 当前轮次
      {
        address: JOIN_CONTRACT_ADDRESS,
        abi: LOVE20JoinAbi,
        functionName: 'currentRound',
        args: [],
      },
    ];

    // 如果有用户地址，添加用户参与信息查询
    if (account) {
      baseContracts.push({
        address: JOIN_CONTRACT_ADDRESS,
        abi: LOVE20JoinAbi,
        functionName: 'amountByActionIdByAccount',
        args: [tokenAddress, actionId, account],
      });
    }

    return baseContracts;
  }, [tokenAddress, actionId, account]);

  const { data, isPending, error } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!tokenAddress && actionId !== undefined && contracts.length > 0,
    },
  });

  const actionPageData = useMemo(() => {
    if (!data || !tokenAddress || actionId === undefined) {
      return {
        actionInfo: undefined,
        participantCount: undefined,
        totalAmount: undefined,
        userJoinedAmount: undefined,
        isJoined: false,
        currentRound: undefined,
        isPending,
        error,
      };
    }

    const [
      actionInfoResult,
      totalAmountResult,
      participantCountResult,
      currentRoundResult,
      userJoinedAmountResult,
    ] = data;

    const actionInfo = actionInfoResult?.result as ActionInfo | undefined;
    const totalAmount = totalAmountResult?.result ? safeToBigInt(totalAmountResult.result) : undefined;
    const participantCount = participantCountResult?.result ? safeToBigInt(participantCountResult.result) : undefined;
    const currentRound = currentRoundResult?.result ? safeToBigInt(currentRoundResult.result) : undefined;
    
    // 用户参与金额（只有在提供account时才有数据）
    const userJoinedAmount = userJoinedAmountResult?.result 
      ? safeToBigInt(userJoinedAmountResult.result) 
      : undefined;
    
    const isJoined = userJoinedAmount ? userJoinedAmount > 0n : false;

    return {
      actionInfo,
      participantCount,
      totalAmount,
      userJoinedAmount,
      isJoined,
      currentRound,
      isPending,
      error,
    };
  }, [data, tokenAddress, actionId, isPending, error]);

  return actionPageData;
};