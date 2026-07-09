import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer, Icon, Overlay, EqBars } from '../../components';
import { colors, fonts, radius, tint, shadow } from '../../theme';
import { useStore } from '../../store/useStore';
import type { RootStackParamList } from '../../navigation/types';
import type { Capsule } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Capsule'>;

/** 타임캡슐 목록 (sCaps, 566~590) */
export function CapsuleScreen({ navigation }: Props) {
  const capsules = useStore((s) => s.capsules);
  const showToast = useStore((s) => s.showToast);
  const markCapsuleOpen = useStore((s) => s.markCapsuleOpen);

  const [revealId, setRevealId] = useState<number | null>(null);
  const [revealPlaying, setRevealPlaying] = useState(false);
  const [playingCap, setPlayingCap] = useState<number | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const capTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
      if (capTimer.current) clearTimeout(capTimer.current);
    },
    []
  );

  const revealCap = capsules.find((c) => c.id === revealId) ?? null;

  const openReveal = (id: number) => {
    setRevealId(id);
    setRevealPlaying(false);
  };
  const closeReveal = () => {
    if (revealId != null) markCapsuleOpen(revealId);
    setRevealId(null);
    setRevealPlaying(false);
  };
  const playReveal = () => {
    if (revealPlaying) {
      if (revealTimer.current) clearTimeout(revealTimer.current);
      setRevealPlaying(false);
      return;
    }
    setRevealPlaying(true);
    if (revealTimer.current) clearTimeout(revealTimer.current);
    revealTimer.current = setTimeout(() => setRevealPlaying(false), 6000);
  };

  const playCapsule = (id: number) => {
    if (playingCap === id) {
      if (capTimer.current) clearTimeout(capTimer.current);
      setPlayingCap(null);
      return;
    }
    setPlayingCap(id);
    if (capTimer.current) clearTimeout(capTimer.current);
    capTimer.current = setTimeout(() => setPlayingCap(null), 5000);
  };

  const lockedNudge = (c: Capsule) => {
    showToast(`아직 열 수 없어요 · ${c.when}에 열려요`);
  };

  return (
    <ScreenContainer edges={['top']}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow_back" size={26} color={colors.text} />
        </Pressable>
        <View>
          <Text style={s.headerTitle}>타임캡슐</Text>
          <Text style={s.headerSub}>정해진 날에 열리는 음성 편지</Text>
        </View>
      </View>

      <ScrollView style={s.flex} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {capsules.map((c) => {
          const locked = c.status === 'locked';
          const ready = c.status === 'ready';
          const opened = c.status === 'open';
          const playing = playingCap === c.id;
          const icon = locked ? 'lock' : ready ? 'mark_email_unread' : playing ? 'pause_circle' : 'play_circle';
          const chipLabel = locked ? c.dday : ready ? '오늘' : c.dur;
          const chipBg = locked ? colors.surfaceSoft3 : ready ? colors.accent : colors.answeredBg;
          const chipFg = locked ? colors.textMuted : ready ? colors.white : colors.answeredFg;
          const border = ready ? colors.accent : colors.border3;
          const metaLine = ready ? '오늘 열 수 있어요' : `${c.when} 열림`;
          const onTap = () => {
            if (ready) openReveal(c.id);
            else if (opened) playCapsule(c.id);
            else lockedNudge(c);
          };
          return (
            <Pressable key={c.id} onPress={onTap} style={[s.card, { borderColor: border }]}>
              <View style={[s.iconBox, { backgroundColor: tint(c.color, 12) }]}>
                <Icon name={icon} size={26} color={c.color} />
              </View>
              <View style={s.flex}>
                <Text style={s.cardTitle}>{c.title}</Text>
                <Text style={s.cardMeta}>
                  {c.from} → {c.to} · {metaLine}
                </Text>
              </View>
              <View style={[s.chip, { backgroundColor: chipBg }]}>
                <Text style={[s.chipText, { color: chipFg }]}>{chipLabel}</Text>
              </View>
            </Pressable>
          );
        })}
        <Text style={s.hint}>봉인된 편지는 열리는 날까지 아무도 들을 수 없어요</Text>
      </ScrollView>

      <View style={s.footer}>
        <Pressable style={s.sealBtn} onPress={() => navigation.navigate('CapsuleNew')}>
          <Icon name="hourglass_top" size={24} color={colors.white} />
          <Text style={s.sealBtnText}>타임캡슐 만들기</Text>
        </Pressable>
      </View>

      <Overlay visible={!!revealCap} onClose={closeReveal} dismissOnBackdrop={false} cardStyle={s.revealCard}>
        {revealCap ? (
          <>
            <View style={[s.revealIcon, { backgroundColor: tint(revealCap.color, 13) }]}>
              <Icon name="drafts" size={42} color={revealCap.color} />
            </View>
            <Text style={s.revealRoute}>
              {revealCap.from} → {revealCap.to}
            </Text>
            <Text style={s.revealTitle}>{revealCap.title}</Text>
            <Text style={s.revealSub}>봉인됐던 음성 편지가 오늘 열렸어요</Text>
            <Pressable style={s.revealPlayBtn} onPress={playReveal}>
              <Icon name={revealPlaying ? 'pause_circle' : 'play_circle'} size={32} color={colors.accent} />
              <View style={s.revealPlayMid}>
                {revealPlaying ? <EqBars color={colors.accent} /> : <View style={s.revealTrack} />}
              </View>
              <Text style={s.revealDur}>{revealCap.dur}</Text>
            </Pressable>
            <Pressable style={s.revealCloseBtn} onPress={closeReveal}>
              <Text style={s.revealCloseText}>간직할게요</Text>
            </Pressable>
          </>
        ) : null}
      </Overlay>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.extraBold, fontSize: 19, color: colors.text },
  headerSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted3 },

  body: { paddingTop: 8, paddingHorizontal: 22, paddingBottom: 20, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: radius.r20,
    padding: 17,
  },
  iconBox: { width: 50, height: 50, borderRadius: radius.r16, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  cardMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted3, marginTop: 4 },
  chip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: radius.pill },
  chipText: { fontFamily: fonts.extraBold, fontSize: 13 },

  hint: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint, lineHeight: 21, textAlign: 'center', paddingTop: 6 },

  footer: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgScreen },
  sealBtn: {
    height: 58,
    borderRadius: radius.r18,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    ...shadow.accentButton,
  },
  sealBtnText: { fontFamily: fonts.extraBold, fontSize: 17, color: colors.white },

  // reveal modal
  revealCard: { alignItems: 'center' },
  revealIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  revealRoute: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted3 },
  revealTitle: { fontFamily: fonts.extraBold, fontSize: 22, color: colors.text, marginTop: 6, textAlign: 'center' },
  revealSub: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginTop: 10, lineHeight: 22, textAlign: 'center' },
  revealPlayBtn: {
    width: '100%',
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.r16,
    backgroundColor: colors.surfaceSoft2,
  },
  revealPlayMid: { flex: 1, height: 24, justifyContent: 'center' },
  revealTrack: { width: '100%', height: 6, borderRadius: 6, backgroundColor: colors.borderWarm },
  revealDur: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  revealCloseBtn: {
    width: '100%',
    height: 54,
    marginTop: 14,
    borderRadius: radius.r16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealCloseText: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.white },
});

export default CapsuleScreen;
