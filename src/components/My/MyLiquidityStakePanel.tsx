import { useAccount } from 'wagmi';
import { useContext, useEffect } from 'react';
import { formatTokenAmount } from '@/src/lib/format';

// my hooks
import { useHandleContractError } from '@/src/lib/errorUtils';
import { useAccountStakeStatus } from '@/src/hooks/contracts/useLOVE20Stake';

// my contexts
import { Token, TokenContext } from '@/src/contexts/TokenContext';

// my components
import AddToMetamask from '@/src/components/Common/AddToMetamask';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

interface MyLiquidityStakePanelProps {
  token?: Token | null | undefined;
}

const MyLiquidityStakePanel: React.FC<MyLiquidityStakePanelProps> = ({ token: propToken }) => {
  const { address: account } = useAccount();

  // 如果没有传入 token，则从 context 获取
  const context = useContext(TokenContext);
  const { token: contextToken, setToken, clearToken } = context || {};
  const token = propToken || contextToken;

  // Hook：获取质押状态
  const {
    slAmount,
    govVotes,
    isPending: isPendingAccountStakeStatus,
    error: errorAccountStakeStatus,
  } = useAccountStakeStatus(token?.address as `0x${string}`, account as `0x${string}`);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorAccountStakeStatus) {
      handleContractError(errorAccountStakeStatus, 'stake');
    }
  }, [errorAccountStakeStatus, handleContractError]);

  if (!account) {
    return <div className="text-sm mt-4 text-greyscale-500 text-center">请先连接钱包</div>;
  }

  if (!token || isPendingAccountStakeStatus) {
    return <LoadingIcon />;
  }

  if (!isPendingAccountStakeStatus && !slAmount) {
    return <></>;
  }

  return (
    <div className="flex-col items-center px-4 py-2 mb-4">
      <div className="stats bg-gray-100  w-full grid grid-cols-[1fr_2fr] divide-x-0 pt-4">
        <div className="stat place-items-center pt-0">
          <div className="stat-title text-sm">我的治理票数</div>
          <div className="stat-value text-xl">
            {isPendingAccountStakeStatus ? <LoadingIcon /> : formatTokenAmount(govVotes || BigInt(0))}
          </div>
        </div>
        <div className="stat place-items-center pt-0 pl-1">
          <div className="stat-title text-sm flex items-center">
            流动性质押凭证SL代币
            <AddressWithCopyButton address={token.slTokenAddress as `0x${string}`} showAddress={false} />
            <AddToMetamask
              tokenAddress={token.slTokenAddress as `0x${string}`}
              tokenSymbol={'sl' + token.symbol}
              tokenDecimals={token.decimals}
            />
          </div>
          <div className="stat-value text-xl">
            {isPendingAccountStakeStatus ? <LoadingIcon /> : formatTokenAmount(slAmount || BigInt(0))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyLiquidityStakePanel;
