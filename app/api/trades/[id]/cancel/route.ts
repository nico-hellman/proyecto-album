import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: offerId } = await params;

  try {
    const offer = await prisma.tradeOffer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      return NextResponse.json({ error: "La oferta no existe." }, { status: 404 });
    }

    if (offer.senderId !== session.userId) {
      return NextResponse.json({ error: "No estás autorizado para cancelar esta oferta." }, { status: 403 });
    }

    if (offer.status !== "PENDING") {
      return NextResponse.json({ error: "Esta oferta ya no está activa." }, { status: 400 });
    }

    // Update the offer status to CANCELLED
    const cancelledOffer = await prisma.tradeOffer.update({
      where: { id: offerId },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ ok: true, offer: cancelledOffer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al cancelar la oferta." }, { status: 500 });
  }
}
