"use client";

import { useState, useEffect, useRef } from "react";

export function useCountUp(target: number, duration = 800): number {
  const [val, setVal] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const diff = target - start;
    if (diff === 0) {
      setVal(target);
      return;
    }
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(step);
      else prevRef.current = target;
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return val;
}
