import { useCallback } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import Header from '@/src/components/Header';
import { AdminsPanel } from '@/src/components/Chat/AdminsPanel';
import styles from '@/src/components/Chat/ChatPage.module.css';
import { buildChatIndexHref, buildGroupChatDetailHref, buildGroupChatPanelHref, invalidateContractReads, parseGroupId } from '@/src/components/Chat/chatUtils';

const GroupChatAdminsPage: NextPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address: account } = useAccount();
  const groupId = parseGroupId(router.query.groupId);
  const source = Array.isArray(router.query.from) ? router.query.from[0] : router.query.from;
  const backUrl = groupId
    ? source === 'settings'
      ? buildGroupChatPanelHref('settings', groupId)
      : buildGroupChatDetailHref(groupId)
    : buildChatIndexHref();

  const refreshAll = useCallback(() => {
    invalidateContractReads(queryClient);
  }, [queryClient]);

  return (
    <>
      <Header title="管理员" backUrl={backUrl} replaceBack />
      <main className={styles.chatPrototype} data-detail="false">
        {groupId ? (
          <AdminsPanel
            groupId={groupId}
            account={account as `0x${string}` | undefined}
            onChanged={refreshAll}
          />
        ) : (
          <section className="workspace-screen">
            <section className="workspace-band">
              <div className="empty-state">缺少 groupId，无法打开管理员页面。</div>
            </section>
          </section>
        )}
      </main>
    </>
  );
};

export default GroupChatAdminsPage;
