'use client';

import React, { useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  AppWindow,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  Plus,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useAccount } from 'wagmi';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Header from '@/src/components/Header';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import RoundLite from '@/src/components/Common/RoundLite';
import AlertBox from '@/src/components/Common/AlertBox';
import _GroupSetRecipientsTrigger from '@/src/components/Extension/Plugins/Group/_GroupSetRecipientsTrigger';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
import { useJoinableActions } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useExtensionsByActionInfosWithCache } from '@/src/hooks/extension/base/composite/useExtensionsByActionInfosWithCache';
import { useMyGroupsPage } from '@/src/hooks/extension/base/composite/useMyGroups';
import { useMyGroupIdsNeedVerifiedByRound } from '@/src/hooks/extension/plugins/group/composite/useMyGroupIdsNeedVerifiedByRound';
import { useActionsWithActiveGroupsByOwner } from '@/src/hooks/extension/plugins/group-service/composite/useActionsWithActiveGroupsByOwner';
import { formatTokenAmount } from '@/src/lib/format';
import {
  ActivatableActionRow,
  MyActivatedGroupActionRow,
  MyActivatedGroupRow,
  buildActivatableVotingGroupActionRows,
  buildGroupActivateHref,
  buildGroupAppsHref,
  buildGroupDetailHref,
  buildGroupManagementHref,
  buildGroupPublicHref,
  buildGroupVerifyHref,
  buildMintGroupHref,
  buildMyActivatedGroupRows,
  buildMyGroupNftRows,
  getInitialExpandedGroupIds,
  getVerificationButtonClass,
  shouldShowMyGroupsPageLoader,
  toggleExpandedGroupId,
} from '@/src/lib/myGroupsPage';

const NFT_PAGE_SIZE = 100;
const MyVerifyingGroupsPage: React.FC = () => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();
  const [selectedActivationGroup, setSelectedActivationGroup] = useState<MyActivatedGroupRow | null>(null);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());
  const [loadedNftLimit, setLoadedNftLimit] = useState(NFT_PAGE_SIZE);
  const [hasShownPageContent, setHasShownPageContent] = useState(false);

  const groupActionTokenAddress = token?.address as `0x${string}` | undefined;
  const activationReturnTo = router.asPath || '/extension/my_verifying_groups';
  const mintGroupHref = buildMintGroupHref(activationReturnTo);

  const { currentRound, isPending: isPendingCurrentRound, error: currentRoundError } = useCurrentRound();
  const verifyRound = useMemo(() => {
    if (!currentRound || currentRound < BigInt(2)) return BigInt(0);
    return currentRound - BigInt(2);
  }, [currentRound]);

  const joinRound = useMemo(() => {
    if (verifyRound <= BigInt(0)) return undefined;
    return verifyRound + BigInt(1);
  }, [verifyRound]);

  const {
    groups: verificationGroups,
    isPending: isPendingVerificationGroups,
    error: verificationGroupsError,
  } = useMyGroupIdsNeedVerifiedByRound({
    account: account as `0x${string}`,
    round: verifyRound,
    tokenAddress: groupActionTokenAddress,
  });

  const {
    actionsWithGroups,
    isPending: isPendingActiveGroups,
    error: activeGroupsError,
  } = useActionsWithActiveGroupsByOwner({
    groupActionTokenAddress,
    account: account as `0x${string}`,
    round: joinRound,
  });

  const {
    myGroups: ownedGroups,
    balance: ownedGroupBalance,
    hasMore: hasMoreOwnedGroups,
    isPending: isPendingOwnedGroups,
    error: ownedGroupsError,
  } = useMyGroupsPage(account as `0x${string}` | undefined, loadedNftLimit);

  const {
    joinableActions,
    isPending: isPendingJoinableActions,
    error: joinableActionsError,
  } = useJoinableActions(
    groupActionTokenAddress || ('' as `0x${string}`),
    joinRound || BigInt(0),
    account as `0x${string}`,
  );

  const activatableGroupActionCandidates = useMemo(() => {
    return joinableActions.map((joinableAction) => ({
      actionId: joinableAction.action.head.id,
      actionTitle: joinableAction.action.body.title || `行动 #${joinableAction.action.head.id.toString()}`,
      votesNum: joinableAction.votesNum,
    }));
  }, [joinableActions]);

  const activatableActionInfos = useMemo(() => {
    return joinableActions.map((joinableAction) => joinableAction.action);
  }, [joinableActions]);

  const {
    contractInfos: activatableContractInfos,
    isPending: isPendingActivatableExtensions,
    error: activatableExtensionsError,
  } = useExtensionsByActionInfosWithCache({
    tokenAddress: groupActionTokenAddress,
    actionInfos: activatableActionInfos,
  });

  const groupRows = useMemo(() => {
    return buildMyActivatedGroupRows({
      actionsWithGroups,
      votedGroups: verificationGroups,
    });
  }, [actionsWithGroups, verificationGroups]);
  const isActivationStatusSyncing = isPendingActiveGroups && groupRows.length === 0;

  const nftRows = useMemo(() => {
    return buildMyGroupNftRows({
      ownedGroups,
      activatedGroupRows: groupRows,
    });
  }, [ownedGroups, groupRows]);

  const activeGroupIdsByAction = useMemo(() => {
    const map = new Map<string, bigint[]>();
    for (const action of actionsWithGroups) {
      map.set(
        action.actionId.toString(),
        action.groups.map((group) => group.groupId),
      );
    }
    return map;
  }, [actionsWithGroups]);

  useEffect(() => {
    setExpandedGroupIds(getInitialExpandedGroupIds(groupRows));
  }, [groupRows]);

  useEffect(() => {
    setLoadedNftLimit(NFT_PAGE_SIZE);
    setHasShownPageContent(false);
  }, [account]);

  useEffect(() => {
    if (nftRows.length > 0) {
      setHasShownPageContent(true);
    }
  }, [nftRows.length]);

  const handleLoadMoreOwnedGroups = () => {
    if (!hasMoreOwnedGroups || isPendingOwnedGroups) return;
    setLoadedNftLimit((prev) => prev + NFT_PAGE_SIZE);
  };

  const activatableActions = useMemo<ActivatableActionRow[]>(() => {
    const extensionMap = new Map<string, { isExtension: boolean; extensionAddress?: `0x${string}`; factoryAddress?: `0x${string}` }>();
    for (const contractInfo of activatableContractInfos) {
      extensionMap.set(contractInfo.actionId.toString(), {
        isExtension: contractInfo.isExtension,
        extensionAddress: contractInfo.extension,
        factoryAddress: contractInfo.factory?.address,
      });
    }

    return buildActivatableVotingGroupActionRows({
      votingActions: activatableGroupActionCandidates,
      extensionByActionId: extensionMap,
      groupActionFactoryAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_ACTION_FACTORY as
        | `0x${string}`
        | undefined,
    });
  }, [activatableGroupActionCandidates, activatableContractInfos]);

  const isPagePending = shouldShowMyGroupsPageLoader({
    hasShownPageContent,
    nftRowCount: nftRows.length,
    isPendingVerificationGroups,
    isPendingActiveGroups,
    isPendingOwnedGroups,
  });
  const pageError = verificationGroupsError || activeGroupsError || ownedGroupsError;
  const isActivatePending =
    isPendingCurrentRound ||
    isPendingJoinableActions ||
    isPendingActivatableExtensions;
  const activateError =
    currentRoundError ||
    joinableActionsError ||
    activatableExtensionsError;

  return (
    <>
      <Header title="我的链群" showBackButton={true} />
      <main className="flex-grow p-4">
        {!account ? (
          <div className="text-center text-sm text-greyscale-500 p-4 mt-4">请先连接钱包</div>
        ) : isPagePending ? (
          <div className="flex justify-center items-center p-8">
            <LoadingIcon />
          </div>
        ) : pageError ? (
          <AlertBox type="error" message="链群数据加载失败" />
        ) : nftRows.length === 0 ? (
          <div className="min-h-[55vh] flex flex-col items-center justify-center gap-4 text-center">
            <div>
              <LeftTitle title="我的链群 NFT" />
              <div className="text-sm mt-4 text-greyscale-500">铸造一个代表你的链上社群的NFT</div>
            </div>
            <Button asChild variant="outline" className="text-secondary border-secondary">
              <Link href={mintGroupHref}>立即去铸造</Link>
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between gap-3 pr-3">
              <LeftTitle title={`我的链群 NFT (${ownedGroupBalance.toString()})`} />
              <Button asChild variant="outline" size="sm" className="h-8 shrink-0 text-secondary border-secondary">
                <Link href={mintGroupHref}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  铸造NFT
                </Link>
              </Button>
            </div>
            <RoundLite currentRound={verifyRound} roundType="verify" showCountdown={false} />

            <div className="space-y-4 mt-3">
              {nftRows.map((group) => {
                const isGroupActivated = group.actions.length > 0;
                const activationLabel = isActivationStatusSyncing
                  ? '同步中'
                  : isGroupActivated
                  ? '已激活'
                  : '未激活';

                return (
                  <section
                    key={group.groupId.toString()}
                    className={`border rounded-lg overflow-hidden bg-white shadow-sm ${
                      isGroupActivated ? 'border-secondary/25' : 'border-gray-200'
                    }`}
                  >
                    <div
                      className={`w-full flex items-stretch justify-between gap-2 ${
                        isGroupActivated ? 'bg-secondary/5' : 'bg-gray-50'
                      }`}
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 px-3 py-3 flex items-center justify-between gap-3 text-left disabled:cursor-default"
                        onClick={() => setExpandedGroupIds((prev) => toggleExpandedGroupId(prev, group.groupId))}
                        aria-expanded={expandedGroupIds.has(group.groupId.toString())}
                        disabled={!isGroupActivated}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`shrink-0 rounded border bg-white px-1.5 py-0.5 text-[11px] font-semibold ${
                              isGroupActivated
                                ? 'border-green-200 text-green-600'
                                : isActivationStatusSyncing
                                ? 'border-yellow-200 text-yellow-600'
                                : 'border-gray-200 text-greyscale-500'
                            }`}
                          >
                            {activationLabel}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-1 min-w-0">
                              <span className="text-gray-500 text-xs shrink-0">#</span>
                              <span
                                className={`text-lg font-semibold shrink-0 ${
                                  isGroupActivated ? 'text-secondary' : 'text-greyscale-600'
                                }`}
                              >
                                {group.groupId.toString()}
                              </span>
                              <span className="font-semibold text-greyscale-800 truncate">
                                {group.groupName || '未命名链群'}
                              </span>
                            </div>
                            <div className="mt-0.5 text-xs text-greyscale-500">
                              {isActivationStatusSyncing
                                ? '正在同步激活状态'
                                : isGroupActivated
                                ? `${group.actions.length} 个已激活行动`
                                : '暂无已激活行动'}
                            </div>
                          </div>
                        </div>
                        {isGroupActivated ? (
                          expandedGroupIds.has(group.groupId.toString()) ? (
                            <ChevronDown className="h-5 w-5 shrink-0 text-greyscale-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 shrink-0 text-greyscale-400" />
                          )
                        ) : null}
                      </button>
                      <div className="flex shrink-0 items-center pr-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-secondary border-secondary"
                          disabled={isActivationStatusSyncing}
                          onClick={() => setSelectedActivationGroup(group)}
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          激活链群
                        </Button>
                      </div>
                    </div>
                    {isGroupActivated && expandedGroupIds.has(group.groupId.toString()) && (
                      <div className="ml-4 bg-gray-50/60">
                        <div className="divide-y divide-gray-100">
                          {group.actions.map((action) => (
                            <div key={`${action.actionId.toString()}-${action.groupId.toString()}`} className="pl-3 bg-white/90">
                              <ActionRow
                                action={action}
                                symbol={token?.symbol || ''}
                                tokenAddress={token?.address}
                                verifyRound={verifyRound}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}
              <div className="flex justify-center py-4">
                {hasMoreOwnedGroups ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-secondary border-secondary"
                    disabled={isPendingOwnedGroups}
                    onClick={handleLoadMoreOwnedGroups}
                  >
                    {isPendingOwnedGroups ? '加载中...' : '加载更多 NFT'}
                  </Button>
                ) : (
                  <div className="text-xs text-greyscale-500">已获取全部 NFT</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <ActivateActionDialog
        open={!!selectedActivationGroup}
        onOpenChange={(open) => {
          if (!open) setSelectedActivationGroup(null);
        }}
        isPending={isActivatePending}
        error={activateError}
        actions={activatableActions}
        selectedGroup={selectedActivationGroup}
        activeGroupIdsByAction={activeGroupIdsByAction}
        returnTo={activationReturnTo}
      />
    </>
  );
};

interface ActionRowProps {
  action: MyActivatedGroupActionRow;
  symbol: string;
  tokenAddress?: `0x${string}`;
  verifyRound: bigint;
}

const ActionRow: React.FC<ActionRowProps> = ({ action, symbol, tokenAddress, verifyRound }) => {
  const statsHref = buildGroupPublicHref({
    symbol,
    actionId: action.actionId,
    groupId: action.groupId,
    round: verifyRound,
  });
  const detailHref = buildGroupDetailHref({
    symbol,
    actionId: action.actionId,
    groupId: action.groupId,
  });

  const verifyButton = (() => {
    if (action.verificationState === 'verified') {
      return (
        <Button variant="outline" size="sm" asChild className={getVerificationButtonClass('verified')}>
          <Link
            href={buildGroupPublicHref({
              symbol,
              actionId: action.actionId,
              groupId: action.groupId,
              round: verifyRound,
            })}
          >
            <CheckCircle2 className="mr-0.5 h-3.5 w-3.5" />
            已验证
          </Link>
        </Button>
      );
    }

    if (action.verificationState === 'pending') {
      return (
        <Button variant="outline" size="sm" asChild className={getVerificationButtonClass('pending')}>
          <Link href={buildGroupVerifyHref({ actionId: action.actionId, groupId: action.groupId })}>
            <Clock3 className="mr-0.5 h-3.5 w-3.5" />
            待验证
          </Link>
        </Button>
      );
    }

    return (
      <Button variant="outline" size="sm" asChild className={getVerificationButtonClass('not_required')}>
        <Link href={statsHref}>
          <ShieldCheck className="mr-0.5 h-3.5 w-3.5" />
          无需验证
        </Link>
      </Button>
    );
  })();

  return (
    <div className="p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-greyscale-400 text-sm">No.</span>
            <span className="text-secondary text-base font-bold">{action.actionId.toString()}</span>
            <Link
              href={detailHref}
              className="font-medium text-greyscale-800 break-words hover:text-secondary hover:underline underline-offset-2"
            >
              {action.actionTitle}
            </Link>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-greyscale-500">
            <Link href={statsHref} className="underline underline-offset-2">
              参与地址 {action.accountCount.toString()}
            </Link>
            <Link href={statsHref} className="underline underline-offset-2">
              参与代币 {formatTokenAmount(action.totalJoinedAmount)}
            </Link>
            {tokenAddress && (
              <_GroupSetRecipientsTrigger
                variant="retention"
                tokenAddress={tokenAddress}
                actionId={action.actionId}
                groupId={action.groupId}
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1">
        <Button variant="outline" size="sm" asChild className="h-8 px-1 text-xs">
          <Link href={detailHref}>
            <FileText className="mr-0.5 h-3.5 w-3.5" />
            详情
          </Link>
        </Button>
        {verifyButton}
        <Button variant="outline" size="sm" asChild className="h-8 px-1 text-xs">
          <Link href={buildGroupAppsHref({ symbol, actionId: action.actionId, groupId: action.groupId })}>
            <AppWindow className="mr-0.5 h-3.5 w-3.5" />
            应用
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="h-8 px-1 text-xs">
          <Link href={buildGroupManagementHref({ symbol, actionId: action.actionId, groupId: action.groupId })}>
            <Settings className="mr-0.5 h-3.5 w-3.5" />
            管理
          </Link>
        </Button>
      </div>
    </div>
  );
};

interface ActivateActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  error: unknown;
  actions: ActivatableActionRow[];
  selectedGroup: MyActivatedGroupRow | null;
  activeGroupIdsByAction: Map<string, bigint[]>;
  returnTo: string;
}

const ActivateActionDialog: React.FC<ActivateActionDialogProps> = ({
  open,
  onOpenChange,
  isPending,
  error,
  actions,
  selectedGroup,
  activeGroupIdsByAction,
  returnTo,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
        <DialogHeader>
          <DialogTitle>选择可激活行动</DialogTitle>
        </DialogHeader>
        {selectedGroup ? (
          <div className="text-sm text-greyscale-500">
            链群NFT #{selectedGroup.groupId.toString()} {selectedGroup.groupName || '未命名链群'}
          </div>
        ) : null}
        <div className="py-2">
          {isPending ? (
            <div className="flex justify-center py-8">
              <LoadingIcon />
            </div>
          ) : error ? (
            <AlertBox type="error" message="可激活行动加载失败" />
          ) : actions.length === 0 ? (
            <div className="text-center text-sm text-greyscale-500 py-8">暂无可激活行动</div>
          ) : (
            <div className="divide-y border rounded-lg overflow-hidden">
              {actions.map((action) => {
                const activatedGroupIds = activeGroupIdsByAction.get(action.actionId.toString()) || [];
                const isActivated =
                  !!selectedGroup && activatedGroupIds.some((groupId) => groupId === selectedGroup.groupId);
                const content = (
                  <>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-1">
                        <span className="text-greyscale-400 text-sm">No.</span>
                        <span className="text-secondary text-base font-bold">{action.actionId.toString()}</span>
                        <span className="font-medium text-greyscale-800 break-words">{action.actionTitle}</span>
                      </div>
                    </div>
                    {isActivated ? (
                      <span className="shrink-0 rounded bg-gray-100 px-2 py-1 text-xs text-greyscale-500">已激活</span>
                    ) : (
                      <ChevronRight className="h-5 w-5 shrink-0 text-greyscale-400" />
                    )}
                  </>
                );

                if (isActivated || !selectedGroup) {
                  return (
                    <div
                      key={action.actionId.toString()}
                      className="flex cursor-not-allowed items-center justify-between gap-3 p-3 bg-gray-50 opacity-70"
                    >
                      {content}
                    </div>
                  );
                }

                return (
                  <Link
                    key={action.actionId.toString()}
                    href={buildGroupActivateHref({
                      actionId: action.actionId,
                      groupId: selectedGroup.groupId,
                      returnTo,
                    })}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-secondary/5"
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MyVerifyingGroupsPage;
