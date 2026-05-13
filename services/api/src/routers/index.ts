import { router } from "../trpc.js";
import { productsRouter } from "./products.js";
import { comunasRouter } from "./comunas.js";

export const appRouter = router({
  products: productsRouter,
  comunas: comunasRouter,
});

export type AppRouter = typeof appRouter;
