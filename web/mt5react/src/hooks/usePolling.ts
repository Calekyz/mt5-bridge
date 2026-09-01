import { useEffect, useRef } from 'react';

export function usePolling(callback: () => void, delay: number) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => savedCallback.current();
    tick();
    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}
