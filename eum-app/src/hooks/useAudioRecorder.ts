import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export interface RecordingResult {
  uri: string;
  durationSecs: number;
}

// ponytail: HTTP(비보안 컨텍스트)에서는 navigator.mediaDevices가 undefined.
// 폴백으로 <input type="file" accept="audio/*"> 를 사용해 녹음 파일을 가져온다.
function pickAudioFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = () => {
      const file = input.files?.[0];
      resolve(file ? URL.createObjectURL(file) : null);
    };
    input.click();
  });
}

// ponytail: 웹에서는 expo-av Audio.Recording이 동작하지 않으므로 MediaRecorder를 사용.
// 네이티브(iOS/Android)에서는 기존대로 expo-av를 사용한다.
export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [durationSecs, setDurationSecs] = useState(0);
  const [uri, setUri] = useState<string | null>(null);
  const recRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const webMediaRef = useRef<MediaRecorder | null>(null);
  const webChunksRef = useRef<Blob[]>([]);
  const webStreamRef = useRef<MediaStream | null>(null);

  // 잔여 웹 스트림/타이머 정리
  const cleanupWeb = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (webMediaRef.current) {
      try { webMediaRef.current.state !== 'inactive' && webMediaRef.current.stop(); } catch { /* ignore */ }
      webMediaRef.current = null;
    }
    if (webStreamRef.current) {
      webStreamRef.current.getTracks().forEach((t) => t.stop());
      webStreamRef.current = null;
    }
  }, []);

  // 언마운트 시 정리
  useEffect(() => () => { cleanupWeb(); }, [cleanupWeb]);

  const start = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        // 이전 잔여 스트림 정리 — 안 하면 마이크가 점유된 채로 남아 NotFoundError
        cleanupWeb();
        if (!navigator.mediaDevices?.getUserMedia) {
          // HTTP 폴백: 파일 선택기로 오디오 파일 업로드
          console.warn('[useAudioRecorder] mediaDevices 없음 — 파일 업로드 폴백');
          const fileUri = await pickAudioFile();
          if (!fileUri) return null;
          setUri(fileUri);
          return { uri: fileUri } as any;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        webStreamRef.current = stream;
        const mr = new MediaRecorder(stream);
        webChunksRef.current = [];
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) webChunksRef.current.push(e.data);
        };
        mr.start();
        webMediaRef.current = mr;
        setRecording(true);
        setDurationSecs(0);
        setUri(null);
        timerRef.current = setInterval(() => setDurationSecs((s) => s + 1), 1000);
        return mr;
      }
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
      // 실패 시 잔여 스트림 정리
      if (Platform.OS === 'web') cleanupWeb();
      return null;
    }
  }, [cleanupWeb]);

  const stop = useCallback(async (): Promise<RecordingResult | null> => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (Platform.OS === 'web') {
      const mr = webMediaRef.current;
      if (!mr) return null;
      const stopped: Promise<RecordingResult> = new Promise((resolve) => {
        mr.onstop = () => {
          const blob = new Blob(webChunksRef.current, { type: 'audio/webm' });
          const blobUri = URL.createObjectURL(blob);
          webMediaRef.current = null;
          // 마이크 track 정리 — 안 하면 디바이스가 점유된 채로 남아 재시도 시 NotFoundError
          if (webStreamRef.current) {
            webStreamRef.current.getTracks().forEach((t) => t.stop());
            webStreamRef.current = null;
          }
          setRecording(false);
          setUri(blobUri);
          resolve({ uri: blobUri, durationSecs: durationSecs });
        };
      });
      mr.stop();
      return stopped;
    }
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
