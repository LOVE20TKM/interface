import type { NextPage } from 'next';
import { useRouter } from 'next/router';

import Header from '@/src/components/Header';
import { MessageDetailPanel } from '@/src/components/Chat/MessageDetailPanel';
import styles from '@/src/components/Chat/ChatPage.module.css';
import {
  buildChatIndexHref,
  buildGroupChatDetailHref,
  parseGroupId,
  safeBigIntFromString,
} from '@/src/components/Chat/chatUtils';

const GroupChatMessagePage: NextPage = () => {
  const router = useRouter();
  const groupId = parseGroupId(router.query.groupId);
  const rawMessageId = Array.isArray(router.query.messageId) ? router.query.messageId[0] : router.query.messageId;
  const messageId = safeBigIntFromString(rawMessageId);
  const backUrl = groupId ? buildGroupChatDetailHref(groupId) : buildChatIndexHref();

  return (
    <>
      <Header title="消息详情" backUrl={backUrl} replaceBack />
      <main className={styles.chatPrototype} data-detail="false" data-entry="love20-chat-message-detail">
        {groupId && messageId > BigInt(0) ? (
          <MessageDetailPanel groupId={groupId} messageId={messageId} />
        ) : (
          <section className="workspace-screen message-detail-screen">
            <section className="workspace-band">
              <div className="empty-state">缺少 groupId 或 messageId，无法打开消息详情。</div>
            </section>
          </section>
        )}
      </main>
    </>
  );
};

export default GroupChatMessagePage;
