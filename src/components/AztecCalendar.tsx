import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./AztecCalendar.css";

// ── Aztec-inspired SVG symbol paths ──────────────────────────────────
const AZTEC_SYMBOLS = {
  sun: "M0,-12 L3,-4 L12,-4 L5,2 L7,11 L0,6 L-7,11 L-5,2 L-12,-4 L-3,-4 Z",
  jaguar:
    "M-8,-6 Q-4,-10 0,-6 Q4,-10 8,-6 L10,0 Q8,6 4,8 L0,10 L-4,8 Q-8,6 -10,0 Z",
  eagle:
    "M0,-10 L4,-6 L10,-8 L8,-2 L12,2 L6,4 L4,10 L0,6 L-4,10 L-6,4 L-12,2 L-8,-2 L-10,-8 L-4,-6 Z",
  serpent:
    "M-10,0 Q-6,-8 0,-4 Q6,-8 10,0 Q6,8 0,4 Q-6,8 -10,0 Z",
  skull:
    "M-6,-8 Q0,-12 6,-8 L8,-2 Q8,4 4,8 L0,10 L-4,8 Q-8,4 -8,-2 Z",
  wind:
    "M-8,-4 Q-4,-10 4,-6 Q10,-2 6,4 Q2,10 -4,6 Q-10,2 -8,-4 Z",
  rain:
    "M-4,-10 L0,-6 L4,-10 L4,-4 L8,0 L4,4 L4,10 L0,6 L-4,10 L-4,4 L-8,0 L-4,-4 Z",
  earth:
    "M-8,-8 L8,-8 L8,8 L-8,8 Z M-4,-4 L4,-4 L4,4 L-4,4 Z",
  flower:
    "M0,-10 Q5,-5 10,0 Q5,5 0,10 Q-5,5 -10,0 Q-5,-5 0,-10 Z",
  death:
    "M-6,-8 L6,-8 L8,0 L6,8 L-6,8 L-8,0 Z",
  monkey:
    "M0,-10 Q8,-8 10,-2 Q10,4 6,8 L0,10 L-6,8 Q-10,4 -10,-2 Q-8,-8 0,-10 Z M-3,-4 L-3,-2 M3,-4 L3,-2",
  lizard:
    "M0,-12 L4,-4 L8,0 L4,4 L6,10 L0,6 L-6,10 L-4,4 L-8,0 L-4,-4 Z",
  house:
    "M0,-10 L10,-2 L10,8 L-10,8 L-10,-2 Z",
  reed:
    "M-2,-12 L2,-12 L2,12 L-2,12 Z M-6,-6 L6,-6 M-6,0 L6,0 M-6,6 L6,6",
  rabbit:
    "M-4,-10 L-2,-4 L-6,0 L0,2 L6,0 L2,-4 L4,-10 Q2,-8 0,-8 Q-2,-8 -4,-10 Z M0,2 L0,10",
  water:
    "M-10,0 Q-5,-6 0,0 Q5,6 10,0 Q5,-6 0,0 Q-5,6 -10,0",
  dog: "M-6,-8 L-2,-12 L0,-6 L2,-12 L6,-8 L8,-2 Q8,6 0,10 Q-8,6 -8,-2 Z",
  vulture:
    "M0,-10 L6,-4 L12,0 L6,2 L8,10 L0,4 L-8,10 L-6,2 L-12,0 L-6,-4 Z",
  movement:
    "M-8,-8 L0,-4 L8,-8 L4,0 L8,8 L0,4 L-8,8 L-4,0 Z",
  flint:
    "M0,-12 L6,-4 L4,4 L0,12 L-4,4 L-6,-4 Z",
};

const SYMBOL_KEYS = Object.keys(AZTEC_SYMBOLS) as (keyof typeof AZTEC_SYMBOLS)[];
const SYMBOL_NAMES: Record<string, string> = {
  sun: "Tonatiuh",
  jaguar: "Ocelotl",
  eagle: "Cuauhtli",
  serpent: "Coatl",
  skull: "Miquiztli",
  wind: "Ehecatl",
  rain: "Quiahuitl",
  earth: "Tlalli",
  flower: "Xochitl",
  death: "Mictlan",
  monkey: "Ozomatli",
  lizard: "Cuetzpalin",
  house: "Calli",
  reed: "Acatl",
  rabbit: "Tochtli",
  water: "Atl",
  dog: "Itzcuintli",
  vulture: "Cozcacuauhtli",
  movement: "Ollin",
  flint: "Tecpatl",
};

// Pastel matte stone palette
const RING_COLORS = [
  { base: "#8E7F72", groove: "#5A4D42", highlight: "#C4B5A6", accent: "#D4C5B5", pastel: "#C9A9A0" },
  { base: "#7A8478", groove: "#4A5248", highlight: "#B0BAA8", accent: "#C0CAB8", pastel: "#A3B8A0" },
  { base: "#847B8E", groove: "#524A5A", highlight: "#B4ABB8", accent: "#C8BFD0", pastel: "#B8A8C8" },
  { base: "#8E8478", groove: "#5A5048", highlight: "#C0B4A8", accent: "#D0C4B8", pastel: "#C8B89C" },
  { base: "#78848E", groove: "#485058", highlight: "#A8B4BE", accent: "#B8C4CE", pastel: "#9CB8C8" },
  { base: "#8E7E7A", groove: "#5A4C48", highlight: "#C0AEA8", accent: "#D0BEB8", pastel: "#C8A8A0" },
  { base: "#7E8A78", groove: "#4C5648", highlight: "#AEB8A8", accent: "#BEC8B8", pastel: "#A8C0A0" },
  { base: "#88807C", groove: "#565048", highlight: "#B8B0AA", accent: "#C8C0BA", pastel: "#B8A898" },
];

const CORE_COLOR = { base: "#3D3229", highlight: "#C4A882", accent: "#9C8B7A" };

// ── Helpers ──────────────────────────────────────────────────────────
const CENTER = 500;
const RING_GAP = 5;
const SYMBOL_COUNTS = [20, 18, 16, 14, 12, 10, 8, 6];

function getRingRadii(ringIndex: number) {
  const outerMax = 480;
  const coreRadius = 70;
  const usable = outerMax - coreRadius;
  const ringWidth = (usable - RING_GAP * 8) / 8;
  const outer = outerMax - ringIndex * (ringWidth + RING_GAP);
  const inner = outer - ringWidth;
  return { outer, inner, mid: (outer + inner) / 2, width: ringWidth };
}

function getSymbolsForRing(ringIndex: number): (keyof typeof AZTEC_SYMBOLS)[] {
  const count = SYMBOL_COUNTS[ringIndex];
  const symbols: (keyof typeof AZTEC_SYMBOLS)[] = [];
  for (let i = 0; i < count; i++) {
    symbols.push(SYMBOL_KEYS[i % SYMBOL_KEYS.length]);
  }
  return symbols;
}

// ── Day/Night detection ──────────────────────────────────────────────
function getTimeOfDay(): "day" | "night" {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 20 ? "day" : "night";
}

// ── Tonalpohualli (Aztec day) calculator ─────────────────────────────
const TONALPOHUALLI_SIGNS = [
  "Cipactli", "Ehecatl", "Calli", "Cuetzpalin", "Coatl",
  "Miquiztli", "Mazatl", "Tochtli", "Atl", "Itzcuintli",
  "Ozomatli", "Malinalli", "Acatl", "Ocelotl", "Cuauhtli",
  "Cozcacuauhtli", "Ollin", "Tecpatl", "Quiahuitl", "Xochitl",
];

const TONALPOHUALLI_SIGN_MEANINGS: Record<string, string> = {
  Cipactli: "Crocodile", Ehecatl: "Wind", Calli: "House", Cuetzpalin: "Lizard",
  Coatl: "Serpent", Miquiztli: "Death", Mazatl: "Deer", Tochtli: "Rabbit",
  Atl: "Water", Itzcuintli: "Dog", Ozomatli: "Monkey", Malinalli: "Grass",
  Acatl: "Reed", Ocelotl: "Jaguar", Cuauhtli: "Eagle", Cozcacuauhtli: "Vulture",
  Ollin: "Movement", Tecpatl: "Flint", Quiahuitl: "Rain", Xochitl: "Flower",
};

function getTonalpohualliDay(): { number: number; sign: string; meaning: string } {
  // Reference: June 16, 2024 = 1 Cipactli (a known correlation)
  const ref = new Date(2024, 5, 16);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - ref.getTime()) / 86400000);
  const dayNum = (((diffDays % 13) + 13) % 13) + 1;
  const signIdx = ((diffDays % 20) + 20) % 20;
  const sign = TONALPOHUALLI_SIGNS[signIdx];
  return { number: dayNum, sign, meaning: TONALPOHUALLI_SIGN_MEANINGS[sign] };
}

// ── Prophecy Generator ───────────────────────────────────────────────
const PROPHECIES_GENERAL = [
  "The Feathered Serpent watches your path — a door long sealed shall open before dusk.",
  "Obsidian mirrors reflect what you refuse to see. Today, look closer.",
  "The Jaguar drinks from the river of stars tonight. Follow where the water leads.",
  "What was planted in silence now breaks the stone. Your patience bears sacred fruit.",
  "The wind carries a name you have forgotten. Listen before the sun touches the earth.",
  "Thirteen steps remain between you and what you seek. The first begins now.",
  "A shadow you cast will shelter someone today. Power lies in what you give away.",
  "The Eagle and the Serpent meet at the crossroads. Choose neither — walk the third path.",
  "Rain falls upward in the realm of dreams. What seems wrong is your truest direction.",
  "The skull smiles because it knows: endings are seeds dressed in darkness.",
  "Fire sleeps in the flint of your spoken word. Speak carefully — or speak with purpose.",
  "The old calendar crumbles, but the count never stops. You are not late. You are aligned.",
  "Maize grows even in forgotten fields. Abundance finds you when you stop chasing.",
  "The Monkey God laughs at your seriousness. Play today and wisdom will follow.",
  "The temple stairs are steep but the view changes everything. Keep climbing.",
  "Copal smoke carries your intention to the unseen. What you wished for at dawn is heard.",
];

const PROPHECIES_LOVE = [
  "Two hearts beat in the rhythm of the Fifth Sun. Love reveals itself at twilight.",
  "The Flower Goddess weaves your thread with another's. A meeting is destined, not accidental.",
  "Xochipilli dances in your chest. Open your arms — the one you seek also searches.",
  "The Serpent of desire coils around a golden truth. Passion and patience share the same root.",
  "A jade pendant falls from the moon. Someone carries your name in their secret prayers.",
  "Twin flames carved in obsidian — what mirrors you will complete you.",
  "The hummingbird carries pollen between two souls. Sweetness comes from connection, not conquest.",
  "Tlazolteotl purifies old wounds. Forgive the past lover to welcome the next.",
];

const PROPHECIES_WEALTH = [
  "A jade stone rolls toward you from the north. Wealth comes in a form you won't expect.",
  "The merchant god counts cacao beans in your favor. Trade wisely before the sun sets.",
  "Gold dust settles on the hands that build. Create something today — payment follows.",
  "The quetzal feather is worth more than gold. What you know is your greatest currency.",
  "Thirteen rivers of abundance converge where you stand. Stop looking elsewhere.",
  "The obsidian blade cuts through scarcity. Your fear of lack is the only wall.",
  "Cocoa beans multiply in the temple storehouse. Invest your energy, not just your coins.",
  "The rain brings jade, the sun brings gold. Both are coming — prepare your vessel.",
];

const PROPHECIES_WISDOM = [
  "The pyramid's shadow points to buried knowledge. Follow what frightens you most — truth waits.",
  "An ancestor places a codex on your threshold. Read what life is teaching you.",
  "The owl of Mictlan sees in darkness. Your confusion is a doorway, not a wall.",
  "Seven layers of sky hold seven answers. Meditate — the first layer opens today.",
  "The scribe god sharpens his brush. Write down what comes to mind before noon.",
  "Quetzalcoatl's breath carries ancient knowing. Be still — wisdom speaks in silence.",
  "The calendar stone remembers every cycle. What you learn today, you've known before.",
  "Night birds carry messages between worlds. Pay attention to what visits your dreams.",
];

const ALL_PROPHECY_CATEGORIES = [
  { name: "The Calendar Speaks", prophecies: PROPHECIES_GENERAL },
  { name: "Heart of Xochipilli", prophecies: PROPHECIES_LOVE },
  { name: "Treasury of Quetzalcoatl", prophecies: PROPHECIES_WEALTH },
  { name: "Wisdom of the Elders", prophecies: PROPHECIES_WISDOM },
];

function getBrowserSeed(): number {
  const raw = [
    screen.width, screen.height, screen.colorDepth,
    new Date().getTimezoneOffset(), navigator.language,
    navigator.platform, navigator.hardwareConcurrency || 0,
  ].join("|");
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getDailyProphecy(comboIndex: number): { label: string; text: string } {
  const now = new Date();
  const dayStamp = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const seed = (getBrowserSeed() * 31 + dayStamp * 7 + comboIndex * 13) >>> 0;
  const cat = ALL_PROPHECY_CATEGORIES[comboIndex % ALL_PROPHECY_CATEGORIES.length];
  const index = seed % cat.prophecies.length;
  return { label: cat.name, text: cat.prophecies[index] };
}

// ── Secret Combinations ─────────────────────────────────────────────
function generateSecretCombinations(seed: number) {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const combos: number[][] = [];
  for (let c = 0; c < 4; c++) {
    const combo: number[] = [];
    for (let r = 0; r < 8; r++) {
      combo.push(Math.floor(rand() * SYMBOL_COUNTS[r]));
    }
    combos.push(combo);
  }
  return combos;
}

function getRingAlignmentError(rotation: number, ringIndex: number, targetSymbol: number): number {
  const count = SYMBOL_COUNTS[ringIndex];
  const symbolAngle = (360 / count) * targetSymbol;
  const targetRotation = -symbolAngle;
  const diff = ((rotation - targetRotation) % 360 + 540) % 360 - 180;
  return Math.abs(diff);
}

// ── Particle System ──────────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: "spark" | "dust" | "lock" | "crack";
}

let particleIdCounter = 0;

function createRingParticles(ringIndex: number, rotation: number, speed: number): Particle[] {
  if (Math.abs(speed) < 0.3) return [];
  const { mid } = getRingRadii(ringIndex);
  const colors = RING_COLORS[ringIndex];
  const count = Math.min(3, Math.floor(Math.abs(speed) * 2));
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = ((rotation + Math.random() * 360) * Math.PI) / 180;
    const r = mid + (Math.random() - 0.5) * 20;
    particles.push({
      id: particleIdCounter++,
      x: CENTER + Math.cos(angle) * r,
      y: CENTER + Math.sin(angle) * r,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2 - 0.5,
      life: 1,
      maxLife: 30 + Math.random() * 30,
      color: Math.random() > 0.5 ? colors.pastel : colors.highlight,
      size: 1.5 + Math.random() * 2,
      type: "dust",
    });
  }
  return particles;
}

function createLockParticles(ringIndex: number): Particle[] {
  const { mid } = getRingRadii(ringIndex);
  const colors = RING_COLORS[ringIndex];
  const particles: Particle[] = [];
  for (let i = 0; i < 24; i++) {
    const angle = (Math.PI * 2 * i) / 24 + Math.random() * 0.3;
    const r = mid;
    particles.push({
      id: particleIdCounter++,
      x: CENTER + Math.cos(angle) * r,
      y: CENTER + Math.sin(angle) * r,
      vx: Math.cos(angle) * (2 + Math.random() * 3),
      vy: Math.sin(angle) * (2 + Math.random() * 3),
      life: 1,
      maxLife: 40 + Math.random() * 40,
      color: colors.pastel,
      size: 2 + Math.random() * 3,
      type: "lock",
    });
  }
  return particles;
}

function createCrackParticles(): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 80; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8;
    particles.push({
      id: particleIdCounter++,
      x: CENTER,
      y: CENTER,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 60 + Math.random() * 60,
      color: Math.random() > 0.3 ? "#D4C5B5" : "#C4A882",
      size: 2 + Math.random() * 4,
      type: "crack",
    });
  }
  return particles;
}

// ── Audio System ─────────────────────────────────────────────────────
function playDeepClick() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(55, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(120, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
    gain2.gain.setValueAtTime(0.4, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    const bufferSize = ctx.sampleRate * 0.15;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    osc.connect(gain).connect(filter).connect(ctx.destination);
    osc2.connect(gain2).connect(filter);
    noise.connect(noiseGain).connect(filter);
    osc.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    noise.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
    osc2.stop(ctx.currentTime + 0.4);
    noise.stop(ctx.currentTime + 0.15);
    setTimeout(() => ctx.close(), 1500);
  } catch { /* Audio not available */ }
}

function playLockClick() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(150, ctx.currentTime);
    osc.connect(gain).connect(filter).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
    setTimeout(() => ctx.close(), 500);
  } catch { /* Audio not available */ }
}

// Per-ring rotation sound with different tones
const ringAudioCtxRef: { current: AudioContext | null } = { current: null };
const ringOscillators: { current: Map<number, { osc: OscillatorNode; gain: GainNode; active: boolean }> } = { current: new Map() };

const RING_TONES = [65, 73, 82, 98, 110, 131, 147, 165]; // bass to treble

function playRingTone(ringIndex: number, speed: number) {
  try {
    if (!ringAudioCtxRef.current || ringAudioCtxRef.current.state === "closed") {
      ringAudioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = ringAudioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    const absSpeed = Math.abs(speed);
    const existing = ringOscillators.current.get(ringIndex);

    if (absSpeed < 0.5) {
      if (existing?.active) {
        existing.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        existing.active = false;
      }
      return;
    }

    const vol = Math.min(0.06, absSpeed * 0.01);

    if (existing?.active) {
      existing.gain.gain.setTargetAtTime(vol, ctx.currentTime, 0.05);
      existing.osc.frequency.setTargetAtTime(
        RING_TONES[ringIndex] + absSpeed * 5,
        ctx.currentTime, 0.05
      );
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(300, ctx.currentTime);
    osc.type = "sine";
    osc.frequency.setValueAtTime(RING_TONES[ringIndex], ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    osc.connect(gain).connect(filter).connect(ctx.destination);
    osc.start();
    ringOscillators.current.set(ringIndex, { osc, gain, active: true });
  } catch { /* Audio not available */ }
}

// Ambient Aztec music generator
class AmbientMusic {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private oscillators: OscillatorNode[] = [];
  private timeoutIds: ReturnType<typeof setTimeout>[] = [];
  private windPlaying = false;
  private noiseBuffer: AudioBuffer | null = null;

  start() {
    if (this.isPlaying) return;
    try {
      // Clean up any previous context fully before creating a new one
      this.cleanup();

      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 3);
      this.masterGain.connect(this.ctx.destination);
      this.isPlaying = true;

      // Pre-create noise buffer once (avoids repeated allocation)
      const bufferSize = this.ctx.sampleRate * 4;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }

      // Deep drone pad (continuous, non-overlapping)
      this.createDrone(55, "sine", 0.08);
      this.createDrone(82.5, "sine", 0.04);
      this.createDrone(110, "triangle", 0.025);

      // Schedule non-overlapping one-shot events via setTimeout chains
      this.scheduleWind();
      this.scheduleMelody();
      this.scheduleHeartbeat();
    } catch { /* Audio not available */ }
  }

  private createDrone(freq: number, type: OscillatorType, vol: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);

    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.1 + Math.random() * 0.15, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(vol * 0.3, this.ctx.currentTime);

    lfo.connect(lfoGain).connect(gain.gain);
    osc.connect(gain).connect(this.masterGain!);
    osc.start();
    lfo.start();
    this.oscillators.push(osc, lfo);
  }

  private scheduleWind() {
    if (!this.isPlaying || !this.ctx || !this.masterGain || !this.noiseBuffer) return;

    // Don't overlap wind sounds — wait if one is still playing
    if (this.windPlaying) {
      const id = setTimeout(() => this.scheduleWind(), 2000);
      this.timeoutIds.push(id);
      return;
    }

    this.windPlaying = true;
    const duration = 4;

    try {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(200 + Math.random() * 400, this.ctx.currentTime);
      filter.Q.setValueAtTime(2, this.ctx.currentTime);
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.03, this.ctx.currentTime + 2);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
      noise.connect(filter).connect(gain).connect(this.masterGain!);
      noise.start();
      noise.stop(this.ctx.currentTime + duration);
      noise.onended = () => { this.windPlaying = false; };
    } catch {
      this.windPlaying = false;
    }

    // Schedule next wind AFTER this one finishes + random gap
    const nextDelay = (duration + 2 + Math.random() * 4) * 1000;
    const id = setTimeout(() => this.scheduleWind(), nextDelay);
    this.timeoutIds.push(id);
  }

  private scheduleMelody() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    // Aztec pentatonic scale
    const notes = [146.83, 164.81, 174.61, 220, 261.63, 293.66, 329.63];
    const freq = notes[Math.floor(Math.random() * notes.length)];
    const noteDuration = 2 + Math.random() * 2;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = Math.random() > 0.5 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04 + Math.random() * 0.03, this.ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + noteDuration);
      osc.connect(filter).connect(gain).connect(this.masterGain!);
      osc.start();
      osc.stop(this.ctx.currentTime + noteDuration + 0.1);
    } catch { /* */ }

    // Schedule next note AFTER this one ends + random silence gap
    const nextDelay = (noteDuration + 1 + Math.random() * 5) * 1000;
    const id = setTimeout(() => this.scheduleMelody(), nextDelay);
    this.timeoutIds.push(id);
  }

  private scheduleHeartbeat() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(40, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
      osc.connect(gain).connect(this.masterGain!);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    } catch { /* */ }

    // Steady heartbeat every 4-5s
    const id = setTimeout(() => this.scheduleHeartbeat(), 4000 + Math.random() * 1000);
    this.timeoutIds.push(id);
  }

  private cleanup() {
    this.timeoutIds.forEach(clearTimeout);
    this.timeoutIds = [];
    this.oscillators.forEach(o => { try { o.stop(); } catch { /* */ } });
    this.oscillators = [];
    this.windPlaying = false;
    this.noiseBuffer = null;
    try { this.ctx?.close(); } catch { /* */ }
    this.ctx = null;
    this.masterGain = null;
  }

  stop() {
    this.isPlaying = false;
    // Cancel all scheduled events immediately
    this.timeoutIds.forEach(clearTimeout);
    this.timeoutIds = [];

    // Fade out master volume smoothly
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
      } catch { /* */ }
    }

    // Full cleanup after fade-out completes
    setTimeout(() => this.cleanup(), 1200);
  }

  get playing() { return this.isPlaying; }
}

const ambientMusic = new AmbientMusic();

// ── Ring Component ───────────────────────────────────────────────────
interface RingProps {
  index: number;
  rotation: number;
  onRotate: (index: number, delta: number) => void;
  activeSymbol: { ring: number; symbol: number } | null;
  onSymbolClick: (ring: number, symbol: number) => void;
  glowIntensity: number;
  unlocked: boolean;
  zoomed: boolean;
  onDoubleClick: (index: number) => void;
  hintDirection: number | null; // -1 = CCW, 1 = CW, null = no hint
  trail: number[]; // last few rotation deltas for trail effect
}

function Ring({ index, rotation, onRotate, activeSymbol, onSymbolClick, glowIntensity, unlocked, zoomed, onDoubleClick, hintDirection, trail }: RingProps) {
  const { outer, inner, mid, width } = getRingRadii(index);
  const colors = RING_COLORS[index];
  const symbols = getSymbolsForRing(index);
  const isDragging = useRef(false);
  const lastAngle = useRef(0);
  const ringRef = useRef<SVGGElement>(null);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const momentumRef = useRef<number>(0);

  const getAngle = useCallback(
    (clientX: number, clientY: number) => {
      if (!ringRef.current) return 0;
      const svg = ringRef.current.closest("svg");
      if (!svg) return 0;
      const rect = svg.getBoundingClientRect();
      const svgX = ((clientX - rect.left) / rect.width) * 1000;
      const svgY = ((clientY - rect.top) / rect.height) * 1000;
      return (Math.atan2(svgY - CENTER, svgX - CENTER) * 180) / Math.PI;
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      isDragging.current = true;
      velocityRef.current = 0;
      lastTimeRef.current = performance.now();
      lastAngle.current = getAngle(e.clientX, e.clientY);
      (e.target as Element).setPointerCapture(e.pointerId);
      cancelAnimationFrame(momentumRef.current);
    },
    [getAngle]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const now = performance.now();
      const currentAngle = getAngle(e.clientX, e.clientY);
      let delta = currentAngle - lastAngle.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      const dt = now - lastTimeRef.current;
      if (dt > 0) {
        velocityRef.current = delta / dt * 16;
      }
      lastTimeRef.current = now;
      lastAngle.current = currentAngle;
      onRotate(index, delta);
    },
    [getAngle, index, onRotate]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    let vel = velocityRef.current;
    const decay = () => {
      if (Math.abs(vel) < 0.05) return;
      vel *= 0.94;
      onRotate(index, vel);
      momentumRef.current = requestAnimationFrame(decay);
    };
    momentumRef.current = requestAnimationFrame(decay);
  }, [index, onRotate]);

  const handleDblClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick(index);
  }, [index, onDoubleClick]);

  // Trail effect — ghosted arcs behind spinning symbols
  const trailOpacity = Math.min(1, trail.reduce((a, b) => a + Math.abs(b), 0) / 20);

  // Chisel tick marks
  const ticks = symbols.length * 2;
  const tickMarks = Array.from({ length: ticks }).map((_, i) => {
    const angle = (360 / ticks) * i;
    const rad = (angle * Math.PI) / 180;
    const r1 = outer - 1;
    const r2 = outer - 3;
    return (
      <line
        key={`tick-${i}`}
        x1={CENTER + Math.cos(rad) * r1}
        y1={CENTER + Math.sin(rad) * r1}
        x2={CENTER + Math.cos(rad) * r2}
        y2={CENTER + Math.sin(rad) * r2}
        stroke={colors.highlight}
        strokeWidth={0.5}
        opacity={0.3}
      />
    );
  });

  // Divider lines
  const dividers = symbols.map((_, i) => {
    const angle = (360 / symbols.length) * i - 90 + (360 / symbols.length) / 2;
    const rad = (angle * Math.PI) / 180;
    return (
      <line
        key={`div-${i}`}
        x1={CENTER + Math.cos(rad) * (inner + 2)}
        y1={CENTER + Math.sin(rad) * (inner + 2)}
        x2={CENTER + Math.cos(rad) * (outer - 2)}
        y2={CENTER + Math.sin(rad) * (outer - 2)}
        stroke={colors.groove}
        strokeWidth={1.2}
        opacity={0.5}
      />
    );
  });

  const glowColor = colors.pastel;
  const glowOpacity = glowIntensity * 0.6;

  return (
    <g
      ref={ringRef}
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: `${CENTER}px ${CENTER}px`,
        touchAction: "none",
        transition: zoomed ? "transform 0.3s ease" : undefined,
      }}
      onPointerDown={unlocked ? undefined : handlePointerDown}
      onPointerMove={unlocked ? undefined : handlePointerMove}
      onPointerUp={unlocked ? undefined : handlePointerUp}
      onPointerCancel={unlocked ? undefined : handlePointerUp}
      onDoubleClick={handleDblClick}
      className={`aztec-ring ${unlocked ? "ring-unlocked ring-locked" : ""}`}
    >
      {/* Trail ghost effect */}
      {trailOpacity > 0.1 && (
        <circle
          cx={CENTER}
          cy={CENTER}
          r={mid}
          fill="none"
          stroke={colors.pastel}
          strokeWidth={width * 0.8}
          opacity={trailOpacity * 0.08}
          filter="url(#alignGlow)"
        />
      )}

      {/* Glow layer behind ring when aligned */}
      {glowIntensity > 0.1 && (
        <circle
          cx={CENTER}
          cy={CENTER}
          r={mid}
          fill="none"
          stroke={glowColor}
          strokeWidth={width + 6}
          opacity={glowOpacity * 0.3}
          filter="url(#alignGlow)"
        />
      )}

      {/* Ring stone background - outer bevel */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={outer - 0.5}
        fill="none"
        stroke={glowIntensity > 0.5 ? glowColor : colors.highlight}
        strokeWidth={1.5}
        opacity={0.5 + glowIntensity * 0.3}
      />
      {/* Ring stone body */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={mid}
        fill="none"
        stroke={colors.base}
        strokeWidth={width}
        opacity={0.92}
        filter="url(#stoneTexture)"
      />
      {/* Inner bevel */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={inner + 0.5}
        fill="none"
        stroke={colors.groove}
        strokeWidth={1.5}
        opacity={0.6}
      />

      {tickMarks}
      {dividers}

      {/* Hint arrow */}
      {hintDirection !== null && !unlocked && (
        <g className="hint-arrow">
          <path
            d={hintDirection > 0
              ? `M${CENTER},${CENTER - mid - 12} l8,5 l-3,0 a${mid + 7},${mid + 7} 0 0,1 40,15 l0,-3 l5,8 l-8,0 l0,-3 a${mid + 17},${mid + 17} 0 0,0 -40,-15 l-3,0 z`
              : `M${CENTER},${CENTER - mid - 12} l-8,5 l3,0 a${mid + 7},${mid + 7} 0 0,0 -40,15 l0,-3 l-5,8 l8,0 l0,-3 a${mid + 17},${mid + 17} 0 0,1 40,-15 l3,0 z`
            }
            fill={colors.pastel}
            opacity={0.4}
            className="hint-pulse"
          />
        </g>
      )}

      {/* Symbols */}
      {symbols.map((symbolKey, i) => {
        const angle = (360 / symbols.length) * i - 90;
        const rad = (angle * Math.PI) / 180;
        const x = CENTER + Math.cos(rad) * mid;
        const y = CENTER + Math.sin(rad) * mid;
        const isActive = activeSymbol?.ring === index && activeSymbol?.symbol === i;
        const scale = width / 55;
        const symbolFill = unlocked ? colors.pastel : isActive ? colors.accent : colors.highlight;
        const symbolOpacity = unlocked ? 0.9 : isActive ? 0.9 : 0.55;

        return (
          <g
            key={i}
            transform={`translate(${x}, ${y}) rotate(${angle + 90}) scale(${scale})`}
            onClick={(e) => { e.stopPropagation(); onSymbolClick(index, i); }}
            className={`aztec-symbol ${isActive ? "active" : ""}`}
            style={{ cursor: "pointer" }}
          >
            <path d={AZTEC_SYMBOLS[symbolKey]} fill="none" stroke={colors.groove} strokeWidth={3} opacity={0.6} transform="translate(0.8, 0.8)" />
            <path d={AZTEC_SYMBOLS[symbolKey]} fill="none" stroke={unlocked ? colors.pastel : colors.highlight} strokeWidth={1.5} opacity={isActive || unlocked ? 0.8 : 0.35} transform="translate(-0.4, -0.4)" />
            <path d={AZTEC_SYMBOLS[symbolKey]} fill={symbolFill} opacity={symbolOpacity} stroke={colors.groove} strokeWidth={0.8} className="symbol-path" filter={isActive ? "url(#carvedGlow)" : unlocked ? "url(#alignGlow)" : "none"} />
          </g>
        );
      })}
    </g>
  );
}

// ── Core Component ───────────────────────────────────────────────────
function Core({ pulse, unlocked, cracking }: { pulse: boolean; unlocked: boolean; cracking: boolean }) {
  return (
    <g className="aztec-core">
      {unlocked && (
        <circle cx={CENTER} cy={CENTER} r={85} fill="url(#unlockRadial)" opacity={0.7} className="core-unlock-glow" />
      )}

      {/* Crack lines when unlocking */}
      {cracking && (
        <g className="crack-lines">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (Math.PI * 2 * i) / 12;
            const len = 40 + Math.random() * 80;
            return (
              <line
                key={i}
                x1={CENTER}
                y1={CENTER}
                x2={CENTER + Math.cos(angle) * len}
                y2={CENTER + Math.sin(angle) * len}
                stroke="#D4C5B5"
                strokeWidth={1 + Math.random() * 2}
                opacity={0}
                className="crack-line"
                style={{ animationDelay: `${i * 0.05}s` }}
              />
            );
          })}
        </g>
      )}

      <circle cx={CENTER} cy={CENTER} r={68} fill={CORE_COLOR.base} filter="url(#stoneTexture)" stroke={unlocked ? "#D4C5B5" : CORE_COLOR.accent} strokeWidth={unlocked ? 3 : 2} opacity={0.9} />
      <circle cx={CENTER} cy={CENTER} r={60} fill="url(#coreInnerGradient)" stroke={CORE_COLOR.highlight} strokeWidth={2} filter="url(#stoneTexture)" />
      <circle cx={CENTER} cy={CENTER} r={65} fill="none" stroke={CORE_COLOR.accent} strokeWidth={0.8} strokeDasharray="3 5" opacity={0.4} />

      {/* Tonatiuh face */}
      <g transform={`translate(${CENTER}, ${CENTER})`} className="tonatiuh-face">
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (360 / 16) * i;
          const rad = (angle * Math.PI) / 180;
          const isLong = i % 2 === 0;
          return (
            <g key={i}>
              <line x1={Math.cos(rad) * 24 + 0.5} y1={Math.sin(rad) * 24 + 0.5} x2={Math.cos(rad) * (isLong ? 46 : 38) + 0.5} y2={Math.sin(rad) * (isLong ? 46 : 38) + 0.5} stroke={CORE_COLOR.base} strokeWidth={isLong ? 3 : 2} opacity={0.8} />
              <line x1={Math.cos(rad) * 24} y1={Math.sin(rad) * 24} x2={Math.cos(rad) * (isLong ? 46 : 38)} y2={Math.sin(rad) * (isLong ? 46 : 38)} stroke={unlocked ? "#D4C5B5" : CORE_COLOR.highlight} strokeWidth={isLong ? 2 : 1.2} opacity={unlocked ? 0.9 : 0.6} className="sun-ray" />
            </g>
          );
        })}
        <circle r={22} fill={CORE_COLOR.base} stroke={unlocked ? "#D4C5B5" : CORE_COLOR.accent} strokeWidth={1.5} />
        <circle r={21} fill="none" stroke={CORE_COLOR.highlight} strokeWidth={0.5} opacity={0.3} />
        <ellipse cx={-7} cy={-5} rx={4} ry={3.5} fill={CORE_COLOR.base} stroke={CORE_COLOR.highlight} strokeWidth={1} opacity={0.9} />
        <ellipse cx={7} cy={-5} rx={4} ry={3.5} fill={CORE_COLOR.base} stroke={CORE_COLOR.highlight} strokeWidth={1} opacity={0.9} />
        <circle cx={-7} cy={-5} r={1.5} fill={unlocked ? "#D4C5B5" : CORE_COLOR.highlight} opacity={unlocked ? 1 : 0.7} className="eye" />
        <circle cx={7} cy={-5} r={1.5} fill={unlocked ? "#D4C5B5" : CORE_COLOR.highlight} opacity={unlocked ? 1 : 0.7} className="eye" />
        <path d="M-2,-1 L0,-3 L2,-1" fill="none" stroke={CORE_COLOR.accent} strokeWidth={1} opacity={0.5} />
        <path d="M-8,6 Q-4,12 0,8 Q4,12 8,6" fill="none" stroke={CORE_COLOR.highlight} strokeWidth={1.5} opacity={0.6} />
        <path d="M-8,6 Q-4,12 0,8 Q4,12 8,6" fill="none" stroke={CORE_COLOR.base} strokeWidth={1.5} opacity={0.4} transform="translate(0.5, 0.5)" />
        <path d="M-12,-14 L0,-20 L12,-14" fill="none" stroke={CORE_COLOR.accent} strokeWidth={1.2} opacity={0.5} />
        <path d="M-8,-12 L0,-16 L8,-12" fill="none" stroke={CORE_COLOR.highlight} strokeWidth={0.8} opacity={0.3} />
      </g>

      {pulse && (
        <circle cx={CENTER} cy={CENTER} r={68} fill="none" stroke={CORE_COLOR.highlight} strokeWidth={2} opacity={0.4} className="core-pulse-ring" />
      )}

      {/* Unlock shockwave */}
      {cracking && (
        <circle cx={CENTER} cy={CENTER} r={68} fill="none" stroke="#D4C5B5" strokeWidth={3} opacity={0.8} className="shockwave-ring" />
      )}
    </g>
  );
}

// ── Tooltip Component ────────────────────────────────────────────────
function SymbolTooltip({ ring, symbol }: { ring: number; symbol: number }) {
  const symbols = getSymbolsForRing(ring);
  const symbolKey = symbols[symbol];
  const name = SYMBOL_NAMES[symbolKey] || symbolKey;
  const colors = RING_COLORS[ring];

  return (
    <motion.div
      className="symbol-tooltip"
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      style={{ borderColor: colors.pastel }}
    >
      <svg width={40} height={40} viewBox="-15 -15 30 30">
        <path d={AZTEC_SYMBOLS[symbolKey]} fill={colors.pastel} stroke={colors.groove} strokeWidth={1} />
      </svg>
      <div className="tooltip-text">
        <span className="tooltip-name" style={{ color: colors.pastel }}>{name}</span>
        <span className="tooltip-detail">Ring {8 - ring} · Position {symbol + 1}</span>
      </div>
    </motion.div>
  );
}

// ── Alignment Indicator ──────────────────────────────────────────────
function AlignmentMarker() {
  return (
    <g className="alignment-marker">
      <polygon
        points={`${CENTER - 6},22 ${CENTER + 6},22 ${CENTER},32`}
        fill="#9C8B7A"
        opacity={0.6}
        stroke="#5A4D42"
        strokeWidth={1}
      />
    </g>
  );
}

// ── Zoomed Ring Detail View ──────────────────────────────────────────
function ZoomedRingOverlay({ ringIndex, rotation, onClose }: { ringIndex: number; rotation: number; onClose: () => void }) {
  const { outer, inner, mid, width } = getRingRadii(ringIndex);
  const colors = RING_COLORS[ringIndex];
  const symbols = getSymbolsForRing(ringIndex);

  return (
    <motion.div
      className="zoomed-ring-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <motion.div
        className="zoomed-ring-content"
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.5 }}
        onClick={(e) => e.stopPropagation()}
      >
        <svg viewBox={`${CENTER - outer - 30} ${CENTER - outer - 30} ${(outer + 30) * 2} ${(outer + 30) * 2}`} className="zoomed-svg">
          <defs>
            <filter id="zoomStone" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" result="noise" />
              <feColorMatrix in="noise" type="saturate" values="0" result="grayNoise" />
              <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="textured" />
              <feComposite in="textured" in2="SourceGraphic" operator="in" />
            </filter>
          </defs>
          <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${CENTER}px ${CENTER}px` }}>
            <circle cx={CENTER} cy={CENTER} r={mid} fill="none" stroke={colors.base} strokeWidth={width} opacity={0.92} filter="url(#zoomStone)" />
            <circle cx={CENTER} cy={CENTER} r={outer - 0.5} fill="none" stroke={colors.highlight} strokeWidth={1.5} opacity={0.5} />
            <circle cx={CENTER} cy={CENTER} r={inner + 0.5} fill="none" stroke={colors.groove} strokeWidth={1.5} opacity={0.6} />
            {symbols.map((symbolKey, i) => {
              const angle = (360 / symbols.length) * i - 90;
              const rad = (angle * Math.PI) / 180;
              const x = CENTER + Math.cos(rad) * mid;
              const y = CENTER + Math.sin(rad) * mid;
              const scale = width / 55;
              return (
                <g key={i} transform={`translate(${x}, ${y}) rotate(${angle + 90}) scale(${scale})`}>
                  <path d={AZTEC_SYMBOLS[symbolKey]} fill="none" stroke={colors.groove} strokeWidth={3} opacity={0.6} transform="translate(0.8, 0.8)" />
                  <path d={AZTEC_SYMBOLS[symbolKey]} fill="none" stroke={colors.highlight} strokeWidth={1.5} opacity={0.35} transform="translate(-0.4, -0.4)" />
                  <path d={AZTEC_SYMBOLS[symbolKey]} fill={colors.highlight} opacity={0.55} stroke={colors.groove} strokeWidth={0.8} />
                  <text y={18} textAnchor="middle" fill={colors.pastel} fontSize="6" fontFamily="Georgia, serif" opacity={0.7}>
                    {SYMBOL_NAMES[symbolKey]}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        <div className="zoomed-ring-info">
          <span style={{ color: colors.pastel }}>Ring {8 - ringIndex}</span>
          <span className="zoomed-ring-count">{symbols.length} symbols</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Calendar ────────────────────────────────────────────────────
export default function AztecCalendar() {
  const [rotations, setRotations] = useState<number[]>(Array(8).fill(0));
  const [activeSymbol, setActiveSymbol] = useState<{ ring: number; symbol: number } | null>(null);
  const [corePulse, setCorePulse] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockedComboIdx, setUnlockedComboIdx] = useState(0);
  const [ringLocks, setRingLocks] = useState<boolean[]>(Array(8).fill(false));
  const [particles, setParticles] = useState<Particle[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<"day" | "night">(getTimeOfDay);
  const [cracking, setCracking] = useState(false);
  const [zoomedRing, setZoomedRing] = useState<number | null>(null);
  const [hintMode, setHintMode] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [trailBuffers, setTrailBuffers] = useState<number[][]>(Array(8).fill(null).map(() => []));

  const animFrameRef = useRef<number>(0);
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;
  const prevLocksRef = useRef<boolean[]>(Array(8).fill(false));
  const wasUnlockedRef = useRef(false);
  const ringLocksRef = useRef<boolean[]>(Array(8).fill(false));
  ringLocksRef.current = ringLocks;
  const particlesRef = useRef<Particle[]>([]);
  const rotationSpeedsRef = useRef<number[]>(Array(8).fill(0));

  // Check time of day periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Generate 4 secret combos per session (one per prophecy category)
  const secretCombos = useMemo(() => {
    const seed = Math.floor(Math.random() * 100000);
    return generateSecretCombinations(seed);
  }, []);

  // Compute alignment glow and detect new locks
  const alignmentState = useMemo(() => {
    const LOCK_THRESHOLD = 8;
    let bestComboIdx = 0;
    let bestScore = 0;

    for (let c = 0; c < secretCombos.length; c++) {
      let score = 0;
      for (let r = 0; r < 8; r++) {
        const err = getRingAlignmentError(rotations[r], r, secretCombos[c][r]);
        if (err < LOCK_THRESHOLD) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestComboIdx = c;
      }
    }

    const combo = secretCombos[bestComboIdx];
    const ringGlows: number[] = [];
    const newlyLocked: boolean[] = [];
    const hintDirections: (number | null)[] = [];
    const isAutoRotating = autoRotateRef.current;

    for (let r = 0; r < 8; r++) {
      if (!isAutoRotating && ringLocksRef.current[r]) {
        ringGlows.push(1);
        newlyLocked.push(false);
        hintDirections.push(null);
        continue;
      }
      const err = getRingAlignmentError(rotations[r], r, combo[r]);
      const justLocked = err < LOCK_THRESHOLD;
      newlyLocked.push(justLocked);
      const glowRange = 30;
      ringGlows.push(err < glowRange ? Math.max(0, 1 - err / glowRange) : 0);

      // Hint direction
      if (!isAutoRotating && !justLocked) {
        const count = SYMBOL_COUNTS[r];
        const symbolAngle = (360 / count) * combo[r];
        const targetRotation = -symbolAngle;
        let diff = ((targetRotation - rotations[r]) % 360 + 540) % 360 - 180;
        hintDirections.push(diff > 0 ? 1 : -1);
      } else {
        hintDirections.push(null);
      }
    }

    return { ringGlows, newlyLocked, bestComboIdx, hintDirections };
  }, [rotations, secretCombos]);

  // Apply new locks persistently (only in manual mode)
  useEffect(() => {
    if (autoRotate) return;
    let changed = false;
    const updated = [...ringLocks];
    for (let r = 0; r < 8; r++) {
      if (alignmentState.newlyLocked[r] && !ringLocks[r]) {
        updated[r] = true;
        changed = true;
        playLockClick();
        // Lock particles
        const lockPs = createLockParticles(r);
        particlesRef.current = [...particlesRef.current, ...lockPs];
        setParticles([...particlesRef.current]);
      }
    }
    if (changed) {
      setRingLocks(updated);
      if (updated.every(Boolean) && !wasUnlockedRef.current) {
        // Crack + shockwave animation
        setCracking(true);
        const crackPs = createCrackParticles();
        particlesRef.current = [...particlesRef.current, ...crackPs];
        setParticles([...particlesRef.current]);

        setTimeout(() => {
          setUnlocked(true);
          setUnlockedComboIdx(alignmentState.bestComboIdx);
          playDeepClick();
          wasUnlockedRef.current = true;
        }, 800);

        setTimeout(() => setCracking(false), 2000);
      }
    }
  }, [alignmentState, ringLocks, autoRotate]);

  const handleRotate = useCallback((index: number, delta: number) => {
    setAutoRotate(false);
    rotationSpeedsRef.current[index] = delta;
    setRotations((prev) => {
      if (ringLocksRef.current[index]) return prev;
      const next = [...prev];
      next[index] += delta;
      return next;
    });
    // Update trail buffer
    setTrailBuffers(prev => {
      const next = [...prev];
      const buf = [...next[index], delta];
      if (buf.length > 6) buf.shift();
      next[index] = buf;
      return next;
    });
    // Ring tone
    playRingTone(index, delta);
    // Particles
    if (Math.abs(delta) > 1) {
      const ps = createRingParticles(index, rotationSpeedsRef.current[index], delta);
      if (ps.length > 0) {
        particlesRef.current = [...particlesRef.current, ...ps].slice(-200);
        setParticles([...particlesRef.current]);
      }
    }
  }, []);

  const handleSymbolClick = useCallback(
    (ring: number, symbol: number) => {
      if (activeSymbol?.ring === ring && activeSymbol?.symbol === symbol) {
        setActiveSymbol(null);
        setCorePulse(false);
      } else {
        setActiveSymbol({ ring, symbol });
        setCorePulse(true);
        setTimeout(() => setCorePulse(false), 1500);
      }
    },
    [activeSymbol]
  );

  const handleDoubleClickRing = useCallback((index: number) => {
    setZoomedRing(index);
  }, []);

  // Particle update loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (particlesRef.current.length === 0) return;
      particlesRef.current = particlesRef.current
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.02,
          life: p.life - 1 / p.maxLife,
        }))
        .filter(p => p.life > 0);
      setParticles([...particlesRef.current]);
    }, 33);
    return () => clearInterval(interval);
  }, []);

  // Clear trail buffers when idle
  useEffect(() => {
    const interval = setInterval(() => {
      setTrailBuffers(prev => prev.map(buf => {
        if (buf.length === 0) return buf;
        const next = [...buf];
        next.shift();
        return next;
      }));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate
  useEffect(() => {
    let prevTime = performance.now();
    const speeds = [0.02, -0.03, 0.04, -0.05, 0.07, -0.09, 0.12, -0.16];
    const animate = (time: number) => {
      const dt = (time - prevTime) / 16.67;
      prevTime = time;
      if (autoRotateRef.current) {
        setRotations((prev) => prev.map((r, i) => r + speeds[i] * dt));
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Toggle music
  const toggleMusic = useCallback(() => {
    if (musicPlaying) {
      ambientMusic.stop();
      setMusicPlaying(false);
    } else {
      ambientMusic.start();
      setMusicPlaying(true);
    }
  }, [musicPlaying]);

  // Cleanup music on unmount
  useEffect(() => {
    return () => { ambientMusic.stop(); };
  }, []);

  // Get tonalpohualli day
  const aztecDay = useMemo(getTonalpohualliDay, []);
  const prophecy = useMemo(() => getDailyProphecy(unlockedComboIdx), [unlockedComboIdx]);

  return (
    <div className={`aztec-calendar-container ${unlocked ? "unlocked" : ""} ${timeOfDay}`}>
      {/* Stars for night mode */}
      {timeOfDay === "night" && (
        <div className="stars-container">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="star"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      )}

      <h1 className="aztec-title">
        <span className="title-glyph">&#x2726;</span>
        Tonalpohualli
        <span className="title-glyph">&#x2726;</span>
      </h1>
      <p className="aztec-subtitle">
        Sacred Aztec Calendar · Align the symbols to unlock
      </p>

      {/* Tonalpohualli day display */}
      <div className="aztec-day-display">
        <span className="aztec-day-number">{aztecDay.number}</span>
        <span className="aztec-day-sign">{aztecDay.sign}</span>
        <span className="aztec-day-meaning">({aztecDay.meaning})</span>
      </div>

      {/* Lock progress indicator */}
      <div className="lock-indicator">
        {ringLocks.map((locked, i) => (
          <div
            key={i}
            className={`lock-dot ${locked ? "locked" : ""}`}
            style={{
              backgroundColor: locked ? RING_COLORS[i].pastel : RING_COLORS[i].groove,
              boxShadow: locked ? `0 0 8px ${RING_COLORS[i].pastel}` : "none",
            }}
          />
        ))}
      </div>

      <div className="calendar-wrapper">
        <svg viewBox="0 0 1000 1000" className="aztec-svg" style={{ touchAction: "none" }}>
          <defs>
            <filter id="stoneTexture" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" result="noise" />
              <feColorMatrix in="noise" type="saturate" values="0" result="grayNoise" />
              <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="textured" />
              <feComposite in="textured" in2="SourceGraphic" operator="in" />
            </filter>

            <filter id="alignGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="carvedGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <radialGradient id="coreInnerGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4A3D2F" />
              <stop offset="100%" stopColor="#2A1F15" />
            </radialGradient>

            <radialGradient id="stoneDiscGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4A4038" stopOpacity={0.15} />
              <stop offset="70%" stopColor="#2A2420" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#000" stopOpacity={0} />
            </radialGradient>

            <radialGradient id="unlockRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D4C5B5" stopOpacity={0.6} />
              <stop offset="50%" stopColor="#C4A882" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#000" stopOpacity={0} />
            </radialGradient>

            <filter id="cracks" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="turbulence" baseFrequency="0.015" numOctaves="2" result="crack" />
              <feColorMatrix in="crack" type="matrix"
                values="0 0 0 0 0.15 0 0 0 0 0.12 0 0 0 0 0.08 0 0 0 -2.5 1.2"
                result="crackColor" />
              <feComposite in="crackColor" in2="SourceGraphic" operator="in" />
            </filter>

            {/* Particle glow filter */}
            <filter id="particleGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Stone disc background */}
          <circle cx={CENTER} cy={CENTER} r={490} fill="url(#stoneDiscGradient)" />
          <circle cx={CENTER} cy={CENTER} r={488} fill="none" stroke="#6B5B4F" strokeWidth={3} opacity={0.25} />
          <circle cx={CENTER} cy={CENTER} r={486} fill="none" stroke="#3D3229" strokeWidth={1} opacity={0.4} />
          <circle cx={CENTER} cy={CENTER} r={485} fill="#2a2018" opacity={0.15} filter="url(#cracks)" />

          {unlocked && (
            <circle cx={CENTER} cy={CENTER} r={485} fill="url(#unlockRadial)" opacity={0.5} className="full-unlock-glow" />
          )}

          {/* Rings */}
          {Array.from({ length: 8 }).map((_, i) => (
            <Ring
              key={i}
              index={i}
              rotation={rotations[i]}
              onRotate={handleRotate}
              activeSymbol={activeSymbol}
              onSymbolClick={handleSymbolClick}
              glowIntensity={alignmentState.ringGlows[i]}
              unlocked={ringLocks[i]}
              zoomed={zoomedRing === i}
              onDoubleClick={handleDoubleClickRing}
              hintDirection={hintMode ? alignmentState.hintDirections[i] : null}
              trail={trailBuffers[i]}
            />
          ))}

          {/* Particles */}
          {particles.map(p => (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={p.size * p.life}
              fill={p.color}
              opacity={p.life * (p.type === "lock" || p.type === "crack" ? 0.8 : 0.5)}
              filter={p.type === "lock" || p.type === "crack" ? "url(#particleGlow)" : undefined}
            />
          ))}

          {/* Alignment marker at top */}
          <AlignmentMarker />

          {/* Core */}
          <Core pulse={corePulse} unlocked={unlocked} cracking={cracking} />

          {/* Shockwave expanding ring on unlock */}
          {cracking && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={100}
              fill="none"
              stroke="#D4C5B5"
              strokeWidth={2}
              opacity={0.6}
              className="shockwave-expand"
            />
          )}
        </svg>
      </div>

      {/* Symbol info tooltip */}
      <AnimatePresence>
        {activeSymbol && (
          <SymbolTooltip ring={activeSymbol.ring} symbol={activeSymbol.symbol} />
        )}
      </AnimatePresence>

      {/* Zoomed ring overlay */}
      <AnimatePresence>
        {zoomedRing !== null && (
          <ZoomedRingOverlay
            ringIndex={zoomedRing}
            rotation={rotations[zoomedRing]}
            onClose={() => setZoomedRing(null)}
          />
        )}
      </AnimatePresence>

      {/* Unlock prophecy */}
      <AnimatePresence>
        {unlocked && (
          <motion.div
            className="unlock-message"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="prophecy-label">{prophecy.label}</div>
            <div className="prophecy-text">{prophecy.text}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="controls">
        <button
          className={`control-btn ${autoRotate ? "active" : ""}`}
          onClick={() => {
            const next = !autoRotate;
            setAutoRotate(next);
            if (next) {
              setRingLocks(Array(8).fill(false));
              prevLocksRef.current = Array(8).fill(false);
              setUnlocked(false);
              wasUnlockedRef.current = false;
              setCracking(false);
            }
          }}
        >
          {autoRotate ? "⏸ Pause" : "▶ Auto"}
        </button>
        <button
          className="control-btn"
          onClick={() => {
            setRotations(Array(8).fill(0));
            setRingLocks(Array(8).fill(false));
            prevLocksRef.current = Array(8).fill(false);
            setUnlocked(false);
            wasUnlockedRef.current = false;
            setCracking(false);
          }}
        >
          ↺ Reset
        </button>
        <button
          className={`control-btn ${hintMode ? "active" : ""}`}
          onClick={() => setHintMode(h => !h)}
        >
          {hintMode ? "🔮 Hints On" : "🔮 Hints"}
        </button>
        <button
          className={`control-btn ${musicPlaying ? "active" : ""}`}
          onClick={toggleMusic}
        >
          {musicPlaying ? "🔇 Music Off" : "🎵 Music"}
        </button>
      </div>
    </div>
  );
}
