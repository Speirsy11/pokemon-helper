'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTeam, TeamMember } from '@/context/TeamContext';
import { TypeBadge } from '@/components/TypeBadge';
import { ALL_TYPES, TYPE_COLORS } from '@/lib/constants';
import { artworkUrl } from '@/lib/pokeapi';

interface TypeAnalysis {
  weaknesses: Record<string, number>;  // type → how many team members are weak
  offensiveCoverage: Set<string>;      // types the team can hit super-effectively
}

async function analyzeTeam(team: TeamMember[]): Promise<TypeAnalysis> {
  const weaknesses: Record<string, number> = {};
  const offensiveCoverage = new Set<string>();

  await Promise.all(team.map(async member => {
    const defMult: Record<string, number> = Object.fromEntries(ALL_TYPES.map(t => [t, 1]));

    await Promise.all(member.types.map(async typeName => {
      const res = await fetch(`https://pokeapi.co/api/v2/type/${typeName}`);
      const data = await res.json();
      const dr = data.damage_relations;

      dr.double_damage_from.forEach((t: { name: string }) => { if (t.name in defMult) defMult[t.name] *= 2; });
      dr.half_damage_from.forEach((t: { name: string }) => { if (t.name in defMult) defMult[t.name] *= 0.5; });
      dr.no_damage_from.forEach((t: { name: string }) => { if (t.name in defMult) defMult[t.name] *= 0; });

      // Offensive: what types does this type hit super-effectively?
      dr.double_damage_to.forEach((t: { name: string }) => offensiveCoverage.add(t.name));
    }));

    // Count how many members are weak to each type
    Object.entries(defMult).forEach(([t, m]) => {
      if (m >= 2) weaknesses[t] = (weaknesses[t] ?? 0) + 1;
    });
  }));

  return { weaknesses, offensiveCoverage };
}

export default function TeamPage() {
  const { team, removeMember } = useTeam();
  const [analysis, setAnalysis] = useState<TypeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (team.length === 0) { setAnalysis(null); return; }
    setLoading(true);
    analyzeTeam(team).then(a => { setAnalysis(a); setLoading(false); });
  }, [team]);

  const slots = Array.from({ length: 6 }, (_, i) => team[i] ?? null);

  const notCovered = analysis
    ? ALL_TYPES.filter(t => !analysis.offensiveCoverage.has(t))
    : [];

  const teamWeaknesses = analysis
    ? Object.entries(analysis.weaknesses)
        .filter(([, count]) => count >= 2)
        .sort(([, a], [, b]) => b - a)
    : [];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-20">
      <div className="mb-8">
        <h2 className="font-display text-3xl tracking-[0.15em] text-white">TEAM BUILDER</h2>
        <p className="font-mono text-[0.6rem] tracking-[0.3em] text-white/25 mt-1">UP TO 6 POKÉMON</p>
      </div>

      {/* Team slots */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
        {slots.map((member, i) => (
          <TeamSlot key={i} member={member} onRemove={member ? () => removeMember(member.name) : undefined} />
        ))}
      </div>

      {team.length === 0 && (
        <div className="text-center py-16 rounded-xl mb-8" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-white/25 font-mono text-sm mb-4">Your team is empty.</p>
          <Link
            href="/"
            className="px-5 py-2 rounded text-sm font-semibold tracking-wide transition-colors"
            style={{ background: 'var(--accent)', color: '#07080f' }}
          >
            Browse Pokédex
          </Link>
        </div>
      )}

      {team.length > 0 && (
        <>
          {loading ? (
            <div className="flex items-center gap-3 py-8 text-white/30 font-mono text-sm">
              <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
              Analysing type coverage…
            </div>
          ) : analysis && (
            <div className="grid md:grid-cols-2 gap-3">
              {/* Defensive weaknesses */}
              <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="px-5 py-3" style={{ background: 'var(--surface2)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="font-mono text-[0.58rem] tracking-[0.3em] text-white/25 uppercase">Shared Weaknesses</p>
                  <p className="font-mono text-[0.5rem] text-white/15 mt-0.5">Types where 2+ members are weak</p>
                </div>
                <div className="p-4">
                  {teamWeaknesses.length === 0 ? (
                    <p className="text-white/25 font-mono text-xs">No shared weaknesses — great team balance!</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {teamWeaknesses.map(([type, count]) => (
                        <div key={type} className="flex items-center gap-3">
                          <TypeBadge type={type} size="sm" />
                          <div className="flex gap-1">
                            {Array.from({ length: count }).map((_, i) => (
                              <div key={i} className="w-2 h-2 rounded-full bg-red-400/60" />
                            ))}
                            {Array.from({ length: 6 - count }).map((_, i) => (
                              <div key={i} className="w-2 h-2 rounded-full bg-white/10" />
                            ))}
                          </div>
                          <span className="font-mono text-[0.6rem] text-white/30">{count}/6</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Offensive coverage gaps */}
              <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="px-5 py-3" style={{ background: 'var(--surface2)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="font-mono text-[0.58rem] tracking-[0.3em] text-white/25 uppercase">Offensive Coverage</p>
                  <p className="font-mono text-[0.5rem] text-white/15 mt-0.5">Based on STAB types</p>
                </div>
                <div className="p-4">
                  <p className="font-mono text-[0.58rem] text-white/30 uppercase tracking-widest mb-2">Covers</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {ALL_TYPES.filter(t => analysis.offensiveCoverage.has(t)).map(t => (
                      <TypeBadge key={t} type={t} size="sm" />
                    ))}
                  </div>
                  {notCovered.length > 0 && (
                    <>
                      <p className="font-mono text-[0.58rem] text-red-400/50 uppercase tracking-widest mb-2">Not Covered</p>
                      <div className="flex flex-wrap gap-1.5">
                        {notCovered.map(t => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded text-[0.75rem] font-display tracking-wider text-white/30"
                            style={{ background: `${TYPE_COLORS[t]}22`, border: `1px solid ${TYPE_COLORS[t]}33` }}
                          >
                            {t.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TeamSlot({ member, onRemove }: { member: TeamMember | null; onRemove?: () => void }) {
  if (!member) {
    return (
      <Link
        href="/"
        className="flex flex-col items-center justify-center rounded-xl aspect-square border border-dashed border-white/10 hover:border-white/25 transition-colors"
        style={{ background: 'var(--surface)' }}
      >
        <span className="text-white/20 text-2xl">+</span>
      </Link>
    );
  }

  return (
    <div className="relative group rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Link href={`/pokemon/${member.name}`} className="flex flex-col items-center p-2 pt-3">
        <img
          src={artworkUrl(member.id)}
          alt={member.name}
          width={80}
          height={80}
          className="w-16 h-16 object-contain"
        />
        <span className="font-mono text-[0.6rem] text-white/60 mt-1 text-center capitalize leading-tight">
          {member.name.replace(/-/g, ' ')}
        </span>
        <div className="flex gap-1 mt-1 flex-wrap justify-center">
          {member.types.map(t => (
            <TypeBadge key={t} type={t} size="sm" />
          ))}
        </div>
      </Link>
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500/0 hover:bg-red-500/20 text-white/0 group-hover:text-white/50 transition-all flex items-center justify-center text-xs font-bold"
        >
          ×
        </button>
      )}
    </div>
  );
}
