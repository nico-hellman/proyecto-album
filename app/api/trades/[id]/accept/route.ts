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
  const currentUserId = session.userId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch the trade offer
      const offer = await tx.tradeOffer.findUnique({
        where: { id: offerId },
      });
      if (!offer) throw new Error("La oferta de intercambio no existe.");
      if (offer.status !== "PENDING") throw new Error("Esta oferta ya no está activa.");
      if (offer.senderId === currentUserId) throw new Error("No puedes aceptar tu propia oferta.");

      // 2. Verify that the sender owns the offered sticker
      const senderSticker = await tx.userSticker.findUnique({
        where: { userId_stickerId: { userId: offer.senderId, stickerId: offer.offeredStickerId } },
      });
      if (!senderSticker || senderSticker.quantity < 1) {
        throw new Error("El ofertante original ya no posee el sticker ofrecido.");
      }

      // 3. Verify that the current user owns the requested sticker
      const receiverSticker = await tx.userSticker.findUnique({
        where: { userId_stickerId: { userId: currentUserId, stickerId: offer.requestedStickerId } },
      });
      if (!receiverSticker || receiverSticker.quantity < 1) {
        throw new Error("No posees el sticker solicitado para concretar el intercambio.");
      }

      // --- EXECUTE THE SWAP ---

      // A) Sender loses the offered sticker
      if (senderSticker.quantity === 1) {
        await tx.userSticker.delete({ where: { id: senderSticker.id } });
      } else {
        await tx.userSticker.update({
          where: { id: senderSticker.id },
          data: { quantity: { decrement: 1 } },
        });
      }

      // B) Receiver gains the offered sticker
      const receiverOffered = await tx.userSticker.findUnique({
        where: { userId_stickerId: { userId: currentUserId, stickerId: offer.offeredStickerId } },
      });
      if (receiverOffered) {
        await tx.userSticker.update({
          where: { id: receiverOffered.id },
          data: { quantity: { increment: 1 }, isNew: true },
        });
      } else {
        await tx.userSticker.create({
          data: { userId: currentUserId, stickerId: offer.offeredStickerId, quantity: 1, isNew: true },
        });
      }

      // C) Receiver loses the requested sticker
      if (receiverSticker.quantity === 1) {
        await tx.userSticker.delete({ where: { id: receiverSticker.id } });
      } else {
        await tx.userSticker.update({
          where: { id: receiverSticker.id },
          data: { quantity: { decrement: 1 } },
        });
      }

      // D) Sender gains the requested sticker
      const senderRequested = await tx.userSticker.findUnique({
        where: { userId_stickerId: { userId: offer.senderId, stickerId: offer.requestedStickerId } },
      });
      if (senderRequested) {
        await tx.userSticker.update({
          where: { id: senderRequested.id },
          data: { quantity: { increment: 1 }, isNew: true },
        });
      } else {
        await tx.userSticker.create({
          data: { userId: offer.senderId, stickerId: offer.requestedStickerId, quantity: 1, isNew: true },
        });
      }

      // E) Mark offer as ACCEPTED
      const updatedOffer = await tx.tradeOffer.update({
        where: { id: offerId },
        data: { status: "ACCEPTED" },
      });

      // F) Award 15 points to both trade sender and receiver
      await tx.user.update({
        where: { id: offer.senderId },
        data: { points: { increment: 15 } },
      });
      await tx.user.update({
        where: { id: currentUserId },
        data: { points: { increment: 15 } },
      });

      return updatedOffer;
    });

    return NextResponse.json({ ok: true, trade: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al procesar el intercambio." }, { status: 400 });
  }
}
