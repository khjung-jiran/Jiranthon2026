import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer, Icon, RecordingWave, PulseRing } from '../../components';
import { colors, fonts, radius, shadow } from '../../theme';
import { useStore } from '../../store/useStore';
import { capsuleToOptions, capsuleWhenOptions, capsuleWhenMap } from '../../data/mock';
import { formatDuration as fmt } from '../../utils/time';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CapsuleNew'>;

/** 타임캡슐 작성 (sCapsNew, 591~645) */
export function CapsuleNewScreen({ navigation }: Props) {
  const role = useStore((s) => s.role);
  const sealCapsule = useStore((s) => s.sealCapsule);
  const showToast = useStore((s) => s.showToast);

  const [capTo, setCapTo] = useState('엄마');
  const [capWhen, setCapWhen] = useState('1년 뒤');
  const [capTitle, setCapTitle] = useState('');

  const [recording, setRecording] = useState(false);
  const [recordDone, setRecordDone] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startRec = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(true);
    setRecordDone(false);
    setRecordSecs(0);
    timerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
  };
  const stopRec = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setRecordDone(true);
  };

  const seal = () => {
    if (!recordDone) return;
    const w = capsuleWhenMap[capWhen] ?? capsuleWhenMap['1년 뒤'];
    sealCapsule({
      to: capTo,
      when: capWhen,
      title: capTitle,
      dur: fmt(recordSecs),
      from: role === 'parent' ? '엄마' : '지훈',
    });
    navigation.goBack();
    showToast(`타임캡슐을 봉인했어요 · ${w.when}에 열려요`, 3000);
  };

  return (
    <ScreenContainer edges={['top']}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow_back" size={26} color={colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>타임캡슐 만들기</Text>
      </View>

      <ScrollView style={s.flex} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionLabel}>누구에게 남길까요?</Text>
        <View style={s.chipRow}>
          {capsuleToOptions.map((label) => {
            const on = capTo === label;
            return (
              <Pressable
                key={label}
                onPress={() => setCapTo(label)}
                style={[s.chip, { backgroundColor: on ? colors.accent : colors.surface, borderColor: on ? colors.accent : colors.border2 }]}
              >
                <Text style={[s.chipText, { color: on ? colors.white : colors.textMuted4 }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[s.sectionLabel, s.mt20]}>언제 열릴까요?</Text>
        <View style={s.chipRow}>
          {capsuleWhenOptions.map((label) => {
            const on = capWhen === label;
            return (
              <Pressable
                key={label}
                onPress={() => setCapWhen(label)}
                style={[s.chip, { backgroundColor: on ? colors.accent : colors.surface, borderColor: on ? colors.accent : colors.border2 }]}
              >
                <Text style={[s.chipText, { color: on ? colors.white : colors.textMuted4 }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[s.sectionLabel, s.mt20]}>캡슐 이름</Text>
        <TextInput
          value={capTitle}
          onChangeText={setCapTitle}
          placeholder="예: 서연이 결혼하는 날에"
          placeholderTextColor={colors.textFaint}
          style={s.input}
        />

        <Text style={[s.sectionLabel, s.mt20]}>음성 편지</Text>
        <View style={s.recCard}>
          {!recording && !recordDone ? (
            <View style={s.recCol}>
              <Text style={s.recHint}>
                버튼을 누르고 미래의 가족에게{'\n'}전하고 싶은 이야기를 남겨보세요
              </Text>
              <Pressable style={s.micBtn} onPress={startRec}>
                <Icon name="mic" size={38} color={colors.white} />
              </Pressable>
            </View>
          ) : null}

          {recording ? (
            <View style={s.recColTight}>
              <RecordingWave />
              <Text style={s.recTime}>{fmt(recordSecs)}</Text>
              <View style={s.stopWrap}>
                <PulseRing size={84} />
                <Pressable style={s.stopBtn} onPress={stopRec}>
                  <Icon name="stop" size={36} color={colors.white} />
                </Pressable>
              </View>
            </View>
          ) : null}

          {recordDone ? (
            <View style={s.recCol}>
              <View style={s.doneIcon}>
                <Icon name="check" size={34} color={colors.accent} />
              </View>
              <Text style={s.doneText}>녹음 완료 · {fmt(recordSecs)}</Text>
              <Pressable style={s.replayBtn} onPress={startRec}>
                <Icon name="replay" size={18} color={colors.textMuted} />
                <Text style={s.replayText}>다시 녹음하기</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
        <Text style={s.footNote}>봉인 후에는 열리는 날까지 수정하거나 들을 수 없어요</Text>
      </ScrollView>

      <View style={s.footer}>
        <Pressable
          style={[s.sealBtn, { backgroundColor: recordDone ? colors.accent : colors.border4 }]}
          onPress={seal}
        >
          <Icon name="lock" size={23} color={recordDone ? colors.white : colors.textFaint} />
          <Text style={[s.sealBtnText, { color: recordDone ? colors.white : colors.textFaint }]}>봉인하기</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.extraBold, fontSize: 19, color: colors.text },

  body: { paddingTop: 6, paddingHorizontal: 22, paddingBottom: 20 },
  sectionLabel: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.textFaint2, marginTop: 8, marginBottom: 10, marginLeft: 2 },
  mt20: { marginTop: 20 },

  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1.5 },
  chipText: { fontFamily: fonts.bold, fontSize: 14 },

  input: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: radius.r16,
    borderWidth: 1.5,
    borderColor: colors.border2,
    backgroundColor: colors.surface,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },

  recCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border3,
    borderRadius: radius.r20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recCol: { alignItems: 'center', gap: 16 },
  recColTight: { alignItems: 'center', gap: 14 },
  recHint: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  micBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.accentButton,
  },
  recTime: { fontFamily: fonts.extraBold, fontSize: 28, color: colors.text, fontVariant: ['tabular-nums'] },
  stopWrap: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  stopBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  doneText: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  replayBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  replayText: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },

  footNote: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint, lineHeight: 21, marginTop: 14, textAlign: 'center' },

  footer: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgScreen },
  sealBtn: {
    height: 60,
    borderRadius: radius.r18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  sealBtnText: { fontFamily: fonts.extraBold, fontSize: 18 },
});

export default CapsuleNewScreen;
