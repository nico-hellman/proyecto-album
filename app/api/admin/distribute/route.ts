import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { distributeToUser, distributeToAllUsers } from "@/lib/album-data";

// Botón "Dar calcomanías": 5 al azar a todos (sin userId) o a un usuario puntual.
export async function POST(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Acceso solo para administradores." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const userId = body?.userId ? String(body.userId) : null;

  if (userId) {
    const cards = await distributeToUser(userId);
    return NextResponse.json({ scope: "user", userId, given: cards.length, cards });
  }

  const summary = await distributeToAllUsers();
  return NextResponse.json({ scope: "all", ...summary });
}
