/**
 * 复合 Hook: 批量获取链群名称
 */

import { useReadContracts } from 'wagmi';
import { LOVE20GroupAbi } from '@/src/abis/LOVE20Group';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP as `0x${string}`;

export interface GroupNameResult {
  groupId: bigint;
  groupName: string | undefined;
}

/**
 * 根据 groupId 数组批量获取 groupName
 * @param groupIds - groupId 数组（tokenId）
 * @param enabled - 是否启用查询，默认为 true
 * @returns 包含 groupNames（带 groupId 的对象数组）、isPending、error
 */
export function useGroupNames(groupIds: bigint[] | undefined, enabled: boolean = true) {
  // 检查是否有有效的 groupIds
  const hasGroupIds = !!groupIds && groupIds.length > 0;

  // 构建批量查询合约配置
  const contracts =
    hasGroupIds
      ? groupIds.map((groupId) => ({
          address: CONTRACT_ADDRESS,
          abi: LOVE20GroupAbi,
          functionName: 'groupNameOf',
          args: [groupId],
        }))
      : [];

  // 批量查询
  const {
    data: groupNamesData,
    isPending,
    error,
  } = useReadContracts({
    contracts,
    query: {
      enabled: hasGroupIds && enabled,
    },
  });

  // 组合结果，保持 groupId 和 groupName 的对应关系
  const groupNames: GroupNameResult[] = hasGroupIds
    ? groupIds.map((groupId, index) => ({
        groupId,
        groupName: groupNamesData?.[index]?.result as string | undefined,
      }))
    : [];

  // 提供一个便捷的 Map 方法用于快速查找
  const groupNameMap = new Map<bigint, string | undefined>(
    groupNames.map((item) => [item.groupId, item.groupName]),
  );

  return {
    groupNames, // 数组形式，保持原始顺序
    groupNameMap, // Map 形式，方便快速查找
    isPending: hasGroupIds ? isPending : false,
    error: hasGroupIds ? error : undefined,
  };
}

