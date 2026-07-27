'use client';

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Flame, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatUnits, parseUnits, zeroAddress } from 'viem';
import { useAccount } from 'wagmi';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/src/components/Header';
import { TokenContext } from '@/src/contexts/TokenContext';
import {
  type ActionRewardBurnState,
  BURN_CONTRACT_ADDRESS,
  type BurnStats,
  type CategoryStats,
  isBurnEnabled,
  useBurnAccountOverview,
  useBurnAccountRoundStats,
  useBurnAccountStats,
  useBurnAccountTokenShare,
  useBurnActionRewardStates,
  useBurnActionRewardTokens,
  useBurnActivityConfig,
  useBurnClaimAirdrop,
  useBurnCommunityRoundStats,
  useBurnCommunityStats,
  useBurnGovRewardState,
  useBurnGovRewardToken,
  useBurnLockSLToken,
  useBurnLockSTToken,
  useBurnRoundOpen,
  useBurnScoreMultiplier,
} from '@/src/hooks/contracts/useBurn';
import { useBalanceOf, useDecimals, useSymbol } from '@/src/hooks/contracts/useLOVE20Token';
import { useMintActionReward, useMintGovReward } from '@/src/hooks/contracts/useLOVE20Mint';
import { useTokenDetails } from '@/src/hooks/contracts/useLOVE20TokenViewer';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';
import { useTokenApproval } from '@/src/hooks/contracts/useTokenApproval';
import { useActionBaseInfosByIdsWithCache } from '@/src/hooks/composite/useActionBaseInfosByIdsWithCache';
import { useClaimReward } from '@/src/hooks/extension/base/contracts/useIReward';
import { useIsOnTargetChain } from '@/src/hooks/useIsOnTargetChain';
import { allocateActionBurn } from '@/src/lib/burnActionAllocation';

const WAD = BigInt('1000000000000000000');
const EMPTY_STATS: BurnStats = {
  slTokenLock: { amount: BigInt(0), score: BigInt(0) },
  stTokenLock: { amount: BigInt(0), score: BigInt(0) },
  govRewardBurn: { amount: BigInt(0), score: BigInt(0) },
  actionRewardBurn: { amount: BigInt(0), score: BigInt(0) },
};

type ActivityPhase = 'not-started' | 'active' | 'settling' | 'finished';

interface ConfirmationState {
  title: string;
  description: string;
  confirmText: string;
  run: () => Promise<unknown>;
}

const trimZeros = (value: string) =>
  value.includes('.') ? value.replace(/0+$/, '').replace(/\.$/, '') : value;

const formatAmount = (value: bigint | undefined, decimals = 18, maxFractionDigits = 6) => {
  if (value === undefined) return '-';
  const [whole, fraction = ''] = formatUnits(value, decimals).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (!fraction) return grouped;
  const visible = fraction.slice(0, maxFractionDigits).replace(/0+$/, '');
  if (value > BigInt(0) && whole === '0' && !visible && /[1-9]/.test(fraction)) {
    return `<0.${'0'.repeat(Math.max(0, maxFractionDigits - 1))}1`;
  }
  return visible ? `${grouped}.${visible}${fraction.length > maxFractionDigits ? '...' : ''}` : grouped;
};

const inputAmount = (value: bigint, decimals: number) => trimZeros(formatUnits(value, decimals));

const parseAmount = (value: string, decimals: number) => {
  if (!value.trim() || value.trim().startsWith('-')) return undefined;
  try {
    return parseUnits(value.trim(), decimals);
  } catch {
    return undefined;
  }
};

const formatHundredths = (value: bigint) => {
  const whole = value / BigInt(100);
  const fraction = (value % BigInt(100)).toString().padStart(2, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
};

const formatShare = (value: bigint) => `${formatHundredths((value * BigInt(10000)) / WAD)}%`;

const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const transactionBusy = (transaction: { isPending: boolean; isConfirming: boolean }) =>
  transaction.isPending || transaction.isConfirming;

function useConfirmedRefresh(
  isConfirmed: boolean,
  hash: `0x${string}` | undefined,
  message: string,
  onConfirmed: () => void,
) {
  const handledHash = useRef<`0x${string}` | undefined>();
  const callback = useRef(onConfirmed);
  callback.current = onConfirmed;

  useEffect(() => {
    if (!isConfirmed || !hash || handledHash.current === hash) return;
    handledHash.current = hash;
    toast.success(message);
    callback.current();
  }, [hash, isConfirmed, message]);
}

function StatValue({ label, value, tone = 'public' }: { label: string; value: string; tone?: 'public' | 'personal' }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-greyscale-500">{label}</div>
      <div className={`mt-1 break-words font-mono text-sm ${tone === 'personal' ? 'text-data-personal' : 'text-data-public'}`}>
        {value}
      </div>
    </div>
  );
}

function CategorySection({
  title,
  description,
  symbol,
  decimals,
  community,
  account,
  share,
  hasAccount,
  loading,
  error,
  children,
}: {
  title: string;
  description: string;
  symbol: string;
  decimals: number;
  community: CategoryStats;
  account: CategoryStats;
  share?: bigint;
  hasAccount: boolean;
  loading: boolean;
  error?: unknown;
  children?: React.ReactNode;
}) {
  const displayAmount = (value: bigint) =>
    loading ? '读取中...' : error ? '读取失败' : `${formatAmount(value, decimals)} ${symbol}`;
  const displayScore = (value: bigint) =>
    loading ? '读取中...' : error ? '读取失败' : `${formatAmount(value, decimals)} 分`;

  return (
    <section className="border-t border-greyscale-200 py-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-greyscale-900">{title}</h2>
          <p className="mt-1 text-sm text-greyscale-500">{description}</p>
        </div>
        {share !== undefined && (
          <div className="rounded-md bg-greyscale-100 px-3 py-2 text-right">
            <div className="text-xs text-greyscale-500">我的份额贡献</div>
            <div className="font-mono text-sm text-data-personal">{formatShare(share)}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <StatValue label="当前社区数量" value={displayAmount(community.amount)} />
        <StatValue label="当前社区得分" value={displayScore(community.score)} />
        <StatValue label="我的数量" value={hasAccount ? displayAmount(account.amount) : '-'} tone="personal" />
        <StatValue label="我的得分" value={hasAccount ? displayScore(account.score) : '-'} tone="personal" />
      </div>

      {children && <div className="mt-4 border-t border-dashed border-greyscale-200 pt-4">{children}</div>}
    </section>
  );
}

function ActionRewardRow({
  state,
  title,
  round,
  tokenAddress,
  tokenSymbol,
  decimals,
  canOperate,
  allocation,
  ensureRoundOpen,
  onConfirmed,
}: {
  state: ActionRewardBurnState;
  title?: string;
  round: bigint;
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  decimals: number;
  canOperate: boolean;
  allocation: bigint;
  ensureRoundOpen: () => Promise<boolean>;
  onConfirmed: () => void;
}) {
  const basicMint = useMintActionReward();
  const extensionClaim = useClaimReward(state.extensionAddress);
  const isExtension = state.extensionAddress !== zeroAddress;
  const claimTransaction = isExtension ? extensionClaim : basicMint;
  const reward = state.reward;

  useConfirmedRefresh(basicMint.isConfirmed, basicMint.hash, '行动激励领取成功', onConfirmed);
  useConfirmedRefresh(extensionClaim.isConfirmed, extensionClaim.hash, '行动激励领取成功', onConfirmed);

  const claim = async () => {
    try {
      if (!(await ensureRoundOpen())) return;
      if (isExtension) await extensionClaim.claimReward(round);
      else await basicMint.mintActionReward(tokenAddress, round, state.actionId);
    } catch {
      // useUniversalTransaction 已展示具体错误。
    }
  };

  return (
    <div className="rounded-md border border-greyscale-200 bg-greyscale-50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-greyscale-900">
            行动 #{state.actionId.toString()} {title ? `· ${title}` : ''}
          </div>
          <div className="mt-1 text-xs text-greyscale-500">{isExtension ? '扩展行动' : '基础行动'}</div>
        </div>
        {canOperate && !reward.isClaimed && reward.claimableRewardAmount > BigInt(0) && (
          <Button size="sm" variant="outline" disabled={transactionBusy(claimTransaction)} onClick={() => void claim()}>
            {transactionBusy(claimTransaction) ? '领取中...' : '领取激励'}
          </Button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatValue
          label={reward.isClaimed ? '实际铸造激励' : '预计可领取激励'}
          value={`${formatAmount(reward.isClaimed ? reward.claimedRewardAmount : reward.claimableRewardAmount, decimals)} ${tokenSymbol}`}
          tone="personal"
        />
        <StatValue label="总额度" value={reward.isClaimed ? `${formatAmount(reward.burnQuotaAmount, decimals)} ${tokenSymbol}` : '-'} />
        <StatValue label="已用额度" value={`${formatAmount(reward.burnedAmount, decimals)} ${tokenSymbol}`} />
        <StatValue label="剩余额度" value={reward.isClaimed ? `${formatAmount(reward.unusedQuotaAmount, decimals)} ${tokenSymbol}` : '-'} />
        <StatValue label="本次占用" value={`${formatAmount(allocation, decimals)} ${tokenSymbol}`} tone="personal" />
      </div>
    </div>
  );
}

export default function BurnPage() {
  const { address, isConnected } = useAccount();
  const isOnTargetChain = useIsOnTargetChain();
  const { token: contextToken } = useContext(TokenContext) || {};
  const config = useBurnActivityConfig();
  const { currentRound, isPending: isCurrentRoundPending, error: currentRoundError } = useCurrentRound();
  const { tokens: communityTokens, isPending: communityTokensPending, error: communityTokensError } = useTokenDetails(
    config.communities,
  );

  const [selectedCommunity, setSelectedCommunity] = useState<`0x${string}` | undefined>();
  const [communityTouched, setCommunityTouched] = useState(false);
  const [selectedRound, setSelectedRound] = useState('');
  const [roundTouched, setRoundTouched] = useState(false);
  const [govInput, setGovInput] = useState('');
  const [actionInput, setActionInput] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const candidateRound = currentRound > BigInt(0) ? currentRound - BigInt(1) : undefined;
  const finalized = currentRound > config.endRound + BigInt(1);
  const activityPhase: ActivityPhase = finalized
    ? 'finished'
    : candidateRound === undefined || candidateRound < config.startRound
      ? 'not-started'
      : candidateRound <= config.endRound
        ? 'active'
        : 'settling';
  const phaseLabel = {
    'not-started': '未开始',
    active: '进行中',
    settling: '结算中',
    finished: '已结束',
  }[activityPhase];

  useEffect(() => {
    if (communityTouched || config.communities.length === 0) return;
    const matches = (value: string | undefined) =>
      value && config.communities.find((community) => community.toLowerCase() === value.toLowerCase());
    setSelectedCommunity((matches(contextToken?.address) || matches(config.scopeTokenAddress) || config.communities[0]) as `0x${string}`);
  }, [communityTouched, config.communities, config.scopeTokenAddress, contextToken?.address]);

  useEffect(() => {
    if (roundTouched || config.isPending || isCurrentRoundPending || !config.scopeTokenAddress) return;
    if (activityPhase === 'finished' || activityPhase === 'settling') setSelectedRound('all');
    else if (activityPhase === 'active' && candidateRound !== undefined) setSelectedRound(candidateRound.toString());
    else setSelectedRound(config.startRound.toString());
  }, [activityPhase, candidateRound, config.isPending, config.scopeTokenAddress, config.startRound, isCurrentRoundPending, roundTouched]);

  useEffect(() => {
    setGovInput('');
    setActionInput('');
  }, [selectedCommunity, selectedRound]);

  const availableRounds = useMemo(() => {
    if (!config.scopeTokenAddress) return [] as bigint[];
    let lastRound = config.startRound;
    if (candidateRound !== undefined && candidateRound >= config.startRound) {
      lastRound = candidateRound > config.endRound ? config.endRound : candidateRound;
    }
    const rounds: bigint[] = [];
    for (let round = config.startRound; round <= lastRound; round += BigInt(1)) rounds.push(round);
    return rounds;
  }, [candidateRound, config.endRound, config.scopeTokenAddress, config.startRound]);

  const isCumulative = selectedRound === 'all';
  const selectedRoundNumber = !selectedRound || isCumulative ? undefined : BigInt(selectedRound);
  const selectedToken = communityTokens?.find(
    (item) => item.tokenAddress.toLowerCase() === selectedCommunity?.toLowerCase(),
  );
  const tokenSymbol = selectedToken?.symbol || (selectedCommunity ? shortAddress(selectedCommunity) : '代币');
  const tokenDecimals = Number(selectedToken?.decimals ?? 18);
  const slAddress = selectedToken?.slAddress;
  const stAddress = selectedToken?.stAddress;

  const communityRound = useBurnCommunityRoundStats(isCumulative ? undefined : selectedCommunity, selectedRoundNumber);
  const accountRound = useBurnAccountRoundStats(address, isCumulative ? undefined : selectedCommunity, selectedRoundNumber);
  const communityTotal = useBurnCommunityStats(isCumulative ? selectedCommunity : undefined);
  const accountTotal = useBurnAccountStats(address, isCumulative ? selectedCommunity : undefined);
  const tokenShare = useBurnAccountTokenShare(address, isCumulative ? selectedCommunity : undefined);
  const overview = useBurnAccountOverview(address);
  const roundOpen = useBurnRoundOpen(selectedRoundNumber, !isCumulative);
  const scoreMultiplier = useBurnScoreMultiplier(selectedCommunity, selectedRoundNumber);
  const govState = useBurnGovRewardState(address, selectedCommunity, selectedRoundNumber);
  const actionStates = useBurnActionRewardStates(address, selectedCommunity, selectedRoundNumber);

  const communityStats = isCumulative ? communityTotal.stats : communityRound.stats;
  const accountStats = isCumulative ? accountTotal.stats : accountRound.stats;
  const statsPending = isCumulative
    ? communityTotal.isPending || (!!address && accountTotal.isPending)
    : communityRound.isPending || (!!address && accountRound.isPending);
  const statsError = isCumulative
    ? communityTotal.error || (address ? accountTotal.error : undefined)
    : communityRound.error || (address ? accountRound.error : undefined);

  const canOperate =
    !!address && isOnTargetChain && activityPhase === 'active' && selectedRoundNumber !== undefined && roundOpen.isOpen;
  const scoreMultiplierReady =
    selectedRoundNumber !== undefined &&
    !scoreMultiplier.isPending &&
    !scoreMultiplier.error &&
    scoreMultiplier.multiplier > BigInt(0);
  const canPreviewAssets =
    !!address &&
    selectedRoundNumber !== undefined &&
    (canOperate || (activityPhase === 'not-started' && selectedRoundNumber === config.startRound));

  const slBalance = useBalanceOf(slAddress || zeroAddress, address || zeroAddress, canPreviewAssets && !!slAddress);
  const stBalance = useBalanceOf(stAddress || zeroAddress, address || zeroAddress, canPreviewAssets && !!stAddress);
  const tokenBalance = useBalanceOf(selectedCommunity || zeroAddress, address || zeroAddress, canPreviewAssets);
  const slDecimalsQuery = useDecimals(slAddress || zeroAddress, !!slAddress);
  const stDecimalsQuery = useDecimals(stAddress || zeroAddress, !!stAddress);
  const airdropConfigured = !!config.airdropTokenAddress && config.airdropTokenAddress !== zeroAddress;
  const airdropDecimals = useDecimals(config.airdropTokenAddress || zeroAddress, airdropConfigured);
  const airdropSymbol = useSymbol(config.airdropTokenAddress || zeroAddress, airdropConfigured);
  const airdropMetadataPending = airdropConfigured && (airdropDecimals.isPending || airdropSymbol.isPending);
  const airdropMetadataError = airdropConfigured && (airdropDecimals.error || airdropSymbol.error);
  const airdropMetadataReady =
    airdropConfigured && airdropDecimals.decimals !== undefined && !!airdropSymbol.symbol && !airdropMetadataError;
  const slDecimals = Number(slDecimalsQuery.decimals ?? 18);
  const stDecimals = Number(stDecimalsQuery.decimals ?? 18);

  const lockSl = useBurnLockSLToken();
  const lockSt = useBurnLockSTToken();
  const burnGov = useBurnGovRewardToken();
  const burnActions = useBurnActionRewardTokens();
  const claimAirdrop = useBurnClaimAirdrop();
  const mintGov = useMintGovReward();

  const govAmount = parseAmount(govInput, tokenDecimals);
  const maxGovAmount =
    govState.state.unusedQuotaAmount < (tokenBalance.balance || BigInt(0))
      ? govState.state.unusedQuotaAmount
      : tokenBalance.balance || BigInt(0);
  const govInputError = !!govInput && (govAmount === undefined || govAmount <= BigInt(0) || govAmount > maxGovAmount);

  const actionQuotaTotal = actionStates.states.reduce(
    (total, state) => total + (state.reward.isClaimed ? state.reward.unusedQuotaAmount : BigInt(0)),
    BigInt(0),
  );
  const maxActionAmount =
    actionQuotaTotal < (tokenBalance.balance || BigInt(0)) ? actionQuotaTotal : tokenBalance.balance || BigInt(0);
  const actionAmount = parseAmount(actionInput, tokenDecimals);
  const actionInputError =
    !!actionInput && (actionAmount === undefined || actionAmount <= BigInt(0) || actionAmount > maxActionAmount);
  const actionAllocations = useMemo(() => {
    if (!actionAmount || actionAmount <= BigInt(0) || actionInputError) return [];
    try {
      return allocateActionBurn(
        actionAmount,
        actionStates.states
          .filter((state) => state.reward.isClaimed)
          .map((state) => ({ actionId: state.actionId, unusedQuotaAmount: state.reward.unusedQuotaAmount })),
      );
    } catch {
      return [];
    }
  }, [actionAmount, actionInputError, actionStates.states]);
  const allocationByAction = useMemo(
    () => new Map(actionAllocations.map((allocation) => [allocation.actionId, allocation.amount])),
    [actionAllocations],
  );
  const estimatedGovScore =
    govAmount && scoreMultiplierReady ? (govAmount * scoreMultiplier.multiplier) / WAD : undefined;
  const estimatedActionScore =
    actionAmount && scoreMultiplierReady ? (actionAmount * scoreMultiplier.multiplier) / WAD : undefined;

  const actionIds = useMemo(() => actionStates.states.map((state) => state.actionId), [actionStates.states]);
  const actionInfo = useActionBaseInfosByIdsWithCache({
    tokenAddress: selectedCommunity,
    actionIds,
    enabled: selectedRoundNumber !== undefined && actionIds.length > 0,
  });
  const actionTitles = useMemo(
    () => new Map(actionInfo.actionInfos.map((info) => [info.head.id, info.body.title])),
    [actionInfo.actionInfos],
  );

  const slApproval = useTokenApproval({
    token: slAddress,
    owner: address,
    spender: BURN_CONTRACT_ADDRESS,
    amount: slBalance.balance,
    enabled: canOperate,
    successMessage: 'SL 授权成功',
  });
  const stApproval = useTokenApproval({
    token: stAddress,
    owner: address,
    spender: BURN_CONTRACT_ADDRESS,
    amount: stBalance.balance,
    enabled: canOperate,
    successMessage: 'ST 授权成功',
  });
  const govApproval = useTokenApproval({
    token: selectedCommunity,
    owner: address,
    spender: BURN_CONTRACT_ADDRESS,
    amount: govInputError ? undefined : govAmount,
    enabled: canOperate,
    successMessage: `${tokenSymbol} 授权成功`,
  });
  const actionApproval = useTokenApproval({
    token: selectedCommunity,
    owner: address,
    spender: BURN_CONTRACT_ADDRESS,
    amount: actionInputError ? undefined : actionAmount,
    enabled: canOperate,
    successMessage: `${tokenSymbol} 授权成功`,
  });

  const refreshData = useCallback(() => {
    void Promise.allSettled([
      config.refetch(),
      communityRound.refetch(),
      accountRound.refetch(),
      communityTotal.refetch(),
      accountTotal.refetch(),
      tokenShare.refetch(),
      overview.refetch(),
      roundOpen.refetch(),
      govState.refetch(),
      actionStates.refetch(),
      slBalance.refetch(),
      stBalance.refetch(),
      tokenBalance.refetch(),
      slApproval.refetchAllowance(),
      stApproval.refetchAllowance(),
      govApproval.refetchAllowance(),
      actionApproval.refetchAllowance(),
    ]);
  }, [
    accountRound,
    accountTotal,
    actionApproval,
    actionStates,
    communityRound,
    communityTotal,
    config,
    govApproval,
    govState,
    overview,
    roundOpen,
    slApproval,
    slBalance,
    stApproval,
    stBalance,
    tokenBalance,
    tokenShare,
  ]);

  useConfirmedRefresh(lockSl.isConfirmed, lockSl.hash, 'SL 已永久锁定', refreshData);
  useConfirmedRefresh(lockSt.isConfirmed, lockSt.hash, 'ST 已永久锁定', refreshData);
  useConfirmedRefresh(burnGov.isConfirmed, burnGov.hash, '治理激励代币已销毁', () => {
    setGovInput('');
    refreshData();
  });
  useConfirmedRefresh(burnActions.isConfirmed, burnActions.hash, '行动激励代币已销毁', () => {
    setActionInput('');
    refreshData();
  });
  useConfirmedRefresh(claimAirdrop.isConfirmed, claimAirdrop.hash, '空投领取成功', refreshData);
  useConfirmedRefresh(mintGov.isConfirmed, mintGov.hash, '治理激励领取成功', refreshData);

  const ensureRoundOpen = async () => {
    const latest = await roundOpen.refetch();
    if (latest.data) return true;
    toast.error('本轮销毁窗口已关闭，请刷新轮次');
    refreshData();
    return false;
  };

  const claimGovReward = async () => {
    try {
      if ((await ensureRoundOpen()) && selectedCommunity && selectedRoundNumber !== undefined) {
        await mintGov.mintGovReward(selectedCommunity, selectedRoundNumber);
      }
    } catch {
      // useUniversalTransaction 已展示具体错误。
    }
  };

  const openConfirmation = (state: ConfirmationState) => setConfirmation(state);

  const runConfirmation = async () => {
    if (!confirmation) return;
    setConfirmBusy(true);
    try {
      await confirmation.run();
      setConfirmation(null);
    } catch {
      // useUniversalTransaction 已展示具体错误。
    } finally {
      setConfirmBusy(false);
    }
  };

  const renderReceiptOperation = (
    kind: 'SL' | 'ST',
    balance: bigint | undefined,
    decimals: number,
    approval: typeof slApproval,
    transaction: { isPending: boolean; isConfirming: boolean },
  ) => {
    if (!isConnected) return <p className="text-sm text-greyscale-500">连接钱包后可查看当前余额。</p>;
    if (!canPreviewAssets) return <p className="text-sm text-greyscale-500">历史轮次仅供查询，不能补做锁定。</p>;
    if ((kind === 'SL' && slBalance.isPending) || (kind === 'ST' && stBalance.isPending)) {
      return <p className="text-sm text-greyscale-500">正在读取余额...</p>;
    }

    const tokenBalanceValue = balance || BigInt(0);
    const estimatedScore = scoreMultiplierReady
      ? (tokenBalanceValue * scoreMultiplier.multiplier) / WAD
      : undefined;
    const lock = kind === 'SL' ? lockSl.lockSLToken : lockSt.lockSTToken;

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatValue label={`当前 ${kind} 余额`} value={formatAmount(tokenBalanceValue, decimals)} tone="personal" />
          <StatValue
            label="预计记录得分"
            value={
              scoreMultiplier.isPending
                ? '读取中...'
                : scoreMultiplierReady
                  ? `${formatAmount(estimatedScore, decimals)} 分`
                  : '读取失败'
            }
            tone="personal"
          />
        </div>
        {!canOperate ? (
          <p className="text-sm text-greyscale-500">活动尚未开放，只展示当前全部余额。</p>
        ) : tokenBalanceValue === BigInt(0) ? (
          <p className="text-sm text-greyscale-500">无可锁定余额。</p>
        ) : !scoreMultiplierReady ? (
          <p className="text-sm text-red-600">得分加成读取失败，暂不能提交永久锁定。</p>
        ) : approval.needsApproval ? (
          <Button variant="outline" disabled={approval.buttonDisabled} onClick={() => void approval.approve()}>
            {approval.buttonText} {kind}
          </Button>
        ) : (
          <Button
            variant="destructive"
            disabled={transactionBusy(transaction)}
            onClick={() =>
              openConfirmation({
                title: `永久锁定全部 ${kind}`,
                description: `将永久锁定当前全部 ${formatAmount(tokenBalanceValue, decimals)} ${kind}，该操作不可撤销。`,
                confirmText: `确认锁定全部 ${kind}`,
                run: async () => {
                  if ((await ensureRoundOpen()) && selectedCommunity && selectedRoundNumber !== undefined) {
                    await lock(selectedCommunity, selectedRoundNumber, tokenBalanceValue);
                  }
                },
              })
            }
          >
            {transactionBusy(transaction) ? '处理中...' : `永久锁定全部 ${kind}`}
          </Button>
        )}
      </div>
    );
  };

  const categoryShare = isCumulative && address ? tokenShare.share : undefined;
  const bonusBps =
    scoreMultiplierReady && scoreMultiplier.multiplier >= WAD
      ? ((scoreMultiplier.multiplier - WAD) * BigInt(10000)) / WAD
      : BigInt(0);

  if (!isBurnEnabled) {
    return (
      <>
        <Header title="销毁与锁定" showBackButton />
        <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6">
          <div className="rounded-md border border-greyscale-200 bg-greyscale-50 p-4 text-sm text-greyscale-600">
            当前环境未配置销毁与锁定活动。
          </div>
        </main>
      </>
    );
  }

  const publicError = config.error || currentRoundError;

  return (
    <>
      <Header title="销毁与锁定" showBackButton />
      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-3 sm:pt-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-red-50 text-red-600">
            <Flame className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-greyscale-900">销毁与锁定</h1>
            <p className="text-sm text-greyscale-500">查看活动份额，并管理当前开放轮次的四类资产。</p>
          </div>
        </div>

        {config.isPending || isCurrentRoundPending ? (
          <div className="rounded-md border border-greyscale-200 p-4 text-sm text-greyscale-500">正在读取活动配置...</div>
        ) : publicError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            活动配置读取失败：{publicError instanceof Error ? publicError.message : '未知错误'}
          </div>
        ) : (
          <>
            {!isConnected && (
              <div className="mb-4 rounded-md border border-greyscale-200 bg-greyscale-50 px-3 py-2 text-sm text-greyscale-600">
                未连接钱包：公共数据仍可查看，个人数据与操作需连接钱包。
              </div>
            )}
            {isConnected && !isOnTargetChain && (
              <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4" /> 请切换到 {process.env.NEXT_PUBLIC_CHAIN_NAME} 网络后操作。
              </div>
            )}

            <section className="border-y border-greyscale-200 py-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-bold text-greyscale-900">活动概况</h2>
                <span
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                    activityPhase === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : activityPhase === 'finished'
                        ? 'bg-greyscale-100 text-greyscale-700'
                        : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {phaseLabel}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatValue label="活动轮次" value={`${config.startRound.toString()} - ${config.endRound.toString()}`} />
                <StatValue label="参与地址数" value={config.participantsCount.toString()} />
                <StatValue label="额度倍数" value={`${config.quotaMultiplier.toString()} 倍`} />
                <StatValue
                  label={finalized ? '我的最终总份额' : '我的预计总份额'}
                  value={isConnected ? (overview.isPending ? '读取中...' : formatShare(overview.totalShare)) : '-'}
                  tone="personal"
                />
              </div>

              <div className="mt-4 border-t border-dashed border-greyscale-200 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-greyscale-900">同链空投</div>
                    <div className="mt-1 text-sm text-greyscale-500">
                      {!airdropConfigured
                        ? '本活动未配置链上领取。'
                        : !isConnected
                          ? '连接钱包后查看个人领取状态。'
                          : !overview.airdropState.shareFinalized
                            ? '活动结束并确定最终份额后可领取。'
                            : airdropMetadataError
                              ? '空投代币信息读取失败，暂无法显示或领取。'
                              : airdropMetadataPending || !airdropMetadataReady
                                ? '正在读取空投代币信息...'
                                : overview.airdropState.isClaimed
                                  ? `已领取 ${formatAmount(overview.airdropState.claimedAmount, Number(airdropDecimals.decimals))} ${airdropSymbol.symbol}`
                                  : overview.airdropState.claimableAmount > BigInt(0)
                                    ? `当前可领取 ${formatAmount(overview.airdropState.claimableAmount, Number(airdropDecimals.decimals))} ${airdropSymbol.symbol}`
                                    : '无可领取空投。'}
                    </div>
                  </div>
                  {airdropConfigured &&
                    isConnected &&
                    airdropMetadataReady &&
                    overview.airdropState.shareFinalized &&
                    !overview.airdropState.isClaimed &&
                    overview.airdropState.claimableAmount > BigInt(0) && (
                      <Button
                        disabled={transactionBusy(claimAirdrop)}
                        onClick={() => void claimAirdrop.claimAirdrop().catch(() => undefined)}
                      >
                        {transactionBusy(claimAirdrop) ? '领取中...' : '领取空投'}
                      </Button>
                    )}
                </div>
              </div>
            </section>

            <section className="grid gap-4 py-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-greyscale-700">参与社区</span>
                <Select
                  value={selectedCommunity || ''}
                  onValueChange={(value) => {
                    setCommunityTouched(true);
                    setSelectedCommunity(value as `0x${string}`);
                  }}
                  disabled={communityTokensPending || config.communities.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={communityTokensPending ? '读取社区...' : '选择社区'} />
                  </SelectTrigger>
                  <SelectContent>
                    {config.communities.map((community) => {
                      const detail = communityTokens?.find(
                        (item) => item.tokenAddress.toLowerCase() === community.toLowerCase(),
                      );
                      return (
                        <SelectItem key={community} value={community}>
                          {detail ? `${detail.symbol} · ${detail.name}` : shortAddress(community)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {communityTokensError && <span className="text-xs text-red-600">社区名称读取失败，仍可按地址选择。</span>}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-greyscale-700">轮次</span>
                <Select
                  value={selectedRound}
                  onValueChange={(value) => {
                    setRoundTouched(true);
                    setSelectedRound(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择轮次" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部轮次（累计）</SelectItem>
                    {availableRounds.map((round) => (
                      <SelectItem key={round.toString()} value={round.toString()}>
                        第 {round.toString()} 轮
                        {activityPhase === 'active' && round === candidateRound ? ' · 当前开放' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </section>

            {!isCumulative && selectedRoundNumber !== undefined && (
              <div
                className={`mb-1 rounded-md border px-3 py-3 text-sm ${
                  scoreMultiplierReady
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : scoreMultiplier.isPending
                      ? 'border-greyscale-200 bg-greyscale-50 text-greyscale-600'
                      : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {scoreMultiplierReady ? (
                  <>
                    <div className="font-semibold">本轮得分加成 +{formatHundredths(bonusBps)}%</div>
                    <div className="mt-1 text-xs">
                      本轮每投入 100 枚资产，按 {formatHundredths(BigInt(10000) + bonusBps)} 分计入。
                    </div>
                  </>
                ) : scoreMultiplier.isPending ? (
                  '正在读取本轮得分加成...'
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>本轮得分加成读取失败，暂不能提交锁定或销毁。</span>
                    <Button size="sm" variant="outline" onClick={() => void scoreMultiplier.refetch()}>
                      <RefreshCw className="h-4 w-4" /> 重试
                    </Button>
                  </div>
                )}
              </div>
            )}

            <CategorySection
              title="SL 凭证永久锁定"
              description="整笔锁定当前全部 SL，锁定后无法取回。"
              symbol="SL"
              decimals={slDecimals}
              community={communityStats?.slTokenLock || EMPTY_STATS.slTokenLock}
              account={accountStats?.slTokenLock || EMPTY_STATS.slTokenLock}
              share={categoryShare?.slTokenLock}
              hasAccount={!!address}
              loading={statsPending}
              error={statsError}
            >
              {!isCumulative && renderReceiptOperation('SL', slBalance.balance, slDecimals, slApproval, lockSl)}
            </CategorySection>

            <CategorySection
              title="ST 凭证永久锁定"
              description="整笔锁定当前全部 ST，锁定后无法取回。"
              symbol="ST"
              decimals={stDecimals}
              community={communityStats?.stTokenLock || EMPTY_STATS.stTokenLock}
              account={accountStats?.stTokenLock || EMPTY_STATS.stTokenLock}
              share={categoryShare?.stTokenLock}
              hasAccount={!!address}
              loading={statsPending}
              error={statsError}
            >
              {!isCumulative && renderReceiptOperation('ST', stBalance.balance, stDecimals, stApproval, lockSt)}
            </CategorySection>

            <CategorySection
              title="治理激励代币真实销毁"
              description="只有已经领取并实际铸造的治理激励才会生成销毁额度。"
              symbol={tokenSymbol}
              decimals={tokenDecimals}
              community={communityStats?.govRewardBurn || EMPTY_STATS.govRewardBurn}
              account={accountStats?.govRewardBurn || EMPTY_STATS.govRewardBurn}
              share={categoryShare?.govRewardBurn}
              hasAccount={!!address}
              loading={statsPending}
              error={statsError}
            >
              {!isCumulative && (
                !isConnected ? (
                  <p className="text-sm text-greyscale-500">连接钱包后查看治理激励与额度。</p>
                ) : govState.isPending ? (
                  <p className="text-sm text-greyscale-500">正在读取治理激励...</p>
                ) : govState.error ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-red-600">
                    <span>治理激励读取失败。</span>
                    <Button size="sm" variant="outline" onClick={() => void govState.refetch()}>
                      <RefreshCw className="h-4 w-4" /> 重试
                    </Button>
                  </div>
                ) : !govState.state.isClaimed ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="grid flex-1 grid-cols-2 gap-3">
                      <StatValue
                        label="预计可领取激励"
                        value={`${formatAmount(govState.state.claimableRewardAmount, tokenDecimals)} ${tokenSymbol}`}
                        tone="personal"
                      />
                      {canPreviewAssets && (
                        <StatValue
                          label="社区代币余额"
                          value={`${formatAmount(tokenBalance.balance, tokenDecimals)} ${tokenSymbol}`}
                          tone="personal"
                        />
                      )}
                    </div>
                    {canOperate && govState.state.claimableRewardAmount > BigInt(0) ? (
                      <Button
                        variant="outline"
                        disabled={transactionBusy(mintGov)}
                        onClick={() => void claimGovReward()}
                      >
                        {transactionBusy(mintGov) ? '领取中...' : '领取治理激励'}
                      </Button>
                    ) : !canOperate ? (
                      <span className="text-sm text-greyscale-500">
                        {activityPhase === 'not-started' ? '活动尚未开放。' : '历史轮次不能补领激励。'}
                      </span>
                    ) : (
                      <span className="text-sm text-greyscale-500">本轮无可领取治理激励。</span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      <StatValue label="实际铸造激励" value={`${formatAmount(govState.state.claimedRewardAmount, tokenDecimals)} ${tokenSymbol}`} tone="personal" />
                      <StatValue label="总额度" value={`${formatAmount(govState.state.burnQuotaAmount, tokenDecimals)} ${tokenSymbol}`} />
                      <StatValue label="已用额度" value={`${formatAmount(govState.state.burnedAmount, tokenDecimals)} ${tokenSymbol}`} />
                      <StatValue label="剩余额度" value={`${formatAmount(govState.state.unusedQuotaAmount, tokenDecimals)} ${tokenSymbol}`} />
                      {canPreviewAssets && (
                        <StatValue label="钱包余额" value={`${formatAmount(tokenBalance.balance, tokenDecimals)} ${tokenSymbol}`} tone="personal" />
                      )}
                    </div>
                    {!canOperate ? (
                      <p className="text-sm text-greyscale-500">历史轮次仅供查询，不能补做销毁。</p>
                    ) : maxGovAmount > BigInt(0) ? (
                      <>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <div className="relative flex-1">
                            <Input
                              inputMode="decimal"
                              placeholder={`输入要销毁的 ${tokenSymbol} 数量`}
                              value={govInput}
                              onChange={(event) => setGovInput(event.target.value)}
                              className={govInputError ? 'border-red-400 pr-16' : 'pr-16'}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-0.5 h-9 px-2"
                              onClick={() => setGovInput(inputAmount(maxGovAmount, tokenDecimals))}
                            >
                              最大
                            </Button>
                          </div>
                          {govApproval.needsApproval ? (
                            <Button variant="outline" disabled={govApproval.buttonDisabled} onClick={() => void govApproval.approve()}>
                              {govApproval.buttonText}
                            </Button>
                          ) : (
                            <Button
                              variant="destructive"
                              disabled={!govAmount || govInputError || !scoreMultiplierReady || transactionBusy(burnGov)}
                              onClick={() =>
                                govAmount &&
                                openConfirmation({
                                  title: '销毁治理激励代币',
                                  description: `将真实销毁 ${formatAmount(govAmount, tokenDecimals)} ${tokenSymbol}，该操作不可撤销。`,
                                  confirmText: '确认销毁',
                                  run: async () => {
                                    if ((await ensureRoundOpen()) && selectedCommunity && selectedRoundNumber !== undefined) {
                                      await burnGov.burnGovRewardToken(selectedCommunity, selectedRoundNumber, govAmount);
                                    }
                                  },
                                })
                              }
                            >
                              {transactionBusy(burnGov) ? '处理中...' : '销毁治理激励'}
                            </Button>
                          )}
                        </div>
                        {govAmount && (
                          <p className="mt-2 text-xs text-greyscale-500">
                            预计记录得分{' '}
                            {scoreMultiplierReady ? `${formatAmount(estimatedGovScore, tokenDecimals)} 分` : '等待得分加成读取完成'}。
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-greyscale-500">当前没有可用销毁额度或钱包余额。</p>
                    )}
                    {govInputError && <p className="text-xs text-red-600">请输入不超过剩余额度和钱包余额的有效数量。</p>}
                  </div>
                )
              )}
            </CategorySection>

            <CategorySection
              title="行动激励代币真实销毁"
              description="输入总量后，系统按行动编号升序自动使用各行动的剩余额度。"
              symbol={tokenSymbol}
              decimals={tokenDecimals}
              community={communityStats?.actionRewardBurn || EMPTY_STATS.actionRewardBurn}
              account={accountStats?.actionRewardBurn || EMPTY_STATS.actionRewardBurn}
              share={categoryShare?.actionRewardBurn}
              hasAccount={!!address}
              loading={statsPending}
              error={statsError}
            >
              {!isCumulative && (
                !isConnected ? (
                  <p className="text-sm text-greyscale-500">连接钱包后查看行动激励与额度。</p>
                ) : actionStates.isPending || actionInfo.isPending ? (
                  <p className="text-sm text-greyscale-500">正在读取行动激励...</p>
                ) : actionStates.error || actionInfo.error ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                    <span>行动激励或标题读取失败，其他资产数据不受影响。</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void actionStates.refetch();
                        actionInfo.refetch();
                      }}
                    >
                      <RefreshCw className="h-4 w-4" /> 重试
                    </Button>
                  </div>
                ) : actionStates.states.length === 0 ? (
                  <p className="text-sm text-greyscale-500">本轮没有可展示的行动激励。</p>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {actionStates.states.map((state) => (
                        <ActionRewardRow
                          key={state.actionId.toString()}
                          state={state}
                          title={actionTitles.get(state.actionId)}
                          round={selectedRoundNumber!}
                          tokenAddress={selectedCommunity!}
                          tokenSymbol={tokenSymbol}
                          decimals={tokenDecimals}
                          canOperate={canOperate}
                          allocation={allocationByAction.get(state.actionId) || BigInt(0)}
                          ensureRoundOpen={ensureRoundOpen}
                          onConfirmed={refreshData}
                        />
                      ))}
                    </div>

                    {canOperate ? (
                      maxActionAmount > BigInt(0) ? (
                        <div className="space-y-2">
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <div className="relative flex-1">
                              <Input
                                inputMode="decimal"
                                placeholder={`输入行动激励销毁总量`}
                                value={actionInput}
                                onChange={(event) => setActionInput(event.target.value)}
                                className={actionInputError ? 'border-red-400 pr-16' : 'pr-16'}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-0.5 h-9 px-2"
                                onClick={() => setActionInput(inputAmount(maxActionAmount, tokenDecimals))}
                              >
                                最大
                              </Button>
                            </div>
                            {actionApproval.needsApproval ? (
                              <Button variant="outline" disabled={actionApproval.buttonDisabled} onClick={() => void actionApproval.approve()}>
                                {actionApproval.buttonText}
                              </Button>
                            ) : (
                              <Button
                                variant="destructive"
                                disabled={
                                  !actionAmount ||
                                  actionInputError ||
                                  !scoreMultiplierReady ||
                                  actionAllocations.length === 0 ||
                                  transactionBusy(burnActions)
                                }
                                onClick={() =>
                                  actionAmount &&
                                  openConfirmation({
                                    title: '批量销毁行动激励代币',
                                    description: `将按上方明细真实销毁 ${formatAmount(actionAmount, tokenDecimals)} ${tokenSymbol}，该操作不可撤销。`,
                                    confirmText: '确认批量销毁',
                                    run: async () => {
                                      if ((await ensureRoundOpen()) && selectedCommunity && selectedRoundNumber !== undefined) {
                                        await burnActions.burnActionRewardTokens(
                                          selectedRoundNumber,
                                          actionAllocations.map((allocation) => ({
                                            tokenAddress: selectedCommunity,
                                            actionId: allocation.actionId,
                                            amount: allocation.amount,
                                          })),
                                        );
                                      }
                                    },
                                  })
                                }
                              >
                                {transactionBusy(burnActions) ? '处理中...' : '批量销毁'}
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-greyscale-500">
                            当前最多可销毁 {formatAmount(maxActionAmount, tokenDecimals)} {tokenSymbol}。
                          </p>
                          {actionAmount && (
                            <p className="text-xs text-greyscale-500">
                              预计记录得分{' '}
                              {scoreMultiplierReady
                                ? `${formatAmount(estimatedActionScore, tokenDecimals)} 分`
                                : '等待得分加成读取完成'}。
                            </p>
                          )}
                          {actionInputError && <p className="text-xs text-red-600">请输入不超过行动剩余额度和钱包余额的有效数量。</p>}
                        </div>
                      ) : (
                        <p className="text-sm text-greyscale-500">领取行动激励后，实际铸造数量才会生成销毁额度。</p>
                      )
                    ) : (
                      <p className="text-sm text-greyscale-500">历史轮次仅供查询，不能领取或销毁。</p>
                    )}
                  </div>
                )
              )}
            </CategorySection>

            {isCumulative && isConnected && (
              <div className="flex items-center gap-2 rounded-md border border-greyscale-200 bg-greyscale-50 px-3 py-3 text-sm text-greyscale-700">
                {tokenShare.share.finalized ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <RefreshCw className="h-4 w-4" />}
                我在当前社区累计贡献的{tokenShare.share.finalized ? '最终' : '预计'}份额为
                <span className="font-mono text-data-personal">{formatShare(tokenShare.share.total)}</span>。
              </div>
            )}
          </>
        )}
      </main>

      <Dialog open={!!confirmation} onOpenChange={(open) => !open && !confirmBusy && setConfirmation(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmation?.title}</DialogTitle>
            <DialogDescription>{confirmation?.description}</DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> 链上确认后无法撤销，请核对数量和轮次。
          </div>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button variant="outline" disabled={confirmBusy} onClick={() => setConfirmation(null)}>
              取消
            </Button>
            <Button variant="destructive" disabled={confirmBusy} onClick={() => void runConfirmation()}>
              {confirmBusy ? '处理中...' : confirmation?.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
