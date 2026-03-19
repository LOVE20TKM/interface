import { Button } from '@/components/ui/button';
import { useAccount, useBlockNumber } from 'wagmi';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

// my hooks
import { useContributed, useLastContributedBlock } from '@/src/hooks/contracts/useLOVE20Launch';
import { useWithdraw } from '@/src/hooks/contracts/useLOVE20Launch';
// my types & funcs
import { formatTokenAmount, formatSeconds } from '@/src/lib/format';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { LaunchInfo } from '@/src/types/love20types';

// my contexts
import { Token } from '@/src/contexts/TokenContext';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

const ContributeInfo: React.FC<{ token: Token | null; launchInfo: LaunchInfo }> = ({ token, launchInfo }) => {
  const { address: account, isConnected } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const router = useRouter();

  const {
    contributed,
    isPending: isContributedPending,
    error: contributedError,
    refetch: refetchContributed,
  } = useContributed(
    token?.address as `0x${string}`,
    isConnected ? (account as `0x${string}`) : `0x0000000000000000000000000000000000000000`,
  );

  // 获取最后一次申购的区块
  const {
    lastContributedBlock,
    isPending: isLastContributedBlockPending,
    error: lastContributedBlockError,
  } = useLastContributedBlock(
    token?.address as `0x${string}`,
    isConnected ? (account as `0x${string}`) : `0x0000000000000000000000000000000000000000`,
  );

  // 计算还剩余几个区块可以撤回
  const WITHDRAW_WAITING_BLOCKS = safeToBigInt(process.env.NEXT_PUBLIC_WITHDRAW_WAITING_BLOCKS || '0');
  const lastContributedBlockNumber = lastContributedBlock ? lastContributedBlock : BigInt(0);
  const currentBlockNumber = blockNumber ? BigInt(blockNumber) : BigInt(0);
  const remainingBlocks = WITHDRAW_WAITING_BLOCKS - (currentBlockNumber - lastContributedBlockNumber);

  // 申购撤回
  const {
    withdraw,
    isPending: isWithdrawPending,
    writeError: errWithdraw,
    isConfirming: isWithdrawConfirming,
    isConfirmed: isWithdrawConfirmed,
  } = useWithdraw();
  const handleWithdraw = async () => {
    await withdraw(token?.address as `0x${string}`);
  };

  // 赎回成功
  useEffect(() => {
    if (isWithdrawConfirmed) {
      toast.success('撤回成功');
      // 刷新 contributed 数据
      refetchContributed();
      // 1秒后跳转到取回页面
      setTimeout(() => {
        router.push(`/launch/?symbol=${token?.symbol}`);
      }, 1000);
    }
  }, [isWithdrawConfirmed]);

  if (!token || isContributedPending || isLastContributedBlockPending) {
    return <LoadingIcon />;
  }

  const parentTokenSymbol =
    token.parentTokenSymbol == process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL
      ? process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL
      : token.parentTokenSymbol;

  return (
    <div className="px-6">
      <LeftTitle title="参与申购" />
      <div className="stats w-full">
        <div className="stat place-items-center">
          <div className="stat-title text-sm mr-6">我的申购质押</div>
          <div className="stat-value text-secondary">
            {formatTokenAmount(contributed || BigInt(0))}
            <span className="text-greyscale-500 font-normal text-sm ml-2">{parentTokenSymbol}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center -mx-2">
        {contributed && contributed > BigInt(0) && (
          <Button
            variant="outline"
            size="sm"
            className="w-1/2 text-secondary border-secondary mx-2"
            onClick={handleWithdraw}
            disabled={isWithdrawPending || isWithdrawConfirming || isWithdrawConfirmed}
          >
            {isWithdrawPending
              ? '提交中...'
              : isWithdrawConfirming
              ? '确认中...'
              : isWithdrawConfirmed
              ? '已撤回'
              : '撤回申购'}
          </Button>
        )}
        <Button variant="outline" size="sm" className="w-1/2 text-secondary border-secondary mx-2" asChild>
          <Link href={`/launch/contribute?symbol=${token?.symbol}`}>
            {contributed && contributed > BigInt(0) ? '增加申购' : '去申购'}
          </Link>
        </Button>
      </div>
      {contributed && contributed > BigInt(0) && remainingBlocks > 0 && (
        <div className="mt-4 text-sm text-greyscale-500 text-center">
          <div>
            申购后需等 {process.env.NEXT_PUBLIC_WITHDRAW_WAITING_BLOCKS} 个区块才能撤回（还需{' '}
            {remainingBlocks > 0 ? remainingBlocks.toString() : '0'} 区块,大约{' '}
            {formatSeconds((Number(remainingBlocks) * Number(process.env.NEXT_PUBLIC_BLOCK_TIME_MS)) / 1000)}）
          </div>
        </div>
      )}
      <div className="border-t border-gray-200 mt-6 mb-6"></div>
      <LoadingOverlay
        isLoading={isWithdrawPending || isWithdrawConfirming}
        text={isWithdrawPending ? '提交交易...' : '确认交易...'}
      />
    </div>
  );
};

export default ContributeInfo;
