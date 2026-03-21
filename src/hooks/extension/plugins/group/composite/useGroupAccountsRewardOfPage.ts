// hooks/extension/plugins/group/composite/useGroupAccountsRewardOfPage.ts
// 分页获取某轮某群的账户奖励数据

import { useMemo } from 'react';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { ExtensionGroupActionAbi } from '@/src/abis/ExtensionGroupAction';
import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { GroupVerifyAbi } from '@/src/abis/GroupVerify';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { AccountRewardRecord } from './useGroupAccountsRewardOfRound';

const GROUP_VERIFY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY as `0x${string}`;
const GROUP_JOIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;

export interface UseGroupAccountsRewardOfPageParams {
  extensionAddress: `0x${string}` | undefined;
  round: bigint | undefined;
  groupId: bigint | undefined;
  startIndex: bigint;
  endIndex: bigint;
  enabled: boolean;
}

export interface UseGroupAccountsRewardOfPageResult {
  pageRecords: AccountRewardRecord[];
  isPending: boolean;
  error: any;
}

/**
 * Hook: 分页获取某轮某群的账户奖励数据
 *
 * 两阶段查询：
 * 1. 批量调用 accountsByGroupIdAtIndex 获取页内账户地址
 * 2. 拿到地址后，批量调用每个账户的 5 个数据
 */
export const useGroupAccountsRewardOfPage = ({
  extensionAddress,
  round,
  groupId,
  startIndex,
  endIndex,
  enabled,
}: UseGroupAccountsRewardOfPageParams): UseGroupAccountsRewardOfPageResult => {
  // 阶段1：批量获取账户地址
  const addressContracts = useMemo(() => {
    if (!enabled || !extensionAddress || round === undefined || groupId === undefined) return [];
    if (endIndex <= startIndex) return [];

    const contracts = [];
    for (let i = startIndex; i < endIndex; i++) {
      contracts.push({
        address: GROUP_JOIN_CONTRACT_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'accountsByGroupIdAtIndex',
        args: [extensionAddress, round, groupId, i],
      });
    }
    return contracts;
  }, [extensionAddress, round, groupId, startIndex, endIndex, enabled]);

  const {
    data: addressData,
    isPending: isAddressPending,
    error: addressError,
  } = useUniversalReadContracts({
    contracts: addressContracts as any,
    query: {
      enabled: enabled && addressContracts.length > 0,
    },
  });

  // 解析地址
  const accounts = useMemo(() => {
    if (!addressData) return [];
    return addressData.map((v) => v.result as `0x${string}`).filter((addr) => !!addr);
  }, [addressData]);

  // 阶段2：批量获取每个账户的奖励数据
  const rewardContracts = useMemo(() => {
    if (!extensionAddress || round === undefined || accounts.length === 0) return [];

    const contracts = [];
    for (const account of accounts) {
      // 激励
      contracts.push({
        address: extensionAddress,
        abi: ExtensionGroupActionAbi,
        functionName: 'rewardByAccount',
        args: [round, account],
      });
      // 原始得分
      contracts.push({
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'originScoreByAccount',
        args: [extensionAddress, round, account],
      });
      // 最终得分
      contracts.push({
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'accountScore',
        args: [extensionAddress, round, account],
      });
      // 参与代币数
      contracts.push({
        address: GROUP_JOIN_CONTRACT_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'joinedAmountByAccount',
        args: [extensionAddress, round, account],
      });
      // 加入信息
      contracts.push({
        address: GROUP_JOIN_CONTRACT_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'joinInfo',
        args: [extensionAddress, round, account],
      });
    }
    return contracts;
  }, [extensionAddress, round, accounts]);

  const {
    data: rewardData,
    isPending: isRewardPending,
    error: rewardError,
  } = useUniversalReadContracts({
    contracts: rewardContracts as any,
    query: {
      enabled: accounts.length > 0 && rewardContracts.length > 0,
    },
  });

  // 解析数据
  const pageRecords = useMemo(() => {
    if (!rewardData || accounts.length === 0) return [];

    const result: AccountRewardRecord[] = [];
    const recordSize = 5;

    for (let i = 0; i < accounts.length; i++) {
      const baseIndex = i * recordSize;
      const rewardResult = rewardData[baseIndex]?.result as [bigint, bigint, boolean] | undefined;
      const originScoreResult = rewardData[baseIndex + 1]?.result;
      const finalScoreResult = rewardData[baseIndex + 2]?.result;
      const joinedAmountResult = rewardData[baseIndex + 3]?.result;
      const joinInfoResult = rewardData[baseIndex + 4]?.result as [bigint, bigint, bigint, `0x${string}`] | undefined;

      result.push({
        account: accounts[i],
        mintReward: rewardResult ? safeToBigInt(rewardResult[0]) : BigInt(0),
        burnReward: rewardResult ? safeToBigInt(rewardResult[1]) : BigInt(0),
        claimed: rewardResult ? rewardResult[2] : false,
        originScore: safeToBigInt(originScoreResult),
        finalScore: safeToBigInt(finalScoreResult),
        joinedAmount: safeToBigInt(joinedAmountResult),
        joinedRound: joinInfoResult ? safeToBigInt(joinInfoResult[0]) : BigInt(0),
        trialProvider: joinInfoResult ? (joinInfoResult[3] as unknown as `0x${string}`) : undefined,
      });
    }

    return result;
  }, [rewardData, accounts]);

  // isPending: 阶段1加载中，或阶段1完成有地址但阶段2还在加载
  const isPending = useMemo(() => {
    if (!enabled) return false;
    if (isAddressPending) return true;
    if (accounts.length === 0) return false;
    return isRewardPending;
  }, [enabled, isAddressPending, accounts.length, isRewardPending]);

  return {
    pageRecords,
    isPending,
    error: addressError || rewardError,
  };
};
