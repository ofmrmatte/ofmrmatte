"use client";

import { useEffect, useRef } from "react";

/**
 * A real-time ambient scene, intentionally rendered with the Canvas 2D API
 * rather than a video or a static gradient. Perspective particles, linked
 * constellations, curated stellar groups and orbital light paths respond to
 * pointer and scroll depth. No third-party shaders or external services.
 */
type Particle = {
  x: number;
  y: number;
  z: number;
  phase: number;
  speed: number;
  radius: number;
  group: number;
};

function makeParticles(width: number, height: number): Particle[] {
  const count = Math.min(110, Math.max(55, Math.floor((width * height) / 17500)));
  // Deliberate constellation clusters: distinct, asymmetric star fields rather
  // than uniformly distributed noise across the entire viewport.
  const anchors = [
    [0.83, 0.28], [0.62, 0.57], [0.94, 0.76],
    [0.31, 0.19], [0.16, 0.79], [0.54, 0.12]
  ];
  return Array.from({ length: count }, (_, index) => {
    const group = index % anchors.length;
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random());
    return {
      x: (anchors[group][0] - 0.5) * width + Math.cos(angle) * radius * Math.min(width * 0.2, 245),
      y: (anchors[group][1] - 0.5) * height + Math.sin(angle) * radius * Math.min(height * 0.23, 170),
      z: 0.22 + Math.random() * 0.78,
      phase: Math.random() * Math.PI * 2,
      speed: 0.16 + Math.random() * 0.32,
      radius: 0.65 + Math.random() * 1.65,
      group
    };
  });
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  particles: Particle[],
  time: number,
  px: number,
  py: number,
  scroll: number
) {
  ctx.clearRect(0, 0, width, height);
  const centerX = width * 0.73 + px * 28;
  const centerY = height * 0.46 + py * 18 - Math.min(scroll * 0.04, 60);

  // Visible, autonomous aurora ribbons built out of translucent light fields.
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 3; i++) {
    const driftX = Math.sin(time * (0.18 + i * 0.06) + i * 2.1);
    const driftY = Math.cos(time * (0.13 + i * 0.03) + i);
    const gx = centerX + driftX * (100 + i * 45) + (i - 1) * 150;
    const gy = centerY + driftY * (85 + i * 22) - 80;
    const radius = Math.max(width * 0.34, 390) + i * 35;
    const gradient = ctx.createRadialGradient(gx, gy, 12, gx, gy, radius);
    if (i === 0) {
      gradient.addColorStop(0, "rgba(57,231,210,0.20)");
      gradient.addColorStop(0.35, "rgba(36,164,184,0.12)");
    } else if (i === 1) {
      gradient.addColorStop(0, "rgba(99,121,253,0.15)");
      gradient.addColorStop(0.35, "rgba(69,95,204,0.09)");
    } else {
      gradient.addColorStop(0, "rgba(74,195,239,0.15)");
      gradient.addColorStop(0.35, "rgba(38,126,213,0.08)");
    }
    gradient.addColorStop(1, "rgba(15,25,46,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(gx - radius, gy - radius, radius * 2, radius * 2);
  }
  ctx.restore();

  // Cinematic orbit fragments, not geometric wireframe circles.
  // Elliptical arcs breathe on independent axes and show soft comet trails.
  ctx.save();
  ctx.translate(centerX, centerY - 34);
  ctx.globalCompositeOperation = "screen";
  for (let ring = 0; ring < 3; ring++) {
    const rx = 160 + ring * 87;
    const ry = 74 + ring * 43;
    const angle = -0.42 + ring * 0.53 + Math.sin(time * (0.07 + ring * 0.025)) * 0.16;
    ctx.save();
    ctx.rotate(angle);
    const start = time * (0.045 + ring * 0.016) + ring * 1.85;
    const length = Math.PI * (0.77 + ring * 0.1);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, start, start + length);
    ctx.strokeStyle = ring === 1 ? "rgba(139,174,248,0.22)" : "rgba(123,236,220,0.23)";
    ctx.lineWidth = ring === 0 ? 1.15 : 0.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, start + length - 0.42, start + length);
    ctx.strokeStyle = ring === 1 ? "rgba(172,194,255,0.42)" : "rgba(180,255,230,0.45)";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    const cometPosition = start + length;
    const cx = Math.cos(cometPosition) * rx;
    const cy = Math.sin(cometPosition) * ry;
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, ring === 0 ? 27 : 17);
    halo.addColorStop(0, ring === 1 ? "rgba(173,194,255,0.58)" : "rgba(167,255,223,0.62)");
    halo.addColorStop(1, "rgba(150,240,222,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, ring === 0 ? 27 : 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Organic constellation groups. Connect only nearby stars *within* the same
  // cluster, keeping the dark negative space clean and intentional.
  const projected: { x: number; y: number; a: number; r: number; group: number }[] = [];
  const drift = Math.sin(time * 0.17) * 17;
  for (const star of particles) {
    const z = star.z;
    const parallax = 0.62 + z * 0.42;
    const x = width / 2 + star.x * parallax +
      px * (9 + z * 34) + Math.sin(time * star.speed + star.phase) * 9 + drift * z;
    const y = height / 2 + star.y * parallax +
      py * (8 + z * 22) + Math.cos(time * star.speed * 0.75 + star.phase) * 11 -
      Math.min(scroll * 0.017 * z, 31);
    const twinkle = 0.35 + Math.sin(time * (0.75 + z * 0.3) + star.phase) * 0.19;
    projected.push({
      x, y, a: twinkle + z * 0.35,
      r: star.radius * (0.65 + z * 0.65),
      group: star.group
    });
  }
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const maxDistance = Math.min(138, width * 0.13);
  for (let index = 0; index < projected.length; index++) {
    const p = projected[index];
    if (p.x < -15 || p.x > width + 15 || p.y < -15 || p.y > height + 15) continue;
    let links = 0;
    for (let j = index + 1; j < projected.length && links < 2; j++) {
      const q = projected[j];
      if (p.group !== q.group) continue;
      const dx = p.x - q.x;
      const dy = p.y - q.y;
      const distance2 = dx * dx + dy * dy;
      if (distance2 > maxDistance * maxDistance) continue;
      const alpha = (1 - Math.sqrt(distance2) / maxDistance) * 0.18 * Math.min(p.a, q.a);
      ctx.strokeStyle = "rgba(143,231,232," + alpha.toFixed(3) + ")";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
      links++;
    }
    const glowRadius = p.r * 5;
    const starGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
    starGlow.addColorStop(0, "rgba(191,255,240," + Math.min(p.a * 0.66, 0.55).toFixed(3) + ")");
    starGlow.addColorStop(1, "rgba(136,242,223,0)");
    ctx.fillStyle = starGlow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 0.68, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(206,255,249," + Math.min(0.84, p.a).toFixed(3) + ")";
    ctx.fill();
  }
  ctx.restore();
}

export function AtmosphericField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const initialReducedMotion = media.matches;
    const lowPower = window.matchMedia("(pointer: coarse)").matches;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let raf = 0;
    let particles = makeParticles(width, height);
    let last = 0;
    let logicalTime = 0;
    let fpsElapsed = 0;
    let active = !initialReducedMotion;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.6);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = makeParticles(width, height);
      drawScene(ctx, width, height, particles, logicalTime, pointerRef.current.x, pointerRef.current.y, scrollRef.current);
    };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerRef.current.x += (((event.clientX / width) - 0.5) * 2 - pointerRef.current.x) * 0.3;
      pointerRef.current.y += (((event.clientY / height) - 0.5) * 2 - pointerRef.current.y) * 0.3;
    };
    const scroll = () => { scrollRef.current = window.scrollY; };
    const frame = (timestamp: number) => {
      if (!active || document.hidden) return;
      if (timestamp - fpsElapsed < (lowPower ? 42 : 28)) {
        raf = window.requestAnimationFrame(frame);
        return;
      }
      fpsElapsed = timestamp;
      const delta = last ? Math.min(0.05, (timestamp - last) / 1000) : 0;
      last = timestamp;
      logicalTime += delta;
      drawScene(ctx, width, height, particles, logicalTime, pointerRef.current.x, pointerRef.current.y, scrollRef.current);
      raf = window.requestAnimationFrame(frame);
    };
    const visibility = () => {
      window.cancelAnimationFrame(raf);
      last = 0;
      if (!document.hidden && active) raf = window.requestAnimationFrame(frame);
    };
    const motionPreference = () => {
      active = !media.matches;
      visibility();
      if (!active) drawScene(ctx, width, height, particles, logicalTime, pointerRef.current.x, pointerRef.current.y, scrollRef.current);
    };

    resize();
    if (active) raf = window.requestAnimationFrame(frame);
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("pointermove", pointer, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    media.addEventListener("change", motionPreference);
    return () => {
      active = false;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("pointermove", pointer);
      document.removeEventListener("visibilitychange", visibility);
      media.removeEventListener("change", motionPreference);
    };
  }, []);

  return (
    <div className="atmospheric-field" aria-hidden="true">
      <canvas ref={canvasRef} className="atmospheric-canvas" />
      <div className="atmospheric-readable-mask" />
    </div>
  );
}
