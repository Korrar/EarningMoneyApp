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
  { base: "#8E7F72", groove: "#5A4D42", highlight: "#C4B5A6", accent: "#D4C5B5", pastel: "#C9A9A0" }, // dusty rose stone
  { base: "#7A8478", groove: "#4A5248", highlight: "#B0BAA8", accent: "#C0CAB8", pastel: "#A3B8A0" }, // sage green
  { base: "#847B8E", groove: "#524A5A", highlight: "#B4ABB8", accent: "#C8BFD0", pastel: "#B8A8C8" }, // lavender stone
  { base: "#8E8478", groove: "#5A5048", highlight: "#C0B4A8", accent: "#D0C4B8", pastel: "#C8B89C" }, // warm sand
  { base: "#78848E", groove: "#485058", highlight: "#A8B4BE", accent: "#B8C4CE", pastel: "#9CB8C8" }, // sky blue stone
  { base: "#8E7E7A", groove: "#5A4C48", highlight: "#C0AEA8", accent: "#D0BEB8", pastel: "#C8A8A0" }, // terracotta matte
  { base: "#7E8A78", groove: "#4C5648", highlight: "#AEB8A8", accent: "#BEC8B8", pastel: "#A8C0A0" }, // moss
  { base: "#88807C", groove: "#565048", highlight: "#B8B0AA", accent: "#C8C0BA", pastel: "#B8A898" }, // warm gray
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

// ── Aztec Prophecy Generator ─────────────────────────────────────────
// Unique per person (browser fingerprint) and per day
const PROPHECIES = [
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
  "A jade stone rolls toward you from the north. Wealth comes in a form you won't expect.",
  "The temple stairs are steep but the view changes everything. Keep climbing.",
  "Copal smoke carries your intention to the unseen. What you wished for at dawn is heard.",
  "Two suns rise in the world of the brave. You will see both if you dare to wake early.",
  "The Rabbit crosses the moon tonight. What you start in secret will become legend.",
  "Quetzal feathers fall only for those who do not grasp. Release your grip on the outcome.",
  "The Water Goddess stirs the depths. Emotions you buried will surface — let them flow.",
  "A warrior's shield is also a mirror. Your greatest defense today is self-knowledge.",
  "The House of the Sun accepts a new guest. You are being invited somewhere important.",
  "Stones remember every footstep. The ground beneath you knows you belong here.",
  "The Reed bends but records everything. Write down what comes to mind before noon.",
  "Coyolxauhqui reassembles herself each night. What broke in you is already healing.",
  "The Vulture circles not for death but for truth. Clarity comes from above today.",
  "Movement is the Fifth Sun's gift. Stillness is wisdom, but today — move.",
  "The Flint strikes and the old world ignites. Transformation chooses you, not the other way.",
  "An ancestor places a flower on your threshold. You are remembered by those beyond the veil.",
  "The calendar stone turns and all debts dissolve. Forgive one thing today — including yourself.",
  "Tlaloc's tears nourish what Tonatiuh's fire tests. Both the storm and the heat serve you.",
  "A dog spirit walks beside you unseen. Loyalty given freely returns sevenfold.",
  "The pyramid's shadow points to buried gold. Follow what frightens you most — treasure waits.",
  "Xochipilli sings through the cracks in your routine. Beauty interrupts your plans today.",
  "The Earth opens to swallow the false and feed the true. Stand in your honesty.",
  "Night birds carry messages between worlds. Pay attention to what visits your dreams.",
  "The serpent sheds its skin at the threshold of power. What you outgrow falls away painlessly.",
  "A merchant from a distant trecena brings rare goods. Accept unexpected gifts with grace.",
  "The calendar's heart beats in rhythm with yours. You are not lost — you are the center.",
];

function getBrowserSeed(): number {
  // Fingerprint from screen, timezone, language, platform
  const raw = [
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.language,
    navigator.platform,
    navigator.hardwareConcurrency || 0,
  ].join("|");
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getDailyProphecy(): string {
  const now = new Date();
  const dayStamp = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const seed = (getBrowserSeed() * 31 + dayStamp * 7) >>> 0;
  const index = seed % PROPHECIES.length;
  return PROPHECIES[index];
}

// ── Secret Combinations ─────────────────────────────────────────────
// Each combination is an array of 8 target symbol indices (one per ring).
// When each ring's target symbol is aligned to the top (angle ~270° in SVG = top),
// the combination triggers.
function generateSecretCombinations(seed: number) {
  // Seeded pseudo-random for reproducibility per session
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };

  const combos: number[][] = [];
  for (let c = 0; c < 3; c++) {
    const combo: number[] = [];
    for (let r = 0; r < 8; r++) {
      combo.push(Math.floor(rand() * SYMBOL_COUNTS[r]));
    }
    combos.push(combo);
  }
  return combos;
}

// Check how close a ring is to its target alignment
function getRingAlignmentError(rotation: number, ringIndex: number, targetSymbol: number): number {
  const count = SYMBOL_COUNTS[ringIndex];
  const symbolAngle = (360 / count) * targetSymbol; // angle of that symbol
  // We want symbol to be at the top = -90° from right = 270°
  // The symbol is placed at angle (360/count)*i - 90, so at i=targetSymbol it's at symbolAngle-90
  // With rotation applied, the symbol sits at symbolAngle - 90 + rotation
  // We want that to be -90 (top), so rotation should be -symbolAngle (mod 360)
  const targetRotation = -symbolAngle;
  let diff = ((rotation - targetRotation) % 360 + 540) % 360 - 180;
  return Math.abs(diff);
}

// ── Deep Click Sound via Web Audio ──────────────────────────────────
function playDeepClick() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Deep resonant thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    // Sub bass hit
    osc.type = "sine";
    osc.frequency.setValueAtTime(55, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    // Stone click overtone
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(120, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
    gain2.gain.setValueAtTime(0.4, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    // Noise burst for stone texture
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

    // Low pass for warmth
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
  } catch {
    // Audio not available
  }
}

// Play a subtle ring-lock click (lighter version)
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
  } catch {
    // Audio not available
  }
}

// ── Ring Component ───────────────────────────────────────────────────
interface RingProps {
  index: number;
  rotation: number;
  onRotate: (index: number, delta: number) => void;
  activeSymbol: { ring: number; symbol: number } | null;
  onSymbolClick: (ring: number, symbol: number) => void;
  glowIntensity: number; // 0-1, how close to alignment
  unlocked: boolean;
}

function Ring({ index, rotation, onRotate, activeSymbol, onSymbolClick, glowIntensity, unlocked }: RingProps) {
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

  // Glow color based on pastel
  const glowColor = colors.pastel;
  const glowOpacity = glowIntensity * 0.6;

  return (
    <g
      ref={ringRef}
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: `${CENTER}px ${CENTER}px`,
        touchAction: "none",
      }}
      onPointerDown={unlocked ? undefined : handlePointerDown}
      onPointerMove={unlocked ? undefined : handlePointerMove}
      onPointerUp={unlocked ? undefined : handlePointerUp}
      onPointerCancel={unlocked ? undefined : handlePointerUp}
      className={`aztec-ring ${unlocked ? "ring-unlocked ring-locked" : ""}`}
    >
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

      {/* Symbols */}
      {symbols.map((symbolKey, i) => {
        const angle = (360 / symbols.length) * i - 90;
        const rad = (angle * Math.PI) / 180;
        const x = CENTER + Math.cos(rad) * mid;
        const y = CENTER + Math.sin(rad) * mid;
        const isActive =
          activeSymbol?.ring === index && activeSymbol?.symbol === i;
        const scale = width / 55;

        // Pastel tint for symbols when ring is glowing
        const symbolFill = unlocked
          ? colors.pastel
          : isActive
            ? colors.accent
            : colors.highlight;
        const symbolOpacity = unlocked
          ? 0.9
          : isActive
            ? 0.9
            : 0.55;

        return (
          <g
            key={i}
            transform={`translate(${x}, ${y}) rotate(${angle + 90}) scale(${scale})`}
            onClick={(e) => {
              e.stopPropagation();
              onSymbolClick(index, i);
            }}
            className={`aztec-symbol ${isActive ? "active" : ""}`}
            style={{ cursor: "pointer" }}
          >
            {/* Carved groove */}
            <path
              d={AZTEC_SYMBOLS[symbolKey]}
              fill="none"
              stroke={colors.groove}
              strokeWidth={3}
              opacity={0.6}
              transform="translate(0.8, 0.8)"
            />
            {/* Highlight edge */}
            <path
              d={AZTEC_SYMBOLS[symbolKey]}
              fill="none"
              stroke={unlocked ? colors.pastel : colors.highlight}
              strokeWidth={1.5}
              opacity={isActive || unlocked ? 0.8 : 0.35}
              transform="translate(-0.4, -0.4)"
            />
            {/* Main symbol body */}
            <path
              d={AZTEC_SYMBOLS[symbolKey]}
              fill={symbolFill}
              opacity={symbolOpacity}
              stroke={colors.groove}
              strokeWidth={0.8}
              className="symbol-path"
              filter={isActive ? "url(#carvedGlow)" : unlocked ? "url(#alignGlow)" : "none"}
            />
          </g>
        );
      })}
    </g>
  );
}

// ── Core Component ───────────────────────────────────────────────────
function Core({ pulse, unlocked }: { pulse: boolean; unlocked: boolean }) {
  return (
    <g className="aztec-core">
      {/* Unlocked glow behind core */}
      {unlocked && (
        <circle
          cx={CENTER}
          cy={CENTER}
          r={85}
          fill="url(#unlockRadial)"
          opacity={0.7}
          className="core-unlock-glow"
        />
      )}

      {/* Core stone disc */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={68}
        fill={CORE_COLOR.base}
        filter="url(#stoneTexture)"
        stroke={unlocked ? "#D4C5B5" : CORE_COLOR.accent}
        strokeWidth={unlocked ? 3 : 2}
        opacity={0.9}
      />
      {/* Inner ring bevel */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={60}
        fill="url(#coreInnerGradient)"
        stroke={CORE_COLOR.highlight}
        strokeWidth={2}
        filter="url(#stoneTexture)"
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={65}
        fill="none"
        stroke={CORE_COLOR.accent}
        strokeWidth={0.8}
        strokeDasharray="3 5"
        opacity={0.4}
      />

      {/* Tonatiuh face */}
      <g transform={`translate(${CENTER}, ${CENTER})`} className="tonatiuh-face">
        {/* Sun rays */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (360 / 16) * i;
          const rad = (angle * Math.PI) / 180;
          const isLong = i % 2 === 0;
          return (
            <g key={i}>
              <line
                x1={Math.cos(rad) * 24 + 0.5}
                y1={Math.sin(rad) * 24 + 0.5}
                x2={Math.cos(rad) * (isLong ? 46 : 38) + 0.5}
                y2={Math.sin(rad) * (isLong ? 46 : 38) + 0.5}
                stroke={CORE_COLOR.base}
                strokeWidth={isLong ? 3 : 2}
                opacity={0.8}
              />
              <line
                x1={Math.cos(rad) * 24}
                y1={Math.sin(rad) * 24}
                x2={Math.cos(rad) * (isLong ? 46 : 38)}
                y2={Math.sin(rad) * (isLong ? 46 : 38)}
                stroke={unlocked ? "#D4C5B5" : CORE_COLOR.highlight}
                strokeWidth={isLong ? 2 : 1.2}
                opacity={unlocked ? 0.9 : 0.6}
                className="sun-ray"
              />
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
        <circle
          cx={CENTER}
          cy={CENTER}
          r={68}
          fill="none"
          stroke={CORE_COLOR.highlight}
          strokeWidth={2}
          opacity={0.4}
          className="core-pulse-ring"
        />
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
  // Small triangle at the top pointing down
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

// ── Main Calendar ────────────────────────────────────────────────────
export default function AztecCalendar() {
  const [rotations, setRotations] = useState<number[]>(Array(8).fill(0));
  const [activeSymbol, setActiveSymbol] = useState<{ ring: number; symbol: number } | null>(null);
  const [corePulse, setCorePulse] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [ringLocks, setRingLocks] = useState<boolean[]>(Array(8).fill(false));
  const animFrameRef = useRef<number>(0);
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;
  const prevLocksRef = useRef<boolean[]>(Array(8).fill(false));
  const wasUnlockedRef = useRef(false);
  const ringLocksRef = useRef<boolean[]>(Array(8).fill(false));
  ringLocksRef.current = ringLocks;

  // Generate 3 secret combos per session
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
    const isAutoRotating = autoRotateRef.current;

    for (let r = 0; r < 8; r++) {
      // Already locked rings stay at full glow (only in manual mode)
      if (!isAutoRotating && ringLocksRef.current[r]) {
        ringGlows.push(1);
        newlyLocked.push(false);
        continue;
      }
      const err = getRingAlignmentError(rotations[r], r, combo[r]);
      const justLocked = err < LOCK_THRESHOLD;
      newlyLocked.push(justLocked);
      const glowRange = 30;
      ringGlows.push(err < glowRange ? Math.max(0, 1 - err / glowRange) : 0);
    }

    return { ringGlows, newlyLocked };
  }, [rotations, secretCombos]);

  // Apply new locks persistently (only in manual mode)
  useEffect(() => {
    if (autoRotate) return; // don't lock during auto-rotate
    let changed = false;
    const updated = [...ringLocks];
    for (let r = 0; r < 8; r++) {
      if (alignmentState.newlyLocked[r] && !ringLocks[r]) {
        updated[r] = true;
        changed = true;
        playLockClick();
      }
    }
    if (changed) {
      setRingLocks(updated);
      if (updated.every(Boolean) && !wasUnlockedRef.current) {
        setUnlocked(true);
        playDeepClick();
        wasUnlockedRef.current = true;
      }
    }
  }, [alignmentState, ringLocks, autoRotate]);

  const handleRotate = useCallback((index: number, delta: number) => {
    setAutoRotate(false);
    // Don't rotate locked rings
    setRotations((prev) => {
      if (ringLocksRef.current[index]) return prev;
      const next = [...prev];
      next[index] += delta;
      return next;
    });
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

  // Auto-rotate
  useEffect(() => {
    let prevTime = performance.now();
    // Inner rings spin faster (ring 0=outer, ring 7=inner)
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

  return (
    <div className={`aztec-calendar-container ${unlocked ? "unlocked" : ""}`}>
      <h1 className="aztec-title">
        <span className="title-glyph">&#x2726;</span>
        Tonalpohualli
        <span className="title-glyph">&#x2726;</span>
      </h1>
      <p className="aztec-subtitle">
        Sacred Aztec Calendar · Align the symbols to unlock
      </p>

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
            {/* Stone texture filter */}
            <filter id="stoneTexture" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" result="noise" />
              <feColorMatrix in="noise" type="saturate" values="0" result="grayNoise" />
              <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="textured" />
              <feComposite in="textured" in2="SourceGraphic" operator="in" />
            </filter>

            {/* Alignment glow */}
            <filter id="alignGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Carved glow for active symbols */}
            <filter id="carvedGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Core gradients */}
            <radialGradient id="coreInnerGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4A3D2F" />
              <stop offset="100%" stopColor="#2A1F15" />
            </radialGradient>

            <radialGradient id="stoneDiscGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4A4038" stopOpacity={0.15} />
              <stop offset="70%" stopColor="#2A2420" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#000" stopOpacity={0} />
            </radialGradient>

            {/* Unlock radial glow */}
            <radialGradient id="unlockRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D4C5B5" stopOpacity={0.6} />
              <stop offset="50%" stopColor="#C4A882" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#000" stopOpacity={0} />
            </radialGradient>

            {/* Crack pattern */}
            <filter id="cracks" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="turbulence" baseFrequency="0.015" numOctaves="2" result="crack" />
              <feColorMatrix in="crack" type="matrix"
                values="0 0 0 0 0.15 0 0 0 0 0.12 0 0 0 0 0.08 0 0 0 -2.5 1.2"
                result="crackColor" />
              <feComposite in="crackColor" in2="SourceGraphic" operator="in" />
            </filter>
          </defs>

          {/* Stone disc background */}
          <circle cx={CENTER} cy={CENTER} r={490} fill="url(#stoneDiscGradient)" />

          {/* Outer edge */}
          <circle cx={CENTER} cy={CENTER} r={488} fill="none" stroke="#6B5B4F" strokeWidth={3} opacity={0.25} />
          <circle cx={CENTER} cy={CENTER} r={486} fill="none" stroke="#3D3229" strokeWidth={1} opacity={0.4} />

          {/* Surface cracks */}
          <circle cx={CENTER} cy={CENTER} r={485} fill="#2a2018" opacity={0.15} filter="url(#cracks)" />

          {/* Unlock glow behind everything */}
          {unlocked && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={485}
              fill="url(#unlockRadial)"
              opacity={0.5}
              className="full-unlock-glow"
            />
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
            />
          ))}

          {/* Alignment marker at top */}
          <AlignmentMarker />

          {/* Core */}
          <Core pulse={corePulse} unlocked={unlocked} />
        </svg>
      </div>

      {/* Symbol info tooltip */}
      <AnimatePresence>
        {activeSymbol && (
          <SymbolTooltip ring={activeSymbol.ring} symbol={activeSymbol.symbol} />
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
            <div className="prophecy-label">The Calendar Speaks</div>
            <div className="prophecy-text">{getDailyProphecy()}</div>
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
              // Auto-rotate resets all locks
              setRingLocks(Array(8).fill(false));
              prevLocksRef.current = Array(8).fill(false);
              setUnlocked(false);
              wasUnlockedRef.current = false;
            }
          }}
        >
          {autoRotate ? "⏸ Pause" : "▶ Auto-Rotate"}
        </button>
        <button
          className="control-btn"
          onClick={() => {
            setRotations(Array(8).fill(0));
            setRingLocks(Array(8).fill(false));
            prevLocksRef.current = Array(8).fill(false);
            setUnlocked(false);
            wasUnlockedRef.current = false;
          }}
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}
