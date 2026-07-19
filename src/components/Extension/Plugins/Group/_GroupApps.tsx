'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { ArrowRight, MessageCircle, Users } from 'lucide-react';

import { buildChatChainActivationHref, buildGroupChatDetailHref } from '@/src/components/Chat/chatUtils';
import { isGroupChatEnabled, useGroupChatActivationStatusMap } from '@/src/hooks/contracts/useGroupChat';

interface GroupAppsProps {
  groupId: bigint;
  actionId: bigint;
  groupName?: string;
}

const _GroupApps: React.FC<GroupAppsProps> = ({ groupId, actionId, groupName }) => {
  const router = useRouter();
  const {
    activationStatusMap,
    isPending: isActivationStatusPending,
    error: activationStatusError,
  } = useGroupChatActivationStatusMap([groupId]);
  const activationStatus = activationStatusMap.get(groupId.toString());
  const isActivationStatusUnavailable =
    !isGroupChatEnabled || (activationStatus === undefined && isActivationStatusPending);
  const chatButtonTitle = !isGroupChatEnabled
    ? '当前环境未配置 GroupChat 合约'
    : activationStatusError
      ? '群聊状态读取失败，点击进入后重试'
      : isActivationStatusPending
        ? '正在读取群聊状态'
        : undefined;

  const handleTrialClick = () => {
    const { symbol } = router.query;
    router.push(
      `/extension/group_trial?groupId=${groupId.toString()}&actionId=${actionId.toString()}${
        symbol ? `&symbol=${symbol}` : ''
      }`,
    );
  };

  const handleChatClick = () => {
    if (!isGroupChatEnabled || isActivationStatusPending) return;
    router.push(
      activationStatus
        ? buildGroupChatDetailHref(groupId)
        : buildChatChainActivationHref(groupId, groupName),
    );
  };

  return (
    <div className="bg-white rounded-lg px-4 py-2 space-y-3">
      <div
        onClick={handleTrialClick}
        className="flex items-center justify-between py-3 px-4 border border-greyscale-200 rounded-lg hover:border-secondary hover:bg-secondary/5 transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-secondary" />
          <div>
            <div className="text-base font-medium">体验模式</div>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-greyscale-400 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
      </div>

      <button
        type="button"
        onClick={handleChatClick}
        disabled={isActivationStatusUnavailable}
        title={chatButtonTitle}
        className="flex w-full items-center justify-between py-3 px-4 border border-greyscale-200 rounded-lg text-left transition-all group hover:border-secondary hover:bg-secondary/5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-secondary" />
          <div>
            <div className="text-base font-medium">链群群聊</div>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-greyscale-400 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
      </button>
    </div>
  );
};

export default _GroupApps;
