import { useCallback } from 'react';
import { useRouter } from 'next/router';

import type { GroupNFT } from '@/src/hooks/extension/base/composite/useMyGroups';
import { ChainGroupNftPicker } from './ChainGroupNftPicker';

export function ChainChatPanel({
  account,
  tokenSymbol,
  onOpen,
}: {
  isConnected: boolean;
  account: `0x${string}` | undefined;
  tokenSymbol?: string;
  onOpen: (groupId: bigint) => void;
  onConfirmed: () => void;
}) {
  const router = useRouter();

  const openActivationDetail = useCallback(
    (group: GroupNFT) => {
      router.push({
        pathname: '/chat/activate/chain',
        query: {
          ...(tokenSymbol ? { symbol: tokenSymbol } : {}),
          groupId: group.tokenId.toString(),
          ...(group.groupName ? { groupName: group.groupName } : {}),
        },
      });
    },
    [router, tokenSymbol],
  );

  return (
    <section className="activation-list">
      <ChainGroupNftPicker
        account={account}
        onActivate={openActivationDetail}
        onOpen={onOpen}
      />
    </section>
  );
}
