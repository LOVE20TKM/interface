import { useEffect, useState } from 'react';

import { BAN_LIST_PAGE_SIZE } from './chatConstants';

export type BanListQueryType = 'mine' | 'message' | 'address' | 'nft';

export type BanListTarget =
  | { type: 'address'; value: `0x${string}` }
  | { type: 'nft'; value: bigint };

export function useBanListPanelState() {
  const [queryType, setQueryType] = useState<BanListQueryType>('mine');
  const [queryInput, setQueryInput] = useState('');
  const [queryTarget, setQueryTarget] = useState<BanListTarget | undefined>();
  const [adminPage, setAdminPage] = useState(1);
  const [govPage, setGovPage] = useState(1);
  const [activeBanListMenuKey, setActiveBanListMenuKey] = useState<string | undefined>();

  const adminOffset = BigInt((Math.max(1, adminPage) - 1) * BAN_LIST_PAGE_SIZE);
  const govOffset = BigInt((Math.max(1, govPage) - 1) * BAN_LIST_PAGE_SIZE);

  useEffect(() => {
    setQueryInput('');
    setQueryTarget(undefined);
    setAdminPage(1);
    setGovPage(1);
    setActiveBanListMenuKey(undefined);
  }, [queryType]);

  return {
    queryType,
    setQueryType,
    queryInput,
    setQueryInput,
    queryTarget,
    setQueryTarget,
    adminPage,
    setAdminPage,
    govPage,
    setGovPage,
    activeBanListMenuKey,
    setActiveBanListMenuKey,
    adminOffset,
    govOffset,
  };
}
