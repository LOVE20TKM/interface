import { useEffect, useState } from 'react';

import { BLACKLIST_PAGE_SIZE } from './chatConstants';
import type { GovBlacklistTarget } from './GovVoterSheet';

type BlacklistQueryType = 'address' | 'nft';

export type BlacklistTarget =
  | { type: 'address'; value: `0x${string}` }
  | { type: 'nft'; value: bigint };

export function useBlacklistPanelState() {
  const [queryType, setQueryType] = useState<BlacklistQueryType>('address');
  const [queryInput, setQueryInput] = useState('');
  const [queryTarget, setQueryTarget] = useState<BlacklistTarget | undefined>();
  const [activeGovTarget, setActiveGovTarget] = useState<GovBlacklistTarget | undefined>();
  const [voterPage, setVoterPage] = useState(1);
  const [voterQuery, setVoterQuery] = useState('');
  const [voterQueryResult, setVoterQueryResult] = useState('');
  const [adminPage, setAdminPage] = useState(1);
  const [govPage, setGovPage] = useState(1);
  const [activeBlacklistMenuKey, setActiveBlacklistMenuKey] = useState<string | undefined>();

  const adminOffset = BigInt((Math.max(1, adminPage) - 1) * BLACKLIST_PAGE_SIZE);
  const govOffset = BigInt((Math.max(1, govPage) - 1) * BLACKLIST_PAGE_SIZE);
  const voterOffset = BigInt((Math.max(1, voterPage) - 1) * BLACKLIST_PAGE_SIZE);

  useEffect(() => {
    setQueryInput('');
    setQueryTarget(undefined);
    setActiveGovTarget(undefined);
    setVoterPage(1);
    setVoterQuery('');
    setVoterQueryResult('');
    setAdminPage(1);
    setGovPage(1);
    setActiveBlacklistMenuKey(undefined);
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
    activeBlacklistMenuKey,
    setActiveBlacklistMenuKey,
    adminOffset,
    govOffset,
    voterOffset,
  };
}
