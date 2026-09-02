import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { markStickersSeen } from "@/lib/album-data";

// Marca como vistas las calcomanías nuevas (tras la animación de apertura).
export async function POST(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await markStickersSeen(session.userId);
  return NextResponse.json({ ok: true });
}
