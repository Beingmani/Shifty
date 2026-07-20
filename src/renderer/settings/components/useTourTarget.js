import { useLayoutEffect, useState } from 'react';

const PAD = 10;
const MARGIN = 14;
const VIEWPORT_PAD = 16;
const AVOID_GAP = 10;

function queryTarget(targetId) {
  if (!targetId) return null;
  return document.querySelector(`[data-tour="${targetId}"]`);
}

function measureRect(el) {
  const r = el.getBoundingClientRect();
  return {
    top: r.top,
    left: r.left,
    width: r.width,
    height: r.height,
    right: r.right,
    bottom: r.bottom,
  };
}

function fitsViewport(top, left, width, height) {
  return (
    top >= VIEWPORT_PAD
    && left >= VIEWPORT_PAD
    && top + height <= window.innerHeight - VIEWPORT_PAD
    && left + width <= window.innerWidth - VIEWPORT_PAD
  );
}

function overlapsTarget(top, left, width, height, rect) {
  if (!rect) return false;
  const card = { top, left, right: left + width, bottom: top + height };
  const target = {
    top: rect.top - AVOID_GAP,
    left: rect.left - AVOID_GAP,
    right: rect.right + AVOID_GAP,
    bottom: rect.bottom + AVOID_GAP,
  };
  return !(
    card.right < target.left
    || card.left > target.right
    || card.bottom < target.top
    || card.top > target.bottom
  );
}

function positionForSide(side, rect, tw, th) {
  let top;
  let left;

  if (side === 'bottom') {
    top = rect.bottom + MARGIN;
    left = rect.left + rect.width / 2 - tw / 2;
  } else if (side === 'top') {
    top = rect.top - MARGIN - th;
    left = rect.left + rect.width / 2 - tw / 2;
  } else if (side === 'left') {
    top = rect.top + rect.height / 2 - th / 2;
    left = rect.left - MARGIN - tw;
  } else {
    top = rect.top + rect.height / 2 - th / 2;
    left = rect.right + MARGIN;
  }

  left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - tw - VIEWPORT_PAD));
  top = Math.max(VIEWPORT_PAD, Math.min(top, window.innerHeight - th - VIEWPORT_PAD));

  return { top, left, placement: side };
}

function computeTooltipPosition(rect, placement, size, placementOrder) {
  const { width: tw, height: th } = size;

  if (placement === 'center' || !rect) {
    const top = Math.max(VIEWPORT_PAD, (window.innerHeight - th) / 2);
    const left = Math.max(VIEWPORT_PAD, (window.innerWidth - tw) / 2);
    return { top, left, placement: 'center' };
  }

  const order = placementOrder?.length
    ? [...placementOrder, 'center']
    : [placement, 'bottom', 'top', 'right', 'left', 'center'];

  for (const side of order) {
    if (side === 'center') break;
    const pos = positionForSide(side, rect, tw, th);
    if (
      fitsViewport(pos.top, pos.left, tw, th)
      && !overlapsTarget(pos.top, pos.left, tw, th, rect)
    ) {
      return pos;
    }
  }

  const top = Math.max(VIEWPORT_PAD, (window.innerHeight - th) / 2);
  const left = Math.max(VIEWPORT_PAD, (window.innerWidth - tw) / 2);
  return { top, left, placement: 'center' };
}

export function useTourTarget(open, targetId, stepIndex) {
  const [targetRect, setTargetRect] = useState(null);

  useLayoutEffect(() => {
    if (!open) {
      setTargetRect(null);
      document.querySelectorAll('[data-tour-active]').forEach((node) => {
        node.removeAttribute('data-tour-active');
      });
      return undefined;
    }

    let frame = 0;

    const clearActive = () => {
      document.querySelectorAll('[data-tour-active]').forEach((node) => {
        node.removeAttribute('data-tour-active');
      });
    };

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        clearActive();
        if (!targetId) {
          setTargetRect(null);
          return;
        }
        const el = queryTarget(targetId);
        if (!el) {
          setTargetRect(null);
          return;
        }
        el.setAttribute('data-tour-active', 'true');
        el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        setTargetRect(measureRect(el));
      });
    };

    update();

    const onLayout = () => update();
    window.addEventListener('resize', onLayout);
    window.addEventListener('scroll', onLayout, true);

    const el = queryTarget(targetId);
    if (el) {
      const ro = new ResizeObserver(onLayout);
      ro.observe(el);
      return () => {
        cancelAnimationFrame(frame);
        ro.disconnect();
        window.removeEventListener('resize', onLayout);
        window.removeEventListener('scroll', onLayout, true);
        clearActive();
      };
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onLayout);
      window.removeEventListener('scroll', onLayout, true);
      clearActive();
    };
  }, [open, targetId, stepIndex]);

  const spotlightRect = targetRect
    ? {
      top: targetRect.top - PAD,
      left: targetRect.left - PAD,
      width: targetRect.width + PAD * 2,
      height: targetRect.height + PAD * 2,
    }
    : null;

  return { targetRect, spotlightRect, computeTooltipPosition };
}
