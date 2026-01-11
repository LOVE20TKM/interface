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

  // Fetch groups that need verification
  const {
    groups,
    isPending: isPendingGroups,
    error: groupsError,
  } = useMyGroupIdsNeedVerifiedByRound({
    account: account as `0x${string}`,
    round: verifyRound,
  });

  // Extract unique actionIds and groupIds
  const actionIds = useMemo(() => {
    const ids = new Set<bigint>();
    groups.forEach((g) => ids.add(g.actionId));
    return Array.from(ids);
  }, [groups]);

  const groupIds = useMemo(() => {
    const ids = new Set<bigint>();
    groups.forEach((g) => ids.add(g.groupId));
    return Array.from(ids);
  }, [groups]);

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

  // Group data by actionId
  const groupedData = useMemo<GroupedData[]>(() => {
    if (!groups || groups.length === 0 || !actionInfos) return [];

    const grouped = new Map<string, GroupedData>();

    groups.forEach((group) => {
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
      });
    });

    // Sort by actionId descending
    return Array.from(grouped.values()).sort((a, b) => (a.actionId > b.actionId ? -1 : 1));
  }, [groups, actionInfos, groupNameMap]);

  // Error handling
  const { handleError } = useContractError();
  useEffect(() => {
    if (groupsError) handleError(groupsError);
    if (actionsError) handleError(actionsError);
    if (groupNamesError) handleError(groupNamesError);
  }, [groupsError, actionsError, groupNamesError, handleError]);

  // Handle group click
  const handleGroupClick = (group: GroupedData['groups'][0], actionId: bigint) => {
    if (!token?.symbol) return;

    if (group.isVerified) {
      // Navigate to results page
      router.push(
        `/extension/group/?groupId=${group.groupId}&actionId=${actionId}&symbol=${token.symbol}&tab=scores&round=${verifyRound}`,
      );
    } else {
      // Navigate to verification page
      router.push(`/extension/group_op/?actionId=${actionId}&groupId=${group.groupId}&op=verify`);
    }
  };

  const isPending = isPendingGroups || isPendingActions || isPendingGroupNames;

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
            <LeftTitle title="需要验证的链群" />
            <div className="text-sm mt-4 text-greyscale-500 text-center">没有要验证的链群，或行动未投票</div>
          </div>
        ) : (
          <div>
            <LeftTitle title="需要验证的链群" />
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
                          {group.isVerified ? (
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
