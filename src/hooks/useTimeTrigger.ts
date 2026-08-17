/**
 * useTimeTrigger – fires callback after `seconds` of being on the page.
 * Pauses while the user is actively typing.
 */
import { useEffect, useRef } from 'react';

export function useTimeTrigger(
  seconds: number,
  callback: () => void,
  enabled = true
) {
  const firedRef  = useRef(false);
  const typingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    firedRef.current = false;

    const onKeyDown = () => { typingRef.current = true; };
    const onKeyUp   = () => { setTimeout(() => { typingRef.current = false; }, 2000); };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    const timer = setTimeout(() => {
      if (!firedRef.current && !typingRef.current) {
        firedRef.current = true;
        callback();
      }
    }, seconds * 1000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [seconds, callback, enabled]);
}
