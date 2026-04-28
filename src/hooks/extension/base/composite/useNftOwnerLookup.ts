import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

import {
  useGroupNameOf,
  useIsGroupNameUsed,
  useOwnerOf,
  useTokenIdOf,
  useTotalSupply,
} from '@/src/hooks/extension/base/contracts/useLOVE20Group';

export type NftLookupMode = 'name' | 'id';

export type NftLookupResult =
  | {
      status: 'resolved';
      tokenId: bigint;
      groupName: string;
      owner: `0x${string}`;
    }
  | {
      status: 'loading';
    }
  | {
      status: 'invalid' | 'not_found' | 'error';
      message: string;
    }
  | null;

interface UseNftOwnerLookupOptions {
  enabled?: boolean;
  initialMode?: NftLookupMode;
  debounceMs?: number;
}

export const useNftOwnerLookup = ({
  enabled = true,
  initialMode = 'name',
  debounceMs = 300,
}: UseNftOwnerLookupOptions = {}) => {
  const [lookupMode, setLookupMode] = useState<NftLookupMode>(initialMode);
  const [lookupValue, setLookupValue] = useState('');
  const [debouncedLookupValue] = useDebounce(lookupValue, debounceMs);

  const lookupValueTrimmed = useMemo(() => lookupValue.trim(), [lookupValue]);
  const debouncedLookupValueTrimmed = useMemo(() => debouncedLookupValue.trim(), [debouncedLookupValue]);
  const lookupName = useMemo(
    () => (enabled && lookupMode === 'name' ? debouncedLookupValueTrimmed : ''),
    [debouncedLookupValueTrimmed, enabled, lookupMode],
  );

  const rawLookupId = useMemo(() => {
    if (!enabled || lookupMode !== 'id') {
      return undefined;
    }

    if (!lookupValueTrimmed || !/^\d+$/.test(lookupValueTrimmed)) {
      return undefined;
    }

    try {
      const value = BigInt(lookupValueTrimmed);
      return value > BigInt(0) ? value : undefined;
    } catch {
      return undefined;
    }
  }, [enabled, lookupMode, lookupValueTrimmed]);

  const lookupId = useMemo(() => {
    if (!enabled || lookupMode !== 'id') {
      return undefined;
    }

    if (!debouncedLookupValueTrimmed || !/^\d+$/.test(debouncedLookupValueTrimmed)) {
      return undefined;
    }

    try {
      const value = BigInt(debouncedLookupValueTrimmed);
      return value > BigInt(0) ? value : undefined;
    } catch {
      return undefined;
    }
  }, [debouncedLookupValueTrimmed, enabled, lookupMode]);

  const isNftIdInputInvalid = enabled && lookupMode === 'id' && !!lookupValueTrimmed && rawLookupId === undefined;
  const isNftLookupDebouncing =
    enabled &&
    !!lookupValueTrimmed &&
    lookupValueTrimmed !== debouncedLookupValueTrimmed &&
    (lookupMode === 'name' || !isNftIdInputInvalid);

  const {
    isUsed: isLookupNameUsed,
    isPending: isPendingLookupNameUsed,
    error: errorLookupNameUsed,
  } = useIsGroupNameUsed(lookupName);
  const {
    tokenId: tokenIdByName,
    isPending: isPendingTokenIdByName,
    error: errorTokenIdByName,
  } = useTokenIdOf(lookupMode === 'name' && isLookupNameUsed ? lookupName : '');
  const resolvedTokenIdByName = tokenIdByName && tokenIdByName > BigInt(0) ? tokenIdByName : undefined;
  const {
    owner: ownerByName,
    isPending: isPendingOwnerByName,
    error: errorOwnerByName,
  } = useOwnerOf(resolvedTokenIdByName || BigInt(0), enabled && lookupMode === 'name' && !!resolvedTokenIdByName);
  const {
    groupName: groupNameByName,
    isPending: isPendingGroupNameByName,
    error: errorGroupNameByName,
  } = useGroupNameOf(resolvedTokenIdByName || BigInt(0), enabled && lookupMode === 'name' && !!resolvedTokenIdByName);

  const { totalSupply, error: errorTotalSupply } = useTotalSupply(enabled && lookupMode === 'id');
  const canLookupById =
    enabled &&
    lookupMode === 'id' &&
    lookupId !== undefined &&
    totalSupply !== undefined &&
    lookupId <= totalSupply;
  const {
    owner: ownerById,
    isPending: isPendingOwnerById,
    error: errorOwnerById,
  } = useOwnerOf(lookupId || BigInt(0), canLookupById);
  const {
    groupName: groupNameById,
    isPending: isPendingGroupNameById,
    error: errorGroupNameById,
  } = useGroupNameOf(lookupId || BigInt(0), canLookupById);

  const lookupResult = useMemo<NftLookupResult>(() => {
    if (!enabled) {
      return null;
    }

    if (lookupMode === 'name') {
      if (!lookupValueTrimmed) {
        return null;
      }

      if (isNftLookupDebouncing || !lookupName) {
        return { status: 'loading' };
      }

      if (errorLookupNameUsed || errorTokenIdByName || errorOwnerByName || errorGroupNameByName) {
        return { status: 'error', message: '查询NFT信息失败，请检查网络后重试' };
      }

      if (
        isPendingLookupNameUsed ||
        (isLookupNameUsed && (isPendingTokenIdByName || isPendingOwnerByName || isPendingGroupNameByName))
      ) {
        return { status: 'loading' };
      }

      if (!isLookupNameUsed) {
        return { status: 'not_found', message: '未找到对应NFT' };
      }

      if (resolvedTokenIdByName && ownerByName && groupNameByName) {
        return {
          status: 'resolved',
          tokenId: resolvedTokenIdByName,
          groupName: groupNameByName,
          owner: ownerByName,
        };
      }

      return { status: 'not_found', message: '未找到对应NFT' };
    }

    if (!lookupValueTrimmed) {
      return null;
    }

    if (isNftIdInputInvalid || lookupId === undefined) {
      return { status: 'invalid', message: '请输入正整数NFT ID' };
    }

    if (isNftLookupDebouncing) {
      return { status: 'loading' };
    }

    if (errorTotalSupply || errorOwnerById || errorGroupNameById) {
      return { status: 'error', message: '查询NFT信息失败，请检查网络后重试' };
    }

    if (totalSupply === undefined) {
      return { status: 'loading' };
    }

    if (lookupId > totalSupply) {
      return { status: 'not_found', message: '未找到对应NFT' };
    }

    if (isPendingOwnerById || isPendingGroupNameById) {
      return { status: 'loading' };
    }

    if (ownerById && groupNameById) {
      return {
        status: 'resolved',
        tokenId: lookupId,
        groupName: groupNameById,
        owner: ownerById,
      };
    }

    return { status: 'not_found', message: '未找到对应NFT' };
  }, [
    enabled,
    errorGroupNameById,
    errorGroupNameByName,
    errorLookupNameUsed,
    errorOwnerById,
    errorOwnerByName,
    errorTokenIdByName,
    errorTotalSupply,
    groupNameById,
    groupNameByName,
    isLookupNameUsed,
    isPendingGroupNameById,
    isPendingGroupNameByName,
    isPendingLookupNameUsed,
    isPendingOwnerById,
    isPendingOwnerByName,
    isPendingTokenIdByName,
    isNftIdInputInvalid,
    isNftLookupDebouncing,
    lookupId,
    lookupMode,
    lookupName,
    lookupValueTrimmed,
    ownerById,
    ownerByName,
    resolvedTokenIdByName,
    totalSupply,
  ]);

  const hasResolvedOwner = lookupResult?.status === 'resolved';
  const resolvedOwner = hasResolvedOwner ? lookupResult.owner : undefined;

  const resetLookup = () => {
    setLookupValue('');
  };

  return {
    lookupMode,
    setLookupMode,
    lookupValue,
    setLookupValue,
    lookupResult,
    hasResolvedOwner,
    resolvedOwner,
    resetLookup,
  };
};
