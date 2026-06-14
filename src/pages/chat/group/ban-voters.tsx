import { useCallback } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import Header from '@/src/components/Header';
import { GovVotersPanel } from '@/src/components/Chat/GovVotersPanel';
import styles from '@/src/components/Chat/ChatPage.module.css';
import {
  buildChatIndexHref,
  buildGroupChatPanelHref,
  invalidateContractReads,
  parseAddressInput,
  parseGroupId,
  parseSenderId,
} from '@/src/components/Chat/chatUtils';

const GroupChatBanVotersPage: NextPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address: account } = useAccount();
  const groupId = parseGroupId(router.query.groupId);
  const rawTarget = Array.isArray(router.query.target) ? router.query.target[0] : router.query.target;
  const rawAddress = Array.isArray(router.query.address) ? router.query.address[0] : router.query.address;
  const rawSenderId = Array.isArray(router.query.senderId) ? router.query.senderId[0] : router.query.senderId;
  const addressTarget = rawTarget === 'address' ? parseAddressInput(rawAddress || '') : undefined;
  const senderTarget = rawTarget === 'nft' ? parseSenderId(rawSenderId) : undefined;
  const target = addressTarget
    ? { type: 'address' as const, value: addressTarget }
    : senderTarget
      ? { type: 'nft' as const, value: senderTarget }
      : undefined;
  const backUrl = groupId ? buildGroupChatPanelHref('banlist', groupId) : buildChatIndexHref();

  const refreshAll = useCallback(() => {
    invalidateContractReads(queryClient);
  }, [queryClient]);

  return (
    <>
      <Header title="投票列表" backUrl={backUrl} replaceBack />
      <main className={styles.chatPrototype} data-detail="false" data-entry="love20-chat-ban-voters">
        {groupId && target ? (
          <GovVotersPanel
            groupId={groupId}
            account={account as `0x${string}` | undefined}
            target={target}
            onChanged={refreshAll}
          />
        ) : (
          <section className="workspace-screen ban-voters-screen">
            <section className="workspace-band">
              <div className="empty-state">缺少 groupId 或投票目标，无法打开投票列表。</div>
            </section>
          </section>
        )}
      </main>
    </>
  );
};

export default GroupChatBanVotersPage;
