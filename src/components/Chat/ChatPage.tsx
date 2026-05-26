'use client';

import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import { TokenActionGovManagerAbi } from '@/src/abis/TokenActionGovManager';
import { TokenActionMainManagerAbi } from '@/src/abis/TokenActionMainManager';
import AlertBox from '@/src/components/Common/AlertBox';
import Header from '@/src/components/Header';
import { isGroupChatEnabled } from '@/src/hooks/contracts/useGroupChat';
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
import { TokenContext } from '@/src/contexts/TokenContext';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { cn } from '@/lib/utils';
import { ActionChatPanel } from './ActionChatPanel';
import { ActivationPanel } from './ActivationPanels';
import { ChainChatPanel } from './ChainChatPanel';
import { AdminsPanel } from './AdminsPanel';
import { BlacklistPanel } from './BlacklistPanel';
import { ChatSettingsPanel } from './ChatSettingsPanel';
import { InboxPanel } from './InboxPanel';
import { MembersPanel } from './MembersPanel';
import { RoomPanel } from './RoomPanel';
import styles from './ChatPage.module.css';
import {
  PINNED_GROUPS_STORAGE_KEY,
  READ_CURSORS_STORAGE_KEY,
} from './chatConstants';
import {
  DEFAULT_MESSAGE_PREFERENCES,
  type MessagePreferences,
  readJsonArrayStorage,
  readMessagePreferences,
  readRecordStorage,
  writeMessagePreferences,
} from './chatStorage';
import type { ChatWorkspaceView } from './chatTypes';
import {
  invalidateContractReads,
  parseGroupId,
  safeBigIntFromString,
} from './chatUtils';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

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

export default function ChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address: account, isConnected } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const [pinnedGroupIds, setPinnedGroupIds] = useState<string[]>([]);
  const [readCursors, setReadCursors] = useState<Record<string, string>>({});
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [messagePreferences, setMessagePreferences] = useState<MessagePreferences>(DEFAULT_MESSAGE_PREFERENCES);
  const showBlacklistedMessages = messagePreferences.showBlacklistedMessages;
  const showMessageTimes = messagePreferences.showMessageTimes;
  const selectedGroupId = parseGroupId(router.query.groupId);
  const view = Array.isArray(router.query.view) ? router.query.view[0] : router.query.view;
  const activationTypeQuery = Array.isArray(router.query.activationType)
    ? router.query.activationType[0]
    : router.query.activationType;
  const activationType = activationTypeQuery === 'action' || activationTypeQuery === 'chain' ? activationTypeQuery : 'token';
  const detailViews: ChatWorkspaceView[] = ['members', 'admins', 'blacklist', 'settings'];
  const workspaceView: ChatWorkspaceView = selectedGroupId
    ? detailViews.includes(view as ChatWorkspaceView) ? (view as ChatWorkspaceView) : 'chat'
    : view === 'activate' ? 'activate' : 'inbox';
  const accountAddress = account as `0x${string}` | undefined;
  const tokenAddress = token?.address as `0x${string}` | undefined;
  const { myGroups } = useMyGroups(accountAddress);
  const myChainGroupIds = useMemo(() => myGroups.map((group) => group.tokenId), [myGroups]);
  const { isGovernor } = useIsGovernor(accountAddress);
  const { groupId: tokenMainGroupId } = useTokenMainChatGroupIdOfToken(tokenAddress, !!tokenAddress);
  const { groupId: tokenGovGroupId } = useTokenGovChatGroupIdOfToken(tokenAddress, !!tokenAddress && isGovernor);
  const { joinedActions } = useJoinedActions(tokenAddress as `0x${string}`, accountAddress as `0x${string}`);
  const joinedActionIds = useMemo(
    () => uniqueGroupIds(joinedActions.map((item) => item.action?.head?.id)),
    [joinedActions],
  );
  const { currentRound } = useCurrentRound();
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
  const { data: actionMainGroupData } = useUniversalReadContracts({
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
  const { data: actionGovGroupData } = useUniversalReadContracts({
    contracts: actionGovGroupContracts as any,
    query: {
      enabled: isTokenActionGovChatManagerEnabled && !!tokenAddress && actionGovGroupContracts.length > 0,
    },
  });
  const actionGovGroupIds = useMemo(
    () => uniqueGroupIds(recentVotedActionIds.map((_, index) => safeToBigInt(resultAt(actionGovGroupData as any, index)))),
    [actionGovGroupData, recentVotedActionIds],
  );
  const pinnedPriorityGroupIds = useMemo(
    () => uniqueGroupIds(pinnedGroupIds.map((groupId) => safeBigIntFromString(groupId))),
    [pinnedGroupIds],
  );
  const recommendedGroupIds = useMemo(
    () =>
      uniqueGroupIds([
        tokenMainGroupId,
        ...actionMainGroupIds,
        isGovernor ? tokenGovGroupId : undefined,
        ...actionGovGroupIds,
      ]),
    [actionGovGroupIds, actionMainGroupIds, isGovernor, tokenGovGroupId, tokenMainGroupId],
  );
  const inboxPriorityGroupIds = useMemo(
    () => uniqueGroupIds([...pinnedPriorityGroupIds, ...myChainGroupIds, ...recommendedGroupIds]),
    [myChainGroupIds, pinnedPriorityGroupIds, recommendedGroupIds],
  );
  const inbox = useGroupChatInboxData(token, accountAddress, 50, inboxPriorityGroupIds);
  const selectedInboxItem = selectedGroupId
    ? inbox.items.find((entry) => entry.groupId === selectedGroupId)
    : undefined;
  const isChatDetail = workspaceView === 'chat' && !!selectedGroupId;

  useEffect(() => {
    setPinnedGroupIds(readJsonArrayStorage(PINNED_GROUPS_STORAGE_KEY));
    setReadCursors(readRecordStorage(READ_CURSORS_STORAGE_KEY));
    setMessagePreferences(readMessagePreferences());
  }, []);

  const markGroupRead = useCallback((groupId: bigint, latestMessageId: bigint | undefined) => {
    const key = groupId.toString();
    const cursor = latestMessageId && latestMessageId > BigInt(0) ? latestMessageId : BigInt(0);
    setReadCursors((prev) => {
      const previous = safeBigIntFromString(prev[key]);
      if (cursor <= previous) return prev;
      const next = { ...prev, [key]: cursor.toString() };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(READ_CURSORS_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!selectedGroupId || workspaceView !== 'chat') return;
    const item = inbox.items.find((entry) => entry.groupId === selectedGroupId);
    markGroupRead(selectedGroupId, item?.latestMessage?.messageId || item?.messagesCount);
  }, [inbox.items, markGroupRead, selectedGroupId, workspaceView]);

  const onOpen = useCallback(
    (groupId: bigint) => {
      const item = inbox.items.find((entry) => entry.groupId === groupId);
      markGroupRead(groupId, item?.latestMessage?.messageId || item?.messagesCount);
      const query = {
        ...(token?.symbol ? { symbol: token.symbol } : {}),
        groupId: groupId.toString(),
      };
      router.push({ pathname: '/chat', query }, undefined, { shallow: true });
    },
    [inbox.items, markGroupRead, router, token?.symbol],
  );

  const onOpenActivate = useCallback(() => {
    const query = {
      ...(token?.symbol ? { symbol: token.symbol } : {}),
      view: 'activate',
    };
    router.push({ pathname: '/chat', query }, undefined, { shallow: true });
  }, [router, token?.symbol]);

  const onOpenGroupPanel = useCallback(
    (nextView: ChatWorkspaceView) => {
      if (!selectedGroupId) return;
      const query = {
        ...(token?.symbol ? { symbol: token.symbol } : {}),
        groupId: selectedGroupId.toString(),
        view: nextView,
      };
      router.push({ pathname: '/chat', query }, undefined, { shallow: true });
    },
    [router, selectedGroupId, token?.symbol],
  );

  const setActivationType = useCallback(
    (nextType: 'token' | 'action' | 'chain') => {
      const query = {
        ...(token?.symbol ? { symbol: token.symbol } : {}),
        view: 'activate',
        activationType: nextType,
      };
      router.replace({ pathname: '/chat', query }, undefined, { shallow: true });
    },
    [router, token?.symbol],
  );

  const refreshAll = useCallback(() => {
    inbox.refetch();
    invalidateContractReads(queryClient);
  }, [inbox, queryClient]);

  const togglePinnedGroup = useCallback((groupId: bigint) => {
    const key = groupId.toString();
    setPinnedGroupIds((prev) => {
      const next = prev.includes(key) ? prev.filter((item) => item !== key) : [key, ...prev];
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(PINNED_GROUPS_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

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
      <Header title="聊天" showBackButton={workspaceView !== 'inbox'} />
      <main className={styles.chatPrototype} data-detail={isChatDetail ? 'true' : 'false'}>
        <div className={styles.chatWorkspace} data-entry="love20-chat">
          <section className={styles.chatSurface}>
            {workspaceView === 'chat' && selectedGroupId ? (
              <RoomPanel
                groupId={selectedGroupId}
                account={accountAddress}
                title={selectedInboxItem?.title}
                isPinned={pinnedGroupIds.includes(selectedGroupId.toString())}
                showBlacklistedMessages={showBlacklistedMessages}
                showMessageTimes={showMessageTimes}
                tokenAddress={token?.address}
                tokenSymbol={token?.symbol}
                onPosted={refreshAll}
                onOpenPanel={onOpenGroupPanel}
                onTogglePin={togglePinnedGroup}
              />
            ) : workspaceView === 'settings' && selectedGroupId ? (
              <ChatSettingsPanel
                groupId={selectedGroupId}
                account={accountAddress}
                onChanged={refreshAll}
              />
            ) : workspaceView === 'members' && selectedGroupId ? (
              <MembersPanel
                groupId={selectedGroupId}
                account={accountAddress}
                onChanged={refreshAll}
              />
            ) : workspaceView === 'admins' && selectedGroupId ? (
              <AdminsPanel
                groupId={selectedGroupId}
                account={accountAddress}
                onChanged={refreshAll}
              />
            ) : workspaceView === 'blacklist' && selectedGroupId ? (
              <BlacklistPanel
                groupId={selectedGroupId}
                account={accountAddress}
                onChanged={refreshAll}
              />
            ) : (
              <section className={cn('workspace-screen', workspaceView === 'inbox' && 'inbox-screen')} aria-label="聊天工作区">
                {!isGroupChatEnabled && (
                  <div className="mb-3">
                    <AlertBox type="warning" message="当前环境未配置 GroupChat 合约地址。" />
                  </div>
                )}
                {workspaceView === 'activate' ? (
                  <>
                    <div className="activation-header">
                      <div className="screen-heading">
                        <h1>激活群聊</h1>
                      </div>
                      <div className="chat-picker activation-tabs">
                        <button className={cn('picker-button inline-flex', activationType === 'token' && 'active')} type="button" onClick={() => setActivationType('token')}>
                          代币群
                        </button>
                        <button className={cn('picker-button inline-flex', activationType === 'action' && 'active')} type="button" onClick={() => setActivationType('action')}>
                          行动群
                        </button>
                        <button className={cn('picker-button inline-flex', activationType === 'chain' && 'active')} type="button" onClick={() => setActivationType('chain')}>
                          链群
                        </button>
                      </div>
                    </div>
                    {activationType === 'token' && (
                      <ActivationPanel
                        isConnected={isConnected}
                        account={accountAddress}
                        tokenAddress={token?.address}
                        tokenSymbol={token?.symbol}
                        onOpen={onOpen}
                        onConfirmed={refreshAll}
                      />
                    )}
                    {activationType === 'action' && (
                      <ActionChatPanel
                        isConnected={isConnected}
                        account={accountAddress}
                        tokenAddress={token?.address}
                        tokenSymbol={token?.symbol}
                        onOpen={onOpen}
                        onConfirmed={refreshAll}
                      />
                    )}
                    {activationType === 'chain' && (
                      <ChainChatPanel
                        isConnected={isConnected}
                        account={accountAddress}
                        tokenSymbol={token?.symbol}
                        onOpen={onOpen}
                        onConfirmed={refreshAll}
                      />
                    )}
                  </>
                ) : (
                  <InboxPanel
                    items={inbox.items}
                    selectedGroupId={selectedGroupId}
                    isPending={inbox.isPending}
                    isConnected={isConnected}
                    tokenSymbol={token?.symbol}
                    pinnedGroupIds={pinnedGroupIds}
                    myChainGroupIds={myChainGroupIds}
                    recommendedGroupIds={recommendedGroupIds}
                    readCursors={readCursors}
                    preferencesOpen={preferencesOpen}
                    showBlacklistedMessages={showBlacklistedMessages}
                    showMessageTimes={showMessageTimes}
                    onOpen={onOpen}
                    onOpenActivate={onOpenActivate}
                    onTogglePin={togglePinnedGroup}
                    onTogglePreferences={() => setPreferencesOpen((value) => !value)}
                    onSetShowBlacklistedMessages={(value) => updateMessagePreference('showBlacklistedMessages', value)}
                    onSetShowMessageTimes={(value) => updateMessagePreference('showMessageTimes', value)}
                  />
                )}
              </section>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
