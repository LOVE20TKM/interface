import { useState, useEffect } from 'react';
import { isBurnEnabled, useBurnActivityConfig } from '@/src/hooks/contracts/useBurn';
import { useLiveCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
import { getBurnActivityRound, getBurnActivityNoticeMarker, getBurnActivityNoticePhase } from '@/src/lib/burnStats';
import { burnActivityNoticePreference } from '@/src/lib/uiPreferences';

export function useBurnActivityNotice() {
  const burnConfig = useBurnActivityConfig();
  const {
    currentRound: currentVoteRound,
    isPending: isVoteRoundPending,
    error: voteRoundError,
  } = useLiveCurrentRound(isBurnEnabled);
  const burnActivityRound = getBurnActivityRound(currentVoteRound);
  const burnNoticePhase = getBurnActivityNoticePhase(burnActivityRound, burnConfig.startRound, burnConfig.endRound);
  const burnNoticeMarker = getBurnActivityNoticeMarker(burnNoticePhase, burnActivityRound);
  const burnNoticeReady =
    isBurnEnabled &&
    !isVoteRoundPending &&
    !voteRoundError &&
    !burnConfig.isPending &&
    !burnConfig.error &&
    !!burnConfig.scopeTokenAddress;
  const [visitedBurnMarker, setVisitedBurnMarker] = useState<ReturnType<typeof burnActivityNoticePreference.getMarker>>();

  useEffect(() => {
    const syncVisitedMarker = () => {
      try {
        setVisitedBurnMarker(
          burnActivityNoticePreference.getMarker(burnNoticeReady ? burnNoticeMarker : undefined),
        );
      } catch {
        setVisitedBurnMarker(undefined);
      }
    };

    syncVisitedMarker();
    if (typeof window === 'undefined') return;
    window.addEventListener(burnActivityNoticePreference.eventName, syncVisitedMarker);
    return () => window.removeEventListener(burnActivityNoticePreference.eventName, syncVisitedMarker);
  }, [burnNoticeMarker, burnNoticeReady]);

  const shouldShowNotice =
    burnNoticeReady &&
    burnNoticeMarker !== undefined &&
    visitedBurnMarker !== burnNoticeMarker;

  return {
    shouldShowNotice,
    burnActivityRound,
    burnNoticePhase,
    burnNoticeReady,
    burnNoticeMarker,
  };
}
