// 알림 화면

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Colors } from '../theme';
import { Header, EmptyState } from '../components';
import { api } from '../api';
import { useApp } from '../store';
import { NotificationData } from '../types';

const ICONS: Record<string, string> = {
  question: '❓', response: '🎙', capsule: '⏳', poll: '🗳', face: '📷',
};

export function NotificationScreen({ onBack }: { onBack: () => void }) {
  const { member } = useApp();
  const [notifs, setNotifs] = useState<NotificationData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!member) return;
    setRefreshing(true);
    try {
      const list = await api.listNotifications(member.id);
      setNotifs(list);
    } catch (e) { console.error(e); }
    setRefreshing(false);
  }, [member]);

  useEffect(() => { load(); }, [load]);

  const handleReadAll = async () => {
    if (!member) return;
    await api.markAllRead(member.id);
    load();
  };

  const handleTap = async (id: string) => {
    await api.markRead(id);
    load();
  };

  return (
    <View style={styles.container}>
      <Header title="알림" onBack={onBack} right={
        <TouchableOpacity onPress={handleReadAll}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.accent }}>모두 읽음</Text>
        </TouchableOpacity>
      } />
      <FlatList
        data={notifs}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 22, gap: 10, paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={<EmptyState icon="🔔" text="알림이 없어요" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.notifCard, !item.is_read && styles.notifUnread]}
            onPress={() => handleTap(item.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.notifIcon, { backgroundColor: (item.color || Colors.accent) + '20' }]}>
              <Text style={{ fontSize: 22 }}>{ICONS[item.type] || '🔔'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.notifTitle, { fontWeight: item.is_read ? '600' : '800' }]}>{item.title}</Text>
              <Text style={styles.notifTime}>{new Date(item.created_at).toLocaleDateString('ko-KR')}</Text>
            </View>
            {!item.is_read ? <View style={styles.unreadDot} /> : null}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 18, padding: 16 },
  notifUnread: { backgroundColor: '#FBFAF7' },
  notifIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontSize: 15, lineHeight: 22, color: Colors.text },
  notifTime: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.red, marginTop: 6 },
});
