import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAlbumForUser } from "@/lib/album-data";
import { prisma } from "@/lib/db";
import TradesClient from "@/components/TradesClient";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Retrieve current user's stickers
  const album = await getAlbumForUser(session.userId);

  // Retrieve all stickers in the database
  const allStickers = await prisma.sticker.findMany();

  // Retrieve all active trade offers
  const offers = await prisma.tradeOffer.findMany({
    where: { status: "PENDING" },
    include: {
      sender: { select: { name: true, email: true } },
      offeredSticker: true,
      requestedSticker: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter public offers (from other users) and my own offers
  const publicOffers = offers.filter((o) => o.senderId !== session.userId);
  const myOffers = offers.filter((o) => o.senderId === session.userId);

  // Serialize Date objects to ISO strings for Next.js boundary passing
  const serializablePublicOffers = publicOffers.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
  }));

  const serializableMyOffers = myOffers.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <TradesClient
      initialPublicOffers={serializablePublicOffers}
      initialMyOffers={serializableMyOffers}
      myStickers={album.stickers}
      allStickers={allStickers}
      userName={session.name}
      isAdmin={session.role === "ADMIN"}
    />
  );
}
