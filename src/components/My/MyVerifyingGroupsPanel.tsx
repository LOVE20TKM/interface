'use client';
import React, { useContext, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// Hooks
import { useMyGroupIdsNeedVerifiedByRound } from '@/src/hooks/extension/plugins/group/composite/useMyGroupIdsNeedVerifiedByRound';

// Components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';
import RoundLite from '@/src/components/Common/RoundLite';

interface MyVerifyingGroupsPanelProps {
  currentRound: bigint; // This is verify round (vote round - 2)
}

const MyVerifyingGroupsPanel: React.FC<MyVerifyingGroupsPanelProps> = ({ currentRound }) => {
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // Fetch groups that need verification
  const { groups, isPending, error } = useMyGroupIdsNeedVerifiedByRound({
    account: account as `0x${string}`,
    round: currentRound,
  });

  // Calculate counts
  const verifiedCount = useMemo(() => groups.filter((g) => g.isVerified).length, [groups]);

  const unverifiedCount = useMemo(() => groups.filter((g) => g.isVerified === false).length, [groups]);

  const firstUnverifiedGroup = useMemo(() => groups.find((g) => g.isVerified === false), [groups]);

  // Determine button configuration
  const getButtonConfig = () => {
    if (groups.length === 0) {
      return {
        text: '没有需验证的链群',
        disabled: true,
        href: null,
      };
    }

    if (unverifiedCount === 0) {
      return {
        text: '已验证',
        disabled: true,
        href: null,
      };
    }

    if (unverifiedCount === 1 && firstUnverifiedGroup) {
      return {
        text: '去验证',
        disabled: false,
        href: `/extension/group_op/?actionId=${firstUnverifiedGroup.actionId}&groupId=${firstUnverifiedGroup.groupId}&op=verify`,
      };
    }

    // unverifiedCount > 1
    return {
      text: '去验证',
      disabled: false,
      href: `/extension/my_verifying_groups?symbol=${token?.symbol}`,
    };
  };

  const buttonConfig = getButtonConfig();

  if (!token) {
    return '';
  }

  if (!account) {
    return (
      <>
        <div className="flex-col items-center px-0 py-2">
          <LeftTitle title="我的链群" />
          <div className="text-sm mt-4 text-greyscale-500 text-center">请先连接钱包</div>
        </div>
      </>
    );
  }

  return (
    <div className="flex-col items-center px-0 py-2">
      <div className="flex justify-between items-center mb-2">
        <LeftTitle title="我的链群" />
        <Button variant="link" className="text-secondary border-secondary" asChild>
          <Link href={`/extension/my_verifying_groups?symbol=${token?.symbol}`}>查看链群 &gt;&gt;</Link>
        </Button>
      </div>
      <div className="stats w-full grid grid-cols-2 divide-x-0">
        <div className="stat place-items-center pt-1 pb-2">
          <div className="stat-title text-sm">已验证链群</div>
          <div className="stat-value text-xl">{isPending ? <LoadingIcon /> : verifiedCount}</div>
        </div>
        <div className="stat place-items-center pt-0 pb-2">
          <div className="stat-title text-sm">待验证链群</div>
          <div className="stat-value text-xl">{isPending ? <LoadingIcon /> : unverifiedCount}</div>
        </div>
      </div>
      <div className="flex justify-center">
        {isPending ? (
          <LoadingIcon />
        ) : buttonConfig.href ? (
          <Button className="w-1/2" asChild>
            <Link href={buttonConfig.href}>{buttonConfig.text}</Link>
          </Button>
        ) : (
          <Button disabled className="w-1/2">
            {buttonConfig.text}
          </Button>
        )}
      </div>
      <div className="flex justify-center mt-2">
        <RoundLite currentRound={currentRound} roundType="verify" />
      </div>
    </div>
  );
};

export default MyVerifyingGroupsPanel;
