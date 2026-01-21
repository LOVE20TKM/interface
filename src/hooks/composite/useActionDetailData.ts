import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20SubmitAbi } from '@/src/abis/LOVE20Submit';
import { LOVE20JoinAbi } from '@/src/abis/LOVE20Join';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { ActionInfo } from '@/src/types/love20types';
import { useActionParticipationAdapter } from '@/src/hooks/extension/base/composite';
import { FactoryInfo } from '@/src/hooks/extension/base/composite/useExtensionsByActionInfosWithCache';

const SUBMIT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SUBMIT as `0x${string}`;
const JOIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN as `0x${string}`;

export interface UseActionDetailDataParams {
  tokenAddress: `0x${string}` | undefined;
  actionId: bigint | undefined;
  account?: `0x${string}`;
}

export interface ActionDetailData {
  // 行动基本信息
  actionInfo: ActionInfo | undefined;

  // 参与统计（自动支持扩展行动）
  participantCount: bigint | undefined;
  totalAmount: bigint | undefined;
  joinedAmountTokenAddress: `0x${string}` | undefined;
  joinedAmountTokenSymbol: string | undefined;
  joinedAmountTokenIsLP: boolean;

  // 用户参与状态（自动支持扩展行动）
  isJoined: boolean;

  // 当前轮次
  currentRound: bigint | undefined;

  // 扩展行动信息
  isExtensionAction: boolean;
  extensionAddress: `0x${string}` | undefined;
  factory: FactoryInfo | undefined;

  // 加载状态
  isPending: boolean;
  error: any;
}

export const useActionDetailData = ({
  tokenAddress,
  actionId,
  account,
}: UseActionDetailDataParams): ActionDetailData => {
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

  const {
    data,
    isPending: isBasicDataPending,
    error: basicDataError,
  } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!tokenAddress && actionId !== undefined && contracts.length > 0,
    },
  });

  // ==========================================
  // 步骤 1: 解析基础数据
  // ==========================================
  const basicData = useMemo(() => {
    if (!data || !tokenAddress || actionId === undefined) {
      return {
        actionInfo: undefined,
        participantCount: undefined,
        totalAmount: undefined,
        isJoined: false,
        currentRound: undefined,
      };
    }

    const [actionInfoResult, totalAmountResult, participantCountResult, currentRoundResult, userJoinedAmountResult] =
      data;

    const actionInfo = actionInfoResult?.result as ActionInfo | undefined;
    const totalAmount = totalAmountResult?.result ? safeToBigInt(totalAmountResult.result) : undefined;
    const participantCount = participantCountResult?.result ? safeToBigInt(participantCountResult.result) : undefined;
    const currentRound = currentRoundResult?.result ? safeToBigInt(currentRoundResult.result) : undefined;

    // 用户是否已参与（只有在提供account时才有数据）
    const isJoined = userJoinedAmountResult?.result ? safeToBigInt(userJoinedAmountResult.result) > BigInt(0) : false;

    return {
      actionInfo,
      participantCount,
      totalAmount,
      isJoined,
      currentRound,
    };
  }, [data, tokenAddress, actionId]);

  // ==========================================
  // 步骤 2: 获取参与数据（自动判断扩展行动）
  // ==========================================
  const participationData = useActionParticipationAdapter(
    tokenAddress,
    basicData.actionInfo, // 传入 actionInfo 用于判断是否为扩展行动
    account,
    {
      participantCount: basicData.participantCount,
      totalAmount: basicData.totalAmount,
      isJoined: basicData.isJoined,
    },
  );

  // ==========================================
  // 步骤 3: 整合所有数据
  // ==========================================
  const finalData: ActionDetailData = useMemo(() => {
    return {
      // 基本信息（始终从基础合约获取）
      actionInfo: basicData.actionInfo,
      currentRound: basicData.currentRound,

      // 参与统计（自动使用扩展数据或基础数据）
      participantCount: participationData.participantCount,
      totalAmount: participationData.totalAmount,
      joinedAmountTokenAddress: participationData.joinedAmountTokenAddress,
      joinedAmountTokenSymbol: participationData.joinedAmountTokenSymbol,
      joinedAmountTokenIsLP: participationData.joinedAmountTokenIsLP,
      isJoined: participationData.isJoined,

      // 扩展行动信息
      isExtensionAction: participationData.isExtensionAction,
      extensionAddress: participationData.extensionAddress,
      factory: participationData.factory,

      // 加载状态（合并）
      isPending: isBasicDataPending || participationData.isPending,
      error: basicDataError || participationData.error,
    };
  }, [basicData, participationData, isBasicDataPending, basicDataError]);

  return finalData;
};
