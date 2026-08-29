import { useState, useEffect, useRef } from 'react';

export function useSmoothTime(socketTime: number, isPlaying: boolean): number {
  const [smoothTime, setSmoothTime] = useState(socketTime);
  const rafRef = useRef<number>();
  const lastUpdateRef = useRef<number>(Date.now());
  const baseTimeRef = useRef<number>(socketTime);
  const isVisibleRef = useRef<boolean>(true);

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisibleRef.current = false;
      } else {
        isVisibleRef.current = true;
        // Resync when tab becomes visible
        lastUpdateRef.current = Date.now();
        baseTimeRef.current = socketTime;
        setSmoothTime(socketTime);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [socketTime]);

  // Sync with Socket.io updates & seek events immediately
  useEffect(() => {
    baseTimeRef.current = socketTime;
    lastUpdateRef.current = Date.now();
    setSmoothTime(socketTime);
  }, [socketTime]);

  // 60fps interpolation
  useEffect(() => {
    if (!isPlaying) {
      setSmoothTime(socketTime);
      return;
    }

    const animate = () => {
      // Only update if tab is visible
      if (isVisibleRef.current) {
        const now = Date.now();
        const elapsed = (now - lastUpdateRef.current) / 1000;
        const newTime = baseTimeRef.current + elapsed;
        setSmoothTime(newTime);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    lastUpdateRef.current = Date.now();
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying, socketTime]);

  return smoothTime;
}
