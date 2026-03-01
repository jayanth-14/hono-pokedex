import { filterPokemonByType } from "./getData.js";

export const handleHomePage = (con) => con.redirect("/all");

export const servePageByType = (con) => {
  const type = con.req.param("type");

  const pokemon = filterPokemonByType(con.get("pokemon"), type);
  const types = con.get("types");

  const sidebar = con.get("renderSidebar")(types, type);
  const cardsContainer = con.get("renderCards")(pokemon);
  const page = con.get("renderPage")(
    `${type} type pokemon`,
    sidebar,
    cardsContainer,
  );

  return con.html(page);
};
