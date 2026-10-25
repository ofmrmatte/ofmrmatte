"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Quiet editorial backdrop inspired by the masked-grid and radial-glow
 * patterns on 21st.dev. No autonomous animation, canvas, WebGL or
 * floating decorative objects. GSAP responds only to real scrolling.
 */
export function PortfolioDepthExperience() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add("(min-width: 769px) and (prefers-reduced-motion: no-preference)", () => {
      const glow = document.querySelector<HTMLElement>(".ambient-editorial__glow");
      const grid = document.querySelector<HTMLElement>(".ambient-editorial__grid");
      const mark = document.querySelector<HTMLElement>(".hero-editorial__monogram");

      if (glow) {
        gsap.to(glow, {
          yPercent: -14,
          xPercent: -4,
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "max",
            scrub: 1.25
          }
        });
      }

      if (grid) {
        gsap.to(grid, {
          y: -68,
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "max",
            scrub: 1.45
          }
        });
      }

      if (mark) {
        gsap.to(mark, {
          yPercent: -12,
          scale: 1.035,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: 0.9
          }
        });
      }
    });

    mm.add("(max-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const glow = document.querySelector<HTMLElement>(".ambient-editorial__glow");
      if (!glow) return;
      gsap.to(glow, {
        yPercent: -6,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "max",
          scrub: 1.5
        }
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <div className="ambient-editorial" aria-hidden="true">
      <div className="ambient-editorial__base" />
      <div className="ambient-editorial__glow" />
      <div className="ambient-editorial__grid" />
      <div className="ambient-editorial__grain" />
      <div className="ambient-editorial__veil" />
    </div>
  );
}
