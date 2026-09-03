"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function PortfolioMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from("[data-hero-copy] > *", {
        y: 24,
        opacity: 0,
        duration: 0.75,
        ease: "power3.out",
        stagger: 0.09
      });

      gsap.from("[data-hero-visual]", {
        y: 30,
        opacity: 0,
        scale: 0.985,
        duration: 0.95,
        ease: "power3.out",
        delay: 0.18
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.from(element, {
          y: 28,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            once: true
          }
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-project-card]").forEach((card) => {
        const media = card.querySelector<HTMLElement>(".project-media");
        if (!media) return;

        gsap.to(media, {
          yPercent: -3,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8
          }
        });
      });
    });

    return () => ctx.revert();
  }, []);

  return null;
}
