import React from 'react';
import {Composition, staticFile} from 'remotion';
import {getAudioDurationInSeconds} from '@remotion/media-utils';
import {Hook} from './Hook';
import {Quote, QuoteProps} from './Quote';
import {Vintage, VintageProps, VOICE_PAD_AFTER} from './Vintage';
import {VideoToday, VideoTodayProps, VOICE_PAD_AFTER_TODAY} from './VideoToday';

const FPS = 30;
const TAIL_SECONDS = 1.2; // jeda setelah suara selesai

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Hook"
        component={Hook}
        durationInFrames={150}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'Tes Render Remotion',
          subtitle: 'Motion graphic dari Claude',
          stat: 87,
        }}
      />
      <Composition
        id="Quote"
        component={Quote}
        durationInFrames={300}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            phrases: [
              'Jangan menyerah hanya karena hari ini terasa berat.',
              'Ingat, setiap langkah kecil yang kamu lakukan',
              'sedang membawamu lebih dekat menuju impianmu',
            ],
            voiceSrc: 'voiceover.wav',
            musicSrc: 'backsound.mp3',
            voiceSeconds: 10,
          } satisfies QuoteProps
        }
        calculateMetadata={async ({props}) => {
          let voiceSeconds = props.voiceSeconds;
          let voiceSrc = props.voiceSrc;
          if (voiceSrc) {
            try {
              voiceSeconds = await getAudioDurationInSeconds(
                staticFile(voiceSrc)
              );
            } catch (e) {
              // file suara belum ada: render tanpa voice over
              voiceSrc = null;
            }
          }
          return {
            durationInFrames: Math.ceil((0.4 + voiceSeconds + TAIL_SECONDS) * FPS),
            props: {...props, voiceSeconds, voiceSrc},
          };
        }}
      />
      <Composition
        id="Vintage"
        component={Vintage}
        durationInFrames={585}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            voiceSrc: 'voiceover.wav',
            musicSrc: 'backsound.mp3',
            voiceSeconds: 9.68,
          } satisfies VintageProps
        }
        calculateMetadata={async ({props}) => {
          let voiceSeconds = props.voiceSeconds;
          let voiceSrc = props.voiceSrc;
          if (voiceSrc) {
            try {
              voiceSeconds = await getAudioDurationInSeconds(staticFile(voiceSrc));
            } catch (e) {
              voiceSrc = null;
            }
          }
          return {
            durationInFrames: Math.ceil((0.5 + voiceSeconds + VOICE_PAD_AFTER) * FPS),
            props: {...props, voiceSeconds, voiceSrc},
          };
        }}
      />
      <Composition
        id="VideoToday"
        component={VideoToday}
        durationInFrames={600}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            voiceSrc: 'voiceover.wav',
            musicSrc: 'backsound.mp3',
            voiceSeconds: 20,
          } satisfies VideoTodayProps
        }
        calculateMetadata={async ({props}) => {
          let voiceSeconds = props.voiceSeconds;
          let voiceSrc = props.voiceSrc;
          if (voiceSrc) {
            try {
              voiceSeconds = await getAudioDurationInSeconds(staticFile(voiceSrc));
            } catch (e) {
              voiceSrc = null;
            }
          }
          return {
            durationInFrames: Math.ceil((0.5 + voiceSeconds + VOICE_PAD_AFTER_TODAY) * FPS),
            props: {...props, voiceSeconds, voiceSrc},
          };
        }}
      />
    </>
  );
};
