import { ALL_TYPES, VERSION_PRIORITY } from './constants';

const BASE = 'https://pokeapi.co/api/v2';

async function get(url: string, revalidate = 3600) {
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw Object.assign(new Error('Not found'), { status: res.status });
  return res.json();
}

export interface PokemonEntry {
  name: string;
  id: number;
  types: string[];
  stats: Record<string, number>;
  bst: number;
  dexes: string[];
}

export async function getAllPokemon(): Promise<PokemonEntry[]> {
  const query = `{
    pokemon_v2_pokemon(where: {id: {_lte: 1025}}, order_by: {id: asc}) {
      id
      name
      pokemon_v2_pokemontypes { pokemon_v2_type { name } }
      pokemon_v2_pokemonstats { base_stat pokemon_v2_stat { name } }
      pokemon_v2_pokemonspecy {
        pokemon_v2_pokemondexnumbers {
          pokemon_v2_pokedex { name }
        }
      }
    }
  }`;

  const res = await fetch('https://beta.pokeapi.co/graphql/v1beta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    next: { revalidate: 86400 },
  });

  if (!res.ok) throw new Error('GraphQL fetch failed');
  const { data } = await res.json();

  return data.pokemon_v2_pokemon.map((p: any) => {
    const stats: Record<string, number> = {};
    let bst = 0;
    p.pokemon_v2_pokemonstats.forEach((s: any) => {
      stats[s.pokemon_v2_stat.name] = s.base_stat;
      bst += s.base_stat;
    });
    return {
      id: p.id,
      name: p.name,
      types: p.pokemon_v2_pokemontypes.map((t: any) => t.pokemon_v2_type.name),
      stats,
      bst,
      dexes: (p.pokemon_v2_pokemonspecy?.pokemon_v2_pokemondexnumbers ?? [])
        .map((d: any) => d.pokemon_v2_pokedex.name) as string[],
    };
  });
}

export async function getPokemon(nameOrId: string) {
  return get(`${BASE}/pokemon/${nameOrId}`);
}

export async function getPokemonSpecies(name: string) {
  try {
    return await get(`${BASE}/pokemon-species/${name}`);
  } catch {
    return null;
  }
}

export async function getEvolutionChain(url: string) {
  try {
    return await get(url);
  } catch {
    return null;
  }
}

export async function getTypeData(type: string) {
  return get(`${BASE}/type/${type}`, 86400);
}

export async function getAbilityData(name: string) {
  try {
    return await get(`${BASE}/ability/${name}`, 86400);
  } catch {
    return null;
  }
}

export async function computeTypeEffectiveness(types: string[]): Promise<Record<string, number>> {
  const mult: Record<string, number> = Object.fromEntries(ALL_TYPES.map(t => [t, 1]));
  const typeDataArr = await Promise.all(types.map(t => getTypeData(t)));
  typeDataArr.forEach(td => {
    td.damage_relations.double_damage_from.forEach((t: { name: string }) => { if (t.name in mult) mult[t.name] *= 2; });
    td.damage_relations.half_damage_from.forEach((t: { name: string }) => { if (t.name in mult) mult[t.name] *= 0.5; });
    td.damage_relations.no_damage_from.forEach((t: { name: string }) => { if (t.name in mult) mult[t.name] *= 0; });
  });
  return mult;
}

export function extractId(url: string): number {
  return parseInt(url.split('/').filter(Boolean).pop() ?? '0');
}

export function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function artworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function formatName(name: string): string {
  return name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function getFlavorText(species: any): string {
  if (!species?.flavor_text_entries) return '';
  const entries: any[] = species.flavor_text_entries;
  const eng = entries.filter((e: any) => e.language.name === 'en');
  for (const version of VERSION_PRIORITY) {
    const match = eng.find((e: any) => e.version.name === version);
    if (match) return match.flavor_text.replace(/\f/g, ' ').replace(/\u00ad/g, '');
  }
  return eng[eng.length - 1]?.flavor_text.replace(/\f/g, ' ').replace(/\u00ad/g, '') ?? '';
}

export function getLevelUpMoves(pokemon: any): { name: string; level: number }[] {
  if (!pokemon?.moves) return [];
  const result: { name: string; level: number }[] = [];

  for (const moveEntry of pokemon.moves) {
    const levelUpDetails = moveEntry.version_group_details.filter(
      (d: any) => d.move_learn_method.name === 'level-up'
    );
    if (levelUpDetails.length === 0) continue;

    let bestDetail = levelUpDetails[0];
    for (const vg of VERSION_PRIORITY) {
      const match = levelUpDetails.find((d: any) => d.version_group.name === vg);
      if (match) { bestDetail = match; break; }
    }
    result.push({ name: moveEntry.move.name, level: bestDetail.level_learned_at });
  }

  return result.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

export interface EvoStep {
  from: { name: string; id: number };
  to: { name: string; id: number };
  trigger: string;
}

export function flattenEvolutionChain(chain: any): EvoStep[][] {
  const paths: EvoStep[][] = [];

  function traverse(node: any, currentPath: EvoStep[]) {
    if (!node.evolves_to || node.evolves_to.length === 0) {
      if (currentPath.length > 0) paths.push(currentPath);
      return;
    }
    for (const next of node.evolves_to) {
      const trigger = formatEvolutionTrigger(next.evolution_details?.[0]);
      const step: EvoStep = {
        from: { name: node.species.name, id: extractId(node.species.url) },
        to:   { name: next.species.name,  id: extractId(next.species.url)  },
        trigger,
      };
      traverse(next, [...currentPath, step]);
    }
  }

  traverse(chain, []);
  if (paths.length === 0 && chain) paths.push([]);
  return paths;
}

function formatEvolutionTrigger(detail: any): string {
  if (!detail) return '';
  const { trigger } = detail;

  if (trigger.name === 'trade') {
    if (detail.held_item) return `Trade w/ ${formatName(detail.held_item.name)}`;
    if (detail.trade_species) return `Trade for ${formatName(detail.trade_species.name)}`;
    return 'Trade';
  }
  if (trigger.name === 'use-item' && detail.item) return formatName(detail.item.name);
  if (trigger.name === 'shed') return 'Level up (empty slot + Poké Ball)';

  const parts: string[] = [];
  if (detail.min_level) parts.push(`Lv. ${detail.min_level}`);
  if (detail.item) parts.push(formatName(detail.item.name));
  if (detail.held_item) parts.push(`Hold ${formatName(detail.held_item.name)}`);
  if (detail.min_happiness) parts.push('High Friendship');
  if (detail.min_beauty) parts.push('High Beauty');
  if (detail.min_affection) parts.push('High Affection');
  if (detail.known_move) parts.push(`Know ${formatName(detail.known_move.name)}`);
  if (detail.known_move_type) parts.push(`Know ${formatName(detail.known_move_type.name)} move`);
  if (detail.location) parts.push(`At ${formatName(detail.location.name)}`);
  if (detail.time_of_day) parts.push(detail.time_of_day.charAt(0).toUpperCase() + detail.time_of_day.slice(1));
  if (detail.gender !== null && detail.gender !== undefined) parts.push(detail.gender === 1 ? 'Female' : 'Male');
  if (detail.needs_overworld_rain) parts.push('Rain');
  if (detail.turn_upside_down) parts.push('Upside-down');

  return parts.join(', ') || formatName(trigger.name);
}
