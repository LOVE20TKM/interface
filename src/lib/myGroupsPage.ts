export type GroupVerificationState = 'verified' | 'pending' | 'not_required';

export interface ActiveGroupStats {
  groupId: bigint;
  groupName?: string;
  totalJoinedAmount: bigint;
  accountCount: bigint;
}

export interface ActionWithActiveGroups {
  actionId: bigint;
  actionTitle: string;
  extensionAddress: `0x${string}`;
  groups: ActiveGroupStats[];
}

export interface GroupVerificationInfo {
  actionId: bigint;
  extensionAddress: `0x${string}`;
  groupId: bigint;
  isVerified: boolean;
  needToVerify: boolean;
}

export interface MyActivatedGroupActionRow {
  actionId: bigint;
  actionTitle: string;
  extensionAddress: `0x${string}`;
  groupId: bigint;
  groupName?: string;
  totalJoinedAmount: bigint;
  accountCount: bigint;
  verificationState: GroupVerificationState;
}

export interface MyActivatedGroupRow {
  groupId: bigint;
  groupName?: string;
  actions: MyActivatedGroupActionRow[];
}

export interface OwnedGroupNft {
  tokenId: bigint;
  groupName?: string;
}

export interface BuildMyActivatedGroupRowsParams {
  actionsWithGroups: ActionWithActiveGroups[];
  votedGroups: GroupVerificationInfo[];
}

export interface BuildMyGroupNftRowsParams {
  ownedGroups: OwnedGroupNft[];
  activatedGroupRows: MyActivatedGroupRow[];
}

export interface ActivatableActionRow {
  actionId: bigint;
  actionTitle: string;
  extensionAddress: `0x${string}`;
}

export interface BuildActivatableActionRowsParams {
  actions: ActivatableActionRow[];
  activeGroupIdsByAction: Map<string, bigint[]>;
  ownedGroupCount: number;
}

export interface VotingGroupActionCandidate {
  actionId: bigint;
  actionTitle: string;
  votesNum: bigint;
}

export interface ExtensionActionCandidate {
  isExtension: boolean;
  extensionAddress?: `0x${string}`;
  factoryAddress?: `0x${string}`;
}

export interface BuildActivatableVotingGroupActionRowsParams {
  votingActions: VotingGroupActionCandidate[];
  extensionByActionId: Map<string, ExtensionActionCandidate>;
  groupActionFactoryAddress: `0x${string}` | undefined;
}

const getActionGroupKey = (actionId: bigint, groupId: bigint) => `${actionId.toString()}_${groupId.toString()}`;
const RECIPIENT_RATIO_PRECISION = BigInt('1000000000000000000');
const PERCENT_BASIS = BigInt(10000);

export function formatRetainedRewardRatio(ratios: bigint[] | undefined) {
  if (!ratios) return '--';

  const distributedRatio = ratios.reduce((sum, ratio) => sum + ratio, BigInt(0));
  const distributedPercentBasis = (distributedRatio * PERCENT_BASIS) / RECIPIENT_RATIO_PRECISION;
  const retainedPercentBasis = distributedPercentBasis >= PERCENT_BASIS ? BigInt(0) : PERCENT_BASIS - distributedPercentBasis;
  const whole = retainedPercentBasis / BigInt(100);
  const decimal = retainedPercentBasis % BigInt(100);

  if (decimal === BigInt(0)) return `${whole.toString()}%`;

  return `${whole.toString()}.${decimal.toString().padStart(2, '0').replace(/0+$/, '')}%`;
}

export function buildMyActivatedGroupRows({
  actionsWithGroups,
  votedGroups,
}: BuildMyActivatedGroupRowsParams): MyActivatedGroupRow[] {
  const verificationMap = new Map<string, GroupVerificationInfo>();

  for (const group of votedGroups) {
    verificationMap.set(getActionGroupKey(group.actionId, group.groupId), group);
  }

  const groupMap = new Map<string, MyActivatedGroupRow>();

  for (const action of actionsWithGroups) {
    for (const group of action.groups) {
      const groupKey = group.groupId.toString();
      const currentGroup =
        groupMap.get(groupKey) ||
        ({
          groupId: group.groupId,
          groupName: group.groupName,
          actions: [],
        } satisfies MyActivatedGroupRow);

      if (!currentGroup.groupName && group.groupName) {
        currentGroup.groupName = group.groupName;
      }

      const verificationInfo = verificationMap.get(getActionGroupKey(action.actionId, group.groupId));
      const verificationState: GroupVerificationState = verificationInfo?.isVerified
        ? 'verified'
        : verificationInfo?.needToVerify
        ? 'pending'
        : 'not_required';

      currentGroup.actions.push({
        actionId: action.actionId,
        actionTitle: action.actionTitle,
        extensionAddress: action.extensionAddress,
        groupId: group.groupId,
        groupName: group.groupName,
        totalJoinedAmount: group.totalJoinedAmount,
        accountCount: group.accountCount,
        verificationState,
      });

      groupMap.set(groupKey, currentGroup);
    }
  }

  return Array.from(groupMap.values())
    .map((group) => ({
      ...group,
      actions: [...group.actions].sort((a, b) => (a.actionId > b.actionId ? -1 : a.actionId < b.actionId ? 1 : 0)),
    }))
    .sort((a, b) => (a.groupId < b.groupId ? -1 : a.groupId > b.groupId ? 1 : 0));
}

export function buildMyGroupNftRows({
  ownedGroups,
  activatedGroupRows,
}: BuildMyGroupNftRowsParams): MyActivatedGroupRow[] {
  const ownedGroupNameMap = new Map<string, string | undefined>();
  for (const group of ownedGroups) {
    ownedGroupNameMap.set(group.tokenId.toString(), group.groupName);
  }

  const activatedGroupMap = new Map<string, MyActivatedGroupRow>();
  const activatedRows = activatedGroupRows.map((group) => {
    const key = group.groupId.toString();
    const row = {
      ...group,
      groupName: group.groupName || ownedGroupNameMap.get(key),
      actions: [...group.actions],
    };
    activatedGroupMap.set(key, row);
    return row;
  });

  const inactiveRows = ownedGroups
    .filter((group) => !activatedGroupMap.has(group.tokenId.toString()))
    .map((group) => ({
      groupId: group.tokenId,
      groupName: group.groupName,
      actions: [],
    }));

  return [...activatedRows, ...inactiveRows];
}

export function buildActivatableActionRows({
  actions,
  activeGroupIdsByAction,
  ownedGroupCount,
}: BuildActivatableActionRowsParams): ActivatableActionRow[] {
  if (ownedGroupCount <= 0) return [];

  return actions
    .filter((action) => {
      const activeCount = activeGroupIdsByAction.get(action.actionId.toString())?.length || 0;
      return activeCount < ownedGroupCount;
    })
    .sort((a, b) => (a.actionId > b.actionId ? -1 : a.actionId < b.actionId ? 1 : 0));
}

export function buildActivatableVotingGroupActionRows({
  votingActions,
  extensionByActionId,
  groupActionFactoryAddress,
}: BuildActivatableVotingGroupActionRowsParams): ActivatableActionRow[] {
  if (!groupActionFactoryAddress) return [];

  const groupActionFactoryKey = groupActionFactoryAddress.toLowerCase();

  return votingActions
    .filter((action) => action.votesNum > BigInt(0))
    .map((action) => {
      const extension = extensionByActionId.get(action.actionId.toString());
      const isGroupAction =
        extension?.isExtension &&
        !!extension.extensionAddress &&
        extension.factoryAddress?.toLowerCase() === groupActionFactoryKey;

      if (!isGroupAction) return null;

      return {
        actionId: action.actionId,
        actionTitle: action.actionTitle,
        extensionAddress: extension.extensionAddress!,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const actionA = votingActions.find((action) => action.actionId === a!.actionId);
      const actionB = votingActions.find((action) => action.actionId === b!.actionId);
      const votesA = actionA?.votesNum || BigInt(0);
      const votesB = actionB?.votesNum || BigInt(0);

      if (votesA !== votesB) return votesA > votesB ? -1 : 1;
      return a!.actionId > b!.actionId ? -1 : a!.actionId < b!.actionId ? 1 : 0;
    }) as ActivatableActionRow[];
}

export function getVerificationButtonClass(state: GroupVerificationState) {
  const baseClass = 'h-8 px-1 text-xs';

  if (state === 'verified') {
    return `${baseClass} border-green-200 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700`;
  }

  if (state === 'pending') {
    return `${baseClass} border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700`;
  }

  return `${baseClass} border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-700`;
}

export function getInitialExpandedGroupIds(groups: MyActivatedGroupRow[]) {
  return new Set(groups.map((group) => group.groupId.toString()));
}

export function toggleExpandedGroupId(expandedGroupIds: Set<string>, groupId: bigint) {
  const next = new Set(expandedGroupIds);
  const key = groupId.toString();

  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }

  return next;
}

export function shouldRedirectGroupManagementTab({
  requestedTab,
  isOwner,
  canEvaluateOwner,
}: {
  requestedTab: string | undefined;
  isOwner: boolean;
  canEvaluateOwner: boolean;
}) {
  return requestedTab === 'management' && canEvaluateOwner && !isOwner;
}

export function shouldShowMyGroupsPageLoader({
  hasShownPageContent,
  nftRowCount,
  isPendingVerificationGroups,
  isPendingActiveGroups,
  isPendingOwnedGroups,
}: {
  hasShownPageContent: boolean;
  nftRowCount: number;
  isPendingVerificationGroups: boolean;
  isPendingActiveGroups: boolean;
  isPendingOwnedGroups: boolean;
}) {
  if (isPendingVerificationGroups && nftRowCount > 0) return true;

  return (
    !hasShownPageContent &&
    nftRowCount === 0 &&
    (isPendingVerificationGroups || isPendingActiveGroups || isPendingOwnedGroups)
  );
}

export function buildGroupPublicHref({
  symbol,
  actionId,
  groupId,
  round,
}: {
  symbol: string;
  actionId: bigint;
  groupId: bigint;
  round?: bigint;
}) {
  const roundQuery = round !== undefined ? `&round=${round.toString()}` : '';
  return `/extension/group/?groupId=${groupId.toString()}&actionId=${actionId.toString()}&symbol=${encodeURIComponent(
    symbol,
  )}&tab=rewards${roundQuery}`;
}

export function buildGroupDetailHref({ symbol, actionId, groupId }: { symbol: string; actionId: bigint; groupId: bigint }) {
  return `/extension/group/?groupId=${groupId.toString()}&actionId=${actionId.toString()}&symbol=${encodeURIComponent(
    symbol,
  )}&tab=detail`;
}

export function buildGroupAppsHref({ symbol, actionId, groupId }: { symbol: string; actionId: bigint; groupId: bigint }) {
  return `/extension/group/?groupId=${groupId.toString()}&actionId=${actionId.toString()}&symbol=${encodeURIComponent(
    symbol,
  )}&tab=apps`;
}

export function buildGroupManagementHref({
  symbol,
  actionId,
  groupId,
}: {
  symbol: string;
  actionId: bigint;
  groupId: bigint;
}) {
  return `/extension/group/?groupId=${groupId.toString()}&actionId=${actionId.toString()}&symbol=${encodeURIComponent(
    symbol,
  )}&tab=management`;
}

export function buildGroupVerifyHref({ actionId, groupId }: { actionId: bigint; groupId: bigint }) {
  return `/extension/group_op/?actionId=${actionId.toString()}&groupId=${groupId.toString()}&op=verify`;
}

export function buildMintGroupHref(returnTo: string | undefined) {
  const path = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/extension/my_verifying_groups';
  return `/group/mint?returnTo=${encodeURIComponent(path)}`;
}

export function buildGroupActivateHref({
  actionId,
  groupId,
  returnTo,
}: {
  actionId: bigint;
  groupId?: bigint;
  returnTo?: string;
}) {
  const groupQuery = groupId !== undefined ? `&groupId=${groupId.toString()}` : '';
  const returnQuery = returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : '';
  return `/extension/group_op/?actionId=${actionId.toString()}${groupQuery}&op=activate${returnQuery}`;
}
