export const getPokemonData = async () => {
  return JSON.parse(await Deno.readTextFile("./data/pokemon.json"));
};

export const getPokemonTypes = async () => {
  const types = JSON.parse(await Deno.readTextFile("./data/types.json"));
  types.unshift("all");
  return types;
};

export const filterPokemonByType = (pokemon, type = "all") => {
  if (type === "all") return pokemon;

  return pokemon.filter(
    (poke) => poke.types.includes(type),
  );
};
