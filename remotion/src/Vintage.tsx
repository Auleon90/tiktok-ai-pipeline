import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Plate1, Plate2, Plate3} from './vintage/Plates';
import {INK, PAPER, RUST, Stroke, ramp} from './vintage/util';

export type VintageProps = {
  voiceSrc: string | null;
  musicSrc: string;
  voiceSeconds: number;
};

/* ---- waktu (detik, absolut). Suara mulai di V0. Batas kalimat dari silencedetect:
   kalimat 1: 0.0–4.71 | pause 4.71–5.39 | kalimat 2: 5.39–8.71 | pause 8.71–9.34
   kalimat 3: 9.34–13.41 | pause 13.41–13.95 | kalimat 4: 13.95–17.36 ---- */
const V0 = 0.5;
export const VOICE_PAD_AFTER = 1.6;

const SERIF = '"Playfair Display", Georgia, serif';
const GARAMOND = '"EB Garamond", Georgia, serif';

const useFonts = () => {
  const [handle] = useState(() => delayRender('memuat font vintage'));
  useEffect(() => {
    const defs: [string, string, FontFaceDescriptors][] = [
      ['Playfair Display', 'fonts/playfair-display-latin-900-normal.woff2', {weight: '900'}],
      ['EB Garamond', 'fonts/eb-garamond-latin-500-italic.woff2', {weight: '500', style: 'italic'}],
      ['Cinzel', 'fonts/cinzel-latin-600-normal.woff2', {weight: '600'}],
    ];
    Promise.all(
      defs.map(([name, file, d]) =>
        new FontFace(name, `url(${staticFile(file)})`, d).load()
      )
    )
      .then((faces) => {
        faces.forEach((f) => document.fonts.add(f));
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle]);
};

/* ---- dunia & kamera ---- */
type Cam = {x: number; y: number; z: number};
const C1 = {x: 0, y: 0};
const C2 = {x: 1150, y: 620};
const C3 = {x: 150, y: 1380};
const ROT = [-1.4, 1.1, -0.8];
const sin = Easing.inOut(Easing.sin);
const cubicIO = Easing.inOut(Easing.cubic);
const cubicOut = Easing.out(Easing.cubic);

const MOVES: {t0: number; t1: number; to: Cam; ease: (n: number) => number; dip?: number}[] = [
  // Plat I: Bersyukur (kalimat 1 & 2: 0–8.71s)
  {t0: 0,   t1: 3.0,  to: {...C1, z: 1.0},  ease: cubicOut},
  {t0: 3.0, t1: 4.5,  to: {...C1, z: 1.05}, ease: sin},
  // push ke Plat II saat pause kalimat 2 (4.71–5.39)
  {t0: 4.5, t1: 6.0,  to: {...C2, z: 1.12}, ease: cubicIO, dip: 0.2},
  {t0: 6.0, t1: 8.5,  to: {...C2, z: 1.0},  ease: cubicOut},
  // push ke Plat III saat pause kalimat 3 (8.71–9.34)
  {t0: 8.5, t1: 9.2,  to: {...C2, z: 1.04}, ease: sin},
  {t0: 9.2, t1: 10.5, to: {...C3, z: 1.12}, ease: cubicIO, dip: 0.2},
  {t0: 10.5,t1: 13.0, to: {...C3, z: 1.0},  ease: cubicOut},
  {t0: 13.0,t1: 17.5, to: {...C3, z: 1.09}, ease: sin},
];

const camAt = (t: number): Cam => {
  let cur: Cam = {x: C1.x - 170, y: C1.y - 250, z: 1.7};
  for (const m of MOVES) {
    if (t >= m.t1) {
      cur = m.to;
      continue;
    }
    if (t > m.t0) {
      const p = ramp(t, m.t0, m.t1, m.ease);
      const z = cur.z + (m.to.z - cur.z) * p;
      return {
        x: cur.x + (m.to.x - cur.x) * p,
        y: cur.y + (m.to.y - cur.y) * p,
        z: z * (1 - (m.dip ?? 0) * Math.sin(Math.PI * p)),
      };
    }
    break;
  }
  return cur;
};

const PAPER_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.012' numOctaves='4' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 .55 0 0 0 0 .42 0 0 0 0 .25 0 0 0 .35 0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)'/%3E%3C/svg%3E\"),url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .35 0 0 0 0 .28 0 0 0 0 .2 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E\")";

/* ---- teks ---- */
type Phrase = {
  tokens: string[];
  hi: number[];
  start: number;
  end: number;
  font: string;
  italic?: boolean;
  size: number;
  dir: 'up' | 'left' | 'pop';
  top: number;
  align: 'flex-start' | 'center' | 'flex-end';
  hiColor?: string;
  unsayAt?: number;
  /** jeda nyata di suara: token [0,idx) dibagi di [start,endA], sisanya di [startB,end] */
  split?: {idx: number; endA: number; startB: number};
};

const tokenTimes = (ph: Phrase): number[] => {
  const w = ph.tokens.map((x) => x.length + 1);
  const dist = (from: number, to: number, a: number, b: number) => {
    const sum = w.slice(from, to).reduce((n, x) => n + x, 0);
    let acc = 0;
    const out: number[] = [];
    for (let i = from; i < to; i++) {
      out.push(a + (acc / sum) * (b - a) - 0.04);
      acc += w[i];
    }
    return out;
  };
  if (!ph.split) return dist(0, w.length, ph.start, Math.max(ph.start + 0.5, ph.end - 0.25));
  const {idx, endA, startB} = ph.split;
  return [
    ...dist(0, idx, ph.start, endA - 0.2),
    ...dist(idx, w.length, startB, Math.max(startB + 0.3, ph.end - 0.25)),
  ];
};

// Script: "Bersyukurlah hari ini, sebab nikmat Allah tidak pernah berhenti mengalir."
// kalimat 1: V0+0.0 – V0+4.21 (pause di V0+4.21)
// "Setiap nafas yang kamu hirup adalah bukti kasih sayang-Nya."
// kalimat 2: V0+4.89 – V0+8.21 (pause di V0+8.21)
// "Maka jangan biarkan kesibukan dunia membuatmu lupa bertafakur."
// kalimat 3: V0+8.84 – V0+12.91 (pause di V0+12.91)
// "Karena jiwa yang bersyukur adalah jiwa yang paling kaya."
// kalimat 4: V0+13.45 – V0+16.86
const PHRASES: Phrase[] = [
  // Plat I — kalimat 1: nikmat Allah
  {
    tokens: ['Bersyukurlah', 'hari ini,', 'sebab nikmat', 'Allah', 'tidak pernah', 'berhenti', 'mengalir.'],
    hi: [3],
    start: V0 + 0.1,
    end: V0 + 4.21,
    font: SERIF,
    size: 88,
    dir: 'up',
    top: 1150,
    align: 'flex-start',
    unsayAt: V0 + 4.5,
    split: {idx: 2, endA: V0 + 1.6, startB: V0 + 2.1},
  },
  // Plat II — kalimat 2: bukti kasih sayang
  {
    tokens: ['Setiap nafas', 'yang kamu hirup', 'adalah bukti', 'kasih sayang-Nya.'],
    hi: [2],
    start: V0 + 4.89,
    end: V0 + 8.21,
    font: GARAMOND,
    italic: true,
    size: 100,
    dir: 'left',
    top: 1140,
    align: 'center',
    unsayAt: V0 + 8.5,
    split: {idx: 2, endA: V0 + 6.4, startB: V0 + 6.9},
  },
  // Plat II — kalimat 3: jangan lupa bertafakur
  {
    tokens: ['Maka jangan', 'biarkan kesibukan', 'dunia', 'membuatmu lupa', 'bertafakur.'],
    hi: [4],
    start: V0 + 8.84,
    end: V0 + 12.91,
    font: SERIF,
    size: 90,
    dir: 'pop',
    top: 1300,
    align: 'center',
    hiColor: RUST,
    unsayAt: V0 + 13.2,
    split: {idx: 2, endA: V0 + 10.5, startB: V0 + 11.0},
  },
  // Plat III — kalimat 4: jiwa yang bersyukur
  {
    tokens: ['Karena jiwa', 'yang bersyukur', 'adalah jiwa', 'yang paling', 'kaya.'],
    hi: [1],
    start: V0 + 13.45,
    end: V0 + 16.86,
    font: SERIF,
    size: 96,
    dir: 'up',
    top: 1180,
    align: 'flex-end',
    split: {idx: 2, endA: V0 + 14.9, startB: V0 + 15.3},
  },
];

const blurFor = (p: number, dir: Phrase['dir']) => {
  const r = 1 - p;
  const lvl = r > 0.6 ? 3 : r > 0.3 ? 2 : r > 0.08 ? 1 : 0;
  if (!lvl) return 'none';
  return `url(#${dir === 'left' ? 'hb' : 'vb'}${lvl})`;
};

const PhraseView: React.FC<{ph: Phrase; t: number}> = ({ph, t}) => {
  const times = tokenTimes(ph);
  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        width: 900,
        top: ph.top,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: ph.align,
        columnGap: ph.size * 0.26,
        rowGap: ph.size * 0.04,
      }}
    >
      {ph.tokens.map((w, i) => {
        const at = times[i];
        const p =ramp(t, at, at + 0.5, Easing.out(Easing.cubic));
        const u = ph.unsayAt ? ramp(t, ph.unsayAt, ph.unsayAt + 0.35, Easing.in(Easing.cubic)) : 0;
        const isHi = ph.hi.includes(i);
        const h = isHi ? ramp(t, at + 0.2, at + 0.7, Easing.out(Easing.cubic)) : 0;
        const tx =
          ph.dir === 'left' ? -(1 - p) * 110 : 0;
        const ty = ph.dir === 'left' ? 0 : (1 - p) * (ph.dir === 'up' ? 80 : 30) - u * 46;
        const sc = ph.dir === 'pop' ? 0.72 + 0.28 * p : 1;
        const rot = ph.dir === 'pop' ? -4 * (1 - p) : 0;
        return (
          <span
            key={i}
            style={{
              position: 'relative',
              display: 'inline-block',
              isolation: 'isolate',
              whiteSpace: 'nowrap',
              fontFamily: ph.font,
              fontStyle: ph.italic ? 'italic' : 'normal',
              fontWeight: ph.italic ? 500 : 900,
              fontSize: ph.size,
              lineHeight: 1.02,
              letterSpacing: ph.italic ? '0' : '-0.01em',
              color: isHi && ph.hiColor ? ph.hiColor : INK,
              opacity: p * (1 - u),
              transform: `translate(${tx}px, ${ty}px) scale(${sc}) rotate(${rot}deg)`,
              filter: blurFor(p, ph.dir),
              textShadow: '0 1px 0 rgba(255,250,236,0.6)',
            }}
          >
            {isHi ? (
              <i
                style={{
                  position: 'absolute',
                  left: -8,
                  right: -8,
                  top: '58%',
                  bottom: '2%',
                  background: 'rgba(184,134,43,0.5)',
                  transform: `scaleX(${h})`,
                  transformOrigin: '0 50%',
                  zIndex: -1,
                }}
              />
            ) : null}
            {w}
          </span>
        );
      })}
    </div>
  );
};

/* ---- komposisi ---- */
export const Vintage: React.FC<VintageProps> = ({voiceSrc, musicSrc}) => {
  useFonts();
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const total = durationInFrames / fps;

  const cam = camAt(t);
  const fadeOut = interpolate(t, [total - 0.9, total], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const musicVolume = (f: number) =>
    interpolate(f, [0, 30, durationInFrames - 45, durationInFrames], [0, 0.25, 0.25, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  const plates = [
    {c: C1, r: ROT[0], el: <Plate1 t={t - 0.3} frame={frame} />},
    {c: C2, r: ROT[1], el: <Plate2 t={t - 4.0} frame={frame} />},
    {c: C3, r: ROT[2], el: <Plate3 t={t - 7.1} frame={frame} />},
  ];

  return (
    <AbsoluteFill style={{background: PAPER, opacity: 1}}>
      {/* filter global: boil tangan + blur searah */}
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          {[0, 1, 2].map((i) => (
            <filter key={i} id={`rough${i}`} x="-3%" y="-3%" width="106%" height="106%">
              <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={3 + i * 5} />
              <feDisplacementMap in="SourceGraphic" scale={3.2} />
            </filter>
          ))}
          {[1, 2, 3].map((l) => (
            <React.Fragment key={l}>
              <filter id={`vb${l}`} x="-30%" y="-60%" width="160%" height="220%">
                <feGaussianBlur stdDeviation={`0 ${l * 7}`} />
              </filter>
              <filter id={`hb${l}`} x="-60%" y="-30%" width="220%" height="160%">
                <feGaussianBlur stdDeviation={`${l * 9} 0`} />
              </filter>
            </React.Fragment>
          ))}
        </defs>
      </svg>

      <AbsoluteFill style={{opacity: fadeOut}}>
        {/* dunia: kertas + plat + jejak penghubung, digerakkan kamera */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transformOrigin: '0 0',
            transform: `translate(${540 - cam.x * cam.z}px, ${640 - cam.y * cam.z}px) scale(${cam.z})`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: -3500,
              top: -3000,
              width: 8000,
              height: 7600,
              background: PAPER,
              backgroundImage: PAPER_BG,
              backgroundSize: '800px 800px, 300px 300px',
            }}
          />
          <svg
            width={2400}
            height={2200}
            viewBox="-600 -300 2400 2200"
            style={{position: 'absolute', left: -600, top: -300, overflow: 'visible'}}
          >
            <Stroke d="M400 120 C640 120 520 600 750 600" p={ramp(t, 2.9, 4.2)} w={3.2} color={RUST} dash="3 13" />
            <Stroke d="M750 820 C620 900 720 1290 550 1320" p={ramp(t, 6.4, 7.9)} w={3.2} color={RUST} dash="3 13" />
          </svg>
          {plates.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: p.c.x - 400,
                top: p.c.y - 400,
                width: 800,
                height: 800,
                transform: `rotate(${p.r}deg)`,
                mixBlendMode: 'multiply',
              }}
            >
              {p.el}
            </div>
          ))}
        </div>

        {/* teks (di luar rig, area aman TikTok) */}
        {PHRASES.map((ph, i) => (
          <PhraseView key={i} ph={ph} t={t} />
        ))}

        {/* vinyet kertas tua */}
        <AbsoluteFill
          style={{
            pointerEvents: 'none',
            background:
              'radial-gradient(75% 62% at 50% 48%, transparent 52%, rgba(60,40,20,0.34) 100%)',
          }}
        />
        {/* butiran film bergerak */}
        <svg
          width={1080}
          height={1920}
          style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.16, pointerEvents: 'none'}}
        >
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 7} />
            <feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.18  0 0 0 0 0.1  0 0 0 1.1 0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>

      <Audio src={staticFile(musicSrc)} volume={musicVolume} />
      {voiceSrc ? (
        <Sequence from={Math.round(V0 * fps)}>
          <Audio src={staticFile(voiceSrc)} volume={1} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

