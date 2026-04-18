import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getPokemon, getPokemonSpecies, getEvolutionChain, computeTypeEffectiveness,
  getAbilityData, artworkUrl, formatName, getFlavorText, getLevelUpMoves,
  flattenEvolutionChain, extractId,
} from '@/lib/pokeapi';
import { TYPE_COLORS, STAT_CONFIG } from '@/lib/constants';
import { TypeBadge } from '@/components/TypeBadge';
import { StatBar } from '@/components/StatBar';
import { AddToTeamButton } from '@/components/AddToTeamButton';

export default async function PokemonPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let pokemon: any;
  try {
    pokemon = await getPokemon(name.toLowerCase());
  } catch {
    notFound();
  }

  const types: string[] = pokemon.types.map((t: any) => t.type.name);
  const primaryColor = TYPE_COLORS[types[0]] ?? '#78C850';

  const [species, effectiveness, ...abilityDetails] = await Promise.all([
    getPokemonSpecies(pokemon.species.name),
    computeTypeEffectiveness(types),
    ...pokemon.abilities.map((a: any) => getAbilityData(a.ability.name)),
  ]);

  const evolutionChain = species?.evolution_chain?.url
    ? await getEvolutionChain(species.evolution_chain.url)
    : null;

  const evoPaths = evolutionChain ? flattenEvolutionChain(evolutionChain.chain) : [];
  const flavorText = getFlavorText(species);
  const levelUpMoves = getLevelUpMoves(pokemon);

  const artwork = pokemon.sprites?.other?.['official-artwork']?.front_default ?? artworkUrl(pokemon.id);

  const effGroups = {
    x4:    [] as string[],
    x2:    [] as string[],
    x0:    [] as string[],
    xhalf: [] as string[],
    xqtr:  [] as string[],
  };
  Object.entries(effectiveness).forEach(([t, m]) => {
    if (m >= 4)    effGroups.x4.push(t);
    else if (m >= 2)    effGroups.x2.push(t);
    else if (m === 0)   effGroups.x0.push(t);
    else if (m <= 0.26) effGroups.xqtr.push(t);
    else if (m < 1)     effGroups.xhalf.push(t);
  });

  const bst = pokemon.stats.reduce((sum: number, s: any) => sum + s.base_stat, 0);

  const genus = species?.genera?.find((g: any) => g.language.name === 'en')?.genus ?? '';
  const isLegendary = species?.is_legendary;
  const isMythical  = species?.is_mythical;
  const genderRate  = species?.gender_rate; // -1 = genderless, 0 = always male, 8 = always female

  function genderLabel(rate: number): string {
    if (rate === -1) return 'Genderless';
    if (rate === 0)  return '100% ♂';
    if (rate === 8)  return '100% ♀';
    const femalePct = (rate / 8) * 100;
    return `${100 - femalePct}% ♂ / ${femalePct}% ♀`;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-20" style={{ '--accent': primaryColor } as React.CSSProperties}>
      {/* Back */}
      <div className="mb-4">
        <Link href="/" className="font-mono text-xs text-white/30 hover:text-white/60 transition-colors tracking-wider">
          ← POKÉDEX
        </Link>
      </div>

      {/* Header card */}
      <div className="rounded-xl overflow-hidden mb-3" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ background: 'var(--surface2)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-white/25 tracking-wider">
              #{String(pokemon.id).padStart(4, '0')}
            </span>
            {(isLegendary || isMythical) && (
              <span className="font-mono text-[0.6rem] tracking-widest uppercase px-2 py-0.5 rounded border border-yellow-500/30 text-yellow-400/70">
                {isMythical ? 'Mythical' : 'Legendary'}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {types.map((t: string) => <TypeBadge key={t} type={t} />)}
          </div>
        </div>

        {/* Body: sprite + stats */}
        <div className="grid md:grid-cols-[220px_1fr]">
          {/* Sprite col */}
          <div className="flex flex-col items-center justify-center px-6 py-8 relative overflow-hidden" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <div
              className="absolute w-48 h-48 rounded-full pointer-events-none"
              style={{ background: `${primaryColor}22`, filter: 'blur(40px)' }}
            />
            <img
              src={artwork}
              alt={pokemon.name}
              width={180}
              height={180}
              className="relative w-44 h-44 object-contain"
              style={{ filter: `drop-shadow(0 8px 24px ${primaryColor}55)` }}
            />
            <h1 className="font-display text-2xl tracking-[0.12em] mt-3 text-center">
              {formatName(pokemon.name)}
            </h1>
            {genus && (
              <p className="font-mono text-[0.62rem] text-white/30 tracking-wider mt-1">{genus}</p>
            )}
          </div>

          {/* Stats col */}
          <div className="px-6 py-5">
            <p className="font-mono text-[0.58rem] tracking-[0.3em] text-white/25 uppercase mb-4">Base Statistics</p>
            <div className="flex flex-col gap-3">
              {pokemon.stats.map((s: any) => (
                <StatBar key={s.stat.name} statName={s.stat.name} value={s.base_stat} />
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center" style={{ gridTemplateColumns: '56px 36px 1fr' }}>
              <span className="font-mono text-[0.62rem] text-white/25 w-14 text-right mr-3">BST</span>
              <span className="font-mono text-sm font-bold" style={{ color: primaryColor }}>{bst}</span>
            </div>

            {/* Quick info */}
            <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-3 gap-3">
              {[
                { label: 'HEIGHT', value: `${(pokemon.height / 10).toFixed(1)} m` },
                { label: 'WEIGHT', value: `${(pokemon.weight / 10).toFixed(1)} kg` },
                { label: 'GENDER', value: genderLabel(genderRate) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="font-mono text-[0.55rem] text-white/25 tracking-widest">{label}</p>
                  <p className="font-semibold text-sm text-white/70 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-3">
        {/* Pokédex Entry */}
        {flavorText && (
          <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="font-mono text-[0.58rem] tracking-[0.3em] text-white/25 uppercase mb-3">Pokédex Entry</p>
            <p className="text-white/70 text-sm leading-relaxed">{flavorText}</p>
          </div>
        )}

        {/* Abilities */}
        <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="font-mono text-[0.58rem] tracking-[0.3em] text-white/25 uppercase mb-3">Abilities</p>
          <div className="flex flex-col gap-3">
            {pokemon.abilities.map((a: any, i: number) => {
              const detail = abilityDetails[i];
              const desc = detail?.effect_entries?.find((e: any) => e.language.name === 'en')?.short_effect ?? '';
              return (
                <div key={a.ability.name}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-white/80">{formatName(a.ability.name)}</span>
                    {a.is_hidden && (
                      <span className="font-mono text-[0.55rem] tracking-wider text-white/30 border border-white/15 rounded px-1.5 py-0.5">
                        HIDDEN
                      </span>
                    )}
                  </div>
                  {desc && <p className="text-xs text-white/45 leading-relaxed">{desc}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Evolution Chain */}
      {evoPaths.length > 0 && evoPaths[0].length > 0 && (
        <div className="rounded-xl p-5 mb-3" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="font-mono text-[0.58rem] tracking-[0.3em] text-white/25 uppercase mb-4">Evolution Chain</p>
          <div className="flex flex-col gap-4">
            {evoPaths.map((path, pi) => (
              <div key={pi} className="flex items-center gap-2 flex-wrap">
                {/* First Pokemon in chain */}
                <EvoSprite name={path[0].from.name} id={path[0].from.id} currentName={pokemon.name} />
                {path.map((step, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <div className="flex flex-col items-center min-w-[60px]">
                      <span className="text-white/20 text-lg">→</span>
                      {step.trigger && (
                        <span className="font-mono text-[0.55rem] text-center text-white/30 leading-tight max-w-[80px]">
                          {step.trigger}
                        </span>
                      )}
                    </div>
                    <EvoSprite name={step.to.name} id={step.to.id} currentName={pokemon.name} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Type Effectiveness */}
      <div className="rounded-xl overflow-hidden mb-3" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-5 py-3" style={{ background: 'var(--surface2)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="font-mono text-[0.58rem] tracking-[0.3em] text-white/25 uppercase">Type Effectiveness</p>
        </div>
        <div className="p-5 flex flex-col gap-3">
          {[
            { label: '×4',  cls: 'text-red-400',     list: effGroups.x4 },
            { label: '×2',  cls: 'text-orange-400',  list: effGroups.x2 },
            { label: '×0',  cls: 'text-blue-400',    list: effGroups.x0 },
            { label: '½×',  cls: 'text-green-400',   list: effGroups.xhalf },
            { label: '¼×',  cls: 'text-cyan-400',    list: effGroups.xqtr },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-4">
              <span className={`font-display text-lg w-9 text-right shrink-0 ${row.cls}`}>{row.label}</span>
              <div className="flex flex-wrap gap-1.5">
                {row.list.length > 0
                  ? row.list.map(t => <TypeBadge key={t} type={t} size="sm" />)
                  : <span className="font-mono text-[0.65rem] text-white/20">—</span>
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Level-up Moves */}
      {levelUpMoves.length > 0 && (
        <div className="rounded-xl overflow-hidden mb-3" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-5 py-3" style={{ background: 'var(--surface2)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-mono text-[0.58rem] tracking-[0.3em] text-white/25 uppercase">Level-up Moves</p>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
            {levelUpMoves.map(m => (
              <div key={m.name} className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ background: 'var(--surface2)' }}>
                <span className="font-mono text-[0.58rem] text-white/30 w-8 shrink-0">
                  {m.level === 0 ? '—' : `${m.level}`}
                </span>
                <span className="text-xs text-white/70 truncate">{formatName(m.name)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add to Team */}
      <div className="flex justify-end mt-4">
        <AddToTeamButton member={{ name: pokemon.name, id: pokemon.id, types }} />
      </div>
    </div>
  );
}

function EvoSprite({ name, id, currentName }: { name: string; id: number; currentName: string }) {
  const isCurrent = name === currentName;
  const sprUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  return (
    <Link
      href={`/pokemon/${name}`}
      className={`flex flex-col items-center group transition-opacity ${isCurrent ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
    >
      <div
        className={`w-14 h-14 rounded-lg flex items-center justify-center ${isCurrent ? 'ring-2 ring-white/20' : ''}`}
        style={{ background: 'var(--surface2)' }}
      >
        <img src={sprUrl} alt={name} width={56} height={56} className="w-12 h-12 object-contain" />
      </div>
      <span className="font-mono text-[0.6rem] text-white/40 mt-1 group-hover:text-white/70 transition-colors">
        {formatName(name)}
      </span>
    </Link>
  );
}
