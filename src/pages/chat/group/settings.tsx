import { useCallback } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import Header from '@/src/components/Header';
import { ChatSettingsPanel } from '@/src/components/Chat/ChatSettingsPanel';
import styles from '@/src/components/Chat/ChatPage.module.css';
import { buildChatIndexHref, buildGroupChatDetailHref, invalidateContractReads, parseGroupId } from '@/src/components/Chat/chatUtils';

const GroupChatSettingsPage: NextPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address: account } = useAccount();
  const groupId = parseGroupId(router.query.groupId);
  const backUrl = groupId ? buildGroupChatDetailHref(groupId) : buildChatIndexHref();

  const refreshAll = useCallback(() => {
    invalidateContractReads(queryClient);
  }, [queryClient]);

  return (
    <>
      <Header title="群设置" backUrl={backUrl} replaceBack />
      <main className={styles.chatPrototype} data-detail="false">
        {groupId ? (
          <ChatSettingsPanel
            groupId={groupId}
            account={account as `0x${string}` | undefined}
            onChanged={refreshAll}
          />
        ) : (
          <section className="workspace-screen">
            <section className="workspace-band">
              <div className="empty-state">缺少 groupId，无法打开群设置页面。</div>
            </section>
          </section>
        )}
      </main>
    </>
  );
};

export default GroupChatSettingsPage;
