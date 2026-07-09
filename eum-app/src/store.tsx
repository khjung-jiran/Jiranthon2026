// 앱 전역 상태 관리 (Context)

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Member, Family } from './types';
import { api } from './api';

interface AppState {
  family: Family | null;
  member: Member | null;
  members: Member[];
  setFamily: (f: Family | null) => void;
  setMember: (m: Member | null) => void;
  refreshMembers: () => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [family, setFamily] = useState<Family | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  const refreshMembers = async () => {
    if (family) {
      const list = await api.listMembers(family.id);
      setMembers(list);
    }
  };

  useEffect(() => {
    if (family) refreshMembers();
  }, [family]);

  const logout = () => {
    setFamily(null);
    setMember(null);
    setMembers([]);
  };

  return (
    <AppContext.Provider value={{ family, member, members, setFamily, setMember, refreshMembers, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
