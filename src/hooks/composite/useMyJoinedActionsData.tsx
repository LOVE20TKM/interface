import { useMemo } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { useJoinedActions } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useActionIdsByAccount } from '@/src/hooks/contracts/useLOVE20ExtensionCenter';
import { LOVE20RoundViewerAbi } from '@/src/abis/LOVE20RoundViewer';
import { LOVE20ExtensionStakeLpAbi } from '@/src/abis/LOVE20ExtensionStakeLp';
import { LOVE20JoinAbi } from '@/src/abis/LOVE20Join';
import { JoinedAction } from '@/src/types/love20types';
import { useActionsExtensionInfo } from './useActionsExtensionInfo';
import { safeToBigInt } from '@/src/lib/clientUtils';

const ROUND_VIEWER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_ROUNDVIEWER as `0x${string}`;
const JOIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN as `0x${string}`;

// 行动激励的最小投票占比（千分比）
const ACTION_REWARD_MIN_VOTE_PER_THOUSAND = BigInt(process.env.NEXT_PUBLIC_ACTION_REWARD_MIN_VOTE_PER_THOUSAND || '0');

export interface UseMyJoinedActionsDataParams {
  tokenAddress: `0x${string}` | undefined;
}

export interface UseMyJoinedActionsDataResult {
  // 合并后的行动列表
  joinedActions: JoinedAction[];

  // 加载状态
  isPending: boolean;

  // 错误信息
  error: any;
}

/**
 * 我参加的行动数据聚合Hook
 *
 * 功能：
 * 1. 获取原始core协议中参与的行动
 * 2. 获取扩展协议中参与的行动
 * 3. 合并两个列表，提供统一的数据结构
 * 4. 自动处理扩展协议的参与代币数获取
 * 5. 集成投票信息并计算投票占比
 * 6. 优化 RPC 批量调用，减少网络请求
 *
 * @param tokenAddress 代币地址
 * @returns 合并后的行动列表、加载状态和错误信息
 */
export const useMyJoinedActionsData = ({
  tokenAddress,
}: UseMyJoinedActionsDataParams): UseMyJoinedActionsDataResult => {
  const { address: account } = useAccount();

  // 步骤1: 获取原始core协议中的参与行动
  const {
    joinedActions: coreJoinedActions,
    isPending: isPendingCore,
    error: errorCore,
  } = useJoinedActions(tokenAddress || ('' as `0x${string}`), account as `0x${string}`);

  // 步骤2: 获取用户在扩展协议中参与的行动ID列表
  const {
    actionIdsByAccount: extensionActionIds,
    isPending: isPendingExtensionIds,
    error: errorExtensionIds,
  } = useActionIdsByAccount(tokenAddress || ('' as `0x${string}`), account as `0x${string}`);

  // 步骤3: 过滤出不在core列表中的扩展行动ID（避免重复）
  const uniqueExtensionActionIds = useMemo(() => {
    if (!extensionActionIds || extensionActionIds.length === 0) return [];

    const coreActionIds = new Set(coreJoinedActions?.map((action) => action.action.head.id) || []);

    return extensionActionIds.filter((id) => !coreActionIds.has(id));
  }, [extensionActionIds, coreJoinedActions]);

  // 步骤4: 获取扩展行动的扩展信息
  const {
    extensionInfos,
    isPending: isPendingExtensionInfo,
    error: errorExtensionInfo,
  } = useActionsExtensionInfo({
    tokenAddress,
    actionIds: uniqueExtensionActionIds,
  });

  // 步骤5: 构建批量 RPC 调用合约列表
  // 合约调用顺序：
  // [0] currentRound - 获取当前轮次
  // [1] actionInfosByIds - 获取扩展行动的详细信息（如果有扩展行动）
  // [2...n] joinedValueByAccount - 获取用户在各个扩展合约的参与代币数
  const { allContracts, hasActionInfos } = useMemo(() => {
    const contracts: any[] = [];
    let hasActionInfosFlag = false;

    // 合约 [0]: currentRound - 始终添加
    if (tokenAddress) {
      contracts.push({
        address: JOIN_CONTRACT_ADDRESS,
        abi: LOVE20JoinAbi,
        functionName: 'currentRound',
        args: [],
      });
    }

    // 合约 [1]: actionInfosByIds - 获取扩展行动详细信息（仅当有扩展行动时）
    if (tokenAddress && uniqueExtensionActionIds.length > 0) {
      contracts.push({
        address: ROUND_VIEWER_ADDRESS,
        abi: LOVE20RoundViewerAbi,
        functionName: 'actionInfosByIds',
        args: [tokenAddress, uniqueExtensionActionIds],
      });
      hasActionInfosFlag = true;
    }

    // 合约 [2...n]: joinedValueByAccount - 获取用户在各个扩展合约的参与代币数
    if (account && extensionInfos && extensionInfos.length > 0) {
      const joinedValueContracts = extensionInfos
        .filter((info) => info.isExtension && info.extensionAddress)
        .map((info) => ({
          address: info.extensionAddress!,
          abi: LOVE20ExtensionStakeLpAbi,
          functionName: 'joinedValueByAccount',
          args: [account],
        }));

      contracts.push(...joinedValueContracts);
    }

    return { allContracts: contracts, hasActionInfos: hasActionInfosFlag };
  }, [tokenAddress, uniqueExtensionActionIds, account, extensionInfos]);

  // 第一批次 RPC 调用
  const {
    data: batchData,
    isPending: isPendingBatch,
    error: errorBatch,
  } = useReadContracts({
    contracts: allContracts as any,
    query: {
      enabled: tokenAddress !== undefined && allContracts.length > 0,
    },
  });

  // 从第一批次结果中提取 currentRound
  const currentRound = useMemo(() => {
    if (!batchData || batchData.length === 0) return undefined;
    return safeToBigInt(batchData[0]?.result);
  }, [batchData]);

  // 步骤6: 第二批次 RPC 调用 - 获取投票信息
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

  // 步骤7: 解析投票信息，构建投票数据映射
  const votesMap = useMemo(() => {
    if (!votesNumsData || votesNumsData.length === 0 || !votesNumsData[0]?.result) {
      return new Map<bigint, { votes: bigint; totalVotes: bigint }>();
    }

    const result = votesNumsData[0].result;
    // votesNums 返回 [actionIds[], votes[]]
    if (!Array.isArray(result) || result.length !== 2) {
      return new Map<bigint, { votes: bigint; totalVotes: bigint }>();
    }

    const actionIds = result[0] as readonly bigint[];
    const votes = result[1] as readonly bigint[];

    // 计算总投票数
    const totalVotes = votes.reduce((sum, v) => sum + BigInt(v.toString()), BigInt(0));

    // 构建 actionId -> votes 的映射
    const map = new Map<bigint, { votes: bigint; totalVotes: bigint }>();
    for (let i = 0; i < actionIds.length; i++) {
      const actionId = BigInt(actionIds[i].toString());
      const voteCount = BigInt(votes[i].toString());
      map.set(actionId, { votes: voteCount, totalVotes });
    }

    return map;
  }, [votesNumsData]);

  // 步骤8: 构建扩展行动的 JoinedAction 对象（包含投票信息）
  const extensionJoinedActions = useMemo(() => {
    // 如果没有扩展行动，直接返回空数组
    if (!hasActionInfos || uniqueExtensionActionIds.length === 0 || !extensionInfos) {
      return [];
    }

    // 如果批量数据还未加载完成
    if (!batchData || batchData.length < 2) {
      return [];
    }

    // batchData[0] 是 currentRound
    // batchData[1] 是 actionInfosByIds 的结果
    // batchData[2...n] 是各个扩展合约的 joinedValueByAccount 结果
    const actionInfosResult = batchData[1]?.result as any[] | undefined;
    if (!actionInfosResult || actionInfosResult.length === 0) {
      return [];
    }

    const actions: JoinedAction[] = [];
    const joinedValueStartIndex = 2; // joinedValue 从索引 2 开始
    let joinedValueOffset = 0;

    for (let i = 0; i < uniqueExtensionActionIds.length; i++) {
      const actionInfo = actionInfosResult[i];
      if (!actionInfo) continue;

      const actionId = uniqueExtensionActionIds[i];
      const extensionInfo = extensionInfos[i];
      let joinedValue = BigInt(0);

      // 如果有扩展合约，获取对应的 joinedValue
      if (extensionInfo?.isExtension && extensionInfo.extensionAddress) {
        const joinedValueResult = batchData[joinedValueStartIndex + joinedValueOffset];
        if (joinedValueResult?.result != null) {
          joinedValue = BigInt(joinedValueResult.result.toString());
        }
        joinedValueOffset++;
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

      // 判断是否有激励：投票占比 > NEXT_PUBLIC_ACTION_REWARD_MIN_VOTE_PER_THOUSAND / 1000
      // votePercentPerTenThousand 是万分比，需要转换为千分比比较
      // votePercentPerTenThousand / 10000 > ACTION_REWARD_MIN_VOTE_PER_THOUSAND / 1000
      // 简化为：votePercentPerTenThousand > ACTION_REWARD_MIN_VOTE_PER_THOUSAND * 10
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
  }, [hasActionInfos, uniqueExtensionActionIds, extensionInfos, batchData, votesMap]);

  // 步骤9: 合并core和扩展的行动列表
  const allJoinedActions = useMemo(() => {
    return [...(coreJoinedActions || []), ...extensionJoinedActions];
  }, [coreJoinedActions, extensionJoinedActions]);

  // 计算总的加载状态
  const isPending =
    isPendingCore || isPendingExtensionIds || isPendingExtensionInfo || isPendingBatch || isPendingVotesNums;

  // 合并错误信息
  const error = errorCore || errorExtensionIds || errorExtensionInfo || errorBatch || errorVotesNums;

  return {
    joinedActions: allJoinedActions,
    isPending,
    error,
  };
};
