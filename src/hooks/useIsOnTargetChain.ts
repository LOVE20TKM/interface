import { useChainId } from 'wagmi';

import { config } from '@/src/wagmi';

export const useIsOnTargetChain = () => {
  const chainId = useChainId();
  const targetChainId = config.chains[0]?.id;

  return !targetChainId || chainId === targetChainId;
};
