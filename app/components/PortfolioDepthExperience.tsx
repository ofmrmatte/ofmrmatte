"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform
} from "motion/react";

/**
 * Layered, AUREON-inspired spatial scene for the personal portfolio.
 * The camera moves because the visitor scrolls, not because elements float on a loop.
 * GPU compositing only: no WebGL, canvas, timers, image downloads or dependencies.
 */
export function PortfolioDepthExperience() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 68, damping: 26, mass: 0.65 });
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const softX = useSpring(pointerX, { stiffness: 38, damping: 22 });
  const softY = useSpring(pointerY, { stiffness: 38, damping: 22 });

  useEffect(() => {
    if (reduced || !window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    const onPointer = (event: PointerEvent) => {
      pointerX.set((event.clientX / window.innerWidth - .5) * 2);
      pointerY.set((event.clientY / window.innerHeight - .5) * 2);
    };
    const onLeave = () => { pointerX.set(0); pointerY.set(0); };
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [pointerX, pointerY, reduced]);

  const lightY = useTransform(progress, [0, .28, .65, 1], [0, -80, 70, -160]);
  const farY = useTransform(progress, [0, .28, .65, 1], [0, -110, -265, -375]);
  const midY = useTransform(progress, [0, .28, .65, 1], [0, -40, -130, -210]);
  const nearY = useTransform(progress, [0, .28, .65, 1], [0, 25, 105, 175]);
  const rot = useTransform(progress, [0, .28, .65, 1], [-17, 0, 23, 38]);
  const tilt = useTransform(progress, [0, .4, 1], [12, 24, 8]);
  const mouseX = useTransform(softX, [-1, 1], [-17, 17]);
  const mouseY = useTransform(softY, [-1, 1], [-10, 10]);
  const combineMidX = useTransform(() => mouseX.get());
  const combineMidY = useTransform(() => midY.get() + mouseY.get());
  const openingOpacity = useTransform(progress, [0, .18, .36, .5], [.9, 1, .53, .18]);
  const secondOpacity = useTransform(progress, [.18, .4, .6, .82], [0, .9, .94, .12]);
  const finalOpacity = useTransform(progress, [.53, .74, 1], [0, .76, .93]);
  const haloScale = useTransform(progress, [0, .45, 1], [.95, 1.24, 1.45]);

  return (
    <div className="portfolio-world" aria-hidden="true">
      <div className="portfolio-world-foundation" />
      <div className="portfolio-world-stars" />
      <motion.div className="portfolio-world-halo" style={reduced ? undefined : { y: lightY, scale: haloScale }} />

      <motion.div className="portfolio-world-space portfolio-world-far"
        style={reduced ? undefined : { y: farY }}>
        <span className="portfolio-world-horizon" />
        <span className="portfolio-world-horizon portfolio-world-horizon-two" />
        <span className="portfolio-world-deep-light" />
      </motion.div>

      <motion.div className="portfolio-world-space portfolio-world-engine"
        style={reduced ? undefined : {
          x: combineMidX,
          y: combineMidY,
          rotateZ: rot,
          rotateX: tilt,
          opacity: openingOpacity
        }}>
        <div className="portfolio-world-engine-shaft" />
        <div className="portfolio-world-ring portfolio-world-ring-outer" />
        <div className="portfolio-world-ring portfolio-world-ring-second" />
        <div className="portfolio-world-ring portfolio-world-ring-third" />
        <div className="portfolio-world-ring portfolio-world-ring-inner" />
        <div className="portfolio-world-polar polar-a" />
        <div className="portfolio-world-polar polar-b" />
        <div className="portfolio-world-polar polar-c" />
        <div className="portfolio-world-polar polar-d" />
        <span className="portfolio-world-particle particle-a" />
        <span className="portfolio-world-particle particle-b" />
        <span className="portfolio-world-particle particle-c" />
        <span className="portfolio-world-particle particle-d" />
        <div className="portfolio-world-engine-center"><span>MF</span><small>PROCESSOS / SOFTWARE / IA</small></div>
        <div className="portfolio-world-engine-detail detail-one">01 / SYSTEMS</div>
        <div className="portfolio-world-engine-detail detail-two">ENGINEERING / 2026</div>
      </motion.div>

      <motion.div className="portfolio-world-space portfolio-world-architecture"
        style={reduced ? undefined : { y: nearY, opacity: secondOpacity }}>
        <div className="portfolio-world-architecture-perspective">
          <span className="portfolio-world-track track-one" />
          <span className="portfolio-world-track track-two" />
          <span className="portfolio-world-track track-three" />
          <span className="portfolio-world-track track-four" />
          <span className="portfolio-world-signal signal-one" />
          <span className="portfolio-world-signal signal-two" />
          <span className="portfolio-world-signal signal-three" />
          <span className="portfolio-world-track-caption">ARCHITECTURE / SYSTEM DESIGN</span>
        </div>
      </motion.div>

      <motion.div className="portfolio-world-space portfolio-world-finale"
        style={reduced ? undefined : { opacity: finalOpacity }}>
        <div className="portfolio-world-finale-lens" />
        <span className="portfolio-world-finale-arc arc-one" />
        <span className="portfolio-world-finale-arc arc-two" />
        <span className="portfolio-world-finale-tick tick-one" />
        <span className="portfolio-world-finale-tick tick-two" />
      </motion.div>

      <div className="portfolio-world-grain" />
      <div className="portfolio-world-vignette" />
    </div>
  );
}
