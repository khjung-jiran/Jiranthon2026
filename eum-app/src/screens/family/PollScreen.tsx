import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer, Icon } from '../../components';
import { colors, fonts, radius, tint } from '../../theme';
import { useStore } from '../../store/useStore';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Poll'>;

/** 가족 투표 (sPoll, 665~695) */
export function PollScreen({ navigation }: Props) {
  const pollVotes = useStore((s) => s.pollVotes);
  const pollVoted = useStore((s) => s.pollVoted);
  const pollLabels = useStore((s) => s.pollLabels);
  const pollTitle = useStore((s) => s.pollTitle);
  const vote = useStore((s) => s.vote);

  const total = pollVotes.reduce((a, b) => a + b, 0);
  const voted = pollVoted !== null;
  const hint = voted ? '다른 항목을 누르면 투표를 바꿀 수 있어요' : '하나를 선택하면 가족의 선택이 보여요';

  return (
    <ScreenContainer edges={['top']}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow_back" size={26} color={colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>가족 투표</Text>
      </View>

      <ScrollView style={s.flex} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <View style={s.announce}>
          <Icon name="campaign" size={16} color={colors.gold} />
          <Text style={s.announceText}>전달사항</Text>
        </View>

        <Text style={s.title}>
          {pollTitle || '가족 투표'}
        </Text>
        <Text style={s.sub}>{total}명 참여</Text>

        {pollLabels.length === 0 ? (
          <Text style={s.hint}>아직 진행 중인 투표가 없어요</Text>
        ) : (
          <View style={s.options}>
          {pollLabels.map((label, i) => {
            const v = pollVotes[i] ?? 0;
            const pct = total ? Math.round((v / total) * 100) : 0;
            const mine = pollVoted === i;
            return (
              <Pressable
                key={label}
                onPress={() => vote(i)}
                style={[
                  s.option,
                  { borderColor: mine ? colors.mauve : colors.border2, backgroundColor: mine ? tint(colors.mauve, 8) : colors.surface },
                ]}
              >
                <Icon
                  name={mine ? 'check_circle' : 'radio_button_unchecked'}
                  size={23}
                  color={mine ? colors.mauve : colors.textFaint4}
                />
                <View style={s.flex}>
                  <Text style={s.optionLabel}>{label}</Text>
                  {voted ? (
                    <View style={s.progressRow}>
                      <View style={s.track}>
                        <View style={[s.fill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={s.pctLabel}>{pct}%</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
          </View>
        )}

        <Text style={s.hint}>{hint}</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.extraBold, fontSize: 19, color: colors.text },

  body: { paddingTop: 10, paddingHorizontal: 24, paddingBottom: 26 },

  announce: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    backgroundColor: tint(colors.gold, 13),
  },
  announceText: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.gold },

  title: { fontFamily: fonts.extraBold, fontSize: 23, color: colors.text, lineHeight: 32, marginTop: 14, letterSpacing: -0.3 },
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted3, marginTop: 10 },

  options: { gap: 10, marginTop: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.r16,
    borderWidth: 1.5,
  },
  optionLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 9 },
  track: { flex: 1, height: 7, borderRadius: 6, backgroundColor: colors.surfaceSoft3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6, backgroundColor: colors.mauve },
  pctLabel: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.mauve, minWidth: 34, textAlign: 'right' },

  hint: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint, textAlign: 'center', marginTop: 16, lineHeight: 21 },
});

export default PollScreen;
