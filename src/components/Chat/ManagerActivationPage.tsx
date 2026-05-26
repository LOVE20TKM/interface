import { useCallback, useContext, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import Header from '@/src/components/Header';
import { TokenContext } from '@/src/contexts/TokenContext';
import {
  GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER_ADDRESS,
  GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER_ADDRESS,
  GROUP_CHAT_TOKEN_GOV_MANAGER_ADDRESS,
  GROUP_CHAT_TOKEN_MAIN_MANAGER_ADDRESS,
  isTokenActionGovChatManagerEnabled,
  isTokenActionMainChatManagerEnabled,
  isTokenGovChatManagerEnabled,
  isTokenMainChatManagerEnabled,
  useActivateTokenActionGovChat,
  useActivateTokenActionMainChat,
  useActivateTokenGovChat,
  useActivateTokenMainChat,
  useTokenActionGovChatGroupIdOfAction,
  useTokenActionMainChatGroupIdOfAction,
  useTokenGovChatGroupIdOfToken,
  useTokenMainChatGroupIdOfToken,
} from '@/src/hooks/contracts/useGroupChatManagers';
import { useActionInfo } from '@/src/hooks/contracts/useLOVE20Submit';
import styles from '@/src/components/Chat/ChatPage.module.css';
import { ManagerActivationForm } from './ManagerActivationForm';
import {
  actionInfoTitle,
  invalidateContractReads,
  parseActionIdInput,
} from './chatUtils';

type ManagerKind = 'main' | 'gov';
type ActivationType = 'token' | 'action';

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildActivationListUrl(tokenSymbol: string | undefined, activationType: ActivationType) {
  const params = new URLSearchParams({
    view: 'activate',
    activationType,
  });
  if (tokenSymbol) {
    params.set('symbol', tokenSymbol);
  }
  return `/chat?${params.toString()}`;
}

function useManagerActivationContext(activationType: ActivationType) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const symbolQuery = firstQueryValue(router.query.symbol);
  const tokenSymbol = token?.symbol || symbolQuery;
  const backUrl = buildActivationListUrl(tokenSymbol, activationType);

  const openChat = useCallback(
    (groupId: bigint) => {
      router.push({
        pathname: '/chat',
        query: {
          ...(tokenSymbol ? { symbol: tokenSymbol } : {}),
          groupId: groupId.toString(),
        },
      });
    },
    [router, tokenSymbol],
  );

  const refreshReads = useCallback(() => {
    invalidateContractReads(queryClient);
  }, [queryClient]);

  return {
    account: account as `0x${string}` | undefined,
    tokenAddress: token?.address,
    tokenSymbol,
    backUrl,
    openChat,
    refreshReads,
  };
}

function ManagerActivationShell({
  pageTitle,
  tokenSymbol,
  backUrl,
  children,
}: {
  pageTitle: string;
  tokenSymbol?: string;
  backUrl: string;
  children: ReactNode;
}) {
  return (
    <>
      <Header title={pageTitle} backUrl={backUrl} />
      <main className={styles.chatPrototype} data-detail="false">
        <div className={styles.chatWorkspace} data-entry="love20-chat-manager-activation">
          <section className={styles.chatSurface}>
            <section className="workspace-screen" aria-label={pageTitle}>
              <div className="activation-header">
                <div className="screen-heading">
                  <h1>{pageTitle}</h1>
                  <span>{tokenSymbol || '当前代币'}</span>
                </div>
              </div>
              {children}
            </section>
          </section>
        </div>
      </main>
    </>
  );
}

function MissingActivationInput({ message }: { message: string }) {
  return (
    <section className="workspace-band activation-form">
      <div className="notice-row">{message}</div>
    </section>
  );
}

function TokenManagerActivationDetail({
  kind,
  tokenAddress,
  tokenSymbol,
  account,
  onOpen,
  onConfirmed,
}: {
  kind: ManagerKind;
  tokenAddress: `0x${string}`;
  tokenSymbol?: string;
  account: `0x${string}` | undefined;
  onOpen: (groupId: bigint) => void;
  onConfirmed: () => void;
}) {
  const isMain = kind === 'main';
  const { groupId: mainGroupId, isPending: isPendingMainGroupId } = useTokenMainChatGroupIdOfToken(
    tokenAddress,
    isMain,
  );
  const { groupId: govGroupId, isPending: isPendingGovGroupId } = useTokenGovChatGroupIdOfToken(
    tokenAddress,
    !isMain,
  );
  const mainActivate = useActivateTokenMainChat();
  const govActivate = useActivateTokenGovChat();
  const activation = isMain ? mainActivate : govActivate;

  return (
    <ManagerActivationForm
      title={`${tokenSymbol || '当前代币'} ${isMain ? '主群' : '治理群'}`}
      fields={[{ label: 'token', value: tokenAddress }]}
      managerAddress={isMain ? GROUP_CHAT_TOKEN_MAIN_MANAGER_ADDRESS : GROUP_CHAT_TOKEN_GOV_MANAGER_ADDRESS}
      enabled={isMain ? isTokenMainChatManagerEnabled : isTokenGovChatManagerEnabled}
      existingGroupId={isMain ? mainGroupId : govGroupId}
      isExistingPending={isMain ? isPendingMainGroupId : isPendingGovGroupId}
      account={account}
      onActivate={() => (isMain ? mainActivate.activate(tokenAddress) : govActivate.activate(tokenAddress))}
      isPending={activation.isPending}
      isConfirming={activation.isConfirming}
      isConfirmed={activation.isConfirmed}
      activationHash={activation.hash}
      onOpen={onOpen}
      onConfirmed={onConfirmed}
    />
  );
}

function ActionManagerActivationDetail({
  kind,
  tokenAddress,
  meta,
  actionId,
  actionTitle,
  account,
  onOpen,
  onConfirmed,
}: {
  kind: ManagerKind;
  tokenAddress: `0x${string}`;
  meta?: string;
  actionId: bigint;
  actionTitle: string;
  account: `0x${string}` | undefined;
  onOpen: (groupId: bigint) => void;
  onConfirmed: () => void;
}) {
  const isMain = kind === 'main';
  const { groupId: actionMainGroupId, isPending: isPendingActionMainGroupId } =
    useTokenActionMainChatGroupIdOfAction(tokenAddress, actionId, isMain);
  const { groupId: actionGovGroupId, isPending: isPendingActionGovGroupId } =
    useTokenActionGovChatGroupIdOfAction(tokenAddress, actionId, !isMain);
  const actionMainActivate = useActivateTokenActionMainChat();
  const actionGovActivate = useActivateTokenActionGovChat();
  const activation = isMain ? actionMainActivate : actionGovActivate;

  return (
    <ManagerActivationForm
      title={`No.${actionId.toString()} ${actionTitle} ${isMain ? '行动主群' : '行动治理群'}`}
      meta={meta}
      fields={[
        { label: 'token', value: tokenAddress },
        { label: 'actionId', value: actionId.toString() },
      ]}
      managerAddress={isMain ? GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER_ADDRESS : GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER_ADDRESS}
      enabled={isMain ? isTokenActionMainChatManagerEnabled : isTokenActionGovChatManagerEnabled}
      existingGroupId={isMain ? actionMainGroupId : actionGovGroupId}
      isExistingPending={isMain ? isPendingActionMainGroupId : isPendingActionGovGroupId}
      account={account}
      onActivate={() =>
        isMain
          ? actionMainActivate.activate(tokenAddress, actionId)
          : actionGovActivate.activate(tokenAddress, actionId)}
      isPending={activation.isPending}
      isConfirming={activation.isConfirming}
      isConfirmed={activation.isConfirmed}
      activationHash={activation.hash}
      onOpen={onOpen}
      onConfirmed={onConfirmed}
    />
  );
}

export function TokenManagerActivationPage({ kind }: { kind: ManagerKind }) {
  const isMain = kind === 'main';
  const pageTitle = isMain ? '激活代币主群' : '激活代币治理群';
  const { account, tokenAddress, tokenSymbol, backUrl, openChat, refreshReads } =
    useManagerActivationContext('token');

  return (
    <ManagerActivationShell pageTitle={pageTitle} tokenSymbol={tokenSymbol} backUrl={backUrl}>
      {tokenAddress ? (
        <TokenManagerActivationDetail
          kind={kind}
          tokenAddress={tokenAddress}
          tokenSymbol={tokenSymbol}
          account={account}
          onOpen={openChat}
          onConfirmed={refreshReads}
        />
      ) : (
        <MissingActivationInput message="正在读取当前代币，请稍后重试。" />
      )}
    </ManagerActivationShell>
  );
}

export function ActionManagerActivationPage({ kind }: { kind: ManagerKind }) {
  const router = useRouter();
  const isMain = kind === 'main';
  const pageTitle = isMain ? '激活行动主群' : '激活行动治理群';
  const { account, tokenAddress, tokenSymbol, backUrl, openChat, refreshReads } =
    useManagerActivationContext('action');
  const actionIdQuery = firstQueryValue(router.query.actionId);
  const actionId = actionIdQuery ? parseActionIdInput(actionIdQuery) : undefined;
  const { actionInfo, isPending: isPendingActionInfo } = useActionInfo(tokenAddress, actionId);
  const actionTitle = actionInfo
    ? actionInfoTitle(actionInfo, actionId)
    : actionId !== undefined ? `行动 #${actionId.toString()}` : '行动';
  const meta = isPendingActionInfo ? `${tokenSymbol || '当前代币'} · 正在读取行动信息...` : tokenSymbol;

  return (
    <ManagerActivationShell pageTitle={pageTitle} tokenSymbol={tokenSymbol} backUrl={backUrl}>
      {!tokenAddress ? (
        <MissingActivationInput message="正在读取当前代币，请稍后重试。" />
      ) : actionId === undefined ? (
        <MissingActivationInput message="缺少有效 Action ID，请返回行动群列表选择。" />
      ) : (
        <ActionManagerActivationDetail
          kind={kind}
          tokenAddress={tokenAddress}
          meta={meta}
          actionId={actionId}
          actionTitle={actionTitle}
          account={account}
          onOpen={openChat}
          onConfirmed={refreshReads}
        />
      )}
    </ManagerActivationShell>
  );
}
