import { useId } from "react";
import "./CinematicArt.css";

export type CinematicArtVariant = "poster" | "backdrop" | "hero";

export interface CinematicArtProps {
  /** Deterministic seed — the same seed always produces the same artwork. */
  seed: string;
  variant?: CinematicArtVariant;
  className?: string;
}

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRandom(seed: string): () => number {
  let s = hash(seed) || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ArtParams {
  glowX: number;
  glowY: number;
  glowOpacity: number;
  horizonY: number;
  ridges: [number, number][][];
  accentLine: boolean;
}

function artParams(seed: string): ArtParams {
  const rnd = makeRandom(seed);
  const ridges: [number, number][][] = [];
  for (let layer = 0; layer < 2; layer++) {
    const points: [number, number][] = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      points.push([
        (i + 0.5) / count + (rnd() - 0.5) * 0.12,
        layer === 0 ? 0.62 + rnd() * 0.2 : 0.78 + rnd() * 0.14,
      ]);
    }
    ridges.push(points);
  }
  return {
    glowX: 0.55 + rnd() * 0.3,
    glowY: 0.12 + rnd() * 0.28,
    glowOpacity: 0.35 + rnd() * 0.4,
    horizonY: 0.52 + rnd() * 0.18,
    ridges,
    accentLine: rnd() > 0.35,
  };
}

function ridgePath(points: [number, number][], width: number, height: number): string {
  let d = `M0,${height} `;
  points.forEach(([x, y], i) => {
    const px = x * width;
    const py = y * height;
    const prev = points[i - 1];
    const prevX = (prev?.[0] ?? 0) * width;
    const prevY = (prev?.[1] ?? y) * height;
    d += `Q ${(prevX + px) / 2},${prevY} ${px},${py} `;
  });
  d += `L${width},${height} Z`;
  return d;
}

/**
 * Original procedural "poster" artwork: dark gradients, soft amber lighting,
 * layered ridge silhouettes, subtle vignette. Deterministic per seed —
 * no external images, no copied posters, no hotlinked artwork.
 *
 * Purely decorative: always rendered with aria-hidden by consumers.
 */
export function CinematicArt({ seed, variant = "poster", className }: CinematicArtProps) {
  const p = artParams(seed);
  const gradientId = useId();

  const classes = ["zs-art", `zs-art--${variant}`, className].filter(Boolean).join(" ");

  return (
    <div
      className={classes}
      style={
        {
          "--zs-art-glow-x": `${p.glowX * 100}%`,
          "--zs-art-glow-y": `${p.glowY * 100}%`,
          "--zs-art-glow-o": p.glowOpacity,
        } as React.CSSProperties
      }
    >
      <svg className="zs-art__scene" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(242, 194, 102, 0.9)" />
            <stop offset="100%" stopColor="rgba(242, 194, 102, 0)" />
          </radialGradient>
        </defs>
        {p.accentLine && (
          <line x1="0" x2="100" y1={p.horizonY * 100} y2={p.horizonY * 100} stroke="rgba(232, 179, 75, 0.28)" strokeWidth="0.3" />
        )}
        <circle
          cx={p.glowX * 100}
          cy={p.glowY * 100}
          r={variant === "hero" ? 14 : 9}
          fill={`url(#${gradientId})`}
          opacity={p.glowOpacity}
        />
        {p.ridges.map((ridge, i) => (
          <path
            key={i}
            d={ridgePath(ridge, 100, 100)}
            fill={i === 0 ? "rgba(28, 28, 33, 0.85)" : "rgb(11, 11, 13)"}
          />
        ))}
      </svg>
      <div className="zs-art__shade" aria-hidden="true" />
    </div>
  );
}