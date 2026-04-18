'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { spriteUrl, formatName } from '@/lib/pokeapi';

interface PokemonEntry {
  name: string;
  id: number;
}

const GENS = [
  { label: 'All',  min: 1,   max: 1025 },
  { label: 'I',    min: 1,   max: 151  },
  { label: 'II',   min: 152, max: 251  },
  { label: 'III',  min: 252, max: 386  },
  { label: 'IV',   min: 387, max: 493  },
  { label: 'V',    min: 494, max: 649  },
  { label: 'VI',   min: 650, max: 721  },
  { label: 'VII',  min: 722, max: 809  },
  { label: 'VIII', min: 810, max: 905  },
  { label: 'IX',   min: 906, max: 1025 },
];

export function PokemonGrid({ pokemon }: { pokemon: PokemonEntry[] }) {
  const [query, setQuery] = useState('');
  const [gen, setGen] = useState(0); // index into GENS

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const { min, max } = GENS[gen];
    return pokemon.filter(p => {
      if (p.id < min || p.id > max) return false;
      if (!q) return true;
      return p.name.includes(q) || String(p.id) === q;
    });
  }, [pokemon, query, gen]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {/* Controls */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div
          className="flex w-full max-w-xs rounded overflow-hidden border transition-all"
          style={{ background: 'var(--surface)', borderColor: 'rgba(255,255,255,0.11)' }}
        >
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search name or number…"
            className="flex-1 bg-transparent border-none outline-none px-4 py-2.5 text-white/80 placeholder-white/20 text-sm font-medium tracking-wide"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button onClick={() => setQuery('')} className="px-3 text-white/30 hover:text-white/60 transition-colors text-lg">
              ×
            </button>
          )}
        </div>

        {/* Gen filters */}
        <div className="flex flex-wrap gap-1.5">
          {GENS.map((g, i) => (
            <button
              key={g.label}
              onClick={() => setGen(i)}
              className="px-2.5 py-1 rounded text-xs font-display tracking-wider transition-colors"
              style={
                gen === i
                  ? { background: 'var(--accent)', color: '#07080f' }
                  : { background: 'var(--surface)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {g.label === 'All' ? 'ALL' : `GEN ${g.label}`}
            </button>
          ))}
        </div>

        <span className="font-mono text-xs text-white/25 ml-auto">
          {filtered.length.toLocaleString()} Pokémon
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {filtered.map(p => (
          <Link
            key={p.id}
            href={`/pokemon/${p.name}`}
            className="group flex flex-col items-center rounded-lg p-2 transition-all hover:scale-105"
            style={{ background: 'var(--surface)' }}
          >
            <img
              src={spriteUrl(p.id)}
              alt={p.name}
              width={64}
              height={64}
              loading="lazy"
              className="w-14 h-14 object-contain"
            />
            <span className="font-mono text-[0.55rem] text-white/25 mt-0.5">
              #{String(p.id).padStart(4, '0')}
            </span>
            <span className="text-[0.68rem] font-semibold text-white/70 text-center leading-tight mt-0.5 group-hover:text-white transition-colors line-clamp-1">
              {formatName(p.name)}
            </span>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-white/25 font-mono text-sm">
          No Pokémon found{query ? ` for "${query}"` : ''} in Gen {GENS[gen].label}
        </div>
      )}
    </div>
  );
}
