import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { useAllowance, useApprove, useBalanceOf } from '@/src/hooks/contracts/useLOVE20Token';
import { useCalculateMintCost, useLove20Token } from '@/src/hooks/extension/base/contracts/useLOVE20Group';
import { formatTokenAmount } from '@/src/lib/format';
import { FIRST_TOKEN_SYMBOL, ZERO_ADDRESS } from './chatConstants';
import { followGroupId } from './chatStorage';
import { useConfirmedTransactionEffect } from './useConfirmedTransactionEffect';

const APPROVAL_BUFFER_NUMERATOR = BigInt(1001);
const APPROVAL_BUFFER_DENOMINATOR = BigInt(1000);
const ALLOWANCE_SYNC_ATTEMPTS = 6;
const ALLOWANCE_SYNC_DELAY_MS = 800;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toBigIntOrUndefined(value: unknown): bigint | undefined {
  if (value === undefined || value === null) return undefined;
  try {
    return typeof value === 'bigint' ? value : BigInt(value as string | number | boolean);
  } catch {
    return undefined;
  }
}

export type ManagerActivationField = {
  label: string;
  value: string;
};

export function ManagerActivationForm({
  title,
  meta,
  fields,
  managerAddress,
  enabled,
  existingGroupId,
  isExistingPending,
  account,
  onActivate,
  isPending,
  isConfirming,
  isConfirmed,
  activationHash,
  onOpen,
  onConfirmed,
  onBack,
}: {
  title: string;
  meta?: string;
  fields: ManagerActivationField[];
  managerAddress: `0x${string}`;
  enabled: boolean;
  existingGroupId: bigint | undefined;
  isExistingPending: boolean;
  account: `0x${string}` | undefined;
  onActivate: () => Promise<unknown>;
  isPending: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  activationHash?: `0x${string}`;
  onOpen: (groupId: bigint) => void;
  onConfirmed: () => void;
  onBack?: () => void;
}) {
  const { love20Token } = useLove20Token();
  const paymentToken = love20Token || (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_FIRST_TOKEN as `0x${string}` | undefined);
  const { mintCost, isPending: isPendingMintCost } = useCalculateMintCost('GroupChatCost');
  const { balance, isPending: isPendingBalance } = useBalanceOf(
    paymentToken || ZERO_ADDRESS,
    account || ZERO_ADDRESS,
    !!paymentToken && !!account,
  );
  const { allowance, isPending: isPendingAllowance, refetch: refetchAllowance } = useAllowance(
    paymentToken || ZERO_ADDRESS,
    account || ZERO_ADDRESS,
    managerAddress,
    !!paymentToken && !!account && enabled,
  );
  const {
    approve,
    isPending: isPendingApprove,
    isConfirming: isConfirmingApprove,
    isConfirmed: isConfirmedApprove,
    hash: approveHash,
  } = useApprove(paymentToken || ZERO_ADDRESS);
  const openedConfirmedGroupRef = useRef(false);
  const confirmedActivationHashRef = useRef<`0x${string}` | undefined>();
  const [isAllowanceSyncing, setIsAllowanceSyncing] = useState(false);
  const [syncedApprovalHash, setSyncedApprovalHash] = useState<`0x${string}` | undefined>();
  const isMintCostKnown = mintCost !== undefined;
  const requiresApproval = isMintCostKnown && mintCost > BigInt(0);
  const approveAmount = mintCost
    ? (mintCost * APPROVAL_BUFFER_NUMERATOR) / APPROVAL_BUFFER_DENOMINATOR
    : BigInt(0);

  const waitForSyncedAllowance = useCallback(async (forceRefresh: boolean = false) => {
    if (!requiresApproval) return true;
    if (!forceRefresh && allowance !== undefined && allowance >= approveAmount) return true;

    setIsAllowanceSyncing(true);
    try {
      for (let attempt = 0; attempt < ALLOWANCE_SYNC_ATTEMPTS; attempt++) {
        if (forceRefresh || attempt > 0) {
          await sleep(ALLOWANCE_SYNC_DELAY_MS);
        }
        const result = await refetchAllowance();
        const refreshedAllowance = toBigIntOrUndefined(result.data);
        if (refreshedAllowance !== undefined && refreshedAllowance >= approveAmount) {
          return true;
        }
      }
      return false;
    } finally {
      setIsAllowanceSyncing(false);
    }
  }, [allowance, approveAmount, refetchAllowance, requiresApproval]);

  useConfirmedTransactionEffect({ hash: approveHash, isConfirmed: isConfirmedApprove }, () => {
    void waitForSyncedAllowance(true).then((synced) => {
      if (synced) {
        setSyncedApprovalHash(approveHash);
        toast.success('授权成功');
      } else {
        toast('授权已确认，正在等待 RPC 同步额度，请稍后再试。');
      }
    });
  });

  useEffect(() => {
    if (isPending || isConfirming) {
      openedConfirmedGroupRef.current = false;
      confirmedActivationHashRef.current = undefined;
    }
  }, [isConfirming, isPending]);

  useConfirmedTransactionEffect({ hash: activationHash, isConfirmed }, () => {
    confirmedActivationHashRef.current = activationHash;
    openedConfirmedGroupRef.current = false;
    toast.success('群聊已创建');
    onConfirmed();
  });

  useEffect(() => {
    if (
      !activationHash ||
      confirmedActivationHashRef.current !== activationHash ||
      !existingGroupId ||
      existingGroupId <= BigInt(0) ||
      openedConfirmedGroupRef.current
    ) {
      return;
    }
    openedConfirmedGroupRef.current = true;
    followGroupId(account, existingGroupId);
    onOpen(existingGroupId);
  }, [account, activationHash, existingGroupId, onOpen]);

  const approved = isMintCostKnown && (!requiresApproval || (!!allowance && allowance >= approveAmount));
  const hasEnoughBalance = isMintCostKnown && (!requiresApproval || (!!balance && balance >= mintCost));
  const hasExistingGroup = !!existingGroupId && existingGroupId > BigInt(0);
  const hasUnsyncedApproval = !!approveHash && isConfirmedApprove && syncedApprovalHash !== approveHash;
  const isBusy = isPending || isConfirming || isPendingApprove || isConfirmingApprove;
  const isLoadingReads =
    isExistingPending ||
    isPendingMintCost ||
    isAllowanceSyncing ||
    (requiresApproval && (isPendingBalance || isPendingAllowance));
  const approveLabel = isPendingApprove
    ? '1.授权中...'
    : isConfirmingApprove
      ? '1.确认授权...'
      : approved
        ? '1.已授权'
        : '1.授权';
  const activateLabel = isPending
    ? requiresApproval
      ? '2.提交中...'
      : '提交中...'
    : isConfirming
      ? requiresApproval
        ? '2.确认中...'
        : '确认中...'
      : isConfirmed
        ? requiresApproval
          ? '2.已激活'
          : '已激活'
        : requiresApproval
          ? '2.激活'
          : '激活群聊';
  const approveDisabled =
    !enabled || !account || !requiresApproval || approved || !isMintCostKnown || !hasEnoughBalance || isBusy || isLoadingReads;
  const activateDisabled =
    !enabled ||
    !account ||
    !isMintCostKnown ||
    !hasEnoughBalance ||
    (!approved && !hasUnsyncedApproval) ||
    isBusy ||
    isLoadingReads ||
    hasExistingGroup;
  const notice = !enabled
    ? '当前环境未配置该 Manager 地址。'
    : !account
      ? '请先连接钱包。'
      : !isMintCostKnown
        ? '正在读取激活成本，请稍后重试。'
        : isAllowanceSyncing
          ? '授权已确认，正在同步链上授权额度，请稍后继续。'
          : hasUnsyncedApproval
            ? '授权已确认，点击激活会重新同步链上授权额度。'
          : hasExistingGroup
            ? `该群聊已激活：G#${existingGroupId.toString()}。`
            : !hasEnoughBalance
              ? `${FIRST_TOKEN_SYMBOL} 余额不足。`
              : requiresApproval && !approved
                ? `激活成本约 ${formatTokenAmount(mintCost)} ${FIRST_TOKEN_SYMBOL}，请先授权，额度会预留 0.1% 浮动。`
                : requiresApproval
                  ? `激活成本约 ${formatTokenAmount(mintCost)} ${FIRST_TOKEN_SYMBOL}。`
                  : '';

  const submitApproval = async () => {
    if (!paymentToken || !mintCost || mintCost <= BigInt(0)) {
      toast.error('无法读取激活成本');
      return;
    }
    await approve(managerAddress, approveAmount);
  };

  const submitActivation = async () => {
    if (!approved && !hasUnsyncedApproval) {
      toast.error('请先完成授权');
      return;
    }
    const synced = await waitForSyncedAllowance(hasUnsyncedApproval);
    if (!synced) {
      toast.error('授权额度尚未同步，请稍后再试。');
      return;
    }
    if (approveHash && isConfirmedApprove) {
      setSyncedApprovalHash(approveHash);
    }
    await onActivate();
  };

  return (
    <section className="workspace-band activation-form">
      <div className="activation-form-head">
        <div>
          <h1>{title}</h1>
          {meta && <div className="muted">{meta}</div>}
        </div>
      </div>
      <section className="activation-section">
        <h2>配置入参</h2>
        {fields.map((field) => (
          <div className="field-row activation-field-row" key={field.label}>
            <label>{field.label}</label>
            <div className="activation-readonly-value">{field.value}</div>
          </div>
        ))}
      </section>
      {notice && <div className="notice-row">{notice}</div>}
      {(!hasExistingGroup || onBack) && (
        <div className="activation-submit-row">
          {!hasExistingGroup && requiresApproval && (
            <button className="sheet-button primary inline-flex" type="button" disabled={approveDisabled} onClick={submitApproval}>
              {approveLabel}
            </button>
          )}
          {!hasExistingGroup && (
            <button
              className="sheet-button primary inline-flex"
              type="button"
              disabled={activateDisabled}
              onClick={submitActivation}
            >
              {activateLabel}
            </button>
          )}
          {onBack && (
            <button className="sheet-button inline-flex" type="button" onClick={onBack}>
              返回列表
            </button>
          )}
        </div>
      )}
    </section>
  );
}
