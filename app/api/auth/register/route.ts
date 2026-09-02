import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signToken, TOKEN_COOKIE, COOKIE_MAX_AGE } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const name = String(body?.name ?? "").trim();
  const password = String(body?.password ?? "");

  if (!email || !email.includes("@") || !name || password.length < 6) {
    return NextResponse.json(
      { error: "Datos inválidos. La contraseña debe tener al menos 6 caracteres." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Ese correo ya está registrado." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, name, passwordHash, role: "USER" },
  });

  const token = signToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
  const res = NextResponse.json(
    { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } },
    { status: 201 }
  );
  res.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
