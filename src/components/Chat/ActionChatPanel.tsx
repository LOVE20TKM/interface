import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import { Input } from '@/components/ui/input';
import {
  useTokenActionChatGroupIdsByActions,
  useTokenActionGovChatGroupIdOfAction,
  useTokenActionMainChatGroupIdOfAction,
} from '@/src/hooks/contracts/useGroupChatManagers';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';
import { useJoinableActions } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useActionInfo, useActionsCount } from '@/src/hooks/contracts/useLOVE20Submit';
import { ActivationCard, activationActionButtonClass } from './ActivationCard';
import { parseActionIdInput } from './chatUtils';

type ActionActivationSelection = {
  kind: 'main' | 'gov';
  actionId: bigint;
};

export function ActionChatPanel({
  account,
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
  const { currentRound, isPending: isPendingCurrentRound, error: currentRoundError } = useCurrentRound(!!tokenAddress && !!account);
  const {
    joinableActions,
    isPending: isPendingJoinableActions,
    error: joinableActionsError,
  } = useJoinableActions(
    tokenAddress || ('' as `0x${string}`),
    currentRound || BigInt(0),
    account || ('' as `0x${string}`),
  );
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
  const sortedJoinableActions = useMemo(
    () =>
      [...(joinableActions || [])].sort((a, b) => {
        if (a.hasReward !== b.hasReward) return a.hasReward ? -1 : 1;
        return Number(b.votesNum - a.votesNum);
      }),
    [joinableActions],
  );
  const joinableActionIds = useMemo(
    () => sortedJoinableActions.map((actionDetail) => actionDetail.action.head.id),
    [sortedJoinableActions],
  );
  const {
    groupIdsByActionId,
    isPending: isPendingJoinableGroupIds,
    error: joinableGroupIdsError,
  } = useTokenActionChatGroupIdsByActions(tokenAddress, joinableActionIds, !!account);

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
        <div className="action-joinable-list">
          <div className="action-joinable-list-head">本轮可加入行动</div>
          {!account ? (
            <p className="action-id-status">连接钱包后显示当前可加入的行动。</p>
          ) : isPendingCurrentRound || isPendingJoinableActions ? (
            <p className="action-id-status">读取本轮可加入行动...</p>
          ) : currentRoundError || joinableActionsError ? (
            <p className="action-id-error">可加入行动读取失败，请稍后重试。</p>
          ) : sortedJoinableActions.length === 0 ? (
            <p className="action-id-status">本轮暂无可加入行动。</p>
          ) : (
            <div className="action-joinable-rows">
              {sortedJoinableActions.map((actionDetail) => {
                const listActionId = actionDetail.action.head.id;
                const title = actionDetail.action.body.title || `行动 #${listActionId.toString()}`;
                const groupIds = groupIdsByActionId.get(listActionId.toString());
                const mainGroupId = groupIds?.mainGroupId;
                const govGroupId = groupIds?.govGroupId;
                const hasMainGroup = !!mainGroupId && mainGroupId > BigInt(0);
                const hasGovGroup = !!govGroupId && govGroupId > BigInt(0);

                return (
                  <div className="action-joinable-row" key={listActionId.toString()}>
                    <button
                      type="button"
                      className="action-joinable-main"
                      onClick={() => setActionIdInput(listActionId.toString())}
                    >
                      <span>No.{listActionId.toString()}</span>
                      <strong>{title}</strong>
                    </button>
                    <div className="action-joinable-actions">
                      <button
                        type="button"
                        className={`${activationActionButtonClass(hasMainGroup)} inline-flex`}
                        disabled={isPendingJoinableGroupIds || !!joinableGroupIdsError}
                        onClick={() =>
                          hasMainGroup ? onOpen(mainGroupId) : openActivationPage({ kind: 'main', actionId: listActionId })
                        }
                      >
                        {hasMainGroup ? '进入主群' : '激活主群'}
                      </button>
                      <button
                        type="button"
                        className={`${activationActionButtonClass(hasGovGroup)} inline-flex`}
                        disabled={isPendingJoinableGroupIds || !!joinableGroupIdsError}
                        onClick={() =>
                          hasGovGroup ? onOpen(govGroupId) : openActivationPage({ kind: 'gov', actionId: listActionId })
                        }
                      >
                        {hasGovGroup ? '进入治理群' : '激活治理群'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
