import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { useAllowance, useApprove } from '@/src/hooks/contracts/useLOVE20Token';
import {
  getUseUnlimitedTokenApprovalByDefault,
  resolveTokenApprovalValue,
  type TokenApprovalMode,
} from '@/src/lib/tokenApproval';

type Address = `0x${string}`;

interface ApprovalSnapshot {
  token: Address;
  owner: Address | undefined;
  spender: Address;
  amount: bigint;
  hash: `0x${string}`;
}

export function useTokenApprovalPreference() {
  const [useUnlimitedByDefault, setUseUnlimitedByDefault] = useState(false);

  useEffect(() => {
    const syncPreference = () => setUseUnlimitedByDefault(getUseUnlimitedTokenApprovalByDefault());
    syncPreference();
    window.addEventListener('tokenApprovalPreferenceChanged', syncPreference);
    return () => window.removeEventListener('tokenApprovalPreferenceChanged', syncPreference);
  }, []);

  return {
    useUnlimitedByDefault,
    approvalActionText: useUnlimitedByDefault ? '长期授权' : '授权',
  };
}

export interface UseTokenApprovalParams {
  token: Address | undefined;
  owner: Address | undefined;
  spender: Address | undefined;
  amount: bigint | undefined;
  enabled?: boolean;
  successMessage?: string;
}

export function useTokenApproval({
  token,
  owner,
  spender,
  amount,
  enabled = true,
  successMessage = '授权成功',
}: UseTokenApprovalParams) {
  const { approvalActionText } = useTokenApprovalPreference();
  const canCheck = !!token && !!owner && !!spender && enabled;
  const canApprove = !!token && !!spender && !!amount && amount > BigInt(0) && enabled;

  const { allowance, isPending: isChecking, error, refetch } = useAllowance(
    (token || '0x0000000000000000000000000000000000000000') as Address,
    (owner || '0x0000000000000000000000000000000000000000') as Address,
    (spender || '0x0000000000000000000000000000000000000000') as Address,
    canCheck,
  );

  const {
    approve: approveToken,
    isPending: isApprovingTx,
    isConfirming,
    isConfirmed,
    writeError,
    hash,
  } = useApprove((token || '0x0000000000000000000000000000000000000000') as Address);

  const requiredAmount = amount || BigInt(0);
  const [optimisticApproval, setOptimisticApproval] = useState<ApprovalSnapshot | null>(null);
  const pendingApprovalRef = useRef<ApprovalSnapshot | null>(null);
  const hasOptimisticApproval = useMemo(() => {
    if (!canCheck || requiredAmount <= BigInt(0) || !token || !spender || !optimisticApproval) return false;

    return (
      optimisticApproval.token.toLowerCase() === token.toLowerCase() &&
      optimisticApproval.owner?.toLowerCase() === owner?.toLowerCase() &&
      optimisticApproval.spender.toLowerCase() === spender.toLowerCase() &&
      optimisticApproval.amount >= requiredAmount
    );
  }, [canCheck, optimisticApproval, owner, requiredAmount, spender, token]);
  const isApproved = useMemo(() => {
    if (!canCheck || requiredAmount <= BigInt(0)) return false;
    return (allowance !== undefined && allowance >= requiredAmount) || hasOptimisticApproval;
  }, [allowance, canCheck, hasOptimisticApproval, requiredAmount]);
  const needsApproval = enabled && requiredAmount > BigInt(0) && !isApproved;
  const isApproving = isApprovingTx || isConfirming;
  const handledHashRef = useRef<`0x${string}` | undefined>();

  useEffect(() => {
    if (!hash || !isConfirmed || handledHashRef.current === hash) return;
    handledHashRef.current = hash;
    const pendingApproval = pendingApprovalRef.current;
    if (pendingApproval?.hash === hash) setOptimisticApproval(pendingApproval);
    toast.success(successMessage);
    refetch?.();
  }, [hash, isConfirmed, refetch, successMessage]);

  const approve = async (mode?: TokenApprovalMode) => {
    if (!canApprove || !token || !spender || !amount) return;
    const approvalMode = mode || 'preference';
    const txHash = await approveToken(spender, amount, { approvalMode });
    if (txHash) {
      pendingApprovalRef.current = { token, owner, spender, amount: resolveTokenApprovalValue(amount, approvalMode), hash: txHash };
    }
    return txHash;
  };

  // This hook only handles positive approval amounts; use useApprove directly for revoke-to-zero flows.
  return {
    allowance,
    isApproved,
    needsApproval,
    isChecking,
    isApproving,
    isApprovingTx,
    isConfirming,
    isConfirmed,
    error: error || writeError,
    hash,
    refetchAllowance: refetch,
    approve,
    approvalActionText,
    buttonText: isApprovingTx ? '授权中...' : isConfirming ? '确认授权...' : isApproved ? '已授权' : approvalActionText,
    buttonDisabled: !canApprove || isChecking || isApproving || isApproved,
  };
}
