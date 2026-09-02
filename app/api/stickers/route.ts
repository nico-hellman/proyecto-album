import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getAlbumForUser } from "@/lib/album-data";

// El álbum del usuario: todas las calcomanías + cuáles posee, cantidad y stats.
export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const album = await getAlbumForUser(session.userId);
  return NextResponse.json(album);
}
