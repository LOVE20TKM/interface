import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { useAccount, useBlockNumber } from 'wagmi';

import { Token } from '@/src/contexts/TokenContext';
import LeftTitle from '@/src/components/Common/LeftTitle';

// my hooks
import { useLaunchInfo, useRemainingLaunchCount } from '@/src/hooks/contracts/useLOVE20Launch';
import { useNumOfMintGovRewardByAccount } from '@/src/hooks/contracts/useLOVE20Mint';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatTokenAmount } from '@/src/lib/format';
import { safeToBigInt } from '@/src/lib/clientUtils';

const Todeploy: React.FC<{ token: Token }> = ({ token }) => {
  // 获取当前区块号和个人地址
  const { data: blockNumber } = useBlockNumber();
  const { address: account } = useAccount();

  // 获取发射信息
  const {
    launchInfo,
    isPending: isLaunchInfoPending,
    error: launchInfoError,
  } = useLaunchInfo(token ? token.address : '0x0000000000000000000000000000000000000000');

  const { remainingLaunchCount, isPending: isRemainingLaunchCountPending } = useRemainingLaunchCount(
    token ? token.address : '0x0000000000000000000000000000000000000000',
    account as `0x${string}`,
  );

  const { numOfMintGovRewardByAccount, isPending: isNumOfMintGovRewardByAccountPending } =
    useNumOfMintGovRewardByAccount(
      token ? token.address : '0x0000000000000000000000000000000000000000',
      account as `0x${string}`,
    );

  // 错误处理
  const { handleContractError } = useHandleContractError();
  React.useEffect(() => {
    if (launchInfoError) {
      handleContractError(launchInfoError, 'launch');
    }
  }, [launchInfoError]);

  if (isLaunchInfoPending || !blockNumber || isRemainingLaunchCountPending || isNumOfMintGovRewardByAccountPending) {
    return <></>;
  }

  // 获取等待铸币次数
  const MIN_GOV_REWARD_MINTS = Number(process.env.NEXT_PUBLIC_MIN_GOV_REWARD_MINTS_TO_LAUNCH) || BigInt(180);
  const remainingMintTimes =
    Number(MIN_GOV_REWARD_MINTS) - (Number(numOfMintGovRewardByAccount ?? 0) % Number(MIN_GOV_REWARD_MINTS));

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-2">
        <LeftTitle title="子币发射" />
        {remainingLaunchCount && remainingLaunchCount && (
          <Button variant="link" className="text-secondary border-secondary" asChild>
            <Link href={`/tokens/children/?symbol=${token?.symbol}`}>子币列表</Link>
          </Button>
        )}
      </div>

      <div className="w-full text-center mb-4">
        {remainingLaunchCount && remainingLaunchCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-1/2 text-secondary border-secondary"
            disabled={remainingLaunchCount === undefined || remainingLaunchCount <= 0}
            asChild
          >
            <Link href={`/launch/deploy?symbol=${token?.symbol}`}>
              <Plus className="w-4 h-4" />
              开启子币公平发射
            </Link>
          </Button>
        ) : (
          <Button disabled className="w-1/2">
            开启子币公平发射
          </Button>
        )}

        <div className="px-4 mt-2 mb-4 text-center">
          <p className="text-greyscale-500 text-sm">
            剩余开启次数：{Number(remainingLaunchCount ?? 0)}次，再完成 {remainingMintTimes}
            次治理激励铸币，可增加1次。（须持有 {token?.symbol}不少于{' '}
            {Number(process.env.NEXT_PUBLIC_SUBMIT_MIN_PER_THOUSAND) / 10}%的治理票才可开启；公平发射募集目标为
            {formatTokenAmount(safeToBigInt(process.env.NEXT_PUBLIC_PARENT_TOKEN_FUNDRAISING_GOAL ?? '0'))}个{' '}
            {token?.symbol}）
          </p>
        </div>
      </div>
    </div>
  );
};

export default Todeploy;
