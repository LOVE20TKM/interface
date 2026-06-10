import type { NextPage } from 'next';
import { useRouter } from 'next/router';

import Header from '@/src/components/Header';
import { MentionAllMessagesPanel } from '@/src/components/Chat/MentionAllMessagesPanel';
import styles from '@/src/components/Chat/ChatPage.module.css';
import {
  buildChatIndexHref,
  buildGroupChatDetailHref,
  parseGroupId,
} from '@/src/components/Chat/chatUtils';

const GroupChatMentionAllPage: NextPage = () => {
  const router = useRouter();
  const groupId = parseGroupId(router.query.groupId);
  const backUrl = groupId ? buildGroupChatDetailHref(groupId) : buildChatIndexHref();

  return (
    <>
      <Header title="@全部" backUrl={backUrl} replaceBack />
      <main className={styles.chatPrototype} data-detail="false" data-entry="love20-chat-mention-all">
        {groupId ? (
          <MentionAllMessagesPanel groupId={groupId} />
        ) : (
          <section className="workspace-screen mention-all-list-screen">
            <section className="workspace-band">
              <div className="empty-state">缺少 groupId，无法打开 @全部 消息列表。</div>
            </section>
          </section>
        )}
      </main>
    </>
  );
};

export default GroupChatMentionAllPage;
