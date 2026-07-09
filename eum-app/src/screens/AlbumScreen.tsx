// 가족 앨범 화면 - 상단 가족 멤버 표시

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Colors } from '../theme';
import { Header, EmptyState, Avatar } from '../components';
import { api } from '../api';
import { useApp } from '../store';
import { Member } from '../types';

export function AlbumScreen({ onBack }: { onBack: () => void }) {
  const { family, member } = useApp();
  const [members, setMembers] = useState<Member[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family) return;
    setRefreshing(true);
    try {
      const list = await api.listMembers(family.id);
      setMembers(list);
    } catch (e) { console.error(e); }
    setRefreshing(false);
  }, [family]);

  useEffect(() => { load(); }, [load]);

  const parents = members.filter(m => m.role === 'parent');
  const children = members.filter(m => m.role === 'child');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 22, paddingBottom: 90 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
    >
      <Header title="가족 앨범" subtitle="모인 순간들" onBack={onBack} />

      <Text style={styles.sectionTitle}>우리 가족</Text>
      <View style={styles.memberGrid}>
        {members.map(m => (
          <View key={m.id} style={styles.memberCard}>
            <Avatar
              initial={m.name[0]}
              color={m.role === 'parent' ? Colors.olive : Colors.childBlue}
              size={64}
            />
            <Text style={styles.memberName}>{m.name}</Text>
            <Text style={styles.memberRole}>{m.role === 'parent' ? '부모님' : '자녀'}</Text>
          </View>
        ))}
      </View>

      {parents.length > 0 && (
        <>
          <Text style={styles.subSectionTitle}>부모님</Text>
          <View style={styles.row}>
            {parents.map(m => (
              <View key={m.id} style={styles.memberChip}>
                <Avatar initial={m.name[0]} color={Colors.olive} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.chipName}>{m.name}</Text>
                  {m.username ? <Text style={styles.chipSub}>@{m.username}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {children.length > 0 && (
        <>
          <Text style={styles.subSectionTitle}>자녀</Text>
          <View style={styles.row}>
            {children.map(m => (
              <View key={m.id} style={styles.memberChip}>
                <Avatar initial={m.name[0]} color={Colors.childBlue} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.chipName}>{m.name}</Text>
                  {m.username ? <Text style={styles.chipSub}>@{m.username}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {members.length <= 1 && (
        <EmptyState icon="👨‍👩‍👧" text="가족 멤버를 초대해 보세요" />
      )}

      {family?.invite_code && (
        <View style={styles.inviteCard}>
          <Text style={styles.inviteTitle}>가족 초대 코드</Text>
          <Text style={styles.inviteCode}>{family.invite_code}</Text>
          <Text style={styles.inviteHint}>이 코드를 가족에게 공유하면 참여할 수 있어요</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.3, marginTop: 16, marginBottom: 12 },
  subSectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.textMuted, marginTop: 20, marginBottom: 10 },
  memberGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  memberCard: { alignItems: 'center', gap: 8 },
  memberName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  memberRole: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  row: { flexDirection: 'column', gap: 10 },
  memberChip: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 18, padding: 16 },
  chipName: { fontSize: 16, fontWeight: '700' },
  chipSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  inviteCard: { backgroundColor: Colors.accentSoft, borderRadius: 20, padding: 24, alignItems: 'center', marginTop: 24, gap: 8 },
  inviteTitle: { fontSize: 15, fontWeight: '800', color: Colors.accent },
  inviteCode: { fontSize: 28, fontWeight: '800', color: Colors.accentStrong, letterSpacing: 4 },
  inviteHint: { fontSize: 13, color: Colors.textSub, textAlign: 'center' },
});
