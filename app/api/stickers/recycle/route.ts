import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

const RECYCLE_POINTS: Record<string, number> = {
  COMUN: 10,
  RARA: 25,
  EPICA: 60,
  LEGENDARIA: 150,
};

export async function POST(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const stickerId = body?.stickerId;

  if (!stickerId) {
    return NextResponse.json({ error: "ID de calcomanía requerido." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch the user's sticker ownership
      const userSticker = await tx.userSticker.findUnique({
        where: {
          userId_stickerId: { userId: session.userId, stickerId },
        },
        include: { sticker: true },
      });

      if (!userSticker || userSticker.quantity < 2) {
        throw new Error("No posees calcomanías repetidas de esta especie para reciclar.");
      }

      // 2. Retrieve points based on rarity
      const pointsToAward = RECYCLE_POINTS[userSticker.sticker.rarity] ?? 10;

      // 3. Decrement quantity in UserSticker
      const updatedUserSticker = await tx.userSticker.update({
        where: { id: userSticker.id },
        data: { quantity: { decrement: 1 } },
      });

      // 4. Increment user points
      const updatedUser = await tx.user.update({
        where: { id: session.userId },
        data: { points: { increment: pointsToAward } },
      });

      return {
        stickerId,
        newQuantity: updatedUserSticker.quantity,
        newPoints: updatedUser.points,
        pointsAwarded: pointsToAward,
      };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al reciclar." }, { status: 400 });
  }
}
