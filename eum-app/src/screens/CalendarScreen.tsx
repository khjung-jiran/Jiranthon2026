// 캘린더 화면

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Colors } from '../theme';
import { Header, Button, EmptyState } from '../components';
import { api } from '../api';
import { useApp } from '../store';
import { CalendarEntry } from '../types';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const TAG_COLORS: Record<string, string> = {
  '생일': '#8C5F6E', '모임': '#3C6E8F', '여행': '#5F8C6E', '기타': '#9A7B3C',
};

export function CalendarScreen({ onBack }: { onBack: () => void }) {
  const { family, member } = useApp();
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTag, setNewTag] = useState('기타');

  const load = useCallback(async () => {
    if (!family) return;
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const list = await api.listCalendarEntries(family.id, month);
      setEntries(list);
    } catch (e) { console.error(e); }
  }, [family]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!family || !member || !newTitle.trim() || !newDate.trim()) return;
    try {
      await api.createCalendarEntry({
        family_id: family.id,
        date: newDate.trim(),
        title: newTitle.trim(),
        created_by: member.id,
        tag: newTag,
        color: TAG_COLORS[newTag] || '#9A7B3C',
      });
      setNewTitle(''); setNewDate(''); setShowAdd(false);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const entryByDay: Record<number, CalendarEntry[]> = {};
  entries.forEach(e => {
    const d = new Date(e.date).getDate();
    if (!entryByDay[d]) entryByDay[d] = [];
    entryByDay[d].push(e);
  });

  return (
    <View style={styles.container}>
      <Header title="가족 캘린더" subtitle={`${year}년 ${month + 1}월`} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 90 }}>
        <View style={styles.calCard}>
          <View style={styles.weekRow}>
            {WEEKDAYS.map(w => <Text key={w} style={styles.weekText}>{w}</Text>)}
          </View>
          <View style={styles.grid}>
            {cells.map((d, i) => (
              <View key={i} style={[styles.cell, d === today && styles.cellToday]}>
                {d ? (
                  <>
                    <Text style={[styles.cellNum, d === today && styles.cellNumToday]}>{d}</Text>
                    {entryByDay[d] ? <View style={[styles.dot, { backgroundColor: entryByDay[d][0].color || Colors.accent }]} /> : null}
                  </>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>다가오는 일정</Text>
        {entries.length > 0 ? entries.map(e => (
          <View key={e.id} style={styles.eventCard}>
            <View style={[styles.eventDate, { backgroundColor: (e.color || Colors.accent) + '20' }]}>
              <Text style={[styles.eventDay, { color: e.color }]}>{new Date(e.date).getDate()}</Text>
              <Text style={[styles.eventDow, { color: e.color }]}>{WEEKDAYS[new Date(e.date).getDay()]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.eventTitle}>{e.title}</Text>
              <Text style={styles.eventMeta}>{e.date}{e.tag ? ` · ${e.tag}` : ''}</Text>
            </View>
            {e.tag ? <View style={[styles.eventTag, { backgroundColor: (e.color || Colors.accent) + '20' }]}><Text style={{ color: e.color, fontSize: 12, fontWeight: '700' }}>{e.tag}</Text></View> : null}
          </View>
        )) : <EmptyState icon="📅" text="이번 달 일정이 없어요" />}

        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ 일정 추가</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>일정 추가</Text>
            <TextInput style={styles.input} placeholder="제목" value={newTitle} onChangeText={setNewTitle} />
            <TextInput style={styles.input} placeholder="날짜 (YYYY-MM-DD)" value={newDate} onChangeText={setNewDate} />
            <View style={styles.tagRow}>
              {Object.keys(TAG_COLORS).map(t => (
                <TouchableOpacity key={t} style={[styles.tagChip, newTag === t && styles.tagChipActive]} onPress={() => setNewTag(t)}>
                  <Text style={{ color: newTag === t ? '#fff' : Colors.text, fontSize: 14, fontWeight: '700' }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity style={[styles.modalBtn, { flex: 1, backgroundColor: '#EEEDE7' }]} onPress={() => setShowAdd(false)}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text, textAlign: 'center' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { flex: 1, backgroundColor: Colors.accent }]} onPress={handleAdd}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' }}>추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  calCard: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20, padding: 14 },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekText: { flex: 1, textAlign: 'center', fontSize: 12, color: Colors.textMuted, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  cellToday: { backgroundColor: Colors.accent },
  cellNum: { fontSize: 14, fontWeight: '600', color: Colors.text },
  cellNumToday: { color: '#fff', fontWeight: '800' },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textMuted, marginTop: 22, marginBottom: 12 },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 18, padding: 14, marginBottom: 10 },
  eventDate: { width: 56, borderRadius: 14, padding: 9, alignItems: 'center' },
  eventDay: { fontSize: 20, fontWeight: '800', lineHeight: 22 },
  eventDow: { fontSize: 12, fontWeight: '700' },
  eventTitle: { fontSize: 16, fontWeight: '700' },
  eventMeta: { fontSize: 13, color: Colors.textMuted, marginTop: 3 },
  eventTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  addBtn: { height: 54, borderRadius: 16, borderWidth: 1.5, borderColor: '#C9CFC9', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  addBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textSub },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 30 },
  modalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 26 },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, padding: 14, fontSize: 16, backgroundColor: '#fff', marginBottom: 10 },
  tagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tagChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff' },
  tagChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  modalBtn: { paddingVertical: 14, borderRadius: 14 },
});
