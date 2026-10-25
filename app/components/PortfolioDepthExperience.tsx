"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Point = { x: number; y: number; z: number };
type Face = { points: Point[]; shade: number; depth: number };

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
    const camera = { turn: -0.35, travel: 0, zoom: 1, spread: 1, light: 0 };

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
      const z = Math.cos(t * 1.15 + phase) * 200 + u * Math.sin(twist) * breadth;
      const angle = camera.turn + smoothX * 0.12;
      const rx = x * Math.cos(angle) + z * Math.sin(angle);
      const rz = -x * Math.sin(angle) + z * Math.cos(angle);
      const ry = y * 0.94 - rz * 0.34;
      const depth = y * 0.34 + rz * 0.94;
      const perspective = 1050 / (1050 + depth);
      const scale = Math.min(width / 1350, height / 850) * camera.zoom;
      return { x: width * (width < 768 ? 0.86 : 0.77) + (rx + smoothX * 24) * perspective * scale,
        y: height * 0.5 + (ry + smoothY * 20) * perspective * scale, z: depth };
    };
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const faces: Face[] = [];
      const steps = width < 768 ? 64 : 100;
      const lanes = 8;
      for (let ribbon = 0; ribbon < 2; ribbon++) {
        for (let i = 0; i < steps; i++) {
          const t = -1.75 + i / steps * 3.5;
          for (let j = 0; j < lanes; j++) {
            const u = -1 + j / lanes * 2;
            const points = [point(t,u,ribbon),point(t+3.5/steps,u,ribbon),
              point(t+3.5/steps,u+2/lanes,ribbon),point(t,u+2/lanes,ribbon)];
            const normal = Math.cos(t * 1.65 + ribbon * 2.25 + camera.turn * 1.45 + camera.light);
            const specular = Math.pow(Math.max(0, Math.cos(t * 1.65 + ribbon * 2.25 + camera.turn - 0.55 + u * .6)), 18);
            const shade = Math.min(245, 35 + Math.abs(normal) * 92 + specular * 130 + (j === 0 ? 34 : 0));
            faces.push({points, shade, depth: points.reduce((sum,p)=>sum+p.z,0)/4});
          }
        }
      }
      faces.sort((a,b)=>b.depth-a.depth);
      for (const {points,shade} of faces) {
        ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
        for (let i=1;i<4;i++)ctx.lineTo(points[i].x,points[i].y);
        ctx.closePath();
        ctx.fillStyle = `rgb(${Math.round(shade*.91)},${Math.round(shade*.95)},${Math.round(shade)})`;
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
      // One master camera timeline prevents competing section transforms.
      const timeline=gsap.timeline({scrollTrigger:{trigger:".site-shell",start:"top top",end:"bottom bottom",scrub:.65,invalidateOnRefresh:true}});
      timeline.to(camera,{turn:1.05,travel:200,zoom:1.25,spread:1.3,light:.5,ease:"none",duration:1})
        .to(camera,{turn:2.45,travel:-170,zoom:.85,spread:1.8,light:1.3,ease:"none",duration:1.5})
        .to(camera,{turn:4.1,travel:130,zoom:1.12,spread:.85,light:2.4,ease:"none",duration:1.5});
      gsap.to(".hero-editorial__monogram",{y:-150,rotationY:32,rotationX:12,rotationZ:-8,scale:.78,ease:"none",
        scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:.6}});
      gsap.to(".hero-editorial__eyebrow",{y:-55,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:.6}});
      gsap.to(".hero-content",{y:-45,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:.6}});
      gsap.utils.toArray<HTMLElement>(".project-media").forEach(element=>{
        gsap.fromTo(element,{y:38},{y:-38,ease:"none",scrollTrigger:{trigger:element.closest("article") || element,start:"top bottom",end:"bottom top",scrub:.6}});
      });
      gsap.utils.toArray<HTMLElement>(".about-career-row").forEach(element=>{
        gsap.fromTo(element,{x:38,opacity:.35},{x:0,opacity:1,ease:"none",scrollTrigger:{trigger:element,start:"top 94%",end:"top 66%",scrub:.4}});
      });
      // The project diagram settles into perspective as its chapter enters.
      const diagram=document.querySelector<HTMLElement>(".architecture-visual");
      if(diagram)gsap.fromTo(diagram,{rotateY:-12,scale:.92},{rotateY:0,scale:1,ease:"none",scrollTrigger:{trigger:diagram,start:"top bottom",end:"center center",scrub:.6}});
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
    return ()=>{active=false;media.revert();cancelAnimationFrame(frame);window.removeEventListener("resize",resize);window.removeEventListener("pointermove",track);document.removeEventListener("visibilitychange",visibility);};
  },[]);

  return <div className="metal-scene" aria-hidden="true"><div className="metal-scene__light"/><canvas ref={canvasRef}/><div className="metal-scene__shade"/></div>;
}
