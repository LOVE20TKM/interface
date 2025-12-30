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
 *
 * 注意：currentRound 会在 hook 内部自动读取，无需传入
 * ```
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { useActionIdsByAccount } from '@/src/hooks/extension/base/contracts/useExtensionCenter';
import { ExtensionContractInfo } from './useExtensionBaseData';
import { LOVE20RoundViewerAbi } from '@/src/abis/LOVE20RoundViewer';
import { LOVE20JoinAbi } from '@/src/abis/LOVE20Join';
import { IExtensionAbi } from '@/src/abis/IExtension';
import { JoinedAction } from '@/src/types/love20types';
import { getExtensionConfigs, getExtensionConfigByFactory, ExtensionType } from '@/src/config/extensionConfig';
import { safeToBigInt } from '@/src/lib/clientUtils';

const ROUND_VIEWER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_ROUNDVIEWER as `0x${string}`;
const JOIN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN as `0x${string}`;

// 行动激励的最小投票占比（千分比）
const ACTION_REWARD_MIN_VOTE_PER_THOUSAND = BigInt(process.env.NEXT_PUBLIC_ACTION_REWARD_MIN_VOTE_PER_THOUSAND || '0');

export interface UseMyJoinedExtensionActionsParams {
  tokenAddress: `0x${string}` | undefined;
  account: `0x${string}` | undefined;
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
 * @returns 扩展行动列表（与 useJoinedActions 相同的数据格式）+ 扩展合约信息
 */
export const useMyJoinedExtensionActions = ({
  tokenAddress,
  account,
}: UseMyJoinedExtensionActionsParams): UseMyJoinedExtensionActionsResult => {
  // 从配置中获取所有 factory 地址
  const factories = useMemo(() => {
    const configs = getExtensionConfigs();
    return configs.map((config) => config.factoryAddress);
  }, []);

  // 步骤1: 获取用户在扩展协议中参与的行动ID列表、扩展地址和 factory 地址
  const {
    actionIds: extensionActionIds,
    extensions: extensionAddresses,
    factories_: extensionFactories,
    isPending: isPendingExtensionIds,
    error: errorExtensionIds,
  } = useActionIdsByAccount(tokenAddress || ('' as `0x${string}`), account || ('' as `0x${string}`), factories);

  // 检查是否有扩展行动（但不能提前返回，必须保持 hooks 调用顺序一致）
  const hasExtensionActions = !isPendingExtensionIds && extensionActionIds && extensionActionIds.length > 0;

  // 步骤1.5: 合并获取当前轮次和行动详细信息（减少 RPC 调用次数）
  const combinedContracts = useMemo(() => {
    const contracts: any[] = [
      // 总是获取 currentRound
      {
        address: JOIN_ADDRESS,
        abi: LOVE20JoinAbi,
        functionName: 'currentRound' as const,
        args: [],
      },
    ];

    // 如果有扩展行动，同时获取行动详细信息
    if (hasExtensionActions && tokenAddress && account && extensionActionIds) {
      contracts.push({
        address: ROUND_VIEWER_ADDRESS,
        abi: LOVE20RoundViewerAbi,
        functionName: 'actionInfosByIds',
        args: [tokenAddress, extensionActionIds],
      });
    }

    return contracts;
  }, [hasExtensionActions, tokenAddress, account, extensionActionIds]);

  const {
    data: combinedData,
    isPending: isPendingCombined,
    error: errorCombined,
  } = useReadContracts({
    contracts: combinedContracts as any,
  });

  // 解析 currentRound（第一个结果）
  const currentRound = useMemo(() => {
    if (!combinedData || combinedData.length === 0 || !combinedData[0]?.result) {
      return undefined;
    }
    return safeToBigInt(combinedData[0].result);
  }, [combinedData]);

  // 解析 actionInfosData（第二个结果，如果存在）
  // 保持与原来 useReadContracts 返回格式一致：数组，每个元素有 result 属性
  const actionInfosData = useMemo(() => {
    // 如果没有扩展行动，返回空数组
    if (!hasExtensionActions || !combinedData || combinedData.length < 2) {
      return [];
    }
    // 第二个结果是 actionInfosByIds，保持原格式
    const secondResult = combinedData[1];
    if (!secondResult || !secondResult.result) {
      return [];
    }
    return [secondResult]; // 保持与原来格式一致，返回数组格式
  }, [combinedData, hasExtensionActions]);

  // 分离加载状态和错误（currentRound 和 actionInfos 的）
  const isPendingCurrentRound = isPendingCombined;
  const isPendingActionInfos = hasExtensionActions ? isPendingCombined : false;
  const errorCurrentRound = errorCombined;
  const errorActionInfos = hasExtensionActions ? errorCombined : undefined;

  // 步骤2: 解析行动信息，用于获取扩展合约信息
  const actionInfos = useMemo(() => {
    if (!actionInfosData || actionInfosData.length === 0 || !actionInfosData[0]?.result) {
      return [];
    }
    const result = actionInfosData[0].result as any[];
    return result || [];
  }, [actionInfosData]);

  // 步骤3: 直接使用 actionIdsByAccount 返回的 extensions 和 factories_ 构建合约信息
  const contractInfos = useMemo((): ExtensionContractInfo[] => {
    if (!extensionActionIds || extensionActionIds.length === 0 || !extensionAddresses || !extensionFactories) {
      return [];
    }

    // 确保三个数组长度一致
    const length = Math.min(extensionActionIds.length, extensionAddresses.length, extensionFactories.length);

    const results: ExtensionContractInfo[] = [];

    for (let i = 0; i < length; i++) {
      const actionId = extensionActionIds[i];
      const extensionAddress = extensionAddresses[i];
      const factoryAddress = extensionFactories[i];

      // 如果扩展地址是零地址，说明不是扩展行动
      const isExtension = extensionAddress && extensionAddress !== '0x0000000000000000000000000000000000000000';

      if (isExtension && factoryAddress) {
        // 从配置中获取 factory 的类型和名称
        const config = getExtensionConfigByFactory(factoryAddress);
        const factoryName = config?.name || '未知类型';
        const factoryType = config?.type || ExtensionType.LP;

        results.push({
          actionId,
          isExtension: true,
          factory: {
            type: factoryType,
            name: factoryName,
            address: factoryAddress,
          },
          extension: extensionAddress,
        });
      } else {
        // 非扩展行动
        results.push({
          actionId,
          isExtension: false,
        });
      }
    }

    return results;
  }, [extensionActionIds, extensionAddresses, extensionFactories]);

  // 不再需要等待合约信息查询
  const isPendingContractInfo = false;
  const errorContractInfo = undefined;

  // 步骤4: 获取投票信息（需要 currentRound）
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

  // 步骤5: 获取用户参与代币数
  const joinedValueContracts = useMemo(() => {
    if (!account || !contractInfos || contractInfos.length === 0) {
      return [];
    }

    return contractInfos
      .filter((info) => info.isExtension && info.extension)
      .map((info) => ({
        address: info.extension!,
        abi: IExtensionAbi,
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

  // 步骤6: 构建投票数据映射
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

  // 步骤7: 组合所有数据，构建 JoinedAction 列表
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
    ? isPendingExtensionIds || isPendingCurrentRound
    : isPendingExtensionIds ||
      isPendingCurrentRound ||
      isPendingContractInfo ||
      isPendingActionInfos ||
      (votesNumsContract !== null && isPendingVotesNums) ||
      (joinedValueContracts.length > 0 && isPendingJoinedValues);

  // 合并错误信息
  const error =
    errorExtensionIds ||
    errorCurrentRound ||
    errorContractInfo ||
    errorActionInfos ||
    errorVotesNums ||
    errorJoinedValues;

  return {
    joinedExtensionActions: joinedExtensionActions || [], // 确保总是返回数组
    extensionContractInfos: contractInfos || [], // 返回扩展合约信息
    isPending,
    error,
  };
};
