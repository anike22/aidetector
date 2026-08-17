/**
 * useScrollTrigger – fires callback when scroll depth reaches `percent`.
 */
import { useEffect, useRef } from 'react';

export function useScrollTrigger(
  percent: number,
  callback: () => void,
  enabled = true
) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    firedRef.current = false;

    const handler = () => {
      if (firedRef.current) return;
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total <= 0) return;
      if ((scrolled / total) * 100 >= percent) {
        firedRef.current = true;
        callback();
      }
    };

    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [percent, callback, enabled]);
}
