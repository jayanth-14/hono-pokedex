import { Hono } from "hono";

const main = (port = 3000) => {
  const app = new Hono();

  Deno.serve({ port }, app.fetch);
};

main();
