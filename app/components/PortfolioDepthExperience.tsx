"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Scroll-directed cinematic ambience.
 * Inspired by editorial aurora/shader compositions, not grids or orbit diagrams.
 * Every significant transition is tied to the visitor's actual scroll position.
 * No perpetual floating animations, WebGL, extra network assets, or photographs.
 */
export function PortfolioDepthExperience() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current) return;

    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    const scene = (key: string) => root.current!.querySelector<HTMLElement>(
      ".cinema-flow__scene--" + key
    );

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const hero = scene("hero");
      const about = scene("about");
      const projects = scene("projects");
      const finale = scene("finale");
      const monogram = document.querySelector<HTMLElement>(".hero-editorial__monogram");
      const heroCopy = document.querySelector<HTMLElement>(".hero-content");
      const heroLight = document.querySelector<HTMLElement>(".hero-editorial__light-veil");

      // A visible introduction; unlike the previous effect, lights and shapes
      // have substantial travel and evolve independently through each chapter.
      if (hero) {
        gsap.fromTo(hero,
          { opacity: 0.25, scale: 1.09, xPercent: 7 },
          { opacity: 1, scale: 1, xPercent: 0, duration: 1.65, ease: "power3.out" }
        );
      }

      const scrub = window.matchMedia("(max-width: 767px)").matches ? 0.45 : 0.85;
      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub,
          invalidateOnRefresh: true
        }
      });
      if (hero) heroTl.to(hero, { xPercent: -15, yPercent: -22, scale: 1.2, opacity: 0.13, ease: "none" }, 0);
      if (monogram) heroTl.to(monogram, { yPercent: -29, xPercent: 7, scale: 0.71, rotate: -4, opacity: 0.47, ease: "none" }, 0);
      if (heroCopy) heroTl.to(heroCopy, { y: -100, opacity: 0.48, ease: "none" }, 0);
      if (heroLight) heroTl.to(heroLight, { xPercent: 55, rotate: 18, opacity: 0.17, ease: "none" }, 0);

      // Independent, section-scoped scene timelines. Their progress follows
      // scroll position in both directions (not a one-shot opacity reveal).
      const chapters: Array<{
        target: HTMLElement | null;
        trigger: string;
        entryX: number;
        travelX: number;
        exitY: number;
        exitScale: number;
        peak: number;
      }> = [
        { target: about, trigger: "#sobre", entryX: -18, travelX: 10, exitY: -12, exitScale: 1.17, peak: 0.9 },
        { target: projects, trigger: "#projetos", entryX: 18, travelX: -16, exitY: -22, exitScale: 1.24, peak: 0.98 },
        { target: finale, trigger: "#competencias", entryX: -15, travelX: 14, exitY: -8, exitScale: 1.19, peak: 0.86 }
      ];

      chapters.forEach(({ target, trigger, entryX, travelX, exitY, exitScale, peak }) => {
        if (!target) return;
        gsap.timeline({
          scrollTrigger: {
            trigger,
            start: "top 95%",
            end: "bottom 5%",
            scrub,
            invalidateOnRefresh: true
          }
        })
          .fromTo(target,
            { opacity: 0, xPercent: entryX, yPercent: 8, scale: 0.87 },
            { opacity: peak, xPercent: 0, yPercent: 0, scale: 1, ease: "none", duration: 0.36 })
          .to(target,
            { xPercent: travelX, yPercent: exitY, scale: exitScale, opacity: 0.08, ease: "none", duration: 0.64 }
          );
      });

      // True scrubbed scene actions: selected visual accents expand into view
      // as their real chapter reaches the viewport.
      const visual = document.querySelector<HTMLElement>(".architecture-visual");
      if (visual) {
        gsap.fromTo(visual,
          { scale: 0.91, rotateY: -6, filter: "brightness(.65)" },
          {
            scale: 1, rotateY: 0, filter: "brightness(1)",
            ease: "none",
            scrollTrigger: {
              trigger: visual,
              start: "top bottom",
              end: "center center",
              scrub: 0.65
            }
          }
        );
      }

      const editorialRule = document.querySelector<HTMLElement>(".hero-editorial__line");
      if (editorialRule) {
        gsap.fromTo(editorialRule,
          { scaleX: 0.04, transformOrigin: "left center" },
          { scaleX: 1, duration: 1.3, delay: 0.22, ease: "power3.out" }
        );
      }

      // Real scroll progression for professional history: each role settles
      // into place as it approaches the reading zone, reversible on scroll up.
      gsap.utils.toArray<HTMLElement>(".about-career-row").forEach((row) => {
        gsap.fromTo(row,
          { x: 52, opacity: 0.24 },
          {
            x: 0, opacity: 1, ease: "none",
            scrollTrigger: {
              trigger: row,
              start: "top 94%",
              end: "top 62%",
              scrub: 0.55
            }
          }
        );
      });

      // The methodology advances as the actual row enters the viewport.
      gsap.utils.toArray<HTMLElement>(".delivery-stage h3").forEach((heading) => {
        gsap.fromTo(heading,
          { y: 21, opacity: 0.38 },
          {
            y: 0, opacity: 1, ease: "none",
            scrollTrigger: {
              trigger: heading,
              start: "top 96%",
              end: "top 63%",
              scrub: 0.55
            }
          }
        );
      });
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(root.current!.querySelectorAll(".cinema-flow__scene:not(.cinema-flow__scene--hero)"), { opacity: 0 });
      gsap.set(root.current!.querySelector(".cinema-flow__scene--hero"), { opacity: 1, x: 0, y: 0, scale: 1 });
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={root} className="cinema-flow" aria-hidden="true">
      <div className="cinema-flow__base" />
      <div className="cinema-flow__scene cinema-flow__scene--hero">
        <div className="cinema-flow__copper-cloud" />
        <svg className="cinema-flow__ribbons" viewBox="0 0 1600 1000"
          preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="film-copper" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e6ba8b" stopOpacity="0" />
              <stop offset="22%" stopColor="#c88758" stopOpacity=".34" />
              <stop offset="58%" stopColor="#b66f47" stopOpacity=".7" />
              <stop offset="83%" stopColor="#eec59c" stopOpacity=".45" />
              <stop offset="100%" stopColor="#eec59c" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="film-edge" x1="5%" y1="15%" x2="95%" y2="90%">
              <stop offset="0%" stopColor="#e8bd92" stopOpacity="0" />
              <stop offset="40%" stopColor="#ffd4a3" stopOpacity=".6" />
              <stop offset="70%" stopColor="#b88258" stopOpacity=".5" />
              <stop offset="100%" stopColor="#ddb18d" stopOpacity="0" />
            </linearGradient>
            <filter id="film-cloud-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="53" />
            </filter>
            <filter id="film-soft-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="17" />
            </filter>
          </defs>
          <path d="M 1780 -150 C 1450 130, 1510 285, 1130 414 S 712 677, 318 902 S -180 1090, -370 1220"
            stroke="url(#film-copper)" strokeWidth="330" strokeLinecap="round"
            fill="none" filter="url(#film-cloud-blur)" opacity=".82" />
          <path d="M 1765 -145 C 1458 135, 1445 282, 1160 405 S 720 660, 302 886 S -180 1090, -380 1180"
            stroke="url(#film-copper)" strokeWidth="115" strokeLinecap="round"
            fill="none" filter="url(#film-soft-blur)" opacity=".77" />
          <path d="M 1755 -140 C 1450 143, 1428 275, 1160 391 S 705 650, 311 873 S -180 1070, -360 1140"
            stroke="url(#film-edge)" strokeWidth="4" strokeLinecap="round"
            fill="none" opacity=".58" />
        </svg>
        <div className="cinema-flow__sheen" />
      </div>

      <div className="cinema-flow__scene cinema-flow__scene--about">
        <div className="cinema-flow__diffusion cinema-flow__diffusion--about" />
        <div className="cinema-flow__soft-edge cinema-flow__soft-edge--about" />
      </div>

      <div className="cinema-flow__scene cinema-flow__scene--projects">
        <div className="cinema-flow__diffusion cinema-flow__diffusion--projects" />
        <div className="cinema-flow__blade cinema-flow__blade--one" />
        <div className="cinema-flow__blade cinema-flow__blade--two" />
      </div>

      <div className="cinema-flow__scene cinema-flow__scene--finale">
        <div className="cinema-flow__diffusion cinema-flow__diffusion--finale" />
        <div className="cinema-flow__finale-wash" />
      </div>

      <div className="cinema-flow__texture" />
      <div className="cinema-flow__vignette" />
    </div>
  );
}
