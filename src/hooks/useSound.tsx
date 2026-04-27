// Premium WebAudio sound effects for ProEdge — synthesized, no external assets.
// Sounds respect a global mute toggle (localStorage).

type SoundName =
  | "click" | "tap" | "hover"
  | "success" | "error" | "warning"
  | "send" | "receive" | "notify" | "pop"
  | "open" | "close" | "swipe"
  | "coin" | "level-up" | "achievement"
  | "transition" | "type" | "chime";

const KEY = "proedge_sound_muted";

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

const tone = (
  freq: number,
  dur = 0.12,
  type: OscillatorType = "sine",
  vol = 0.06,
  when = 0,
  freqEnd?: number,
) => {
  const c = getCtx(); if (!c) return;
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (freqEnd !== undefined) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + dur + 0.02);
};

const noiseBurst = (dur = 0.08, vol = 0.03, when = 0, hp = 1000) => {
  const c = getCtx(); if (!c) return;
  const t = c.currentTime + when;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hp;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter); filter.connect(g); g.connect(c.destination);
  src.start(t);
};

export const playSound = (name: SoundName) => {
  if (isMuted()) return;
  try {
    switch (name) {
      case "click": tone(880, 0.04, "triangle", 0.035); break;
      case "tap":   tone(1100, 0.03, "sine", 0.04); break;
      case "hover": tone(1400, 0.025, "sine", 0.02); break;

      case "pop":   tone(880, 0.06, "sine", 0.05, 0, 1320); break;
      case "send":
        tone(520, 0.05, "sine", 0.05, 0, 760);
        tone(880, 0.07, "sine", 0.04, 0.04);
        break;
      case "receive":
        tone(660, 0.06, "sine", 0.045, 0, 880);
        tone(440, 0.08, "triangle", 0.035, 0.04);
        break;
      case "notify":
        tone(700, 0.08, "sine", 0.05, 0);
        tone(1040, 0.1, "sine", 0.05, 0.07);
        tone(1320, 0.12, "sine", 0.04, 0.14);
        break;
      case "chime":
        tone(1046, 0.18, "sine", 0.04, 0);
        tone(1318, 0.18, "sine", 0.04, 0.06);
        tone(1568, 0.22, "sine", 0.04, 0.12);
        break;

      case "success":
        tone(523.25, 0.09, "triangle", 0.05);
        tone(659.25, 0.09, "triangle", 0.05, 0.08);
        tone(783.99, 0.16, "triangle", 0.06, 0.16);
        tone(1046.5, 0.22, "triangle", 0.05, 0.24);
        break;
      case "error":
        tone(330, 0.12, "square", 0.04, 0, 220);
        tone(180, 0.2, "sawtooth", 0.05, 0.08);
        break;
      case "warning":
        tone(880, 0.08, "square", 0.04);
        tone(880, 0.08, "square", 0.04, 0.14);
        break;

      case "open":
        tone(440, 0.12, "sine", 0.04, 0, 880);
        noiseBurst(0.08, 0.02, 0, 2000);
        break;
      case "close":
        tone(880, 0.12, "sine", 0.04, 0, 440);
        break;
      case "swipe":
        noiseBurst(0.15, 0.03, 0, 800);
        tone(660, 0.1, "sine", 0.025, 0, 330);
        break;

      case "coin":
        tone(987.77, 0.08, "square", 0.04);
        tone(1318.51, 0.18, "square", 0.04, 0.06);
        break;
      case "level-up":
        tone(523.25, 0.08, "triangle", 0.05);
        tone(659.25, 0.08, "triangle", 0.05, 0.08);
        tone(783.99, 0.08, "triangle", 0.05, 0.16);
        tone(1046.5, 0.18, "triangle", 0.06, 0.24);
        tone(1318.51, 0.25, "triangle", 0.05, 0.36);
        break;
      case "achievement":
        tone(523.25, 0.1, "sine", 0.05);
        tone(783.99, 0.1, "sine", 0.05, 0.08);
        tone(1046.5, 0.2, "sine", 0.06, 0.16);
        tone(1568, 0.3, "sine", 0.05, 0.28);
        noiseBurst(0.3, 0.015, 0.16, 4000);
        break;

      case "transition":
        tone(220, 0.2, "sine", 0.03, 0, 880);
        break;
      case "type":
        tone(2000 + Math.random() * 400, 0.015, "square", 0.015);
        break;
    }
  } catch {}
};

export const useSound = () => ({ play: playSound, isMuted, setMuted });
