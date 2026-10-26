"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { MetalCamera } from "../../lib/metal-scene";

/** Studio-lit 3D sculpture with a section-directed camera and a static fallback. */
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
    let reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const initial: MetalCamera = {eyeX:1.2,eyeY:.8,eyeZ:18.5,lookX:0,lookY:0,lookZ:0,roll:0,light:0,spin:.28};
    const camera: MetalCamera = {...initial};
    let scene: ReturnType<typeof import("../../lib/metal-scene")["createMetalScene"]> | undefined;
    let previousView = "";
    const render = () => {
      const view=[camera.eyeX,camera.eyeY,camera.eyeZ,camera.lookX,camera.lookY,camera.lookZ,camera.roll,camera.light,camera.spin].map(value=>value.toFixed(4)).join(",")+smoothX.toFixed(4)+smoothY.toFixed(4);
      if(view!==previousView){scene?.draw(smoothX,smoothY);previousView=view;}
    };

    const resize = () => {
      width=window.innerWidth;height=window.innerHeight;
      scene?.resize(width,height);
      previousView="";
      render();
    };
    // Load the renderer separately so the portfolio content is never blocked by 3D.
    import("../../lib/metal-scene").then(({createMetalScene})=>{
      if(!active)return;
      try {
        scene=createMetalScene(canvas,camera);
        resize();
        canvas.dataset.ready="true";
      } catch {
        // The CSS sculpture remains visible when WebGL is unavailable.
        canvas.dataset.ready="false";
      }
    }).catch(()=>{if(active)canvas.dataset.ready="false";});
    const tick = (now: number) => {
      if (now - previous > 1000/40) {
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
      if (!document.hidden && !reduced) frame=requestAnimationFrame(tick);
    };
    media.add("(prefers-reduced-motion: no-preference)", () => {
      reduced=false;
      // Camera chapters follow real section positions, including responsive reflow.
      // One timeline owns all camera values; refresh rebuilds the same timeline.
      const timeline = gsap.timeline();
      const rebuild = () => {
        const maximum = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const chapters = [
          {selector:"#sobre",eyeX:1.2,eyeY:.5,eyeZ:18,lookX:0,lookY:.2,lookZ:0,roll:0,light:.3,spin:Math.PI*.65},
          {selector:"#projetos",eyeX:1.2,eyeY:.2,eyeZ:17.8,lookX:0,lookY:0,lookZ:0,roll:0,light:.6,spin:Math.PI*1.4},
          {selector:"#entregas",eyeX:1.2,eyeY:-.4,eyeZ:18.2,lookX:0,lookY:-.2,lookZ:0,roll:0,light:.2,spin:Math.PI*2.1},
          {selector:"#competencias",eyeX:1.2,eyeY:.2,eyeZ:18.4,lookX:0,lookY:0,lookZ:0,roll:0,light:-.3,spin:Math.PI*2.8},
          {selector:"#formacao",eyeX:1.2,eyeY:.6,eyeZ:18,lookX:0,lookY:.1,lookZ:0,roll:0,light:0,spin:Math.PI*3.45},
          {selector:"#contato",eyeX:1.2,eyeY:.8,eyeZ:18.5,lookX:0,lookY:0,lookZ:0,roll:0,light:.2,spin:Math.PI*4.1}
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
        if(previousPosition<maximum)timeline.to(camera,{spin:Math.PI*4.5,duration:maximum-previousPosition,ease:"none"});
      };
      rebuild();
      ScrollTrigger.create({animation:timeline,trigger:".site-shell",start:"top top",end:"bottom bottom",scrub:.65,onRefreshInit:rebuild,invalidateOnRefresh:true});
      gsap.to(".metal-scene__content",{opacity:.42,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:.6}});
      gsap.to(".hero-editorial__monogram",{y:-150,rotationY:32,rotationX:12,rotationZ:-8,scale:.78,ease:"none",
        scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:.6}});
      gsap.to(".hero-editorial__eyebrow",{y:-55,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:.6}});
      gsap.to(".hero-content",{y:-45,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:.6}});
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
      gsap.utils.toArray<HTMLElement>(".about-career-row").forEach(element=>{
        gsap.fromTo(element,{x:38,opacity:.35},{x:0,opacity:1,ease:"none",scrollTrigger:{trigger:element,start:"top 94%",end:"top 66%",scrub:.4}});
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
    const refresh=()=>{if(active)ScrollTrigger.refresh();};
    document.fonts.ready.then(refresh);
    let refreshFrame = 0;
    const shell = document.querySelector(".site-shell");
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(refresh);
    });
    if (shell) observer.observe(shell);
    return ()=>{active=false;observer.disconnect();cancelAnimationFrame(refreshFrame);media.revert();cancelAnimationFrame(frame);scene?.dispose();window.removeEventListener("resize",resize);window.removeEventListener("pointermove",track);document.removeEventListener("visibilitychange",visibility);};
  },[]);

  return <div className="metal-scene" aria-hidden="true"><div className="metal-scene__light"/><div className="metal-scene__content"><div className="metal-scene__fallback"><i/><i/></div><canvas ref={canvasRef}/></div><div className="metal-scene__shade"/></div>;
}
