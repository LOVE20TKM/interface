import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { TokenConfig } from '../utils/swapTypes';
import { getDefaultTokenPair } from '../utils/swapConfig';

export const useTokenSelection = (supportedTokens: TokenConfig[], token: any) => {
  const router = useRouter();

  // 初始化默认代币对
  const defaultPair = getDefaultTokenPair(supportedTokens);
  const [fromToken, setFromToken] = useState<TokenConfig>(
    defaultPair.fromToken || {
      symbol: process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL || '',
      address: 'NATIVE',
      decimals: 18,
      isNative: true,
    }
  );
  const [toToken, setToToken] = useState<TokenConfig>(
    defaultPair.toToken || {
      symbol: process.env.NEXT_PUBLIC_FIRST_TOKEN_SYMBOL || '',
      address: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_FIRST_TOKEN as `0x${string}`) || '0x0000000000000000000000000000000000000000',
      decimals: 18,
      isNative: false,
      isWETH: false,
    }
  );

  // 处理代币切换
  const handleSwapTokens = () => {
    const tempFrom = { ...fromToken };
    const tempTo = { ...toToken };
    setFromToken(tempTo);
    setToToken(tempFrom);
  };

  // 从URL参数初始化代币选择
  useEffect(() => {
    if (!token || supportedTokens.length === 0) return;

    const { from: fromSymbol, to: toSymbol } = router.query;

    let selectedFromToken: TokenConfig | undefined = undefined;
    let selectedToToken: TokenConfig | undefined = undefined;
    let hasUrlParamError = false;

    // 查找 fromToken
    if (fromSymbol && typeof fromSymbol === 'string') {
      selectedFromToken = supportedTokens.find(
        (t) => t.symbol && t.symbol.toLowerCase() === fromSymbol.toLowerCase(),
      );
      if (!selectedFromToken) {
        toast.error(`找不到代币 ${fromSymbol}`);
        hasUrlParamError = true;
      }
    }

    // 查找 toToken
    if (toSymbol && typeof toSymbol === 'string') {
      selectedToToken = supportedTokens.find((t) => t.symbol && t.symbol.toLowerCase() === toSymbol.toLowerCase());
      if (!selectedToToken) {
        toast.error(`找不到代币 ${toSymbol}`);
        hasUrlParamError = true;
      }
    }

    // 检查是否选择了相同的代币
    if (selectedFromToken && selectedToToken && selectedFromToken.address === selectedToToken.address) {
      toast.error('不能选择相同的代币进行兑换');
      hasUrlParamError = true;
      selectedFromToken = undefined;
      selectedToToken = undefined;
    }

    // 设置 fromToken
    if (selectedFromToken) {
      setFromToken(selectedFromToken);
    } else if (supportedTokens[0]) {
      setFromToken(supportedTokens[0]);
    }

    // 设置 toToken
    const finalFromToken = selectedFromToken || supportedTokens[0];
    if (selectedToToken && selectedToToken.address !== finalFromToken?.address) {
      setToToken(selectedToToken);
    } else {
      // 使用默认逻辑
      const { toToken: defaultToToken } = getDefaultTokenPair(supportedTokens);
      if (defaultToToken && defaultToToken.address !== finalFromToken?.address) {
        setToToken(defaultToToken);
      }
    }

    // 清理错误的URL参数
    if (hasUrlParamError) {
      toast.error('已切换为默认代币对儿');
      const newQuery = { ...router.query };
      delete newQuery.from;
      delete newQuery.to;
      router.replace(
        {
          pathname: router.pathname,
          query: newQuery,
        },
        undefined,
        { shallow: true },
      );
    }
  }, [supportedTokens, router, token]);

  return {
    fromToken,
    toToken,
    setFromToken,
    setToToken,
    handleSwapTokens,
  };
};