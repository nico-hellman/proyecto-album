import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { distributeToUser, type PackCard } from "@/lib/album-data";

const PACK_COSTS: Record<number, number> = {
  1: 100,
  3: 270,
  5: 420,
};

export async function POST(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const packsCount = Number(body?.packsCount);

  if (![1, 3, 5].includes(packsCount)) {
    return NextResponse.json({ error: "Cantidad de sobres inválida. Debe ser 1, 3 o 5." }, { status: 400 });
  }

  const cost = PACK_COSTS[packsCount];

  try {
    // 1. Verify and deduct points in a transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.userId },
        select: { points: true },
      });

      if (!user) {
        throw new Error("Usuario no encontrado.");
      }

      if (user.points < cost) {
        throw new Error(`Puntos insuficientes. Necesitas ${cost} pts.`);
      }

      // Deduct points
      return await tx.user.update({
        where: { id: session.userId },
        data: { points: { decrement: cost } },
        select: { points: true },
      });
    });

    // 2. Distribute the stickers (calling distributeToUser for each pack)
    const allOpenedCards: PackCard[] = [];
    for (let i = 0; i < packsCount; i++) {
      const packCards = await distributeToUser(session.userId);
      allOpenedCards.push(...packCards);
    }

    return NextResponse.json({
      ok: true,
      newPoints: updatedUser.points,
      cards: allOpenedCards,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al realizar la compra." }, { status: 400 });
  }
}
