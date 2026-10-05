import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../utils/motion";

// Hace que un número "cuente" suavemente desde su valor anterior al nuevo.
export function useAnimatedNumber(target, duration = 700) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    if (target == null) return;
    const from = fromRef.current;

    if (from == null || from === target || prefersReducedMotion()) {
      fromRef.current = target;
      setValue(target);
      return;
    }

    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (target - from) * eased;
      fromRef.current = current;
      setValue(current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
