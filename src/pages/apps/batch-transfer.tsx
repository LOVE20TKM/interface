'use client';

import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readContract } from '@wagmi/core';
import { AlertTriangle, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatUnits, isAddress, parseUnits, zeroAddress } from 'viem';
import { useAccount, useBalance, useBytecode } from 'wagmi';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import Header from '@/src/components/Header';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import TokenSelect, { CUSTOM_TOKEN_VALUE } from '@/src/components/Token/TokenSelect';
import { BatchTransferAbi } from '@/src/abis/BatchTransfer';
import { LOVE20TokenAbi } from '@/src/abis/LOVE20Token';
import { TokenContext, type Token } from '@/src/contexts/TokenContext';
import { useIsOnTargetChain } from '@/src/hooks/useIsOnTargetChain';
import { useUSDTPairAddress } from '@/src/hooks/composite/useUSDTPairAddress';
import {
  BATCH_TRANSFER_CONTRACT_ADDRESS,
  isBatchTransferEnabled,
  useBatchTransferERC20,
  useBatchTransferNative,
} from '@/src/hooks/contracts/useBatchTransfer';
import { useBalanceOf } from '@/src/hooks/contracts/useLOVE20Token';
import { useTokenApproval } from '@/src/hooks/contracts/useTokenApproval';
import { useUniversalReadContract } from '@/src/lib/universalReadContract';
import { config } from '@/src/wagmi';
import { normalizeAddressInput } from '@/src/lib/addressUtils';
import { isUnlimitedTokenApproval } from '@/src/lib/tokenApproval';
import { buildSupportedTokenOptions, TokenOption } from '@/src/lib/tokenOptions';

type TransferMode = 'native' | 'erc20';
type AuditStatus = 'pending' | 'ok' | 'changed';

interface ProtectedTargetInfo {
  label: string;
  address: `0x${string}`;
  type: 'token' | 'contract';
}

interface ParsedRecipient {
  id: string;
  lineNumber: number;
  raw: string;
  addressInput: string;
  amountInput: string;
  address?: `0x${string}`;
  amount?: bigint;
  errors: string[];
}

interface AuditRow {
  pre?: bigint;
  post?: bigint;
  delta?: bigint;
  status: AuditStatus;
}

interface BalanceAudit {
  key: string;
  preBalances: Record<string, bigint>;
  postBalances?: Record<string, bigint>;
}

const DEFAULT_DECIMALS = 18;
const DISPLAY_FRACTION_DIGITS = 6;
const POST_BALANCE_RETRY_MS = 2500;

const normalizeTokenAddress = (value: string): `0x${string}` | undefined => {
  const normalized = normalizeAddressInput(value);
  if (!normalized || !isAddress(normalized) || normalized === zeroAddress) return undefined;
  return normalized as `0x${string}`;
};

const trimFormattedAmount = (value: string) => {
  if (!value.includes('.')) return value;
  return value.replace(/\.?0+$/, '');
};

const addThousandsSeparators = (value: string) => {
  const [whole, fraction] = value.split('.');
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction ? `${groupedWhole}.${fraction}` : groupedWhole;
};

const formatFullTokenAmount = (value: bigint | undefined, decimals: number) => {
  if (value === undefined) return '-';
  return addThousandsSeparators(trimFormattedAmount(formatUnits(value, decimals)));
};

const formatTokenAmount = (value: bigint | undefined, decimals: number, maxFractionDigits = DISPLAY_FRACTION_DIGITS) => {
  if (value === undefined) return '-';
  const formatted = formatFullTokenAmount(value, decimals);
  const [whole, fraction] = formatted.split('.');
  if (!fraction || fraction.length <= maxFractionDigits) return formatted;

  const visibleFraction = fraction.slice(0, maxFractionDigits).replace(/0+$/, '') || fraction.slice(0, maxFractionDigits);
  return `${whole}.${visibleFraction}...`;
};

const formatSignedTokenAmount = (value: bigint | undefined, decimals: number) => {
  if (value === undefined) return '-';
  if (value < BigInt(0)) {
    return `-${formatTokenAmount(-value, decimals)}`;
  }
  return formatTokenAmount(value, decimals);
};

const splitRecipientRow = (raw: string) => {
  const trimmed = raw.trim();
  const match = trimmed.match(/^([^\s,]+)[\s,]*(.*)$/);
  return {
    addressInput: match?.[1] || '',
    amountInput: (match?.[2] || '').trim(),
  };
};

const normalizeTransferAmountInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed.includes(',')) return trimmed;

  const groupedAmountPattern = /^-?(?:(?:\d{1,3}(?:,\d{3})+)|\d+)(?:\.\d+)?$/;
  if (!groupedAmountPattern.test(trimmed)) return undefined;

  return trimmed.replace(/,/g, '');
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    { label: 'Group Delegate', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_DELEGATE },
    { label: 'Group Chat', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT },
    { label: 'Group Chat Admin', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN },
    { label: 'Group Chat Ban List', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_BAN_LIST },
    { label: 'Group Chat Admin Ban Source', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN_BAN_SOURCE },
    { label: 'Group Chat Gov Voted Ban Source', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_GOV_VOTED_BAN_SOURCE },
    { label: 'Group Chat Member', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_MEMBER },
    { label: 'Group Chat Member Scope', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_MEMBER_SCOPE },
    { label: 'Group Chat Join Scope Source', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_JOIN_SCOPE_SOURCE },
    { label: 'Group Chat Token Main Manager', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_MAIN_MANAGER },
    { label: 'Group Chat Token Gov Manager', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_GOV_MANAGER },
    {
      label: 'Group Chat Token Action Gov Manager',
      address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER,
    },
    {
      label: 'Group Chat Token Action Main Manager',
      address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER,
    },
    { label: 'Extension Center', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER },
    { label: 'LP Factory', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_LP_FACTORY },
    { label: 'LP Factory V2', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_LP_FACTORY_V2 },
    { label: 'Group Manager', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER },
    { label: 'Group Join', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN },
    { label: 'Group Verify', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY },
    { label: 'Group Action Factory', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_ACTION_FACTORY },
    { label: 'Group Recipients', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_RECIPIENTS },
    { label: 'Group Service Factory', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_SERVICE_FACTORY },
    { label: 'Batch Transfer', address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BATCH_TRANSFER },
  ];

  const added = new Set<string>();

  return knownContracts.flatMap(({ label, address }) => {
    if (!address || !isAddress(address)) return [];

    const normalizedAddress = address.toLowerCase();
    if (normalizedAddress === zeroAddress || added.has(normalizedAddress)) return [];

    added.add(normalizedAddress);
    return [{ label, address: address as `0x${string}`, type: 'contract' as const }];
  });
};

const KNOWN_CONTRACT_TARGETS = buildKnownContractTargets();

const buildProtectedTokenTargets = (token: Token | null | undefined, tokens: TokenOption[]): ProtectedTargetInfo[] => {
  const targets = new Map<string, ProtectedTargetInfo>();

  const addTarget = (label: string, address?: string) => {
    if (!address || !isAddress(address) || address === zeroAddress) return;
    targets.set(address.toLowerCase(), {
      label,
      address: address as `0x${string}`,
      type: 'token',
    });
  };

  tokens.forEach((item) => {
    if (item.address === 'NATIVE') return;
    addTarget(item.symbol, item.address);
  });

  addTarget(token?.symbol ? `sl${token.symbol}` : 'SL', token?.slTokenAddress);
  addTarget(token?.symbol ? `st${token.symbol}` : 'ST', token?.stTokenAddress);

  return [...targets.values()];
};

const parseRecipientRows = (
  input: string,
  decimals: number,
  senderAddress?: `0x${string}`,
) => {
  const addressCounts = new Map<string, number>();
  const senderKey = senderAddress?.toLowerCase();
  const rows: ParsedRecipient[] = input
    .split(/\r?\n/)
    .map((raw, index) => ({ raw, lineNumber: index + 1 }))
    .filter(({ raw }) => raw.trim().length > 0)
    .map(({ raw, lineNumber }) => {
      const { addressInput, amountInput } = splitRecipientRow(raw);
      const errors: string[] = [];
      const normalizedAddress = normalizeAddressInput(addressInput);
      let parsedAmount: bigint | undefined;

      if (!addressInput || !amountInput) {
        errors.push('缺少地址或数量');
      }

      if (!normalizedAddress || !isAddress(normalizedAddress) || normalizedAddress === zeroAddress) {
        errors.push('地址不合法');
      }

      if (senderKey && normalizedAddress && isAddress(normalizedAddress) && normalizedAddress.toLowerCase() === senderKey) {
        errors.push('收款地址不能是当前钱包地址');
      }

      if (!amountInput) {
        errors.push('缺少数量');
      } else {
        const normalizedAmountInput = normalizeTransferAmountInput(amountInput);
        try {
          if (!normalizedAmountInput) throw new Error('Invalid amount');
          parsedAmount = parseUnits(normalizedAmountInput, decimals);
          if (parsedAmount <= BigInt(0)) {
            errors.push('数量必须大于0');
          }
        } catch {
          errors.push('数量格式不合法');
        }
      }

      if (normalizedAddress && isAddress(normalizedAddress)) {
        const key = normalizedAddress.toLowerCase();
        addressCounts.set(key, (addressCounts.get(key) || 0) + 1);
      }

      return {
        id: `${lineNumber}-${raw}`,
        lineNumber,
        raw,
        addressInput,
        amountInput,
        address: normalizedAddress && isAddress(normalizedAddress) ? (normalizedAddress as `0x${string}`) : undefined,
        amount: parsedAmount,
        errors,
      };
    });

  const dedupedRows = rows.map((row) => {
    if (!row.address) return row;
    const duplicateCount = addressCounts.get(row.address.toLowerCase()) || 0;
    if (duplicateCount <= 1) return row;
    return {
      ...row,
      errors: [...row.errors, '地址重复'],
    };
  });

  return { rows: dedupedRows, batchErrors: [] as string[] };
};

const makeAuditKey = (mode: TransferMode, tokenAddress: string, rows: ParsedRecipient[]) => {
  const payload = rows
    .map((row) => `${row.address?.toLowerCase() || ''}:${row.amount?.toString() || ''}`)
    .join('|');
  return `${mode}:${tokenAddress.toLowerCase()}:${payload}`;
};

const compareAuditRows = (rows: ParsedRecipient[], audit: BalanceAudit | null) => {
  const result: Record<string, AuditRow> = {};
  rows.forEach((row) => {
    if (!row.address || row.amount === undefined || !audit) {
      result[row.id] = { status: 'pending' };
      return;
    }

    const key = row.address.toLowerCase();
    const pre = audit.preBalances[key];
    const post = audit.postBalances?.[key];
    const delta = pre !== undefined && post !== undefined ? post - pre : undefined;

    result[row.id] = {
      pre,
      post,
      delta,
      status: delta === undefined ? 'pending' : delta === row.amount ? 'ok' : 'changed',
    };
  });
  return result;
};

export default function BatchTransferPage() {
  const { token } = useContext(TokenContext) || {};
  const { address: account, isConnected } = useAccount();
  const isOnTargetChain = useIsOnTargetChain();
  const { pairAddress: usdtLpPairAddress, usdtSymbol } = useUSDTPairAddress(token?.address);

  const [mode, setMode] = useState<TransferMode>('native');
  const [selectedTokenKey, setSelectedTokenKey] = useState('NATIVE');
  const [customTokenInput, setCustomTokenInput] = useState('');
  const [recipientsInput, setRecipientsInput] = useState('');
  const [audit, setAudit] = useState<BalanceAudit | null>(null);
  const [pendingAuditKey, setPendingAuditKey] = useState<string | null>(null);
  const [pendingTransferMode, setPendingTransferMode] = useState<TransferMode | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [isAssetProtectionEnabled, setIsAssetProtectionEnabled] = useState(true);
  const [lastProcessedTxHash, setLastProcessedTxHash] = useState<`0x${string}` | null>(null);

  const defaultTokens = useMemo(
    () =>
      buildSupportedTokenOptions(token, {
        usdtLpPairAddress:
          usdtLpPairAddress && usdtLpPairAddress !== zeroAddress ? usdtLpPairAddress : undefined,
        usdtSymbol,
      }),
    [token, usdtLpPairAddress, usdtSymbol],
  );
  const erc20Tokens = useMemo(() => defaultTokens.filter((item) => !item.isNative), [defaultTokens]);
  const customTokenAddress = useMemo(() => normalizeTokenAddress(customTokenInput), [customTokenInput]);
  const { data: customTokenBytecode, isLoading: isLoadingCustomTokenBytecode } = useBytecode({
    address: customTokenAddress,
    query: {
      enabled: mode === 'erc20' && selectedTokenKey === CUSTOM_TOKEN_VALUE && !!customTokenAddress,
    },
  });
  const isCustomTokenContract = !!customTokenBytecode && customTokenBytecode !== '0x';
  const isCustomTokenEoa =
    mode === 'erc20' &&
    selectedTokenKey === CUSTOM_TOKEN_VALUE &&
    !!customTokenAddress &&
    !isLoadingCustomTokenBytecode &&
    !isCustomTokenContract;

  const { data: customSymbolData, isPending: isPendingCustomSymbol, error: customSymbolError } = useUniversalReadContract({
    address: customTokenAddress || zeroAddress,
    abi: LOVE20TokenAbi,
    functionName: 'symbol',
    query: {
      enabled: mode === 'erc20' && selectedTokenKey === CUSTOM_TOKEN_VALUE && isCustomTokenContract,
    },
  });

  const { data: customDecimalsData, isPending: isPendingCustomDecimals, error: customDecimalsError } = useUniversalReadContract({
    address: customTokenAddress || zeroAddress,
    abi: LOVE20TokenAbi,
    functionName: 'decimals',
    query: {
      enabled: mode === 'erc20' && selectedTokenKey === CUSTOM_TOKEN_VALUE && isCustomTokenContract,
    },
  });

  const selectedToken = useMemo<TokenOption>(() => {
    if (mode === 'native') {
      return defaultTokens.find((item) => item.address === 'NATIVE') || defaultTokens[0];
    }

    if (selectedTokenKey !== CUSTOM_TOKEN_VALUE) {
      return erc20Tokens.find((item) => item.address === selectedTokenKey) || erc20Tokens[0] || {
        symbol: '自定义ERC20',
        name: '自定义 ERC20',
        address: zeroAddress,
        decimals: DEFAULT_DECIMALS,
        isNative: false,
      };
    }

    return {
      symbol: (customSymbolData as string | undefined) || '自定义ERC20',
      name: '自定义 ERC20',
      address: customTokenAddress || zeroAddress,
      decimals: typeof customDecimalsData === 'number' ? customDecimalsData : DEFAULT_DECIMALS,
      isNative: false,
    };
  }, [customDecimalsData, customSymbolData, customTokenAddress, defaultTokens, erc20Tokens, mode, selectedTokenKey]);

  const selectedTokenAddress =
    selectedToken.address !== 'NATIVE' ? selectedToken.address : zeroAddress;
  const selectedTokenDecimals = selectedToken.decimals;
  const isCustomTokenSelected = mode === 'erc20' && selectedTokenKey === CUSTOM_TOKEN_VALUE;
  const selectedTokenDecimalsText = isCustomTokenSelected
    ? !customTokenAddress
      ? '-'
      : isPendingCustomDecimals
        ? '读取中...'
        : typeof customDecimalsData === 'number'
          ? customDecimalsData.toString()
          : '读取失败'
    : selectedTokenDecimals.toString();
  const canUseCustomToken =
    selectedTokenKey !== CUSTOM_TOKEN_VALUE ||
    (!!customTokenAddress && typeof customDecimalsData === 'number' && !isPendingCustomSymbol && !isPendingCustomDecimals);
  const customTokenInfoFailed = !!customTokenAddress && (isCustomTokenEoa || !!customSymbolError || !!customDecimalsError);
  const fallbackErc20Address = useMemo(
    () => erc20Tokens[0]?.address as `0x${string}` | undefined,
    [erc20Tokens],
  );
  const shouldReadErc20Data =
    mode === 'erc20' && !selectedToken.isNative && selectedTokenAddress !== zeroAddress && !!account && canUseCustomToken;
  const erc20HookAddress = shouldReadErc20Data ? selectedTokenAddress : fallbackErc20Address || BATCH_TRANSFER_CONTRACT_ADDRESS;

  const protectedTargetMap = useMemo(() => {
    const targets = new Map<string, ProtectedTargetInfo>();

    buildProtectedTokenTargets(token, defaultTokens).forEach((target) => {
      targets.set(target.address.toLowerCase(), target);
    });

    if (customTokenAddress) {
      targets.set(customTokenAddress.toLowerCase(), {
        label: selectedToken.symbol,
        address: customTokenAddress,
        type: 'token',
      });
    }

    KNOWN_CONTRACT_TARGETS.forEach((target) => {
      const key = target.address.toLowerCase();
      if (!targets.has(key)) {
        targets.set(key, target);
      }
    });

    return targets;
  }, [customTokenAddress, defaultTokens, selectedToken.symbol, token]);

  const { rows: parsedRows, batchErrors } = useMemo(
    () => parseRecipientRows(recipientsInput, selectedTokenDecimals, account),
    [account, recipientsInput, selectedTokenDecimals],
  );

  const protectedRecipientMap = useMemo(() => {
    const protectedRows = new Map<string, ProtectedTargetInfo>();
    parsedRows.forEach((row) => {
      if (!row.address || row.errors.length > 0) return;
      const target = protectedTargetMap.get(row.address.toLowerCase());
      if (target) {
        protectedRows.set(row.id, target);
      }
    });
    return protectedRows;
  }, [parsedRows, protectedTargetMap]);

  const hasRowErrors = useMemo(() => parsedRows.some((row) => row.errors.length > 0), [parsedRows]);
  const protectedRecipientCount = protectedRecipientMap.size;
  const hasProtectedRecipients = isAssetProtectionEnabled && protectedRecipientCount > 0;
  const validRows = useMemo(
    () => parsedRows.filter((row) => row.errors.length === 0 && row.address && row.amount !== undefined),
    [parsedRows],
  );
  const recipients = useMemo(() => validRows.map((row) => row.address!) as `0x${string}`[], [validRows]);
  const amounts = useMemo(() => validRows.map((row) => row.amount!) as bigint[], [validRows]);
  const totalAmount = useMemo(() => amounts.reduce((sum, amount) => sum + amount, BigInt(0)), [amounts]);
  const rowErrorCount = useMemo(
    () =>
      parsedRows.filter((row) => row.errors.length > 0 || (isAssetProtectionEnabled && protectedRecipientMap.has(row.id)))
        .length,
    [isAssetProtectionEnabled, parsedRows, protectedRecipientMap],
  );
  const currentAuditKey = useMemo(
    () => makeAuditKey(mode, selectedToken.address.toString(), validRows),
    [mode, selectedToken.address, validRows],
  );
  const isAuditFresh = !!audit && audit.key === currentAuditKey;
  const auditRows = useMemo(() => compareAuditRows(parsedRows, audit), [audit, parsedRows]);

  const {
    data: nativeBalance,
    isLoading: isPendingNativeBalance,
    refetch: refetchNativeBalance,
  } = useBalance({
    address: account,
    query: {
      enabled: !!account && selectedToken.isNative,
    },
  });

  const { balance: erc20Balance, isPending: isPendingErc20Balance, refetch: refetchErc20Balance } = useBalanceOf(
    erc20HookAddress,
    account as `0x${string}`,
    shouldReadErc20Data,
  );

  const {
    approve,
    allowance,
    needsApproval,
    isChecking: isPendingAllowance,
    isApprovingTx: isPendingApprove,
    isConfirming: isConfirmingApprove,
    refetchAllowance,
    approvalActionText,
  } = useTokenApproval({
    token: erc20HookAddress,
    owner: account as `0x${string}` | undefined,
    spender: BATCH_TRANSFER_CONTRACT_ADDRESS,
    amount: totalAmount,
    enabled: shouldReadErc20Data && totalAmount > BigInt(0),
    successMessage: '授权已确认',
  });

  const {
    batchTransferNative,
    isPending: isPendingNativeTransfer,
    isConfirming: isConfirmingNativeTransfer,
    isConfirmed: isConfirmedNativeTransfer,
    hash: nativeTxHash,
  } = useBatchTransferNative();

  const {
    batchTransferERC20,
    isPending: isPendingErc20Transfer,
    isConfirming: isConfirmingErc20Transfer,
    isConfirmed: isConfirmedErc20Transfer,
    hash: erc20TxHash,
  } = useBatchTransferERC20();

  const accountBalance = selectedToken.isNative ? nativeBalance?.value : erc20Balance;
  const isPendingBalance = selectedToken.isNative ? isPendingNativeBalance : isPendingErc20Balance;
  const hasEnoughBalance = accountBalance !== undefined && accountBalance >= totalAmount;
  const isBusy =
    isLoadingAudit ||
    isPendingApprove ||
    isConfirmingApprove ||
    isPendingNativeTransfer ||
    isConfirmingNativeTransfer ||
    isPendingErc20Transfer ||
    isConfirmingErc20Transfer;

  const validationErrors = useMemo(() => {
    const errors = [...batchErrors];
    if (!isBatchTransferEnabled) errors.push('当前环境未配置批量转账合约地址');
    if (!isConnected || !account) errors.push('请先连接钱包');
    if (!isOnTargetChain) errors.push(`请切换到 ${process.env.NEXT_PUBLIC_CHAIN_NAME || '目标'} 网络`);
    if (parsedRows.length === 0) errors.push('请输入至少一行收款地址和数量');
    if (hasRowErrors) errors.push('请先修正名单中的错误行');
    if (hasProtectedRecipients) errors.push('资产保护已拦截疑似合约收款地址；如需强制转账，请先关闭资产保护开关');
    if (mode === 'erc20' && selectedTokenAddress === zeroAddress) errors.push('请选择或输入有效的 ERC20 代币地址');
    if (mode === 'erc20' && !canUseCustomToken) errors.push('自定义 ERC20 信息读取中或读取失败');
    if (totalAmount <= BigInt(0)) errors.push('总转账数量必须大于0');
    if (isPendingBalance) errors.push('钱包余额读取中');
    if (!isPendingBalance && accountBalance === undefined) errors.push('钱包余额读取失败');
    if (accountBalance !== undefined && !hasEnoughBalance) errors.push('钱包余额不足');
    if (mode === 'erc20' && isPendingAllowance) errors.push('授权额度读取中');
    return errors;
  }, [
    account,
    accountBalance,
    batchErrors,
    canUseCustomToken,
    hasEnoughBalance,
    hasProtectedRecipients,
    hasRowErrors,
    isConnected,
    isOnTargetChain,
    isPendingAllowance,
    isPendingBalance,
    mode,
    parsedRows.length,
    selectedTokenAddress,
    shouldReadErc20Data,
    totalAmount,
    validRows.length,
  ]);

  useEffect(() => {
    setAudit(null);
    setPendingAuditKey(null);
    setPendingTransferMode(null);
  }, [currentAuditKey]);

  const readRecipientBalances = useCallback(async () => {
    if (recipients.length === 0) return {};

    const balances = selectedToken.isNative
      ? ((await readContract(config, {
          address: BATCH_TRANSFER_CONTRACT_ADDRESS,
          abi: BatchTransferAbi,
          functionName: 'nativeBalances',
          args: [recipients],
        })) as readonly bigint[])
      : ((await readContract(config, {
          address: BATCH_TRANSFER_CONTRACT_ADDRESS,
          abi: BatchTransferAbi,
          functionName: 'erc20Balances',
          args: [selectedTokenAddress, recipients],
        })) as readonly bigint[]);

    return recipients.reduce<Record<string, bigint>>((snapshot, recipient, index) => {
      snapshot[recipient.toLowerCase()] = balances[index] || BigInt(0);
      return snapshot;
    }, {});
  }, [recipients, selectedToken.isNative, selectedTokenAddress]);

  const handleLoadPreBalances = async () => {
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    try {
      setIsLoadingAudit(true);
      const preBalances = await readRecipientBalances();
      setAudit({
        key: currentAuditKey,
        preBalances,
      });
      toast.success('转账前余额已加载');
    } catch (error) {
      console.error('Load pre balances failed:', error);
      toast.error('转账前余额加载失败，请稍后重试');
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleApprove = async () => {
    if (selectedToken.isNative || selectedTokenAddress === zeroAddress) return;
    if (totalAmount <= BigInt(0)) {
      toast.error('请先输入有效的转账名单');
      return;
    }

    try {
      await approve();
    } catch (error) {
      console.error('Approve batch transfer failed:', error);
    }
  };

  const handleSubmitTransfer = async () => {
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }
    if (!isAuditFresh) {
      toast.error('请先点击“加载转账前余额”；名单或代币修改后需要重新加载');
      return;
    }
    if (needsApproval) {
      toast.error('请先完成 ERC20 授权');
      return;
    }

    try {
      setPendingAuditKey(currentAuditKey);
      setPendingTransferMode(selectedToken.isNative ? 'native' : 'erc20');
      if (selectedToken.isNative) {
        await batchTransferNative(recipients, amounts, totalAmount);
      } else {
        await batchTransferERC20(selectedTokenAddress, recipients, amounts);
      }
    } catch (error) {
      setPendingAuditKey(null);
      setPendingTransferMode(null);
      console.error('Batch transfer failed:', error);
    }
  };

  useEffect(() => {
    const confirmedHash =
      pendingTransferMode === 'native' && isConfirmedNativeTransfer
        ? nativeTxHash
        : pendingTransferMode === 'erc20' && isConfirmedErc20Transfer
          ? erc20TxHash
          : undefined;
    if (!confirmedHash || confirmedHash === lastProcessedTxHash || !pendingAuditKey || !audit || audit.key !== pendingAuditKey) {
      return;
    }

    let cancelled = false;

    const loadPostBalances = async () => {
      try {
        setIsLoadingAudit(true);
        let postBalances = await readRecipientBalances();
        const hasMismatch = validRows.some((row) => {
          if (!row.address || row.amount === undefined) return false;
          const key = row.address.toLowerCase();
          const pre = audit.preBalances[key];
          const post = postBalances[key];
          return pre === undefined || post === undefined || post - pre !== row.amount;
        });

        if (hasMismatch) {
          await sleep(POST_BALANCE_RETRY_MS);
          postBalances = await readRecipientBalances();
        }

        if (cancelled) return;

        setAudit({
          ...audit,
          postBalances,
        });
        setLastProcessedTxHash(confirmedHash);
        setPendingAuditKey(null);
        setPendingTransferMode(null);
        refetchAllowance?.();
        refetchNativeBalance?.();
        refetchErc20Balance?.();
        toast.success('批量转账已确认，已加载转账后余额');
      } catch (error) {
        console.error('Load post balances failed:', error);
        toast.error('交易已确认，但转账后余额加载失败，请稍后重新检查');
      } finally {
        if (!cancelled) setIsLoadingAudit(false);
      }
    };

    loadPostBalances();

    return () => {
      cancelled = true;
    };
  }, [
    audit,
    erc20TxHash,
    isConfirmedErc20Transfer,
    isConfirmedNativeTransfer,
    lastProcessedTxHash,
    nativeTxHash,
    pendingAuditKey,
    pendingTransferMode,
    readRecipientBalances,
    refetchAllowance,
    refetchErc20Balance,
    refetchNativeBalance,
    validRows,
  ]);

  const submitButtonText =
    isPendingNativeTransfer || isPendingErc20Transfer
      ? selectedToken.isNative
        ? '2.提交中...'
        : '3.提交中...'
      : isConfirmingNativeTransfer || isConfirmingErc20Transfer
        ? selectedToken.isNative
          ? '2.确认中...'
          : '3.确认中...'
        : selectedToken.isNative
          ? '2.批量转账'
          : '3.批量转账';
  const approveButtonText =
    isPendingApprove || isConfirmingApprove ? '1.授权中...' : needsApproval ? `1.${approvalActionText}` : '1.已授权';
  const loadPreBalancesButtonText = selectedToken.isNative ? '1.加载余额' : '2.加载余额';

  const isSubmitDisabled =
    isBusy || validationErrors.length > 0 || !isAuditFresh || needsApproval || recipients.length === 0;
  const isPrecheckDisabled = isBusy || validationErrors.length > 0 || recipients.length === 0;
  const isApproveDisabled =
    selectedToken.isNative || isBusy || validationErrors.length > 0 || !needsApproval || totalAmount <= BigInt(0);

  const renderAmountValue = (value: bigint | undefined, className = '') => (
    <span title={formatFullTokenAmount(value, selectedTokenDecimals)} className={className}>
      {formatTokenAmount(value, selectedTokenDecimals)}
    </span>
  );

  const renderRowStatus = (row: ParsedRecipient, auditRow: AuditRow | undefined, isProtectedRow: boolean) => {
    if (row.errors.length > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-red-600">
          <XCircle className="h-4 w-4 shrink-0" />
          待修正
        </span>
      );
    }

    if (isProtectedRow) {
      return (
        <span className="inline-flex items-start gap-1 text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          资产保护已拦截
        </span>
      );
    }

    if (auditRow?.status === 'ok') {
      return (
        <span className="inline-flex items-center gap-1 text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          差值一致
        </span>
      );
    }

    if (auditRow?.status === 'changed') {
      return (
        <span className="inline-flex items-start gap-1 text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          差值不一致，可能转账期间该钱包有其他余额变化
        </span>
      );
    }

    return isAuditFresh ? <span className="text-greyscale-500">等待转账</span> : <span className="text-amber-700">需加载快照</span>;
  };

  if (!isBatchTransferEnabled) {
    return (
      <>
        <Header title="批量转账" showBackButton={true} />
        <main className="flex-grow">
          <div className="mx-auto w-full max-w-4xl px-4 py-6">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              当前环境未配置批量转账合约地址，因此此工具不可用。
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="批量转账" showBackButton={true} />
      <LoadingOverlay isLoading={isBusy} text="处理中..." />
      <main className="flex-grow">
        <div className="mx-auto w-full max-w-[1400px] px-3 pb-24 pt-3 sm:px-4 sm:pt-6">
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            批量转账是原子操作：任意一笔失败会导致整批回滚。提交前会加载收款地址余额快照，交易确认后会再次读取余额并校验差值。
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(360px,430px),minmax(0,1fr)]">
            <section className="space-y-4">
              <Card>
                <CardContent className="space-y-4 p-4">
                  <Tabs
                    value={mode}
                    onValueChange={(value) => {
                      const nextMode = value as TransferMode;
                      setMode(nextMode);
                      setSelectedTokenKey(nextMode === 'native' ? 'NATIVE' : erc20Tokens[0]?.address || CUSTOM_TOKEN_VALUE);
                    }}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="native">TKM 原生币</TabsTrigger>
                      <TabsTrigger value="erc20">ERC20</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {mode === 'erc20' && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-greyscale-700">选择代币</label>
                        <TokenSelect
                          value={selectedTokenKey}
                          onValueChange={setSelectedTokenKey}
                          tokens={erc20Tokens}
                          selectedToken={selectedTokenAddress !== zeroAddress ? selectedToken : undefined}
                          customTokenAddress={customTokenInput}
                          onCustomTokenAddressChange={setCustomTokenInput}
                          showAddToMetamask={true}
                          customTokenDetails={
                            customTokenAddress ? (
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
                                    <div className="mt-0.5 font-mono">{(customSymbolData as string | undefined) || '读取中...'}</div>
                                  </div>
                                  <div>
                                    <div className="text-greyscale-400">精度</div>
                                    <div className="mt-0.5 font-mono">{customDecimalsData !== undefined ? String(customDecimalsData) : '读取中...'}</div>
                                  </div>
                                  <div>
                                    <div className="text-greyscale-400">余额</div>
                                    <div className="mt-0.5 font-mono">
                                      {isPendingBalance ? '读取中...' : formatTokenAmount(accountBalance, selectedTokenDecimals)}
                                    </div>
                                  </div>
                                </div>
                              )
                            ) : null
                          }
                          renderDecoration={(item) =>
                            item.address === selectedTokenAddress ? (
                              <span className="text-xs text-greyscale-500">
                                余额 {isPendingBalance ? '读取中...' : formatTokenAmount(accountBalance, item.decimals)}
                              </span>
                            ) : null
                          }
                        />
                      </div>

                      {selectedTokenKey === CUSTOM_TOKEN_VALUE && customTokenInput && !customTokenAddress && (
                        <div className="text-xs text-red-600">请输入合法且非零的 ERC20 地址</div>
                      )}
                    </div>
                  )}

                  <div className="rounded-md bg-greyscale-50 p-3 text-sm">
	                    <div className="flex items-center justify-between gap-3">
	                      <span className="text-greyscale-500">当前资产</span>
	                      <span className="font-semibold text-greyscale-900">{selectedToken.symbol}</span>
	                    </div>
	                    <div className="mt-2 flex items-center justify-between gap-3">
	                      <span className="text-greyscale-500">Decimals</span>
	                      <span className="font-mono text-greyscale-900">{selectedTokenDecimalsText}</span>
	                    </div>
	                    {!selectedToken.isNative && selectedTokenAddress !== zeroAddress && (
	                      <div className="mt-2 flex items-center justify-between gap-3">
	                        <span className="text-greyscale-500">代币地址</span>
                        <AddressWithCopyButton
                          address={selectedToken.address as `0x${string}`}
                          showAddress={true}
                          showCopyButton={true}
                          colorClassName="text-greyscale-700"
                        />
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-greyscale-500">钱包余额</span>
                      <span className="min-w-0 truncate font-mono">
                        {isPendingBalance ? '读取中...' : renderAmountValue(accountBalance)}
                      </span>
                    </div>
                    {!selectedToken.isNative && (
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="shrink-0 text-greyscale-500">授权额度</span>
                        <span className="min-w-0 truncate font-mono">
                          {isPendingAllowance
                            ? '读取中...'
                            : isUnlimitedTokenApproval(allowance)
                              ? '长期授权'
                              : renderAmountValue(allowance)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-3 p-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-greyscale-700">收款名单</label>
                    <Textarea
                      value={recipientsInput}
                      onChange={(event) => setRecipientsInput(event.target.value)}
                      placeholder={'每行一个地址和数量，例如：\n0x1234... 1.5\nTH... , 25,555.123'}
                      className="min-h-56 font-mono text-sm"
                    />
                    <div className="mt-1 text-xs text-greyscale-500">
                      地址和数量可用空格、逗号、制表符分隔；数量支持 25,555.123 这种千分位写法。
                    </div>
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        className="checkbox mt-0.5 accent-secondary"
                        checked={isAssetProtectionEnabled}
                        onChange={(event) => setIsAssetProtectionEnabled(event.target.checked)}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-amber-900">资产保护开关</div>
                        <div className="mt-1 text-xs text-amber-800">
                          默认开启。若任意收款地址命中已知代币或协议合约地址，本次批量转账会被拦截，避免误把资产转入合约。
                        </div>
                      </div>
                    </label>

                    {hasProtectedRecipients && (
                      <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        已触发资产保护：{protectedRecipientCount} 行收款地址命中已知合约地址。如需强制转账，请关闭上方保护开关后重新检查。
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md bg-greyscale-50 p-3">
                      <div className="text-greyscale-500">收款人数</div>
                      <div className="mt-1 font-semibold">{validRows.length}</div>
                    </div>
                    <div className="rounded-md bg-greyscale-50 p-3">
                      <div className="text-greyscale-500">总转账数量</div>
                      <div className="mt-1 break-all font-mono font-semibold">
                        {renderAmountValue(totalAmount)}
                      </div>
                    </div>
                    <div className="rounded-md bg-greyscale-50 p-3">
                      <div className="text-greyscale-500">错误行数</div>
                      <div className={rowErrorCount > 0 ? 'mt-1 font-semibold text-red-600' : 'mt-1 font-semibold'}>
                        {rowErrorCount}
                      </div>
                    </div>
                    <div className="rounded-md bg-greyscale-50 p-3">
                      <div className="text-greyscale-500">余额快照</div>
                      <div className={isAuditFresh ? 'mt-1 font-semibold text-green-700' : 'mt-1 font-semibold text-amber-700'}>
                        {isAuditFresh ? '已加载' : '未加载'}
                      </div>
                    </div>
                  </div>

                  {validationErrors.length > 0 && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {validationErrors[0]}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    {!selectedToken.isNative && (
                      <Button type="button" disabled={isApproveDisabled} onClick={handleApprove} className="w-full sm:flex-1">
                        {approveButtonText}
                      </Button>
                    )}
                    <Button
                      type="button"
                      disabled={isPrecheckDisabled}
                      onClick={handleLoadPreBalances}
                      className="w-full sm:flex-1"
                    >
                      {loadPreBalancesButtonText}
                    </Button>
                    <Button type="button" disabled={isSubmitDisabled} onClick={handleSubmitTransfer} className="w-full sm:flex-1">
                      {submitButtonText}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="rounded-lg border border-greyscale-200 bg-white">
              <div className="border-b border-greyscale-200 px-4 py-3">
                <h2 className="font-semibold text-greyscale-900">收款明细与余额审计</h2>
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[820px] text-left text-sm xl:min-w-full">
                  <thead className="bg-greyscale-50 text-xs uppercase text-greyscale-500">
                    <tr>
                      <th className="px-3 py-2">行</th>
                      <th className="px-3 py-2">地址</th>
                      <th className="px-3 py-2">金额</th>
                      <th className="px-3 py-2">转账前</th>
                      <th className="px-3 py-2">转账后</th>
                      <th className="px-3 py-2">差值</th>
                      <th className="px-3 py-2">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-greyscale-500">
                          粘贴收款名单后会在这里显示逐行校验结果。
                        </td>
                      </tr>
                    ) : (
                      parsedRows.map((row) => {
                        const auditRow = auditRows[row.id];
                        const protectedTargetInfo = protectedRecipientMap.get(row.id);
                        const isProtectedRow = isAssetProtectionEnabled && !!protectedTargetInfo;
                        return (
                          <tr
                            key={row.id}
                            className={
                              isProtectedRow
                                ? 'border-t border-amber-100 bg-amber-50/50 align-top'
                                : 'border-t border-greyscale-100 align-top'
                            }
                          >
                            <td className="px-3 py-3 font-mono text-xs text-greyscale-500">{row.lineNumber}</td>
                            <td className="max-w-[220px] px-3 py-3 xl:max-w-[280px]">
                              {row.address ? (
                                <AddressWithCopyButton
                                  address={row.address}
                                  showAddress={true}
                                  showCopyButton={true}
                                  colorClassName="text-greyscale-900"
                                />
                              ) : (
                                <span className="break-all font-mono text-red-600">{row.addressInput || '-'}</span>
                              )}
                              {row.errors.length > 0 && (
                                <div className="mt-1 text-xs text-red-600">{row.errors.join('，')}</div>
                              )}
                              {isProtectedRow && protectedTargetInfo && (
                                <div className="mt-1 text-xs text-amber-700">
                                  资产保护：目标是 {protectedTargetInfo.label}
                                  {protectedTargetInfo.type === 'token' ? ' 代币' : ''}合约地址
                                </div>
                              )}
                            </td>
                            <td className="max-w-[130px] px-3 py-3 font-mono">
                              {row.amount !== undefined ? renderAmountValue(row.amount, 'block truncate') : row.amountInput || '-'}
                            </td>
                            <td className="max-w-[130px] px-3 py-3 font-mono">
                              {renderAmountValue(auditRow?.pre, 'block truncate')}
                            </td>
                            <td className="max-w-[130px] px-3 py-3 font-mono">
                              {renderAmountValue(auditRow?.post, 'block truncate')}
                            </td>
                            <td className="px-3 py-3 font-mono">
                              {formatSignedTokenAmount(auditRow?.delta, selectedTokenDecimals)}
                            </td>
                            <td className="max-w-[190px] px-3 py-3">
                              {renderRowStatus(row, auditRow, isProtectedRow)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-greyscale-100 md:hidden">
                {parsedRows.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-greyscale-500">
                    粘贴收款名单后会在这里显示逐行校验结果。
                  </div>
                ) : (
                  parsedRows.map((row) => {
                    const auditRow = auditRows[row.id];
                    const protectedTargetInfo = protectedRecipientMap.get(row.id);
                    const isProtectedRow = isAssetProtectionEnabled && !!protectedTargetInfo;

                    return (
                      <div key={row.id} className={isProtectedRow ? 'bg-amber-50/50 p-4' : 'p-4'}>
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs text-greyscale-500">第 {row.lineNumber} 行</div>
                            <div className="mt-1">
                              {row.address ? (
                                <AddressWithCopyButton
                                  address={row.address}
                                  showAddress={true}
                                  showCopyButton={true}
                                  colorClassName="text-greyscale-900"
                                />
                              ) : (
                                <span className="break-all font-mono text-sm text-red-600">{row.addressInput || '-'}</span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 text-right text-sm">{renderRowStatus(row, auditRow, isProtectedRow)}</div>
                        </div>

                        {(row.errors.length > 0 || (isProtectedRow && protectedTargetInfo)) && (
                          <div className="mb-3 rounded-md bg-white/70 px-3 py-2 text-xs">
                            {row.errors.length > 0 && <div className="text-red-600">{row.errors.join('，')}</div>}
                            {isProtectedRow && protectedTargetInfo && (
                              <div className="text-amber-700">
                                资产保护：目标是 {protectedTargetInfo.label}
                                {protectedTargetInfo.type === 'token' ? ' 代币' : ''}合约地址
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-md bg-greyscale-50 p-2">
                            <div className="text-greyscale-500">金额</div>
                            <div className="mt-1 truncate font-mono text-sm">
                              {row.amount !== undefined ? renderAmountValue(row.amount) : row.amountInput || '-'}
                            </div>
                          </div>
                          <div className="rounded-md bg-greyscale-50 p-2">
                            <div className="text-greyscale-500">差值</div>
                            <div className="mt-1 truncate font-mono text-sm">
                              {formatSignedTokenAmount(auditRow?.delta, selectedTokenDecimals)}
                            </div>
                          </div>
                          <div className="rounded-md bg-greyscale-50 p-2">
                            <div className="text-greyscale-500">转账前</div>
                            <div className="mt-1 truncate font-mono text-sm">{renderAmountValue(auditRow?.pre)}</div>
                          </div>
                          <div className="rounded-md bg-greyscale-50 p-2">
                            <div className="text-greyscale-500">转账后</div>
                            <div className="mt-1 truncate font-mono text-sm">{renderAmountValue(auditRow?.post)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
