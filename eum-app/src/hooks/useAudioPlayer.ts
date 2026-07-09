import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { getApiBase } from '../api/client';

export function useAudioPlayer() {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const play = useCallback(async (url: string) => {
    if (playing) { await stop(); return; }
    try {
      setLoading(true);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const fullUrl = url.startsWith('http') ? url : `${getApiBase()}${url}`;
      const { sound } = await Audio.Sound.createAsync({ uri: fullUrl });
      soundRef.current = sound;
      setPlaying(true);
      setLoading(false);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlaying(false);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (e) {
      console.error('[useAudioPlayer] play failed:', e);
      setLoading(false);
      setPlaying(false);
    }
  }, [playing]);

  const stop = useCallback(async () => {
    const sound = soundRef.current;
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      soundRef.current = null;
    }
    setPlaying(false);
  }, []);

  return { playing, loading, play, stop };
}
