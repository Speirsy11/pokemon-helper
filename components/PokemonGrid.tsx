'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { spriteUrl, formatName, PokemonEntry } from '@/lib/pokeapi';
import { ALL_TYPES, TYPE_COLORS } from '@/lib/constants';

const STORAGE_KEY = 'pokedex-filters';

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

// baseDexes = regional dex available in the main game.
// dlcDexes  = added by DLC/expansion packs.
const GAMES = [
  { id: 'rb',   label: 'Red / Blue',      baseDexes: ['kanto'],                                          dlcDexes: [] },
  { id: 'gs',   label: 'Gold / Silver',   baseDexes: ['original-johto'],                                 dlcDexes: [] },
  { id: 'rs',   label: 'Ruby / Sapphire', baseDexes: ['hoenn'],                                          dlcDexes: [] },
  { id: 'frlg', label: 'FR / LG',         baseDexes: ['kanto'],                                          dlcDexes: [] },
  { id: 'dp',   label: 'Diamond / Pearl', baseDexes: ['original-sinnoh'],                                dlcDexes: [] },
  { id: 'hgss', label: 'HG / SS',         baseDexes: ['updated-johto'],                                  dlcDexes: [] },
  { id: 'bw',   label: 'Black / White',   baseDexes: ['original-unova'],                                 dlcDexes: [] },
  { id: 'b2w2', label: 'B2 / W2',         baseDexes: ['updated-unova'],                                  dlcDexes: [] },
  { id: 'xy',   label: 'X / Y',           baseDexes: ['kalos-central', 'kalos-coastal', 'kalos-mountain'], dlcDexes: [] },
  { id: 'oras', label: 'OR / AS',         baseDexes: ['updated-hoenn'],                                  dlcDexes: [] },
  { id: 'sm',   label: 'Sun / Moon',      baseDexes: ['original-alola'],                                 dlcDexes: [] },
  { id: 'usum', label: 'US / UM',         baseDexes: ['updated-alola'],                                  dlcDexes: [] },
  { id: 'swsh', label: 'Sw / Sh',         baseDexes: ['galar'],                                          dlcDexes: ['isle-of-armor', 'crown-tundra'] },
  { id: 'la',   label: 'Legends: A',      baseDexes: ['hisui'],                                          dlcDexes: [] },
  { id: 'sv',   label: 'Sc / Vi',         baseDexes: ['paldea'],                                         dlcDexes: ['kitakami', 'blueberry'] },
];

// Games that actually have DLC dexes (used to decide whether to show the toggle)
const GAMES_WITH_DLC = new Set(GAMES.filter(g => g.dlcDexes.length > 0).map(g => g.id));

const SORT_OPTIONS = [
  { key: 'id',               label: '#'    },
  { key: 'name',             label: 'Name' },
  { key: 'bst',              label: 'BST'  },
  { key: 'hp',               label: 'HP'   },
  { key: 'attack',           label: 'ATK'  },
  { key: 'defense',          label: 'DEF'  },
  { key: 'special-attack',   label: 'SpA'  },
  { key: 'special-defense',  label: 'SpD'  },
  { key: 'speed',            label: 'SPD'  },
];

const DEFAULT_SORT = 'id';
const DEFAULT_DIR  = 'asc';

export function PokemonGrid({ pokemon }: { pokemon: PokemonEntry[] }) {
  const [query,         setQuery]         = useState('');
  const [selectedGens,  setSelectedGens]  = useState<Set<number>>(new Set());
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set());
  const [includeDlc,    setIncludeDlc]    = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [sortKey,       setSortKey]       = useState(DEFAULT_SORT);
  const [sortDir,       setSortDir]       = useState<'asc' | 'desc'>(DEFAULT_DIR);
  const [hydrated,      setHydrated]      = useState(false);

  // Load from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.query)               setQuery(s.query);
        if (s.gens?.length)        setSelectedGens(new Set(s.gens));
        if (s.games?.length)       setSelectedGames(new Set(s.games));
        if (s.includeDlc != null)  setIncludeDlc(s.includeDlc);
        if (s.types?.length)       setSelectedTypes(new Set(s.types));
        if (s.sortKey)             setSortKey(s.sortKey);
        if (s.sortDir)             setSortDir(s.sortDir);
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Persist on every change (skip before hydration to avoid overwriting with defaults)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        query, gens: [...selectedGens], games: [...selectedGames], includeDlc,
        types: [...selectedTypes], sortKey, sortDir,
      }));
    } catch {}
  }, [hydrated, query, selectedGens, selectedGames, includeDlc, selectedTypes, sortKey, sortDir]);

  const toggleGen = (i: number) =>
    setSelectedGens(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const toggleGame = (id: string) =>
    setSelectedGames(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleType = (t: string) =>
    setSelectedTypes(prev => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const isDirty =
    !!query || selectedGens.size > 0 || selectedGames.size > 0 || selectedTypes.size > 0 ||
    sortKey !== DEFAULT_SORT || sortDir !== DEFAULT_DIR;

  const reset = () => {
    setQuery(''); setSelectedGens(new Set()); setSelectedGames(new Set()); setSelectedTypes(new Set());
    setSortKey(DEFAULT_SORT); setSortDir(DEFAULT_DIR);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const result = pokemon.filter(p => {
      if (selectedGens.size > 0 && ![...selectedGens].some(gi => p.id >= GENS[gi].min && p.id <= GENS[gi].max)) return false;
      if (selectedGames.size > 0) {
        const requiredDexes = new Set([...selectedGames].flatMap(id => {
          const g = GAMES.find(x => x.id === id);
          if (!g) return [];
          return includeDlc ? [...g.baseDexes, ...g.dlcDexes] : g.baseDexes;
        }));
        if (!p.dexes.some(d => requiredDexes.has(d))) return false;
      }
      if (selectedTypes.size > 0 && !p.types.some(t => selectedTypes.has(t))) return false;
      if (q && !p.name.includes(q) && String(p.id) !== q) return false;
      return true;
    });

    return result.sort((a, b) => {
      let va: number | string, vb: number | string;
      if      (sortKey === 'id')   { va = a.id;             vb = b.id; }
      else if (sortKey === 'name') { va = a.name;           vb = b.name; }
      else if (sortKey === 'bst')  { va = a.bst;            vb = b.bst; }
      else                         { va = a.stats[sortKey] ?? 0; vb = b.stats[sortKey] ?? 0; }

      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  }, [pokemon, query, selectedGens, selectedGames, includeDlc, selectedTypes, sortKey, sortDir]);

  const showStatBadge = sortKey !== 'id' && sortKey !== 'name';

  return (
    <div className="w-full max-w-5xl mx-auto px-4">

      {/* ── Filter panel ── */}
      <div className="rounded-xl overflow-hidden mb-6" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Row 1: search + count + reset */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-3 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex flex-1 min-w-[180px] max-w-[280px] rounded overflow-hidden" style={{ background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Name or number…"
              className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-white/80 placeholder-white/20 text-sm"
              autoComplete="off" spellCheck={false}
            />
            {query && <button onClick={() => setQuery('')} className="px-2.5 text-white/25 hover:text-white/60 transition-colors text-base">×</button>}
          </div>

          <span className="font-mono text-xs text-white/25">
            {filtered.length.toLocaleString()}<span className="text-white/15"> / {pokemon.length.toLocaleString()}</span>
          </span>

          {isDirty && (
            <button onClick={reset} className="ml-auto font-mono text-[0.62rem] tracking-wider text-white/30 hover:text-white/60 border border-white/10 rounded px-2.5 py-1 transition-colors">
              RESET
            </button>
          )}
        </div>

        {/* Row 2: generation */}
        <div className="flex items-center gap-x-2 gap-y-1.5 px-4 py-2.5 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="font-mono text-[0.57rem] tracking-[0.25em] text-white/20 uppercase w-9 shrink-0">GEN</span>
          {GENS.slice(1).map((g, i) => {
            const idx = i + 1;
            const on = selectedGens.has(idx);
            return (
              <button key={g.label} onClick={() => toggleGen(idx)}
                className="px-2 py-0.5 rounded font-display text-xs tracking-wider transition-colors"
                style={on
                  ? { background: 'var(--accent)', color: '#07080f' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}
              >
                {g.label}
              </button>
            );
          })}
        </div>

        {/* Row 3: game */}
        <div className="flex items-start gap-x-2 gap-y-1.5 px-4 py-2.5 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="font-mono text-[0.57rem] tracking-[0.25em] text-white/20 uppercase w-9 shrink-0 pt-0.5">GAME</span>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {GAMES.map(g => {
              const on = selectedGames.has(g.id);
              return (
                <button key={g.id} onClick={() => toggleGame(g.id)}
                  className="px-2 py-0.5 rounded font-mono text-[0.65rem] tracking-wide transition-colors"
                  style={on
                    ? { background: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.95)' }
                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
          {/* DLC toggle — only visible when a DLC-capable game is selected */}
          {[...selectedGames].some(id => GAMES_WITH_DLC.has(id)) && (
            <button
              onClick={() => setIncludeDlc(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[0.62rem] tracking-wide transition-colors shrink-0 self-start"
              style={includeDlc
                ? { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)',  border: '1px solid rgba(255,255,255,0.15)' }
                : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)',  border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <span style={{ color: includeDlc ? 'var(--accent)' : 'rgba(255,255,255,0.2)' }}>⬡</span>
              DLC
            </button>
          )}
        </div>

        {/* Row 4: type */}
        <div className="flex items-start gap-x-2 gap-y-1.5 px-4 py-2.5 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="font-mono text-[0.57rem] tracking-[0.25em] text-white/20 uppercase w-9 shrink-0 pt-0.5">TYPE</span>
          <div className="flex flex-wrap gap-1.5">
            {ALL_TYPES.map(t => {
              const on = selectedTypes.has(t);
              return (
                <button key={t} onClick={() => toggleType(t)}
                  className="px-2 py-0.5 rounded font-display text-[0.75rem] tracking-wider transition-all"
                  style={on
                    ? { background: TYPE_COLORS[t], color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }
                    : { background: `${TYPE_COLORS[t]}28`, color: `${TYPE_COLORS[t]}bb` }}
                >
                  {t.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 4: sort */}
        <div className="flex items-center gap-x-2 gap-y-1.5 px-4 py-2.5 flex-wrap">
          <span className="font-mono text-[0.57rem] tracking-[0.25em] text-white/20 uppercase w-9 shrink-0">SORT</span>
          <div className="flex flex-wrap gap-1.5">
            {SORT_OPTIONS.map(opt => {
              const active = sortKey === opt.key;
              return (
                <button key={opt.key} onClick={() => handleSort(opt.key)}
                  className="px-2.5 py-0.5 rounded font-mono text-xs tracking-wider transition-colors flex items-center gap-1"
                  style={active
                    ? { background: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.9)' }
                    : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}
                >
                  {opt.label}
                  {active && <span className="text-[0.65rem] opacity-70">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {filtered.map(p => (
          <Link key={p.id} href={`/pokemon/${p.name}`}
            className="group flex flex-col items-center rounded-lg p-2 pb-2.5 transition-all hover:scale-105"
            style={{ background: 'var(--surface)' }}
          >
            <img src={spriteUrl(p.id)} alt={p.name} width={64} height={64} loading="lazy" className="w-14 h-14 object-contain" />
            <span className="font-mono text-[0.52rem] text-white/20 mt-0.5">#{String(p.id).padStart(4, '0')}</span>
            <span className="text-[0.67rem] font-semibold text-white/65 text-center leading-tight mt-0.5 group-hover:text-white transition-colors line-clamp-1 w-full text-center">
              {formatName(p.name)}
            </span>
            <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
              {p.types.map(t => (
                <span key={t} className="text-[0.5rem] px-1 rounded font-display tracking-wider text-white" style={{ background: TYPE_COLORS[t] ?? '#888', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}>
                  {t.toUpperCase()}
                </span>
              ))}
            </div>
            {showStatBadge && (
              <span className="font-mono text-[0.55rem] mt-1" style={{ color: 'var(--accent)' }}>
                {sortKey === 'bst' ? p.bst : (p.stats[sortKey] ?? '—')}
              </span>
            )}
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 font-mono text-sm text-white/20">
          No Pokémon match these filters
        </div>
      )}
    </div>
  );
}
