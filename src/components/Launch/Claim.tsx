import { useContext, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import toast from 'react-hot-toast';

// my hooks
import { formatTokenAmount } from '@/src/lib/format';
import { LaunchInfo } from '@/src/types/love20types';
import { useContributed, useClaimInfo, useClaim } from '@/src/hooks/contracts/useLOVE20Launch';

// my context
import { Token, TokenContext } from '@/src/contexts/TokenContext';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

const Claim: React.FC<{ token: Token; launchInfo: LaunchInfo }> = ({ token, launchInfo }) => {
  const { address: account } = useAccount();
  const { clearToken } = useContext(TokenContext) || {};

  // 读取数据的hooks
  const {
    contributed,
    isPending: isContributedPending,
    error: contributedError,
  } = useContributed(token?.address as `0x${string}`, account as `0x${string}`);
  const {
    receivedTokenAmount,
    extraRefund,
    isClaimed: claimed,
    isPending: isClaimInfoPending,
    error: claimInfoError,
  } = useClaimInfo(token?.address as `0x${string}`, account as `0x${string}`);

  // 领取代币hook
  const {
    claim,
    isPending: isClaiming,
    writeError: claimError,
    isConfirming: isClaimConfirming,
    isConfirmed: isClaimConfirmed,
  } = useClaim();

  // 领取代币
  const handleClaim = async () => {
    try {
      await claim(token?.address as `0x${string}`);
    } catch (error) {
      console.error('领取失败:', error);
    }
  };

  // 领取成功
  useEffect(() => {
    if (isClaimConfirmed) {
      toast.success(`领取成功`);
      clearToken?.();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else if (claimError) {
      toast.error(`领取失败`);
    }
  }, [isClaimConfirmed, claimError]);

  console.log('contributed', contributed);

  if (!account) {
    return '';
  }
  if (isClaimInfoPending || isContributedPending || !token) {
    return <LoadingIcon />;
  }

  const ifFirstToken = token.parentTokenSymbol == process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL;
  const parentTokenSymbol = ifFirstToken ? process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL : token.parentTokenSymbol;

  return (
    <div className="px-4 mt-2">
      <div className="flex justify-between items-center mb-2">
        <LeftTitle title="我的申购" />
        <Button variant="link" className="text-secondary border-secondary underline shrink-0" asChild>
          <Link href={`/launch/burn?symbol=${token?.symbol}`}>换回父币 &gt;&gt;</Link>
        </Button>
      </div>

      <div className="stats w-full">
        <div className="stat place-items-center">
          <div className="stat-title text-sm mr-6">共获得</div>
          <div className="stat-value text-3xl text-secondary">
            {formatTokenAmount(receivedTokenAmount ?? BigInt(0))}
            <span className="text-greyscale-500 font-normal text-sm ml-2">{token.symbol}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        {Number(contributed) <= 0 ||
          (!contributed && (
            <Button className="w-1/2" disabled>
              未申购
            </Button>
          ))}
        {Number(contributed) > 0 && !claimed && (
          <Button
            className="w-1/2"
            onClick={handleClaim}
            disabled={isClaiming || isClaimConfirming || isClaimConfirmed}
          >
            {isClaiming ? '领取中...' : isClaimConfirming ? '确认中...' : isClaimConfirmed ? '已领取' : '领取'}
          </Button>
        )}
        {Number(contributed) > 0 && claimed && (
          <Button className="w-1/2" disabled>
            已领取
          </Button>
        )}
      </div>
      {Number(contributed) > 0 && claimed && (
        <div className="text-center text-sm my-2 text-greyscale-400">
          我共申购了 <span className="text-secondary">{formatTokenAmount(contributed ?? BigInt(0))} </span>
          {parentTokenSymbol}，申购返还了{' '}
          <span className="text-secondary">{formatTokenAmount(extraRefund ?? BigInt(0))}</span>{' '}
          {token.parentTokenSymbol}
          {token.parentTokenSymbol == process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL && (
            <Link
              href={`/dex/swap?from=${token.parentTokenSymbol}&to=${process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL}`}
              className="text-secondary ml-1"
            >
              （转回 {process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL}）
            </Link>
          )}
        </div>
      )}
      <div className="border-t border-gray-200 mx-4 mt-4 mb-6"></div>

      <LoadingOverlay isLoading={isClaiming || isClaimConfirming} text={isClaiming ? '提交交易...' : '确认交易...'} />
    </div>
  );
};

export default Claim;
