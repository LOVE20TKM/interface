import type { NextPage } from 'next';
import { useRouter } from 'next/router';

import Header from '@/src/components/Header';
import { MentionMeMessagesPanel } from '@/src/components/Chat/MentionMeMessagesPanel';
import styles from '@/src/components/Chat/ChatPage.module.css';
import {
  buildChatIndexHref,
  buildGroupChatDetailHref,
  parseGroupId,
} from '@/src/components/Chat/chatUtils';

const GroupChatMentionMePage: NextPage = () => {
  const router = useRouter();
  const groupId = parseGroupId(router.query.groupId);
  const backUrl = groupId ? buildGroupChatDetailHref(groupId) : buildChatIndexHref();

  return (
    <>
      <Header title="@我" backUrl={backUrl} replaceBack />
      <main className={styles.chatPrototype} data-detail="false" data-entry="love20-chat-mention-me">
        {groupId ? (
          <MentionMeMessagesPanel groupId={groupId} />
        ) : (
          <section className="workspace-screen mention-all-list-screen">
            <section className="workspace-band">
              <div className="empty-state">缺少 groupId，无法打开 @我 消息列表。</div>
            </section>
          </section>
        )}
      </main>
    </>
  );
};

export default GroupChatMentionMePage;
