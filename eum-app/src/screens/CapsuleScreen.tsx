// 타임캡슐 목록 + 생성 화면

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { Colors } from '../theme';
import { Header, Button, EmptyState } from '../components';
import { api } from '../api';
import { useApp } from '../store';
import { Capsule } from '../types';

export function CapsuleScreen({ onBack }: { onBack: () => void }) {
  const { family } = useApp();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');
  const [toName, setToName] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!family) return;
    setRefreshing(true);
    try {
      const list = await api.listCapsules(family.id);
      setCapsules(list);
    } catch (e) { console.error(e); }
    setRefreshing(false);
  }, [family]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!family || !title.trim() || !openDate.trim()) return;
    setCreating(true);
    try {
      const members = await api.listMembers(family.id);
      const target = members.find(m => m.name === toName) || members[0];
      if (!target) { alert('수신자를 찾을 수 없습니다'); return; }
      await api.createCapsule({
        family_id: family.id,
        from_member_id: target.id,
        to_member_id: target.id,
        title: title.trim(),
        open_date: openDate.trim(),
      });
      setTitle(''); setOpenDate(''); setShowNew(false);
      load();
    } catch (e: any) { alert(e.message); }
    setCreating(false);
  };

  if (showNew) {
    return (
      <View style={styles.container}>
        <Header title="타임캡슐 만들기" onBack={() => setShowNew(false)} />
        <View style={{ padding: 22, gap: 16 }}>
          <View>
            <Text style={styles.label}>캡슐 이름</Text>
            <TextInput style={styles.input} placeholder="예: 서연이 결혼하는 날에" value={title} onChangeText={setTitle} />
          </View>
          <View>
            <Text style={styles.label}>누구에게</Text>
            <TextInput style={styles.input} placeholder="이름 (예: 엄마)" value={toName} onChangeText={setToName} />
          </View>
          <View>
            <Text style={styles.label}>언제 열릴까요? (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} placeholder="2027-07-09" value={openDate} onChangeText={setOpenDate} />
          </View>
          <Text style={styles.hint}>봉인 후에는 열리는 날까지 수정하거나 들을 수 없어요</Text>
        </View>
        <View style={styles.footer}>
          <Button title="봉인하기" onPress={handleCreate} loading={creating} disabled={!title.trim() || !openDate.trim()} />
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Capsule }) => {
    const locked = item.status === 'locked';
    const ready = item.status === 'ready';
    return (
      <TouchableOpacity
        style={[styles.capCard, ready && styles.capCardReady]}
        onPress={() => ready ? api.openCapsule(item.id).then(load) : null}
        activeOpacity={0.8}
      >
        <View style={[styles.capIcon, { backgroundColor: locked ? '#EFEEE8' : Colors.accentSoft }]}>
          <Text style={{ fontSize: 26 }}>{locked ? '🔒' : ready ? '📬' : '▶️'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.capTitle}>{item.title}</Text>
          <Text style={styles.capMeta}>{item.open_date} · {locked ? 'D-day' : ready ? '오늘 열 수 있어요' : '열렸어요'}</Text>
        </View>
        <View style={[styles.capChip, { backgroundColor: locked ? '#EFEEE8' : ready ? Colors.accent : '#E7F0EA' }]}>
          <Text style={{ color: locked ? Colors.textSub : ready ? '#fff' : Colors.green, fontSize: 13, fontWeight: '800' }}>
            {locked ? '잠김' : ready ? '오늘' : '열림'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="타임캡슐" subtitle="정해진 날에 열리는 음성 편지" onBack={onBack} />
      <FlatList
        data={capsules}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 22, gap: 12, paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={<EmptyState icon="⏳" text="아직 타임캡슐이 없어요" />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
      <View style={styles.footer}>
        <Button title="⏳ 타임캡슐 만들기" onPress={() => setShowNew(true)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  label: { fontSize: 15, fontWeight: '800', color: Colors.textMuted, marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 16, padding: 15, fontSize: 16, backgroundColor: '#fff' },
  hint: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  footer: { padding: 22, borderTopWidth: 1, borderColor: '#EDEBE4', backgroundColor: Colors.bg },
  capCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20, padding: 17 },
  capCardReady: { borderColor: Colors.accent },
  capIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  capTitle: { fontSize: 16, fontWeight: '700' },
  capMeta: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  capChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
});
