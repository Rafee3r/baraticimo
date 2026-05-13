import { serve } from "@hono/node-server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { appRouter } from "./routers/index.js";
import { createContext } from "./context.js";

const app = new Hono();

app.use("*", cors({ origin: "*" }));

app.get("/health", (c) => c.json({ ok: true }));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: ({ req }) => createContext({ req }),
  }),
);

const port = Number(process.env.PORT ?? 4000);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});

export type { AppRouter } from "./routers/index.js";
