/**
 * 我参与的扩展行动数据 Hook
 *
 * 功能：
 * 1. 获取用户在扩展协议中参与的行动 IDs
 * 2. 使用 useExtensionsByActionIdsWithCache 查询扩展信息（factory、extension 地址、joinedAmountTokenAddress、joinedAmountTokenIsLP）
 * 3. 使用 useActionBaseInfosByIdsWithCache 批量查询行动详细信息（带缓存）
 * 4. 查询用户参与数据和投票信息
 * 5. 返回与 useJoinedActions 相同格式的数据结构
 *
 * 使用示例：
 * ```typescript
 * // 方式1: 不传入 currentRound，hook 内部自动获取
 * const { joinedExtensionActions, isPending, error } = useMyJoinedExtensionActions({
 *   tokenAddress,
 *   account,
 * });
 *
 * // 方式2: 传入 currentRound（如果外部已经获取）
 * const { joinedExtensionActions, isPending, error } = useMyJoinedExtensionActions({
 *   tokenAddress,
 *   account,
 *   currentRound: currentRoundValue,
 * });
 * ```
 */

import { useMemo } from 'react';
import { useReadContracts, useReadContract } from 'wagmi';
import { useActionIdsByAccount } from '@/src/hooks/extension/base/contracts/useExtensionCenter';
import { ExtensionContractInfo } from './useExtensionBaseData';
import { LOVE20RoundViewerAbi } from '@/src/abis/LOVE20RoundViewer';
import { LOVE20JoinAbi } from '@/src/abis/LOVE20Join';
import { IExtensionAbi } from '@/src/abis/IExtension';
import { JoinedAction, ActionInfo, ActionBaseInfo } from '@/src/types/love20types';
import { getExtensionConfigs, getExtensionConfigByFactory, ExtensionType } from '@/src/config/extensionConfig';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useConvertTokenAmounts, UseConvertTokenAmountParams } from '@/src/hooks/composite/useConvertTokenAmount';
import { useActionBaseInfosByIdsWithCache } from '@/src/hooks/composite/useActionBaseInfosByIdsWithCache';
import { useExtensionsByActionIdsWithCache } from './useExtensionsByActionIdsWithCache';
import { Token } from '@/src/contexts/TokenContext';

const ROUND_VIEWER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_ROUNDVIEWER as `0x${string}`;
const JOIN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN as `0x${string}`;

// 行动激励的最小投票占比（千分比）
const ACTION_REWARD_MIN_VOTE_PER_THOUSAND = BigInt(process.env.NEXT_PUBLIC_ACTION_REWARD_MIN_VOTE_PER_THOUSAND || '0');

/**
 * 转换映射 (追踪哪个转换对应哪个行动)
 */
interface ConversionMapping {
  actionIndex: number; // 在 extensionActionIds 数组中的索引
  joinedValueIndex: number; // 在 joinedValuesData 数组中的索引
  conversionIndex: number; // 在 conversions 数组中的索引
}

export interface UseMyJoinedExtensionActionsParams {
  tokenAddress: `0x${string}` | undefined;
  account: `0x${string}` | undefined;
  currentRound?: bigint; // 可选的当前轮次，如果未传入则在内部获取
}

export interface UseMyJoinedExtensionActionsResult {
  joinedExtensionActions: JoinedAction[];
  extensionContractInfos: ExtensionContractInfo[];
  isPending: boolean;
  error: any;
}

/**
 * 将 ActionBaseInfo 转换为 ActionInfo（添加空的 verificationRule）
 */
function convertActionBaseInfoToActionInfo(baseInfo: ActionBaseInfo): ActionInfo {
  return {
    head: baseInfo.head,
    body: {
      ...baseInfo.body,
      verificationRule: '', // ActionBaseInfo 不包含 verificationRule，设置为空字符串
    },
  };
}

/**
 * 获取用户参与的扩展行动列表
 *
 * @param tokenAddress 代币地址
 * @param account 用户地址
 * @param currentRound 可选的当前轮次，如果未传入则在内部获取
 * @returns 扩展行动列表（与 useJoinedActions 相同的数据格式）+ 扩展合约信息
 */
export const useMyJoinedExtensionActions = ({
  tokenAddress,
  account,
  currentRound: currentRoundParam,
}: UseMyJoinedExtensionActionsParams): UseMyJoinedExtensionActionsResult => {
  // 从配置中获取所有 factory 地址
  const factories = useMemo(() => {
    const configs = getExtensionConfigs();
    return configs.map((config) => config.factoryAddress);
  }, []);

  // 步骤1: 获取用户在扩展协议中参与的行动ID列表、扩展地址和 factory 地址
  const {
    actionIds: extensionActionIds,
    isPending: isPendingExtensionIds,
    error: errorExtensionIds,
  } = useActionIdsByAccount(tokenAddress || ('' as `0x${string}`), account || ('' as `0x${string}`), factories);

  // 检查是否有扩展行动（但不能提前返回，必须保持 hooks 调用顺序一致）
  const hasExtensionActions = !isPendingExtensionIds && extensionActionIds && extensionActionIds.length > 0;

  // 步骤1.5: 处理 currentRound - 如果未传入则在内部获取
  const {
    data: currentRoundData,
    isPending: isPendingCurrentRoundInternal,
    error: errorCurrentRoundInternal,
  } = useReadContract({
    address: JOIN_ADDRESS,
    abi: LOVE20JoinAbi,
    functionName: 'currentRound',
    args: [],
    query: {
      enabled: currentRoundParam === undefined, // 只有在未传入时才查询
    },
  });

  const currentRound = useMemo(() => {
    if (currentRoundParam !== undefined) {
      return currentRoundParam;
    }
    return safeToBigInt(currentRoundData);
  }, [currentRoundParam, currentRoundData]);

  const isPendingCurrentRound = currentRoundParam === undefined ? isPendingCurrentRoundInternal : false;
  const errorCurrentRound = currentRoundParam === undefined ? errorCurrentRoundInternal : undefined;

  // 步骤2: 使用 useActionBaseInfosByIdsWithCache 获取行动信息
  const {
    actionInfos: actionBaseInfos,
    isPending: isPendingActionInfos,
    error: errorActionInfos,
  } = useActionBaseInfosByIdsWithCache({
    tokenAddress,
    actionIds: extensionActionIds || [],
    enabled: hasExtensionActions && !!tokenAddress,
  });

  // 将 ActionBaseInfo[] 转换为 ActionInfo[]
  const actionInfos = useMemo(() => {
    return actionBaseInfos.map(convertActionBaseInfoToActionInfo);
  }, [actionBaseInfos]);

  // 步骤3: 构建最小化的 Token 对象用于 useExtensionsByActionIdsWithCache
  // 注意：即使 tokenAddress 为 undefined，也需要提供一个默认值，因为 hook 会在内部访问 token.address
  const tokenForExtension: Token = useMemo(() => {
    if (!tokenAddress) {
      // 提供一个默认的 token 对象，避免在 hook 内部访问 undefined.address
      return {
        address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        name: '',
        symbol: '',
        decimals: 18,
        hasEnded: false,
        parentTokenAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        parentTokenSymbol: '',
        parentTokenName: '',
        slTokenAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        stTokenAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        uniswapV2PairAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        initialStakeRound: 0,
        voteOriginBlocks: 0,
      };
    }
    return {
      address: tokenAddress,
      name: '',
      symbol: '',
      decimals: 18,
      hasEnded: false,
      parentTokenAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      parentTokenSymbol: '',
      parentTokenName: '',
      slTokenAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      stTokenAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      uniswapV2PairAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      initialStakeRound: 0,
      voteOriginBlocks: 0,
    };
  }, [tokenAddress]);

  // 步骤4: 使用 useExtensionsByActionIdsWithCache 获取扩展信息（包含 joinedAmountTokenAddress 和 joinedAmountTokenIsLP）
  const {
    extensions: extensionValidationInfos,
    isPending: isPendingExtensionValidation,
    error: errorExtensionValidation,
  } = useExtensionsByActionIdsWithCache({
    token: tokenForExtension,
    actionIds: extensionActionIds || [],
    enabled: hasExtensionActions && !!tokenAddress,
  });

  // 步骤5: 将 ExtensionValidationInfo[] 转换为 ExtensionContractInfo[]
  const contractInfos = useMemo((): ExtensionContractInfo[] => {
    if (!extensionActionIds || extensionActionIds.length === 0) {
      return [];
    }

    const results: ExtensionContractInfo[] = [];

    for (let i = 0; i < extensionActionIds.length; i++) {
      const actionId = extensionActionIds[i];
      const validationInfo = extensionValidationInfos[i];

      if (!validationInfo) {
        // 数据还未加载，返回默认值
        results.push({
          actionId,
          isExtension: false,
        });
        continue;
      }

      if (validationInfo.isExtension && validationInfo.factoryAddress && validationInfo.extensionAddress) {
        // 从配置中获取 factory 的类型和名称
        const config = getExtensionConfigByFactory(validationInfo.factoryAddress);
        const factoryName = config?.name || '未知类型';
        const factoryType = config?.type || ExtensionType.LP;

        results.push({
          actionId,
          isExtension: true,
          factory: {
            type: factoryType,
            name: factoryName,
            address: validationInfo.factoryAddress,
          },
          extension: validationInfo.extensionAddress,
          joinedAmountTokenAddress: validationInfo.joinedAmountTokenAddress,
          joinedAmountTokenIsLP: validationInfo.joinedAmountTokenIsLP,
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
  }, [extensionActionIds, extensionValidationInfos]);

  const isPendingContractInfo = isPendingExtensionValidation;
  const errorContractInfo = errorExtensionValidation;

  // 步骤4: 合并获取投票信息和用户参与代币数
  const mergedDynamicContracts = useMemo(() => {
    const contracts: any[] = [];

    // 添加 votesNums 查询
    if (tokenAddress && currentRound && currentRound !== BigInt(0)) {
      contracts.push({
        address: ROUND_VIEWER_ADDRESS,
        abi: LOVE20RoundViewerAbi,
        functionName: 'votesNums',
        args: [tokenAddress, currentRound],
      });
    }

    // 添加 joinedAmountByAccount 查询
    if (account && contractInfos && contractInfos.length > 0) {
      contractInfos
        .filter((info) => info.isExtension && info.extension)
        .forEach((info) => {
          contracts.push({
            address: info.extension!,
            abi: IExtensionAbi,
            functionName: 'joinedAmountByAccount',
            args: [account],
          });
        });
    }

    return contracts;
  }, [tokenAddress, currentRound, account, contractInfos]);

  const {
    data: mergedDynamicData,
    isPending: isPendingMergedDynamic,
    error: errorMergedDynamic,
  } = useReadContracts({
    contracts: mergedDynamicContracts as any,
    query: { enabled: mergedDynamicContracts.length > 0 },
  });

  // 解析 votesNums 数据（第一个结果）
  const votesNumsData = useMemo(() => {
    if (!mergedDynamicData || mergedDynamicData.length === 0) return [];
    const hasVotesNums = tokenAddress && currentRound && currentRound !== BigInt(0);
    if (!hasVotesNums) return [];
    return [mergedDynamicData[0]];
  }, [mergedDynamicData, tokenAddress, currentRound]);

  // 解析 joinedValues 数据（votesNums 之后的所有结果）
  const joinedValuesData = useMemo(() => {
    if (!mergedDynamicData || mergedDynamicData.length === 0) return [];
    const hasVotesNums = tokenAddress && currentRound && currentRound !== BigInt(0);
    const offset = hasVotesNums ? 1 : 0;
    return mergedDynamicData.slice(offset);
  }, [mergedDynamicData, tokenAddress, currentRound]);

  // 步骤5.5: 构建代币转换请求数组
  const { conversions, conversionMappings } = useMemo(() => {
    if (!tokenAddress || !extensionActionIds || !contractInfos || contractInfos.length === 0 || !joinedValuesData) {
      return { conversions: [], conversionMappings: [] };
    }

    const conversionArray: UseConvertTokenAmountParams[] = [];
    const mappings: ConversionMapping[] = [];
    let joinedValueIndex = 0;

    for (let i = 0; i < extensionActionIds.length; i++) {
      const contractInfo = contractInfos[i];

      // 跳过非扩展行动
      if (!contractInfo?.isExtension || !contractInfo.extension) {
        continue;
      }

      // 获取原始 joinedAmount
      const joinedValueResult = joinedValuesData[joinedValueIndex];
      if (!joinedValueResult?.result) {
        joinedValueIndex++;
        continue;
      }
      const joinedAmount = BigInt(joinedValueResult.result.toString());

      // 获取转换参数
      const fromToken = contractInfo.joinedAmountTokenAddress;
      const isFromTokenLP = contractInfo.joinedAmountTokenIsLP ?? false;

      // 跳过: 无源代币、源代币为零地址、或源代币与目标代币相同
      if (!fromToken || fromToken === '0x0000000000000000000000000000000000000000' || fromToken === tokenAddress) {
        joinedValueIndex++;
        continue;
      }

      // 添加到转换数组
      conversionArray.push({
        fromToken,
        isFromTokenLP,
        fromAmount: joinedAmount,
        toToken: tokenAddress,
      });

      // 记录映射
      mappings.push({
        actionIndex: i,
        joinedValueIndex,
        conversionIndex: conversionArray.length - 1,
      });

      joinedValueIndex++;
    }

    return { conversions: conversionArray, conversionMappings: mappings };
  }, [tokenAddress, extensionActionIds, contractInfos, joinedValuesData]);

  // 步骤5.6: 批量执行代币转换
  const {
    results: conversionResults,
    isPending: isPendingConversion,
    error: errorConversion,
  } = useConvertTokenAmounts({ conversions });

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
      !actionInfos ||
      actionInfos.length === 0 ||
      !contractInfos
    ) {
      return [];
    }

    const actions: JoinedAction[] = [];
    let joinedValueIndex = 0;

    for (let i = 0; i < extensionActionIds.length; i++) {
      const actionInfo = actionInfos[i];
      if (!actionInfo) continue;

      const actionId = extensionActionIds[i];
      const contractInfo = contractInfos[i];

      // 获取用户参与代币数（原始值和转换值）
      let joinedAmountOfAccount = BigInt(0);
      let convertedJoinedAmountOfAccount: bigint | undefined;

      if (contractInfo?.isExtension && contractInfo.extension) {
        const joinedValueResult = joinedValuesData?.[joinedValueIndex];
        if (joinedValueResult?.result != null) {
          joinedAmountOfAccount = BigInt(joinedValueResult.result.toString());

          // 查找转换结果
          const mapping = conversionMappings.find((m) => m.actionIndex === i);

          if (mapping !== undefined) {
            // 需要转换
            const conversionResult = conversionResults?.[mapping.conversionIndex];
            if (conversionResult?.isSuccess) {
              convertedJoinedAmountOfAccount = conversionResult.convertedAmount;
            } else if (!isPendingConversion) {
              // 转换失败，使用原始金额并记录警告
              console.warn(
                `⚠️ ActionId ${actionId} 的 joinedAmountOfAccount 代币转换失败，使用原始金额. ` +
                  `Error: ${conversionResult?.error}`,
              );
              convertedJoinedAmountOfAccount = joinedAmountOfAccount;
            }
            // else: 转换中，保持 undefined
          } else {
            // 不需要转换（相同代币或无转换数据）
            convertedJoinedAmountOfAccount = joinedAmountOfAccount;
          }
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
        joinedAmountOfAccount: convertedJoinedAmountOfAccount ?? joinedAmountOfAccount,
      });
    }

    return actions;
  }, [
    extensionActionIds,
    actionInfos,
    contractInfos,
    joinedValuesData,
    votesMap,
    conversionMappings,
    conversionResults,
    isPendingConversion,
  ]);

  // 计算总的加载状态
  // 如果没有扩展行动，则不需要等待其他查询完成
  // 注意：对于转换，如果所有转换结果都已成功（isSuccess: true），即使 isPendingConversion 为 true，也不应该阻塞整体状态
  const allConversionsSuccess = useMemo(() => {
    if (conversions.length === 0) return true;
    if (!conversionResults || conversionResults.length === 0) return false;
    return conversionResults.every((result) => result.isSuccess && !result.isPending);
  }, [conversions.length, conversionResults]);

  const isPending = !hasExtensionActions
    ? isPendingExtensionIds || isPendingCurrentRound
    : isPendingExtensionIds ||
      isPendingCurrentRound ||
      isPendingContractInfo ||
      isPendingActionInfos ||
      (mergedDynamicContracts.length > 0 && isPendingMergedDynamic) ||
      (conversions.length > 0 && isPendingConversion && !allConversionsSuccess);

  // 合并错误信息
  const error =
    errorExtensionIds ||
    errorCurrentRound ||
    errorContractInfo ||
    errorActionInfos ||
    errorMergedDynamic ||
    errorConversion;

  return {
    joinedExtensionActions: joinedExtensionActions || [], // 确保总是返回数组
    extensionContractInfos: contractInfos || [], // 返回扩展合约信息
    isPending,
    error,
  };
};
