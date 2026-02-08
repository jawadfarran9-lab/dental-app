import RatingModal from '@/src/components/RatingModal';
import { trackEvent } from '@/src/utils/analytics';
import { usePatientGuard } from '@/src/utils/navigationGuards';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';

export type PatientRatingGateHandle = {
  open: () => void;
  openOnceForView: () => void;
  close: () => void;
  isVisible: () => boolean;
};

type PatientRatingGateProps = {
  clinicName?: string;
  clinicId?: string;
  children?: React.ReactNode;
  onSubmit?: (rating: number, note?: string) => void | Promise<void>;
  onSkip?: () => void | Promise<void>;
  enabled?: boolean;
};

function InnerPatientRatingGate(
  { clinicName, clinicId, children, onSubmit, onSkip, enabled = true }: PatientRatingGateProps,
  ref: React.Ref<PatientRatingGateHandle>
) {
  usePatientGuard();

  const [visible, setVisible] = useState(false);
  const hasShownRef = useRef(false);

  useImperativeHandle(ref, () => ({
    open: () => {
      if (!enabled) return;
      setVisible(true);
    },
    openOnceForView: () => {
      if (!enabled) return;
      if (hasShownRef.current) return;
      hasShownRef.current = true;
      setVisible(true);
    },
    close: () => setVisible(false),
    isVisible: () => visible,
  }), [enabled, visible]);

  return (
    <>
      {children}
      <RatingModal
        visible={visible}
        context="patient"
        clinicName={clinicName}
        clinicId={clinicId}
        onSubmit={async (r, n) => {
          // Analytics: patient rating submitted
          trackEvent('patient_rating_submitted', { clinicId, rating: r });
          await onSubmit?.(r, n);
          setVisible(false);
        }}
        onSkip={async () => {
          // Analytics: patient rating skipped
          trackEvent('patient_rating_skipped', { clinicId });
          await onSkip?.();
          setVisible(false);
        }}
      />
    </>
  );
}

export default forwardRef<PatientRatingGateHandle, PatientRatingGateProps>(InnerPatientRatingGate);
