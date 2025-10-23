'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAccount, useBalance } from 'wagmi';
import { useForm } from 'react-hook-form';
import { isAddress } from 'viem';

// 地址转换工具
import { normalizeAddressInput, validateAddressInput, formatAddressForDisplay } from '@/src/lib/addressUtils';
import { useQueryClient } from '@tanstack/react-query';

// UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from '@/components/ui/form';

// my funcs
import { formatTokenAmount, formatUnits, parseUnits } from '@/src/lib/format';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my hooks
import { useBalanceOf, useTransfer } from '@/src/hooks/contracts/useLOVE20Token';
import { useNativeTransfer } from '@/src/hooks/contracts/useNativeTransfer';

// my context
import useTokenContext from '@/src/hooks/context/useTokenContext';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

// 代币配置接口
interface TokenConfig {
  symbol: string;
  address: `0x${string}` | 'NATIVE';
  decimals: number;
  isNative: boolean;
  name: string;
}

// 构建支持的代币列表
const buildSupportedTokens = (token: any): TokenConfig[] => {
  const supportedTokens: TokenConfig[] = [];
  const addedAddresses = new Set<string>(); // 用于追踪已添加的地址，避免重复

  // 辅助函数：安全添加代币
  const addToken = (tokenConfig: TokenConfig) => {
    const key = tokenConfig.address.toLowerCase();
    if (!addedAddresses.has(key)) {
      addedAddresses.add(key);
      supportedTokens.push(tokenConfig);
    }
  };

  // 1. 原生代币
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

  // 2. WETH9 包装代币
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

  // 3. 增加 TUSDT 代币
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
    // 4. 当前代币
    if (token.symbol && token.address) {
      addToken({
        symbol: token.symbol,
        address: token.address,
        decimals: 18,
        isNative: false,
        name: `当前代币 (${token.symbol})`,
      });
    }

    // 5. 父币（避免与WETH9重复）
    if (token.parentTokenSymbol && token.parentTokenAddress) {
      addToken({
        symbol: token.parentTokenSymbol,
        address: token.parentTokenAddress,
        decimals: 18,
        isNative: false,
        name: `父币 (${token.parentTokenSymbol})`,
      });
    }

    // 6. SL代币
    if (token.slTokenAddress && token.symbol) {
      addToken({
        symbol: `sl${token.symbol}`,
        address: token.slTokenAddress,
        decimals: 18,
        isNative: false,
        name: `SL代币 (sl${token.symbol})`,
      });
    }

    // 7. ST代币
    if (token.stTokenAddress && token.symbol) {
      addToken({
        symbol: `st${token.symbol}`,
        address: token.stTokenAddress,
        decimals: 18,
        isNative: false,
        name: `ST代币 (st${token.symbol})`,
      });
    }
  }

  return supportedTokens;
};

// 统一余额查询 Hook
const useTokenBalance = (tokenConfig: TokenConfig, account: `0x${string}` | undefined) => {
  // 原生代币使用 useBalance
  const { data: nativeBalance, isLoading: isLoadingNative } = useBalance({
    address: account,
    query: {
      enabled: !!account && tokenConfig.isNative,
    },
  });

  // ERC20 代币使用 useBalanceOf
  const { balance: erc20Balance, isPending: isPendingERC20 } = useBalanceOf(
    tokenConfig.isNative ? '0x0000000000000000000000000000000000000000' : (tokenConfig.address as `0x${string}`),
    account as `0x${string}`,
    !tokenConfig.isNative && !!account,
  );

  return {
    balance: tokenConfig.isNative ? nativeBalance?.value : erc20Balance,
    isPending: tokenConfig.isNative ? isLoadingNative : isPendingERC20,
  };
};

// 表单 Schema
const getTransferFormSchema = (balance: bigint) =>
  z.object({
    to: z
      .string()
      .nonempty('请输入目标地址')
      .refine(
        (val) => {
          const error = validateAddressInput(val);
          return error === null;
        },
        { message: '请输入有效的地址格式（支持 0x、TH 格式）' },
      ),
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
          } catch (e) {
            return false;
          }
        },
        { message: '转账数量必须大于0且不超过您的可用余额' },
      ),
    tokenAddress: z.string().nonempty('请选择代币'),
  });

// 手动定义类型避免 infer 的问题
type TransferFormValues = {
  to: string;
  amount: string;
  tokenAddress: string;
};

const TransferPanel = () => {
  const { address: account } = useAccount();
  const { token } = useTokenContext();
  const queryClient = useQueryClient();

  // 构建支持的代币列表
  const supportedTokens = useMemo(() => buildSupportedTokens(token), [token]);

  // 选中的代币状态
  const [selectedToken, setSelectedToken] = useState<TokenConfig | undefined>();
  const [isUserManuallySelected, setIsUserManuallySelected] = useState(false);
  const [lastProcessedTxHash, setLastProcessedTxHash] = useState<string | null>(null);
  const [addressConversionInfo, setAddressConversionInfo] = useState<string>('');
  const [convertedAddress, setConvertedAddress] = useState<`0x${string}` | null>(null);

  // 初始化选择代币逻辑：优先选择当前代币，其次选择第一个可用代币
  useEffect(() => {
    if (supportedTokens.length === 0) return;

    // 如果当前没有选中的代币，或者支持的代币列表发生了变化
    const currentTokenConfig = token ? supportedTokens.find((t) => t.address === token.address) : null;

    if (!selectedToken) {
      // 首次选择：优先选择当前代币，否则选择第一个
      setSelectedToken(currentTokenConfig || supportedTokens[0]);
    } else if (currentTokenConfig && selectedToken.address !== currentTokenConfig.address && !isUserManuallySelected) {
      // 只有在用户没有手动选择时，才自动切换到当前代币
      // 但只在选择的是基础代币（原生代币或WETH）时才自动切换
      const isBasicToken =
        selectedToken.isNative || selectedToken.address === process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN;
      if (isBasicToken) {
        setSelectedToken(currentTokenConfig);
      }
    }
  }, [supportedTokens, selectedToken, token, isUserManuallySelected]);

  // 余额查询
  const { balance, isPending: isPendingBalance } = useTokenBalance(selectedToken || supportedTokens[0], account);

  // 刷新余额的函数
  const refreshBalance = useCallback(() => {
    if (!selectedToken || !account) return;

    if (selectedToken.isNative) {
      // 刷新原生代币余额
      queryClient.invalidateQueries({
        queryKey: ['balance', { address: account }],
      });
    } else {
      // 刷新ERC20代币余额
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
    }
  }, [selectedToken, account, queryClient]);

  // 表单设置
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(getTransferFormSchema(balance || BigInt(0))),
    defaultValues: {
      to: '',
      amount: '',
      tokenAddress: '',
    },
    mode: 'onChange',
  });

  // 同步表单中的代币地址
  useEffect(() => {
    if (selectedToken) {
      form.setValue('tokenAddress', selectedToken.address);
    }
  }, [selectedToken, form]);

  // 监听地址输入变化，提供转换提示
  const watchedToAddress = form.watch('to');
  useEffect(() => {
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

    // 如果输入的不是0x格式，显示转换后的地址
    if (!trimmed.startsWith('0x')) {
      setAddressConversionInfo('将转换为:');
      setConvertedAddress(normalized as `0x${string}`);
    } else if (trimmed.toLowerCase() !== normalized) {
      setAddressConversionInfo('地址已标准化');
      setConvertedAddress(normalized as `0x${string}`);
    } else {
      setAddressConversionInfo('');
      setConvertedAddress(null);
    }
  }, [watchedToAddress]);

  // 监听数量输入
  const watchAmount = form.watch('amount');
  const [transferAmount, setTransferAmount] = useState<bigint>(BigInt(0));

  useEffect(() => {
    try {
      const amount = parseUnits(watchAmount || '0');
      setTransferAmount(amount);
    } catch {
      setTransferAmount(BigInt(0));
    }
  }, [watchAmount]);

  // 设置百分比数量
  const setPercentageAmount = (percentage: number) => {
    if (!balance || balance <= BigInt(0)) return;

    const amount = (balance * BigInt(percentage)) / BigInt(100);
    form.setValue('amount', formatUnits(amount));
  };

  // 设置最大数量
  const setMaxAmount = () => {
    if (!balance || balance <= BigInt(0)) return;

    form.setValue('amount', formatUnits(balance));
  };

  // ERC20 转账
  const {
    transfer: erc20Transfer,
    isPending: isPendingERC20Transfer,
    isConfirming: isConfirmingERC20Transfer,
    isConfirmed: isConfirmedERC20Transfer,
    writeError: errERC20Transfer,
    hash: erc20TxHash,
  } = useTransfer((selectedToken?.address as `0x${string}`) || '0x0000000000000000000000000000000000000000');

  // 原生代币转账
  const {
    transfer: nativeTransfer,
    isPending: isPendingNativeTransfer,
    isConfirming: isConfirmingNativeTransfer,
    isConfirmed: isConfirmedNativeTransfer,
    writeError: errNativeTransfer,
    hash: nativeTxHash,
  } = useNativeTransfer();

  const isTransferring =
    isPendingERC20Transfer || isConfirmingERC20Transfer || isPendingNativeTransfer || isConfirmingNativeTransfer;
  const isTransferConfirmed = isConfirmedERC20Transfer || isConfirmedNativeTransfer;

  // 监听转账成功
  useEffect(() => {
    const currentTxHash = erc20TxHash || nativeTxHash;

    if (isTransferConfirmed && currentTxHash && currentTxHash !== lastProcessedTxHash) {
      toast.success(`转账 ${selectedToken?.symbol} 成功`);
      // 只清空转账数量，保留目标地址和代币选择
      form.setValue('amount', '');
      // 刷新余额
      refreshBalance();
      // 记录已处理的交易哈希，避免重复处理
      setLastProcessedTxHash(currentTxHash);
    }
  }, [
    isTransferConfirmed,
    erc20TxHash,
    nativeTxHash,
    lastProcessedTxHash,
    selectedToken?.symbol,
    form,
    refreshBalance,
  ]);

  // 处理转账
  const handleTransfer = form.handleSubmit(async (data) => {
    if (!selectedToken || !account) return;

    // 标准化地址输入，支持TH、0x等格式
    const normalizedAddress = normalizeAddressInput(data.to);
    if (!normalizedAddress) {
      toast.error('地址格式无效，请检查输入');
      return;
    }

    try {
      const toAddress = normalizedAddress as `0x${string}`;

      if (selectedToken.isNative) {
        // 原生代币转账
        console.log('执行原生代币转账:', { to: toAddress, amount: transferAmount, symbol: selectedToken.symbol });
        await nativeTransfer(toAddress, transferAmount);
      } else {
        // ERC20代币转账
        console.log('执行ERC20代币转账:', {
          token: selectedToken.address,
          to: toAddress,
          amount: transferAmount,
          symbol: selectedToken.symbol,
        });
        await erc20Transfer(toAddress, transferAmount);
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      // 错误会通过 errorUtils 处理，这里不需要额外的toast
    }
  });

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    const errors = [errERC20Transfer, errNativeTransfer];
    errors.forEach((error) => {
      if (error) {
        handleContractError(error, 'transfer');
      }
    });
  }, [errERC20Transfer, errNativeTransfer, handleContractError]);

  // 加载状态
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

  return (
    <div className="p-6">
      <LeftTitle title="转账" />
      <div className="w-full max-w-md mt-4">
        <Form {...form}>
          <form className="space-y-4">
            {/* 目标地址输入 */}
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 代币选择 */}
            <FormField
              control={form.control}
              name="tokenAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">选择代币</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={field.value}
                        onValueChange={(val) => {
                          const token = supportedTokens.find((t) => t.address === val);
                          if (token) {
                            setIsUserManuallySelected(true); // 标记为用户手动选择
                            setSelectedToken(token);
                            field.onChange(val);
                            form.setValue('amount', ''); // 重置数量
                          }
                        }}
                        disabled={isDisabled}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="请选择代币" />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedTokens.map((token) => (
                            <SelectItem key={token.address} value={token.address}>
                              <span className="font-mono font-medium">{token.symbol}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedToken && selectedToken.address !== 'NATIVE' && (
                        <AddressWithCopyButton
                          address={selectedToken.address as `0x${string}`}
                          showAddress={false}
                          showCopyButton={true}
                          colorClassName="text-gray-600"
                        />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 转账数量输入 */}
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

            {/* 转账按钮 */}
            <div className="flex space-x-2 pt-4">
              <Button className="w-full" onClick={handleTransfer} disabled={isTransferring || isDisabled} size="lg">
                {isTransferring ? '转账中...' : '转账'}
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
