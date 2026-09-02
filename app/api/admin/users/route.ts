import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getAdminOverview } from "@/lib/album-data";

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Acceso solo para administradores." }, { status: 403 });
  }

  const overview = await getAdminOverview();
  return NextResponse.json(overview);
}
