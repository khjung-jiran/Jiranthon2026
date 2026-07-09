import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ScreenContainer, Icon } from '../../components';
import { colors, fonts, radius, tint } from '../../theme';
import { useStore } from '../../store/useStore';
import { calendarEvents, calendarDotMap, todayDate, weekdays } from '../../data/mock';

type Cell = { n: number; fg: string; bg: string; dot: string };

/** 원본 renderVals cells 생성 로직 그대로 이식 */
function buildCells(): Cell[] {
  const cells: Cell[] = [];
  [28, 29, 30].forEach((n) => cells.push({ n, fg: colors.textFaint5, bg: 'transparent', dot: 'transparent' }));
  for (let n = 1; n <= 31; n++) {
    const today = n === todayDate;
    cells.push({
      n,
      fg: today ? colors.white : colors.text2,
      bg: today ? colors.accent : 'transparent',
      dot: calendarDotMap[n] || 'transparent',
    });
  }
  cells.push({ n: 1, fg: colors.textFaint5, bg: 'transparent', dot: 'transparent' });
  return cells;
}

const events = calendarEvents.map((e) => ({
  ...e,
  byline: e.by + ' 등록',
  dateLabel: '7월 ' + e.d + '일 (' + e.dow + ')',
}));

/** 가족 캘린더 (sCal, 445~515) — 부모/자녀 탭 공용 */
export function CalendarScreen() {
  const role = useStore((s) => s.role);
  return role === 'parent' ? <ParentCalendar /> : <ChildCalendar />;
}

// ── 자녀 모드 ────────────────────────────────────────────────────────
function ChildCalendar() {
  const cells = buildCells();
  return (
    <ScreenContainer edges={['top']} scroll contentContainerStyle={s.childBody} stickyHeaderIndices={undefined}>
      <View style={s.childHead}>
        <View>
          <Text style={s.eyebrowBlue}>가족 캘린더</Text>
          <Text style={s.h26}>2026년 7월</Text>
        </View>
        <View style={s.syncPill}>
          <View style={s.syncDot} />
          <Text style={s.syncText}>구글 캘린더 연동됨</Text>
        </View>
      </View>

      <View style={s.childInner}>
        <View style={s.calCard}>
          <View style={s.grid}>
            {weekdays.map((w) => (
              <View key={w} style={s.cell}>
                <Text style={s.dow}>{w}</Text>
              </View>
            ))}
            {cells.map((c, i) => (
              <View key={i} style={s.cell}>
                <View style={[s.dayBox, { backgroundColor: c.bg }]}>
                  <Text style={[s.dayNum, { color: c.fg }]}>{c.n}</Text>
                  <View style={[s.dayDot, { backgroundColor: c.dot }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        <Text style={s.sectionLabel}>다가오는 일정</Text>
        <View style={{ gap: 10 }}>
          {events.map((e, i) => (
            <View key={i} style={s.eventRow}>
              <View style={[s.dateChip, { backgroundColor: tint(e.color, 12) }]}>
                <Text style={[s.dateD, { color: e.color }]}>{e.d}</Text>
                <Text style={[s.dateDow, { color: e.color }]}>{e.dow}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.eventTitle}>{e.title}</Text>
                <Text style={s.eventSub}>
                  {e.dateLabel} · {e.byline}
                </Text>
              </View>
              <View style={[s.tag, { backgroundColor: tint(e.color, 10) }]}>
                <Text style={[s.tagText, { color: e.color }]}>{e.tag}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable style={s.addBtn}>
          <Icon name="add" size={22} color={colors.textMuted} />
          <Text style={s.addText}>일정 추가</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

// ── 부모 모드 ────────────────────────────────────────────────────────
function ParentCalendar() {
  return (
    <ScreenContainer edges={['top']} scroll contentContainerStyle={{ paddingBottom: 8 }}>
      <View style={s.parentHead}>
        <Text style={s.eyebrowAccent}>부모님 모드</Text>
        <Text style={s.h28}>가족 일정</Text>
        <Text style={s.parentIntro}>자녀들이 등록한 일정이에요.</Text>
      </View>
      <View style={{ gap: 14, paddingHorizontal: 22, paddingTop: 6, paddingBottom: 26 }}>
        {events.map((e, i) => (
          <View key={i} style={s.pEventRow}>
            <View style={[s.pDateChip, { backgroundColor: tint(e.color, 12) }]}>
              <Text style={[s.pDateD, { color: e.color }]}>{e.d}</Text>
              <Text style={[s.pDateDow, { color: e.color }]}>{e.dow}요일</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.pEventTitle}>{e.title}</Text>
              <Text style={s.pEventSub}>
                {e.dateLabel}
                {'\n'}
                {e.byline}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  // 자녀 헤더
  childHead: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  eyebrowBlue: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.blue, letterSpacing: 0.4 },
  h26: { fontFamily: fonts.extraBold, fontSize: 26, color: colors.text, marginTop: 5, letterSpacing: -0.5 },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.oliveSoft,
  },
  syncDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: colors.oliveDeep },
  syncText: { fontFamily: fonts.bold, fontSize: 12, color: colors.oliveDeep },

  childBody: {},
  childInner: { paddingTop: 4, paddingHorizontal: 22, paddingBottom: 26 },
  calCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border3,
    borderRadius: radius.r20,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 44, alignItems: 'center', justifyContent: 'center' },
  dow: { fontFamily: fonts.bold, fontSize: 12, color: colors.textFaint, textAlign: 'center' },
  dayBox: { width: '100%', height: 44, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: radius.r12 },
  dayNum: { fontFamily: fonts.medium, fontSize: 14 },
  dayDot: { width: 5, height: 5, borderRadius: 999 },

  sectionLabel: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: colors.textFaint2,
    letterSpacing: 0.3,
    marginTop: 22,
    marginBottom: 12,
    marginLeft: 2,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border3,
    borderRadius: radius.r18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dateChip: { width: 56, borderRadius: radius.r14, paddingVertical: 9, alignItems: 'center' },
  dateD: { fontFamily: fonts.extraBold, fontSize: 20, lineHeight: 22 },
  dateDow: { fontFamily: fonts.bold, fontSize: 12 },
  eventTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  eventSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted3, marginTop: 3 },
  tag: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: radius.pill },
  tagText: { fontFamily: fonts.bold, fontSize: 12 },

  addBtn: {
    height: 54,
    marginTop: 14,
    borderRadius: radius.r16,
    borderWidth: 1.5,
    borderColor: colors.borderDashed,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  addText: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted },

  // 부모
  parentHead: { paddingTop: 22, paddingHorizontal: 26, paddingBottom: 14 },
  eyebrowAccent: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.accent, letterSpacing: 0.4 },
  h28: { fontFamily: fonts.extraBold, fontSize: 28, color: colors.text, marginTop: 6, letterSpacing: -0.5 },
  parentIntro: { fontFamily: fonts.regular, fontSize: 17, color: colors.textMuted2, marginTop: 8, lineHeight: 26 },
  pEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border3,
    borderRadius: radius.lg,
    padding: 20,
  },
  pDateChip: { width: 72, borderRadius: radius.r18, paddingVertical: 14, alignItems: 'center' },
  pDateD: { fontFamily: fonts.extraBold, fontSize: 28, lineHeight: 31 },
  pDateDow: { fontFamily: fonts.bold, fontSize: 15, marginTop: 2 },
  pEventTitle: { fontFamily: fonts.bold, fontSize: 21, color: colors.text, lineHeight: 28 },
  pEventSub: { fontFamily: fonts.regular, fontSize: 16, color: colors.textMuted, marginTop: 6, lineHeight: 24 },
});

export default CalendarScreen;
