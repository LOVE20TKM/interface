import type { JoinableAction } from '../types/love20types';

export interface ActingPageExtensionBaseData {
  actionId: bigint;
  isExtension: boolean;
  extension?: `0x${string}`;
  accountsCount?: bigint;
  convertedJoinedValue?: bigint;
  isConvertedJoinedValueSuccess?: boolean;
  isFromTokenLP?: boolean;
}

export type ActingPageJoinableAction = JoinableAction & {
  accountsCount?: bigint;
  isExtension?: boolean;
  isExtensionAmountPending?: boolean;
  isFromTokenLP?: boolean;
  extensionAddress?: `0x${string}`;
};

export function mergeJoinableActionsWithExtensionData(
  rawActions: JoinableAction[] | undefined,
  extensionData: ActingPageExtensionBaseData[] | undefined,
): ActingPageJoinableAction[] | undefined {
  if (!rawActions) return undefined;

  const extensionByActionId = new Map<bigint, ActingPageExtensionBaseData>();
  extensionData?.forEach((extension) => {
    extensionByActionId.set(extension.actionId, extension);
  });

  return rawActions.map((action) => {
    const extension = extensionByActionId.get(action.action.head.id);

    if (extension?.isExtension) {
      const hasConvertedJoinedValue = extension.convertedJoinedValue !== undefined;

      return {
        ...action,
        joinedAmount: hasConvertedJoinedValue ? extension.convertedJoinedValue! : action.joinedAmount,
        accountsCount: extension.accountsCount,
        isConvertedJoinedValueSuccess: extension.isConvertedJoinedValueSuccess,
        isExtension: true,
        isExtensionAmountPending: !hasConvertedJoinedValue,
        isFromTokenLP: extension.isFromTokenLP ?? false,
        extensionAddress: extension.extension,
      };
    }

    return {
      ...action,
      isExtension: false,
      isExtensionAmountPending: false,
    };
  });
}
