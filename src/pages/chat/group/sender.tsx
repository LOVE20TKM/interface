import type { NextPage } from 'next';
import { useRouter } from 'next/router';

import Header from '@/src/components/Header';
import { SenderMessagesPanel } from '@/src/components/Chat/SenderMessagesPanel';
import styles from '@/src/components/Chat/ChatPage.module.css';
import {
  buildChatIndexHref,
  buildGroupChatDetailHref,
  parseGroupId,
  parseSenderId,
} from '@/src/components/Chat/chatUtils';

const GroupChatSenderPage: NextPage = () => {
  const router = useRouter();
  const groupId = parseGroupId(router.query.groupId);
  const senderId = parseSenderId(router.query.senderId);
  const backUrl = groupId ? buildGroupChatDetailHref(groupId) : buildChatIndexHref();

  return (
    <>
      <Header title="只看Ta" backUrl={backUrl} replaceBack />
      <main className={styles.chatPrototype} data-detail="false" data-entry="love20-chat-sender">
        {groupId && senderId ? (
          <SenderMessagesPanel groupId={groupId} senderId={senderId} />
        ) : (
          <section className="workspace-screen mention-all-list-screen">
            <section className="workspace-band">
              <div className="empty-state">缺少 groupId 或 senderId，无法打开 Ta 的消息列表。</div>
            </section>
          </section>
        )}
      </main>
    </>
  );
};

export default GroupChatSenderPage;
