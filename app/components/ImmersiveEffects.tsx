"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform
} from "motion/react";

/**
 * 21st-style ambient backdrop: a perspective mesh and two independent lighting
 * planes. Motion values update transforms without triggering React renders.
 * No canvas, WebGL, timers, cookies or network calls.
 */
export function DepthBackground() {
  const reduceMotion = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 55, damping: 24 });
  const springY = useSpring(mouseY, { stiffness: 55, damping: 24 });
  const { scrollYProgress } = useScroll();

  const gridX = useTransform(springX, [-1, 1], [-27, 27]);
  const gridY = useTransform(springY, [-1, 1], [-22, 22]);
  const orbX = useTransform(springX, [-1, 1], [42, -42]);
  const orbY = useTransform(springY, [-1, 1], [26, -26]);
  const scrollGrid = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const scrollOrb = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const parallaxGridX = useTransform(() => gridX.get());
  const parallaxGridY = useTransform(() => gridY.get() + scrollGrid.get());
  const parallaxOrbX = useTransform(() => orbX.get());
  const parallaxOrbY = useTransform(() => orbY.get() + scrollOrb.get());

  useEffect(() => {
    if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;
    const track = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      mouseX.set((event.clientX / window.innerWidth - 0.5) * 2);
      mouseY.set((event.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", track, { passive: true });
    return () => window.removeEventListener("pointermove", track);
  }, [mouseX, mouseY, reduceMotion]);

  return (
    <div className="depth-scene" aria-hidden="true">
      <div className="depth-base" />
      <div className="depth-noise" />
      <motion.div
        className="depth-grid"
        style={reduceMotion ? undefined : { x: parallaxGridX, y: parallaxGridY }}
      />
      <motion.div
        className="depth-orb depth-orb-one"
        style={reduceMotion ? undefined : { x: parallaxOrbX, y: parallaxOrbY }}
      />
      <div className="depth-orb depth-orb-two" />
      <div className="depth-orb depth-orb-three" />
      <div className="depth-vignette" />
    </div>
  );
}

/**
 * Delegated spotlight tracking. Updates CSS custom props directly rather than
 * React state on every pointer frame, following a lightweight 21st.dev pattern.
 */
export function SpotlightGrid({ children, className = "" }: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const grid = ref.current;
    if (!grid || reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;

    const track = (event: PointerEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-spotlight-card]");
      if (!target || !grid.contains(target)) return;
      const bounds = target.getBoundingClientRect();
      target.style.setProperty("--spot-x", event.clientX - bounds.left + "px");
      target.style.setProperty("--spot-y", event.clientY - bounds.top + "px");
    };
    grid.addEventListener("pointermove", track, { passive: true });
    return () => grid.removeEventListener("pointermove", track);
  }, [reduceMotion]);

  return <div ref={ref} className={className}>{children}</div>;
}

export function Reveal({ children, className = "", delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 30 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -30px 0px" }}
      transition={{ duration: 0.64, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export function ScrollProgress() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return <motion.div className="reading-progress" aria-hidden="true" style={reduceMotion ? { scaleX: 0 } : { scaleX }} />;
}
