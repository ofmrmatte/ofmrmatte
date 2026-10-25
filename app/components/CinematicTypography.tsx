"use client";

import { type ReactNode, useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";

const HERO_LINES = [
  [{ word: "Tecnologia" }, { word: "com" }, { word: "visão", style: "hero-italic" }, { word: "de", style: "hero-italic" }, { word: "negócio.", style: "hero-italic" }],
  [{ word: "Resultado" }, { word: "com" }, { word: "propósito.", style: "hero-highlight" }]
];

export function KineticHeroTitle() {
  const reduced = useReducedMotion();
  let position = 0;
  return (
    <h1 id="hero-title" className="portfolio-kinetic-title" aria-label="Tecnologia com visão de negócio. Resultado com propósito.">
      {HERO_LINES.map((line, index) => (
        <span className="portfolio-kinetic-line" key={index}>
          {line.map(({ word, style }) => {
            const order = position++;
            return (
              <motion.span key={order} className={"portfolio-kinetic-word " + (style ?? "")}
                initial={reduced ? false : { opacity: 0, y: 36, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.83, delay: 0.14 + order * 0.085, ease: [0.2, 0.8, 0.17, 1] }}>
                {word}{" "}
              </motion.span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

export function KineticSectionTitle({ text }: { text: string }) {
  const reduced = useReducedMotion();
  return (
    <h2 className="portfolio-section-title" aria-label={text}>
      {text.split(" ").map((word, index) => (
        <motion.span key={index} className="portfolio-kinetic-word"
          initial={reduced ? false : { opacity: 0, y: 14, filter: "blur(3px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.15, margin: "0px 0px -10px 0px" }}
          transition={{ duration: 0.48, delay: Math.min(index * 0.035, 0.3), ease: [0.2, 0.75, 0.18, 1] }}>
          {word}{" "}
        </motion.span>
      ))}
    </h2>
  );
}

export function KineticEmphasisTitle({ first, second, footer = false }: {
  first: string;
  second: string;
  footer?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <h2 className={footer ? "portfolio-emphasis-title portfolio-footer-title" : "portfolio-emphasis-title"}>
      <motion.span className="portfolio-emphasis-line"
        initial={reduced ? false : { opacity: 0, y: 25, filter: "blur(7px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.72, ease: [0.2, 0.8, 0.2, 1] }}>{first}</motion.span>
      <motion.em className="portfolio-emphasis-line"
        initial={reduced ? false : { opacity: 0, y: 29, filter: "blur(9px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.78, delay: 0.14, ease: [0.2, 0.8, 0.2, 1] }}>{second}</motion.em>
    </h2>
  );
}

export function HeroCamera({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 75, damping: 24, mass: 0.7 });
  const y = useTransform(smooth, [0, 0.5, 1], [45, 0, -65]);
  const rotateY = useTransform(smooth, [0, 0.5, 1], [-8, 0, 8]);
  const rotateX = useTransform(smooth, [0, 0.5, 1], [4, 0, -4]);
  const scale = useTransform(smooth, [0, 0.5, 1], [0.96, 1, 0.96]);
  return (
    <motion.div ref={ref} className="hero-art hero-portrait-art portfolio-hero-camera"
      aria-label="Retrato profissional e representação visual da atuação"
      style={reduced ? undefined : { y, rotateY, rotateX, scale }}>
      <div className="portfolio-hero-camera-engraving" aria-hidden="true"><i /><i /><i /></div>
      {children}
    </motion.div>
  );
}

export function ScrollSignature() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 65, damping: 25 });
  const x = useTransform(progress, [0, .45, 1], [0, -170, -420]);
  return (
    <div className="portfolio-signature" aria-hidden="true">
      <motion.div className="portfolio-signature-track" style={reduced ? undefined : { x }}>
        <span>ESTRATÉGIA <b>·</b> ENGENHARIA <b>·</b> AUTOMAÇÃO <b>·</b></span>
        <span>ESTRATÉGIA <b>·</b> ENGENHARIA <b>·</b> AUTOMAÇÃO <b>·</b></span>
        <span>ESTRATÉGIA <b>·</b> ENGENHARIA <b>·</b> AUTOMAÇÃO <b>·</b></span>
      </motion.div>
    </div>
  );
}
