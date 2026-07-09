// 공통 UI 컴포넌트

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from './theme';

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  color = Colors.accent,
  textColor = '#fff',
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, { backgroundColor: disabled ? '#D9D7CF' : color }, style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.buttonText, { color: disabled ? '#A6AEA7' : textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

export function Badge({ label, bg, fg, icon }: { label: string; bg: string; fg: string; icon?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon ? <Text style={{ fontSize: 16, marginRight: 4 }}>{icon}</Text> : null}
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Avatar({ initial, color, size = 40 }: { initial: string; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.4 }}>{initial}</Text>
    </View>
  );
}

export function Header({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </TouchableOpacity>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 40, marginBottom: 10 }}>{icon}</Text>
      <Text style={{ color: Colors.textMuted, fontSize: 15, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}

export function BottomNav({
  current,
  onNavigate,
  unreadCount = 0,
  role = 'child',
}: {
  current: string;
  onNavigate: (screen: string) => void;
  unreadCount?: number;
  role?: string;
}) {
  const tabs = [
    { key: 'home', icon: '🏠', label: '홈' },
    { key: 'voice', icon: '🎙', label: '이야기' },
    { key: 'calendar', icon: '📅', label: '달력' },
    { key: 'album', icon: '📷', label: '사진' },
  ];
  return (
    <View style={bottomNavStyles.container}>
      <View style={bottomNavStyles.tabRow}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={bottomNavStyles.tab}
            onPress={() => onNavigate(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 26, color: current === tab.key ? Colors.accent : '#B5A48A' }}>{tab.icon}</Text>
            <Text style={[bottomNavStyles.label, { color: current === tab.key ? Colors.accent : '#B5A48A' }]}>{tab.label}</Text>
            {tab.key === 'home' && unreadCount > 0 ? (
              <View style={bottomNavStyles.badge}>
                <Text style={bottomNavStyles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
      <View style={bottomNavStyles.homeIndicator}>
        <View style={bottomNavStyles.homeIndicatorBar} />
      </View>
    </View>
  );
}

const bottomNavStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#EEE2D1',
  },
  tabRow: { flexDirection: 'row', padding: 9, paddingHorizontal: 10, paddingBottom: 4 },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6 },
  label: { fontSize: 11, fontWeight: '700' },
  badge: { position: 'absolute', top: 2, right: '25%', backgroundColor: Colors.red, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  homeIndicator: { height: 22, alignItems: 'center', justifyContent: 'center' },
  homeIndicatorBar: { width: 132, height: 5, borderRadius: 3, backgroundColor: '#2E2318', opacity: 0.85 },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: '#EBDECB',
    borderRadius: 20,
    padding: 20,
  },
  button: {
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#F2E8DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.text,
  },
  headerSub: {
    fontSize: 13,
    color: '#9A8873',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});
