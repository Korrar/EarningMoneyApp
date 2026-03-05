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

// Ring color palette – deep Aztec tones
const RING_COLORS = [
  { base: "#8B4513", glow: "#CD853F", accent: "#FFD700" }, // outer - Saddle Brown
  { base: "#2F4F4F", glow: "#5F9EA0", accent: "#00CED1" }, // Dark Slate
  { base: "#800020", glow: "#DC143C", accent: "#FF6347" }, // Burgundy
  { base: "#1B3F2F", glow: "#228B22", accent: "#00FF7F" }, // Forest
  { base: "#4A0E4E", glow: "#8B008B", accent: "#DA70D6" }, // Purple
  { base: "#8B0000", glow: "#FF4500", accent: "#FF8C00" }, // Dark Red
  { base: "#003153", glow: "#4169E1", accent: "#87CEEB" }, // Prussian Blue
  { base: "#554400", glow: "#B8860B", accent: "#FFD700" }, // inner - Dark Gold
];

const CORE_COLOR = { base: "#1a0a00", glow: "#FFD700", accent: "#FFA500" };

// ── Helpers ──────────────────────────────────────────────────────────
const CENTER = 500;
const RING_GAP = 4;

function getRingRadii(ringIndex: number) {
  // Ring 0 is outermost, ring 7 is innermost
  const outerMax = 480;
  const coreRadius = 70;
  const usable = outerMax - coreRadius;
  const ringWidth = (usable - RING_GAP * 8) / 8;
  const outer = outerMax - ringIndex * (ringWidth + RING_GAP);
  const inner = outer - ringWidth;
  return { outer, inner, mid: (outer + inner) / 2, width: ringWidth };
}

function getSymbolsForRing(ringIndex: number): (keyof typeof AZTEC_SYMBOLS)[] {
  // Each ring has different number of symbols
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
      isDragging.current = true;
      lastAngle.current = getAngle(e.clientX, e.clientY);
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [getAngle]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const currentAngle = getAngle(e.clientX, e.clientY);
      let delta = currentAngle - lastAngle.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      lastAngle.current = currentAngle;
      onRotate(index, delta);
    },
    [getAngle, index, onRotate]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Decorative ring border pattern
  const dashArray = `${(Math.PI * 2 * outer) / (symbols.length * 2)} ${
    (Math.PI * 2 * outer) / (symbols.length * 2)
  }`;

  return (
    <g
      ref={ringRef}
      style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${CENTER}px ${CENTER}px` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="aztec-ring"
    >
      {/* Ring background */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={mid}
        fill="none"
        stroke={colors.base}
        strokeWidth={width}
        opacity={0.85}
        className="ring-bg"
      />

      {/* Outer decorative border */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={outer - 1}
        fill="none"
        stroke={colors.glow}
        strokeWidth={2}
        opacity={0.6}
        strokeDasharray={dashArray}
      />

      {/* Inner decorative border */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={inner + 1}
        fill="none"
        stroke={colors.glow}
        strokeWidth={1.5}
        opacity={0.4}
      />

      {/* Symbols */}
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
            {/* Symbol glow background */}
            <circle
              r={14}
              fill={isActive ? colors.accent : "transparent"}
              opacity={isActive ? 0.3 : 0}
              className="symbol-glow"
            />
            <path
              d={AZTEC_SYMBOLS[symbolKey]}
              fill={isActive ? colors.accent : colors.glow}
              opacity={isActive ? 1 : 0.7}
              stroke={isActive ? "#fff" : colors.accent}
              strokeWidth={isActive ? 1 : 0.5}
              className="symbol-path"
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
      {/* Core glow */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={68}
        fill="url(#coreGradient)"
        className={`core-glow ${pulse ? "pulsing" : ""}`}
      />
      {/* Core ring */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={60}
        fill="url(#coreInnerGradient)"
        stroke={CORE_COLOR.glow}
        strokeWidth={3}
      />
      {/* Tonatiuh face – central sun */}
      <g transform={`translate(${CENTER}, ${CENTER})`} className="tonatiuh-face">
        {/* Sun rays */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (360 / 12) * i;
          const rad = (angle * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={Math.cos(rad) * 25}
              y1={Math.sin(rad) * 25}
              x2={Math.cos(rad) * 45}
              y2={Math.sin(rad) * 45}
              stroke={CORE_COLOR.glow}
              strokeWidth={2}
              opacity={0.8}
              className="sun-ray"
            />
          );
        })}
        {/* Face circle */}
        <circle r={22} fill={CORE_COLOR.base} stroke={CORE_COLOR.glow} strokeWidth={2} />
        {/* Eyes */}
        <circle cx={-7} cy={-5} r={4} fill={CORE_COLOR.glow} className="eye" />
        <circle cx={7} cy={-5} r={4} fill={CORE_COLOR.glow} className="eye" />
        <circle cx={-7} cy={-5} r={2} fill={CORE_COLOR.base} />
        <circle cx={7} cy={-5} r={2} fill={CORE_COLOR.base} />
        {/* Mouth */}
        <path
          d="M-8,6 Q-4,12 0,8 Q4,12 8,6"
          fill="none"
          stroke={CORE_COLOR.glow}
          strokeWidth={2}
        />
        {/* Forehead decoration */}
        <path
          d="M-10,-12 L0,-18 L10,-12"
          fill="none"
          stroke={CORE_COLOR.accent}
          strokeWidth={1.5}
        />
      </g>
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
          stroke={colors.glow}
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

  // Auto-rotate effect
  useEffect(() => {
    let prevTime = performance.now();
    const speeds = [0.08, -0.06, 0.1, -0.07, 0.05, -0.09, 0.07, -0.04];

    const animate = (time: number) => {
      const dt = (time - prevTime) / 16.67; // normalize to ~60fps
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
      {/* Background particles */}
      <div className="bg-particles">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${4 + Math.random() * 6}s`,
            }}
          />
        ))}
      </div>

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
        >
          <defs>
            {/* Core gradients */}
            <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity={0.4} />
              <stop offset="70%" stopColor="#FF8C00" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#8B4513" stopOpacity={0} />
            </radialGradient>
            <radialGradient id="coreInnerGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2a1500" />
              <stop offset="100%" stopColor="#0a0400" />
            </radialGradient>
            {/* Background radial glow */}
            <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity={0.05} />
              <stop offset="50%" stopColor="#8B4513" stopOpacity={0.03} />
              <stop offset="100%" stopColor="#000" stopOpacity={0} />
            </radialGradient>
            {/* Filters */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="strongGlow">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background glow */}
          <circle cx={CENTER} cy={CENTER} r={490} fill="url(#bgGlow)" />

          {/* Outermost decorative ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={488}
            fill="none"
            stroke="#8B4513"
            strokeWidth={1}
            opacity={0.3}
            strokeDasharray="4 8"
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
