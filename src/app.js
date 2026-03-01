import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/deno";
import { createRenderFns } from "./renderers.js";
import { getPokemonData, getPokemonTypes } from "./getData.js";
import { serveHomePage } from "./handlers.js";

const setContext = async (eta) => {
  const fns = createRenderFns(eta);
  const pokemons = await getPokemonData();
  const types = await getPokemonTypes();

  return async (c, next) => {
    // render functions
    c.set("renderSidebar", fns.renderSidebar);
    c.set("renderCards", fns.renderCards);
    c.set("renderPage", fns.renderPage);

    // pokemon data
    c.set("types", types);
    c.set("pokemons", pokemons);

    await next();
  };
};

export const createApp = async ({ eta }) => {
  const app = new Hono();

  // middlewares
  app.use(logger());
  app.use(await setContext(eta));

  app.get("/", serveHomePage);

  // serving static files
  app.get("*", serveStatic({ root: "public" }));

  return app;
};
