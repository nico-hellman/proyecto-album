import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getAlbumForUser } from "@/lib/album-data";

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { stats } = await getAlbumForUser(session.userId);
  return NextResponse.json({
    user: { id: session.userId, email: session.email, name: session.name, role: session.role },
    stats,
  });
}
