// Lightweight WebAudio sound effects — no external assets, near-zero overhead.
// Sounds are synthesized on demand and respect a global mute toggle (localStorage).

type SoundName = "click" | "success" | "error" | "send" | "notify" | "pop";

const KEY = "fbiz_sound_muted";

let ctx: AudioContext | null = null;
const getCtx = () => {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
};

export const isMuted = () => {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
};
export const setMuted = (m: boolean) => {
  try { localStorage.setItem(KEY, m ? "1" : "0"); } catch {}
};

const tone = (freq: number, dur = 0.12, type: OscillatorType = "sine", vol = 0.06, when = 0) => {
  const c = getCtx(); if (!c) return;
  const t = c.currentTime + when;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + dur + 0.02);
};

export const playSound = (name: SoundName) => {
  if (isMuted()) return;
  try {
    switch (name) {
      case "click": tone(660, 0.05, "triangle", 0.04); break;
      case "pop":   tone(880, 0.07, "sine", 0.05); break;
      case "send":  tone(520, 0.06, "sine", 0.05); tone(780, 0.08, "sine", 0.04, 0.05); break;
      case "notify":tone(700, 0.1, "sine", 0.05); tone(1040, 0.12, "sine", 0.05, 0.08); break;
      case "success":
        tone(523.25, 0.1, "triangle", 0.05);
        tone(659.25, 0.1, "triangle", 0.05, 0.1);
        tone(783.99, 0.18, "triangle", 0.06, 0.2);
        break;
      case "error":
        tone(220, 0.18, "sawtooth", 0.05);
        tone(180, 0.22, "sawtooth", 0.05, 0.1);
        break;
    }
  } catch {}
};

export const useSound = () => ({ play: playSound, isMuted, setMuted });
