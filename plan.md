# Plan: Convert Static Site to Hono/Eta Dynamic Server

This plan outlines the steps to transform the existing Deno static website generator into a dynamic web server using Hono and Eta for server-side rendering, leveraging existing data fetching and rendering logic.

## Quantized Actionable Steps:

1.  **Initialize Hono Project & Dependencies:**
    - Create a new file `src/app.ts` (or `app.js` if sticking to JS).
    - Modify `deno.json`:
      - Add `hono` and `eta` to `dependencies` (e.g., `"hono": "jsr:hono@^4.0.0"`, `"eta": "npm:eta@^3.0.0"`).
      - Add `dev` and `start` tasks to run the Hono application (e.g., `"dev": "deno run -A --watch src/app.ts"`).
    - Remove the "generate" task from `deno.json` as it will be replaced by the server.

2.  **Prepare Data Fetching Module:**
    - Create a new file `src/data.js` (or `src/data.ts`).
    - Move the `getPokemonData` and `getPokemonTypes` functions from `src/generateHtml.js` into `src/data.js` and export them. These functions will be responsible for reading `pokemon.json` and `types.json`.

3.  **Define Project Structure (Views & Public Assets):**
    - Create a `views` directory in the project root to store all Eta templates (`.eta` files).
    - Create a `public` directory in the project root for static assets.
    - Move `style.css` and `colors.css` into `public/css/`.
    - Update `src/render.js` (or eventually the Eta templates) to link to `/public/css/style.css` and `/public/css/colors.css`.

4.  **Configure Hono with Eta Templating:**
    - In `src/app.ts`:
      - Import `Hono` and `renderToString` from `eta`.
      - Initialize Hono: `const app = new Hono();`.
      - Configure Eta as the templating engine. This involves setting up a custom renderer for Hono that uses Eta's `renderToString` and specifies the `views` directory.
      - Import `serveStatic` middleware for serving static files.

5.  **Migrate `generatePage` to `views/layout.eta`:**
    - Create `views/layout.eta`.
    - Copy the outer HTML structure (head, body, links to CSS) from `src/render.js`'s `generatePage` function into `views/layout.eta`.
    - Replace dynamic parts with Eta syntax:
      - `Pokedex - <%= it.title %> pokemons` for the title.
      - `<%~ it.sidebar %>` for the sidebar content.
      - `<%~ it.htmlCards %>` for the main cards container.
    - Remove the `generatePage` export from `src/render.js`.

6.  **Migrate `generateSidebar` to `views/sidebar.eta`:**
    - Create `views/sidebar.eta`.
    - Copy the `generateSidebar` and `generateNavLink` logic from `src/render.js` into this Eta template.
    - The template will receive `it.currentType` and `it.allTypes` (or similar) as data.
    - Adapt the `generateNavLink` logic to use Eta loops and conditionals. The `href` attributes should now point to server routes (e.g., `/all`, `/water`).
    - Remove the `generateSidebar` export from `src/render.js`.

7.  **Migrate Card Rendering to `views/pokemon_cards.eta` and `views/pokemon_card.eta`:**
    - Create `views/pokemon_card.eta`. Copy `generateCard`, `generateTypes`, and `generateStats` logic from `src/render.js` into this template. This template will receive `it.pokemon` as data.
    - Create `views/pokemon_cards.eta`. This template will receive `it.pokemonData` (an array) and iterate over it, calling `include('pokemon_card', { pokemon: item })` for each.
    - Remove `generateCards`, `generateCard`, `generateTypes`, `generateStats` exports from `src/render.js`. `src/render.js` should now be empty or removed.

8.  **Implement Hono Routes for Pokemon Types:**
    - In `src/app.ts`:
      - Define a root route `app.get('/')` which redirects to `/all` or renders the 'all' type page directly.
      - Define a dynamic route `app.get('/:type')` to handle requests for specific types (e.g., `/water`, `/fire`).
      - Inside the route handler:
        - Import and call `getPokemonData()` and `getPokemonTypes()` from `src/data.js`.
        - Implement the `filterPokemonData` logic (currently in `src/generateHtml.js`) to filter `pokemonData` based on the requested `type` parameter.
        - Render `views/layout.eta`, passing the necessary data:
          - `title`: The requested `type`.
          - `sidebar`: Rendered content of `views/sidebar.eta` (pass current type and all types).
          - `htmlCards`: Rendered content of `views/pokemon_cards.eta` (pass filtered pokemon data).

9.  **Serve Static Assets with Hono:**
    - In `src/app.ts`, add middleware to serve static files:
      - `app.use('/public/*', serveStatic({ root: './', pathPrefix: '/public' }));` This will serve `public/css/style.css` at `/public/css/style.css`.

10. **Clean Up and Test:**
    - Delete the `src/generateHtml.js` file.
    - Delete all pre-generated `.html` files (e.g., `all.html`, `water.html`).
    - Update `README.md` to reflect the new Hono/Eta server.
    - Start the Hono server using the new `deno run -A --watch src/app.ts` task.
    - Thoroughly test all type routes (e.g., `/all`, `/water`, `/fire`) to ensure correct data display, styling, and navigation.
