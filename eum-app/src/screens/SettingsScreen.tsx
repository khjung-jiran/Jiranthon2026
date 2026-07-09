// 설정 화면

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { Colors } from '../theme';
import { Header } from '../components';
import { api } from '../api';
import { useApp } from '../store';
import { Settings as SettingsType } from '../types';

const FONT_SIZES = [
  { label: '작게', value: 'small' },
  { label: '보통', value: 'medium' },
  { label: '크게', value: 'large' },
];

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { member, logout } = useApp();
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!member) return;
    try {
      const s = await api.getSettings(member.id);
      setSettings(s);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [member]);

  useEffect(() => { load(); }, [load]);

  const update = async (patch: Partial<SettingsType>) => {
    if (!member) return;
    try {
      await api.updateSettings(member.id, patch);
      setSettings(prev => prev ? { ...prev, ...patch } : prev);
    } catch (e: any) {
      Alert.alert('오류', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="설정" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 22, gap: 24, paddingBottom: 90 }}>
        <View>
          <Text style={styles.sectionTitle}>글자 크기</Text>
          <View style={styles.fontRow}>
            {FONT_SIZES.map(f => (
              <TouchableOpacity
                key={f.value}
                style={[styles.fontChip, settings?.font_size === f.value && styles.fontChipActive]}
                onPress={() => update({ font_size: f.value })}
              >
                <Text style={{ color: settings?.font_size === f.value ? '#fff' : Colors.text, fontSize: f.value === 'large' ? 18 : f.value === 'small' ? 13 : 15, fontWeight: '700' }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>음성 안내</Text>
            <Text style={styles.toggleDesc}>화면 전환 시 음성으로 안내해 드려요</Text>
          </View>
          <Switch
            value={settings?.voice_guide ?? false}
            onValueChange={(v) => update({ voice_guide: v })}
            trackColor={{ false: '#E0DED7', true: Colors.accent }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>자동 번역</Text>
            <Text style={styles.toggleDesc}>답변을 자동으로 번역해 보여줘요</Text>
          </View>
          <Switch
            value={settings?.auto_translate ?? false}
            onValueChange={(v) => update({ auto_translate: v })}
            trackColor={{ false: '#E0DED7', true: Colors.accent }}
          />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>이음 — Voice of Family</Text>
          <Text style={styles.infoText}>부모님의 목소리를 기록하고{'\n'}가족의 이야기책을 만들어요</Text>
          <Text style={styles.infoVersion}>v1.0.0</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => { logout(); }}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textMuted, marginBottom: 12 },
  fontRow: { flexDirection: 'row', gap: 10 },
  fontChip: { flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff', alignItems: 'center' },
  fontChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 18, padding: 18 },
  toggleTitle: { fontSize: 17, fontWeight: '700' },
  toggleDesc: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  infoCard: { backgroundColor: Colors.accentSoft, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  infoTitle: { fontSize: 18, fontWeight: '800', color: Colors.accent },
  infoText: { fontSize: 14, color: Colors.textSub, textAlign: 'center', lineHeight: 22 },
  infoVersion: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  logoutBtn: { height: 56, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.red + '40', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontSize: 16, fontWeight: '700', color: Colors.red },
});
