/**
 * useExitIntent – fires a callback when the user is about to leave.
 *
 * Desktop: mouseleave toward the top of the viewport (y < threshold).
 * Mobile:  rapid upward scroll (velocity > threshold px/ms).
 *
 * Only fires once per mount; caller decides whether to show the popup
 * based on frequency guards.
 */

import { useEffect, useRef } from 'react';

interface Options {
  /** px from top of viewport that triggers on desktop (default 20) */
  desktopThreshold?: number;
  /** px/ms upward scroll velocity that triggers on mobile (default 2) */
  mobileVelocity?: number;
  /** minimum ms on page before trigger is active (default 5000) */
  minTimeMs?: number;
  enabled?: boolean;
}

export function useExitIntent(callback: () => void, options: Options = {}) {
  const {
    desktopThreshold = 20,
    mobileVelocity = 2,
    minTimeMs = 5000,
    enabled = true,
  } = options;

  const firedRef    = useRef(false);
  const mountTimeRef = useRef(Date.now());
  const lastScrollY  = useRef(0);
  const lastScrollT  = useRef(Date.now());

  useEffect(() => {
    if (!enabled) return;

    const fire = () => {
      if (firedRef.current) return;
      if (Date.now() - mountTimeRef.current < minTimeMs) return;
      firedRef.current = true;
      callback();
    };

    // Desktop: mouse leaves viewport through the top
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY < desktopThreshold) fire();
    };

    // Mobile: rapid upward scroll
    const onScroll = () => {
      const y = window.scrollY;
      const t = Date.now();
      const dt = t - lastScrollT.current;
      const dy = lastScrollY.current - y; // positive = scrolling up
      if (dt > 0 && dy / dt > mobileVelocity && y < 150) fire();
      lastScrollY.current = y;
      lastScrollT.current = t;
    };

    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('scroll', onScroll);
    };
  }, [enabled, desktopThreshold, mobileVelocity, minTimeMs, callback]);

  // Reset when page changes
  useEffect(() => {
    firedRef.current = false;
    mountTimeRef.current = Date.now();
  }, []);
}
