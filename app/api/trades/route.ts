import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const offers = await prisma.tradeOffer.findMany({
    where: { status: "PENDING" },
    include: {
      sender: { select: { name: true, email: true } },
      receiver: { select: { name: true, email: true } },
      offeredSticker: true,
      requestedSticker: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter public offers or offers directly proposed to current user vs my own offers
  const publicOffers = offers.filter(
    (o) =>
      o.senderId !== session.userId &&
      (o.receiverId === null || o.receiverId === session.userId)
  );
  const myOffers = offers.filter((o) => o.senderId === session.userId);

  return NextResponse.json({ publicOffers, myOffers });
}

export async function POST(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const offeredStickerId = body?.offeredStickerId;
  const requestedStickerId = body?.requestedStickerId;
  const receiverId = body?.receiverId || null;

  if (!offeredStickerId || !requestedStickerId) {
    return NextResponse.json({ error: "Sticker ofrecido y solicitado requeridos." }, { status: 400 });
  }

  if (offeredStickerId === requestedStickerId) {
    return NextResponse.json({ error: "No puedes intercambiar el mismo sticker." }, { status: 400 });
  }

  if (receiverId) {
    if (receiverId === session.userId) {
      return NextResponse.json({ error: "No puedes proponer un trueque a ti mismo." }, { status: 400 });
    }
    const receiverExists = await prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiverExists) {
      return NextResponse.json({ error: "El usuario destinatario no existe." }, { status: 400 });
    }
  }

  // Verify ownership of the offered sticker
  const userSticker = await prisma.userSticker.findUnique({
    where: { userId_stickerId: { userId: session.userId, stickerId: offeredStickerId } },
  });

  if (!userSticker || userSticker.quantity < 1) {
    return NextResponse.json({ error: "No posees el sticker ofrecido." }, { status: 400 });
  }

  // Create the trade offer
  const newOffer = await prisma.tradeOffer.create({
    data: {
      senderId: session.userId,
      receiverId,
      offeredStickerId,
      requestedStickerId,
    },
    include: {
      offeredSticker: true,
      requestedSticker: true,
      receiver: { select: { name: true } },
    }
  });

  return NextResponse.json(newOffer, { status: 201 });
}
