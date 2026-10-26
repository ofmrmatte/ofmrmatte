"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Keep the React 18/WebGL scene isolated from the portfolio's React 19 tree. */
export function PortfolioDepthExperience() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [enabled, setEnabled] = useState(false);
  const cameraProgress = useRef(0);
  const publishCamera = useRef<(force?: boolean) => void>(() => {});

  useEffect(() => {
    const start = () => setEnabled(true);
    if ("requestIdleCallback" in window) {
      const task = window.requestIdleCallback(start, { timeout: 1200 });
      return () => window.cancelIdleCallback(task);
    }
    const task = setTimeout(start, 150);
    return () => clearTimeout(task);
  }, []);

  useEffect(() => {
    let inView = true;
    let lastSent = -1, lastTime = -Infinity;
    const send = (force = false) => {
      const now = performance.now(), progress = cameraProgress.current;
      if (!force && (progress === lastSent || (now - lastTime < 32 && progress !== 0 && progress !== 1))) return;
      iframeRef.current?.contentWindow?.postMessage({ type: "office:scroll", progress }, location.origin);
      lastSent = progress; lastTime = now;
    };
    publishCamera.current = send;
    const sync = () => iframeRef.current?.contentWindow?.postMessage({ type: "office:visibility", paused: document.hidden || !inView }, location.origin);
    const receive = (event: MessageEvent) => {
      if (event.origin === location.origin && event.source === iframeRef.current?.contentWindow && event.data?.type === "office:ready") { sync(); send(true); }
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("message", receive);
    return () => { publishCamera.current = () => {}; observer.disconnect(); document.removeEventListener("visibilitychange", sync); window.removeEventListener("message", receive); };
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    // Keep the camera owner alive across motion-preference changes. The child
    // renders still compositions for reduced motion, without rebuilding scroll.
    const cameraContext = gsap.context(() => {
      const state = { camera: 0, document: 0 };
      const finale = document.getElementById("escritorio");
      if (!finale) return;
      const syncCamera = () => {
        cameraProgress.current = state.camera;
        if (wrapperRef.current) {
          wrapperRef.current.dataset.cameraProgress = state.camera.toFixed(6);
          wrapperRef.current.dataset.documentProgress = state.document.toFixed(6);
        }
        publishCamera.current();
      };
      const timeline = gsap.timeline({ paused: true, onUpdate: syncCamera });
      const rebuild = () => {
        const maximum = Math.max(1, ScrollTrigger.maxScroll(window));
        const arrival = Math.min(maximum, finale.getBoundingClientRect().top + window.scrollY);
        const departure = Math.min(arrival - 1, maximum * .5);
        const passage = document.getElementById("imersao");
        const revealEnd = passage ? passage.getBoundingClientRect().top + window.scrollY : arrival;
        const reveal = Math.max(departure, revealEnd - window.innerHeight * .65);
        const heroEnd = Math.max(1, document.querySelector(".hero")?.getBoundingClientRect().height ?? window.innerHeight);
        timeline.clear();
        timeline.fromTo(state, { document: 0 }, { document: 1, duration: maximum, ease: "none", immediateRender: false }, 0);
        timeline.fromTo(state, { camera: 0 }, { camera: 1, duration: arrival - departure, ease: "none", immediateRender: false }, departure);
        timeline.fromTo(".office-scene__content", { opacity: 1 }, { opacity: .45, duration: heroEnd, ease: "none", immediateRender: false }, 0);
        timeline.to(".office-scene__content", { opacity: 1, duration: revealEnd - reveal, ease: "none" }, reveal);
        timeline.fromTo(".office-scene__shade", { opacity: 1 }, { opacity: 0, duration: revealEnd - reveal, ease: "none", immediateRender: false }, reveal);
        timeline.fromTo(".site-header, .reading-progress", { autoAlpha: 1 }, { autoAlpha: 0, duration: window.innerHeight * .3, ease: "none", immediateRender: false }, revealEnd - window.innerHeight * .3);
        if (wrapperRef.current) {
          wrapperRef.current.dataset.movementStart = departure.toFixed(1);
          wrapperRef.current.dataset.movementEnd = arrival.toFixed(1);
        }
      };
      rebuild();
      ScrollTrigger.create({ id: "office-cinematic-scroll", trigger: ".site-shell", start: "top top", end: "bottom bottom", animation: timeline,
        scrub: .65, invalidateOnRefresh: true, onRefreshInit: rebuild,
        onRefresh: () => {
          // Refresh may render with suppressed callbacks; realign and publish the
          // live document position instead of forwarding the previous viewport.
          timeline.totalTime(Math.max(0, Math.min(ScrollTrigger.maxScroll(window), window.scrollY)), false);
          syncCamera(); publishCamera.current(true);
        },
        onScrubComplete: () => publishCamera.current(true),
      });
    });
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>(".system-preview-real img, .alc-preview > img").forEach(image => {
        gsap.fromTo(image, { yPercent: -5, scale: 1.13 }, { yPercent: 5, scale: 1.13, ease: "none", scrollTrigger: { trigger: image.parentElement, start: "top bottom", end: "bottom top", scrub: .65 } });
      });
      gsap.fromTo(".delivery-progress", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".delivery-track", start: "top 85%", end: "bottom 40%", scrub: .5 } });
      gsap.utils.toArray<HTMLElement>(".delivery-stage-heading").forEach(heading => {
        gsap.fromTo(heading, { color: "#737d8d" }, { color: "#e3e8f0", ease: "none", scrollTrigger: { trigger: heading, start: "top 90%", end: "top 55%", scrub: .4 } });
      });
      gsap.utils.toArray<HTMLElement>(".expertise-icon, .education-top svg").forEach(icon => {
        gsap.fromTo(icon, { scale: .85, opacity: .5 }, { scale: 1, opacity: 1, ease: "none", scrollTrigger: { trigger: icon, start: "top 92%", end: "top 67%", scrub: .45 } });
      });
      gsap.fromTo(".architecture-core", { scale: .86 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".architecture-visual", start: "top 90%", end: "center 50%", scrub: .6 } });
      gsap.fromTo(".architecture-line", { opacity: .06 }, { opacity: .45, ease: "none", scrollTrigger: { trigger: ".architecture-visual", start: "top 85%", end: "center 50%", scrub: .6 } });
    });
    let disposed = false;
    void document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
    let resizeFrame = 0;
    const observer = new ResizeObserver(() => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => ScrollTrigger.refresh()); });
    const shell = document.querySelector(".site-shell");
    if (shell) observer.observe(shell);
    return () => { disposed = true; observer.disconnect(); cancelAnimationFrame(resizeFrame); cameraContext.revert(); media.revert(); };
  }, []);

  return <div ref={wrapperRef} className="office-scene" aria-hidden="true" inert>
    <div className="office-scene__light" />
    <div className="office-scene__content">
      {enabled && <iframe ref={iframeRef} src={`/office/index.html?embed${new URLSearchParams(location.search).has("officeDebug") ? "&debug" : ""}`} title="Escritório 3D cinematográfico" tabIndex={-1} className="office-scene__frame" onLoad={event => { event.currentTarget.dataset.ready = "true"; publishCamera.current(true); }} />}
    </div>
    <div className="office-scene__shade" />
  </div>;
}
