'use client';

import { useMemo, useState } from 'react';
import useTokenContext from '@/src/hooks/context/useTokenContext';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import SwapForm from './SwapForm/SwapForm';
import SwapInfo from './SwapInfo/SwapInfo';
import { SwapPanelProps } from './utils/swapTypes';
import { buildSupportedTokens } from './utils/swapConfig';
import { useTokenSelection } from './hooks/useTokenSelection';
import { useSwapLogic } from './hooks/useSwapLogic';

const SwapPanel = ({ showCurrentToken = true }: SwapPanelProps) => {
  const { token } = useTokenContext();
  const [watchFromAmount, setWatchFromAmount] = useState('');

  // 构建支持的代币列表
  const supportedTokens = useMemo(() => {
    return buildSupportedTokens(token, showCurrentToken);
  }, [token, showCurrentToken]);

  // 代币选择管理
  const { fromToken, toToken, setFromToken, setToToken, handleSwapTokens } = useTokenSelection(supportedTokens, token);

  // 交换逻辑管理
  const swapLogic = useSwapLogic(fromToken, toToken);

  // 加载状态检查
  if (!token) {
    return <LoadingIcon />;
  }

  if (supportedTokens.length === 0) {
    return (
      <div className="p-6">
        <LeftTitle title="兑换" />
        <div className="text-center text-greyscale-500 mt-4">正在加载代币信息...</div>
      </div>
    );
  }

  const isLoadingOverlay = swapLogic.isApproving || swapLogic.isSwapping;

  return (
    <div className="py-6 px-2">
      <LeftTitle title="兑换代币" />
      <div className="w-full max-w-md mt-4 md:max-w-2xl lg:max-w-4xl mx-auto">
        <SwapForm
          fromToken={fromToken}
          toToken={toToken}
          supportedTokens={supportedTokens}
          onFromTokenChange={setFromToken}
          onToTokenChange={setToToken}
          onFromAmountChange={swapLogic.setFromAmount}
          onFromAmountStringChange={setWatchFromAmount}
          onSwapTokens={handleSwapTokens}
          {...swapLogic}
        />

        <SwapInfo
          fromToken={fromToken}
          toToken={toToken}
          fromAmount={swapLogic.fromAmount}
          toAmount={swapLogic.toAmount}
          watchFromAmount={watchFromAmount}
          swapMethod={swapLogic.swapMethod}
          amountsOutError={swapLogic.amountsOutError}
        />
      </div>

      <LoadingOverlay isLoading={isLoadingOverlay} text={swapLogic.isApproving ? '授权中...' : '兑换中...'} />
    </div>
  );
};

export default SwapPanel;
