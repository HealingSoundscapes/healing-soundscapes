import { useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';

export const [PurchaseProvider, usePurchases] = createContextHook(() => {
  const isTrackUnlocked = useCallback(() => true, []);

  const purchaseTrack = useCallback(() => {
    // Launch version: all tracks are free.
  }, []);

  return useMemo(
    () => ({
      purchasedIds: [],
      isTrackUnlocked,
      purchaseTrack,
      isPurchasing: false,
    }),
    [isTrackUnlocked, purchaseTrack],
  );
});
