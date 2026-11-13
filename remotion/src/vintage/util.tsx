import React, {useId} from 'react';
import {Easing, interpolate} from 'remotion';

export const INK = '#2E2115';
export const INK2 = '#5B4634';
export const RUST = '#9A3B22';
export const GOLD = '#B8862B';
export const PAPER = '#EFE4CC';

export type Pt = [number, number];

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const ramp = (
  t: number,
  a: number,
  b: number,
  easing: (n: number) => number = Easing.inOut(Easing.cubic)
) =>
  interpolate(t, [a, b], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

/** Pseudo-random deterministik (tanpa Math.random) */
export const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Catmull-Rom: titik kontrol -> titik padat yang halus */
export const catmull = (pts: Pt[], per = 14): Pt[] => {
  const out: Pt[] = [];
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, n - 1)];
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 *
        (2 * b +
          (-a + c) * t +
          (2 * a - 5 * b + 4 * c - d) * t2 +
          (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[n - 1]);
  return out;
};

export const toPath = (pts: Pt[]) =>
  pts
    .map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(' ');

/** Garis yang "digambar" pelan-pelan (progress 0..1) */
export const Stroke: React.FC<{
  d: string;
  p: number;
  w?: number;
  color?: string;
  fill?: string;
  opacity?: number;
  dash?: string;
}> = ({d, p, w = 3.4, color = INK, fill = 'none', opacity = 1, dash}) => {
  const maskId = useId().replace(/:/g, '');
  if (p <= 0) return null;
  if (dash) {
    // garis putus-putus yang muncul pelan-pelan: topeng tebal digambar progresif
    return (
      <g>
        <mask id={maskId} maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={9000} height={9000}>
          <path
            d={d}
            pathLength={1}
            fill="none"
            stroke="white"
            strokeWidth={w + 14}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1"
            strokeDashoffset={1 - clamp01(p)}
          />
        </mask>
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={w}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={dash}
          opacity={opacity}
          mask={`url(#${maskId})`}
        />
      </g>
    );
  }
  return (
    <path
      d={d}
      pathLength={1}
      fill={fill}
      stroke={color}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="1"
      strokeDashoffset={1 - clamp01(p)}
      opacity={opacity}
    />
  );
};

/** Arsiran gaya ukiran: garis-garis paralel yang dipotong bentuk (clip) */
export const Hatch: React.FC<{
  box: [number, number, number, number];
  angle: number;
  gap: number;
  p: number;
  clipId: string;
  w?: number;
  color?: string;
  opacity?: number;
  seed?: number;
}> = ({box, angle, gap, p, clipId, w = 1.5, color = INK, opacity = 0.85, seed = 1}) => {
  if (p <= 0) return null;
  const [x0, y0, x1, y1] = box;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2;
  const a = (angle * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const nx = -dy;
  const nz = dx;
  const rand = rng(seed);
  const lines: React.ReactNode[] = [];
  const N = Math.floor((2 * R) / gap);
  for (let i = 0; i <= N; i++) {
    const off = -R + i * gap + (rand() - 0.5) * gap * 0.25;
    const j = (rand() - 0.5) * 18;
    const ax = cx + nx * off - dx * (R + j);
    const ay = cy + nz * off - dy * (R + j);
    const bx = cx + nx * off + dx * (R - j);
    const by = cy + nz * off + dy * (R - j);
    const lp = clamp01(p * 1.7 - (i / N) * 0.7);
    if (lp <= 0) continue;
    lines.push(
      <line
        key={i}
        x1={ax}
        y1={ay}
        x2={bx}
        y2={by}
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - lp}
      />
    );
  }
  return (
    <g
      clipPath={`url(#${clipId})`}
      stroke={color}
      strokeWidth={w}
      strokeLinecap="round"
      opacity={opacity}
    >
      {lines}
    </g>
  );
};

/** Bingkai plat ukiran: garis ganda + sudut + keterangan Cinzel */
export const PlateFrame: React.FC<{p: number}> = ({p}) => (
  <g>
    <rect x={0} y={0} width={800} height={800} fill="rgba(255,250,236,0.5)" />
    <Stroke d="M22 22 H778 V778 H22 Z" p={p} w={5} />
    <Stroke d="M36 36 H764 V764 H36 Z" p={p} w={1.6} color={INK2} />
    {[
      [22, 22, 1, 1],
      [778, 22, -1, 1],
      [22, 778, 1, -1],
      [778, 778, -1, -1],
    ].map(([x, y, sx, sy], i) => (
      <Stroke
        key={i}
        d={`M${x + sx * 12} ${y + sy * 12} h${sx * 30} M${x + sx * 12} ${
          y + sy * 12
        } v${sy * 30}`}
        p={p}
        w={3}
        color={RUST}
      />
    ))}
  </g>
);

/** Keterangan plat di pita kertas — digambar PALING AKHIR supaya tidak tertimpa arsiran */
export const Caption: React.FC<{p: number; capP: number; text: string}> = ({
  p,
  capP,
  text,
}) => (
  <g>
    <rect x={37} y={702} width={726} height={61} fill="#F2E9D3" opacity={clamp01(p * 1.4)} />
    <Stroke d="M37 702 H763" p={p} w={1.8} color={INK2} />
    <text
      x={400}
      y={742}
      textAnchor="middle"
      fontFamily="Cinzel, serif"
      fontWeight={600}
      fontSize={30}
      letterSpacing={5}
      fill={INK}
      opacity={clamp01(capP)}
    >
      {text}
    </text>
  </g>
);

/** Sosok pengembara (kaki di titik 0,0, tinggi ±115) */
export const Traveler: React.FC<{
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  t: number;
  walk?: number;
}> = ({x, y, s = 1, flip = false, t, walk = 1}) => {
  const sw = Math.sin(t * 7) * 13 * walk;
  const bob = Math.abs(Math.sin(t * 7)) * -2.2 * walk;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <g transform={`translate(0 ${bob})`}>
        <line x1={22} y1={-72} x2={30 + sw * 0.3} y2={0} stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <rect x={-33} y={-82} width={19} height={42} rx={7} fill="#6b4f35" stroke={INK} strokeWidth={2.5} transform="rotate(-8 -24 -60)" />
        <line x1={0} y1={-24} x2={sw} y2={0} stroke={INK} strokeWidth={8} strokeLinecap="round" />
        <line x1={0} y1={-24} x2={-sw} y2={0} stroke={INK} strokeWidth={8} strokeLinecap="round" />
        <path d="M-14 -86 C-20 -58 -22 -34 -20 -22 L20 -22 C20 -42 18 -64 14 -86 Z" fill="#4a3826" stroke={INK} strokeWidth={2.5} />
        <circle cx={0} cy={-97} r={11} fill={PAPER} stroke={INK} strokeWidth={2.5} />
        <path d="M-18 -102 L18 -102 L11 -106 C8 -123 -8 -123 -11 -106 Z" fill={INK} />
      </g>
    </g>
  );
};
