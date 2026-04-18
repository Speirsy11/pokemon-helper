import { getAllPokemon } from '@/lib/pokeapi';
import { PokemonGrid } from '@/components/PokemonGrid';

export default async function HomePage() {
  const pokemon = await getAllPokemon();
  return (
    <div className="pb-16">
      <PokemonGrid pokemon={pokemon} />
    </div>
  );
}
