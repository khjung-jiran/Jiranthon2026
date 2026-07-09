import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet, Alert, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';

import { ScreenContainer, Header, Icon, RecordingWave, PulseRing } from '../../components';
import { colors, fonts, radius, sizes, shadow } from '../../theme';
import { useStore } from '../../store/useStore';
import { formatDuration as fmt } from '../../utils/time';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import * as api from '../../api';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Respond'>;

/**
 * 부모 답변하기 (sPRespond, 원본 201~255).
 * "답변 말하기" 녹음 버튼 → 실제 녹음 → 서버 STT 변환 → 답변 전송.
 * 텍스트 대필(scribe) 모드 지원.
 */
export function RespondScreen({ route, navigation }: Props) {
  const { questionId } = route.params;
  const questions = useStore((s) => s.questions);
  const curQ = questions.find((q) => q.id === questionId) ?? questions[0];
  const answerQuestion = useStore((s) => s.answerQuestion);
  const showToast = useStore((s) => s.showToast);

  const recorder = useAudioRecorder();
  const currentUser = useStore((s) => s.currentUser);
  const [recordDone, setRecordDone] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [scribe, setScribe] = useState(false);
  const [scribeText, setScribeText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [audioFilePath, setAudioFilePath] = useState<string | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<Audio.Sound | null>(null);
  const webAudioRef = useRef<HTMLAudioElement | null>(null);

  const recIdle = !recorder.recording && !recordDone;
  const recTime = fmt(recorder.durationSecs);
  const canSend = (recordDone || (scribe && scribeText.trim().length > 0)) && !processing;

  const startRec = async () => {
    setRecordDone(false);
    setTranscript('');
    await recorder.start();
  };

  const stopRec = async () => {
    const result = await recorder.stop();
    if (!result) return;
    setRecordDone(true);
    setProcessing(true);
    try {
      const upload = await api.uploadAudioFile(result.uri);
      setAudioFilePath(upload.filename);
      const stt = await api.transcribeAudio(upload.file_path);
      setTranscript(stt.text);
    } catch (e) {
      console.warn('[eum] STT 변환 실패, 서버에서 처리 예정:', e);
      setTranscript('');
    }
    setProcessing(false);
  };

  const toggleScribe = () => setScribe((s) => !s);

  const playRecording = async () => {
    if (!recorder.uri) return;
    if (Platform.OS === 'web') {
      if (webAudioRef.current) { webAudioRef.current.pause(); webAudioRef.current = null; }
      const audio = new (window as any).Audio(recorder.uri);
      webAudioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onpause = () => setPlaying(false);
      setPlaying(true);
      await audio.play();
    } else {
      try {
        if (audioRef.current) { await audioRef.current.unloadAsync(); audioRef.current = null; }
        const { sound } = await Audio.Sound.createAsync({ uri: recorder.uri });
        audioRef.current = sound;
        setPlaying(true);
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) { setPlaying(false); sound.setPositionAsync(0); }
        });
      } catch (e) { console.warn('[RespondScreen] playback failed:', e); }
    }
  };

  const stopPlayback = async () => {
    if (Platform.OS === 'web') {
      webAudioRef.current?.pause();
    } else {
      await audioRef.current?.stopAsync();
    }
    setPlaying(false);
  };

  useEffect(() => {
    return () => {
      audioRef.current?.unloadAsync();
      webAudioRef.current?.pause();
    };
  }, []);

  const sendResp = () => {
    const scribeOk = scribe && scribeText.trim().length > 0;
    if (!recordDone && !scribeOk) return;
    const dur = scribeOk ? '글 답변' : recTime || '0:12';
    const text = scribeOk ? scribeText.trim() : transcript;
    answerQuestion(curQ.id, { dur, transcript: text, audioFilePath: scribeOk ? undefined : audioFilePath });
    showToast('답변이 가족에게 전달되었어요');
    navigation.navigate('ParentTabs', { screen: 'Home' });
  };

  return (
    <ScreenContainer>
      <Header title="답변하기" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.qBox}>
          <Text style={styles.qBoxText}>Q. {curQ.text}</Text>
        </View>

        {curQ.status === 'answered' && curQ.transcript ? (
          <View style={styles.prevAnswerBox}>
            <Text style={styles.prevAnswerLabel}>A. 이전 답변</Text>
            <Text style={styles.prevAnswerText}>"{curQ.transcript}"</Text>
            <View style={styles.prevAnswerMeta}>
              <Icon name="play_circle" size={16} color={colors.accent} />
              <Text style={styles.prevAnswerDur}>{curQ.dur ?? ''}</Text>
              {curQ.category ? <Text style={styles.prevAnswerEra}>· {{childhood:'유년기',youth:'청년시절',twilight:'황혼기'}[curQ.category] ?? curQ.category}</Text> : null}
            </View>
          </View>
        ) : null}

        <View style={styles.stage}>
          {recIdle ? (
            <View style={styles.idleWrap}>
              <Text style={styles.idleText}>아래 버튼을 누르고{'\n'}편하게 말씀해 주세요</Text>
              <Pressable style={styles.micBtn} onPress={startRec}>
                <Icon name="mic" size={48} color={colors.white} />
              </Pressable>
            </View>
          ) : null}

          {recorder.recording ? (
            <View style={styles.recWrap}>
              <RecordingWave color={colors.accent} active count={30} />
              <Text style={styles.recTime}>{recTime}</Text>
              <Text style={styles.recLabel}>말씀하시는 중이에요…</Text>
              <View style={styles.ringWrap}>
                <PulseRing size={sizes.recordButton} />
                <Pressable style={styles.stopBtn} onPress={stopRec}>
                  <Icon name="stop" size={44} color={colors.white} />
                </Pressable>
              </View>
            </View>
          ) : null}

          {recordDone ? (
            <View style={styles.doneWrap}>
              <View style={styles.checkCircle}>
                <Icon name="check" size={40} color={colors.accent} />
              </View>
              <Text style={styles.doneTitle}>녹음 완료 · {recTime}</Text>
              {processing ? (
                <Text style={styles.processingText}>음성을 텍스트로 변환 중…</Text>
              ) : (
                <View style={styles.transcriptBox}>
                  <Text style={styles.transcriptLabel}>변환된 텍스트</Text>
                  <Text style={styles.transcriptText}>{transcript}</Text>
                </View>
              )}
              <View style={styles.playbackRow}>
                <Pressable style={styles.playBtn} onPress={playing ? stopPlayback : playRecording}>
                  <Icon name={playing ? 'pause_circle' : 'play_circle'} size={22} color={colors.accent} />
                  <Text style={styles.playBtnText}>{playing ? '일시정지' : '녹음 듣기'}</Text>
                </Pressable>
                <Pressable style={styles.replayBtn} onPress={startRec}>
                  <Icon name="replay" size={20} color={colors.textMuted} />
                  <Text style={styles.replayText}>다시 녹음하기</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.scribeSection}>
          <Pressable style={styles.scribeToggle} onPress={toggleScribe}>
            <Icon name="edit_note" size={20} color={colors.textMuted} />
            <Text style={styles.scribeToggleText}>
              {scribe ? '음성 답변으로 돌아가기' : '자녀가 대신 글로 입력하기 (대필)'}
            </Text>
          </Pressable>

          {scribe ? (
            <View style={styles.scribeBody}>
              <View style={styles.scribeBadge}>
                <Icon name="supervisor_account" size={16} color={colors.blue} />
                <Text style={styles.scribeBadgeText}>대필 모드 · {currentUser?.name ?? '자녀'}이 대신 입력해요</Text>
              </View>
              <TextInput
                value={scribeText}
                onChangeText={setScribeText}
                placeholder="부모님이 말씀하신 내용을 대신 적어주세요"
                placeholderTextColor={colors.textFaint}
                multiline
                style={styles.scribeInput}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.sendBtn, { backgroundColor: canSend ? colors.accent : colors.border4 }]}
          onPress={sendResp}
        >
          <Icon name="send" size={24} color={canSend ? colors.white : colors.textFaint} />
          <Text style={[styles.sendBtnText, { color: canSend ? colors.white : colors.textFaint }]}>답변 보내기</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, paddingTop: 8, paddingHorizontal: 26 },

  qBox: {
    backgroundColor: colors.surfaceSoft3,
    borderRadius: radius.r16,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  qBoxText: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 26, color: colors.textMuted4 },

  // 이전 답변
  prevAnswerBox: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border3,
    borderRadius: radius.r18,
    padding: 16,
    gap: 8,
    marginTop: 12,
  },
  prevAnswerLabel: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.accent },
  prevAnswerText: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 25, color: colors.text2 },
  prevAnswerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  prevAnswerDur: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  prevAnswerEra: { fontFamily: fonts.bold, fontSize: 13, color: colors.olive },

  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingVertical: 24 },

  // recIdle
  idleWrap: { alignItems: 'center', gap: 26 },
  idleText: { fontFamily: fonts.regular, fontSize: 18, color: colors.textMuted2, textAlign: 'center', lineHeight: 28 },
  micBtn: {
    width: sizes.recordButton,
    height: sizes.recordButton,
    borderRadius: sizes.recordButton / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.accentButton,
  },

  // recording
  recWrap: { alignItems: 'center', gap: 22 },
  recTime: { fontFamily: fonts.extraBold, fontSize: 34, letterSpacing: 1, color: colors.text, fontVariant: ['tabular-nums'] },
  recLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.danger },
  ringWrap: {
    width: sizes.recordButton,
    height: sizes.recordButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtn: {
    width: sizes.recordButton,
    height: sizes.recordButton,
    borderRadius: sizes.recordButton / 2,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 17,
    elevation: 6,
  },

  // recordDone
  doneWrap: { width: '100%', alignItems: 'center', gap: 20 },
  checkCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: { fontFamily: fonts.bold, fontSize: 19, color: colors.text },
  processingText: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, marginTop: 4 },
  transcriptBox: { width: '100%', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border3, borderRadius: radius.r18, padding: 16, gap: 6 },
  transcriptLabel: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.textFaint2 },
  transcriptText: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 26, color: colors.text },
  replayBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replayText: { fontFamily: fonts.bold, fontSize: 16, color: colors.textMuted },
  playbackRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  playBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playBtnText: { fontFamily: fonts.bold, fontSize: 16, color: colors.accent },

  // scribe
  scribeSection: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    borderStyle: 'dashed',
    paddingTop: 14,
    marginTop: 2,
    paddingBottom: 16,
    gap: 12,
  },
  scribeToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 6 },
  scribeToggleText: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted },
  scribeBody: { gap: 10 },
  scribeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral,
  },
  scribeBadgeText: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.blue },
  scribeInput: {
    width: '100%',
    minHeight: 110,
    padding: 16,
    borderRadius: radius.r16,
    borderWidth: 1.5,
    borderColor: colors.border2,
    backgroundColor: colors.surface,
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 27,
    color: colors.text,
    textAlignVertical: 'top',
  },

  // footer
  footer: {
    paddingTop: 14,
    paddingHorizontal: 22,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgScreen,
  },
  sendBtn: {
    width: '100%',
    height: sizes.buttonXl,
    borderRadius: radius.r18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 13,
    elevation: 6,
  },
  sendBtnText: { fontFamily: fonts.extraBold, fontSize: 19 },
});

export default RespondScreen;
