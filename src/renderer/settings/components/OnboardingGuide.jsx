import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { buildOnboardingSteps } from '../../shared/onboardingSteps.js';
import { markOnboardingCompleted } from '../../shared/onboarding.js';
import { useTourTarget } from './useTourTarget.js';
import TourDimMask from './TourDimMask.jsx';

function formatHotkey(hotkey) {
  return (
    hotkey
      ?.replace('Alt', '⌥')
      .replace('Command', '⌘')
      .replace('Control', '⌃')
      .replace('Shift', '⇧')
      .replace(/\+/g, '') ?? '⌥Space'
  );
}

export default function OnboardingGuide({ open, hotkey, hasProfiles = false, onClose, onFinish }) {
  const steps = useMemo(
    () => buildOnboardingSteps({ hotkey: formatHotkey(hotkey), hasProfiles }),
    [hotkey, hasProfiles]
  );
  const [stepIndex, setStepIndex] = useState(0);
  const cardRef = useRef(null);
  const [cardPos, setCardPos] = useState({ top: 0, left: 0, placement: 'center' });
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  const { targetRect, spotlightRect, computeTooltipPosition } = useTourTarget(
    open,
    step?.target,
    stepIndex
  );

  const finish = useCallback((completed, runFinishAction = false) => {
    if (completed) markOnboardingCompleted();
    onCloseRef.current?.();
    if (runFinishAction) onFinish?.();
  }, [onFinish]);

  const goNext = useCallback(() => {
    if (stepIndex >= steps.length - 1) {
      finish(true, !hasProfiles);
      return;
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [finish, hasProfiles, stepIndex, steps.length]);

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !step) return;

    const updatePosition = () => {
      const card = cardRef.current;
      const size = card
        ? { width: card.offsetWidth, height: card.offsetHeight }
        : { width: 340, height: 180 };
      setCardPos(
        computeTooltipPosition(targetRect, step.placement, size, step.placementOrder)
      );
    };

    updatePosition();
    const t = window.setTimeout(updatePosition, 280);
    return () => window.clearTimeout(t);
  }, [open, step, stepIndex, targetRect, computeTooltipPosition]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        finish(false);
        return;
      }
      if (e.key === 'ArrowRight' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        goNext();
        return;
      }
      if (e.key === 'ArrowLeft' && !e.metaKey && !e.ctrlKey && !e.altKey && !isFirst) {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, finish, goNext, goBack, isFirst]);

  if (!open || !step) return null;

  const beakClass = {
    bottom: 'onboarding-tour-beak-bottom',
    top: 'onboarding-tour-beak-top',
    left: 'onboarding-tour-beak-left',
    right: 'onboarding-tour-beak-right',
  }[cardPos.placement];

  return createPortal(
    <div className="onboarding-tour-overlay" role="presentation">
      <TourDimMask rect={targetRect} onDismiss={() => finish(false)} />

      {spotlightRect ? (
        <div
          className="onboarding-tour-spotlight"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
          }}
          aria-hidden="true"
        />
      ) : null}

      <div
        ref={cardRef}
        className={[
          'onboarding-tour-card',
          cardPos.placement === 'center' && 'is-center',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ top: cardPos.top, left: cardPos.left }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-body"
      >
        {beakClass ? <span className={['onboarding-tour-beak', beakClass].join(' ')} aria-hidden="true" /> : null}

        <header className="onboarding-tour-header">
          <h2 id="onboarding-title" className="onboarding-tour-title">
            {step.title}
          </h2>
        </header>

        <div className="onboarding-tour-divider" aria-hidden="true" />

        <p id="onboarding-body" className="onboarding-tour-body">
          {step.body}
        </p>

        <footer className="onboarding-tour-footer">
          <span className="onboarding-tour-progress">
            {stepIndex + 1} of {steps.length}
          </span>
          <div className="onboarding-tour-actions">
            {!isFirst ? (
              <button type="button" className="btn btn-chrome btn-compact" onClick={goBack}>
                Back
              </button>
            ) : null}
            <button type="button" className="btn btn-chrome btn-compact" onClick={() => finish(true)}>
              Skip
            </button>
            <button type="button" className="btn btn-primary btn-compact" onClick={goNext}>
              {isLast ? (hasProfiles ? 'Done' : 'Create a profile') : 'Next'}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
