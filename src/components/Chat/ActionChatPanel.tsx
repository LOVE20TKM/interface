import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import { Input } from '@/components/ui/input';
import {
  useTokenActionGovChatGroupIdOfAction,
  useTokenActionMainChatGroupIdOfAction,
} from '@/src/hooks/contracts/useGroupChatManagers';
import { useActionInfo, useActionsCount } from '@/src/hooks/contracts/useLOVE20Submit';
import { ActivationCard } from './ActivationCard';
import { parseActionIdInput } from './chatUtils';

type ActionActivationSelection = {
  kind: 'main' | 'gov';
  actionId: bigint;
};

export function ActionChatPanel({
  tokenAddress,
  tokenSymbol,
  onOpen,
}: {
  isConnected: boolean;
  account: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
  tokenSymbol?: string;
  onOpen: (groupId: bigint) => void;
  onConfirmed: () => void;
}) {
  const router = useRouter();
  const [actionIdInput, setActionIdInput] = useState('');
  const actionId = useMemo(() => parseActionIdInput(actionIdInput), [actionIdInput]);
  const isActionIdEntered = actionIdInput.trim().length > 0;
  const hasInvalidFormat = isActionIdEntered && actionId === undefined;
  const { actionNum, isPending: isPendingActionsCount } = useActionsCount(tokenAddress, !!tokenAddress);
  const actionExists = actionId !== undefined && actionNum !== undefined && actionId < actionNum;
  const actionableActionId = actionExists ? actionId : undefined;
  const { actionInfo, isPending: isPendingActionInfo } = useActionInfo(tokenAddress, actionableActionId);
  const { groupId: actionMainGroupId, isPending: isPendingActionMainGroupId } = useTokenActionMainChatGroupIdOfAction(
    tokenAddress,
    actionableActionId,
  );
  const { groupId: actionGovGroupId, isPending: isPendingActionGovGroupId } = useTokenActionGovChatGroupIdOfAction(
    tokenAddress,
    actionableActionId,
  );

  const openActivationPage = useCallback(
    (selection: ActionActivationSelection) => {
      router.push({
        pathname:
          selection.kind === 'main'
            ? '/chat/activate/token-action-main-manager'
            : '/chat/activate/token-action-gov-manager',
        query: {
          actionId: selection.actionId.toString(),
        },
      });
    },
    [router],
  );

  if (!tokenAddress) return null;

  return (
    <section className="activation-list">
      <div className="action-id-finder">
        <label className="action-id-input-label" htmlFor="chat-action-id">
          请输入行动编号
        </label>
        <div className="action-id-input-row">
          <Input
            id="chat-action-id"
            value={actionIdInput}
            onChange={(event) => setActionIdInput(event.target.value)}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="请输入行动编号"
          />
        </div>
        {isActionIdEntered && isPendingActionsCount && <p className="action-id-status">读取行动状态...</p>}
        {isActionIdEntered && !isPendingActionsCount && actionNum === undefined && (
          <p className="action-id-status">行动状态未加载</p>
        )}
        {actionInfo?.body?.title && <p className="action-id-chip">{actionInfo.body.title}</p>}
        {hasInvalidFormat && <p className="action-id-error">只支持非负整数 Action ID。</p>}
        {isActionIdEntered && actionId !== undefined && actionNum !== undefined && actionId >= actionNum && (
          <p className="action-id-error">
            链上尚不存在 Action #{actionId.toString()}，最大可用编号是{' '}
            {actionNum > BigInt(0) ? (actionNum - BigInt(1)).toString() : '无'}。
          </p>
        )}
        {actionExists && isPendingActionInfo && <p className="action-id-status">读取行动信息...</p>}
        {actionExists && (
          <div className="activation-sublist action-id-result">
            <ActivationCard
              title="行动主群"
              description={actionMainGroupId && actionMainGroupId > BigInt(0) ? `G#${actionMainGroupId.toString()}` : ''}
              variant="subrow"
              activated={!!actionMainGroupId && actionMainGroupId > BigInt(0)}
              disabled={isPendingActionMainGroupId}
              onOpen={() => actionMainGroupId && onOpen(actionMainGroupId)}
              onActivate={() => actionId !== undefined && openActivationPage({ kind: 'main', actionId })}
            />
            <ActivationCard
              title="行动治理群"
              description={actionGovGroupId && actionGovGroupId > BigInt(0) ? `G#${actionGovGroupId.toString()}` : ''}
              variant="subrow"
              activated={!!actionGovGroupId && actionGovGroupId > BigInt(0)}
              disabled={isPendingActionGovGroupId}
              onOpen={() => actionGovGroupId && onOpen(actionGovGroupId)}
              onActivate={() => actionId !== undefined && openActivationPage({ kind: 'gov', actionId })}
            />
          </div>
        )}
      </div>
    </section>
  );
}
