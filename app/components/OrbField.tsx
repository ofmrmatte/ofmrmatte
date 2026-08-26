"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";

const traces = [
  ["8%", "16s", "0s", "24vw"],
  ["22%", "13s", "-4s", "18vw"],
  ["41%", "18s", "-9s", "30vw"],
  ["67%", "15s", "-6s", "20vw"],
  ["84%", "20s", "-11s", "28vw"]
];

export function OrbField() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".orb-field");
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = (x: number, y: number) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        root.style.setProperty("--mx", `${x}px`);
        root.style.setProperty("--my", `${y}px`);
      });
    };
    const onPointer = (event: PointerEvent) => update(event.clientX, event.clientY);
    const onScroll = () => root.style.setProperty("--scroll", String(window.scrollY));

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="orb-field" aria-hidden="true">
      {traces.map(([top, speed, delay, width]) => (
        <span
          className="field-trace"
          key={`${top}-${speed}`}
          style={{
            "--speed": speed,
            "--delay": delay,
            "--top": top,
            "--trace-width": width
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
