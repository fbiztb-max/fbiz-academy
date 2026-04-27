import { useEffect, useRef } from "react";

/**
 * AmbientBackground — premium animated visual layer
 * - Animated mesh gradient blobs
 * - Cursor-follow spotlight (desktop only)
 * - Subtle floating gold particles
 * Performance: pointer events disabled, fixed positioning, respects reduced motion.
 */
export default function AmbientBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return; // skip on mobile/touch

    let raf = 0;
    const handler = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        el.style.setProperty("--mx", `${x}%`);
        el.style.setProperty("--my", `${y}%`);
      });
    };
    window.addEventListener("pointermove", handler, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", handler);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{
        backgroundImage: `
          radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), hsl(var(--primary) / 0.08), transparent 50%),
          radial-gradient(at 15% 10%, hsl(var(--primary) / 0.10) 0px, transparent 45%),
          radial-gradient(at 85% 5%, hsl(var(--primary-glow) / 0.08) 0px, transparent 45%),
          radial-gradient(at 5% 95%, hsl(var(--primary) / 0.07) 0px, transparent 45%),
          radial-gradient(at 95% 90%, hsl(var(--primary) / 0.09) 0px, transparent 45%)
        `,
      }}
    >
      {/* Floating soft orbs */}
      <div
        className="absolute -top-40 -right-40 h-[420px] w-[420px] rounded-full blur-3xl opacity-40 animate-float-soft"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.5), transparent 70%)" }}
      />
      <div
        className="absolute -bottom-40 -left-40 h-[480px] w-[480px] rounded-full blur-3xl opacity-30 animate-float-soft"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary-glow) / 0.4), transparent 70%)",
          animationDelay: "2s",
        }}
      />
      <div
        className="absolute top-1/2 left-1/3 h-[300px] w-[300px] rounded-full blur-3xl opacity-20 animate-float-soft"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.35), transparent 70%)",
          animationDelay: "1s",
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
