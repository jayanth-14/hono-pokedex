export const getPokemonData = async () => {
  return JSON.parse(await Deno.readTextFile("./data/pokemons.json"));
};

export const getPokemonTypes = async () => {
  const types = JSON.parse(await Deno.readTextFile("./data/types.json"));
  types.unshift("all");
  return types;
};
