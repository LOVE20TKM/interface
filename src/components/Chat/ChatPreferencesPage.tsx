'use client';

import { useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import Header from '@/src/components/Header';
import { TokenContext } from '@/src/contexts/TokenContext';
import { cn } from '@/lib/utils';
import styles from './ChatPage.module.css';
import {
  DEFAULT_MESSAGE_PREFERENCES,
  type MessagePreferences,
  readMessagePreferences,
  writeMessagePreferences,
} from './chatStorage';
import { buildChatIndexHref } from './chatUtils';

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ChatPreferencesPage() {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const tokenSymbol = token?.symbol || firstQueryValue(router.query.symbol);
  const [preferences, setPreferences] = useState<MessagePreferences>(DEFAULT_MESSAGE_PREFERENCES);

  useEffect(() => {
    setPreferences(readMessagePreferences());
  }, []);

  const updatePreference = useCallback(<Key extends keyof MessagePreferences,>(
    key: Key,
    value: MessagePreferences[Key],
  ) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value };
      writeMessagePreferences(next);
      return next;
    });
  }, []);

  return (
    <>
      <Header title="我的偏好" backUrl={buildChatIndexHref(tokenSymbol)} replaceBack />
      <main className={styles.chatPrototype} data-detail="false">
        <div className={styles.chatWorkspace} data-entry="love20-chat-preferences">
          <section className={styles.chatSurface}>
            <section className="workspace-screen" aria-label="我的偏好">
              <div className="activation-header">
                <div className="screen-heading">
                  <h1>我的偏好</h1>
                </div>
              </div>
              <section className="workspace-band message-preference-panel preference-page-panel">
                <div className="card-topline">
                  <strong>我的阅读偏好</strong>
                  <span>全部群聊</span>
                </div>
                <div className="field-row activation-choice-row">
                  <label>显示每条消息时间</label>
                  <div className="choice-group">
                    <button
                      className={cn('picker-button inline-flex', preferences.showMessageTimes && 'active')}
                      type="button"
                      onClick={() => updatePreference('showMessageTimes', true)}
                    >
                      开启
                    </button>
                    <button
                      className={cn('picker-button inline-flex', !preferences.showMessageTimes && 'active')}
                      type="button"
                      onClick={() => updatePreference('showMessageTimes', false)}
                    >
                      关闭
                    </button>
                  </div>
                </div>
                <div className="field-row activation-choice-row">
                  <label>显示禁言消息</label>
                  <div className="choice-group">
                    <button
                      className={cn('picker-button inline-flex', preferences.showBannedMessages && 'active')}
                      type="button"
                      onClick={() => updatePreference('showBannedMessages', true)}
                    >
                      开启
                    </button>
                    <button
                      className={cn('picker-button inline-flex', !preferences.showBannedMessages && 'active')}
                      type="button"
                      onClick={() => updatePreference('showBannedMessages', false)}
                    >
                      关闭
                    </button>
                  </div>
                </div>
              </section>
            </section>
          </section>
        </div>
      </main>
    </>
  );
}
