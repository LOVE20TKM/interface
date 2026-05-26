import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

import { useAllowance, useApprove, useBalanceOf } from '@/src/hooks/contracts/useLOVE20Token';
import { useCalculateMintCost, useLove20Token } from '@/src/hooks/extension/base/contracts/useLOVE20Group';
import { formatTokenAmount } from '@/src/lib/format';
import { FIRST_TOKEN_SYMBOL, ZERO_ADDRESS } from './chatConstants';
import { useConfirmedTransactionEffect } from './useConfirmedTransactionEffect';

const APPROVAL_BUFFER_NUMERATOR = BigInt(1001);
const APPROVAL_BUFFER_DENOMINATOR = BigInt(1000);

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

  useConfirmedTransactionEffect({ hash: approveHash, isConfirmed: isConfirmedApprove }, () => {
    toast.success('授权成功');
    refetchAllowance();
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
    onOpen(existingGroupId);
  }, [activationHash, existingGroupId, onOpen]);

  const isMintCostKnown = mintCost !== undefined;
  const requiresApproval = isMintCostKnown && mintCost > BigInt(0);
  const approveAmount = mintCost
    ? (mintCost * APPROVAL_BUFFER_NUMERATOR) / APPROVAL_BUFFER_DENOMINATOR
    : BigInt(0);
  const approved = isMintCostKnown && (!requiresApproval || (!!allowance && allowance >= approveAmount));
  const hasEnoughBalance = isMintCostKnown && (!requiresApproval || (!!balance && balance >= mintCost));
  const hasExistingGroup = !!existingGroupId && existingGroupId > BigInt(0);
  const isBusy = isPending || isConfirming || isPendingApprove || isConfirmingApprove;
  const isLoadingReads =
    isExistingPending ||
    isPendingMintCost ||
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
    !enabled || !account || !isMintCostKnown || !hasEnoughBalance || !approved || isBusy || isLoadingReads || hasExistingGroup;
  const notice = !enabled
    ? '当前环境未配置该 Manager 地址。'
    : !account
      ? '请先连接钱包。'
      : !isMintCostKnown
        ? '正在读取激活成本，请稍后重试。'
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
    if (!approved) {
      toast.error('请先完成授权');
      return;
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
