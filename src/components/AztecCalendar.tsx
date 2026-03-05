import { useState, useRef, useCallback, useEffect } from "react";
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

// Stone palette – warm sandstone & basalt tones
const RING_COLORS = [
  { base: "#6B5B4F", groove: "#3D3229", highlight: "#9C8B7A", accent: "#C4A882" },
  { base: "#5A5550", groove: "#2E2B28", highlight: "#8A8580", accent: "#B0A89E" },
  { base: "#6E5D4E", groove: "#3A3028", highlight: "#9E8D7E", accent: "#C0AD98" },
  { base: "#555048", groove: "#2C2924", highlight: "#807B73", accent: "#A89E92" },
  { base: "#695C50", groove: "#372F26", highlight: "#998C80", accent: "#BBA992" },
  { base: "#5D5550", groove: "#302D28", highlight: "#8D8580", accent: "#B2A89E" },
  { base: "#645A4E", groove: "#343028", highlight: "#948A7E", accent: "#B8A898" },
  { base: "#584F48", groove: "#2A2622", highlight: "#887F78", accent: "#ACA298" },
];

const CORE_COLOR = { base: "#3D3229", highlight: "#C4A882", accent: "#9C8B7A" };

// ── Helpers ──────────────────────────────────────────────────────────
const CENTER = 500;
const RING_GAP = 5;

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
  const counts = [20, 18, 16, 14, 12, 10, 8, 6];
  const count = counts[ringIndex];
  const symbols: (keyof typeof AZTEC_SYMBOLS)[] = [];
  for (let i = 0; i < count; i++) {
    symbols.push(SYMBOL_KEYS[i % SYMBOL_KEYS.length]);
  }
  return symbols;
}

// ── Ring Component ───────────────────────────────────────────────────
interface RingProps {
  index: number;
  rotation: number;
  onRotate: (index: number, delta: number) => void;
  activeSymbol: { ring: number; symbol: number } | null;
  onSymbolClick: (ring: number, symbol: number) => void;
}

function Ring({ index, rotation, onRotate, activeSymbol, onSymbolClick }: RingProps) {
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
        velocityRef.current = delta / dt * 16; // velocity per frame
      }
      lastTimeRef.current = now;
      lastAngle.current = currentAngle;
      onRotate(index, delta);
    },
    [getAngle, index, onRotate]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    // Momentum / inertia
    let vel = velocityRef.current;
    const decay = () => {
      if (Math.abs(vel) < 0.05) return;
      vel *= 0.94;
      onRotate(index, vel);
      momentumRef.current = requestAnimationFrame(decay);
    };
    momentumRef.current = requestAnimationFrame(decay);
  }, [index, onRotate]);

  // Generate chisel tick marks around the ring
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

  // Divider lines between symbols
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

  return (
    <g
      ref={ringRef}
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: `${CENTER}px ${CENTER}px`,
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="aztec-ring"
    >
      {/* Ring stone background - outer bevel (light) */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={outer - 0.5}
        fill="none"
        stroke={colors.highlight}
        strokeWidth={1.5}
        opacity={0.5}
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
      {/* Inner bevel (shadow) */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={inner + 0.5}
        fill="none"
        stroke={colors.groove}
        strokeWidth={1.5}
        opacity={0.6}
      />

      {/* Chisel tick marks */}
      {tickMarks}

      {/* Section dividers */}
      {dividers}

      {/* Symbols carved into stone */}
      {symbols.map((symbolKey, i) => {
        const angle = (360 / symbols.length) * i - 90;
        const rad = (angle * Math.PI) / 180;
        const x = CENTER + Math.cos(rad) * mid;
        const y = CENTER + Math.sin(rad) * mid;
        const isActive =
          activeSymbol?.ring === index && activeSymbol?.symbol === i;
        const scale = width / 55;

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
            {/* Carved groove (shadow behind symbol) */}
            <path
              d={AZTEC_SYMBOLS[symbolKey]}
              fill="none"
              stroke={colors.groove}
              strokeWidth={3}
              opacity={0.6}
              transform="translate(0.8, 0.8)"
            />
            {/* Symbol highlight edge (top-left light) */}
            <path
              d={AZTEC_SYMBOLS[symbolKey]}
              fill="none"
              stroke={colors.highlight}
              strokeWidth={1.5}
              opacity={isActive ? 0.8 : 0.35}
              transform="translate(-0.4, -0.4)"
            />
            {/* Main symbol body */}
            <path
              d={AZTEC_SYMBOLS[symbolKey]}
              fill={isActive ? colors.accent : colors.highlight}
              opacity={isActive ? 0.9 : 0.55}
              stroke={colors.groove}
              strokeWidth={0.8}
              className="symbol-path"
              filter={isActive ? "url(#carvedGlow)" : "none"}
            />
          </g>
        );
      })}
    </g>
  );
}

// ── Core Component ───────────────────────────────────────────────────
function Core({ pulse }: { pulse: boolean }) {
  return (
    <g className="aztec-core">
      {/* Core stone disc */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={68}
        fill={CORE_COLOR.base}
        filter="url(#stoneTexture)"
        stroke={CORE_COLOR.accent}
        strokeWidth={2}
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
      {/* Outer chisel ring */}
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

      {/* Tonatiuh face – central sun */}
      <g transform={`translate(${CENTER}, ${CENTER})`} className="tonatiuh-face">
        {/* Sun rays as carved notches */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (360 / 16) * i;
          const rad = (angle * Math.PI) / 180;
          const isLong = i % 2 === 0;
          return (
            <g key={i}>
              {/* Shadow */}
              <line
                x1={Math.cos(rad) * 24 + 0.5}
                y1={Math.sin(rad) * 24 + 0.5}
                x2={Math.cos(rad) * (isLong ? 46 : 38) + 0.5}
                y2={Math.sin(rad) * (isLong ? 46 : 38) + 0.5}
                stroke={CORE_COLOR.base}
                strokeWidth={isLong ? 3 : 2}
                opacity={0.8}
              />
              {/* Highlight */}
              <line
                x1={Math.cos(rad) * 24}
                y1={Math.sin(rad) * 24}
                x2={Math.cos(rad) * (isLong ? 46 : 38)}
                y2={Math.sin(rad) * (isLong ? 46 : 38)}
                stroke={CORE_COLOR.highlight}
                strokeWidth={isLong ? 2 : 1.2}
                opacity={0.6}
                className="sun-ray"
              />
            </g>
          );
        })}
        {/* Face circle – carved disc */}
        <circle r={22} fill={CORE_COLOR.base} stroke={CORE_COLOR.accent} strokeWidth={1.5} />
        <circle r={21} fill="none" stroke={CORE_COLOR.highlight} strokeWidth={0.5} opacity={0.3} />
        {/* Eyes – carved hollows */}
        <ellipse cx={-7} cy={-5} rx={4} ry={3.5} fill={CORE_COLOR.base} stroke={CORE_COLOR.highlight} strokeWidth={1} opacity={0.9} />
        <ellipse cx={7} cy={-5} rx={4} ry={3.5} fill={CORE_COLOR.base} stroke={CORE_COLOR.highlight} strokeWidth={1} opacity={0.9} />
        <circle cx={-7} cy={-5} r={1.5} fill={CORE_COLOR.highlight} opacity={0.7} className="eye" />
        <circle cx={7} cy={-5} r={1.5} fill={CORE_COLOR.highlight} opacity={0.7} className="eye" />
        {/* Nose */}
        <path d="M-2,-1 L0,-3 L2,-1" fill="none" stroke={CORE_COLOR.accent} strokeWidth={1} opacity={0.5} />
        {/* Mouth – carved groove */}
        <path
          d="M-8,6 Q-4,12 0,8 Q4,12 8,6"
          fill="none"
          stroke={CORE_COLOR.highlight}
          strokeWidth={1.5}
          opacity={0.6}
        />
        <path
          d="M-8,6 Q-4,12 0,8 Q4,12 8,6"
          fill="none"
          stroke={CORE_COLOR.base}
          strokeWidth={1.5}
          opacity={0.4}
          transform="translate(0.5, 0.5)"
        />
        {/* Forehead decoration – carved lines */}
        <path
          d="M-12,-14 L0,-20 L12,-14"
          fill="none"
          stroke={CORE_COLOR.accent}
          strokeWidth={1.2}
          opacity={0.5}
        />
        <path
          d="M-8,-12 L0,-16 L8,-12"
          fill="none"
          stroke={CORE_COLOR.highlight}
          strokeWidth={0.8}
          opacity={0.3}
        />
      </g>

      {/* Subtle pulse overlay */}
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
function SymbolTooltip({
  ring,
  symbol,
}: {
  ring: number;
  symbol: number;
}) {
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
      style={{ borderColor: colors.accent }}
    >
      <svg width={40} height={40} viewBox="-15 -15 30 30">
        <path
          d={AZTEC_SYMBOLS[symbolKey]}
          fill={colors.accent}
          stroke={colors.groove}
          strokeWidth={1}
        />
      </svg>
      <div className="tooltip-text">
        <span className="tooltip-name" style={{ color: colors.accent }}>
          {name}
        </span>
        <span className="tooltip-detail">
          Ring {8 - ring} · Position {symbol + 1}
        </span>
      </div>
    </motion.div>
  );
}

// ── Main Calendar ────────────────────────────────────────────────────
export default function AztecCalendar() {
  const [rotations, setRotations] = useState<number[]>(Array(8).fill(0));
  const [activeSymbol, setActiveSymbol] = useState<{
    ring: number;
    symbol: number;
  } | null>(null);
  const [corePulse, setCorePulse] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const animFrameRef = useRef<number>(0);
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  const handleRotate = useCallback((index: number, delta: number) => {
    setAutoRotate(false);
    setRotations((prev) => {
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

  // Auto-rotate effect – slow, stone-grinding feel
  useEffect(() => {
    let prevTime = performance.now();
    const speeds = [0.04, -0.03, 0.05, -0.035, 0.025, -0.045, 0.035, -0.02];

    const animate = (time: number) => {
      const dt = (time - prevTime) / 16.67;
      prevTime = time;
      if (autoRotateRef.current) {
        setRotations((prev) =>
          prev.map((r, i) => r + speeds[i] * dt)
        );
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <div className="aztec-calendar-container">
      <h1 className="aztec-title">
        <span className="title-glyph">&#x2726;</span>
        Tonalpohualli
        <span className="title-glyph">&#x2726;</span>
      </h1>
      <p className="aztec-subtitle">Sacred Aztec Calendar · Drag rings to rotate</p>

      <div className="calendar-wrapper">
        <svg
          viewBox="0 0 1000 1000"
          className="aztec-svg"
          style={{ touchAction: "none" }}
        >
          <defs>
            {/* Stone texture filter */}
            <filter id="stoneTexture" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.65"
                numOctaves="4"
                stitchTiles="stitch"
                result="noise"
              />
              <feColorMatrix
                in="noise"
                type="saturate"
                values="0"
                result="grayNoise"
              />
              <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="textured" />
              <feComposite in="textured" in2="SourceGraphic" operator="in" />
            </filter>

            {/* Carved glow for active symbols */}
            <filter id="carvedGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Bevel/emboss for overall stone look */}
            <filter id="stoneBevel" x="-2%" y="-2%" width="104%" height="104%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
              <feOffset in="blur" dx="-1" dy="-1" result="lightOffset" />
              <feOffset in="blur" dx="1" dy="1" result="shadowOffset" />
              <feFlood floodColor="#C4A882" floodOpacity="0.3" result="lightColor" />
              <feFlood floodColor="#1a1008" floodOpacity="0.4" result="shadowColor" />
              <feComposite in="lightColor" in2="lightOffset" operator="in" result="light" />
              <feComposite in="shadowColor" in2="shadowOffset" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="light" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Core gradients */}
            <radialGradient id="coreInnerGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4A3D2F" />
              <stop offset="100%" stopColor="#2A1F15" />
            </radialGradient>

            {/* Overall stone disc background */}
            <radialGradient id="stoneDiscGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4A4038" stopOpacity={0.15} />
              <stop offset="70%" stopColor="#2A2420" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#000" stopOpacity={0} />
            </radialGradient>

            {/* Crack pattern */}
            <filter id="cracks" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="turbulence" baseFrequency="0.015" numOctaves="2" result="crack" />
              <feColorMatrix in="crack" type="matrix"
                values="0 0 0 0 0.15
                        0 0 0 0 0.12
                        0 0 0 0 0.08
                        0 0 0 -2.5 1.2"
                result="crackColor" />
              <feComposite in="crackColor" in2="SourceGraphic" operator="in" />
            </filter>
          </defs>

          {/* Stone disc background */}
          <circle cx={CENTER} cy={CENTER} r={490} fill="url(#stoneDiscGradient)" />

          {/* Weathered outer edge */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={488}
            fill="none"
            stroke="#6B5B4F"
            strokeWidth={3}
            opacity={0.25}
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={486}
            fill="none"
            stroke="#3D3229"
            strokeWidth={1}
            opacity={0.4}
          />

          {/* Surface cracks overlay */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={485}
            fill="#2a2018"
            opacity={0.15}
            filter="url(#cracks)"
          />

          {/* Rings – outer to inner */}
          {Array.from({ length: 8 }).map((_, i) => (
            <Ring
              key={i}
              index={i}
              rotation={rotations[i]}
              onRotate={handleRotate}
              activeSymbol={activeSymbol}
              onSymbolClick={handleSymbolClick}
            />
          ))}

          {/* Core */}
          <Core pulse={corePulse} />
        </svg>
      </div>

      {/* Symbol info tooltip */}
      <AnimatePresence>
        {activeSymbol && (
          <SymbolTooltip ring={activeSymbol.ring} symbol={activeSymbol.symbol} />
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="controls">
        <button
          className={`control-btn ${autoRotate ? "active" : ""}`}
          onClick={() => setAutoRotate(!autoRotate)}
        >
          {autoRotate ? "⏸ Pause" : "▶ Auto-Rotate"}
        </button>
        <button
          className="control-btn"
          onClick={() => setRotations(Array(8).fill(0))}
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}
