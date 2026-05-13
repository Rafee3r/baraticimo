import { z } from "zod";
import { publicProcedure, router } from "../trpc.js";

export const comunasRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.comuna.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, region: true, code: true },
    });
  }),

  search: publicProcedure
    .input(z.object({ q: z.string().min(1).max(50) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.comuna.findMany({
        where: { name: { contains: input.q, mode: "insensitive" } },
        take: 20,
        orderBy: { name: "asc" },
      });
    }),
});
