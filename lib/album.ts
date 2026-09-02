// Metadatos compartidos del álbum (cliente + servidor). Sin imports de servidor.

export type Rarity = "COMUN" | "RARA" | "EPICA" | "LEGENDARIA";
export type CategoryKey = "MAMIFEROS" | "AVES" | "REPTILES_ANFIBIOS" | "FAUNA_MARINA";

export type RarityMeta = {
  key: Rarity;
  label: string;
  /** Color principal (texto/acentos). */
  color: string;
  /** Gradiente de la carta cuando está obtenida. */
  gradient: string;
  /** Color del resplandor (glow). */
  glow: string;
  /** Peso relativo en el sorteo: más raro → menos probable. */
  weight: number;
};

export const RARITIES: Record<Rarity, RarityMeta> = {
  COMUN: {
    key: "COMUN",
    label: "Común",
    color: "#9fb3c8",
    gradient: "linear-gradient(150deg,#3b4a5e 0%,#1c2533 100%)",
    glow: "rgba(159,179,200,0.35)",
    weight: 60,
  },
  RARA: {
    key: "RARA",
    label: "Rara",
    color: "#4cc2ff",
    gradient: "linear-gradient(150deg,#0ea5e9 0%,#13315c 100%)",
    glow: "rgba(76,194,255,0.45)",
    weight: 25,
  },
  EPICA: {
    key: "EPICA",
    label: "Épica",
    color: "#c98bff",
    gradient: "linear-gradient(150deg,#a855f7 0%,#3b1366 100%)",
    glow: "rgba(201,139,255,0.5)",
    weight: 12,
  },
  LEGENDARIA: {
    key: "LEGENDARIA",
    label: "Legendaria",
    color: "#ffcf5a",
    gradient: "linear-gradient(150deg,#f59e0b 0%,#7c4a03 100%)",
    glow: "rgba(255,207,90,0.6)",
    weight: 3,
  },
};

export const RARITY_ORDER: Rarity[] = ["LEGENDARIA", "EPICA", "RARA", "COMUN"];

export function rarityMeta(r: string): RarityMeta {
  return RARITIES[(r as Rarity)] ?? RARITIES.COMUN;
}

export type CategoryMeta = { key: CategoryKey; label: string; emoji: string };

export const CATEGORIES: CategoryMeta[] = [
  { key: "MAMIFEROS", label: "Mamíferos", emoji: "🏔️" },
  { key: "AVES", label: "Aves", emoji: "🦅" },
  { key: "REPTILES_ANFIBIOS", label: "Reptiles y Anfibios", emoji: "🦎" },
  { key: "FAUNA_MARINA", label: "Fauna Marina", emoji: "🌊" },
];

export function categoryMeta(key: string): CategoryMeta {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];
}

/**
 * Toma `n` elementos distintos del pool con probabilidad ponderada por rareza
 * (sin reemplazo dentro del mismo sobre → un sobre no trae repetidos).
 * Que sean "ya las tenga o no" se resuelve al sumar a la colección del usuario.
 */
export function weightedSampleDistinct<T extends { rarity: string }>(
  pool: T[],
  n: number
): T[] {
  const items = [...pool];
  const out: T[] = [];
  const count = Math.min(n, items.length);
  for (let k = 0; k < count; k++) {
    const weights = items.map((it) => rarityMeta(it.rarity).weight);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    out.push(items[idx]);
    items.splice(idx, 1);
  }
  return out;
}

export const STICKERS_PER_PACK = 5;

// ---- Tipos del álbum (compartidos cliente/servidor) ----
export type AlbumSticker = {
  id: string;
  number: number;
  slug: string;
  name: string;
  category: string;
  description: string;
  rarity: string;
  emoji: string;
  imageUrl: string | null;
  owned: boolean;
  quantity: number;
  isNew: boolean;
};

export type AlbumStats = {
  total: number;
  owned: number;
  completion: number; // %
  repes: number; // copias duplicadas acumuladas
  newCount: number; // calcomanías sin "revelar"
  points: number; // Puntos del usuario
};

export type UserAchievementData = {
  id: string;
  unlocked: boolean;
  unlockedAt: string | null;
};

export type AchievementMeta = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  rewardText: string;
};

export const ACHIEVEMENTS: AchievementMeta[] = [
  {
    id: "BEGINNER",
    title: "Coleccionista Iniciado",
    description: "Consigue tus primeras 5 especies distintas en el álbum.",
    emoji: "🎒",
    rewardText: "+1 Sobre gratis",
  },
  {
    id: "ANDEAN",
    title: "Explorador Andino",
    description: "Colecciona al Huemul y al Cóndor, reyes de la cordillera.",
    emoji: "🏔️",
    rewardText: "+1 Sobre gratis",
  },
  {
    id: "PATAGONIA",
    title: "Amante de la Patagonia",
    description: "Colecciona al Huemul, Pudú, Monito del monte, Zorro de Darwin y Delfín chileno.",
    emoji: "🌲",
    rewardText: "+1 Sobre gratis",
  },
  {
    id: "ORNITHOLOGIST",
    title: "Ornitólogo",
    description: "Colecciona todas las especies de Aves en tu álbum.",
    emoji: "🦅",
    rewardText: "+1 Sobre gratis",
  },
  {
    id: "MARINE",
    title: "Biólogo Marino",
    description: "Colecciona toda la fauna marina del álbum.",
    emoji: "🌊",
    rewardText: "+1 Sobre gratis",
  },
  {
    id: "HERPETOLOGIST",
    title: "Herpetólogo",
    description: "Colecciona todos los reptiles y anfibios del álbum.",
    emoji: "🦎",
    rewardText: "+1 Sobre gratis",
  },
  {
    id: "FIRST_LEGENDARY",
    title: "Poder Ancestral",
    description: "Consigue tu primera calcomanía de rareza Legendaria.",
    emoji: "✨",
    rewardText: "+1 Sobre gratis",
  },
  {
    id: "TYCOON",
    title: "Gran Magnate",
    description: "Acumula al menos 10 calcomanías repetidas.",
    emoji: "👑",
    rewardText: "+1 Sobre gratis",
  },
];

export type Album = {
  stickers: AlbumSticker[];
  stats: AlbumStats;
  achievements?: UserAchievementData[];
  newlyUnlocked?: AchievementMeta[];
};

// ---- Tipos del panel admin ----
export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  owned: number;
  completion: number;
  totalCards: number;
  repes: number;
  createdAt: string;
};

export type AdminOverview = {
  totalStickers: number;
  totalUsers: number;
  users: AdminUserRow[];
};
