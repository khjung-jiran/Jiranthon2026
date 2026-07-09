// 오디오 녹음 훅 - expo-av 기반

import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export type RecorderState = 'idle' | 'recording' | 'stopped';

export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [uri, setUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const requestPermission = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  };

  const startRecording = useCallback(async () => {
    try {
      const granted = await requestPermission();
      if (!granted) {
        throw new Error('마이크 권한이 필요합니다');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      recordingRef.current = recording;
      setState('recording');
      setUri(null);
      setDuration(0);
    } catch (e: any) {
      throw new Error(`녹음 시작 실패: ${e.message}`);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return null;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const status = recordingRef.current.getStatusAsync();
      setUri(uri);
      setState('stopped');
      recordingRef.current = null;
      return uri;
    } catch (e: any) {
      throw new Error(`녹음 중지 실패: ${e.message}`);
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setUri(null);
    setDuration(0);
  }, []);

  return { state, uri, duration, startRecording, stopRecording, reset };
}
