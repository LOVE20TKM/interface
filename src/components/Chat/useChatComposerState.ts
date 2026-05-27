import { useMemo } from 'react';

import type { GroupChatRoomAccountData, GroupChatRoomPublicData } from '@/src/hooks/composite/useGroupChatData';
import { MAX_MENTIONED_SENDER_IDS } from './chatConstants';
import { mentionSenderIdsValidationHint, parseComposerMentions } from './chatUtils';

export function useChatComposerState({
  groupId,
  account,
  publicRoom,
  accountRoom,
  content,
  mentionedSenderIds,
  isPending,
  isConfirming,
}: {
  groupId: bigint | undefined;
  account: `0x${string}` | undefined;
  publicRoom: GroupChatRoomPublicData;
  accountRoom: GroupChatRoomAccountData;
  content: string;
  mentionedSenderIds: bigint[];
  isPending: boolean;
  isConfirming: boolean;
}) {
  const activeSenderId = accountRoom.defaultSenderId;
  const activeSenderName = activeSenderId
    ? publicRoom.senderNames[activeSenderId.toString()] ||
      (activeSenderId === accountRoom.defaultSenderId ? accountRoom.defaultSenderName : '')
    : '';
  const activeCanPost = activeSenderId ? accountRoom.canPost : false;
  const activeCanPostReasonCode = accountRoom.canPostReasonCode;
  const draftMentions = useMemo(
    () => parseComposerMentions(content, mentionedSenderIds, publicRoom.senderNames),
    [content, mentionedSenderIds, publicRoom.senderNames],
  );
  const mentionValidationHint = useMemo(
    () => mentionSenderIdsValidationHint(draftMentions, MAX_MENTIONED_SENDER_IDS),
    [draftMentions],
  );
  const mentionValidationBlocking =
    draftMentions.invalidSenderIds.length > 0 ||
    draftMentions.overLimitCount > 0;
  const needsDefaultSenderSetup = !!account && !accountRoom.isDefaultSenderPending && !accountRoom.hasDefaultSender;
  const sendDisabled =
    !groupId ||
    !account ||
    !activeSenderId ||
    !activeCanPost ||
    !content.trim() ||
    mentionedSenderIds.length > MAX_MENTIONED_SENDER_IDS ||
    mentionValidationBlocking ||
    isPending ||
    isConfirming ||
    !publicRoom.chatInfo?.postingAllowed;

  return {
    activeSenderId,
    activeSenderName,
    activeCanPost,
    activeCanPostReasonCode,
    draftMentions,
    mentionValidationHint,
    mentionValidationBlocking,
    needsDefaultSenderSetup,
    maxMentionedSenderIds: MAX_MENTIONED_SENDER_IDS,
    sendDisabled,
  };
}
