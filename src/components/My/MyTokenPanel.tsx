import { useAccount, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// my funcs
import { formatTokenAmount } from '@/src/lib/format';

// my contexts
import { Token } from '@/src/contexts/TokenContext';

// my hooks
import { useBalanceOf } from '@/src/hooks/contracts/useLOVE20Token';
import { useLPBalance } from '@/src/hooks/contracts/useUniswapV2Pair';
import { useUSDTPairAddress } from '@/src/hooks/composite/useUSDTPairAddress';
// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';
import AddToMetamask from '@/src/components/Common/AddToMetamask';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

interface AssetItemProps {
  title: string;
  value: bigint;
  isLoading: boolean;
  className?: string;
  tokenAddress?: `0x${string}`;
  tokenSymbol?: string;
  tokenDecimals?: number;
  isUniswapV2Lp?: boolean;
}

const AssetItem: React.FC<AssetItemProps> = ({
  title,
  value,
  isLoading,
  className,
  tokenAddress,
  tokenSymbol,
  tokenDecimals,
  isUniswapV2Lp,
}) => {
  return (
    <div className={`flex flex-col justify-center px-4 py-4 min-w-0 ${className || ''}`}>
      <div className="text-center text-xl font-semibold break-all">
        {isLoading ? <LoadingIcon /> : formatTokenAmount(value)}
      </div>
      <div className="mt-2 flex items-center justify-center gap-1 text-center text-xs font-mono leading-5 text-gray-500 break-words min-w-0">
        <span className="break-all">{title}</span>
        {tokenAddress && tokenSymbol && tokenDecimals !== undefined && (
          <AddToMetamask
            tokenAddress={tokenAddress}
            tokenSymbol={tokenSymbol}
            tokenDecimals={tokenDecimals}
            isUniswapV2Lp={isUniswapV2Lp}
          />
        )}
      </div>
    </div>
  );
};

const MyTokenPanel: React.FC<{ token: Token | null | undefined }> = ({ token }) => {
  const { address: account } = useAccount();
  const nativeSymbol = process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL || 'TKM';
  const {
    pairAddress: usdtLpPairAddress,
    usdtAddress,
    usdtSymbol: configuredUsdtSymbol,
    isLoading: isLoadingUsdtLpPair,
  } = useUSDTPairAddress(token?.address);
  const usdtSymbol = configuredUsdtSymbol || 'TUSDT';

  // 获取 TKM 余额
  const { data: nativeBalance, isLoading: isLoadingNativeBalance } = useBalance({
    address: account,
    query: {
      enabled: !!account,
    },
  });

  // 获取 TUSDT 余额
  const { balance: usdtBalance, isPending: isPendingUsdtBalance } = useBalanceOf(
    (usdtAddress || ZERO_ADDRESS) as `0x${string}`,
    account as `0x${string}`,
    !!usdtAddress,
  );

  // 获取代币余额
  const { balance, isPending: isPendingBalance } = useBalanceOf(
    token?.address as `0x${string}`,
    account as `0x${string}`,
    !!token?.address,
  );

  // 获取父币余额
  const { balance: parentTokenBalance, isPending: isPendingParentTokenBalance } = useBalanceOf(
    token?.parentTokenAddress as `0x${string}`,
    account as `0x${string}`,
    !!token?.parentTokenAddress,
  );

  // 获取当前代币/父币 LP 余额
  const { lpBalance: parentLpBalance, isLoading: isLoadingParentLpBalance } = useLPBalance(
    token?.uniswapV2PairAddress as `0x${string}`,
    account as `0x${string}`,
  );

  // 获取当前代币/TUSDT LP 地址与余额
  const { lpBalance: usdtLpBalance, isLoading: isLoadingUsdtLpBalance } = useLPBalance(
    usdtLpPairAddress,
    account as `0x${string}`,
  );

  if (!token) {
    return <LoadingIcon />;
  }
  if (!account) {
    return (
      <>
        <div className="flex-col items-center px-4 py-2">
          <LeftTitle title="我的代币余额" />
          <div className="text-sm mt-4 text-greyscale-500 text-center">请先连接钱包</div>
        </div>
      </>
    );
  }

  return (
    <div className="flex-col items-center px-4 py-2">
      <div className="flex justify-between items-center">
        <LeftTitle title="我的代币余额" />
        <Button variant="link" className="text-secondary border-secondary" asChild>
          <Link href={`/token/transfer?symbol=${token.symbol}`}>转账</Link>
        </Button>
      </div>
      <div className="mt-2 overflow-hidden rounded-lg bg-gray-100">
        <div className="grid grid-cols-2">
          <AssetItem
            title={nativeSymbol}
            value={nativeBalance?.value || BigInt(0)}
            isLoading={isLoadingNativeBalance}
            className="border-b border-r border-gray-200"
          />
          <AssetItem
            title={usdtSymbol}
            value={usdtBalance || BigInt(0)}
            isLoading={isPendingUsdtBalance}
            className="border-b border-gray-200"
            tokenAddress={usdtAddress}
            tokenSymbol={usdtSymbol}
            tokenDecimals={18}
          />
          <AssetItem
            title={token.symbol}
            value={balance || BigInt(0)}
            isLoading={isPendingBalance}
            className="border-b border-r border-gray-200"
            tokenAddress={token.address as `0x${string}`}
            tokenSymbol={token.symbol}
            tokenDecimals={token.decimals}
          />
          <AssetItem
            title={token.parentTokenSymbol}
            value={parentTokenBalance || BigInt(0)}
            isLoading={isPendingParentTokenBalance}
            className="border-b border-gray-200"
            tokenAddress={token.parentTokenAddress as `0x${string}`}
            tokenSymbol={token.parentTokenSymbol}
            tokenDecimals={token.decimals}
          />
          <AssetItem
            title={`LP(${token.symbol}/${token.parentTokenSymbol})`}
            value={parentLpBalance || BigInt(0)}
            isLoading={isLoadingParentLpBalance}
            className="border-r border-gray-200"
            tokenAddress={token.uniswapV2PairAddress !== ZERO_ADDRESS ? (token.uniswapV2PairAddress as `0x${string}`) : undefined}
            tokenSymbol={`LP(${token.symbol}/${token.parentTokenSymbol})`}
            tokenDecimals={18}
            isUniswapV2Lp={true}
          />
          <AssetItem
            title={`LP(${token.symbol}/${usdtSymbol})`}
            value={usdtLpBalance || BigInt(0)}
            isLoading={isLoadingUsdtLpPair || isLoadingUsdtLpBalance}
            tokenAddress={usdtLpPairAddress}
            tokenSymbol={`LP(${token.symbol}/${usdtSymbol})`}
            tokenDecimals={18}
            isUniswapV2Lp={true}
          />
        </div>
      </div>
    </div>
  );
};

export default MyTokenPanel;
