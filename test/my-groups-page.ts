import assert from 'assert';

import {
  buildActivatableActionRows,
  buildActivatableVotingGroupActionRows,
  buildGroupDetailHref,
  buildMintGroupHref,
  buildGroupActivateHref,
  buildGroupPublicHref,
  buildMyActivatedGroupRows,
  buildMyGroupNftRows,
  formatRetainedRewardRatio,
  getVerificationButtonClass,
  getInitialExpandedGroupIds,
  toggleExpandedGroupId,
  shouldRedirectGroupManagementTab,
  shouldShowMyGroupsPageLoader,
} from '../src/lib/myGroupsPage';

const EXT_1 = '0x0000000000000000000000000000000000000001';
const EXT_2 = '0x0000000000000000000000000000000000000002';

const groupedRows = buildMyActivatedGroupRows({
  actionsWithGroups: [
    {
      actionId: 1n,
      actionTitle: '行动一',
      extensionAddress: EXT_1,
      groups: [{ groupId: 10n, groupName: '十号链群', totalJoinedAmount: 100n, accountCount: 1n }],
    },
    {
      actionId: 2n,
      actionTitle: '行动二',
      extensionAddress: EXT_2,
      groups: [
        { groupId: 10n, groupName: '十号链群', totalJoinedAmount: 200n, accountCount: 2n },
        { groupId: 3n, groupName: '三号链群', totalJoinedAmount: 0n, accountCount: 0n },
      ],
    },
  ],
  votedGroups: [
    { actionId: 1n, extensionAddress: EXT_1, groupId: 10n, isVerified: true, needToVerify: false },
    { actionId: 2n, extensionAddress: EXT_2, groupId: 10n, isVerified: false, needToVerify: true },
  ],
});

assert.deepStrictEqual(
  groupedRows.map((group) => ({
    groupId: group.groupId,
    actions: group.actions.map((action) => ({
      actionId: action.actionId,
      accountCount: action.accountCount,
      totalJoinedAmount: action.totalJoinedAmount,
      verificationState: action.verificationState,
    })),
  })),
  [
    {
      groupId: 3n,
      actions: [
        {
          actionId: 2n,
          accountCount: 0n,
          totalJoinedAmount: 0n,
          verificationState: 'not_required',
        },
      ],
    },
    {
      groupId: 10n,
      actions: [
        {
          actionId: 2n,
          accountCount: 2n,
          totalJoinedAmount: 200n,
          verificationState: 'pending',
        },
        {
          actionId: 1n,
          accountCount: 1n,
          totalJoinedAmount: 100n,
          verificationState: 'verified',
        },
      ],
    },
  ],
);

assert.deepStrictEqual(
  buildMyGroupNftRows({
    ownedGroups: [
      { tokenId: 4n, groupName: '四号链群' },
      { tokenId: 10n, groupName: '十号链群' },
      { tokenId: 2n, groupName: '二号链群' },
    ],
    activatedGroupRows: groupedRows,
  }).map((group) => ({
    groupId: group.groupId,
    actionsCount: group.actions.length,
    groupName: group.groupName,
  })),
  [
    { groupId: 3n, actionsCount: 1, groupName: '三号链群' },
    { groupId: 10n, actionsCount: 2, groupName: '十号链群' },
    { groupId: 4n, actionsCount: 0, groupName: '四号链群' },
    { groupId: 2n, actionsCount: 0, groupName: '二号链群' },
  ],
);

assert.deepStrictEqual(
  buildActivatableActionRows({
    actions: [
      { actionId: 1n, actionTitle: '行动一', extensionAddress: EXT_1 },
      { actionId: 2n, actionTitle: '行动二', extensionAddress: EXT_2 },
    ],
    activeGroupIdsByAction: new Map([
      ['1', [10n]],
      ['2', [10n, 11n]],
    ]),
    ownedGroupCount: 2,
  }).map((row) => row.actionId),
  [1n],
);

assert.deepStrictEqual(
  buildActivatableVotingGroupActionRows({
    votingActions: [
      { actionId: 1n, actionTitle: '行动一', votesNum: 10n },
      { actionId: 2n, actionTitle: '行动二', votesNum: 0n },
      { actionId: 3n, actionTitle: '行动三', votesNum: 20n },
      { actionId: 4n, actionTitle: '行动四', votesNum: 5n },
    ],
    extensionByActionId: new Map([
      ['1', { isExtension: true, extensionAddress: EXT_1, factoryAddress: '0x0000000000000000000000000000000000000100' }],
      ['2', { isExtension: true, extensionAddress: EXT_1, factoryAddress: '0x0000000000000000000000000000000000000100' }],
      ['3', { isExtension: true, extensionAddress: EXT_2, factoryAddress: '0x0000000000000000000000000000000000000200' }],
      ['4', { isExtension: true, extensionAddress: EXT_2, factoryAddress: '0x0000000000000000000000000000000000000100' }],
    ]),
    groupActionFactoryAddress: '0x0000000000000000000000000000000000000100',
  }).map((row) => row.actionId),
  [1n, 4n],
);

assert.deepStrictEqual(
  buildActivatableVotingGroupActionRows({
    votingActions: [{ actionId: 1n, actionTitle: '行动一', votesNum: 10n }],
    extensionByActionId: new Map([
      ['1', { isExtension: true, extensionAddress: EXT_1, factoryAddress: '0x0000000000000000000000000000000000000100' }],
    ]),
    groupActionFactoryAddress: '0x0000000000000000000000000000000000000100',
  }).map((row) => row.actionId),
  [1n],
);

assert.strictEqual(
  buildGroupPublicHref({ symbol: 'LOVE', actionId: 2n, groupId: 10n, round: 5n }),
  '/extension/group/?groupId=10&actionId=2&symbol=LOVE&tab=rewards&round=5',
);
assert.strictEqual(
  buildGroupDetailHref({ symbol: 'LOVE', actionId: 2n, groupId: 10n }),
  '/extension/group/?groupId=10&actionId=2&symbol=LOVE&tab=detail',
);
assert.strictEqual(
  buildGroupActivateHref({ actionId: 2n }),
  '/extension/group_op/?actionId=2&op=activate',
);
assert.strictEqual(
  buildGroupActivateHref({ actionId: 2n, groupId: 10n }),
  '/extension/group_op/?actionId=2&groupId=10&op=activate',
);
assert.strictEqual(
  buildMintGroupHref('/extension/my_verifying_groups?symbol=LOVE'),
  '/group/mint?returnTo=%2Fextension%2Fmy_verifying_groups%3Fsymbol%3DLOVE',
);
assert.strictEqual(
  buildMintGroupHref(undefined),
  '/group/mint?returnTo=%2Fextension%2Fmy_verifying_groups',
);

assert.strictEqual(formatRetainedRewardRatio(undefined), '--');
assert.strictEqual(formatRetainedRewardRatio([]), '100%');
assert.strictEqual(formatRetainedRewardRatio([200000000000000000n]), '80%');
assert.strictEqual(formatRetainedRewardRatio([125000000000000000n, 250000000000000000n]), '62.5%');
assert.strictEqual(formatRetainedRewardRatio([1000000000000000000n]), '0%');
assert.strictEqual(formatRetainedRewardRatio([1200000000000000000n]), '0%');

assert.strictEqual(getVerificationButtonClass('verified').includes('text-green-600'), true);
assert.strictEqual(getVerificationButtonClass('pending').includes('text-orange-600'), true);
assert.strictEqual(getVerificationButtonClass('not_required').includes('text-gray-600'), true);

const initialExpanded = getInitialExpandedGroupIds(groupedRows);
assert.deepStrictEqual(Array.from(initialExpanded), ['3', '10']);
assert.deepStrictEqual(Array.from(toggleExpandedGroupId(initialExpanded, 3n)), ['10']);
assert.deepStrictEqual(Array.from(toggleExpandedGroupId(new Set(['10']), 3n)), ['10', '3']);

assert.strictEqual(
  shouldRedirectGroupManagementTab({ requestedTab: 'management', isOwner: false, canEvaluateOwner: false }),
  false,
);
assert.strictEqual(
  shouldRedirectGroupManagementTab({ requestedTab: 'management', isOwner: false, canEvaluateOwner: true }),
  true,
);
assert.strictEqual(
  shouldRedirectGroupManagementTab({ requestedTab: 'management', isOwner: true, canEvaluateOwner: true }),
  false,
);
assert.strictEqual(
  shouldRedirectGroupManagementTab({ requestedTab: 'rewards', isOwner: false, canEvaluateOwner: true }),
  false,
);

assert.strictEqual(
  shouldShowMyGroupsPageLoader({
    hasShownPageContent: false,
    nftRowCount: 3,
    isPendingVerificationGroups: true,
    isPendingActiveGroups: false,
    isPendingOwnedGroups: false,
  }),
  true,
);
assert.strictEqual(
  shouldShowMyGroupsPageLoader({
    hasShownPageContent: false,
    nftRowCount: 3,
    isPendingVerificationGroups: false,
    isPendingActiveGroups: false,
    isPendingOwnedGroups: false,
  }),
  false,
);
assert.strictEqual(
  shouldShowMyGroupsPageLoader({
    hasShownPageContent: false,
    nftRowCount: 0,
    isPendingVerificationGroups: false,
    isPendingActiveGroups: true,
    isPendingOwnedGroups: false,
  }),
  true,
);
assert.strictEqual(
  shouldShowMyGroupsPageLoader({
    hasShownPageContent: true,
    nftRowCount: 0,
    isPendingVerificationGroups: false,
    isPendingActiveGroups: true,
    isPendingOwnedGroups: false,
  }),
  false,
);

console.log('my-groups-page tests passed');
