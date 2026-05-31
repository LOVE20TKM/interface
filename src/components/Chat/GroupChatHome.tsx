'use client';

import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';

import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { TokenActionGovManagerAbi } from '@/src/abis/TokenActionGovManager';
import { TokenActionMainManagerAbi } from '@/src/abis/TokenActionMainManager';
import AlertBox from '@/src/components/Common/AlertBox';
import Header from '@/src/components/Header';
import { isGroupChatEnabled, useGroupChatActivationStatusMap } from '@/src/hooks/contracts/useGroupChat';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
import { useJoinedActions, useAccountVotingHistory } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import {
  GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER_ADDRESS,
  GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER_ADDRESS,
  isTokenActionGovChatManagerEnabled,
  isTokenActionMainChatManagerEnabled,
  useTokenGovChatGroupIdOfToken,
  useTokenMainChatGroupIdOfToken,
} from '@/src/hooks/contracts/useGroupChatManagers';
import { useGroupChatInboxData } from '@/src/hooks/composite/useGroupChatData';
import { useIsGovernor } from '@/src/hooks/composite/useIsGovernor';
import { useMyGroups } from '@/src/hooks/extension/base/composite/useMyGroups';
import { useMyJoinedExtensionActions } from '@/src/hooks/extension/base/composite/useMyJoinedExtensionActions';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useRegisterGroupChatGroups, useRegisterWatchedGroups } from '@/src/contexts/GroupChatSyncContext';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { cn } from '@/lib/utils';
import { InboxPanel } from './InboxPanel';
import styles from './ChatPage.module.css';
import {
  PINNED_GROUPS_CHANGED_EVENT,
  PINNED_GROUPS_STORAGE_KEY,
  READ_CURSORS_CHANGED_EVENT,
  READ_CURSORS_STORAGE_KEY,
} from './chatConstants';
import {
  DEFAULT_MESSAGE_PREFERENCES,
  type MessagePreferences,
  readCachedGroupSets,
  readJsonArrayStorage,
  readMessagePreferences,
  readRecordStorage,
  writeCachedGroupSets,
  writeMessagePreferences,
} from './chatStorage';
import {
  buildChatActivationHref,
  safeBigIntFromString,
} from './chatUtils';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const GROUP_JOIN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}` | undefined;

function uniqueGroupIds(values: readonly (bigint | undefined)[]) {
  const seen = new Set<string>();
  return values.filter((value): value is bigint => {
    if (!value || value <= BigInt(0)) return false;
    const key = value.toString();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resultAt(data: readonly { status?: string; result?: unknown }[] | undefined, index: number) {
  const item = data?.[index];
  return item?.status === 'success' ? item.result : undefined;
}

function groupIdsToStrings(groupIds: readonly bigint[]) {
  return groupIds.map((groupId) => groupId.toString());
}

function sameStringArray(left: readonly string[], right: readonly string[]) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

const useClientLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function GroupChatHome() {
  const router = useRouter();
  const { address: account, isConnected } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const accountAddress = account as `0x${string}` | undefined;
  const tokenAddress = token?.address as `0x${string}` | undefined;
  const cachedGroupSetsKey = useMemo(() => {
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN || 'unknown-chain';
    return [
      chainId,
      accountAddress?.toLowerCase() || 'anonymous',
      tokenAddress?.toLowerCase() || 'no-token',
    ].join(':');
  }, [accountAddress, tokenAddress]);
  const [pinnedGroupIds, setPinnedGroupIds] = useState<string[]>([]);
  const [cachedMyChainGroupIds, setCachedMyChainGroupIds] = useState<string[]>([]);
  const [cachedRecommendedGroupIds, setCachedRecommendedGroupIds] = useState<string[]>([]);
  const [readCursors, setReadCursors] = useState<Record<string, string>>({});
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [messagePreferences, setMessagePreferences] = useState<MessagePreferences>(DEFAULT_MESSAGE_PREFERENCES);
  const showBannedMessages = messagePreferences.showBannedMessages;
  const showMessageTimes = messagePreferences.showMessageTimes;
  const { myGroups, isPending: isMyGroupsPending } = useMyGroups(accountAddress);
  const myChainGroupIds = useMemo(() => myGroups.map((group) => group.tokenId), [myGroups]);
  const { isGovernor } = useIsGovernor(accountAddress);
  const { groupId: tokenMainGroupId, isPending: isTokenMainGroupIdPending } = useTokenMainChatGroupIdOfToken(tokenAddress, !!tokenAddress);
  const { groupId: tokenGovGroupId, isPending: isTokenGovGroupIdPending } = useTokenGovChatGroupIdOfToken(tokenAddress, !!tokenAddress && isGovernor);
  const { currentRound } = useCurrentRound();
  const { joinedActions } = useJoinedActions(tokenAddress as `0x${string}`, accountAddress as `0x${string}`);
  const { joinedExtensionActions } = useMyJoinedExtensionActions({
    tokenAddress,
    account: accountAddress,
    currentRound,
  });
  const joinedActionIds = useMemo(
    () =>
      uniqueGroupIds(
        [...joinedActions, ...joinedExtensionActions].map((item) => item.action?.head?.id),
      ),
    [joinedActions, joinedExtensionActions],
  );
  const recentVoteRange = useMemo(() => {
    if (!currentRound || currentRound <= BigInt(0)) return { startRound: BigInt(0), endRound: BigInt(0) };
    const startRound = currentRound > BigInt(2) ? currentRound - BigInt(2) : BigInt(1);
    return { startRound, endRound: currentRound };
  }, [currentRound]);
  const { votingHistory } = useAccountVotingHistory(
    tokenAddress as `0x${string}`,
    accountAddress as `0x${string}`,
    recentVoteRange.startRound,
    recentVoteRange.endRound,
  );
  const recentVotedActionIds = useMemo(
    () =>
      uniqueGroupIds(
        (votingHistory?.accountActions || [])
          .filter((item) => safeToBigInt(item.myVoteCount) > BigInt(0))
          .map((item) => safeToBigInt(item.actionId)),
      ),
    [votingHistory?.accountActions],
  );
  const actionMainGroupContracts = useMemo(
    () =>
      joinedActionIds.map((actionId) => ({
        address: GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER_ADDRESS,
        abi: TokenActionMainManagerAbi,
        functionName: 'groupIdOfAction' as const,
        args: [tokenAddress || ZERO_ADDRESS, actionId],
      })),
    [joinedActionIds, tokenAddress],
  );
  const { data: actionMainGroupData, isPending: isActionMainGroupIdsPending } = useUniversalReadContracts({
    contracts: actionMainGroupContracts as any,
    query: {
      enabled: isTokenActionMainChatManagerEnabled && !!tokenAddress && actionMainGroupContracts.length > 0,
    },
  });
  const actionMainGroupIds = useMemo(
    () => uniqueGroupIds(joinedActionIds.map((_, index) => safeToBigInt(resultAt(actionMainGroupData as any, index)))),
    [actionMainGroupData, joinedActionIds],
  );
  const actionGovGroupContracts = useMemo(
    () =>
      recentVotedActionIds.map((actionId) => ({
        address: GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER_ADDRESS,
        abi: TokenActionGovManagerAbi,
        functionName: 'groupIdOfAction' as const,
        args: [tokenAddress || ZERO_ADDRESS, actionId],
      })),
    [recentVotedActionIds, tokenAddress],
  );
  const { data: actionGovGroupData, isPending: isActionGovGroupIdsPending } = useUniversalReadContracts({
    contracts: actionGovGroupContracts as any,
    query: {
      enabled: isTokenActionGovChatManagerEnabled && !!tokenAddress && actionGovGroupContracts.length > 0,
    },
  });
  const actionGovGroupIds = useMemo(
    () => uniqueGroupIds(recentVotedActionIds.map((_, index) => safeToBigInt(resultAt(actionGovGroupData as any, index)))),
    [actionGovGroupData, recentVotedActionIds],
  );
  const groupJoinGroupIdsContracts = useMemo(
    () => [{
      address: GROUP_JOIN_ADDRESS || ZERO_ADDRESS,
      abi: GroupJoinAbi,
      functionName: 'gGroupIdsByTokenAddressByAccount' as const,
      args: [tokenAddress || ZERO_ADDRESS, accountAddress || ZERO_ADDRESS],
    }],
    [accountAddress, tokenAddress],
  );
  const { data: groupJoinGroupIdsData, isPending: isGroupJoinGroupIdsPending } = useUniversalReadContracts({
    contracts: groupJoinGroupIdsContracts as any,
    query: {
      enabled:
        !!GROUP_JOIN_ADDRESS &&
        !!tokenAddress &&
        !!accountAddress &&
        isGroupChatEnabled,
    },
  });
  const groupJoinCandidateGroupIds = useMemo(
    () =>
      uniqueGroupIds(Array.isArray(resultAt(groupJoinGroupIdsData as any, 0))
        ? (resultAt(groupJoinGroupIdsData as any, 0) as unknown[]).map((item) => safeToBigInt(item))
        : []),
    [groupJoinGroupIdsData],
  );
  const {
    activationStatusMap: groupJoinActivationStatusMap,
    isPending: isGroupJoinActivationStatusPending,
  } = useGroupChatActivationStatusMap(
    groupJoinCandidateGroupIds,
    groupJoinCandidateGroupIds.length > 0,
  );
  const groupJoinRecommendedGroupIds = useMemo(
    () =>
      groupJoinCandidateGroupIds.filter(
        (groupId) => groupJoinActivationStatusMap.get(groupId.toString()) === true,
      ),
    [groupJoinActivationStatusMap, groupJoinCandidateGroupIds],
  );
  const pinnedPriorityGroupIds = useMemo(
    () => uniqueGroupIds(pinnedGroupIds.map((groupId) => safeBigIntFromString(groupId))),
    [pinnedGroupIds],
  );
  const cachedMyChainPriorityGroupIds = useMemo(
    () => uniqueGroupIds(cachedMyChainGroupIds.map((groupId) => safeBigIntFromString(groupId))),
    [cachedMyChainGroupIds],
  );
  const cachedRecommendedPriorityGroupIds = useMemo(
    () => uniqueGroupIds(cachedRecommendedGroupIds.map((groupId) => safeBigIntFromString(groupId))),
    [cachedRecommendedGroupIds],
  );
  const lastDisplayGroupSetsRef = useRef<{
    key: string;
    myChainGroupIds: bigint[];
    recommendedGroupIds: bigint[];
  }>({
    key: cachedGroupSetsKey,
    myChainGroupIds: [],
    recommendedGroupIds: [],
  });
  const displayedMyChainGroupIds = useMemo(
    () => {
      if (myChainGroupIds.length > 0) return myChainGroupIds;
      if (cachedMyChainPriorityGroupIds.length > 0) return cachedMyChainPriorityGroupIds;
      const lastResolved = lastDisplayGroupSetsRef.current;
      return lastResolved.key === cachedGroupSetsKey ? lastResolved.myChainGroupIds : [];
    },
    [cachedGroupSetsKey, cachedMyChainPriorityGroupIds, myChainGroupIds],
  );
  const recommendedGroupIds = useMemo(
    () =>
      uniqueGroupIds([
        tokenMainGroupId,
        ...actionMainGroupIds,
        isGovernor ? tokenGovGroupId : undefined,
        ...actionGovGroupIds,
        ...groupJoinRecommendedGroupIds,
      ]),
    [
      actionGovGroupIds,
      actionMainGroupIds,
      groupJoinRecommendedGroupIds,
      isGovernor,
      tokenGovGroupId,
      tokenMainGroupId,
    ],
  );
  const isRecommendedGroupIdsPending =
    isTokenMainGroupIdPending ||
    isTokenGovGroupIdPending ||
    isActionMainGroupIdsPending ||
    isActionGovGroupIdsPending ||
    isGroupJoinGroupIdsPending ||
    isGroupJoinActivationStatusPending;
  const displayedRecommendedGroupIds = useMemo(
    () => {
      if (recommendedGroupIds.length > 0) return recommendedGroupIds;
      if (cachedRecommendedPriorityGroupIds.length > 0) return cachedRecommendedPriorityGroupIds;
      const lastResolved = lastDisplayGroupSetsRef.current;
      return lastResolved.key === cachedGroupSetsKey ? lastResolved.recommendedGroupIds : [];
    },
    [cachedGroupSetsKey, cachedRecommendedPriorityGroupIds, recommendedGroupIds],
  );
  const inboxPriorityGroupIds = useMemo(
    () =>
      uniqueGroupIds([
        ...pinnedPriorityGroupIds,
        ...cachedMyChainPriorityGroupIds,
        ...cachedRecommendedPriorityGroupIds,
        ...myChainGroupIds,
        ...displayedMyChainGroupIds,
        ...recommendedGroupIds,
        ...displayedRecommendedGroupIds,
      ]),
    [
      cachedMyChainPriorityGroupIds,
      cachedRecommendedPriorityGroupIds,
      displayedMyChainGroupIds,
      displayedRecommendedGroupIds,
      myChainGroupIds,
      pinnedPriorityGroupIds,
      recommendedGroupIds,
    ],
  );
  const inbox = useGroupChatInboxData(token, accountAddress, 50, inboxPriorityGroupIds);
  const lastResolvedInboxItemsRef = useRef<{ key: string; items: typeof inbox.items }>({
    key: cachedGroupSetsKey,
    items: [],
  });
  const hasActivatedInboxItems = useMemo(
    () => inbox.items.some((item) => item.info?.activated === true),
    [inbox.items],
  );
  const displayedInboxItems = useMemo(() => {
    if (hasActivatedInboxItems || !inbox.isPending) return inbox.items;
    const lastResolved = lastResolvedInboxItemsRef.current;
    return lastResolved.key === cachedGroupSetsKey ? lastResolved.items : [];
  }, [cachedGroupSetsKey, hasActivatedInboxItems, inbox.isPending, inbox.items]);
  useEffect(() => {
    if (!hasActivatedInboxItems && inbox.isPending) return;
    lastResolvedInboxItemsRef.current = {
      key: cachedGroupSetsKey,
      items: inbox.items,
    };
  }, [cachedGroupSetsKey, hasActivatedInboxItems, inbox.isPending, inbox.items]);
  const visibleInboxGroupIds = useMemo(() => displayedInboxItems.map((item) => item.groupId), [displayedInboxItems]);
  useRegisterGroupChatGroups({
    groupIds: inboxPriorityGroupIds,
    source: 'chat-cached-groups',
    scope: 'background',
    frequency: 'low',
  });
  useRegisterWatchedGroups(visibleInboxGroupIds, 'inbox-visible');

  useClientLayoutEffect(() => {
    const nextPinnedGroupIds = readJsonArrayStorage(PINNED_GROUPS_STORAGE_KEY);
    const cachedGroupSets = readCachedGroupSets(cachedGroupSetsKey);
    setPinnedGroupIds(nextPinnedGroupIds);
    setCachedMyChainGroupIds(cachedGroupSets?.myChainGroupIds || []);
    setCachedRecommendedGroupIds(cachedGroupSets?.recommendedGroupIds || []);
    setReadCursors(readRecordStorage(READ_CURSORS_STORAGE_KEY));
    setMessagePreferences(readMessagePreferences());
  }, [cachedGroupSetsKey]);

  useEffect(() => {
    const refreshReadCursors = () => {
      setReadCursors(readRecordStorage(READ_CURSORS_STORAGE_KEY));
    };
    window.addEventListener(READ_CURSORS_CHANGED_EVENT, refreshReadCursors);
    window.addEventListener('storage', refreshReadCursors);
    window.addEventListener('focus', refreshReadCursors);
    return () => {
      window.removeEventListener(READ_CURSORS_CHANGED_EVENT, refreshReadCursors);
      window.removeEventListener('storage', refreshReadCursors);
      window.removeEventListener('focus', refreshReadCursors);
    };
  }, []);

  useEffect(() => {
    if (myChainGroupIds.length > 0 || recommendedGroupIds.length > 0) {
      lastDisplayGroupSetsRef.current = {
        key: cachedGroupSetsKey,
        myChainGroupIds: myChainGroupIds.length > 0
          ? myChainGroupIds
          : lastDisplayGroupSetsRef.current.myChainGroupIds,
        recommendedGroupIds: recommendedGroupIds.length > 0
          ? recommendedGroupIds
          : lastDisplayGroupSetsRef.current.recommendedGroupIds,
      };
    }
  }, [cachedGroupSetsKey, myChainGroupIds, recommendedGroupIds]);

  useEffect(() => {
    if (isMyGroupsPending || isRecommendedGroupIdsPending) return;

    const nextMyChainGroupIds = groupIdsToStrings(myChainGroupIds);
    const nextRecommendedGroupIds = groupIdsToStrings(recommendedGroupIds);
    const changed =
      !sameStringArray(cachedMyChainGroupIds, nextMyChainGroupIds) ||
      !sameStringArray(cachedRecommendedGroupIds, nextRecommendedGroupIds);
    if (!changed) return;

    setCachedMyChainGroupIds(nextMyChainGroupIds);
    setCachedRecommendedGroupIds(nextRecommendedGroupIds);
    writeCachedGroupSets(cachedGroupSetsKey, {
      pinnedGroupIds,
      myChainGroupIds: nextMyChainGroupIds,
      recommendedGroupIds: nextRecommendedGroupIds,
    });
  }, [
    cachedGroupSetsKey,
    cachedMyChainGroupIds,
    cachedRecommendedGroupIds,
    isMyGroupsPending,
    isRecommendedGroupIdsPending,
    myChainGroupIds,
    pinnedGroupIds,
    recommendedGroupIds,
  ]);

  const onOpenActivate = useCallback(() => {
    router.push(buildChatActivationHref(token?.symbol));
  }, [router, token?.symbol]);

  const togglePinnedGroup = useCallback((groupId: bigint) => {
    const key = groupId.toString();
    setPinnedGroupIds((prev) => {
      const next = prev.includes(key) ? prev.filter((item) => item !== key) : [key, ...prev];
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(PINNED_GROUPS_STORAGE_KEY, JSON.stringify(next));
        writeCachedGroupSets(cachedGroupSetsKey, {
          pinnedGroupIds: next,
          myChainGroupIds: cachedMyChainGroupIds,
          recommendedGroupIds: cachedRecommendedGroupIds,
        });
        window.dispatchEvent(new Event(PINNED_GROUPS_CHANGED_EVENT));
      }
      return next;
    });
  }, [cachedGroupSetsKey, cachedMyChainGroupIds, cachedRecommendedGroupIds]);

  const updateMessagePreference = useCallback(<Key extends keyof MessagePreferences,>(
    key: Key,
    value: MessagePreferences[Key],
  ) => {
    setMessagePreferences((prev) => {
      const next = { ...prev, [key]: value };
      writeMessagePreferences(next);
      return next;
    });
  }, []);

  return (
    <>
      <Header title="群聊" showBackButton={false} />
      <main className={styles.chatPrototype} data-detail="false">
        <div className={styles.chatWorkspace} data-entry="love20-chat">
          <section className={styles.chatSurface}>
            <section className={cn('workspace-screen', 'inbox-screen')} aria-label="聊天工作区">
              {!isGroupChatEnabled && (
                <div className="mb-3">
                  <AlertBox type="warning" message="当前环境未配置 GroupChat 合约地址。" />
                </div>
              )}
              <InboxPanel
                items={displayedInboxItems}
                isPending={inbox.isPending}
                isConnected={isConnected}
                tokenSymbol={token?.symbol}
                pinnedGroupIds={pinnedGroupIds}
                myChainGroupIds={displayedMyChainGroupIds}
                recommendedGroupIds={displayedRecommendedGroupIds}
                readCursors={readCursors}
                preferencesOpen={preferencesOpen}
                showBannedMessages={showBannedMessages}
                showMessageTimes={showMessageTimes}
                onOpenActivate={onOpenActivate}
                onTogglePin={togglePinnedGroup}
                onTogglePreferences={() => setPreferencesOpen((value) => !value)}
                onSetShowBannedMessages={(value) => updateMessagePreference('showBannedMessages', value)}
                onSetShowMessageTimes={(value) => updateMessagePreference('showMessageTimes', value)}
              />
            </section>
          </section>
        </div>
      </main>
    </>
  );
}
