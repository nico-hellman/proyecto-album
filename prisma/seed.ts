import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedSticker = {
  number: number;
  slug: string;
  name: string;
  category: "MAMIFEROS" | "AVES" | "REPTILES_ANFIBIOS" | "FAUNA_MARINA";
  description: string;
  rarity: "COMUN" | "RARA" | "EPICA" | "LEGENDARIA";
  emoji: string;
};

// 18 animales chilenos. La rareza modela cuán icónica/amenazada es la especie.
const STICKERS: SeedSticker[] = [
  // 🏔️ Mamíferos
  {
    number: 1,
    slug: "huemul",
    name: "Huemul",
    category: "MAMIFEROS",
    description: "Ciervo andino en peligro de extinción y emblema nacional de Chile. Habita la cordillera patagónica y se caracteriza por su pelaje grueso y comportamiento tímido.",
    rarity: "LEGENDARIA",
    emoji: "🦌",
  },
  {
    number: 2,
    slug: "guanaco",
    name: "Guanaco",
    category: "MAMIFEROS",
    description: "Camélido silvestre de las estepas y zonas altoandinas chilenas. Posee un cuello largo y esbelto y pelaje marrón claro. Es un gran corredor patagónico.",
    rarity: "COMUN",
    emoji: "🦙",
  },
  {
    number: 3,
    slug: "pudu",
    name: "Pudú",
    category: "MAMIFEROS",
    description: "Uno de los ciervos más pequeños del mundo. Vive oculto en los densos bosques templados lluviosos del sur de Chile y se alimenta de hojas y brotes.",
    rarity: "RARA",
    emoji: "🫎",
  },
  {
    number: 4,
    slug: "monito-del-monte",
    name: "Monito del monte",
    category: "MAMIFEROS",
    description: "Pequeño marsupial arborícola endémico del sur de Chile. Considerado un \"fósil viviente\" debido a que su linaje se remonta a millones de años.",
    rarity: "EPICA",
    emoji: "🐿️",
  },
  {
    number: 5,
    slug: "zorro-de-darwin",
    name: "Zorro de Darwin",
    category: "MAMIFEROS",
    description: "Uno de los cánidos más amenazados del planeta. Es endémico de Chile, habitando principalmente la Isla de Chiloé y la cordillera de Nahuelbuta.",
    rarity: "LEGENDARIA",
    emoji: "🦊",
  },
  {
    number: 6,
    slug: "coipo",
    name: "Coipo",
    category: "MAMIFEROS",
    description: "Roedor semiacuático de gran tamaño que vive en humedales y ríos. Destaca por sus grandes incisivos naranjas y sus patas traseras palmeadas.",
    rarity: "COMUN",
    emoji: "🦫",
  },
  {
    number: 7,
    slug: "chingue",
    name: "Chingue",
    category: "MAMIFEROS",
    description: "Zorrillo nativo de pelaje negro con dos bandas blancas. Conocido por su potente líquido defensivo oloroso que ahuyenta a cualquier amenaza.",
    rarity: "COMUN",
    emoji: "🦨",
  },
  // 🦅 Aves
  {
    number: 8,
    slug: "condor",
    name: "Cóndor",
    category: "AVES",
    description: "El ave voladora más grande del mundo por envergadura. Habita las altas cumbres de los Andes, cumpliendo un rol clave como limpiador del ecosistema.",
    rarity: "LEGENDARIA",
    emoji: "🦅",
  },
  {
    number: 9,
    slug: "tiuque",
    name: "Tiuque / Cernícalo",
    category: "AVES",
    description: "Rapaces muy comunes en Chile. El Tiuque es oportunista y carroñero, mientras que el Cernícalo destaca por su capacidad de suspenderse en el aire para cazar.",
    rarity: "COMUN",
    emoji: "🪶",
  },
  {
    number: 10,
    slug: "chincol",
    name: "Chincol",
    category: "AVES",
    description: "El pájaro cantor más emblemático y familiar de campos y ciudades de Chile. Reconocible por su copete gris y su collar rojizo en la nuca.",
    rarity: "COMUN",
    emoji: "🐦",
  },
  {
    number: 11,
    slug: "cisne-cuello-negro",
    name: "Cisne de cuello negro",
    category: "AVES",
    description: "Majestuosa ave acuática de lagunas del sur de Chile. Resalta por su cuerpo blanco, cuello negro y una llamativa carúncula roja en el pico.",
    rarity: "RARA",
    emoji: "🦢",
  },
  {
    number: 12,
    slug: "picaflor-juan-fernandez",
    name: "Picaflor de Juan Fernández",
    category: "AVES",
    description: "Colibrí endémico del archipiélago de Juan Fernández en peligro crítico de extinción. El macho luce un plumaje naranja ladrillo brillante.",
    rarity: "EPICA",
    emoji: "🐤",
  },
  // 🦎 Reptiles y Anfibios
  {
    number: 13,
    slug: "iguana-chilena",
    name: "Iguana chilena",
    category: "REPTILES_ANFIBIOS",
    description: "El reptil terrestre más grande de Chile, endémico del país. De hábitos diurnos y herbívoros, habita en laderas pedregosas de la zona central.",
    rarity: "RARA",
    emoji: "🦎",
  },
  {
    number: 14,
    slug: "culebra-cola-larga",
    name: "Culebra de cola larga",
    category: "REPTILES_ANFIBIOS",
    description: "Reptil inofensivo que habita matorrales y bosques. De cuerpo delgado grisáceo, es una gran aliada en el control biológico de roedores.",
    rarity: "COMUN",
    emoji: "🐍",
  },
  {
    number: 15,
    slug: "sapo-cuatro-ojos",
    name: "Sapo de cuatro ojos",
    category: "REPTILES_ANFIBIOS",
    description: "Pequeño anfibio nativo muy común cerca de cuerpos de agua. Su nombre proviene de dos glándulas traseras que asemejan ojos para asustar depredadores.",
    rarity: "RARA",
    emoji: "🐸",
  },
  // 🌊 Fauna Marina
  {
    number: 16,
    slug: "lobo-marino",
    name: "Lobo marino común",
    category: "FAUNA_MARINA",
    description: "Mamífero marino robusto que forma colonias en las rocas costeras de todo Chile. Se alimenta de peces, pulpos y moluscos.",
    rarity: "COMUN",
    emoji: "🦭",
  },
  {
    number: 17,
    slug: "delfin-chileno",
    name: "Delfín chileno (Tonina)",
    category: "FAUNA_MARINA",
    description: "Pequeño y tímido delfín endémico de las costas frías de Chile, reconocible por sus aletas redondeadas y su coloración grisácea.",
    rarity: "EPICA",
    emoji: "🐬",
  },
  {
    number: 18,
    slug: "pinguino-humboldt",
    name: "Pingüino de Humboldt",
    category: "FAUNA_MARINA",
    description: "Ave marina no voladora que anida en las costas de Chile y Perú. Posee una banda negra en el pecho y sufre por la alteración de su hábitat.",
    rarity: "RARA",
    emoji: "🐧",
  },
];

const USERS = [
  { email: "admin@album.cl", name: "Administrador", role: "ADMIN", password: "admin123" },
  { email: "ana@album.cl", name: "Ana", role: "USER", password: "demo1234" },
  { email: "benito@album.cl", name: "Benito", role: "USER", password: "demo1234" },
  { email: "carla@album.cl", name: "Carla", role: "USER", password: "demo1234" },
];

async function main() {
  for (const s of STICKERS) {
    await prisma.sticker.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
  }

  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash },
      create: { email: u.email, name: u.name, role: u.role, passwordHash },
    });
  }

  // Asociar todas las calcomanías al administrador
  const admin = await prisma.user.findUnique({ where: { email: "admin@album.cl" } });
  if (admin) {
    const allStickers = await prisma.sticker.findMany();
    for (const s of allStickers) {
      await prisma.userSticker.upsert({
        where: { userId_stickerId: { userId: admin.id, stickerId: s.id } },
        update: { quantity: 1, isNew: false },
        create: { userId: admin.id, stickerId: s.id, quantity: 1, isNew: false },
      });
    }
  }

  console.log(
    `✅ Seed listo: ${STICKERS.length} calcomanías y ${USERS.length} usuarios.\n` +
      `   Admin:  admin@album.cl / admin123\n` +
      `   Demo:   ana@album.cl · benito@album.cl · carla@album.cl  (clave: demo1234)`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
