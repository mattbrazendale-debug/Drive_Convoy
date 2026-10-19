"use client";

import { useEffect, useState } from "react";

export function Countdown({ startsAt, onDone }: { startsAt: number; onDone: () => void }) {
  const [value, setValue] = useState(3);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.ceil((startsAt - Date.now()) / 1000);
      if (remaining <= 0) {
        setValue(0);
        onDone();
        return;
      }
      setValue(remaining);
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [startsAt, onDone]);

  if (value <= 0) return null;
  return <div className="countdown" aria-live="polite">{value}</div>;
}
