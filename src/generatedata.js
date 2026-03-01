import * as path from "@std/path";

const extractStats = (data) => {
  const stats = {};
  stats.weight = data.weight;
  stats.baseXp = data.base_experience;
  const statsToExtract = ["attack", "hp", "defense", "speed"];
  data.stats.forEach((statObj) => {
    const name = statObj.stat.name;
    if (statsToExtract.includes(name)) {
      stats[name] = statObj.base_stat;
    }
  });
  return stats;
};

const extractImageUrl = (data) =>
  data["sprites"]["other"]["official-artwork"]["front_default"];

const extractTypes = (data) =>
  data.types.map((typeSlot) => typeSlot.type.name.trim());

const parsePokemonData = (data) => {
  return {
    id: data.id,
    name: data.name,
    url: extractImageUrl(data),
    types: extractTypes(data),
    stats: extractStats(data),
  };
};

export const fetchPokemon = async (url) => {
  const res = await fetch(url);
  const data = await res.json();
  return parsePokemonData(data);
};

const getPokemonUrls = async () => {
  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=10000000");
  const data = await res.json();
  const results = data.results;
  return results.map((result) => result.url);
};

const generatePokemonJson = async (destination) => {
  try {
    const urls = await getPokemonUrls();
    const pokemonData = await Promise.all(urls.map(fetchPokemon));
    console.log("✅ Fetching all pokemon is done.");
    const jsonFile = await Deno.open(destination, {
      write: true,
      create: true,
      truncate: true,
    });
    await jsonFile.write(new TextEncoder().encode(JSON.stringify(pokemonData)));
    console.log("✅ Writing pokemon json data is done.");
  } catch (error) {
    console.log(
      `Failed to generate Pokemon json data.\nError: ${error.message}`,
    );
  }
};

const generatePokemonTypesJson = async (destination) => {
  try {
    const res = await fetch("https://pokeapi.co/api/v2/type");
    console.log("✅ Fetching Types data is done.");

    const data = await res.json();
    const types = data.results.map(({ name }) => name);

    await Deno.writeTextFile(destination, JSON.stringify(types));
    console.log("✅ Writing Types json data is done.");
  } catch (error) {
    console.log(
      `Failed to generate Pokemon Types json data.\nError: ${error.message}`,
    );
  }
};

const fetchData = async (outputDir = "data") => {
  try {
    await Deno.mkdir(outputDir);
  } catch (error) {
    if (error instanceof Deno.errors.AlreadyExists) {
      console.log(`output directory "${outputDir}" is already present.`);
    } else {
      console.log(error);
    }
  }

  const typesJsonLocation = path.join(outputDir, "types.json");
  await generatePokemonTypesJson(typesJsonLocation);

  const pokemonJsonLocation = path.join(outputDir, "pokemon.json");
  await generatePokemonJson(pokemonJsonLocation);
};

await fetchData("data");
