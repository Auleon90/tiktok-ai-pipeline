import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// ═══════════════════════════════════════════════════════════════════
// VideoToday.tsx — DI-GENERATE ULANG OLEH PIPELINE SETIAP RUN
//
// File ini adalah STUB. Pipeline akan menimpa file ini sepenuhnya
// dengan komposisi yang dibuat Claude berdasarkan konten hari ini.
//
// Jangan edit manual — perubahan akan hilang di run berikutnya.
//
// Claude harus mengikuti skill: tiktok-motion-generator sebelum
// generate file ini.
// ═══════════════════════════════════════════════════════════════════

export type VideoTodayProps = {
  voiceSrc: string | null;
  musicSrc: string;
  voiceSeconds: number;
};

export const VOICE_PAD_AFTER_TODAY = 1.5;

const FPS_LOCAL = 30;

export const VideoToday: React.FC<VideoTodayProps> = ({voiceSrc, musicSrc}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1008 100%)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Placeholder — Claude akan mengganti seluruh isi file ini */}
      <div
        style={{
          color: '#c8a95a',
          fontSize: 52,
          fontFamily: 'Georgia, serif',
          textAlign: 'center',
          padding: 80,
          lineHeight: 1.5,
          opacity: Math.min(1, t * 2),
        }}
      >
        Konten hari ini akan dirender di sini.
      </div>

      {/* Audio: musik latar */}
      {musicSrc ? <Audio src={staticFile(musicSrc)} volume={0.2} /> : null}

      {/* Audio: voice over */}
      {voiceSrc ? (
        <Sequence from={Math.round(0.5 * fps)}>
          <Audio src={staticFile(voiceSrc)} volume={1} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
