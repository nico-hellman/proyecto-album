import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProfileClient from "@/components/ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id: profileUserId } = await params;

  // Retrieve the profile user
  const profileUser = await prisma.user.findUnique({
    where: { id: profileUserId },
    include: {
      achievements: true,
      stickers: {
        include: { sticker: true },
        orderBy: { sticker: { number: "asc" } },
      },
    },
  });

  if (!profileUser) {
    notFound();
  }

  // Count total stickers available in the game
  const totalStickersCount = await prisma.sticker.count();

  // Compute stats
  const distinctOwned = profileUser.stickers.filter((s) => s.quantity >= 1).length;
  const totalCards = profileUser.stickers.reduce((acc, s) => acc + s.quantity, 0);
  const completionPercent = totalStickersCount
    ? Math.round((distinctOwned / totalStickersCount) * 100)
    : 0;

  // Retrieve current user's owned stickers to offer in a trade
  const currentUserStickers = await prisma.userSticker.findMany({
    where: { userId: session.userId, quantity: { gte: 1 } },
    include: { sticker: true },
    orderBy: { sticker: { number: "asc" } },
  });

  // Serialize dates and objects for boundary passing
  const serializableProfileUser = {
    id: profileUser.id,
    name: profileUser.name,
    email: profileUser.email,
    points: profileUser.points,
    createdAt: profileUser.createdAt.toISOString(),
    achievements: profileUser.achievements.map((a) => ({
      id: a.id,
      achievementId: a.achievementId,
      unlockedAt: a.unlockedAt.toISOString(),
    })),
    stickers: profileUser.stickers.map((s) => ({
      id: s.sticker.id,
      number: s.sticker.number,
      name: s.sticker.name,
      emoji: s.sticker.emoji,
      rarity: s.sticker.rarity,
      quantity: s.quantity,
    })),
  };

  const serializableCurrentUserStickers = currentUserStickers.map((cs) => ({
    id: cs.sticker.id,
    number: cs.sticker.number,
    name: cs.sticker.name,
    emoji: cs.sticker.emoji,
    rarity: cs.sticker.rarity,
    quantity: cs.quantity,
  }));

  return (
    <ProfileClient
      profileUser={serializableProfileUser}
      currentUserStickers={serializableCurrentUserStickers}
      currentUserId={session.userId}
      stats={{
        distinctOwned,
        totalCards,
        totalStickersCount,
        completionPercent,
      }}
    />
  );
}
