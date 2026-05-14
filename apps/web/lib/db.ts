import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// En dev, reusar la misma instancia entre HMR reloads para no abrir
// múltiples conexiones a Neon.
export const prisma =
  global.__prisma ?? new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") global.__prisma = prisma;
