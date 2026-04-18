'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { spriteUrl, formatName } from '@/lib/pokeapi';

interface PokemonEntry {
  name: string;
  id: number;
}

export function PokemonGrid({ pokemon }: { pokemon: PokemonEntry[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pokemon;
    return pokemon.filter(p =>
      p.name.includes(q) || String(p.id).padStart(4, '0').includes(q) || String(p.id) === q
    );
  }, [pokemon, query]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {/* Search */}
      <div className="mb-6 flex">
        <div
          className="flex w-full max-w-md rounded overflow-hidden border transition-all"
          style={{ background: 'var(--surface)', borderColor: 'rgba(255,255,255,0.11)' }}
        >
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or number…"
            className="flex-1 bg-transparent border-none outline-none px-4 py-2.5 text-white/80 placeholder-white/20 text-sm font-medium tracking-wide"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="px-3 text-white/30 hover:text-white/60 transition-colors text-lg"
            >
              ×
            </button>
          )}
        </div>
        <span className="ml-3 self-center font-mono text-xs text-white/25">
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
          No Pokémon found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
