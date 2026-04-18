import { getAllPokemon } from '@/lib/pokeapi';
import { PokemonGrid } from '@/components/PokemonGrid';

export default async function HomePage() {
  const pokemon = await getAllPokemon();

  return (
    <div className="pb-16">
      <div className="w-full max-w-5xl mx-auto px-4 mb-8">
        <p className="font-mono text-[0.6rem] tracking-[0.35em] text-white/20 uppercase">
          {pokemon.length.toLocaleString()} Pokémon — Generation I through IX
        </p>
      </div>
      <PokemonGrid pokemon={pokemon} />
    </div>
  );
}
