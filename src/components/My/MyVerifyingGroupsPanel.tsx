'use client';
import React, { useContext, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// Hooks
import { useMyGroupIdsNeedVerifiedByRound } from '@/src/hooks/extension/plugins/group/composite/useMyGroupIdsNeedVerifiedByRound';
import { useMyGroupActionsDistrustInfoOfRound } from '@/src/hooks/extension/plugins/group/composite/useMyGroupActionsDistrustInfoOfRound';
import { useMyCapacityUsageWarnings } from '@/src/hooks/extension/plugins/group/composite/useMyCapacityUsageWarnings';

// Components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';
import RoundLite from '@/src/components/Common/RoundLite';
import AlertBox from '@/src/components/Common/AlertBox';
import { useContractError } from '@/src/errors/useContractError';
import { formatPercentage } from '@/src/lib/format';

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

  // 需要展示的行动维度不信任率（服务者=当前 account）
  const actionPairs = useMemo(() => {
    if (!groups || groups.length === 0) return [];
    const map = new Map<string, { actionId: bigint; extensionAddress: `0x${string}` }>();
    for (const g of groups) {
      const key = `${g.actionId.toString()}-${g.extensionAddress.toLowerCase()}`;
      map.set(key, { actionId: g.actionId, extensionAddress: g.extensionAddress });
    }
    return Array.from(map.values());
  }, [groups]);

  const {
    items: actionDistrustInfos,
    isPending: isPendingActionDistrust,
    error: errorActionDistrust,
  } = useMyGroupActionsDistrustInfoOfRound({
    tokenAddress: token?.address as `0x${string}` | undefined,
    round: currentRound,
    groupOwner: account as `0x${string}` | undefined,
    pairs: actionPairs,
  });

  const warningActionInfos = useMemo(() => {
    return actionDistrustInfos.filter((x) => x.distrustVotes > BigInt(0) && x.distrustRatioPercent > 0);
  }, [actionDistrustInfos]);

  const actionTitleByActionId = useMemo(() => {
    const map = new Map<string, string>();
    for (const info of actionDistrustInfos) {
      map.set(info.actionId.toString(), info.actionTitle);
    }
    return map;
  }, [actionDistrustInfos]);

  const {
    warnItems: capacityUsageWarnItems,
    isPending: isPendingCapacityUsage,
    error: errorCapacityUsage,
  } = useMyCapacityUsageWarnings({
    owner: account as `0x${string}` | undefined,
    pairs: actionPairs,
    thresholdBps: BigInt(9900), // >=99% 红色告警
  });

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (error) handleError(error);
    if (errorActionDistrust) handleError(errorActionDistrust);
    if (errorCapacityUsage) handleError(errorCapacityUsage);
  }, [error, errorActionDistrust, errorCapacityUsage, handleError]);

  // Calculate counts
  const verifiedCount = useMemo(() => groups.filter((g) => g.isVerified).length, [groups]);

  const unverifiedCount = useMemo(() => groups.filter((g) => g.needToVerify).length, [groups]);

  const firstUnverifiedGroup = useMemo(() => groups.find((g) => g.needToVerify), [groups]);

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

      {/* 警告：服务者被投不信任率（按行动维度） */}
      {!isPendingActionDistrust && warningActionInfos.length > 0 && (
        <div className="mb-3">
          <AlertBox
            type="error"
            message={
              <div className="space-y-1 text-red-600">
                {warningActionInfos.map((info) => (
                  <div key={info.actionId.toString()}>
                    <Link
                      href={`/action/info/?symbol=${encodeURIComponent(
                        token?.symbol || '',
                      )}&id=${info.actionId.toString()}&tab=public&tab2=distrust`}
                      className="underline underline-offset-2 hover:text-red-700"
                    >
                      你在行动“No.{info.actionId.toString()} {info.actionTitle}”中被投不信任票，不信任率
                      {formatPercentage(info.distrustRatioPercent)}；
                    </Link>
                  </div>
                ))}
              </div>
            }
          />
        </div>
      )}

      {/* 警告：最大容量使用率>=99%（按行动维度） */}
      {!isPendingCapacityUsage && capacityUsageWarnItems.length > 0 && (
        <div className="mb-3">
          <AlertBox
            type="error"
            message={
              <div className="space-y-1 text-red-600">
                {capacityUsageWarnItems.map((item) => (
                  <div key={`${item.actionId.toString()}-${item.extensionAddress.toLowerCase()}`}>
                    你的验证票不足！行动“ No.{item.actionId.toString()}{' '}
                    {actionTitleByActionId.get(item.actionId.toString()) || `行动 #${item.actionId.toString()}`}”
                    中最大容量使用率已达&nbsp;
                    {formatPercentage(item.usagePercent)}；
                  </div>
                ))}
              </div>
            }
          />
        </div>
      )}

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
