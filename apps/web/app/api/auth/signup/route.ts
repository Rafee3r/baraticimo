/**
 * POST /api/auth/signup
 * Body: { email, password, name? }
 *
 * Crea un usuario nuevo con password hasheada. Después del signup, el cliente
 * debe llamar a signIn("credentials", { email, password }) para iniciar sesión.
 */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/db";

export async function POST(req: Request) {
  try {
    const { email: rawEmail, password, name } = await req.json();
    const email = typeof rawEmail === "string" ? rawEmail.toLowerCase().trim() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya hay una cuenta con este email" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        name: typeof name === "string" && name.trim() ? name.trim() : null,
        passwordHash,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json({ error: "Error al crear la cuenta" }, { status: 500 });
  }
}
