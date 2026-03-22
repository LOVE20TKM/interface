'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import Header from '@/src/components/Header';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import { TokenContext } from '@/src/contexts/TokenContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

import { formatPercentage, formatTokenAmount, parseUnits } from '@/src/lib/format';
import { useLaunchInfo } from '@/src/hooks/contracts/useLOVE20Launch';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const INTRO_MD_URL = basePath + '/token/INTRO.md';

function applyPlaceholders(md: string, vars: Record<string, string | number | undefined | null>): string {
  let out = md;
  for (const [key, value] of Object.entries(vars)) {
    const safe = value === undefined || value === null ? '' : String(value);
    out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), safe);
  }
  return out;
}

const TokenIntroPage = () => {
  const { token } = useContext(TokenContext) || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawMd, setRawMd] = useState<string>('');

  const {
    launchInfo,
    error: errorLaunchInfo,
    isPending: isPendingLaunchInfo,
  } = useLaunchInfo(token?.address as `0x${string}` | undefined);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(INTRO_MD_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`加载失败：${res.status}`);
        const text = await res.text();
        if (!cancelled) setRawMd(text);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const launchAmount = Number(process.env.NEXT_PUBLIC_LAUNCH_AMOUNT ?? 0);
  const launchGoal = Number(launchInfo?.parentTokenFundraisingGoal ?? 0);
  const price = launchGoal === 0 ? 0 : launchAmount / launchGoal;
  const parentSymbol =
    token?.address == process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_FIRST_TOKEN
      ? process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL
      : token?.parentTokenSymbol;

  const renderedMd = useMemo(() => {
    const vars = {
      SYMBOL: token?.symbol,
      NAME: token?.name,
      DECIMALS: token?.decimals,
      PARENT_SYMBOL: parentSymbol,
      PARENT_NAME: token?.parentTokenName,
      TOKEN_ADDRESS: token?.address,
      PARENT_ADDRESS: token?.parentTokenAddress,
      SL_ADDRESS: token?.slTokenAddress,
      ST_ADDRESS: token?.stTokenAddress,
      PAIR_ADDRESS: token?.uniswapV2PairAddress,
      WITHDRAW_WAITING_BLOCKS: process.env.NEXT_PUBLIC_WITHDRAW_WAITING_BLOCKS ?? '?',
      SUBMIT_MIN_PERCENT: formatPercentage(Number(process.env.NEXT_PUBLIC_SUBMIT_MIN_PER_THOUSAND ?? 0) / 10),
      ACTION_REWARD_MIN_VOTE_PERCENT: formatPercentage(
        Number(process.env.NEXT_PUBLIC_ACTION_REWARD_MIN_VOTE_PER_THOUSAND ?? 0) / 10,
      ),
      LAUNCH_GOAL: formatTokenAmount(launchInfo?.parentTokenFundraisingGoal ?? BigInt(0)),
      PRICE: price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','),
    } as const;
    return applyPlaceholders(rawMd, vars);
  }, [rawMd, token, launchInfo]);

  return (
    <>
      <Header title="代币介绍" showBackButton={true} />
      <main className="flex-grow">
        {loading || isPendingLaunchInfo ? (
          <div className="flex justify-center items-center h-[60vh]">
            <LoadingIcon />
          </div>
        ) : error ? (
          <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="text-red-500">{error}</div>
          </div>
        ) : (
          <div className="container mx-auto px-4 pb-8 max-w-3xl">
            <article className="prose lg:prose-xl mx-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                className="text-lg text-gray-800 font-mono"
              >
                {renderedMd}
              </ReactMarkdown>
            </article>
          </div>
        )}
      </main>
    </>
  );
};

export default TokenIntroPage;
