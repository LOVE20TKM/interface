'use client';
import React, { useContext, useMemo, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/router';
import { ChevronRight } from 'lucide-react';

// Contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// Hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
import { useMyGroupIdsNeedVerifiedByRound } from '@/src/hooks/extension/plugins/group/composite/useMyGroupIdsNeedVerifiedByRound';
import { useActionBaseInfosByIdsWithCache } from '@/src/hooks/composite/useActionBaseInfosByIdsWithCache';
import { useGroupNamesWithCache } from '@/src/hooks/extension/base/composite/useGroupNamesWithCache';
import { useActionsWithActiveGroupsByOwner } from '@/src/hooks/extension/plugins/group-service/composite/useActionsWithActiveGroupsByOwner';
import { useContractError } from '@/src/errors/useContractError';


// Components
import Header from '@/src/components/Header';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import RoundLite from '@/src/components/Common/RoundLite';

interface GroupedData {
  actionId: bigint;
  actionTitle: string;
  groups: {
    groupId: bigint;
    groupName: string | undefined;
    extensionAddress: `0x${string}`;
    isVerified: boolean;
    needToVerify: boolean;
    hasVoted: boolean; // 是否投过票
  }[];
}

const MyVerifyingGroupsPage: React.FC = () => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // Get verify round (current round - 2)
  const { currentRound } = useCurrentRound();
  const verifyRound = useMemo(() => {
    if (!currentRound || currentRound < BigInt(2)) return BigInt(0);
    return currentRound - BigInt(2);
  }, [currentRound]);

  // 计算加入轮次（验证轮次 + 1）
  const joinRound = useMemo(() => {
    if (!verifyRound) return undefined;
    return verifyRound + BigInt(1);
  }, [verifyRound]);

  // Fetch groups that need verification (VotedGroups - 只包含投过票的)
  const {
    groups: votedGroups,
    isPending: isPendingGroups,
    error: groupsError,
  } = useMyGroupIdsNeedVerifiedByRound({
    account: account as `0x${string}`,
    round: verifyRound,
  });

  // 直接使用 token?.address 作为 groupActionTokenAddress
  const groupActionTokenAddress = token?.address as `0x${string}` | undefined;

  // 调用 useActionsWithActiveGroupsByOwner (AllGroups - 包含所有行动和链群)
  const {
    actionsWithGroups: allGroups,
    isPending: isPendingAllGroups,
    error: allGroupsError,
  } = useActionsWithActiveGroupsByOwner({
    groupActionTokenAddress,
    account: account as `0x${string}`,
    round: joinRound,
  });

  // 将 VotedGroups 转换为以 (actionId, groupId) 为key的Map，用于快速查找
  const votedGroupsMap = useMemo(() => {
    const map = new Map<string, (typeof votedGroups)[0]>();
    votedGroups.forEach((g) => {
      const key = `${g.actionId}_${g.groupId}`;
      map.set(key, g);
    });
    return map;
  }, [votedGroups]);

  // 合并 VotedGroups 和 AllGroups，提取所有唯一的 actionIds 和 groupIds
  const allMergedActionIds = useMemo(() => {
    const ids = new Set<bigint>();
    // 从 VotedGroups 添加
    votedGroups.forEach((g) => ids.add(g.actionId));
    // 从 AllGroups 添加
    allGroups.forEach((action) => ids.add(action.actionId));
    return Array.from(ids);
  }, [votedGroups, allGroups]);

  const allMergedGroupIds = useMemo(() => {
    const ids = new Set<bigint>();
    // 从 VotedGroups 添加
    votedGroups.forEach((g) => ids.add(g.groupId));
    // 从 AllGroups 添加
    allGroups.forEach((action) => {
      action.groups.forEach((group) => ids.add(group.groupId));
    });
    return Array.from(ids);
  }, [votedGroups, allGroups]);

  // 使用合并后的 actionIds 和 groupIds
  const actionIds = allMergedActionIds;
  const groupIds = allMergedGroupIds;

  // Fetch action titles
  const {
    actionInfos,
    isPending: isPendingActions,
    error: actionsError,
  } = useActionBaseInfosByIdsWithCache({
    tokenAddress: token?.address as `0x${string}`,
    actionIds,
  });

  // Fetch group names
  const {
    groupNameMap,
    isPending: isPendingGroupNames,
    error: groupNamesError,
  } = useGroupNamesWithCache({
    groupIds,
  });

  // 合并 VotedGroups 和 AllGroups 的数据，按 actionId 分组
  const groupedData = useMemo<GroupedData[]>(() => {
    if (!actionInfos) return [];

    const grouped = new Map<string, GroupedData>();

    // 先处理 VotedGroups（投过票的）
    votedGroups.forEach((group) => {
      const actionIdStr = group.actionId.toString();
      if (!grouped.has(actionIdStr)) {
        const actionInfo = actionInfos.find((a) => a.head.id === group.actionId);
        grouped.set(actionIdStr, {
          actionId: group.actionId,
          actionTitle: actionInfo?.body?.title || `行动 #${group.actionId}`,
          groups: [],
        });
      }

      const groupedItem = grouped.get(actionIdStr)!;
      groupedItem.groups.push({
        groupId: group.groupId,
        groupName: groupNameMap?.get(group.groupId),
        extensionAddress: group.extensionAddress,
        isVerified: group.isVerified,
        needToVerify: group.needToVerify,
        hasVoted: true, // 来自 VotedGroups，已投票
      });
    });

    // 再处理 AllGroups（所有行动和链群），添加 VotedGroups 中没有的项
    allGroups.forEach((action) => {
      const actionIdStr = action.actionId.toString();
      if (!grouped.has(actionIdStr)) {
        const actionInfo = actionInfos.find((a) => a.head.id === action.actionId);
        grouped.set(actionIdStr, {
          actionId: action.actionId,
          actionTitle: actionInfo?.body?.title || action.actionTitle || `行动 #${action.actionId}`,
          groups: [],
        });
      }

      const groupedItem = grouped.get(actionIdStr)!;
      action.groups.forEach((groupB) => {
        const key = `${action.actionId}_${groupB.groupId}`;
        // 检查是否已经在 VotedGroups 中存在
        const existsInVoted = votedGroupsMap.has(key);

        if (!existsInVoted) {
          // AllGroups 中存在但 VotedGroups 中不存在，标记为未投票
          groupedItem.groups.push({
            groupId: groupB.groupId,
            groupName: groupNameMap?.get(groupB.groupId) || groupB.groupName,
            extensionAddress: action.extensionAddress,
            isVerified: false, // 未投票的项，默认未验证
            needToVerify: false, // 未投票的项，不需要验证
            hasVoted: false, // 来自 AllGroups 但不在 VotedGroups 中，未投票
          });
        }
      });
    });

    // Sort by actionId descending
    return Array.from(grouped.values()).sort((a, b) => (a.actionId > b.actionId ? -1 : 1));
  }, [votedGroups, allGroups, votedGroupsMap, actionInfos, groupNameMap]);

  // Error handling
  const { handleError } = useContractError();
  useEffect(() => {
    if (groupsError) handleError(groupsError);
    if (actionsError) handleError(actionsError);
    if (groupNamesError) handleError(groupNamesError);
    if (allGroupsError) handleError(allGroupsError);
  }, [groupsError, actionsError, groupNamesError, allGroupsError, handleError]);

  // Handle group click
  const handleGroupClick = (group: GroupedData['groups'][0], actionId: bigint) => {
    if (!token?.symbol) return;

    if (group.isVerified || !group.hasVoted) {
      // Navigate to results page (已验证或未投票都跳转到结果页)
      router.push(
        `/extension/group/?groupId=${group.groupId}&actionId=${actionId}&symbol=${token.symbol}&tab=scores&round=${verifyRound}`,
      );
    } else {
      // Navigate to verification page
      router.push(`/extension/group_op/?actionId=${actionId}&groupId=${group.groupId}&op=verify`);
    }
  };

  const isPending = isPendingGroups || isPendingActions || isPendingGroupNames || isPendingAllGroups;

  return (
    <>
      <Header title="我需验证的链群" showBackButton={true} />
      <main className="flex-grow p-4">
        {!account ? (
          <div className="text-center text-sm text-greyscale-500 p-4 mt-4">请先连接钱包</div>
        ) : isPending ? (
          <div className="flex justify-center items-center p-8">
            <LoadingIcon />
          </div>
        ) : groupedData.length === 0 ? (
          <div className="py-4">
            <LeftTitle title="我的链群" />
            <div className="text-sm mt-4 text-greyscale-500 text-center">没有已激活的链群</div>
          </div>
        ) : (
          <div>
            <LeftTitle title="我的链群" />
            <RoundLite currentRound={verifyRound} roundType="verify" />
            {groupedData.map((action) => (
              <div key={action.actionId.toString()} className="border rounded-lg p-3 mt-4">
                {/* Action Header */}
                <div className="flex items-baseline mb-3">
                  <span className="text-greyscale-400 text-sm">No.</span>
                  <span className="text-secondary text-xl font-bold mr-2">{action.actionId.toString()}</span>
                  <span className="font-bold text-greyscale-800">{action.actionTitle}</span>
                </div>

                {/* Groups List */}
                <div className="space-y-0">
                  {action.groups.map((group, idx) => (
                    <div
                      key={group.groupId.toString()}
                      className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer ${
                        idx > 0 ? 'border-t' : ''
                      }`}
                      onClick={() => handleGroupClick(group, action.actionId)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">#</span>
                          <span className="text-secondary text-base font-semibold">{group.groupId.toString()}</span>
                          <span className="text-gray-800">{group.groupName || `链群 #${group.groupId}`}</span>
                        </div>
                        <div className="mt-1">
                          {!group.hasVoted ? (
                            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">未投票</span>
                          ) : group.isVerified ? (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">已验证</span>
                          ) : group.needToVerify ? (
                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">待验证</span>
                          ) : (
                            <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">无需验证</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default MyVerifyingGroupsPage;
