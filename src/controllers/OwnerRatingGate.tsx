import RatingModal from '@/src/components/RatingModal';
import { trackEvent } from '@/src/utils/analytics';
import { useClinicGuard, useClinicRoleGuard } from '@/src/utils/navigationGuards';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';

export type OwnerRatingGateHandle = {
  open: () => void;
  close: () => void;
  isVisible: () => boolean;
  openIfSubscriptionFlag: () => Promise<void>;
  markAsShownForSubscription: () => Promise<void>;
};

type OwnerRatingGateProps = {
  clinicId: string;
  clinicName?: string;
  children?: React.ReactNode;
  onSubmit?: (rating: number, note?: string) => void | Promise<void>;
  onSkip?: () => void | Promise<void>;
  enabled?: boolean;
};

function InnerOwnerRatingGate(
  { clinicId, clinicName, children, onSubmit, onSkip, enabled = true }: OwnerRatingGateProps,
  ref: React.Ref<OwnerRatingGateHandle>
) {
  useClinicGuard();
  useClinicRoleGuard(['owner']);

  const [visible, setVisible] = useState(false);
  const hasShownRef = useRef(false);

  const keys = useMemo(() => ({
    flagShow: `showOwnerRatingAfterSubscription:${clinicId}`,
    shown: `ratingShownAfterSubscription:${clinicId}`,
  }), [clinicId]);

  useImperativeHandle(ref, () => ({
    open: () => {
      if (!enabled) return;
      setVisible(true);
    },
    close: () => setVisible(false),
    isVisible: () => visible,
    openIfSubscriptionFlag: async () => {
      if (!enabled) return;
      if (hasShownRef.current) return;
      const [flag, alreadyShown] = await Promise.all([
        AsyncStorage.getItem(keys.flagShow),
        AsyncStorage.getItem(keys.shown),
      ]);
      if (flag && !alreadyShown) {
        hasShownRef.current = true;
        setVisible(true);
      }
    },
    markAsShownForSubscription: async () => {
      await AsyncStorage.setItem(keys.shown, 'true');
      await AsyncStorage.removeItem(keys.flagShow);
    },
  }), [enabled, keys.flagShow, keys.shown, visible]);

  return (
    <>
      {children}
      <RatingModal
        visible={visible}
        context="clinicOwner"
        clinicName={clinicName}
        clinicId={clinicId}
        onSubmit={async (r, n) => {
          // Analytics: clinic owner rating submitted
          trackEvent('clinic_owner_rating_submitted', { clinicId, rating: r });
          await onSubmit?.(r, n);
          setVisible(false);
          // Persist that we showed it after subscription
          await AsyncStorage.setItem(keys.shown, 'true');
          await AsyncStorage.removeItem(keys.flagShow);
        }}
        onSkip={async () => {
          // Analytics: clinic owner rating skipped
          trackEvent('clinic_owner_rating_skipped', { clinicId });
          await onSkip?.();
          setVisible(false);
          await AsyncStorage.setItem(keys.shown, 'true');
          await AsyncStorage.removeItem(keys.flagShow);
        }}
      />
    </>
  );
}

export default forwardRef<OwnerRatingGateHandle, OwnerRatingGateProps>(InnerOwnerRatingGate);
