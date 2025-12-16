/**
 * 我参与的扩展行动数据 Hook
 *
 * 功能：
 * 1. 获取用户在扩展协议中参与的行动 IDs
 * 2. 查询这些行动的合约信息（factory、extension 地址）
 * 3. 批量查询行动详细信息和用户参与数据
 * 4. 返回与 useJoinedActions 相同格式的数据结构
 *
 * 使用示例：
 * ```typescript
 * const { joinedExtensionActions, isPending, error } = useMyJoinedExtensionActions({
 *   tokenAddress,
 *   account,
 * });
 * ```
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { useActionIdsByAccount } from '@/src/hooks/extension/base/contracts/useLOVE20ExtensionCenter';
import { useExtensionsContractInfo, ExtensionContractInfo } from './useExtensionBaseData';
import { LOVE20RoundViewerAbi } from '@/src/abis/LOVE20RoundViewer';
import { LOVE20ExtensionLpAbi } from '@/src/abis/LOVE20ExtensionLp';
import { JoinedAction } from '@/src/types/love20types';

const ROUND_VIEWER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_ROUNDVIEWER as `0x${string}`;

// 行动激励的最小投票占比（千分比）
const ACTION_REWARD_MIN_VOTE_PER_THOUSAND = BigInt(process.env.NEXT_PUBLIC_ACTION_REWARD_MIN_VOTE_PER_THOUSAND || '0');

export interface UseMyJoinedExtensionActionsParams {
  tokenAddress: `0x${string}` | undefined;
  account: `0x${string}` | undefined;
  currentRound: bigint | undefined;
}

export interface UseMyJoinedExtensionActionsResult {
  joinedExtensionActions: JoinedAction[];
  extensionContractInfos: ExtensionContractInfo[];
  isPending: boolean;
  error: any;
}

/**
 * 获取用户参与的扩展行动列表
 *
 * @param tokenAddress 代币地址
 * @param account 用户地址
 * @param currentRound 当前轮次（从外部传入，避免重复查询）
 * @returns 扩展行动列表（与 useJoinedActions 相同的数据格式）+ 扩展合约信息
 */
export const useMyJoinedExtensionActions = ({
  tokenAddress,
  account,
  currentRound,
}: UseMyJoinedExtensionActionsParams): UseMyJoinedExtensionActionsResult => {
  // 步骤1: 获取用户在扩展协议中参与的行动ID列表
  const {
    actionIds: extensionActionIds,
    isPending: isPendingExtensionIds,
    error: errorExtensionIds,
  } = useActionIdsByAccount(tokenAddress || ('' as `0x${string}`), account || ('' as `0x${string}`));

  // 检查是否有扩展行动（但不能提前返回，必须保持 hooks 调用顺序一致）
  const hasExtensionActions = !isPendingExtensionIds && extensionActionIds && extensionActionIds.length > 0;

  // 步骤2: 先获取行动详细信息
  const actionInfosContract = useMemo(() => {
    if (!hasExtensionActions || !tokenAddress || !account) {
      return null;
    }

    return {
      address: ROUND_VIEWER_ADDRESS,
      abi: LOVE20RoundViewerAbi,
      functionName: 'actionInfosByIds',
      args: [tokenAddress, extensionActionIds!], // hasExtensionActions 为 true 时 extensionActionIds 一定存在
    };
  }, [hasExtensionActions, tokenAddress, account, extensionActionIds]);

  // 步骤3: 获取行动详细信息
  const {
    data: actionInfosData,
    isPending: isPendingActionInfos,
    error: errorActionInfos,
  } = useReadContracts({
    contracts: (actionInfosContract ? [actionInfosContract] : []) as any,
    query: {
      enabled: !!actionInfosContract,
    },
  });

  // 步骤4: 解析行动信息，用于获取扩展合约信息
  const actionInfos = useMemo(() => {
    if (!actionInfosData || actionInfosData.length === 0 || !actionInfosData[0]?.result) {
      return [];
    }
    const result = actionInfosData[0].result as any[];
    return result || [];
  }, [actionInfosData]);

  // 步骤5: 获取扩展行动的合约信息（factory、extension地址）
  const {
    contractInfos,
    isPending: isPendingContractInfo,
    error: errorContractInfo,
  } = useExtensionsContractInfo({
    tokenAddress,
    actionInfos: hasExtensionActions ? actionInfos : [], // 没有行动时传空数组
  });

  // 步骤6: 获取投票信息（需要 currentRound）
  const votesNumsContract = useMemo(() => {
    if (!tokenAddress || !currentRound || currentRound === BigInt(0)) return null;

    return {
      address: ROUND_VIEWER_ADDRESS,
      abi: LOVE20RoundViewerAbi,
      functionName: 'votesNums',
      args: [tokenAddress, currentRound],
    };
  }, [tokenAddress, currentRound]);

  const {
    data: votesNumsData,
    isPending: isPendingVotesNums,
    error: errorVotesNums,
  } = useReadContracts({
    contracts: (votesNumsContract ? [votesNumsContract] : []) as any,
    query: {
      enabled: !!votesNumsContract,
    },
  });

  // 步骤6: 获取用户参与代币数
  const joinedValueContracts = useMemo(() => {
    if (!account || !contractInfos || contractInfos.length === 0) {
      return [];
    }

    return contractInfos
      .filter((info) => info.isExtension && info.extension)
      .map((info) => ({
        address: info.extension!,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'joinedValueByAccount',
        args: [account],
      }));
  }, [account, contractInfos]);

  const {
    data: joinedValuesData,
    isPending: isPendingJoinedValues,
    error: errorJoinedValues,
  } = useReadContracts({
    contracts: joinedValueContracts as any,
    query: {
      enabled: joinedValueContracts.length > 0,
    },
  });

  // 步骤7: 构建投票数据映射
  const votesMap = useMemo(() => {
    if (!votesNumsData || votesNumsData.length === 0 || !votesNumsData[0]?.result) {
      return new Map<bigint, { votes: bigint; totalVotes: bigint }>();
    }

    const result = votesNumsData[0].result;
    if (!Array.isArray(result) || result.length !== 2) {
      return new Map<bigint, { votes: bigint; totalVotes: bigint }>();
    }

    const actionIds = result[0] as readonly bigint[];
    const votes = result[1] as readonly bigint[];

    // 计算总投票数
    const totalVotes = votes.reduce((sum, v) => sum + BigInt(v.toString()), BigInt(0));

    // 构建映射
    const map = new Map<bigint, { votes: bigint; totalVotes: bigint }>();
    for (let i = 0; i < actionIds.length; i++) {
      const actionId = BigInt(actionIds[i].toString());
      const voteCount = BigInt(votes[i].toString());
      map.set(actionId, { votes: voteCount, totalVotes });
    }

    return map;
  }, [votesNumsData]);

  // 步骤8: 组合所有数据，构建 JoinedAction 列表
  const joinedExtensionActions = useMemo((): JoinedAction[] => {
    if (
      !extensionActionIds ||
      extensionActionIds.length === 0 ||
      !actionInfosData ||
      actionInfosData.length === 0 ||
      !contractInfos
    ) {
      return [];
    }

    // 获取 actionInfosByIds 的结果
    const actionInfosResult = actionInfosData[0]?.result as any[] | undefined;
    if (!actionInfosResult || actionInfosResult.length === 0) {
      return [];
    }

    const actions: JoinedAction[] = [];
    let joinedValueIndex = 0;

    for (let i = 0; i < extensionActionIds.length; i++) {
      const actionInfo = actionInfosResult[i];
      if (!actionInfo) continue;

      const actionId = extensionActionIds[i];
      const contractInfo = contractInfos[i];

      // 获取用户参与代币数
      let joinedValue = BigInt(0);
      if (contractInfo?.isExtension && contractInfo.extension) {
        const joinedValueResult = joinedValuesData?.[joinedValueIndex];
        if (joinedValueResult?.result != null) {
          joinedValue = BigInt(joinedValueResult.result.toString());
        }
        joinedValueIndex++;
      }

      // 获取投票信息
      const voteInfo = votesMap.get(actionId);
      const votesNum = voteInfo?.votes || BigInt(0);
      const totalVotes = voteInfo?.totalVotes || BigInt(0);

      // 计算投票占比（万分比）
      let votePercentPerTenThousand = BigInt(0);
      if (totalVotes > BigInt(0) && votesNum > BigInt(0)) {
        votePercentPerTenThousand = (votesNum * BigInt(10000)) / totalVotes;
      }

      // 判断是否有激励
      const hasReward = votePercentPerTenThousand > ACTION_REWARD_MIN_VOTE_PER_THOUSAND * BigInt(10);

      // 构建 JoinedAction 对象
      actions.push({
        action: actionInfo,
        votesNum,
        votePercentPerTenThousand,
        hasReward,
        joinedAmountOfAccount: joinedValue,
      });
    }

    return actions;
  }, [extensionActionIds, actionInfosData, contractInfos, joinedValuesData, votesMap]);

  // 计算总的加载状态
  // 如果没有扩展行动，则不需要等待其他查询完成
  const isPending = !hasExtensionActions
    ? isPendingExtensionIds
    : isPendingExtensionIds ||
      isPendingContractInfo ||
      isPendingActionInfos ||
      (votesNumsContract !== null && isPendingVotesNums) ||
      (joinedValueContracts.length > 0 && isPendingJoinedValues);

  // 合并错误信息
  const error = errorExtensionIds || errorContractInfo || errorActionInfos || errorVotesNums || errorJoinedValues;

  return {
    joinedExtensionActions: joinedExtensionActions || [], // 确保总是返回数组
    extensionContractInfos: contractInfos || [], // 返回扩展合约信息
    isPending,
    error,
  };
};
