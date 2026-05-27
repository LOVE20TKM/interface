'use client';

import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
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
import { useMyJoinedExtensionActions } from '@/src/hooks/extension/base/composite/useMyJoinedExtensionActions';
import { TokenContext } from '@/src/contexts/TokenContext';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { cn } from '@/lib/utils';
import { InboxPanel } from './InboxPanel';
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
import {
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
  const { address: account, isConnected } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const [pinnedGroupIds, setPinnedGroupIds] = useState<string[]>([]);
  const [readCursors, setReadCursors] = useState<Record<string, string>>({});
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [messagePreferences, setMessagePreferences] = useState<MessagePreferences>(DEFAULT_MESSAGE_PREFERENCES);
  const showBannedMessages = messagePreferences.showBannedMessages;
  const showMessageTimes = messagePreferences.showMessageTimes;
  const accountAddress = account as `0x${string}` | undefined;
  const tokenAddress = token?.address as `0x${string}` | undefined;
  const { myGroups } = useMyGroups(accountAddress);
  const myChainGroupIds = useMemo(() => myGroups.map((group) => group.tokenId), [myGroups]);
  const { isGovernor } = useIsGovernor(accountAddress);
  const { groupId: tokenMainGroupId } = useTokenMainChatGroupIdOfToken(tokenAddress, !!tokenAddress);
  const { groupId: tokenGovGroupId } = useTokenGovChatGroupIdOfToken(tokenAddress, !!tokenAddress && isGovernor);
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

  useEffect(() => {
    setPinnedGroupIds(readJsonArrayStorage(PINNED_GROUPS_STORAGE_KEY));
    setReadCursors(readRecordStorage(READ_CURSORS_STORAGE_KEY));
    setMessagePreferences(readMessagePreferences());
  }, []);

  const onOpen = useCallback(
    (groupId: bigint) => {
      const query = {
        ...(token?.symbol ? { symbol: token.symbol } : {}),
        groupId: groupId.toString(),
      };
      router.push({ pathname: '/chat/room', query });
    },
    [router, token?.symbol],
  );

  const onOpenActivate = useCallback(() => {
    const query = {
      ...(token?.symbol ? { symbol: token.symbol } : {}),
    };
    router.push({ pathname: '/chat/activate', query });
  }, [router, token?.symbol]);

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
      <Header title="聊天" showBackButton={false} />
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
                items={inbox.items}
                isPending={inbox.isPending}
                isConnected={isConnected}
                tokenSymbol={token?.symbol}
                pinnedGroupIds={pinnedGroupIds}
                myChainGroupIds={myChainGroupIds}
                recommendedGroupIds={recommendedGroupIds}
                readCursors={readCursors}
                preferencesOpen={preferencesOpen}
                showBannedMessages={showBannedMessages}
                showMessageTimes={showMessageTimes}
                onOpen={onOpen}
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
