"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "@phosphor-icons/react";

/**
 * A real-time ambient scene, intentionally rendered with the Canvas 2D API
 * rather than a video or a static gradient. Perspective particles, linked
 * constellations, animated wave-grid and moving orbital paths respond to
 * pointer and scroll depth. No third-party shaders or external services.
 */
type Particle = {
  x: number;
  y: number;
  z: number;
  phase: number;
  speed: number;
  radius: number;
};

function makeParticles(width: number, height: number): Particle[] {
  const count = Math.min(165, Math.max(85, Math.floor((width * height) / 11500)));
  return Array.from({ length: count }, (_, index) => ({
    x: (Math.random() - 0.5) * width * 1.45,
    y: (Math.random() - 0.5) * height * 1.25,
    z: 0.15 + Math.random() * 0.85,
    phase: (index * 2.4 + Math.random() * 6) % (Math.PI * 2),
    speed: 0.25 + Math.random() * 0.65,
    radius: 0.7 + Math.random() * 1.6
  }));
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

  // Moving celestial rings: elliptical paths with varying axial angles.
  ctx.save();
  ctx.translate(centerX, centerY - 22);
  for (let ring = 0; ring < 4; ring++) {
    ctx.save();
    ctx.rotate(-0.38 + ring * 0.48 + Math.sin(time * 0.12 + ring) * 0.12);
    ctx.beginPath();
    ctx.ellipse(0, 0, 150 + ring * 64, 61 + ring * 33, 0, 0, Math.PI * 2);
    ctx.strokeStyle = ring % 2 === 0 ? "rgba(129,252,222,0.22)" : "rgba(137,175,255,0.18)";
    ctx.lineWidth = 0.9 + (ring === 0 ? 0.5 : 0);
    ctx.setLineDash(ring === 2 ? [5, 8] : []);
    ctx.stroke();
    ctx.setLineDash([]);
    const progress = time * (0.21 + ring * 0.035) + ring * 1.8;
    const beadX = Math.cos(progress) * (150 + ring * 64);
    const beadY = Math.sin(progress) * (61 + ring * 33);
    ctx.beginPath();
    ctx.arc(beadX, beadY, ring === 0 ? 3.7 : 2.5, 0, Math.PI * 2);
    ctx.fillStyle = ring % 2 === 0 ? "rgba(162,255,228,0.93)" : "rgba(160,185,255,0.83)";
    ctx.shadowBlur = 19;
    ctx.shadowColor = ctx.fillStyle as string;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  ctx.restore();

  // Perspective floor: rows drift like an animated, floating topography.
  const horizon = height * 0.54;
  const baseY = height * 1.12;
  const lines = 27;
  const columns = Math.min(46, Math.max(28, Math.floor(width / 34)));
  ctx.save();
  for (let row = 0; row <= lines; row++) {
    const ratio = row / lines;
    const depth = Math.pow(ratio, 1.8);
    const y = horizon + (baseY - horizon) * depth;
    ctx.beginPath();
    for (let col = 0; col <= columns; col++) {
      const relX = col / columns;
      const horizontal = (relX - 0.5) * (width * (0.9 + depth * 1.3));
      const x = width * 0.54 + horizontal + px * 28 * depth;
      const wave = (Math.sin(relX * 11 + time * 0.55 + ratio * 10) * 9 +
                    Math.sin(relX * 23 - time * 0.4) * 3.5) * depth;
      if (col === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.strokeStyle = "rgba(92,228,217," + (0.05 + depth * 0.18) + ")";
    ctx.lineWidth = 0.75 + depth * 0.5;
    ctx.stroke();
  }
  for (let col = 0; col <= columns; col += 2) {
    ctx.beginPath();
    for (let row = 0; row <= lines; row++) {
      const ratio = row / lines;
      const depth = Math.pow(ratio, 1.8);
      const relX = col / columns;
      const x = width * 0.54 + (relX - 0.5) * (width * (0.9 + depth * 1.3)) + px * 28 * depth;
      const y = horizon + (baseY - horizon) * depth +
        (Math.sin(relX * 11 + time * 0.55 + ratio * 10) * 9 +
          Math.sin(relX * 23 - time * 0.4) * 3.5) * depth;
      if (row === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(105,169,248,0.10)";
    ctx.lineWidth = 0.75;
    ctx.stroke();
  }
  ctx.restore();

  // Near-field particle network. Project by depth and connect spatial neighbors.
  const projected: { x: number; y: number; a: number; r: number }[] = [];
  for (const particle of particles) {
    const speed = time * particle.speed;
    const depth = (particle.z + speed * 0.024) % 1;
    const perspective = 0.33 + Math.pow(depth, 1.6) * 1.14;
    const x = centerX + particle.x * perspective * 0.62 + px * 24 * depth;
    const y = centerY + particle.y * perspective * 0.68 + Math.sin(speed + particle.phase) * 9;
    const intensity = 0.3 + Math.sin(time * 0.9 + particle.phase) * 0.16;
    projected.push({ x, y, a: intensity + depth * 0.35, r: particle.radius * (0.55 + depth) });
  }
  ctx.save();
  const maxDistance = Math.min(150, width * 0.14);
  for (let a = 0; a < projected.length; a++) {
    const p = projected[a];
    if (p.x < -10 || p.x > width + 10 || p.y < -10 || p.y > height + 10) continue;
    // Limit neighbors for predictable ~30 fps performance on mid-range devices.
    for (let b = a + 1, links = 0; b < projected.length && links < 3; b++) {
      const q = projected[b];
      const dx = p.x - q.x, dy = p.y - q.y;
      if (Math.abs(dx) > maxDistance || Math.abs(dy) > maxDistance) continue;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxDistance) continue;
      const alpha = (1 - dist / maxDistance) * 0.23 * Math.min(p.a, q.a);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.strokeStyle = "rgba(130,239,238," + alpha.toFixed(3) + ")";
      ctx.lineWidth = 0.75;
      ctx.stroke();
      links++;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(181,249,241," + Math.min(0.9, p.a).toFixed(3) + ")";
    ctx.fill();
    if (p.r > 2) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(109,227,216,0.045)";
      ctx.fill();
    }
  }
  ctx.restore();
}

export function AtmosphericField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const [paused, setPaused] = useState(false);

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
    let active = !paused && !initialReducedMotion;

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
      active = !paused && !media.matches;
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
  }, [paused]);

  return (
    <>
      <div className="atmospheric-field" aria-hidden="true">
        <canvas ref={canvasRef} className="atmospheric-canvas" />
        <div className="atmospheric-readable-mask" />
      </div>
      <button
        className="motion-toggle"
        type="button"
        aria-label={paused ? "Ativar animações de fundo" : "Pausar animações de fundo"}
        aria-pressed={paused}
        onClick={() => setPaused(value => !value)}
      >
        {paused ? <Play size={17} weight="fill" /> : <Pause size={17} weight="fill" />}
        <span>{paused ? "Ativar fundo" : "Pausar fundo"}</span>
      </button>
    </>
  );
}
