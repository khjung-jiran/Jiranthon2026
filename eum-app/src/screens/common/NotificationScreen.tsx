import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer, Icon } from '../../components';
import { colors, fonts, tint } from '../../theme';
import { useStore } from '../../store/useStore';
import type { RootStackParamList } from '../../navigation/types';
import type { Notif, NotifNav } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Notification'>;

/**
 * 알림 (sNotif) — 원본 이음.dc.html 라인 646~664.
 * 알림 리스트(mock notifs), 읽음/안읽음, 탭 시 해당 화면으로 이동.
 */
export function NotificationScreen({ navigation }: Props) {
  const notifs = useStore((s) => s.notifs);
  const role = useStore((s) => s.role);
  const markNotifRead = useStore((s) => s.markNotifRead);
  const readAllNotifs = useStore((s) => s.readAllNotifs);

  const go = (nav: NotifNav) => {
    switch (nav) {
      case 'caps':
        navigation.navigate('Capsule');
        break;
      case 'poll':
        navigation.navigate('Poll');
        break;
      case 'album':
        if (role === 'child') navigation.navigate('ChildTabs', { screen: 'Album' });
        else navigation.navigate('ParentTabs', { screen: 'Album' });
        break;
      case 'c_resp':
        if (role === 'child') navigation.navigate('ChildTabs', { screen: 'Voice' });
        else navigation.navigate('ParentTabs', { screen: 'Voice' });
        break;
      default:
        break;
    }
  };

  const onTap = (n: Notif) => {
    markNotifRead(n.id);
    go(n.nav);
  };

  const renderItem = ({ item: n }: { item: Notif }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onTap(n)}
      style={[styles.item, { backgroundColor: n.unread ? colors.surface : colors.bgScreen }]}
    >
      <View style={[styles.itemIcon, { backgroundColor: tint(n.color, 12) }]}>
        <Icon name={n.icon} size={22} color={n.color} />
      </View>
      <View style={styles.itemBody}>
        <Text style={[styles.itemTitle, { fontFamily: n.unread ? fonts.bold : fonts.medium }]}>
          {n.title}
        </Text>
        <Text style={styles.itemTime}>{n.time}</Text>
      </View>
      <View style={[styles.dot, { opacity: n.unread ? 1 : 0 }]} />
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      {/* 헤더 (원본 라인 648~652) */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrow_back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={readAllNotifs} style={styles.readAll}>
          <Text style={styles.readAllText}>모두 읽음</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifs}
        keyExtractor={(n) => String(n.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontFamily: fonts.extraBold, fontSize: 19, color: colors.text },
  readAll: { padding: 8 },
  readAllText: { fontFamily: fonts.bold, fontSize: 14, color: colors.accent },

  listContent: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 26 },
  sep: { height: 10 },

  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    borderWidth: 1.5,
    borderColor: colors.border3,
    borderRadius: 18,
    padding: 16,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 15, lineHeight: 22, color: colors.text },
  itemTime: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint, marginTop: 4 },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.danger,
    marginTop: 6,
  },
});

export default NotificationScreen;
