import { useMemo } from 'react';

import type { GroupChatAccountData, GroupChatPublicData } from '@/src/hooks/composite/useGroupChatData';
import { MAX_MENTIONED_SENDER_IDS } from './chatConstants';
import { mentionSenderIdsValidationHint, parseComposerMentions } from './chatUtils';
import { resolveSendAvailability } from './sendAvailability';

export function useChatComposerState({
  groupId,
  account,
  publicData,
  accountData,
  content,
  mentionedSenderIds,
  isPending,
  isConfirming,
}: {
  groupId: bigint | undefined;
  account: `0x${string}` | undefined;
  publicData: GroupChatPublicData;
  accountData: GroupChatAccountData;
  content: string;
  mentionedSenderIds: bigint[];
  isPending: boolean;
  isConfirming: boolean;
}) {
  const activeSenderId = accountData.defaultSenderId;
  const activeSenderName = activeSenderId
    ? publicData.senderNames[activeSenderId.toString()] ||
      (activeSenderId === accountData.defaultSenderId ? accountData.defaultSenderName : '')
    : '';
  const activeCanPost = activeSenderId ? accountData.canPost : false;
  const draftMentions = useMemo(
    () => parseComposerMentions(content, mentionedSenderIds, publicData.senderNames),
    [content, mentionedSenderIds, publicData.senderNames],
  );
  const mentionValidationHint = useMemo(
    () => mentionSenderIdsValidationHint(draftMentions, MAX_MENTIONED_SENDER_IDS),
    [draftMentions],
  );
  const mentionValidationBlocking =
    draftMentions.invalidSenderIds.length > 0 ||
    draftMentions.overLimitCount > 0;
  const sendAvailability = resolveSendAvailability({
    account,
    chatInfo: publicData.chatInfo,
    accountData,
  });
  const needsDefaultSenderSetup = !sendAvailability.canSend && sendAvailability.source === 'defaultNft';
  const sendDisabled =
    !groupId ||
    !sendAvailability.canSend ||
    !content.trim() ||
    mentionedSenderIds.length > MAX_MENTIONED_SENDER_IDS ||
    mentionValidationBlocking ||
    isPending ||
    isConfirming;

  return {
    activeSenderId,
    activeSenderName,
    activeCanPost,
    draftMentions,
    mentionValidationHint,
    mentionValidationBlocking,
    sendAvailability,
    needsDefaultSenderSetup,
    maxMentionedSenderIds: MAX_MENTIONED_SENDER_IDS,
    sendDisabled,
  };
}
