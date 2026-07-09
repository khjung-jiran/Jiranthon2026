import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer, Header, Icon, RecordingWave, PulseRing } from '../../components';
import { colors, fonts, radius, sizes, shadow } from '../../theme';
import { useStore } from '../../store/useStore';
import { formatDuration as fmt } from '../../utils/time';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Respond'>;

/**
 * 부모 답변하기 (sPRespond, 원본 201~255).
 * "답변 말하기" 녹음 버튼 → recIdle/recording/recordDone 3단계 + 텍스트 대필(scribe) 모드.
 * 실제 STT/녹음은 목업(1초 타이머로 recordSecs 증가)으로 재현.
 */
export function RespondScreen({ route, navigation }: Props) {
  const { questionId } = route.params;
  const questions = useStore((s) => s.questions);
  const curQ = questions.find((q) => q.id === questionId) ?? questions[0];
  const answerQuestion = useStore((s) => s.answerQuestion);
  const showToast = useStore((s) => s.showToast);

  const [recording, setRecording] = useState(false);
  const [recordDone, setRecordDone] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [scribe, setScribe] = useState(false);
  const [scribeText, setScribeText] = useState('');

  const recIdle = !recording && !recordDone;
  const recTime = fmt(recordSecs);
  const canSend = recordDone || (scribe && scribeText.trim().length > 0);

  const recTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearRecTimer = () => {
    if (recTimer.current) {
      clearInterval(recTimer.current);
      recTimer.current = null;
    }
  };
  useEffect(() => clearRecTimer, []);

  const startRec = () => {
    clearRecTimer();
    setRecording(true);
    setRecordDone(false);
    setRecordSecs(0);
    recTimer.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
  };

  const stopRec = () => {
    clearRecTimer();
    setRecording(false);
    setRecordDone(true);
  };

  const toggleScribe = () => setScribe((s) => !s);

  const sendResp = () => {
    const scribeOk = scribe && scribeText.trim().length > 0;
    if (!recordDone && !scribeOk) return;
    const dur = scribeOk ? '글 답변' : fmt(recordSecs) || '0:12';
    const transcript = scribeOk ? scribeText.trim() : '방금 녹음한 음성 답변이 가족에게 전달되었어요.';
    answerQuestion(curQ.id, { dur, transcript, era: '청년 시절' });
    clearRecTimer();
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

        <View style={styles.stage}>
          {recIdle ? (
            <View style={styles.idleWrap}>
              <Text style={styles.idleText}>아래 버튼을 누르고{'\n'}편하게 말씀해 주세요</Text>
              <Pressable style={styles.micBtn} onPress={startRec}>
                <Icon name="mic" size={48} color={colors.white} />
              </Pressable>
            </View>
          ) : null}

          {recording ? (
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
              <View style={styles.playerBox}>
                <Icon name="play_circle" size={34} color={colors.accent} />
                <View style={styles.playerTrack}>
                  <View style={styles.playerFill} />
                </View>
                <Text style={styles.playerTime}>{recTime}</Text>
              </View>
              <Pressable style={styles.replayBtn} onPress={startRec}>
                <Icon name="replay" size={20} color={colors.textMuted} />
                <Text style={styles.replayText}>다시 녹음하기</Text>
              </Pressable>
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
                <Text style={styles.scribeBadgeText}>대필 모드 · 지훈이 대신 입력해요</Text>
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
  playerBox: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border3,
    borderRadius: radius.r18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  playerTrack: { flex: 1, height: 8, borderRadius: 6, backgroundColor: colors.track, overflow: 'hidden' },
  playerFill: { width: '38%', height: '100%', borderRadius: 6, backgroundColor: colors.accent },
  playerTime: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
  replayBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replayText: { fontFamily: fonts.bold, fontSize: 16, color: colors.textMuted },

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
