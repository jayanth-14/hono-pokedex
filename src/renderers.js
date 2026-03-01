const renderSidebarFn = (eta, types, activeType = "all") =>
  eta.render("sidebar.html", { types, activeType });

const renderCardsFn = (eta, pokemon) => {
  return eta.render("cardsContainer.html", { pokemon });
};
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
