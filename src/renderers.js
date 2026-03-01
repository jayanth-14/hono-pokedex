const renderSidebarFn = (eta, types) => eta.render("sidebar.html", { types });

const renderCardsFn = (eta, pokemons) =>
  eta.render("cardsContainer.html", { pokemons });

const renderPageFn = (eta, title, sidebarHtml, cardsHtml) =>
  eta.render("layout.html", {
    title,
    sidebar: sidebarHtml,
    main: cardsHtml,
  });

export const createRenderFns = (eta) => {
  const renderSidebar = renderSidebarFn.bind(null, eta);
  const renderCards = renderCardsFn.bind(null, eta);
  const renderPage = renderPageFn.bind(null, eta);

  return {
    renderCards,
    renderSidebar,
    renderPage,
  };
};
