export const serveHomePage = (con) => {
  const pokemons = con.get("pokemons").slice(0, 10);
  const types = con.get("types");

  const cardsContainer = con.get("renderCards")(pokemons);
  const sidebar = con.get("renderSidebar")(types);

  const page = con.get("renderPage")("pokedex", sidebar, cardsContainer);

  return con.html(page);
};
