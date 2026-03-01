import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/deno";
import { Eta } from "eta";

const main = (port = 3000) => {
  const app = new Hono();
  const eta = new Eta({ views: "./views" });

  app.use(logger());

  const pokemons = [{
    "id": 1,
    "name": "bulbasaur",
    "url":
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
    "types": ["grass", "poison"],
    "stats": {
      "weight": 69,
      "baseXp": 64,
      "hp": 45,
      "attack": 49,
      "defense": 49,
      "speed": 45,
    },
  }, {
    "id": 2,
    "name": "ivysaur",
    "url":
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/2.png",
    "types": ["grass", "poison"],
    "stats": {
      "weight": 130,
      "baseXp": 142,
      "hp": 60,
      "attack": 62,
      "defense": 63,
      "speed": 60,
    },
  }, {
    "id": 3,
    "name": "venusaur",
    "url":
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png",
    "types": ["grass", "poison"],
    "stats": {
      "weight": 1000,
      "baseXp": 236,
      "hp": 80,
      "attack": 82,
      "defense": 83,
      "speed": 80,
    },
  }];

  const types = [
    "normal",
    "fighting",
    "flying",
    "poison",
    "ground",
    "rock",
    "bug",
    "ghost",
    "steel",
    "fire",
    "water",
    "grass",
    "electric",
    "psychic",
    "ice",
    "dragon",
    "dark",
    "fairy",
    "stellar",
    "unknown",
  ];

  app.get("/", (c) => {
    const cardsContainer = eta.render("page.html", { pokemons });

    const sidebar = eta.render("sidebar.html", { types });
    return c.html(
      eta.render("layout.html", {
        title: "pokedex",
        sidebar,
        main: cardsContainer,
      }),
    );
  });

  app.get("*", serveStatic({ root: "public" }));
  Deno.serve({ port }, app.fetch);
};

main();
