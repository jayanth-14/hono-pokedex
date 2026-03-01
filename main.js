import { Eta } from "eta";
import { createApp } from "./src/app.js";

const main = async (port = 3000) => {
  const eta = new Eta({ views: "./views" });

  const app = await createApp({ eta });

  Deno.serve({ port }, app.fetch);
};

await main();
