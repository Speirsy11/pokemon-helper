'use client';

import { createContext, useContext, useState, useEffect } from 'react';

export interface TeamMember {
  name: string;
  id: number;
  types: string[];
}

export interface SavedTeam {
  id: string;
  name: string;
  members: TeamMember[];
}

interface TeamContextValue {
  teams: SavedTeam[];
  activeTeam: SavedTeam | null;
  createTeam: (name?: string) => string; // returns new team id
  deleteTeam: (id: string) => void;
  switchTeam: (id: string) => void;
  renameTeam: (id: string, name: string) => void;
  addMember: (m: TeamMember) => void;
  removeMember: (name: string) => void;
  isInActiveTeam: (name: string) => boolean;
  isFull: boolean;
}

const TeamContext = createContext<TeamContextValue | null>(null);

const STORAGE_KEY = 'pokemon-teams-v2';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [teams,        setTeams]        = useState<SavedTeam[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [hydrated,     setHydrated]     = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { teams: t, activeTeamId: a } = JSON.parse(raw);
        if (Array.isArray(t)) setTeams(t);
        if (a) setActiveTeamId(a);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ teams, activeTeamId }));
  }, [hydrated, teams, activeTeamId]);

  const activeTeam = teams.find(t => t.id === activeTeamId) ?? null;

  const createTeam = (name?: string) => {
    const id = makeId();
    const label = name?.trim() || `Team ${teams.length + 1}`;
    setTeams(prev => [...prev, { id, name: label, members: [] }]);
    setActiveTeamId(id);
    return id;
  };

  const deleteTeam = (id: string) => {
    setTeams(prev => {
      const next = prev.filter(t => t.id !== id);
      if (activeTeamId === id) setActiveTeamId(next[next.length - 1]?.id ?? null);
      return next;
    });
  };

  const switchTeam = (id: string) => setActiveTeamId(id);

  const renameTeam = (id: string, name: string) =>
    setTeams(prev => prev.map(t => t.id === id ? { ...t, name } : t));

  const addMember = (m: TeamMember) => {
    let targetId = activeTeamId;
    if (!targetId) {
      // Auto-create a team if none exists
      targetId = makeId();
      setTeams(prev => [...prev, { id: targetId!, name: 'My Team', members: [m] }]);
      setActiveTeamId(targetId);
      return;
    }
    setTeams(prev => prev.map(t => {
      if (t.id !== targetId) return t;
      if (t.members.length >= 6 || t.members.some(p => p.name === m.name)) return t;
      return { ...t, members: [...t.members, m] };
    }));
  };

  const removeMember = (name: string) =>
    setTeams(prev => prev.map(t =>
      t.id === activeTeamId ? { ...t, members: t.members.filter(p => p.name !== name) } : t
    ));

  const isInActiveTeam = (name: string) =>
    activeTeam?.members.some(p => p.name === name) ?? false;

  const isFull = (activeTeam?.members.length ?? 0) >= 6;

  return (
    <TeamContext.Provider value={{
      teams, activeTeam, createTeam, deleteTeam, switchTeam, renameTeam,
      addMember, removeMember, isInActiveTeam, isFull,
    }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
