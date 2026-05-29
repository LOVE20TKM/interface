import { useCallback, useContext } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import Header from '@/src/components/Header';
import { BanListPanel } from '@/src/components/Chat/BanListPanel';
import styles from '@/src/components/Chat/ChatPage.module.css';
import { TokenContext } from '@/src/contexts/TokenContext';
import {
  buildChatIndexHref,
  buildChatRoomHref,
  invalidateContractReads,
  parseGroupId,
  safeBigIntFromString,
} from '@/src/components/Chat/chatUtils';

const ChatBanListPage: NextPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const groupId = parseGroupId(router.query.groupId);
  const rawTarget = Array.isArray(router.query.target) ? router.query.target[0] : router.query.target;
  const rawMessageId = Array.isArray(router.query.messageId) ? router.query.messageId[0] : router.query.messageId;
  const initialMessageId = rawTarget === 'message' ? safeBigIntFromString(rawMessageId) : BigInt(0);
  const tokenSymbol = Array.isArray(router.query.symbol) ? router.query.symbol[0] : router.query.symbol || token?.symbol;
  const backUrl = groupId ? buildChatRoomHref(tokenSymbol, groupId) : buildChatIndexHref(tokenSymbol);

  const refreshAll = useCallback(() => {
    invalidateContractReads(queryClient);
  }, [queryClient]);

  return (
    <>
      <Header title="禁言名单" backUrl={backUrl} replaceBack />
      <main className={styles.chatPrototype}>
        {groupId ? (
          <BanListPanel
            groupId={groupId}
            account={account as `0x${string}` | undefined}
            initialMessageId={initialMessageId > BigInt(0) ? initialMessageId : undefined}
            onChanged={refreshAll}
          />
        ) : (
          <section className="workspace-screen">
            <section className="workspace-band">
              <div className="empty-state">缺少 groupId，无法打开禁言名单页面。</div>
            </section>
          </section>
        )}
      </main>
    </>
  );
};

export default ChatBanListPage;
