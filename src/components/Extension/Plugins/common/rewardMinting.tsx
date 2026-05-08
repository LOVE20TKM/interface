import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

type TxHash = `0x${string}`;

export interface RewardMintItem {
  round: bigint;
  mintReward: bigint;
  claimed: boolean;
}

interface TxState {
  isPending: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  hash?: TxHash;
  error?: Error | null;
}

interface UseRewardMintingOptions<T extends RewardMintItem> {
  rewards: T[];
  enableBatchMint: boolean;
  singleTx: TxState;
  batchTx: TxState;
  claimReward: (round: bigint) => Promise<TxHash | undefined>;
  claimRewards: (rounds: bigint[]) => Promise<TxHash | undefined>;
  onMintStart?: (message?: string) => void;
  onMintEnd?: () => void;
  onMintSuccess?: (round: bigint) => void;
  onBatchMintSuccess?: (rounds: bigint[]) => void;
}

export function useRewardMinting<T extends RewardMintItem>({
  rewards,
  enableBatchMint,
  singleTx,
  batchTx,
  claimReward,
  claimRewards,
  onMintStart,
  onMintEnd,
  onMintSuccess,
  onBatchMintSuccess,
}: UseRewardMintingOptions<T>) {
  const [mintingTarget, setMintingTarget] = useState<bigint | null>(null);
  const [batchMintingTargets, setBatchMintingTargets] = useState<bigint[]>([]);
  const [locallyMinted, setLocallyMinted] = useState<Set<string>>(new Set());
  const [mintingHash, setMintingHash] = useState<TxHash | undefined>(undefined);
  const [batchMintingHash, setBatchMintingHash] = useState<TxHash | undefined>(undefined);
  const [selectedRoundKeys, setSelectedRoundKeys] = useState<Set<string>>(new Set());

  const claimableRounds = useMemo(() => {
    return rewards
      .filter((item) => item.mintReward > BigInt(0) && !item.claimed && !locallyMinted.has(item.round.toString()))
      .map((item) => item.round);
  }, [rewards, locallyMinted]);

  const claimableRoundKeys = useMemo(() => new Set(claimableRounds.map((round) => round.toString())), [claimableRounds]);
  const selectedClaimableRounds = useMemo(
    () => claimableRounds.filter((round) => selectedRoundKeys.has(round.toString())),
    [claimableRounds, selectedRoundKeys],
  );
  const allClaimableSelected =
    claimableRounds.length > 0 && selectedClaimableRounds.length === claimableRounds.length;
  const isMintBusy = singleTx.isPending || singleTx.isConfirming || batchTx.isPending || batchTx.isConfirming;
  const columnCount = enableBatchMint ? 5 : 4;

  useEffect(() => {
    setSelectedRoundKeys((prev) => {
      const next = new Set([...prev].filter((roundKey) => claimableRoundKeys.has(roundKey)));
      return next.size === prev.size ? prev : next;
    });
  }, [claimableRoundKeys]);

  useEffect(() => {
    if (singleTx.isConfirmed && mintingTarget !== null && singleTx.hash && singleTx.hash === mintingHash) {
      toast.success('铸造成功');
      setLocallyMinted((prev) => new Set(prev).add(mintingTarget.toString()));
      onMintSuccess?.(mintingTarget);
      onMintEnd?.();
      setMintingTarget(null);
      setMintingHash(undefined);
    }
  }, [singleTx.isConfirmed, singleTx.hash, mintingTarget, mintingHash, onMintSuccess, onMintEnd]);

  useEffect(() => {
    if (batchTx.isConfirmed && batchMintingTargets.length > 0 && batchTx.hash && batchTx.hash === batchMintingHash) {
      const confirmedRounds = [...batchMintingTargets];
      toast.success('批量铸造交易已确认');
      setLocallyMinted((prev) => {
        const next = new Set(prev);
        confirmedRounds.forEach((round) => next.add(round.toString()));
        return next;
      });
      onBatchMintSuccess?.(confirmedRounds);
      setSelectedRoundKeys(new Set());
      onMintEnd?.();
      setBatchMintingTargets([]);
      setBatchMintingHash(undefined);
    }
  }, [
    batchTx.isConfirmed,
    batchTx.hash,
    batchMintingTargets,
    batchMintingHash,
    onBatchMintSuccess,
    onMintEnd,
  ]);

  useEffect(() => {
    if (singleTx.error && mintingTarget !== null) {
      setMintingTarget(null);
      setMintingHash(undefined);
      onMintEnd?.();
    }
  }, [singleTx.error, mintingTarget, onMintEnd]);

  useEffect(() => {
    if (batchTx.error && batchMintingTargets.length > 0) {
      setBatchMintingTargets([]);
      setBatchMintingHash(undefined);
      onMintEnd?.();
    }
  }, [batchTx.error, batchMintingTargets.length, onMintEnd]);

  const handleMint = async (round: bigint) => {
    setMintingTarget(round);
    onMintStart?.('铸造中，等待链上确认...');

    try {
      const txHash = await claimReward(round);
      if (txHash) {
        setMintingHash(txHash);
        return;
      }
      setMintingTarget(null);
      onMintEnd?.();
    } catch (error) {
      console.error('铸造失败:', error);
      setMintingTarget(null);
      setMintingHash(undefined);
      onMintEnd?.();
    }
  };

  const handleBatchMint = async () => {
    if (selectedClaimableRounds.length === 0) return;

    const roundsToMint = [...selectedClaimableRounds];
    setBatchMintingTargets(roundsToMint);
    onMintStart?.('批量铸造中，等待链上确认...');

    try {
      const txHash = await claimRewards(roundsToMint);
      if (txHash) {
        setBatchMintingHash(txHash);
        return;
      }
      setBatchMintingTargets([]);
      onMintEnd?.();
    } catch (error) {
      console.error('批量铸造失败:', error);
      setBatchMintingTargets([]);
      setBatchMintingHash(undefined);
      onMintEnd?.();
    }
  };

  const toggleRoundSelection = (round: bigint, checked: boolean) => {
    setSelectedRoundKeys((prev) => {
      const next = new Set(prev);
      const roundKey = round.toString();
      if (checked) {
        next.add(roundKey);
      } else {
        next.delete(roundKey);
      }
      return next;
    });
  };

  const toggleAllClaimable = () => {
    setSelectedRoundKeys((prev) => {
      if (allClaimableSelected) {
        return new Set();
      }
      const next = new Set(prev);
      claimableRounds.forEach((round) => next.add(round.toString()));
      return next;
    });
  };

  const isRewardClaimed = (item: T) => locallyMinted.has(item.round.toString()) || item.claimed;
  const isRewardClaimable = (item: T) => item.mintReward > BigInt(0) && !isRewardClaimed(item);

  return {
    columnCount,
    selectedRoundKeys,
    selectedClaimableRounds,
    allClaimableSelected,
    isMintBusy,
    isSelectAllDisabled: isMintBusy || claimableRounds.length === 0,
    isBatchMintDisabled: isMintBusy || selectedClaimableRounds.length === 0,
    handleMint,
    handleBatchMint,
    toggleAllClaimable,
    toggleRoundSelection,
    isRewardClaimed,
    isRewardClaimable,
  };
}

interface BatchMintControlsProps {
  enabled: boolean;
  isSelectAllDisabled: boolean;
  isBatchMintDisabled: boolean;
  allClaimableSelected: boolean;
  selectedCount: number;
  onToggleAll: () => void;
  onBatchMint: () => void;
}

export const BatchMintControls: React.FC<BatchMintControlsProps> = ({
  enabled,
  isSelectAllDisabled,
  isBatchMintDisabled,
  allClaimableSelected,
  selectedCount,
  onToggleAll,
  onBatchMint,
}) => {
  if (!enabled) return null;

  const disabledOutlineClassName =
    'text-greyscale-400 border-greyscale-300 hover:bg-background hover:text-greyscale-400';

  return (
    <div className="mb-3 flex justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        className={isSelectAllDisabled ? disabledOutlineClassName : 'text-secondary border-secondary'}
        onClick={onToggleAll}
        disabled={isSelectAllDisabled}
      >
        {allClaimableSelected ? '取消全选' : '全选可铸造'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={isBatchMintDisabled ? disabledOutlineClassName : 'text-secondary border-secondary'}
        onClick={onBatchMint}
        disabled={isBatchMintDisabled}
      >
        批量铸造({selectedCount}轮)
      </Button>
    </div>
  );
};

interface BatchSelectionCellProps {
  isClaimable: boolean;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}

export const BatchSelectionCell: React.FC<BatchSelectionCellProps> = ({
  isClaimable,
  checked,
  disabled,
  onChange,
}) => {
  if (!isClaimable) {
    return (
      <td className="text-center">
        <span className="text-greyscale-500">-</span>
      </td>
    );
  }

  return (
    <td className="text-center">
      <input
        type="checkbox"
        className="checkbox checkbox-sm border-secondary checked:border-secondary [--chkbg:hsl(var(--secondary))] [--chkfg:hsl(var(--secondary-foreground))]"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
      />
    </td>
  );
};
