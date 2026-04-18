'use client';

import { createContext, useContext, useState, useEffect } from 'react';

export interface TeamMember {
  name: string;
  id: number;
  types: string[];
}

interface TeamContextValue {
  team: TeamMember[];
  addMember: (m: TeamMember) => void;
  removeMember: (name: string) => void;
  isInTeam: (name: string) => boolean;
  isFull: boolean;
}

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pokemon-team');
      if (saved) setTeam(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem('pokemon-team', JSON.stringify(team));
  }, [team, loaded]);

  const addMember = (m: TeamMember) => {
    setTeam(prev => {
      if (prev.length >= 6 || prev.some(p => p.name === m.name)) return prev;
      return [...prev, m];
    });
  };

  const removeMember = (name: string) => setTeam(prev => prev.filter(p => p.name !== name));
  const isInTeam = (name: string) => team.some(p => p.name === name);

  return (
    <TeamContext.Provider value={{ team, addMember, removeMember, isInTeam, isFull: team.length >= 6 }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
