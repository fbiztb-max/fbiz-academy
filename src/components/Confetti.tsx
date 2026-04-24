import { useEffect, useRef } from "react";

interface Props { trigger: number | boolean; }

// Tiny canvas-based gold confetti — runs once per trigger change, then stops.
export default function Confetti({ trigger }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;

    const colors = ["#D4AF37", "#F1C75B", "#FFFFFF", "#0B1F3A"];
    const N = 90;
    const parts = Array.from({ length: N }).map(() => ({
      x: Math.random() * W,
      y: -20 - Math.random() * H * 0.3,
      r: 4 + Math.random() * 5,
      vx: -2 + Math.random() * 4,
      vy: 2 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: -0.2 + Math.random() * 0.4,
      c: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
    }));

    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const elapsed = t - start;
      ctx.clearRect(0, 0, W, H);
      parts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.rot += p.vr; p.life++;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c; ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r * 0.5);
        ctx.restore();
      });
      if (elapsed < 2200) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [trigger]);

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-[60]" />;
}
