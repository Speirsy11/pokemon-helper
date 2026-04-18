'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useTeam, TeamMember, SavedTeam } from '@/context/TeamContext';
import { TypeBadge } from '@/components/TypeBadge';
import { ALL_TYPES, TYPE_COLORS } from '@/lib/constants';
import { artworkUrl } from '@/lib/pokeapi';

// ── Type analysis ────────────────────────────────────────────────

interface Analysis {
  weaknesses: Record<string, number>;
  offensiveCoverage: Set<string>;
}

async function analyzeTeam(team: TeamMember[]): Promise<Analysis> {
  const weaknesses: Record<string, number> = {};
  const offensiveCoverage = new Set<string>();

  await Promise.all(team.map(async member => {
    const defMult: Record<string, number> = Object.fromEntries(ALL_TYPES.map(t => [t, 1]));
    await Promise.all(member.types.map(async typeName => {
      const data = await fetch(`https://pokeapi.co/api/v2/type/${typeName}`).then(r => r.json());
      const dr = data.damage_relations;
      dr.double_damage_from.forEach((t: { name: string }) => { if (t.name in defMult) defMult[t.name] *= 2; });
      dr.half_damage_from.forEach((t: { name: string })   => { if (t.name in defMult) defMult[t.name] *= 0.5; });
      dr.no_damage_from.forEach((t: { name: string })     => { if (t.name in defMult) defMult[t.name] *= 0; });
      dr.double_damage_to.forEach((t: { name: string }) => offensiveCoverage.add(t.name));
    }));
    Object.entries(defMult).forEach(([t, m]) => {
      if (m >= 2) weaknesses[t] = (weaknesses[t] ?? 0) + 1;
    });
  }));

  return { weaknesses, offensiveCoverage };
}

// ── Main page ────────────────────────────────────────────────────

export default function TeamPage() {
  const { teams, activeTeam, createTeam, deleteTeam, switchTeam, renameTeam, removeMember } = useTeam();

  const [analysis,     setAnalysis]     = useState<Analysis | null>(null);
  const [analysisFor,  setAnalysisFor]  = useState<string>('');  // team id the analysis belongs to
  const [loadingAnalysis, setLoading]  = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // team id pending delete

  // Re-run analysis when active team's members change
  const members = activeTeam?.members ?? [];
  const membersKey = activeTeam?.id + ':' + members.map(m => m.name).join(',');

  useEffect(() => {
    if (!activeTeam || members.length === 0) { setAnalysis(null); return; }
    if (membersKey === analysisFor) return;
    setLoading(true);
    analyzeTeam(members).then(a => {
      setAnalysis(a);
      setAnalysisFor(membersKey);
      setLoading(false);
    });
  }, [membersKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = (id: string) => {
    const t = teams.find(x => x.id === id);
    if (t && t.members.length > 0) { setConfirmDelete(id); }
    else { deleteTeam(id); }
  };

  const slots = Array.from({ length: 6 }, (_, i) => members[i] ?? null);

  const notCovered = analysis ? ALL_TYPES.filter(t => !analysis.offensiveCoverage.has(t)) : [];
  const sharedWeaknesses = analysis
    ? Object.entries(analysis.weaknesses).filter(([, c]) => c >= 2).sort(([, a], [, b]) => b - a)
    : [];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-20">

      {/* ── Team tabs ── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {teams.map(t => (
          <TeamTab
            key={t.id}
            team={t}
            active={t.id === activeTeam?.id}
            onSelect={() => switchTeam(t.id)}
            onRename={name => renameTeam(t.id, name)}
            onDelete={() => handleDelete(t.id)}
          />
        ))}
        <button
          onClick={() => createTeam()}
          className="px-3 py-1.5 rounded font-display text-sm tracking-wider transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
        >
          + NEW TEAM
        </button>
      </div>

      {/* ── Empty state ── */}
      {teams.length === 0 && (
        <div className="text-center py-20 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-white/25 font-mono text-sm mb-5">No teams yet.</p>
          <button
            onClick={() => createTeam()}
            className="px-6 py-2.5 rounded font-display text-base tracking-wider"
            style={{ background: 'var(--accent)', color: '#07080f' }}
          >
            CREATE FIRST TEAM
          </button>
        </div>
      )}

      {/* ── Active team content ── */}
      {activeTeam && (
        <>
          {/* Slots */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
            {slots.map((member, i) => (
              <TeamSlot key={i} member={member} onRemove={member ? () => removeMember(member.name) : undefined} />
            ))}
          </div>

          {/* Analysis */}
          {members.length === 0 ? (
            <div className="text-center py-10 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white/20 font-mono text-sm">Add Pokémon from the</p>
              <Link href="/" className="font-mono text-sm underline underline-offset-2 hover:text-white/60 transition-colors" style={{ color: 'var(--accent)' }}>
                Pokédex
              </Link>
              <p className="text-white/20 font-mono text-sm">to build your team.</p>
            </div>
          ) : loadingAnalysis ? (
            <div className="flex items-center gap-3 py-8 text-white/30 font-mono text-sm">
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
              Analysing type coverage…
            </div>
          ) : analysis && (
            <div className="grid md:grid-cols-2 gap-3">
              {/* Defensive */}
              <AnalysisCard title="Shared Weaknesses" subtitle="Types where 2+ members are weak">
                {sharedWeaknesses.length === 0 ? (
                  <p className="text-white/25 font-mono text-xs">No shared weaknesses — great balance!</p>
                ) : sharedWeaknesses.map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <TypeBadge type={type} size="sm" />
                    <div className="flex gap-1">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i < count ? 'bg-red-400/60' : 'bg-white/10'}`} />
                      ))}
                    </div>
                    <span className="font-mono text-[0.6rem] text-white/30">{count}/{members.length}</span>
                  </div>
                ))}
              </AnalysisCard>

              {/* Offensive */}
              <AnalysisCard title="Offensive Coverage" subtitle="Based on STAB types">
                <p className="font-mono text-[0.55rem] tracking-widest text-white/25 uppercase mb-2">Covers</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {ALL_TYPES.filter(t => analysis.offensiveCoverage.has(t)).map(t => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>
                {notCovered.length > 0 && (
                  <>
                    <p className="font-mono text-[0.55rem] tracking-widest text-red-400/50 uppercase mb-2">Not Covered</p>
                    <div className="flex flex-wrap gap-1.5">
                      {notCovered.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded font-display text-[0.75rem] tracking-wider text-white/30"
                          style={{ background: `${TYPE_COLORS[t]}22`, border: `1px solid ${TYPE_COLORS[t]}33` }}>
                          {t.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </AnalysisCard>
            </div>
          )}
        </>
      )}

      {/* ── Delete confirmation ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="rounded-xl p-6 max-w-sm w-full" style={{ background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <p className="font-display text-xl tracking-wide mb-1">DELETE TEAM?</p>
            <p className="text-white/45 text-sm mb-6">
              &ldquo;{teams.find(t => t.id === confirmDelete)?.name}&rdquo; has Pokémon in it. This can&apos;t be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded text-sm text-white/50 hover:text-white/80 transition-colors border border-white/10">
                Cancel
              </button>
              <button
                onClick={() => { deleteTeam(confirmDelete); setConfirmDelete(null); }}
                className="px-4 py-2 rounded text-sm font-semibold text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function TeamTab({ team, active, onSelect, onRename, onDelete }: {
  team: SavedTeam;
  active: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value,   setValue]   = useState(team.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue(team.name);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    onRename(value.trim() || team.name);
    setEditing(false);
  };

  return (
    <div
      onClick={!editing ? onSelect : undefined}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded cursor-pointer transition-all group"
      style={active
        ? { background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.14)' }
        : { background: 'rgba(255,255,255,0.04)', border: '1px solid transparent' }}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          autoFocus
          className="bg-transparent border-none outline-none font-semibold text-sm text-white w-28"
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span
          className={`text-sm font-semibold tracking-wide ${active ? 'text-white' : 'text-white/45'}`}
          onDoubleClick={startEdit}
          title="Double-click to rename"
        >
          {team.name}
        </span>
      )}

      <span className="font-mono text-[0.6rem] text-white/30">{team.members.length}/6</span>

      {active && !editing && (
        <div className="flex items-center gap-0.5 ml-1">
          <button
            onClick={startEdit}
            className="w-5 h-5 rounded flex items-center justify-center text-white/20 hover:text-white/60 transition-colors text-[0.7rem]"
            title="Rename"
          >
            ✎
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="w-5 h-5 rounded flex items-center justify-center text-white/20 hover:text-red-400 transition-colors text-[0.8rem]"
            title="Delete team"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

function TeamSlot({ member, onRemove }: { member: TeamMember | null; onRemove?: () => void }) {
  if (!member) {
    return (
      <Link href="/" className="flex flex-col items-center justify-center rounded-xl aspect-square border border-dashed border-white/10 hover:border-white/25 transition-colors"
        style={{ background: 'var(--surface)' }}>
        <span className="text-white/20 text-2xl">+</span>
      </Link>
    );
  }

  return (
    <div className="relative group rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Link href={`/pokemon/${member.name}`} className="flex flex-col items-center p-2 pt-3">
        <img src={artworkUrl(member.id)} alt={member.name} width={80} height={80} className="w-16 h-16 object-contain" />
        <span className="font-mono text-[0.6rem] text-white/60 mt-1 text-center capitalize leading-tight">
          {member.name.replace(/-/g, ' ')}
        </span>
        <div className="flex gap-1 mt-1 flex-wrap justify-center">
          {member.types.map(t => <TypeBadge key={t} type={t} size="sm" />)}
        </div>
      </Link>
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-all text-white/60 hover:text-white bg-black/40"
        >
          ×
        </button>
      )}
    </div>
  );
}

function AnalysisCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="px-5 py-3" style={{ background: 'var(--surface2)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="font-mono text-[0.58rem] tracking-[0.3em] text-white/25 uppercase">{title}</p>
        <p className="font-mono text-[0.5rem] text-white/15 mt-0.5">{subtitle}</p>
      </div>
      <div className="p-4 flex flex-col gap-2">{children}</div>
    </div>
  );
}
