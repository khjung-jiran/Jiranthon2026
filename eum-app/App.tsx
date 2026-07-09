import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppProvider, useApp } from './src/store';
import { Colors } from './src/theme';
import { BottomNav } from './src/components';
import { api } from './src/api';
import { LoginScreen } from './src/screens/LoginScreen';
import { ParentHomeScreen } from './src/screens/ParentHomeScreen';
import { ParentQuestionListScreen } from './src/screens/ParentQuestionListScreen';
import { ParentQuestionDetailScreen } from './src/screens/ParentQuestionDetailScreen';
import { ChildDashboardScreen } from './src/screens/ChildDashboardScreen';
import { ChildComposeScreen } from './src/screens/ChildComposeScreen';
import { ChildResponsesScreen } from './src/screens/ChildResponsesScreen';
import { StorybookScreen } from './src/screens/StorybookScreen';
import { CapsuleScreen } from './src/screens/CapsuleScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { AlbumScreen } from './src/screens/AlbumScreen';
import { PollScreen } from './src/screens/PollScreen';
import { NotificationScreen } from './src/screens/NotificationScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type Screen =
  | 'login'
  | 'p_home'
  | 'p_list'
  | 'p_detail'
  | 'c_dash'
  | 'c_compose'
  | 'c_resp'
  | 'c_story'
  | 'capsule'
  | 'calendar'
  | 'album'
  | 'poll'
  | 'notif'
  | 'settings'
  | 'booklet';

function AppContent() {
  const { member } = useApp();
  const [screen, setScreen] = useState<Screen>('login');
  const [selectedQ, setSelectedQ] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState(0);

  const isParent = member?.role === 'parent';
  const home: Screen = isParent ? 'p_home' : 'c_dash';

  useEffect(() => {
    if (member && screen !== 'login') {
      api.unreadCount(member.id).then(r => setUnreadCount(r.count)).catch(() => {});
    }
  }, [member, screen]);

  if (!member) {
    return <LoginScreen />;
  }

  if (screen === 'login') {
    setScreen(home);
    return null;
  }

  const handleNav = (tab: string) => {
    if (tab === 'home') { setScreen(home); return; }
    if (tab === 'voice') { setScreen(isParent ? 'p_list' : 'c_resp'); return; }
    if (tab === 'calendar') { setScreen('calendar'); return; }
    if (tab === 'album') { setScreen('album'); return; }
  };

  const showBottomNav = ['p_home', 'p_list', 'c_dash', 'c_resp', 'capsule', 'calendar', 'album', 'poll', 'notif', 'settings'].includes(screen);
  const navCurrent =
    screen === 'p_home' || screen === 'c_dash' ? 'home' :
    screen === 'p_list' || screen === 'c_resp' ? 'voice' :
    screen;

  function renderScreen() {
    switch (screen) {
      case 'p_home':
        return (
          <ParentHomeScreen
            onOpenQuestion={(id) => { setSelectedQ(id); setScreen('p_detail'); }}
            onGoNotif={() => setScreen('notif')}
            onGoSetting={() => setScreen('settings')}
            onGoCapsule={() => setScreen('capsule')}
            onGoPoll={() => setScreen('poll')}
          />
        );
      case 'p_list':
        return (
          <ParentQuestionListScreen
            onOpenQuestion={(id) => { setSelectedQ(id); setScreen('p_detail'); }}
          />
        );
      case 'p_detail':
        return (
          <ParentQuestionDetailScreen
            questionId={selectedQ}
            onBack={() => setScreen('p_home')}
            onAnswered={() => setScreen('p_home')}
          />
        );
      case 'c_dash':
        return (
          <ChildDashboardScreen
            onCompose={() => setScreen('c_compose')}
            onResponses={() => setScreen('c_resp')}
            onStory={() => setScreen('c_story')}
            onCapsule={() => setScreen('capsule')}
            onPoll={() => setScreen('poll')}
          />
        );
      case 'c_compose':
        return (
          <ChildComposeScreen
            onBack={() => setScreen('c_dash')}
            onSent={() => setScreen('c_dash')}
          />
        );
      case 'c_resp':
        return <ChildResponsesScreen onBack={() => setScreen('c_dash')} />;
      case 'c_story':
        return <StorybookScreen onBack={() => setScreen('c_dash')} onBooklet={() => setScreen('booklet')} />;
      case 'booklet':
        return (
          <View style={styles.comingSoon}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📖</Text>
            <Text style={{ fontSize: 22, fontWeight: '800' }}>소책자 준비 중</Text>
            <Text style={{ color: Colors.textSub, marginTop: 8 }}>모인 이야기를 책으로 간직해요</Text>
          </View>
        );
      case 'capsule':
        return <CapsuleScreen onBack={() => setScreen(home)} />;
      case 'calendar':
        return <CalendarScreen onBack={() => setScreen(home)} />;
      case 'album':
        return <AlbumScreen onBack={() => setScreen(home)} />;
      case 'poll':
        return <PollScreen onBack={() => setScreen(home)} />;
      case 'notif':
        return <NotificationScreen onBack={() => setScreen(home)} />;
      case 'settings':
        return <SettingsScreen onBack={() => setScreen(home)} />;
      default:
        return null;
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{renderScreen()}</View>
      {showBottomNav && <BottomNav current={navCurrent} onNavigate={handleNav} unreadCount={unreadCount} role={member.role} />}
    </View>
  );
}

export default function App() {
  return (
    <AppProvider>
      <View style={styles.container}>
        <AppContent />
        <StatusBar style="auto" />
      </View>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  comingSoon: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
});
