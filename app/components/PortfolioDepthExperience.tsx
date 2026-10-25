"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Point = { x: number; y: number; z: number };
type Face = { points: Point[]; shades: number[]; depth: number };

/** Perspective-projected metal surfaces. Camera, twist and lighting follow scroll.
 * One canvas, capped DPR, no React renders per frame, no external assets. */
export function PortfolioDepthExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !ctx) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    let width = 0, height = 0, frame = 0, previous = 0;
    let pointerX = 0, pointerY = 0, smoothX = 0, smoothY = 0;
    let active = true;
    let reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const camera = { turn: -0.35, travel: 0, zoom: 1, spread: 1, light: 0, shift: 0, roll: 0 };

    const resize = () => {
      width = window.innerWidth; height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    const point = (t: number, u: number, ribbon: number): Point => {
      const phase = ribbon * 2.25;
      const twist = t * 1.65 + phase + camera.turn * 0.45;
      const breadth = ribbon === 0 ? 145 : 98;
      const x = Math.sin(t * 1.15 + phase) * 220 * camera.spread + u * Math.cos(twist) * breadth;
      const y = t * 470 + camera.travel;
      const z = Math.cos(t * 1.15 + phase) * 200 + u * Math.sin(twist) * breadth + (ribbon === 0 ? -45 : 245);
      const angle = camera.turn + smoothX * (ribbon === 0 ? 0.22 : 0.08);
      const rx = x * Math.cos(angle) + z * Math.sin(angle);
      const rz = -x * Math.sin(angle) + z * Math.cos(angle);
      const ry = y * 0.94 - rz * 0.34;
      const depth = y * 0.34 + rz * 0.94;
      const perspective = 1050 / (1050 + depth);
      const scale = Math.min(width / 1350, height / 850) * camera.zoom;
      const roll = camera.roll;
      const screenX = rx * Math.cos(roll) - ry * Math.sin(roll);
      const screenY = rx * Math.sin(roll) + ry * Math.cos(roll);
      const pointerDepth = ribbon === 0 ? 65 : 20;
      return { x: width * (width < 768 ? 0.86 : 0.77) + (screenX + smoothX * pointerDepth + camera.shift) * perspective * scale,
        y: height * 0.5 + (screenY + smoothY * pointerDepth * .65) * perspective * scale, z: depth };
    };
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const faces: Face[] = [];
      const steps = width < 768 ? 160 : 280;
      for (let ribbon = 0; ribbon < 2; ribbon++) {
        for (let i = 0; i < steps; i++) {
          const t = -1.75 + i / steps * 3.5;
          const points = [point(t,-1,ribbon),point(t+3.5/steps,-1,ribbon),
            point(t+3.5/steps,1,ribbon),point(t,1,ribbon)];
          const normal = Math.cos(t * 1.65 + ribbon * 2.25 + camera.turn * 1.45 + camera.light);
          const shades = [0,.25,.5,.75,1].map(offset=>{
            const u=offset*2-1;
            const specular=Math.pow(Math.max(0,Math.cos(t*1.65+ribbon*2.25+camera.turn-.55+u*.6)),18);
            return Math.min(245,35+Math.abs(normal)*92+specular*130);
          });
          faces.push({points,shades,depth:points.reduce((sum,p)=>sum+p.z,0)/4});
        }
      }
      faces.sort((a,b)=>b.depth-a.depth);
      for (const {points,shades} of faces) {
        ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
        for (let i=1;i<4;i++)ctx.lineTo(points[i].x,points[i].y);
        ctx.closePath();
        const gradient=ctx.createLinearGradient(points[0].x,points[0].y,points[3].x,points[3].y);
        shades.forEach((shade,index)=>gradient.addColorStop(index/4,`rgb(${Math.round(shade*.91)},${Math.round(shade*.95)},${Math.round(shade)})`));
        ctx.fillStyle = gradient;
        ctx.fill();
        // Matching thin stroke seals antialias seams without exposing a mesh.
        ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.65;ctx.stroke();
      }
    }
    const tick = (now: number) => {
      if (now - previous > 1000/40) {
        smoothX += (pointerX-smoothX)*.075; smoothY += (pointerY-smoothY)*.075;
        draw(); previous=now;
      }
      frame=requestAnimationFrame(tick);
    };
    const track = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
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
          { selector: "#sobre", turn:.8, travel:160, zoom:1.2, spread:1.3, light:.5, shift:-65, roll:-.1 },
          { selector: "#projetos", turn:1.7, travel:-130, zoom:.95, spread:1.65, light:1.1, shift:70, roll:.12 },
          { selector: "#entregas", turn:2.65, travel:180, zoom:1.15, spread:1.15, light:1.8, shift:-100, roll:-.15 },
          { selector: "#competencias", turn:3.4, travel:-90, zoom:.95, spread:1.6, light:2.1, shift:60, roll:.08 },
          { selector: "#formacao", turn:4.25, travel:100, zoom:1.12, spread:1.05, light:2.7, shift:-40, roll:-.1 },
          { selector: "#contato", turn:5.1, travel:-80, zoom:1.25, spread:1.35, light:3.3, shift:50, roll:.06 }
        ];
        timeline.clear();
        let previousPosition = 0;
        const initial = { turn:-.35,travel:0,zoom:1,spread:1,light:0,shift:0,roll:0 };
        chapters.forEach(({selector,...values},index) => {
          const section=document.querySelector(selector);
          if(!section)return;
          const position=Math.min(maximum,Math.max(previousPosition+1,section.getBoundingClientRect().top+window.scrollY-120));
          const tween={...values,duration:position-previousPosition,ease:"none"};
          if(index===0)timeline.fromTo(camera,initial,{...tween,immediateRender:false},0);
          else timeline.to(camera,tween,previousPosition);
          previousPosition=position;
        });
        if(previousPosition<maximum)timeline.to(camera,{turn:5.6,zoom:1.15,duration:maximum-previousPosition,ease:"none"});
      };
      rebuild();
      ScrollTrigger.create({animation:timeline,trigger:".site-shell",start:"top top",end:"bottom bottom",scrub:.65,onRefreshInit:rebuild,invalidateOnRefresh:true});
      gsap.to(canvas,{opacity:.42,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:.6}});
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
    media.add("(prefers-reduced-motion: reduce)",()=>{reduced=true;cancelAnimationFrame(frame);draw();});
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
    return ()=>{active=false;observer.disconnect();cancelAnimationFrame(refreshFrame);media.revert();cancelAnimationFrame(frame);window.removeEventListener("resize",resize);window.removeEventListener("pointermove",track);document.removeEventListener("visibilitychange",visibility);};
  },[]);

  return <div className="metal-scene" aria-hidden="true"><div className="metal-scene__light"/><canvas ref={canvasRef}/><div className="metal-scene__shade"/></div>;
}
