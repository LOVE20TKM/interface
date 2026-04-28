'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAccount, useBalance } from 'wagmi';
import { useForm } from 'react-hook-form';
import { isAddress } from 'viem';
import { useQueryClient } from '@tanstack/react-query';

import { normalizeAddressInput, validateAddressInput } from '@/src/lib/addressUtils';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { formatTokenAmount, formatUnits, parseUnits } from '@/src/lib/format';
import { useUSDTPairAddress } from '@/src/hooks/composite/useUSDTPairAddress';
import { useBalanceOf, useTransfer } from '@/src/hooks/contracts/useLOVE20Token';
import { useNativeTransfer } from '@/src/hooks/contracts/useNativeTransfer';
import useTokenContext from '@/src/hooks/context/useTokenContext';
import { isGroupDefaultsEnabled, useDefaultGroupOf } from '@/src/hooks/extension/base/contracts/useGroupDefaults';
import { useNftOwnerLookup } from '@/src/hooks/extension/base/composite/useNftOwnerLookup';
import { useError } from '@/src/contexts/ErrorContext';
import { useIsOnTargetChain } from '@/src/hooks/useIsOnTargetChain';

import AddToMetamask from '@/src/components/Common/AddToMetamask';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import NftOwnerLookup from '@/src/components/Extension/Base/Group/NftOwnerLookup';

interface TokenConfig {
  symbol: string;
  address: `0x${string}` | 'NATIVE';
  decimals: number;
  isNative: boolean;
  name: string;
  isLp?: boolean;
}

interface ProtectedTargetInfo {
  label: string;
  address: `0x${string}`;
  type: 'token' | 'contract';
}

type TransferMode = 'address' | 'nftOwner';

type TransferFormValues = {
  to: string;
  amount: string;
  tokenAddress: string;
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const FALLBACK_TOKEN: TokenConfig = {
  symbol: '',
  address: 'NATIVE',
  decimals: 18,
  isNative: true,
  name: '',
};

const buildKnownContractTargets = (): ProtectedTargetInfo[] => {
  const knownContracts = [
    { label: 'TUSDT', address: process.env.NEXT_PUBLIC_USDT_ADDRESS },
    { label: '根父币', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN },
    { label: 'Uniswap V2 Factory', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_FACTORY },
    { label: 'Token Factory', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TOKEN_FACTORY },
    { label: 'Launch', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_LAUNCH },
    { label: 'Stake', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE },
    { label: 'Submit', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SUBMIT },
    { label: 'Vote', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VOTE },
    { label: 'Join', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN },
    { label: 'Random', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_RANDOM },
    { label: 'Verify', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VERIFY },
    { label: 'Mint', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MINT },
    { label: 'First Token', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_FIRST_TOKEN },
    { label: 'TokenViewer', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_TOKENVIEWER },
    { label: 'RoundViewer', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_ROUNDVIEWER },
    { label: 'MintViewer', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_MINTVIEWER },
    { label: 'Hub', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_HUB },
    { label: 'Uniswap V2 Router', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_ROUTER },
    { label: 'LOVE20 NFT', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP },
    { label: 'Group Defaults', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_DEFAULTS },
    { label: 'Extension Center', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER },
    { label: 'LP Factory', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_LP_FACTORY },
    { label: 'LP Factory V2', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_LP_FACTORY_V2 },
    { label: 'Group Manager', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER },
    { label: 'Group Join', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN },
    { label: 'Group Verify', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY },
    { label: 'Group Action Factory', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_ACTION_FACTORY },
    { label: 'Group Recipients', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_RECIPIENTS },
    { label: 'Group Service Factory', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_SERVICE_FACTORY },
  ];

  const addedAddresses = new Set<string>();

  return knownContracts.flatMap(({ label, address }) => {
    if (!address || !isAddress(address)) return [];

    const normalizedAddress = address.toLowerCase();
    if (normalizedAddress === ZERO_ADDRESS || addedAddresses.has(normalizedAddress)) return [];

    addedAddresses.add(normalizedAddress);
    return [{ label, address: address as `0x${string}`, type: 'contract' as const }];
  });
};

const KNOWN_CONTRACT_TARGETS = buildKnownContractTargets();

const buildSupportedTokens = (
  token: any,
  options?: {
    usdtLpPairAddress?: `0x${string}`;
    usdtSymbol?: string;
  },
): TokenConfig[] => {
  const supportedTokens: TokenConfig[] = [];
  const addedAddresses = new Set<string>();

  const addToken = (tokenConfig: TokenConfig) => {
    const key = tokenConfig.address.toLowerCase();
    if (!addedAddresses.has(key)) {
      addedAddresses.add(key);
      supportedTokens.push(tokenConfig);
    }
  };

  const nativeSymbol = process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL;
  if (nativeSymbol) {
    addToken({
      symbol: nativeSymbol,
      address: 'NATIVE',
      decimals: 18,
      isNative: true,
      name: `原生代币 (${nativeSymbol})`,
    });
  }

  const wethSymbol = process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL;
  const wethAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN;
  if (wethSymbol && wethAddress) {
    addToken({
      symbol: wethSymbol,
      address: wethAddress as `0x${string}`,
      decimals: 18,
      isNative: false,
      name: `包装代币 (${wethSymbol})`,
    });
  }

  const usdtSymbol = process.env.NEXT_PUBLIC_USDT_SYMBOL;
  const usdtAddress = process.env.NEXT_PUBLIC_USDT_ADDRESS;
  if (usdtSymbol && usdtAddress) {
    addToken({
      symbol: usdtSymbol,
      address: usdtAddress as `0x${string}`,
      decimals: 18,
      isNative: false,
      name: `TUSDT 代币 (${usdtSymbol})`,
    });
  }

  if (token) {
    if (token.symbol && token.address) {
      addToken({
        symbol: token.symbol,
        address: token.address,
        decimals: 18,
        isNative: false,
        name: `当前代币 (${token.symbol})`,
      });
    }

    if (token.parentTokenSymbol && token.parentTokenAddress) {
      addToken({
        symbol: token.parentTokenSymbol,
        address: token.parentTokenAddress,
        decimals: 18,
        isNative: false,
        name: `父币 (${token.parentTokenSymbol})`,
      });
    }

    if (token.slTokenAddress && token.symbol) {
      addToken({
        symbol: `sl${token.symbol}`,
        address: token.slTokenAddress,
        decimals: 18,
        isNative: false,
        name: `SL代币 (sl${token.symbol})`,
      });
    }

    if (token.stTokenAddress && token.symbol) {
      addToken({
        symbol: `st${token.symbol}`,
        address: token.stTokenAddress,
        decimals: 18,
        isNative: false,
        name: `ST代币 (st${token.symbol})`,
      });
    }

    if (token.uniswapV2PairAddress && token.uniswapV2PairAddress !== ZERO_ADDRESS) {
      const lpSymbolName = `${token.symbol}/${token.parentTokenSymbol}`;
      addToken({
        symbol: `LP(${lpSymbolName})`,
        address: token.uniswapV2PairAddress as `0x${string}`,
        decimals: 18,
        isNative: false,
        name: `LP代币 (${lpSymbolName})`,
        isLp: true,
      });
    }

    if (options?.usdtLpPairAddress && options.usdtLpPairAddress !== ZERO_ADDRESS && options.usdtSymbol) {
      const lpSymbolName = `${token.symbol}/${options.usdtSymbol}`;
      addToken({
        symbol: `LP(${lpSymbolName})`,
        address: options.usdtLpPairAddress,
        decimals: 18,
        isNative: false,
        name: `LP代币 (${lpSymbolName})`,
        isLp: true,
      });
    }
  }

  return supportedTokens;
};

const useTokenBalance = (tokenConfig: TokenConfig, account: `0x${string}` | undefined) => {
  const { setError } = useError();

  const {
    data: nativeBalance,
    isLoading: isLoadingNative,
    error: nativeBalanceError,
  } = useBalance({
    address: account,
    query: {
      enabled: !!account && tokenConfig.isNative,
    },
  });

  const { balance: erc20Balance, isPending: isPendingERC20 } = useBalanceOf(
    tokenConfig.isNative ? ZERO_ADDRESS : (tokenConfig.address as `0x${string}`),
    account as `0x${string}`,
    !tokenConfig.isNative && !!account,
  );

  useEffect(() => {
    if (nativeBalanceError) {
      setError({
        name: '余额查询失败',
        message: '无法读取原生代币余额，请检查网络后重试',
      });
    }
  }, [nativeBalanceError, setError]);

  return {
    balance: tokenConfig.isNative ? nativeBalance?.value : erc20Balance,
    isPending: tokenConfig.isNative ? isLoadingNative : isPendingERC20,
  };
};

const getTransferFormSchema = (balance: bigint, transferMode: TransferMode) =>
  z
    .object({
      to: z.string().default(''),
      amount: z
        .string()
        .nonempty('请输入转账数量')
        .refine(
          (val) => {
            if (val.endsWith('.')) return true;
            if (val === '0') return true;
            try {
              const amount = parseUnits(val);
              return amount > BigInt(0) && amount <= balance;
            } catch {
              return false;
            }
          },
          { message: '转账数量必须大于0且不超过您的可用余额' },
        ),
      tokenAddress: z.string().nonempty('请选择代币'),
    })
    .superRefine((data, ctx) => {
      if (transferMode !== 'address') {
        return;
      }

      if (!data.to || data.to.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['to'],
          message: '请输入目标地址',
        });
        return;
      }

      if (validateAddressInput(data.to) !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['to'],
          message: '请输入有效的地址格式（支持 0x、TH 格式）',
        });
      }
    });

const TransferPanel = () => {
  const isOnTargetChain = useIsOnTargetChain();
  const { address: account } = useAccount();
  const { token } = useTokenContext();
  const queryClient = useQueryClient();
  const { pairAddress: usdtLpPairAddress, usdtSymbol } = useUSDTPairAddress(token?.address);

  const [transferMode, setTransferMode] = useState<TransferMode>('address');
  const [selectedToken, setSelectedToken] = useState<TokenConfig | undefined>();
  const [isUserManuallySelected, setIsUserManuallySelected] = useState(false);
  const [lastProcessedTxHash, setLastProcessedTxHash] = useState<string | null>(null);
  const [addressConversionInfo, setAddressConversionInfo] = useState('');
  const [convertedAddress, setConvertedAddress] = useState<`0x${string}` | null>(null);
  const [isAssetProtectionEnabled, setIsAssetProtectionEnabled] = useState(true);
  const {
    lookupMode: nftLookupMode,
    setLookupMode: setNftLookupMode,
    lookupValue: nftLookupValue,
    setLookupValue: setNftLookupValue,
    lookupResult: nftLookupResult,
    hasResolvedOwner: hasResolvedNftOwner,
  } = useNftOwnerLookup({ enabled: transferMode === 'nftOwner' });

  const supportedTokens = useMemo(
    () =>
      buildSupportedTokens(token, {
        usdtLpPairAddress:
          usdtLpPairAddress && usdtLpPairAddress !== ZERO_ADDRESS ? usdtLpPairAddress : undefined,
        usdtSymbol,
      }),
    [token, usdtLpPairAddress, usdtSymbol],
  );

  const balanceToken = selectedToken || supportedTokens[0] || FALLBACK_TOKEN;
  const { balance, isPending: isPendingBalance } = useTokenBalance(balanceToken, account);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(getTransferFormSchema(balance || BigInt(0), transferMode)),
    defaultValues: {
      to: '',
      amount: '',
      tokenAddress: '',
    },
    mode: 'onChange',
  });

  const watchedToAddress = form.watch('to');
  const watchedAmount = form.watch('amount');

  useEffect(() => {
    if (supportedTokens.length === 0) return;

    const currentTokenConfig = token ? supportedTokens.find((item) => item.address === token.address) : null;

    if (!selectedToken) {
      setSelectedToken(currentTokenConfig || supportedTokens[0]);
    } else if (currentTokenConfig && selectedToken.address !== currentTokenConfig.address && !isUserManuallySelected) {
      const isBasicToken =
        selectedToken.isNative || selectedToken.address === process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN;
      if (isBasicToken) {
        setSelectedToken(currentTokenConfig);
      }
    }
  }, [isUserManuallySelected, selectedToken, supportedTokens, token]);

  useEffect(() => {
    if (selectedToken) {
      form.setValue('tokenAddress', selectedToken.address);
    }
  }, [form, selectedToken]);

  useEffect(() => {
    if (transferMode !== 'address') {
      setAddressConversionInfo('');
      setConvertedAddress(null);
      return;
    }

    if (!watchedToAddress || watchedToAddress.trim() === '') {
      setAddressConversionInfo('');
      setConvertedAddress(null);
      return;
    }

    const trimmed = watchedToAddress.trim();
    const normalized = normalizeAddressInput(trimmed);

    if (!normalized) {
      setAddressConversionInfo('');
      setConvertedAddress(null);
      return;
    }

    if (!trimmed.startsWith('0x')) {
      setAddressConversionInfo('将转换为:');
      setConvertedAddress(normalized as `0x${string}`);
      return;
    }

    if (trimmed.toLowerCase() !== normalized) {
      setAddressConversionInfo('地址已标准化');
      setConvertedAddress(normalized as `0x${string}`);
      return;
    }

    setAddressConversionInfo('');
    setConvertedAddress(null);
  }, [transferMode, watchedToAddress]);

  const normalizedToAddress = useMemo(() => normalizeAddressInput(watchedToAddress || ''), [watchedToAddress]);
  const nftTargetAddress =
    nftLookupResult?.status === 'resolved' ? (nftLookupResult.owner as `0x${string}`) : undefined;
  const targetAddress =
    transferMode === 'address'
      ? (normalizedToAddress ? (normalizedToAddress as `0x${string}`) : undefined)
      : nftTargetAddress;

  const {
    defaultGroupId: targetDefaultGroupId,
    defaultGroupName: targetDefaultGroupName,
    hasDefaultGroup: hasTargetDefaultGroup,
    isPending: isPendingTargetDefaultGroup,
  } = useDefaultGroupOf(
    transferMode === 'address' && normalizedToAddress ? (normalizedToAddress as `0x${string}`) : undefined,
    isGroupDefaultsEnabled && isOnTargetChain && transferMode === 'address' && !!normalizedToAddress,
  );

  const protectedTargetInfo = useMemo<ProtectedTargetInfo | undefined>(() => {
    if (!targetAddress) {
      return undefined;
    }

    const protectedToken = supportedTokens.find(
      (tokenConfig) => tokenConfig.address !== 'NATIVE' && tokenConfig.address.toLowerCase() === targetAddress.toLowerCase(),
    );

    if (protectedToken) {
      return {
        label: protectedToken.symbol,
        address: protectedToken.address as `0x${string}`,
        type: 'token',
      };
    }

    return KNOWN_CONTRACT_TARGETS.find((contract) => contract.address.toLowerCase() === targetAddress.toLowerCase());
  }, [supportedTokens, targetAddress]);

  const isAssetProtectionTriggered = isAssetProtectionEnabled && !!protectedTargetInfo;
  const isProtectedSelectedTokenSelf =
    selectedToken?.address !== 'NATIVE' && !!protectedTargetInfo && selectedToken?.address === protectedTargetInfo.address;
  const protectedTargetLabel = protectedTargetInfo
    ? `${protectedTargetInfo.label}${protectedTargetInfo.type === 'token' ? ' 代币' : ''}合约地址`
    : '';

  const [transferAmount, setTransferAmount] = useState<bigint>(BigInt(0));
  useEffect(() => {
    try {
      const amount = parseUnits(watchedAmount || '0');
      setTransferAmount(amount);
    } catch {
      setTransferAmount(BigInt(0));
    }
  }, [watchedAmount]);

  const refreshBalance = useCallback(() => {
    if (!selectedToken || !account) return;

    if (selectedToken.isNative) {
      queryClient.invalidateQueries({
        queryKey: ['balance', { address: account }],
      });
      return;
    }

    queryClient.invalidateQueries({
      queryKey: [
        'readContract',
        {
          address: selectedToken.address,
          functionName: 'balanceOf',
          args: [account],
        },
      ],
    });
  }, [account, queryClient, selectedToken]);

  const {
    transfer: erc20Transfer,
    isPending: isPendingERC20Transfer,
    isConfirming: isConfirmingERC20Transfer,
    isConfirmed: isConfirmedERC20Transfer,
    hash: erc20TxHash,
  } = useTransfer((selectedToken?.address as `0x${string}`) || ZERO_ADDRESS);

  const {
    transfer: nativeTransfer,
    isPending: isPendingNativeTransfer,
    isConfirming: isConfirmingNativeTransfer,
    isConfirmed: isConfirmedNativeTransfer,
    hash: nativeTxHash,
  } = useNativeTransfer();

  const isTransferring =
    isPendingERC20Transfer || isConfirmingERC20Transfer || isPendingNativeTransfer || isConfirmingNativeTransfer;
  const isTransferConfirmed = isConfirmedERC20Transfer || isConfirmedNativeTransfer;

  useEffect(() => {
    const currentTxHash = isConfirmedERC20Transfer ? erc20TxHash : isConfirmedNativeTransfer ? nativeTxHash : undefined;

    if (isTransferConfirmed && currentTxHash && currentTxHash !== lastProcessedTxHash) {
      toast.success(`转账 ${selectedToken?.symbol} 成功`);
      form.setValue('amount', '');
      refreshBalance();
      setLastProcessedTxHash(currentTxHash);
    }
  }, [
    erc20TxHash,
    isConfirmedERC20Transfer,
    isConfirmedNativeTransfer,
    form,
    isTransferConfirmed,
    lastProcessedTxHash,
    nativeTxHash,
    refreshBalance,
    selectedToken?.symbol,
  ]);

  const setPercentageAmount = (percentage: number) => {
    if (!balance || balance <= BigInt(0)) return;

    const amount = (balance * BigInt(percentage)) / BigInt(100);
    form.setValue('amount', formatUnits(amount));
  };

  const setMaxAmount = () => {
    if (!balance || balance <= BigInt(0)) return;

    form.setValue('amount', formatUnits(balance));
  };

  const handleTransfer = form.handleSubmit(async (data) => {
    if (!selectedToken || !account) return;

    if (isAssetProtectionEnabled && protectedTargetInfo) {
      toast.error(`资产保护已触发：目标地址是 ${protectedTargetLabel}，关闭保护开关后才可强制转账`);
      return;
    }

    let toAddress: `0x${string}` | undefined;

    if (transferMode === 'address') {
      const normalizedAddress = normalizeAddressInput(data.to);
      if (!normalizedAddress) {
        toast.error('地址格式无效，请检查输入');
        return;
      }
      toAddress = normalizedAddress as `0x${string}`;
    } else if (nftLookupResult?.status === 'resolved') {
      toAddress = nftLookupResult.owner;
    } else {
      toast.error('请先选择有效NFT');
      return;
    }

    try {
      if (selectedToken.isNative) {
        console.log('执行原生代币转账:', { to: toAddress, amount: transferAmount, symbol: selectedToken.symbol });
        await nativeTransfer(toAddress, transferAmount);
      } else {
        console.log('执行ERC20代币转账:', {
          token: selectedToken.address,
          to: toAddress,
          amount: transferAmount,
          symbol: selectedToken.symbol,
        });
        await erc20Transfer(toAddress, transferAmount);
      }
    } catch (error) {
      console.error('Transfer error:', error);
    }
  });

  if (!token) {
    return <LoadingIcon />;
  }

  if (supportedTokens.length === 0) {
    return (
      <div className="p-6">
        <LeftTitle title="转账" />
        <div className="text-center text-greyscale-500 mt-4">正在加载代币信息...</div>
      </div>
    );
  }

  const isDisabled = isPendingBalance || !selectedToken;
  const isLoadingOverlay = isTransferring;
  const isSubmitDisabled =
    isTransferring || isDisabled || isAssetProtectionTriggered || (transferMode === 'nftOwner' && !hasResolvedNftOwner);
  const buttonText = isTransferring
    ? '转账中...'
    : isAssetProtectionTriggered
      ? '资产保护已拦截'
      : transferMode === 'nftOwner'
        ? '转账给NFT持有人地址'
        : '转账';

  return (
    <div className="p-6">
      <LeftTitle title="转账" />
      <div className="w-full max-w-md mt-4">
        <Tabs
          value={transferMode}
          onValueChange={(value) => {
            setTransferMode(value as TransferMode);
            form.clearErrors('to');
          }}
          className="w-full mb-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="address">按钱包地址</TabsTrigger>
            <TabsTrigger value="nftOwner">按NFT持有人地址</TabsTrigger>
          </TabsList>
        </Tabs>

        <Form {...form}>
          <form className="space-y-4">
            {transferMode === 'address' ? (
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">目标地址</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="请输入目标钱包地址（支持 0x、TH 格式）"
                        {...field}
                        disabled={isDisabled}
                        className="font-mono text-sm"
                      />
                    </FormControl>

                    {addressConversionInfo && (
                      <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <span>{addressConversionInfo}</span>
                        {convertedAddress && (
                          <AddressWithCopyButton
                            address={convertedAddress}
                            showCopyButton={true}
                            showAddress={true}
                            colorClassName="text-blue-600"
                          />
                        )}
                      </div>
                    )}

                    {isGroupDefaultsEnabled && normalizedToAddress && (
                      <div className="text-xs mt-1">
                        {isPendingTargetDefaultGroup ? (
                          <span className="text-gray-400">默认NFT查询中...</span>
                        ) : hasTargetDefaultGroup ? (
                          <span className="inline-flex items-center gap-1 text-gray-700">
                            <span className="inline-flex items-center rounded-full bg-secondary/10 px-1.5 py-0.5 text-[10px] font-medium text-secondary">
                              NFT#{targetDefaultGroupId?.toString()}
                            </span>
                            <span>{targetDefaultGroupName || '...'}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">该地址未关联默认NFT</span>
                        )}
                      </div>
                    )}

                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <NftOwnerLookup
                lookupMode={nftLookupMode}
                onLookupModeChange={setNftLookupMode}
                lookupValue={nftLookupValue}
                onLookupValueChange={setNftLookupValue}
                lookupResult={nftLookupResult}
                disabled={isDisabled}
              />
            )}

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox accent-secondary mt-0.5"
                  checked={isAssetProtectionEnabled}
                  onChange={(event) => setIsAssetProtectionEnabled(event.target.checked)}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-amber-900">资产保护开关</div>
                  <div className="text-xs text-amber-800 mt-1">
                    默认开启。若目标地址填写为前端已知的任意合约地址，系统会拦截本次转账，避免误把资产转入代币或协议合约。
                  </div>
                </div>
              </label>

              {isAssetProtectionTriggered && protectedTargetInfo && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  已触发资产保护开关：目标地址是 {protectedTargetLabel}
                  {isProtectedSelectedTokenSelf ? '，当前正在尝试把该代币转到它自己的合约地址。' : '。'}
                  如需强制转账，请先关闭上方保护开关，再重新提交。
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="tokenAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">选择代币</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          const nextToken = supportedTokens.find((item) => item.address === value);
                          if (!nextToken) return;

                          setIsUserManuallySelected(true);
                          setSelectedToken(nextToken);
                          field.onChange(value);
                          form.setValue('amount', '');
                        }}
                        disabled={isDisabled}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="请选择代币" />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedTokens.map((item) => (
                            <SelectItem key={item.address} value={item.address}>
                              <span className="font-mono font-medium">{item.symbol}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedToken && (
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <span className="shrink-0">合约地址:</span>
                          {selectedToken.address === 'NATIVE' ? (
                            <span>原生代币，无合约地址</span>
                          ) : (
                            <div className="flex items-center gap-1 min-w-0">
                              <AddressWithCopyButton
                                address={selectedToken.address as `0x${string}`}
                                showAddress={true}
                                showCopyButton={true}
                                colorClassName="text-gray-600"
                              />
                              <AddToMetamask
                                tokenAddress={selectedToken.address as `0x${string}`}
                                tokenSymbol={selectedToken.symbol}
                                tokenDecimals={selectedToken.decimals}
                                isUniswapV2Lp={selectedToken.isLp}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">转账数量</FormLabel>
                  <Card className="bg-[#f7f8f9] border-none">
                    <CardContent className="py-4 px-2">
                      <div className="flex items-center justify-between mb-3">
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            disabled={isDisabled || !balance || balance <= BigInt(0)}
                            className="text-xl border-none p-0 h-auto bg-transparent focus:ring-0 focus:outline-none mr-2"
                          />
                        </FormControl>
                        {selectedToken && (
                          <div className="w-auto border-none bg-white hover:bg-gray-50 px-3 py-1.5 rounded-full transition-colors border border-gray-200 font-mono">
                            <span className="font-medium text-gray-800 font-mono">{selectedToken.symbol}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex space-x-1">
                          {[25, 50, 75].map((percentage) => (
                            <Button
                              key={percentage}
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => setPercentageAmount(percentage)}
                              disabled={isDisabled || !balance || balance <= BigInt(0)}
                              className="text-xs h-7 px-2 rounded-lg"
                            >
                              {percentage}%
                            </Button>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={setMaxAmount}
                            disabled={isDisabled || !balance || balance <= BigInt(0)}
                            className="text-xs h-7 px-2 rounded-lg"
                          >
                            最高
                          </Button>
                        </div>
                        {selectedToken && (
                          <span className="text-sm text-gray-600">
                            {formatTokenAmount(balance || BigInt(0))} {selectedToken.symbol}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-2 pt-4">
              <Button className="w-full" onClick={handleTransfer} disabled={isSubmitDisabled} size="lg">
                {buttonText}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <LoadingOverlay isLoading={isLoadingOverlay} text="转账中..." />
    </div>
  );
};

export default TransferPanel;
