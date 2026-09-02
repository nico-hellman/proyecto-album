import "server-only";
import { prisma } from "@/lib/db";
import {
  weightedSampleDistinct,
  STICKERS_PER_PACK,
  ACHIEVEMENTS,
  type Album,
  type AlbumSticker,
  type AdminOverview,
  type AchievementMeta,
  type UserAchievementData,
} from "@/lib/album";

export type { Album, AlbumSticker };

/** Resumen para el panel admin: usuarios coleccionistas y su progreso. */
export async function getAdminOverview(): Promise<AdminOverview> {
  const totalStickers = await prisma.sticker.count();
  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    orderBy: { createdAt: "asc" },
    include: { stickers: true },
  });

  const rows = users.map((u) => {
    const owned = u.stickers.length;
    const totalCards = u.stickers.reduce((a, s) => a + s.quantity, 0);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      owned,
      completion: totalStickers ? Math.round((owned / totalStickers) * 100) : 0,
      totalCards,
      repes: totalCards - owned,
      createdAt: u.createdAt.toISOString(),
    };
  });

  return { totalStickers, totalUsers: rows.length, users: rows };
}

export function evaluateAchievements(stickers: AlbumSticker[], repesCount: number): string[] {
  const owned = stickers.filter((s) => s.owned);
  const ownedSlugs = new Set(owned.map((s) => s.slug));
  const unlockedIds: string[] = [];

  // 1. BEGINNER
  if (owned.length >= 5) unlockedIds.push("BEGINNER");

  // 2. ANDEAN
  if (ownedSlugs.has("huemul") && ownedSlugs.has("condor")) unlockedIds.push("ANDEAN");

  // 3. PATAGONIA
  if (
    ownedSlugs.has("huemul") &&
    ownedSlugs.has("pudu") &&
    ownedSlugs.has("monito-del-monte") &&
    ownedSlugs.has("zorro-de-darwin") &&
    ownedSlugs.has("delfin-chileno")
  ) {
    unlockedIds.push("PATAGONIA");
  }

  // 4. ORNITHOLOGIST
  const totalBirds = stickers.filter((s) => s.category === "AVES");
  if (totalBirds.length > 0 && totalBirds.every((s) => s.owned)) {
    unlockedIds.push("ORNITHOLOGIST");
  }

  // 5. MARINE
  const totalMarine = stickers.filter((s) => s.category === "FAUNA_MARINA");
  if (totalMarine.length > 0 && totalMarine.every((s) => s.owned)) {
    unlockedIds.push("MARINE");
  }

  // 6. HERPETOLOGIST
  const totalHerp = stickers.filter((s) => s.category === "REPTILES_ANFIBIOS");
  if (totalHerp.length > 0 && totalHerp.every((s) => s.owned)) {
    unlockedIds.push("HERPETOLOGIST");
  }

  // 7. FIRST_LEGENDARY
  if (owned.some((s) => s.rarity === "LEGENDARIA")) {
    unlockedIds.push("FIRST_LEGENDARY");
  }

  // 8. TYCOON
  if (repesCount >= 10) unlockedIds.push("TYCOON");

  return unlockedIds;
}

export async function getAlbumForUser(userId: string): Promise<Album> {
  const [stickers, dbAchievements, user] = await Promise.all([
    prisma.sticker.findMany({ orderBy: { number: "asc" } }),
    prisma.userAchievement.findMany({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { points: true } }),
  ]);

  const initialPoints = user?.points ?? 0;
  let owned = await prisma.userSticker.findMany({ where: { userId } });

  const mapStickers = (ownedList: typeof owned) => {
    const map = new Map(ownedList.map((o) => [o.stickerId, o]));
    return stickers.map((s) => {
      const us = map.get(s.id);
      return {
        id: s.id,
        number: s.number,
        slug: s.slug,
        name: s.name,
        category: s.category,
        description: s.description,
        rarity: s.rarity,
        emoji: s.emoji,
        imageUrl: s.imageUrl,
        owned: !!us,
        quantity: us?.quantity ?? 0,
        isNew: us?.isNew ?? false,
      };
    });
  };

  let items = mapStickers(owned);
  let ownedCount = items.filter((i) => i.owned).length;
  let repes = owned.reduce((a, o) => a + Math.max(0, o.quantity - 1), 0);

  // Evaluate achievements
  const evaluatedIds = evaluateAchievements(items, repes);
  const dbUnlockedIds = new Set(dbAchievements.map((a) => a.achievementId));

  const newlyUnlockedMeta: AchievementMeta[] = [];
  let databaseModified = false;

  for (const id of evaluatedIds) {
    if (!dbUnlockedIds.has(id)) {
      // Save unlock event to DB
      await prisma.userAchievement.create({
        data: { userId, achievementId: id },
      });
      // Distribute 1 free pack of reward stickers
      await distributeToUser(userId, STICKERS_PER_PACK);

      // Award 100 points to the user for unlocking the achievement
      await prisma.user.update({
        where: { id: userId },
        data: { points: { increment: 100 } },
      });
      
      const meta = ACHIEVEMENTS.find((a) => a.id === id);
      if (meta) newlyUnlockedMeta.push(meta);
      databaseModified = true;
    }
  }

  // If new reward cards were added or points changed, re-query stats
  if (databaseModified) {
    owned = await prisma.userSticker.findMany({ where: { userId } });
    items = mapStickers(owned);
    ownedCount = items.filter((i) => i.owned).length;
    repes = owned.reduce((a, o) => a + Math.max(0, o.quantity - 1), 0);
  }

  const finalDbAchievements = databaseModified
    ? await prisma.userAchievement.findMany({ where: { userId } })
    : dbAchievements;

  const finalUser = databaseModified
    ? await prisma.user.findUnique({ where: { id: userId }, select: { points: true } })
    : user;

  const finalPoints = finalUser?.points ?? 0;
  const finalDbUnlockedIds = new Set(finalDbAchievements.map((a) => a.achievementId));

  const achievementsList: UserAchievementData[] = ACHIEVEMENTS.map((a) => {
    const dbRecord = finalDbAchievements.find((da) => da.achievementId === a.id);
    return {
      id: a.id,
      unlocked: finalDbUnlockedIds.has(a.id),
      unlockedAt: dbRecord ? dbRecord.unlockedAt.toISOString() : null,
    };
  });

  const newCount = owned.filter((o) => o.isNew).length;

  return {
    stickers: items,
    stats: {
      total: stickers.length,
      owned: ownedCount,
      completion: stickers.length ? Math.round((ownedCount / stickers.length) * 100) : 0,
      repes,
      newCount,
      points: finalPoints,
    },
    achievements: achievementsList,
    newlyUnlocked: newlyUnlockedMeta,
  };
}

export type PackCard = {
  id: string;
  number: number;
  name: string;
  emoji: string;
  rarity: string;
  category: string;
  isRepe: boolean; // ya la tenía
  quantity: number; // cuántas tiene tras este sobre
};

/** Entrega `n` calcomanías (distintas dentro del sobre) a un usuario. */
export async function distributeToUser(
  userId: string,
  n: number = STICKERS_PER_PACK
): Promise<PackCard[]> {
  const pool = await prisma.sticker.findMany();
  if (pool.length === 0) return [];
  const picks = weightedSampleDistinct(pool, n);

  const cards: PackCard[] = [];
  for (const p of picks) {
    const existing = await prisma.userSticker.findUnique({
      where: { userId_stickerId: { userId, stickerId: p.id } },
    });
    let quantity: number;
    let isRepe: boolean;
    if (existing) {
      const updated = await prisma.userSticker.update({
        where: { id: existing.id },
        data: { quantity: { increment: 1 }, isNew: true },
      });
      quantity = updated.quantity;
      isRepe = true;
    } else {
      await prisma.userSticker.create({
        data: { userId, stickerId: p.id, quantity: 1, isNew: true },
      });
      quantity = 1;
      isRepe = false;
    }
    cards.push({
      id: p.id,
      number: p.number,
      name: p.name,
      emoji: p.emoji,
      rarity: p.rarity,
      category: p.category,
      isRepe,
      quantity,
    });
  }
  return cards;
}

export type DistributionSummary = {
  usersReached: number;
  perUser: number;
  totalGiven: number;
};

/** Botón "Dar calcomanías": entrega a todos los usuarios coleccionistas (no admins). */
export async function distributeToAllUsers(
  n: number = STICKERS_PER_PACK
): Promise<DistributionSummary> {
  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    select: { id: true },
  });
  let totalGiven = 0;
  for (const u of users) {
    const cards = await distributeToUser(u.id, n);
    totalGiven += cards.length;
  }
  return { usersReached: users.length, perUser: n, totalGiven };
}

/** Marca como "vistas" las calcomanías nuevas tras la animación de apertura. */
export async function markStickersSeen(userId: string): Promise<void> {
  await prisma.userSticker.updateMany({
    where: { userId, isNew: true },
    data: { isNew: false },
  });
}
