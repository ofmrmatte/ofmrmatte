"use client";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";

export function PortfolioDepthExperience() {
  const reduced = useReducedMotion();
  const { scrollYProgress, scrollY } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 62, damping: 25, mass: 0.7 });
  const horizon = useTransform(smooth, [0, 0.42, 1], [0, -180, -460]);
  const mid = useTransform(smooth, [0, 0.42, 1], [0, -105, -220]);
  const near = useTransform(smooth, [0, 0.42, 1], [0, -40, -105]);
  const twist = useTransform(smooth, [0, 0.55, 1], [-13, 7, -8]);
  const bloom = useTransform(smooth, [0, .5, 1], [.72, 1, .56]);
  const progress = useTransform(scrollY, [0, 850], [0, 1]);
  return <div className="aureon-depth-world" aria-hidden="true">
    <div className="aureon-depth-base" />
    <motion.div className="aureon-depth-back aureon-depth-layer" style={reduced ? undefined : { y: horizon, opacity: bloom }} />
    <motion.div className="aureon-depth-architecture aureon-depth-layer" style={reduced ? undefined : { y: mid, rotateZ: twist }} >
      <span className="aureon-depth-ring ring-a" />
      <span className="aureon-depth-ring ring-b" />
      <span className="aureon-depth-ring ring-c" />
      <span className="aureon-depth-axis axis-a" />
      <span className="aureon-depth-axis axis-b" />
      <span className="aureon-depth-node node-a" />
      <span className="aureon-depth-node node-b" />
      <span className="aureon-depth-node node-c" />
    </motion.div>
    <motion.div className="aureon-depth-front aureon-depth-layer" style={reduced ? undefined : { y: near }} />
    <div className="aureon-depth-grain" />
    <div className="aureon-depth-shade" />
    <motion.div className="aureon-depth-entry" style={reduced ? undefined : { opacity: progress }} />
  </div>;
}
