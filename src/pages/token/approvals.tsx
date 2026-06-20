'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAccount, useBytecode } from 'wagmi';
import { formatUnits, isAddress } from 'viem';

import Header from '@/src/components/Header';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import TokenSelect, { CUSTOM_TOKEN_VALUE } from '@/src/components/Token/TokenSelect';
import useTokenContext from '@/src/hooks/context/useTokenContext';
import { useUSDTPairAddress } from '@/src/hooks/composite/useUSDTPairAddress';
import { useApprove, useBalanceOf, useDecimals, useSymbol } from '@/src/hooks/contracts/useLOVE20Token';
import { useKnownTokenApprovals } from '@/src/hooks/contracts/useKnownTokenApprovals';
import { buildSupportedTokenOptions, ZERO_ADDRESS } from '@/src/lib/tokenOptions';
import {
  getUseUnlimitedTokenApprovalByDefault,
  isUnlimitedTokenApproval,
  setUseUnlimitedTokenApprovalByDefault,
} from '@/src/lib/tokenApproval';
import { normalizeAddressInput } from '@/src/lib/addressUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const displayTokenAmount = (value: bigint | undefined, decimals: number) => {
  if (value === undefined) return '读取中...';
  const raw = formatUnits(value, decimals);
  const formatted = raw.includes('.') ? raw.replace(/\.?0+$/, '') : raw;
  const [whole, fraction] = formatted.split('.');
  if (!fraction || fraction.length <= 4) return formatted;
  return `${whole}.${fraction.slice(0, 4).replace(/0+$/, '') || fraction.slice(0, 4)}...`;
};

const displayAllowance = (value: bigint | undefined, symbol: string, decimals: number) => {
  if (value === undefined) return '读取中';
  if (value === BigInt(0)) return '未授权';
  if (isUnlimitedTokenApproval(value)) return '长期授权';
  return `${displayTokenAmount(value, decimals)} ${symbol}`;
};

export default function TokenApprovalsPage() {
  const { address: account } = useAccount();
  const { token } = useTokenContext();
  const { pairAddress: usdtLpPairAddress, usdtSymbol } = useUSDTPairAddress(token?.address);
  const [useUnlimitedByDefault, setUseUnlimitedByDefaultState] = useState(false);
  const [selectedTokenKey, setSelectedTokenKey] = useState('');
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const [customSpenderAddress, setCustomSpenderAddress] = useState('');

  useEffect(() => {
    setUseUnlimitedByDefaultState(getUseUnlimitedTokenApprovalByDefault());
  }, []);

  const tokenOptions = useMemo(
    () =>
      buildSupportedTokenOptions(token, {
        usdtLpPairAddress: usdtLpPairAddress && usdtLpPairAddress !== ZERO_ADDRESS ? usdtLpPairAddress : undefined,
        usdtSymbol,
      }).filter((option) => !option.isNative),
    [token, usdtLpPairAddress, usdtSymbol],
  );

  useEffect(() => {
    if (!selectedTokenKey && tokenOptions[0]) {
      setSelectedTokenKey(tokenOptions[0].address);
    }
  }, [selectedTokenKey, tokenOptions]);

  const selectedTokenAddress = useMemo(() => {
    if (selectedTokenKey === CUSTOM_TOKEN_VALUE) {
      const normalized = normalizeAddressInput(customTokenAddress);
      return normalized && isAddress(normalized) && normalized !== ZERO_ADDRESS ? (normalized as `0x${string}`) : undefined;
    }
    return isAddress(selectedTokenKey) ? (selectedTokenKey as `0x${string}`) : undefined;
  }, [customTokenAddress, selectedTokenKey]);

  const selectedKnownToken = tokenOptions.find(
    (option) => option.address !== 'NATIVE' && option.address.toLowerCase() === selectedTokenAddress?.toLowerCase(),
  );
  const { data: customTokenBytecode, isLoading: isLoadingCustomTokenBytecode } = useBytecode({
    address: selectedTokenAddress,
    query: {
      enabled: selectedTokenKey === CUSTOM_TOKEN_VALUE && !!selectedTokenAddress,
    },
  });
  const isCustomTokenContract = !!customTokenBytecode && customTokenBytecode !== '0x';
  const isCustomTokenEoa =
    selectedTokenKey === CUSTOM_TOKEN_VALUE &&
    !!selectedTokenAddress &&
    !isLoadingCustomTokenBytecode &&
    !isCustomTokenContract;
  const { symbol: customTokenSymbol, error: customTokenSymbolError } = useSymbol(
    selectedTokenAddress || ZERO_ADDRESS,
    selectedTokenKey === CUSTOM_TOKEN_VALUE && isCustomTokenContract,
  );
  const { decimals: customTokenDecimals, error: customTokenDecimalsError } = useDecimals(
    selectedTokenAddress || ZERO_ADDRESS,
    selectedTokenKey === CUSTOM_TOKEN_VALUE && isCustomTokenContract,
  );
  const customTokenInfoFailed =
    selectedTokenKey === CUSTOM_TOKEN_VALUE &&
    !!selectedTokenAddress &&
    (isCustomTokenEoa || !!customTokenSymbolError || !!customTokenDecimalsError);
  const isCustomTokenReady =
    selectedTokenKey !== CUSTOM_TOKEN_VALUE ||
    (isCustomTokenContract &&
      !customTokenInfoFailed &&
      customTokenSymbol !== undefined &&
      customTokenDecimals !== undefined);
  const queryTokenAddress = isCustomTokenReady ? selectedTokenAddress : undefined;
  const { balance: customTokenBalance, isPending: isPendingCustomTokenBalance } = useBalanceOf(
    selectedTokenAddress || ZERO_ADDRESS,
    account as `0x${string}`,
    selectedTokenKey === CUSTOM_TOKEN_VALUE && isCustomTokenReady && !!account,
  );
  const selectedTokenOption = selectedKnownToken || (queryTokenAddress ? {
    symbol: customTokenSymbol || '自定义代币',
    address: queryTokenAddress,
    decimals: customTokenDecimals ?? 18,
    isNative: false,
    name: `自定义代币 (${customTokenSymbol || 'TOKEN'})`,
  } : undefined);
  const selectedTokenSymbol = selectedKnownToken?.symbol || customTokenSymbol || 'TOKEN';
  const selectedTokenDecimals = selectedTokenOption?.decimals ?? 18;
  const normalizedCustomSpenderAddress = useMemo(() => {
    const normalized = normalizeAddressInput(customSpenderAddress);
    return normalized && isAddress(normalized) ? (normalized as `0x${string}`) : undefined;
  }, [customSpenderAddress]);

  const customSpender =
    normalizedCustomSpenderAddress && queryTokenAddress
      ? {
          name: '指定地址',
          category: '指定地址',
          address: normalizedCustomSpenderAddress,
      }
      : undefined;
  const extraSpenders = useMemo(() => (customSpender ? [customSpender] : []), [customSpender]);
  const { rows, isPending, refetch } = useKnownTokenApprovals(token, account, queryTokenAddress, extraSpenders);
  const customRows = useMemo(
    () =>
      normalizedCustomSpenderAddress
        ? rows.filter((row) => row.address.toLowerCase() === normalizedCustomSpenderAddress.toLowerCase())
        : [],
    [normalizedCustomSpenderAddress, rows],
  );
  const knownRows = useMemo(
    () =>
      normalizedCustomSpenderAddress
        ? rows.filter((row) => row.address.toLowerCase() !== normalizedCustomSpenderAddress.toLowerCase())
        : rows,
    [normalizedCustomSpenderAddress, rows],
  );

  const { approve, isPending: isApproving, isConfirming, isConfirmed } = useApprove(queryTokenAddress || ZERO_ADDRESS);

  const setPreference = (enabled: boolean) => {
    setUseUnlimitedTokenApprovalByDefault(enabled);
    setUseUnlimitedByDefaultState(enabled);
  };

  const approveSpender = async (spender: `0x${string}`, mode: 'exact' | 'unlimited') => {
    if (!queryTokenAddress) return;
    // BigInt(1) is only a positive sentinel; unlimited mode resolves it to maxUint256.
    await approve(spender, mode === 'exact' ? BigInt(0) : BigInt(1), { approvalMode: mode });
  };

  useEffect(() => {
    if (isConfirmed) refetch?.();
  }, [isConfirmed, refetch]);

  const renderApprovalRows = (approvalRows: typeof rows, emptyText: string) => (
    <section className="overflow-hidden rounded-md border border-greyscale-200 bg-white">
      <div className="hidden grid-cols-[1.1fr_0.9fr_1fr_0.9fr] gap-3 border-b border-greyscale-200 bg-greyscale-50 px-3 py-2 text-xs font-semibold text-greyscale-600 md:grid">
        <div>合约</div>
        <div>分类</div>
        <div>当前额度</div>
        <div className="text-right">操作</div>
      </div>
      {approvalRows.length === 0 ? (
        <div className="px-3 py-6 text-center text-sm text-greyscale-500">{emptyText}</div>
      ) : (
        approvalRows.map((row) => (
          <div
            key={row.address}
            className="grid grid-cols-1 gap-3 border-b border-greyscale-100 px-3 py-4 text-sm last:border-b-0 md:grid-cols-[1.1fr_0.9fr_1fr_0.9fr] md:items-center md:gap-3 md:py-3"
          >
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold text-greyscale-900">{row.name}</div>
                <span className="shrink-0 rounded-full bg-greyscale-100 px-2 py-0.5 text-xs font-medium text-greyscale-600 md:hidden">
                  {row.category}
                </span>
              </div>
              <AddressWithCopyButton address={row.address} showAddress={true} colorClassName="text-xs text-greyscale-500" />
              {row.note && <div className="mt-1 text-xs text-greyscale-500">{row.note}</div>}
            </div>
            <div className="hidden text-greyscale-600 md:block">
              <span>{row.category}</span>
            </div>
            <div className="rounded-md bg-greyscale-50 px-3 py-2 md:bg-transparent md:p-0">
              <div className="font-mono text-base text-greyscale-900 md:text-sm">
                {displayAllowance(row.allowance, selectedTokenSymbol, selectedTokenDecimals)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 md:flex md:justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={
                  !account ||
                  !queryTokenAddress ||
                  isApproving ||
                  isConfirming ||
                  row.allowance === undefined ||
                  row.allowance === BigInt(0)
                }
                onClick={() => approveSpender(row.address, 'exact')}
              >
                撤销
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={
                  !account ||
                  !queryTokenAddress ||
                  isApproving ||
                  isConfirming ||
                  row.allowance === undefined ||
                  isUnlimitedTokenApproval(row.allowance)
                }
                onClick={() => approveSpender(row.address, 'unlimited')}
              >
                {row.allowance !== undefined && isUnlimitedTokenApproval(row.allowance) ? '已长期授权' : '长期授权'}
              </Button>
            </div>
          </div>
        ))
      )}
    </section>
  );

  return (
    <>
      <Header title="代币授权" showBackButton={true} />
      <main className="flex-grow">
        <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4">
          <div className="mb-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
            在这里可以查看并管理某个代币对常用合约的授权额度，也可以输入指定地址查询或撤销授权。长期授权可减少后续操作次数，但请只授权给你信任的地址。
          </div>

          <section className="mb-4 rounded-md border border-greyscale-200 bg-white p-4">
            <label className="flex items-start gap-3 text-sm text-greyscale-800">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={useUnlimitedByDefault}
                onChange={(event) => setPreference(event.target.checked)}
              />
              <span>
                <span className="block font-semibold">默认使用长期授权</span>
                <span className="text-greyscale-500">
                  开启后，业务页面授权会默认使用长期额度；这里仍可手动撤销或单独授权。
                </span>
              </span>
            </label>
          </section>

          <section className="mb-4 rounded-md border border-greyscale-200 bg-white p-4">
            <div className="max-w-xl">
              <div className="mb-2 text-sm font-semibold text-greyscale-800">代币</div>
              <TokenSelect
                value={selectedTokenKey}
                onValueChange={setSelectedTokenKey}
                tokens={tokenOptions}
                selectedToken={selectedTokenOption}
                customTokenAddress={customTokenAddress}
                onCustomTokenAddressChange={setCustomTokenAddress}
                placeholder="选择代币"
                customTokenDetails={
                  selectedTokenAddress ? (
                    isLoadingCustomTokenBytecode ? (
                      <div className="text-xs text-greyscale-500">正在检查地址...</div>
                    ) : customTokenInfoFailed ? (
                      <div className="text-xs text-red-600">
                        {isCustomTokenEoa
                          ? '这是钱包地址，不是代币合约地址。'
                          : '无法读取代币信息，请确认这是有效的 ERC20 代币合约地址。'}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 text-xs text-greyscale-600">
                        <div>
                          <div className="text-greyscale-400">代币</div>
                          <div className="mt-0.5 font-mono">{customTokenSymbol || '读取中...'}</div>
                        </div>
                        <div>
                          <div className="text-greyscale-400">精度</div>
                          <div className="mt-0.5 font-mono">{customTokenDecimals ?? '读取中...'}</div>
                        </div>
                        <div>
                          <div className="text-greyscale-400">余额</div>
                          <div className="mt-0.5 font-mono">
                            {!account
                              ? '未连接'
                              : !isCustomTokenReady || isPendingCustomTokenBalance
                                ? '读取中...'
                                : displayTokenAmount(customTokenBalance || BigInt(0), selectedTokenDecimals)}
                          </div>
                        </div>
                      </div>
                    )
                  ) : null
                }
              />
            </div>
          </section>

          <Tabs defaultValue="known" className="space-y-3">
            <div className="text-sm text-greyscale-500">下方显示当前代币对各地址的授权额度。</div>
            <TabsList className="grid w-full grid-cols-2 sm:w-[360px]">
              <TabsTrigger value="known">常用合约</TabsTrigger>
              <TabsTrigger value="custom">指定地址</TabsTrigger>
            </TabsList>

            <TabsContent value="known" className="mt-0">
              {renderApprovalRows(knownRows, '暂无可查询的常用合约')}
            </TabsContent>

            <TabsContent value="custom" className="mt-0 space-y-3">
              <section className="rounded-md border border-greyscale-200 bg-white p-4">
                <Input
                  value={customSpenderAddress}
                  onChange={(event) => setCustomSpenderAddress(event.target.value.trim())}
                  placeholder="输入地址后查询授权额度"
                />
                {customSpenderAddress && !normalizedCustomSpenderAddress && (
                  <div className="mt-1 text-xs text-red-600">请输入有效地址（支持 0x 或 TH 格式）</div>
                )}
              </section>

              {customSpenderAddress && renderApprovalRows(customRows, '未查询到该地址的授权额度')}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <LoadingOverlay isLoading={isPending || isApproving || isConfirming} text={isApproving ? '提交交易...' : '读取授权...'} />
    </>
  );
}
