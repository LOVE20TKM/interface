import { useMemo } from 'react';

import { useGroupChatCanPost } from '@/src/hooks/contracts/useGroupChat';
import type { GroupChatRoomData } from '@/src/hooks/composite/useGroupChatData';
import { MAX_MENTIONED_SENDER_IDS } from './chatConstants';
import { mentionSenderIdsValidationHint, parseComposerMentions } from './chatUtils';

export function useChatComposerState({
  groupId,
  account,
  room,
  content,
  mentionedSenderIds,
  isPending,
  isConfirming,
}: {
  groupId: bigint | undefined;
  account: `0x${string}` | undefined;
  room: GroupChatRoomData;
  content: string;
  mentionedSenderIds: bigint[];
  isPending: boolean;
  isConfirming: boolean;
}) {
  const activeSenderId = room.defaultSenderId;
  const activeSenderName = activeSenderId
    ? room.senderNames[activeSenderId.toString()] || (activeSenderId === room.defaultSenderId ? room.defaultSenderName : '')
    : '';
  const activeCanPostQuery = useGroupChatCanPost(
    groupId,
    activeSenderId,
    account,
    !!account && !!activeSenderId,
  );
  const activeCanPost = activeSenderId ? activeCanPostQuery.canPost : false;
  const activeCanPostReasonCode = activeCanPostQuery.reasonCode;
  const draftMentions = useMemo(
    () => parseComposerMentions(content, mentionedSenderIds, room.senderNames),
    [content, mentionedSenderIds, room.senderNames],
  );
  const mentionValidationHint = useMemo(
    () => mentionSenderIdsValidationHint(draftMentions, MAX_MENTIONED_SENDER_IDS),
    [draftMentions],
  );
  const mentionValidationBlocking =
    draftMentions.invalidSenderIds.length > 0 ||
    draftMentions.overLimitCount > 0;
  const needsDefaultSenderSetup = !!account && !room.isDefaultSenderPending && !room.hasDefaultSender;
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
    !room.chatInfo?.postingAllowed;

  return {
    activeSenderId,
    activeSenderName,
    activeCanPostQuery,
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
