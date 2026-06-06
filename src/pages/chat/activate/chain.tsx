import { useCallback } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import Header from '@/src/components/Header';
import { ChainChatActivationDetail } from '@/src/components/Chat/ChainChatActivationDetail';
import styles from '@/src/components/Chat/ChatPage.module.css';
import { buildChatActivationHref, buildGroupChatDetailHref, invalidateContractReads, parseGroupId } from '@/src/components/Chat/chatUtils';

const ChainChatActivationPage: NextPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address: account, isConnected } = useAccount();
  const groupId = parseGroupId(router.query.groupId);
  const groupNameQuery = Array.isArray(router.query.groupName) ? router.query.groupName[0] : router.query.groupName;
  const chainListUrl = buildChatActivationHref('chain');

  const openChat = useCallback(
    (nextGroupId: bigint) => {
      router.push(buildGroupChatDetailHref(nextGroupId));
    },
    [router],
  );

  const refreshReads = useCallback(() => {
    invalidateContractReads(queryClient);
  }, [queryClient]);

  return (
    <>
      <Header title="激活链群群聊" backUrl={chainListUrl} replaceBack />
      <main className={styles.chatPrototype} data-detail="false">
        <div className={styles.chatWorkspace} data-entry="love20-chat-chain-activation">
          <section className={styles.chatSurface}>
            <section className="workspace-screen" aria-label="链群群聊激活详情">
              <div className="activation-header">
                <div className="screen-heading">
                  <h1>激活链群群聊</h1>
                </div>
              </div>
              <ChainChatActivationDetail
                isConnected={isConnected}
                account={account as `0x${string}` | undefined}
                groupId={groupId}
                groupName={groupNameQuery}
                onOpen={openChat}
                onConfirmed={refreshReads}
              />
            </section>
          </section>
        </div>
      </main>
    </>
  );
};

export default ChainChatActivationPage;
