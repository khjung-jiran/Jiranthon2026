// 오디오 재생 훅 - expo-av 기반

import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

export function useAudioPlayer() {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const play = useCallback(async (uri: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setLoading(true);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlaying(false);
          }
        },
      );

      soundRef.current = sound;
      setPlaying(true);
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      throw new Error(`재생 실패: ${e.message}`);
    }
  }, []);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setPlaying(false);
  }, []);

  return { playing, loading, play, stop };
}
