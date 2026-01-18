'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { ArrowRight, Users, Gift, Bell } from 'lucide-react';

interface GroupAppsProps {
  extensionAddress: `0x${string}`;
  groupId: bigint;
  actionId: bigint;
}

const _GroupApps: React.FC<GroupAppsProps> = ({ extensionAddress, groupId, actionId }) => {
  const router = useRouter();

  const handleTrialClick = () => {
    const { symbol } = router.query;
    router.push(
      `/extension/group_trial?groupId=${groupId.toString()}&actionId=${actionId.toString()}${
        symbol ? `&symbol=${symbol}` : ''
      }`,
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

      {/* 链群红包 - 未实现，置灰 */}
      <div className="flex items-center justify-between py-3 px-4 border border-greyscale-200 rounded-lg opacity-50 cursor-not-allowed">
        <div className="flex items-center gap-3">
          <Gift className="w-5 h-5 text-greyscale-400" />
          <div>
            <div className="text-base font-medium text-greyscale-400">链群红包</div>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-greyscale-400" />
      </div>

      {/* 链群通知 - 未实现，置灰 */}
      <div className="flex items-center justify-between py-3 px-4 border border-greyscale-200 rounded-lg opacity-50 cursor-not-allowed">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-greyscale-400" />
          <div>
            <div className="text-base font-medium text-greyscale-400">链群通知</div>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-greyscale-400" />
      </div>
    </div>
  );
};

export default _GroupApps;
