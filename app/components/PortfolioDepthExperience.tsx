"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Keep the React 18/WebGL scene isolated from the portfolio's React 19 tree. */
export function PortfolioDepthExperience() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [enabled, setEnabled] = useState(false);

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
    const sync = () => iframeRef.current?.contentWindow?.postMessage({ type: "office:visibility", paused: document.hidden || !inView }, location.origin);
    const receive = (event: MessageEvent) => {
      if (event.origin === location.origin && event.source === iframeRef.current?.contentWindow && event.data?.type === "office:ready") sync();
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("message", receive);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); window.removeEventListener("message", receive); };
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to(".office-scene__content", { opacity: .28, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: .8 } });
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
    return () => { disposed = true; media.revert(); };
  }, []);

  return <div ref={wrapperRef} className="office-scene" aria-hidden="true" inert>
    <div className="office-scene__light" />
    <div className="office-scene__content">
      {enabled && <iframe ref={iframeRef} src="/office/index.html?embed" title="Escritório 3D decorativo" tabIndex={-1} className="office-scene__frame" onLoad={event => { event.currentTarget.dataset.ready = "true"; }} />}
    </div>
    <div className="office-scene__shade" />
  </div>;
}
