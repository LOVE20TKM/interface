import { useCallback } from 'react';
import { useRouter } from 'next/router';

import {
  useTokenGovChatGroupIdOfToken,
  useTokenMainChatGroupIdOfToken,
} from '@/src/hooks/contracts/useGroupChatManagers';
import { ActivationCard } from './ActivationCard';

export function ActivationPanel({
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
  const { groupId: mainGroupId, isPending: isPendingMainGroupId } = useTokenMainChatGroupIdOfToken(tokenAddress);
  const { groupId: govGroupId, isPending: isPendingGovGroupId } = useTokenGovChatGroupIdOfToken(tokenAddress);

  const openActivationPage = useCallback(
    (kind: 'main' | 'gov') => {
      router.push({
        pathname: kind === 'main' ? '/chat/activate/token-main-manager' : '/chat/activate/token-gov-manager',
      });
    },
    [router],
  );

  if (!tokenAddress) return null;

  return (
    <section className="activation-list">
      <ActivationCard
        title={`${tokenSymbol || '当前代币'} 主群`}
        description={mainGroupId && mainGroupId > BigInt(0) ? `G#${mainGroupId.toString()}` : ''}
        typeClass="activation-card-token-community"
        activated={!!mainGroupId && mainGroupId > BigInt(0)}
        disabled={isPendingMainGroupId}
        onOpen={() => mainGroupId && onOpen(mainGroupId)}
        onActivate={() => openActivationPage('main')}
      />
      <ActivationCard
        title={`${tokenSymbol || '当前代币'} 治理群`}
        description={govGroupId && govGroupId > BigInt(0) ? `G#${govGroupId.toString()}` : ''}
        typeClass="activation-card-token-gov"
        activated={!!govGroupId && govGroupId > BigInt(0)}
        disabled={isPendingGovGroupId}
        onOpen={() => govGroupId && onOpen(govGroupId)}
        onActivate={() => openActivationPage('gov')}
      />
    </section>
  );
}
