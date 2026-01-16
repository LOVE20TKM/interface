import { useState, useEffect, useCallback, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useDebouncedCallback } from 'use-debounce';

// my hooks
import { useTokenDetails, useTokensByPage, useChildTokensByPage } from '@/src/hooks/contracts/useLOVE20TokenViewer';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatPercentage } from '@/src/lib/format';
import { NavigationUtils } from '@/src/lib/navigationUtils';
// my contexts
import { Token, TokenContext } from '@/src/contexts/TokenContext';

// my types
import { TokenInfo } from '@/src/types/love20types';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';

const PAGE_SIZE = 50;

interface TokenListProps {
  parentTokenAddress?: `0x${string}`;
}

// 扩展的 Token 类型，包含发射进度信息
interface TokenWithLaunchInfo extends Token {
  totalContributed?: bigint;
  parentTokenFundraisingGoal?: bigint;
}

export default function TokenList({ parentTokenAddress }: TokenListProps) {
  const { token: currentToken } = useContext(TokenContext) || {};

  const [start, setStart] = useState<bigint>(BigInt(0));
  const [end, setEnd] = useState<bigint>(BigInt(PAGE_SIZE));
  const [allTokens, setAllTokens] = useState<TokenWithLaunchInfo[]>([]);

  // 初始化时重置 allTokens
  useEffect(() => {
    setAllTokens([]);
    setStart(BigInt(0));
    setEnd(BigInt(PAGE_SIZE));
  }, [parentTokenAddress]); // 当 parentTokenAddress 改变时也重置

  // 获取token列表
  const tokensResult = parentTokenAddress
    ? useChildTokensByPage(parentTokenAddress, start, end)
    : useTokensByPage(start, end);

  const tokenAddresses = 'childTokens' in tokensResult ? tokensResult.childTokens : tokensResult.tokens;
  const isLoadingTokens = tokensResult.isPending;
  const tokensError = tokensResult.error;

  // 获取tokens详情
  const {
    tokens,
    launchInfos,
    isPending: isLoadingDetails,
    error: detailsError,
  } = useTokenDetails(tokenAddresses || []);

  useEffect(() => {
    if (tokenAddresses && tokens && launchInfos) {
      const newTokens: TokenWithLaunchInfo[] = tokens.map((token: TokenInfo, index: number) => ({
        name: token.name,
        symbol: token.symbol,
        address: tokenAddresses[index],
        decimals: Number(token.decimals),
        parentTokenAddress: launchInfos[index].parentTokenAddress,
        parentTokenSymbol: token.parentTokenSymbol,
        parentTokenName: token.parentTokenName,
        slTokenAddress: token.slAddress,
        stTokenAddress: token.stAddress,
        uniswapV2PairAddress: token.uniswapV2PairAddress,
        initialStakeRound: Number(token.initialStakeRound),
        hasEnded: launchInfos[index].hasEnded,
        voteOriginBlocks: currentToken?.voteOriginBlocks ?? 0,
        totalContributed: launchInfos[index].totalContributed,
        parentTokenFundraisingGoal: launchInfos[index].parentTokenFundraisingGoal,
      }));
      setAllTokens((prev) => {
        // 过滤掉已存在的symbol，避免重复
        const existingSymbols = new Set(prev.map((token) => token.symbol));
        const filteredNewTokens = newTokens.filter((token) => !existingSymbols.has(token.symbol));
        return [...prev, ...filteredNewTokens];
      });
    }
  }, [tokens, launchInfos]);

  // 加载更多tokens
  const loadMoreTokens = useCallback(() => {
    if (!isLoadingTokens && tokens && tokens.length > 0) {
      setStart(end);
      setEnd(end + BigInt(PAGE_SIZE));
    }
  }, [isLoadingTokens, tokens, end]);

  const handleScroll = useDebouncedCallback(() => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
      loadMoreTokens();
    }
  }, 200);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // 切换代币
  const handleTokenClick = (token: TokenWithLaunchInfo) => {
    //跳转代币详情页
    if (token.hasEnded) {
      NavigationUtils.redirectWithOverlay(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/acting/?symbol=${token.symbol}`);
    } else {
      NavigationUtils.redirectWithOverlay(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/launch/?symbol=${token.symbol}`);
    }
  };

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (tokensError) {
      handleContractError(tokensError, 'launch');
    }
    if (detailsError) {
      handleContractError(detailsError, 'dataViewer');
    }
  }, [tokensError, detailsError]);

  return (
    <div className="space-y-4 m-4">
      {allTokens.length === 0 && !isLoadingTokens && !isLoadingDetails ? (
        <div className="text-center text-muted-foreground py-8">{parentTokenAddress ? '暂无子币' : '代币列表为空'}</div>
      ) : (
        allTokens.map((token, index) => (
          <Card key={index} onClick={() => handleTokenClick(token)}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="flex items-center">
                  <span className="font-semibold font-mono">{token.symbol}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {token.hasEnded ? (
                    <span className="text-greyscale-500">发射已完成</span>
                  ) : (
                    <span className="flex items-center justify-between">
                      <span className="text-secondary">发射中</span>
                      <span className="text-greyscale-500 pl-2">
                        (进度:{' '}
                        {token.totalContributed !== undefined && token.parentTokenFundraisingGoal
                          ? formatPercentage(
                              (Number(token.totalContributed) / Number(token.parentTokenFundraisingGoal)) * 100,
                            )
                          : '...'}
                        )
                      </span>
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span>
                  <span className="text-greyscale-500 text-sm">父币 </span>
                  <span className="text-sm font-mono">{token.parentTokenSymbol}</span>
                </span>
                <Button variant="ghost" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      {(isLoadingTokens || isLoadingDetails) && <LoadingIcon />}
    </div>
  );
}
