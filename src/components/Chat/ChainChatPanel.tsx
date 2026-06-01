import { useCallback } from 'react';
import { useRouter } from 'next/router';

import type { GroupNFT } from '@/src/hooks/extension/base/composite/useMyGroups';
import { ChainGroupNftPicker } from './ChainGroupNftPicker';
import { buildChatChainActivationHref } from './chatUtils';

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
      router.push(buildChatChainActivationHref(tokenSymbol, group.tokenId, group.groupName));
    },
    [router, tokenSymbol],
  );

  return (
    <section className="activation-list chain-activation-list">
      <ChainGroupNftPicker
        account={account}
        onActivate={openActivationDetail}
        onOpen={onOpen}
      />
    </section>
  );
}
