// 부모 홈 화면 - AI 질문 카드 + 대기 중 질문 목록

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Colors } from '../theme';
import { Avatar } from '../components';
import { api } from '../api';
import { useApp } from '../store';
import { Question } from '../types';

export function ParentHomeScreen({
  onOpenQuestion,
  onGoNotif,
  onGoSetting,
  onGoCapsule,
  onGoPoll,
}: {
  onOpenQuestion: (id: string) => void;
  onGoNotif: () => void;
  onGoSetting: () => void;
  onGoCapsule: () => void;
  onGoPoll: () => void;
}) {
  const { member } = useApp();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    if (!member) return;
    setRefreshing(true);
    try {
      const list = await api.listQuestions({ to_member_id: member.id });
      setQuestions(list);
      const uc = await api.unreadCount(member.id);
      setUnreadCount(uc.count);
    } catch (e) { console.error(e); }
    setRefreshing(false);
  }, [member]);

  useEffect(() => { load(); }, [load]);

  const pending = questions.filter(q => q.status === 'pending');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 22, paddingBottom: 90 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.modeLabel}>부모님 모드</Text>
          <Text style={styles.greeting}>안녕하세요, {member?.name}님</Text>
          <Text style={styles.subText}>
            {pending.length > 0
              ? `오늘 답할 이야기가 ${pending.length}건 있어요`
              : '모든 이야기에 답하셨어요'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={onGoNotif}>
            <Text style={{ fontSize: 24 }}>🔔</Text>
            {unreadCount > 0 && <View style={styles.unreadDot} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onGoSetting}>
            <Text style={{ fontSize: 24 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {pending.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>오늘 답할 이야기 {pending.length}건</Text>
          {pending.map(q => (
            <TouchableOpacity
              key={q.id}
              style={styles.qCard}
              onPress={() => onOpenQuestion(q.id)}
              activeOpacity={0.8}
            >
              <View style={styles.qHeader}>
                <Avatar initial="?" color={Colors.accent} size={38} />
                <Text style={styles.qByline}>질문</Text>
              </View>
              <Text style={styles.qText}>{q.content}</Text>
              <View style={styles.answerBtn}>
                <Text style={styles.answerBtnText}>🎙 답변하기</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>✅</Text>
          <Text style={styles.emptyTitle}>모든 이야기에 답하셨어요</Text>
          <Text style={styles.emptySub}>새 질문이 도착하면 알려드릴게요</Text>
        </View>
      )}

      <TouchableOpacity style={styles.shortcutCard} onPress={onGoCapsule} activeOpacity={0.8}>
        <View style={[styles.shortcutIcon, { backgroundColor: Colors.purple }]}>
          <Text style={{ fontSize: 26 }}>⏳</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.shortcutTitle}>타임캡슐</Text>
          <Text style={styles.shortcutSub}>정해진 날에 열리는 음성 편지</Text>
        </View>
        <Text style={{ fontSize: 22, color: Colors.accent }}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.shortcutCard2} onPress={onGoPoll} activeOpacity={0.8}>
        <View style={[styles.shortcutIcon, { backgroundColor: Colors.gold + '20' }]}>
          <Text style={{ fontSize: 26 }}>🗳</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.shortcutTitle}>가족 투표</Text>
          <Text style={styles.shortcutSub}>가족의 의견을 모아요</Text>
        </View>
        <Text style={{ fontSize: 22, color: Colors.textMuted }}>›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 26, paddingTop: 22, paddingBottom: 14, marginBottom: 0 },
  modeLabel: { fontSize: 13, color: Colors.accent, fontWeight: '800', letterSpacing: 0.4 },
  greeting: { fontSize: 28, fontWeight: '800', marginTop: 6, letterSpacing: -0.5, color: Colors.text },
  subText: { fontSize: 17, color: '#7C6A54', marginTop: 10, lineHeight: 26 },
  iconBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#F2E8DA', alignItems: 'center', justifyContent: 'center' },
  unreadDot: { position: 'absolute', top: 9, right: 11, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.red, borderWidth: 2, borderColor: '#F2E8DA' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#A8967E', letterSpacing: 0.3, paddingLeft: 2, marginBottom: 12 },
  qCard: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EBDECB', borderRadius: 22, padding: 22, gap: 15, marginBottom: 14 },
  qHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  qByline: { fontSize: 15, color: '#8C7961', fontWeight: '500' },
  qText: { fontSize: 22, lineHeight: 33, fontWeight: '700', letterSpacing: -0.3, color: Colors.text },
  answerBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: Colors.accent },
  answerBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  emptyCard: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  emptySub: { fontSize: 15, color: '#8C7961' },
  shortcutCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 19, borderRadius: 20, backgroundColor: Colors.accentSoft, marginTop: 18 },
  shortcutCard2: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 19, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EBDECB', marginTop: 12 },
  shortcutIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  shortcutTitle: { fontSize: 19, fontWeight: '700', color: Colors.accentStrong },
  shortcutSub: { fontSize: 15, color: '#5C4A36', marginTop: 3 },
});
