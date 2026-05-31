'use client';

import { useCallback, useContext } from 'react';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import AlertBox from '@/src/components/Common/AlertBox';
import Header from '@/src/components/Header';
import { TokenContext } from '@/src/contexts/TokenContext';
import { isGroupChatEnabled } from '@/src/hooks/contracts/useGroupChat';
import { cn } from '@/lib/utils';
import { ActionChatPanel } from './ActionChatPanel';
import { ActivationPanel } from './ActivationPanels';
import { ChainChatPanel } from './ChainChatPanel';
import styles from './ChatPage.module.css';
import { buildChatActivationHref, buildChatIndexHref, buildGroupChatDetailHref, invalidateContractReads } from './chatUtils';

type ActivationType = 'token' | 'action' | 'chain';

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseActivationType(value: string | string[] | undefined): ActivationType {
  const firstValue = firstQueryValue(value);
  return firstValue === 'action' || firstValue === 'chain' ? firstValue : 'token';
}

export default function ChatActivationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address: account, isConnected } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const symbolQuery = firstQueryValue(router.query.symbol);
  const tokenSymbol = token?.symbol || symbolQuery;
  const activationType = parseActivationType(router.query.activationType);
  const accountAddress = account as `0x${string}` | undefined;

  const openChat = useCallback(
    (groupId: bigint) => {
      router.push(buildGroupChatDetailHref(tokenSymbol, groupId));
    },
    [router, tokenSymbol],
  );

  const setActivationType = useCallback(
    (nextType: ActivationType) => {
      router.replace(buildChatActivationHref(tokenSymbol, nextType));
    },
    [router, tokenSymbol],
  );

  const refreshReads = useCallback(() => {
    invalidateContractReads(queryClient);
  }, [queryClient]);

  const backUrl = buildChatIndexHref(tokenSymbol);

  return (
    <>
      <Header title="激活群聊" backUrl={backUrl} replaceBack />
      <main className={styles.chatPrototype} data-detail="false">
        <div className={styles.chatWorkspace} data-entry="love20-chat-activation">
          <section className={styles.chatSurface}>
            <section className="workspace-screen" aria-label="激活群聊">
              {!isGroupChatEnabled && (
                <div className="mb-3">
                  <AlertBox type="warning" message="当前环境未配置 GroupChat 合约地址。" />
                </div>
              )}
              <div className="activation-header">
                <div className="screen-heading">
                  <h1>激活群聊</h1>
                </div>
                <div className="chat-picker activation-tabs">
                  <button
                    className={cn('picker-button inline-flex', activationType === 'token' && 'active')}
                    type="button"
                    onClick={() => setActivationType('token')}
                  >
                    代币群
                  </button>
                  <button
                    className={cn('picker-button inline-flex', activationType === 'action' && 'active')}
                    type="button"
                    onClick={() => setActivationType('action')}
                  >
                    行动群
                  </button>
                  <button
                    className={cn('picker-button inline-flex', activationType === 'chain' && 'active')}
                    type="button"
                    onClick={() => setActivationType('chain')}
                  >
                    链群
                  </button>
                </div>
              </div>
              {activationType === 'token' && (
                <ActivationPanel
                  isConnected={isConnected}
                  account={accountAddress}
                  tokenAddress={token?.address}
                  tokenSymbol={tokenSymbol}
                  onOpen={openChat}
                  onConfirmed={refreshReads}
                />
              )}
              {activationType === 'action' && (
                <ActionChatPanel
                  isConnected={isConnected}
                  account={accountAddress}
                  tokenAddress={token?.address}
                  tokenSymbol={tokenSymbol}
                  onOpen={openChat}
                  onConfirmed={refreshReads}
                />
              )}
              {activationType === 'chain' && (
                <ChainChatPanel
                  isConnected={isConnected}
                  account={accountAddress}
                  tokenSymbol={tokenSymbol}
                  onOpen={openChat}
                  onConfirmed={refreshReads}
                />
              )}
            </section>
          </section>
        </div>
      </main>
    </>
  );
}
