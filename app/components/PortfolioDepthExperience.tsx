"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { OfficeCamera } from "../../lib/office-scene";

/** Scroll-directed office with animated screen textures and reduced-motion support. */
export function PortfolioDepthExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    let width = 0, height = 0, frame = 0, previous = 0;
    let pointerX = 0, pointerY = 0, smoothX = 0, smoothY = 0;
    let active = true;
    let inViewport = true;
    let reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const initial: OfficeCamera = {eyeX:7.4,eyeY:5.4,eyeZ:10.8,lookX:0,lookY:1.8,lookZ:-.5,chapter:0};
    const camera: OfficeCamera = {...initial};
    let scene: ReturnType<typeof import("../../lib/office-scene")["createOfficeScene"]> | undefined;
    let elapsed = 0;
    const render = () => scene?.draw(elapsed,smoothX,smoothY,reduced);

    const resize = () => {
      width=window.innerWidth;height=window.innerHeight;
      const stage=document.querySelector(".hero-editorial");
      const wrapper=canvas.closest<HTMLElement>(".office-scene");
      if(width<=900 && stage && wrapper){
        const bounds=stage.getBoundingClientRect();
        height=bounds.height;
        wrapper.style.setProperty("--office-top",`${bounds.top+window.scrollY}px`);
        wrapper.style.setProperty("--office-height",`${height}px`);
      }
      scene?.resize(width,height);
      render();
    };
    // Load the renderer separately so the portfolio content is never blocked by 3D.
    import("../../lib/office-scene").then(({createOfficeScene})=>{
      if(!active)return;
      try {
        scene=createOfficeScene(canvas,camera);
        resize();
        canvas.dataset.ready="true";
      } catch {
        // Keep the page usable if a renderer cannot be initialized.
        canvas.dataset.ready="false";
      }
    }).catch(()=>{if(active)canvas.dataset.ready="false";});
    const tick = (now: number) => {
      if (now - previous > 1000/(scene?.fps ?? 30)) {
        elapsed += previous ? Math.min((now-previous)/1000,.2) : 0;
        smoothX += (pointerX-smoothX)*.075; smoothY += (pointerY-smoothY)*.075;
        render(); previous=now;
      }
      frame=requestAnimationFrame(tick);
    };
    const track = (event: PointerEvent) => {
      if (reduced || event.pointerType !== "mouse") return;
      pointerX = event.clientX / width - .5; pointerY = event.clientY / height - .5;
    };
    const visibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && !reduced && inViewport) {previous=0;frame=requestAnimationFrame(tick);}
    };
    media.add("(prefers-reduced-motion: no-preference)", () => {
      reduced=false;
      // Camera chapters follow real section positions, including responsive reflow.
      // One timeline owns all camera values; refresh rebuilds the same timeline.
      const timeline = gsap.timeline();
      const rebuild = () => {
        const maximum = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const chapters = [
          {selector:"#sobre",eyeX:5.5,eyeY:4.4,eyeZ:9.5,lookX:0,lookY:1.85,lookZ:-.35,chapter:1},
          {selector:"#projetos",eyeX:2.2,eyeY:3.6,eyeZ:8.1,lookX:.1,lookY:2,lookZ:-.45,chapter:2},
          {selector:"#entregas",eyeX:-2.3,eyeY:3.8,eyeZ:9.4,lookX:0,lookY:1.9,lookZ:-.55,chapter:3},
          {selector:"#competencias",eyeX:-4.2,eyeY:4.4,eyeZ:10.2,lookX:0,lookY:1.8,lookZ:-.6,chapter:4},
          {selector:"#formacao",eyeX:1.2,eyeY:5.6,eyeZ:10.2,lookX:0,lookY:1.65,lookZ:-.5,chapter:5},
          {selector:"#contato",eyeX:6.6,eyeY:5,eyeZ:10.6,lookX:0,lookY:1.8,lookZ:-.5,chapter:6}
        ];
        timeline.clear();
        let previousPosition = 0;
        chapters.forEach(({selector,...values},index) => {
          const section=document.querySelector(selector);
          if(!section)return;
          const position=Math.min(maximum,Math.max(previousPosition+1,section.getBoundingClientRect().top+window.scrollY-120));
          const tween={...values,duration:position-previousPosition,ease:"none"};
          if(index===0)timeline.fromTo(camera,initial,{...tween,immediateRender:false},0);
          else timeline.to(camera,tween,previousPosition);
          previousPosition=position;
        });
        if(previousPosition<maximum)timeline.to(camera,{chapter:7,duration:maximum-previousPosition,ease:"none"});
      };
      rebuild();
      ScrollTrigger.create({animation:timeline,trigger:".site-shell",start:"top top",end:"bottom bottom",scrub:.65,onRefreshInit:rebuild,invalidateOnRefresh:true});
      gsap.to(".office-scene__content",{opacity:.2,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:.6}});
      // Move images inside clipped frames, never the card or its copy.
      gsap.utils.toArray<HTMLElement>(".system-preview-real img, .alc-preview > img").forEach(image=>{
        gsap.fromTo(image,{yPercent:-5,scale:1.13},{yPercent:5,scale:1.13,ease:"none",scrollTrigger:{trigger:image.parentElement,start:"top bottom",end:"bottom top",scrub:.65}});
      });
      gsap.fromTo(".delivery-progress",{scaleX:0},{scaleX:1,ease:"none",scrollTrigger:{trigger:".delivery-track",start:"top 85%",end:"bottom 40%",scrub:.5}});
      gsap.utils.toArray<HTMLElement>(".delivery-stage-heading").forEach(heading=>{
        gsap.fromTo(heading,{color:"#737d8d"},{color:"#e3e8f0",ease:"none",scrollTrigger:{trigger:heading,start:"top 90%",end:"top 55%",scrub:.4}});
      });
      gsap.utils.toArray<HTMLElement>(".expertise-icon, .education-top svg").forEach(icon=>{
        gsap.fromTo(icon,{scale:.85,opacity:.5},{scale:1,opacity:1,ease:"none",scrollTrigger:{trigger:icon,start:"top 92%",end:"top 67%",scrub:.45}});
      });
      // Keep diagram edges aligned while its core and connectors gain depth.
      gsap.fromTo(".architecture-core",{scale:.86},{scale:1,ease:"none",scrollTrigger:{trigger:".architecture-visual",start:"top 90%",end:"center 50%",scrub:.6}});
      gsap.fromTo(".architecture-line",{opacity:.06},{opacity:.45,ease:"none",scrollTrigger:{trigger:".architecture-visual",start:"top 85%",end:"center 50%",scrub:.6}});
      visibility();
      return ()=>cancelAnimationFrame(frame);
    });
    media.add("(prefers-reduced-motion: reduce)",()=>{reduced=true;cancelAnimationFrame(frame);Object.assign(camera,initial);render();});
    resize();
    window.addEventListener("resize",resize,{passive:true});
    window.addEventListener("pointermove",track,{passive:true});
    document.addEventListener("visibilitychange",visibility);
    const refresh=()=>{if(active){resize();ScrollTrigger.refresh();}};
    document.fonts.ready.then(refresh);
    let refreshFrame = 0;
    const shell = document.querySelector(".site-shell");
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(refresh);
    });
    if (shell) observer.observe(shell);
    const intersection=new IntersectionObserver(([entry])=>{inViewport=entry.isIntersecting;visibility();});
    intersection.observe(canvas);
    return ()=>{active=false;observer.disconnect();intersection.disconnect();cancelAnimationFrame(refreshFrame);media.revert();cancelAnimationFrame(frame);scene?.dispose();window.removeEventListener("resize",resize);window.removeEventListener("pointermove",track);document.removeEventListener("visibilitychange",visibility);};
  },[]);

  return <div className="office-scene" aria-hidden="true"><div className="office-scene__light"/><div className="office-scene__content"><canvas ref={canvasRef}/></div><div className="office-scene__shade"/></div>;
}
