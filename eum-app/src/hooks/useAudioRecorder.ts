import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

export interface RecordingResult {
  uri: string;
  durationSecs: number;
}

export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [durationSecs, setDurationSecs] = useState(0);
  const [uri, setUri] = useState<string | null>(null);
  const recRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) return null;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recRef.current = rec;
      setRecording(true);
      setDurationSecs(0);
      setUri(null);
      timerRef.current = setInterval(() => setDurationSecs((s) => s + 1), 1000);
      return rec;
    } catch (e) {
      console.error('[useAudioRecorder] start failed:', e);
      return null;
    }
  }, []);

  const stop = useCallback(async (): Promise<RecordingResult | null> => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const rec = recRef.current;
    if (!rec) return null;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recRef.current = null;
      setRecording(false);
      setUri(uri);
      return { uri: uri ?? '', durationSecs: durationSecs };
    } catch (e) {
      console.error('[useAudioRecorder] stop failed:', e);
      setRecording(false);
      return null;
    }
  }, [durationSecs]);

  const reset = useCallback(() => {
    setRecording(false);
    setDurationSecs(0);
    setUri(null);
  }, []);

  return { recording, durationSecs, uri, start, stop, reset };
}
