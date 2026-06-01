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
import { useGroupChatInboxData, type GroupChatListItem } from '@/src/hooks/composite/useGroupChatData';
import { useIsGovernor } from '@/src/hooks/composite/useIsGovernor';
import { useMyGroups } from '@/src/hooks/extension/base/composite/useMyGroups';
import { useMyJoinedExtensionActions } from '@/src/hooks/extension/base/composite/useMyJoinedExtensionActions';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useRegisterGroupChatGroups, useRegisterWatchedGroups } from '@/src/contexts/GroupChatSyncContext';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { cn } from '@/lib/utils';
import { ChatBadge } from './ChatBadge';
import { InboxPanel } from './InboxPanel';
import styles from './ChatPage.module.css';
import {
  READ_CURSORS_CHANGED_EVENT,
  READ_CURSORS_STORAGE_KEY,
} from './chatConstants';
import {
  cachedGroupSetsKey as buildCachedGroupSetsKey,
  readCachedGroupSets,
  readFollowedGroupIds,
  readOwnedChainGroupIds,
  readRecordStorage,
  writeFollowedGroupIds,
  writeOwnedChainGroupIds,
  writeCachedGroupSets,
} from './chatStorage';
import {
  buildChatActivationHref,
  buildChatPreferencesHref,
  safeBigIntFromString,
} from './chatUtils';
import {
  GROUP_CHAT_RECOMMENDATION_REASON_RANK,
  type GroupChatRecommendationSignal,
} from './chatTypes';

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

function parseManualGroupIdInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return undefined;
  const parsed = BigInt(trimmed);
  return parsed > BigInt(0) ? parsed : undefined;
}

function bestRecommendationSignals(signals: readonly (GroupChatRecommendationSignal | undefined)[]) {
  const byGroup = new Map<string, GroupChatRecommendationSignal>();
  signals.forEach((signal) => {
    if (!signal || signal.groupId <= BigInt(0)) return;
    const key = signal.groupId.toString();
    const current = byGroup.get(key);
    if (
      !current ||
      GROUP_CHAT_RECOMMENDATION_REASON_RANK[signal.reason] >
        GROUP_CHAT_RECOMMENDATION_REASON_RANK[current.reason]
    ) {
      byGroup.set(key, signal);
    }
  });
  return Array.from(byGroup.values());
}

function mergeStableInboxItems<T extends { groupId: bigint }>(
  currentItems: readonly T[],
  previousItems: readonly T[],
  stableGroupIds: readonly bigint[],
  canReusePreviousItem: (item: T) => boolean,
) {
  const currentByGroup = new Map(currentItems.map((item) => [item.groupId.toString(), item]));
  const previousByGroup = new Map(
    previousItems
      .filter((item) => canReusePreviousItem(item))
      .map((item) => [item.groupId.toString(), item]),
  );
  const merged: T[] = [];

  stableGroupIds.forEach((groupId) => {
    const key = groupId.toString();
    const currentItem = currentByGroup.get(key);
    const previousItem = previousByGroup.get(key);
    const item = currentItem && canReusePreviousItem(currentItem)
      ? currentItem
      : previousItem || currentItem;
    if (item) merged.push(item);
  });

  currentItems.forEach((item) => {
    if (!stableGroupIds.some((groupId) => groupId === item.groupId)) {
      merged.push(item);
    }
  });

  return merged;
}

function sameStringArray(left: readonly string[], right: readonly string[]) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

const useClientLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function AddGroupDialog({
  open,
  inputValue,
  lookupGroupId,
  lookupItem,
  isConnected,
  isInputSettling,
  isInputInvalid,
  isChecking,
  isAlreadyFollowed,
  hasLookupError,
  canConfirm,
  onInputChange,
  onClose,
  onConfirm,
}: {
  open: boolean;
  inputValue: string;
  lookupGroupId: bigint | undefined;
  lookupItem: GroupChatListItem | undefined;
  isConnected: boolean;
  isInputSettling: boolean;
  isInputInvalid: boolean;
  isChecking: boolean;
  isAlreadyFollowed: boolean;
  hasLookupError: boolean;
  canConfirm: boolean;
  onInputChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  const trimmedInput = inputValue.trim();
  const isActivated = !isInputSettling && lookupItem?.info?.activated === true;
  const isInactive = !isInputSettling && !!lookupGroupId && lookupItem?.info?.activated === false;
  const statusTone =
    isActivated && !isAlreadyFollowed
      ? 'ok'
      : isInactive || isInputInvalid || hasLookupError
        ? 'bad'
        : 'neutral';
  const statusText = !trimmedInput
    ? '输入群聊 ID 后自动检查激活状态和群聊名称。'
    : isInputInvalid
      ? '请输入大于 0 的数字群聊 ID。'
      : isInputSettling || isChecking
        ? '正在检查群聊状态...'
        : hasLookupError
          ? '检查失败，请稍后重试。'
          : isInactive
            ? '这个群聊还没有激活，不能添加。'
            : isAlreadyFollowed
              ? '这个群聊已经在我的群聊里。'
              : isActivated
                ? '检查通过，确认后会加入我的群聊。'
                : '没有读到这个群聊，请确认 ID 是否正确。';

  return (
    <div
      className="chat-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="chat-modal add-group-dialog" role="dialog" aria-modal="true" aria-labelledby="add-group-dialog-title">
        <div className="chat-modal-head">
          <div>
            <strong id="add-group-dialog-title">添加群聊</strong>
            <span>检查后确认</span>
          </div>
          <button className="chat-modal-close" type="button" onClick={onClose} aria-label="关闭添加群聊">
            x
          </button>
        </div>
        <div className="manual-group-form">
          <label className="manual-group-label" htmlFor="manual-group-id-input">
            群聊 ID
          </label>
          <input
            id="manual-group-id-input"
            className="manual-group-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="例如 123"
            autoFocus
          />
          <div className="manual-group-status" data-tone={statusTone}>
            {statusText}
          </div>
          {isActivated && lookupItem && (
            <div className="manual-group-result">
              <div>
                <span>G#{lookupItem.groupId.toString()}</span>
                <ChatBadge>{lookupItem.typeLabel}</ChatBadge>
              </div>
              <strong>{lookupItem.title}</strong>
            </div>
          )}
          {!isConnected && (
            <div className="manual-group-status" data-tone="bad">
              连接钱包后才能加入我的群聊。
            </div>
          )}
        </div>
        <div className="chat-modal-actions">
          <button className="sheet-button inline-flex" type="button" onClick={onClose}>
            取消
          </button>
          <button className="sheet-button primary inline-flex" type="button" onClick={onConfirm} disabled={!canConfirm}>
            确认添加
          </button>
        </div>
      </section>
    </div>
  );
}

export function GroupChatHome() {
  const router = useRouter();
  const { address: account, isConnected } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const accountAddress = account as `0x${string}` | undefined;
  const tokenAddress = token?.address as `0x${string}` | undefined;
  const cachedGroupSetsKey = useMemo(
    () => buildCachedGroupSetsKey(accountAddress, tokenAddress),
    [accountAddress, tokenAddress],
  );
  const [followedGroupIds, setFollowedGroupIds] = useState<string[]>([]);
  const [hasLoadedFollowedGroupIds, setHasLoadedFollowedGroupIds] = useState(false);
  const [cachedOwnedChainGroupIds, setCachedOwnedChainGroupIds] = useState<string[]>([]);
  const [cachedRecommendedGroupIds, setCachedRecommendedGroupIds] = useState<string[]>([]);
  const [readCursors, setReadCursors] = useState<Record<string, string>>({});
  const [addGroupDialogOpen, setAddGroupDialogOpen] = useState(false);
  const [manualGroupIdInput, setManualGroupIdInput] = useState('');
  const [manualGroupIdQuery, setManualGroupIdQuery] = useState('');
  const { myGroups, isPending: isMyGroupsPending } = useMyGroups(accountAddress);
  const ownedChainGroupIds = useMemo(() => myGroups.map((group) => group.tokenId), [myGroups]);
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
  const followedPriorityGroupIds = useMemo(
    () => uniqueGroupIds(followedGroupIds.map((groupId) => safeBigIntFromString(groupId))),
    [followedGroupIds],
  );
  const cachedOwnedChainPriorityGroupIds = useMemo(
    () => uniqueGroupIds(cachedOwnedChainGroupIds.map((groupId) => safeBigIntFromString(groupId))),
    [cachedOwnedChainGroupIds],
  );
  const cachedRecommendedPriorityGroupIds = useMemo(
    () => uniqueGroupIds(cachedRecommendedGroupIds.map((groupId) => safeBigIntFromString(groupId))),
    [cachedRecommendedGroupIds],
  );
  const lastDisplayGroupSetsRef = useRef<{
    key: string;
    recommendedGroupIds: bigint[];
  }>({
    key: cachedGroupSetsKey,
    recommendedGroupIds: [],
  });
  const lastRecommendationSignalsRef = useRef<{
    key: string;
    signals: GroupChatRecommendationSignal[];
  }>({
    key: cachedGroupSetsKey,
    signals: [],
  });
  const displayedFollowedGroupIds = useMemo(
    () => {
      if (hasLoadedFollowedGroupIds) return followedPriorityGroupIds;
      return [];
    },
    [followedPriorityGroupIds, hasLoadedFollowedGroupIds],
  );
  const displayedOwnedChainGroupIds = useMemo(
    () => {
      if (!isMyGroupsPending) return ownedChainGroupIds;
      return cachedOwnedChainPriorityGroupIds;
    },
    [cachedOwnedChainPriorityGroupIds, isMyGroupsPending, ownedChainGroupIds],
  );
  const ownedChainRecommendationSignals = useMemo(
    () => displayedOwnedChainGroupIds.map((groupId) => ({ groupId, reason: 'owned-chain-group' as const })),
    [displayedOwnedChainGroupIds],
  );
  const liveTokenRecommendationSignals = useMemo(
    () =>
      bestRecommendationSignals([
        tokenMainGroupId ? { groupId: tokenMainGroupId, reason: 'current-token-main' as const } : undefined,
        ...actionMainGroupIds.map((groupId) => ({ groupId, reason: 'joined-action' as const })),
        isGovernor && tokenGovGroupId ? { groupId: tokenGovGroupId, reason: 'governor' as const } : undefined,
        ...actionGovGroupIds.map((groupId) => ({ groupId, reason: 'voted-action' as const })),
        ...groupJoinRecommendedGroupIds.map((groupId) => ({ groupId, reason: 'joined-chain-group' as const })),
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
  const tokenRecommendationSignals = useMemo(() => {
    const lastResolved = lastRecommendationSignalsRef.current;
    if (isRecommendedGroupIdsPending && lastResolved.key === cachedGroupSetsKey) {
      return bestRecommendationSignals([...liveTokenRecommendationSignals, ...lastResolved.signals]);
    }
    return liveTokenRecommendationSignals;
  }, [cachedGroupSetsKey, isRecommendedGroupIdsPending, liveTokenRecommendationSignals]);
  const recommendationSignals = useMemo(
    () => bestRecommendationSignals([...ownedChainRecommendationSignals, ...tokenRecommendationSignals]),
    [ownedChainRecommendationSignals, tokenRecommendationSignals],
  );
  const tokenRecommendedGroupIds = useMemo(
    () => uniqueGroupIds(tokenRecommendationSignals.map((signal) => signal.groupId)),
    [tokenRecommendationSignals],
  );
  const liveTokenRecommendedGroupIds = useMemo(
    () => uniqueGroupIds(liveTokenRecommendationSignals.map((signal) => signal.groupId)),
    [liveTokenRecommendationSignals],
  );
  const displayedRecommendedGroupIds = useMemo(
    () => {
      if (tokenRecommendedGroupIds.length > 0) return tokenRecommendedGroupIds;
      if (!isRecommendedGroupIdsPending) return [];
      if (cachedRecommendedPriorityGroupIds.length > 0) return cachedRecommendedPriorityGroupIds;
      const lastResolved = lastDisplayGroupSetsRef.current;
      return lastResolved.key === cachedGroupSetsKey ? lastResolved.recommendedGroupIds : [];
    },
    [cachedGroupSetsKey, cachedRecommendedPriorityGroupIds, isRecommendedGroupIdsPending, tokenRecommendedGroupIds],
  );
  const displayedRecommendationGroupIds = useMemo(
    () => uniqueGroupIds([...displayedOwnedChainGroupIds, ...displayedRecommendedGroupIds]),
    [displayedOwnedChainGroupIds, displayedRecommendedGroupIds],
  );
  useEffect(() => {
    if (!addGroupDialogOpen) return;
    const timer = window.setTimeout(() => {
      setManualGroupIdQuery(manualGroupIdInput.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [addGroupDialogOpen, manualGroupIdInput]);
  const manualLookupGroupId = useMemo(
    () => parseManualGroupIdInput(manualGroupIdQuery),
    [manualGroupIdQuery],
  );
  const manualLookupGroupIds = useMemo(
    () => (manualLookupGroupId ? [manualLookupGroupId] : []),
    [manualLookupGroupId],
  );
  const inboxPriorityGroupIds = useMemo(
    () =>
      uniqueGroupIds([
        ...followedPriorityGroupIds,
        ...displayedFollowedGroupIds,
        ...displayedRecommendationGroupIds,
        ...manualLookupGroupIds,
      ]),
    [
      followedPriorityGroupIds,
      displayedFollowedGroupIds,
      displayedRecommendationGroupIds,
      manualLookupGroupIds,
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
  const hasUnreadyStableInboxItems = useMemo(() => {
    const itemsByGroup = new Map(inbox.items.map((item) => [item.groupId.toString(), item]));
    return inboxPriorityGroupIds.some((groupId) => {
      const item = itemsByGroup.get(groupId.toString());
      return !item || item.info === undefined;
    });
  }, [inbox.items, inboxPriorityGroupIds]);
  const displayedInboxItems = useMemo(() => {
    const lastResolved = lastResolvedInboxItemsRef.current;
    const hasSameCacheKey = lastResolved.key === cachedGroupSetsKey;
    if ((inbox.isPending || hasUnreadyStableInboxItems) && hasSameCacheKey) {
      return mergeStableInboxItems(
        inbox.items,
        lastResolved.items,
        inboxPriorityGroupIds,
        (item) => item.info?.activated === true,
      );
    }
    if (hasActivatedInboxItems || !inbox.isPending) return inbox.items;
    return hasSameCacheKey ? lastResolved.items : [];
  }, [cachedGroupSetsKey, hasActivatedInboxItems, hasUnreadyStableInboxItems, inbox.isPending, inbox.items, inboxPriorityGroupIds]);
  const displayedFollowedItems = useMemo(() => {
    const followedSet = new Set(displayedFollowedGroupIds.map((groupId) => groupId.toString()));
    return displayedInboxItems.filter((item) => item.info?.activated === true && followedSet.has(item.groupId.toString()));
  }, [displayedFollowedGroupIds, displayedInboxItems]);
  const displayedRecommendedItems = useMemo(() => {
    const followedSet = new Set(displayedFollowedGroupIds.map((groupId) => groupId.toString()));
    const recommendedSet = new Set(displayedRecommendationGroupIds.map((groupId) => groupId.toString()));
    return displayedInboxItems.filter((item) => {
      const key = item.groupId.toString();
      return item.info?.activated === true && !followedSet.has(key) && recommendedSet.has(key);
    });
  }, [displayedFollowedGroupIds, displayedInboxItems, displayedRecommendationGroupIds]);
  const manualLookupItem = useMemo(
    () =>
      manualLookupGroupId
        ? inbox.items.find((item) => item.groupId === manualLookupGroupId)
        : undefined,
    [inbox.items, manualLookupGroupId],
  );
  const manualLookupAlreadyFollowed = useMemo(
    () => !!manualLookupGroupId && followedGroupIds.includes(manualLookupGroupId.toString()),
    [followedGroupIds, manualLookupGroupId],
  );
  const manualInputSettling = addGroupDialogOpen && manualGroupIdInput.trim() !== manualGroupIdQuery;
  const manualInputInvalid = manualGroupIdQuery.length > 0 && !manualLookupGroupId;
  const manualLookupChecking =
    !!manualLookupGroupId &&
    (manualInputSettling || ((!manualLookupItem || manualLookupItem.info === undefined) && inbox.isPending));
  const manualLookupHasError =
    !!manualLookupGroupId &&
    !manualInputSettling &&
    !manualLookupChecking &&
    (!manualLookupItem || manualLookupItem.info === undefined) &&
    !!inbox.error;
  const canConfirmManualAdd =
    !!accountAddress &&
    manualLookupItem?.info?.activated === true &&
    !manualLookupAlreadyFollowed &&
    !manualLookupChecking &&
    !manualLookupHasError;
  useClientLayoutEffect(() => {
    const stableItems = displayedInboxItems.filter((item) => item.info?.activated === true);
    if (stableItems.length === 0 && (inbox.isPending || hasUnreadyStableInboxItems)) return;
    lastResolvedInboxItemsRef.current = {
      key: cachedGroupSetsKey,
      items: stableItems,
    };
  }, [cachedGroupSetsKey, displayedInboxItems, hasUnreadyStableInboxItems, inbox.isPending]);
  const visibleInboxGroupIds = useMemo(
    () => uniqueGroupIds([
      ...displayedFollowedItems.map((item) => item.groupId),
      ...displayedRecommendedItems.map((item) => item.groupId),
    ]),
    [displayedFollowedItems, displayedRecommendedItems],
  );
  useRegisterGroupChatGroups({
    groupIds: inboxPriorityGroupIds,
    source: 'chat-cached-groups',
    scope: 'background',
    frequency: 'low',
  });
  useRegisterWatchedGroups(visibleInboxGroupIds, 'inbox-visible');

  useClientLayoutEffect(() => {
    const nextFollowedGroupIds = readFollowedGroupIds(accountAddress);
    const cachedGroupSets = readCachedGroupSets(cachedGroupSetsKey);
    setFollowedGroupIds(nextFollowedGroupIds);
    setHasLoadedFollowedGroupIds(true);
    setCachedOwnedChainGroupIds(readOwnedChainGroupIds(accountAddress));
    setCachedRecommendedGroupIds(cachedGroupSets?.recommendedGroupIds || []);
    setReadCursors(readRecordStorage(READ_CURSORS_STORAGE_KEY));
  }, [accountAddress, cachedGroupSetsKey]);

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
    if (isRecommendedGroupIdsPending) return;
    lastRecommendationSignalsRef.current = {
      key: cachedGroupSetsKey,
      signals: liveTokenRecommendationSignals,
    };
  }, [cachedGroupSetsKey, isRecommendedGroupIdsPending, liveTokenRecommendationSignals]);

  useEffect(() => {
    if (isRecommendedGroupIdsPending) return;
    lastDisplayGroupSetsRef.current = {
      key: cachedGroupSetsKey,
      recommendedGroupIds: liveTokenRecommendedGroupIds,
    };
  }, [cachedGroupSetsKey, isRecommendedGroupIdsPending, liveTokenRecommendedGroupIds]);

  useEffect(() => {
    if (isMyGroupsPending) return;

    const nextOwnedChainGroupIds = groupIdsToStrings(ownedChainGroupIds);
    if (sameStringArray(cachedOwnedChainGroupIds, nextOwnedChainGroupIds)) return;

    setCachedOwnedChainGroupIds(nextOwnedChainGroupIds);
    writeOwnedChainGroupIds(accountAddress, nextOwnedChainGroupIds);
  }, [
    accountAddress,
    cachedOwnedChainGroupIds,
    isMyGroupsPending,
    ownedChainGroupIds,
  ]);

  useEffect(() => {
    if (isRecommendedGroupIdsPending) return;

    const nextRecommendedGroupIds = groupIdsToStrings(liveTokenRecommendedGroupIds);
    const changed = !sameStringArray(cachedRecommendedGroupIds, nextRecommendedGroupIds);
    if (!changed) return;

    setCachedRecommendedGroupIds(nextRecommendedGroupIds);
    writeCachedGroupSets(cachedGroupSetsKey, {
      recommendedGroupIds: nextRecommendedGroupIds,
    });
  }, [
    cachedGroupSetsKey,
    cachedRecommendedGroupIds,
    isRecommendedGroupIdsPending,
    liveTokenRecommendedGroupIds,
  ]);

  const onOpenActivate = useCallback(() => {
    router.push(buildChatActivationHref(token?.symbol));
  }, [router, token?.symbol]);

  const onOpenPreferences = useCallback(() => {
    router.push(buildChatPreferencesHref(token?.symbol));
  }, [router, token?.symbol]);

  const openAddGroupDialog = useCallback(() => {
    setManualGroupIdInput('');
    setManualGroupIdQuery('');
    setAddGroupDialogOpen(true);
  }, []);

  const closeAddGroupDialog = useCallback(() => {
    setAddGroupDialogOpen(false);
    setManualGroupIdInput('');
    setManualGroupIdQuery('');
  }, []);

  const addFollowedGroup = useCallback((groupId: bigint) => {
    if (!accountAddress) return;
    const key = groupId.toString();
    setFollowedGroupIds((prev) => {
      if (prev.includes(key)) return prev;
      const next = [key, ...prev];
      if (typeof window !== 'undefined') {
        writeFollowedGroupIds(accountAddress, next);
      }
      return next;
    });
  }, [accountAddress]);

  const toggleFollowedGroup = useCallback((groupId: bigint) => {
    if (!accountAddress) return;
    const key = groupId.toString();
    setFollowedGroupIds((prev) => {
      const next = prev.includes(key) ? prev.filter((item) => item !== key) : [key, ...prev];
      if (typeof window !== 'undefined') {
        writeFollowedGroupIds(accountAddress, next);
      }
      return next;
    });
  }, [accountAddress]);

  const confirmManualAdd = useCallback(() => {
    if (!manualLookupGroupId || !canConfirmManualAdd) return;
    addFollowedGroup(manualLookupGroupId);
    closeAddGroupDialog();
  }, [addFollowedGroup, canConfirmManualAdd, closeAddGroupDialog, manualLookupGroupId]);

  return (
    <>
      <Header title="群聊" showBackButton={false} />
      <main className={styles.chatPrototype} data-detail="false" data-entry="love20-chat">
        <div className={styles.chatWorkspace} data-entry="love20-chat">
          <section className={styles.chatSurface}>
            <section className={cn('workspace-screen', 'inbox-screen')} aria-label="聊天工作区">
              {!isGroupChatEnabled && (
                <div className="mb-3">
                  <AlertBox type="warning" message="当前环境未配置 GroupChat 合约地址。" />
                </div>
              )}
              <InboxPanel
                followedItems={displayedFollowedItems}
                recommendedItems={displayedRecommendedItems}
                isPending={inbox.isPending}
                isConnected={isConnected}
                tokenSymbol={token?.symbol}
                recommendationSignals={recommendationSignals}
                readCursors={readCursors}
                onOpenAddGroup={openAddGroupDialog}
                onOpenActivate={onOpenActivate}
                onOpenPreferences={onOpenPreferences}
                onToggleFollow={toggleFollowedGroup}
              />
              <AddGroupDialog
                open={addGroupDialogOpen}
                inputValue={manualGroupIdInput}
                lookupGroupId={manualLookupGroupId}
                lookupItem={manualLookupItem}
                isConnected={isConnected}
                isInputSettling={manualInputSettling}
                isInputInvalid={manualInputInvalid}
                isChecking={manualLookupChecking}
                isAlreadyFollowed={manualLookupAlreadyFollowed}
                hasLookupError={manualLookupHasError}
                canConfirm={canConfirmManualAdd}
                onInputChange={setManualGroupIdInput}
                onClose={closeAddGroupDialog}
                onConfirm={confirmManualAdd}
              />
            </section>
          </section>
        </div>
      </main>
    </>
  );
}
