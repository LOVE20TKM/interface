import { useEffect, useState } from 'react';

import { BAN_LIST_PAGE_SIZE } from './chatConstants';
import type { GovBanListTarget } from './GovVoterSheet';

export type BanListQueryType = 'message' | 'address' | 'nft';

export type BanListTarget =
  | { type: 'address'; value: `0x${string}` }
  | { type: 'nft'; value: bigint };

export function useBanListPanelState() {
  const [queryType, setQueryType] = useState<BanListQueryType>('nft');
  const [queryInput, setQueryInput] = useState('');
  const [queryTarget, setQueryTarget] = useState<BanListTarget | undefined>();
  const [activeGovTarget, setActiveGovTarget] = useState<GovBanListTarget | undefined>();
  const [voterPage, setVoterPage] = useState(1);
  const [voterQuery, setVoterQuery] = useState('');
  const [voterQueryResult, setVoterQueryResult] = useState('');
  const [adminPage, setAdminPage] = useState(1);
  const [govPage, setGovPage] = useState(1);
  const [activeBanListMenuKey, setActiveBanListMenuKey] = useState<string | undefined>();

  const adminOffset = BigInt((Math.max(1, adminPage) - 1) * BAN_LIST_PAGE_SIZE);
  const govOffset = BigInt((Math.max(1, govPage) - 1) * BAN_LIST_PAGE_SIZE);
  const voterOffset = BigInt((Math.max(1, voterPage) - 1) * BAN_LIST_PAGE_SIZE);

  useEffect(() => {
    setQueryInput('');
    setQueryTarget(undefined);
    setActiveGovTarget(undefined);
    setVoterPage(1);
    setVoterQuery('');
    setVoterQueryResult('');
    setAdminPage(1);
    setGovPage(1);
    setActiveBanListMenuKey(undefined);
  }, [queryType]);

  useEffect(() => {
    setVoterPage(1);
    setVoterQuery('');
    setVoterQueryResult('');
  }, [activeGovTarget]);

  return {
    queryType,
    setQueryType,
    queryInput,
    setQueryInput,
    queryTarget,
    setQueryTarget,
    activeGovTarget,
    setActiveGovTarget,
    voterPage,
    setVoterPage,
    voterQuery,
    setVoterQuery,
    voterQueryResult,
    setVoterQueryResult,
    adminPage,
    setAdminPage,
    govPage,
    setGovPage,
    activeBanListMenuKey,
    setActiveBanListMenuKey,
    adminOffset,
    govOffset,
    voterOffset,
  };
}
