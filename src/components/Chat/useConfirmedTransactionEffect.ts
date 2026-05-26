import { useEffect, useRef } from 'react';

type ConfirmableTransaction = {
  hash?: `0x${string}`;
  isConfirmed?: boolean;
};

export function useConfirmedTransactionEffect(
  transaction: ConfirmableTransaction,
  onConfirmed: () => void,
) {
  const handledHashRef = useRef<`0x${string}` | undefined>();

  useEffect(() => {
    if (!transaction.hash || !transaction.isConfirmed) return;
    if (handledHashRef.current === transaction.hash) return;
    handledHashRef.current = transaction.hash;
    onConfirmed();
  }, [onConfirmed, transaction.hash, transaction.isConfirmed]);
}
