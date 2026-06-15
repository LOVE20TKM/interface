import {
  mergeJoinableActionsWithExtensionData,
  type ActingPageExtensionBaseData,
} from '../src/lib/actingPageData';
import type { ActionInfo, JoinableAction } from '../src/types/love20types';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;
const SUBMITTER_1 = '0x0000000000000000000000000000000000000011' as `0x${string}`;
const SUBMITTER_2 = '0x0000000000000000000000000000000000000022' as `0x${string}`;

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function actionInfo(id: bigint, whiteListAddress: `0x${string}` = ZERO_ADDRESS): ActionInfo {
  return {
    head: {
      id,
      author: ZERO_ADDRESS,
      createAtBlock: BigInt(1),
    },
    body: {
      minStake: BigInt(1),
      maxRandomAccounts: BigInt(1),
      whiteListAddress,
      title: `Action ${id.toString()}`,
      verificationRule: '',
      verificationKeys: [],
      verificationInfoGuides: [],
    },
  };
}

function joinableAction(id: bigint, joinedAmount: bigint, submitter: `0x${string}`): JoinableAction {
  return {
    action: actionInfo(id),
    submitter,
    votesNum: BigInt(100),
    hasReward: true,
    joinedAmount,
    joinedAmountOfAccount: BigInt(0),
  };
}

const rawActions = [
  joinableAction(BigInt(1), BigInt(1), SUBMITTER_1),
  joinableAction(BigInt(2), BigInt(2000), SUBMITTER_2),
];

const pendingExtensionData: ActingPageExtensionBaseData[] = [
  {
    actionId: BigInt(1),
    isExtension: true,
    extension: '0x0000000000000000000000000000000000000001',
  },
  {
    actionId: BigInt(2),
    isExtension: false,
  },
];

const pendingMerged = mergeJoinableActionsWithExtensionData(rawActions, pendingExtensionData);
assert(pendingMerged?.[0].joinedAmount === BigInt(1), 'pending extension should keep raw joinedAmount temporarily');
assert(pendingMerged?.[0].submitter === SUBMITTER_1, 'extension merge should keep joinable action submitter');
assert(pendingMerged?.[0].isExtension === true, 'pending extension should be marked as extension');
assert(
  pendingMerged?.[0].isExtensionAmountPending === true,
  'pending extension should block APY calculation until converted amount is ready',
);
assert(pendingMerged?.[1].isExtension === false, 'non-extension action should be marked as non-extension');
assert(pendingMerged?.[1].isExtensionAmountPending === false, 'non-extension action should not be pending');

const readyExtensionData: ActingPageExtensionBaseData[] = [
  {
    actionId: BigInt(1),
    isExtension: true,
    extension: '0x0000000000000000000000000000000000000001',
    convertedJoinedValue: BigInt(5000),
    accountsCount: BigInt(3),
    isConvertedJoinedValueSuccess: true,
    isFromTokenLP: true,
  },
  {
    actionId: BigInt(2),
    isExtension: false,
  },
];

const readyMerged = mergeJoinableActionsWithExtensionData(rawActions, readyExtensionData);
assert(readyMerged?.[0].joinedAmount === BigInt(5000), 'ready extension should use converted joined value');
assert(readyMerged?.[0].submitter === SUBMITTER_1, 'extension action should keep submitter');
assert(readyMerged?.[0].isExtensionAmountPending === false, 'ready extension should allow APY calculation');
assert(readyMerged?.[0].accountsCount === BigInt(3), 'ready extension should keep accounts count');
assert(readyMerged?.[0].isFromTokenLP === true, 'ready extension should keep LP marker');
assert(readyMerged?.[1].joinedAmount === BigInt(2000), 'non-extension action should keep raw joined amount');
assert(readyMerged?.[1].submitter === SUBMITTER_2, 'non-extension action should keep submitter');

console.log('acting page data tests passed');
