import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { getApiBase } from '../../api/client';

import { ScreenContainer, EqBars, Icon } from '../../components';
import { colors, fonts, radius } from '../../theme';
import { useStore } from '../../store/useStore';

const CATEGORY_LABELS: Record<string, string> = {
  childhood: '유년기',
  youth: '청년시절',
  twilight: '황혼기',
};

export function ResponseListScreen() {
  const questions = useStore((s) => s.questions);
  const autoTranslate = useStore((s) => s.settings.autoTranslate);
  const translatedIds = useStore((s) => s.translatedIds);
  const toggleTranslate = useStore((s) => s.toggleTranslate);

  const answered = questions.filter((q) => q.status === 'answered');

  const [playingAnswer, setPlayingAnswer] = useState<number | null>(null);
  const [progress, setProgress] = useState(0); // 0~1
  const [durationMs, setDurationMs] = useState(0);
  const durationRef = useRef(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  const trackWidthRef = useRef(0);

  useEffect(() => () => {
    soundRef.current?.unloadAsync();
    webAudioRef.current?.pause();
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (Platform.OS === 'web') {
          webAudioRef.current?.pause();
          webAudioRef.current = null;
        } else {
          soundRef.current?.stopAsync();
          soundRef.current?.unloadAsync();
          soundRef.current = null;
        }
        setPlayingAnswer(null);
        setProgress(0);
        progressAnim.setValue(0);
      };
    }, [progressAnim]),
  );

  const stopPlayback = async () => {
    if (Platform.OS === 'web') {
      webAudioRef.current?.pause();
      webAudioRef.current = null;
    } else {
      await soundRef.current?.stopAsync();
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
    }
    setPlayingAnswer(null);
    setProgress(0);
    setDurationMs(0);
    progressAnim.setValue(0);
  };

  const playAnswer = async (id: number, audioUrl?: string) => {
    if (playingAnswer === id) { await stopPlayback(); return; }
    await stopPlayback();
    if (!audioUrl) return;

    const filename = audioUrl.split('/').pop() ?? audioUrl;
    const url = audioUrl.startsWith('http') ? audioUrl : `${getApiBase()}/api/audio/${filename}`;
    await playUrl(id, url);
  };

  const playUrl = async (id: number, url: string) => {
    setProgress(0);
    setDurationMs(0);
    progressAnim.setValue(0);
    if (Platform.OS === 'web') {
      const audio = new (window as any).Audio(url);
      webAudioRef.current = audio;
      audio.onloadedmetadata = () => {
        const dur = audio.duration * 1000;
        setDurationMs(dur);
        durationRef.current = dur;
        if (pendingSeekRef.current !== null && audio.duration > 0) {
          audio.currentTime = pendingSeekRef.current * audio.duration;
          pendingSeekRef.current = null;
        }
      };
      audio.ontimeupdate = () => {
        if (audio.duration > 0) {
          const r = audio.currentTime / audio.duration;
          setProgress(r);
          Animated.timing(progressAnim, { toValue: r, duration: 300, useNativeDriver: false }).start();
        }
      };
      audio.onended = () => { setPlayingAnswer(null); setProgress(0); progressAnim.setValue(0); };
      audio.onpause = () => setPlayingAnswer(null);
      setPlayingAnswer(id);
      await audio.play();
    } else {
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync({ uri: url });
        soundRef.current = sound;
        setPlayingAnswer(id);
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          if (status.durationMillis) { setDurationMs(status.durationMillis); durationRef.current = status.durationMillis; }
          if (status.durationMillis && status.durationMillis > 0) {
            if (pendingSeekRef.current !== null) {
              const pos = pendingSeekRef.current * status.durationMillis;
              sound.setPositionAsync(pos);
              pendingSeekRef.current = null;
            }
            const r = status.positionMillis / status.durationMillis;
            setProgress(r);
            Animated.timing(progressAnim, { toValue: r, duration: 300, useNativeDriver: false }).start();
          }
          if (status.didJustFinish) { setPlayingAnswer(null); setProgress(0); progressAnim.setValue(0); sound.unloadAsync(); soundRef.current = null; }
        });
      } catch (e) { console.warn('[ResponseList] playback failed:', e); }
    }
  };

  const seekTo = useCallback(async (ratio: number) => {
    const clamped = Math.max(0, Math.min(1, ratio));
    setProgress(clamped);
    progressAnim.setValue(clamped);
    const dur = durationRef.current;
    if (Platform.OS === 'web' && webAudioRef.current && dur > 0) {
      webAudioRef.current.currentTime = clamped * (dur / 1000);
    } else if (soundRef.current && dur > 0) {
      await soundRef.current.setPositionAsync(clamped * dur);
    }
  }, [progressAnim]);

  const pendingSeekRef = useRef<number | null>(null);

  const onTrackPress = (e: { locationX: number; locationY: number }, id: number, audioUrl?: string) => {
    if (trackWidthRef.current === 0) return;
    const ratio = Math.max(0, Math.min(1, e.locationX / trackWidthRef.current));
    if (playingAnswer === id && durationRef.current > 0) {
      seekTo(ratio);
    } else if (audioUrl) {
      pendingSeekRef.current = ratio;
      playAnswer(id, audioUrl);
    }
  };

  return (
    <ScreenContainer edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>부모님의 답변</Text>
        <Text style={styles.title}>받은 이야기</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {answered.map((a) => {
          const showEn = !!a.transcriptEn && (autoTranslate || translatedIds.includes(a.id));
          const showEnBtn = !!a.transcriptEn && !autoTranslate;
          const enLabel = translatedIds.includes(a.id) ? '원문만 보기' : '영어로 보기';
          const playing = playingAnswer === a.id;

          return (
            <View key={a.id} style={styles.card}>
              <Text style={styles.cardQ}>Q. {a.text}</Text>
              <Text style={styles.transcript}>"{a.transcript}"</Text>

              {showEn ? <Text style={styles.transcriptEn}>{a.transcriptEn}</Text> : null}

              {showEnBtn ? (
                <Pressable style={styles.enBtn} onPress={() => toggleTranslate(a.id)}>
                  <Icon name="translate" size={15} color={colors.textMuted} />
                  <Text style={styles.enBtnText}>{enLabel}</Text>
                </Pressable>
              ) : null}

              {a.audioUrl ? (
                <View style={styles.playBtn}>
                  <Pressable onPress={() => playAnswer(a.id, a.audioUrl)}>
                    <Icon name={playing ? 'pause_circle' : 'play_circle'} size={30} color={colors.accent} />
                  </Pressable>
                  <View style={styles.playTrackWrap}>
                    {playing ? (
                      <View style={styles.eqRow} pointerEvents="none">
                        <EqBars color={colors.accent} active count={5} />
                      </View>
                    ) : null}
                    <Pressable
                      style={styles.playTrackPressable}
                      onLayout={(e) => { trackWidthRef.current = e.nativeEvent.layout.width; }}
                      onPress={(e) => onTrackPress(e.nativeEvent, a.id, a.audioUrl)}
                    >
                      <View style={styles.playTrack} />
                      {playing ? (
                        <Animated.View style={[styles.playTrackFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                      ) : null}
                    </Pressable>
                  </View>
                  <Text style={styles.playDur}>{a.dur}</Text>
                </View>
              ) : null}

              <View style={styles.eraRow}>
                <Icon name="auto_stories" size={17} color={colors.olive} />
                <Text style={styles.eraText}>이야기책 · {CATEGORY_LABELS[a.category ?? 'twilight']}에 담겼어요</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  header: { paddingTop: 20, paddingHorizontal: 24, paddingBottom: 12 },
  eyebrow: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.blue, letterSpacing: 0.4 },
  title: { fontFamily: fonts.extraBold, fontSize: 26, color: colors.text, marginTop: 5, letterSpacing: -0.5 },

  list: { paddingTop: 6, paddingHorizontal: 22, paddingBottom: 26, gap: 14 },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border3,
    borderRadius: radius.r20,
    padding: 20,
    gap: 14,
  },
  cardQ: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  transcript: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 27, color: colors.text2 },
  transcriptEn: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    borderLeftWidth: 3,
    borderLeftColor: colors.borderWarm,
    paddingLeft: 10,
  },
  enBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  enBtnText: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.textMuted },

  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.r14,
    backgroundColor: colors.surfaceSoft2,
  },
  playTrackWrap: { flex: 1, gap: 4 },
  eqRow: { height: 22, alignItems: 'flex-end', justifyContent: 'center' },
  playTrackPressable: { height: 26, justifyContent: 'center' },
  playTrack: { width: '100%', height: 6, borderRadius: 6, backgroundColor: colors.borderWarm },
  playTrackFill: { position: 'absolute', left: 0, height: 6, borderRadius: 6, backgroundColor: colors.accent },
  playDur: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },

  eraRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eraText: { fontFamily: fonts.bold, fontSize: 13, color: colors.olive },
});

export default ResponseListScreen;
