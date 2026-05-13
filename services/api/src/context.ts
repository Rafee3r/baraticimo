import { prisma } from "./db.js";

export interface Context {
  prisma: typeof prisma;
  comunaId: string | null;
}

export function createContext(opts: { req: Request }): Context {
  const comunaId = opts.req.headers.get("x-comuna-id");
  return { prisma, comunaId };
}
