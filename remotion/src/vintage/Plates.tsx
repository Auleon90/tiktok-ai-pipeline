import React from 'react';
import {Easing} from 'remotion';
import {
  Caption,
  GOLD,
  Hatch,
  INK,
  INK2,
  PlateFrame,
  Pt,
  RUST,
  Stroke,
  Traveler,
  catmull,
  clamp01,
  ramp,
  toPath,
} from './util';

type PlateProps = {t: number; frame: number};

const boil = (frame: number) => `url(#rough${Math.floor(frame / 3) % 3})`;

/* ------------------------------------------------------------------ */
/* PLAT I — hari yang berat: awan tebal, hujan, pengembara membungkuk  */
/* ------------------------------------------------------------------ */
export const Plate1: React.FC<PlateProps> = ({t, frame}) => {
  const fp = ramp(t, 0, 0.9);
  const outline = ramp(t, 0.3, 1.9);
  const hatch = ramp(t, 1.0, 2.7);
  const cap = ramp(t, 1.5, 2.2);
  const rainP = ramp(t, 1.8, 2.6);
  const walkX = 190 + Math.max(0, t - 0.8) * 26;

  const ground =
    'M36 640 C180 585 330 620 470 585 C600 552 690 565 764 540 L764 764 L36 764 Z';
  const groundTop = 'M36 640 C180 585 330 620 470 585 C600 552 690 565 764 540';
  const cloud =
    'M120 270 C96 222 150 182 202 196 C222 140 302 128 342 168 C382 118 474 122 494 178 C552 148 624 178 618 232 C684 242 704 306 652 336 C600 366 170 366 130 322 C96 306 98 276 120 270 Z';

  return (
    <svg width={800} height={800} viewBox="0 0 800 800">
      <defs>
        <clipPath id="p1-ground">
          <path d={ground} />
        </clipPath>
        <clipPath id="p1-cloud">
          <path d={cloud} />
        </clipPath>
        <clipPath id="p1-belly">
          <rect x={0} y={262} width={800} height={140} />
        </clipPath>
        <clipPath id="p1-sky">
          <rect x={40} y={40} width={720} height={560} />
        </clipPath>
      </defs>
      <g filter={boil(frame)}>
        <PlateFrame p={fp} />

        {/* tanah */}
        <Stroke d={groundTop} p={outline} w={3.6} />
        <Hatch box={[36, 540, 764, 764]} angle={18} gap={11} p={hatch} clipId="p1-ground" seed={3} />

        {/* awan */}
        <Stroke d={cloud} p={outline} w={3.6} fill="rgba(91,70,52,0.10)" />
        <g clipPath="url(#p1-cloud)">
          <g clipPath="url(#p1-belly)">
            <Hatch box={[90, 262, 710, 380]} angle={62} gap={8} p={hatch} clipId="p1-cloud" w={1.6} seed={5} />
          </g>
        </g>
        <Stroke d="M190 232 C215 205 250 205 268 228" p={outline} w={2} color={INK2} />
        <Stroke d="M410 196 C440 170 480 176 494 204" p={outline} w={2} color={INK2} />

        {/* hujan */}
        <g clipPath="url(#p1-sky)" stroke={INK2} strokeWidth={1.9} strokeLinecap="round" opacity={0.55 * rainP}>
          {Array.from({length: 34}).map((_, i) => {
            const x0 = 130 + ((i * 23.7) % 520);
            const phase = (t * 260 + i * 61) % 280;
            const x = x0 - phase * 0.2;
            const y = 350 + phase;
            return <line key={i} x1={x} y1={y} x2={x - 5} y2={y + 26} />;
          })}
        </g>

        {/* pohon gundul */}
        <Stroke d="M640 566 C638 520 642 480 636 440" p={ramp(t, 1.2, 2.2)} w={3.4} />
        <Stroke d="M640 500 L690 462 M638 470 L600 430 M637 445 L662 405 M640 522 L600 494" p={ramp(t, 1.5, 2.6)} w={2.4} />

        {/* pengembara */}
        <g opacity={ramp(t, 0.7, 1.3)}>
          <Traveler x={walkX} y={614} s={1.05} t={t} />
        </g>
        <Caption p={fp} capP={cap} text="PLAT I · HARI YANG BERAT" />
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* PLAT II — langkah kecil: jalan berkelok, jejak kaki satu per satu    */
/* ------------------------------------------------------------------ */
const CTRL2: Pt[] = [
  [120, 728],
  [300, 705],
  [500, 668],
  [610, 610],
  [470, 585],
  [320, 550],
  [380, 510],
  [520, 480],
  [640, 440],
  [560, 410],
  [630, 375],
  [690, 335],
];
const DENSE2 = catmull(CTRL2, 16);
const PATH2 = toPath(DENSE2);
const STEPS = 26;

export const Plate2: React.FC<PlateProps> = ({t, frame}) => {
  const fp = ramp(t, 0, 0.8);
  const outline = ramp(t, 0.2, 1.5);
  const hatch = ramp(t, 0.5, 2.0);
  const cap = ramp(t, 1.2, 1.9);
  const walk = ramp(t, 0.5, 2.9, Easing.inOut(Easing.sin));
  const L = DENSE2.length;
  const idx = Math.min(L - 2, Math.floor(walk * (L - 1)));
  const pos = DENSE2[idx];
  const nxt = DENSE2[idx + 1];
  const walking = walk > 0.001 && walk < 0.999 ? 1 : 0;

  const hill =
    'M36 740 C120 620 220 520 330 470 C450 415 560 360 700 300 L764 270 L764 764 L36 764 Z';
  const hillTop = 'M36 740 C120 620 220 520 330 470 C450 415 560 360 700 300 L764 270';

  return (
    <svg width={800} height={800} viewBox="0 0 800 800">
      <defs>
        <clipPath id="p2-hill">
          <path d={hill} />
        </clipPath>
      </defs>
      <g filter={boil(frame)}>
        <PlateFrame p={fp} />

        {/* awan kecil & burung */}
        <Stroke d="M90 150 C110 122 150 122 170 146 C200 132 232 148 226 168 H100 C76 168 72 156 90 150 Z" p={outline} w={2.2} color={INK2} />
        <Stroke d="M520 190 C540 168 574 168 590 188 C614 178 640 192 634 208 H534 C514 208 508 196 520 190 Z" p={outline} w={2.2} color={INK2} />
        {[0, 1, 2].map((i) => {
          const bx = 300 + i * 70;
          const by = 120 + (i % 2) * 34;
          const f = Math.sin(t * 6 + i * 1.7) * 7;
          return (
            <path
              key={i}
              d={`M${bx} ${by} Q${bx + 12} ${by - 10 - f} ${bx + 24} ${by} Q${bx + 36} ${by - 10 - f} ${bx + 48} ${by}`}
              fill="none"
              stroke={INK}
              strokeWidth={2.4}
              strokeLinecap="round"
              opacity={ramp(t, 1.0, 1.6)}
            />
          );
        })}

        {/* bukit */}
        <Stroke d={hillTop} p={outline} w={3.6} />
        <Hatch box={[36, 270, 764, 764]} angle={-34} gap={11} p={hatch} clipId="p2-hill" seed={11} />

        {/* jalan setapak (menimpa arsiran) */}
        <g opacity={ramp(t, 0.5, 1.2)}>
          <path d={PATH2} fill="none" stroke="#F1E7D0" strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" />
          <Stroke d={PATH2} p={1} w={1.8} color={INK2} dash="7 11" />
        </g>

        {/* jejak kaki bermunculan sesuai ketukan */}
        {Array.from({length: STEPS}).map((_, k) => {
          const i = Math.floor((k / (STEPS - 1)) * (L - 2));
          const a = DENSE2[i];
          const b = DENSE2[i + 1];
          const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
          const side = k % 2 ? 1 : -1;
          const nx = -Math.sin((ang * Math.PI) / 180) * 5 * side;
          const ny = Math.cos((ang * Math.PI) / 180) * 5 * side;
          const o = ramp(t, 0.55 + k * 0.085, 0.8 + k * 0.085);
          return (
            <ellipse
              key={k}
              cx={a[0] + nx}
              cy={a[1] + ny}
              rx={9}
              ry={4.5}
              transform={`rotate(${ang} ${a[0] + nx} ${a[1] + ny})`}
              fill={RUST}
              opacity={0.9 * o}
            />
          );
        })}

        {/* pengembara menapaki jalan */}
        <g opacity={ramp(t, 0.3, 0.7)}>
          <Traveler x={pos[0]} y={pos[1] + 6} s={0.62} flip={nxt[0] < pos[0]} t={t} walk={walking} />
        </g>

        {/* bendera kecil di ujung jalan */}
        <g opacity={ramp(t, 2.6, 3.1)}>
          <line x1={690} y1={336} x2={690} y2={290} stroke={INK} strokeWidth={3} />
          <path d={`M690 290 L${722 + Math.sin(t * 5) * 3} 299 L690 310 Z`} fill={RUST} stroke={INK} strokeWidth={1.6} />
        </g>
        <Caption p={fp} capP={cap} text="PLAT II · LANGKAH KECIL" />
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* PLAT III — impian: matahari terbit di balik puncak                   */
/* ------------------------------------------------------------------ */
const star = (x: number, y: number, r: number) =>
  `M${x} ${y - r} L${x + r * 0.22} ${y - r * 0.22} L${x + r} ${y} L${x + r * 0.22} ${y + r * 0.22} L${x} ${y + r} L${x - r * 0.22} ${y + r * 0.22} L${x - r} ${y} L${x - r * 0.22} ${y - r * 0.22} Z`;

export const Plate3: React.FC<PlateProps> = ({t, frame}) => {
  const fp = ramp(t, 0, 0.8);
  const outline = ramp(t, 0.2, 1.6);
  const hatch = ramp(t, 0.8, 2.4);
  const cap = ramp(t, 1.6, 2.3);
  const sunY = 560 - 270 * ramp(t, 0.6, 4.2, Easing.out(Easing.cubic));
  const rayP = ramp(t, 1.2, 2.6);

  const mountain =
    'M36 700 L190 520 L250 575 L410 250 L490 350 L545 305 L720 540 L764 500 L764 764 L36 764 Z';
  const ridge = 'M36 700 L190 520 L250 575 L410 250 L490 350 L545 305 L720 540 L764 500';
  const sky = 'M36 36 H764 V500 L720 540 L545 305 L490 350 L410 250 L250 575 L190 520 L36 700 Z';
  const shade = 'M410 250 L490 350 L545 305 L720 540 L560 610 L430 430 Z';
  const flutter = Math.sin(t * 5) * 4;

  return (
    <svg width={800} height={800} viewBox="0 0 800 800">
      <defs>
        <clipPath id="p3-mount">
          <path d={mountain} />
        </clipPath>
        <clipPath id="p3-sky">
          <path d={sky} />
        </clipPath>
        <clipPath id="p3-shade">
          <path d={shade} />
        </clipPath>
      </defs>
      <g filter={boil(frame)}>
        <PlateFrame p={fp} />

        {/* matahari terbit (terpotong punggung gunung) */}
        <g clipPath="url(#p3-sky)">
          <circle cx={560} cy={sunY} r={70} fill={GOLD} opacity={0.3 * ramp(t, 0.5, 1.5)} />
          <circle cx={560} cy={sunY} r={70} fill="none" stroke={INK} strokeWidth={3.4} opacity={ramp(t, 0.5, 1.4)} />
          <circle cx={560} cy={sunY} r={57} fill="none" stroke={INK2} strokeWidth={1.6} opacity={ramp(t, 0.7, 1.6)} />
          {Array.from({length: 30}).map((_, i) => {
            const a = ((i * 12 + t * 5) * Math.PI) / 180;
            const r0 = 92;
            const r1 = 120 + (i % 2) * 36 + Math.sin(t * 3 + i) * 6;
            const d = `M${560 + Math.cos(a) * r0} ${sunY + Math.sin(a) * r0} L${560 + Math.cos(a) * r1} ${sunY + Math.sin(a) * r1}`;
            return <Stroke key={i} d={d} p={clamp01(rayP * 1.5 - i * 0.02)} w={2.2} color={i % 2 ? INK2 : INK} />;
          })}
        </g>

        {/* bintang */}
        {[
          [140, 170, 14],
          [330, 112, 10],
          [680, 150, 12],
        ].map(([x, y, r], i) => (
          <path
            key={i}
            d={star(x, y, r * (0.85 + 0.2 * Math.sin(t * 3 + i * 2)))}
            fill={GOLD}
            stroke={INK}
            strokeWidth={1.4}
            opacity={ramp(t, 1.8 + i * 0.25, 2.4 + i * 0.25)}
          />
        ))}

        {/* gunung */}
        <Stroke d={ridge} p={outline} w={3.8} fill="rgba(91,70,52,0.06)" />
        <Hatch box={[36, 250, 764, 764]} angle={58} gap={13} p={hatch} clipId="p3-mount" opacity={0.55} seed={21} />
        <Hatch box={[410, 250, 764, 620]} angle={50} gap={6} p={hatch} clipId="p3-shade" w={1.5} seed={23} />
        <Stroke d="M250 575 L330 470 M190 520 L230 560" p={outline} w={2} color={INK2} />

        {/* bendera di puncak */}
        <g opacity={ramp(t, 2.2, 2.9)}>
          <line x1={410} y1={252} x2={410} y2={196} stroke={INK} strokeWidth={3.4} />
          <path d={`M410 196 L${452 + flutter} 207 L410 220 Z`} fill={RUST} stroke={INK} strokeWidth={1.8} />
        </g>

        {/* jalan putus-putus menuju puncak */}
        <Stroke d="M135 600 L190 524 L250 575 L410 256" p={ramp(t, 2.0, 3.4)} w={2.8} color={RUST} dash="3 11" />

        {/* pengembara menatap puncak */}
        <g opacity={ramp(t, 1.0, 1.7)}>
          <Traveler x={112} y={612} s={0.72} t={t} walk={0} />
        </g>
        <Caption p={fp} capP={cap} text="PLAT III · MENUJU IMPIAN" />
      </g>
    </svg>
  );
};

