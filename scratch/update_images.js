const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const updates = [
    { slug: "pudu", imageUrl: "/images/pudu.jpg" },
    { slug: "huemul", imageUrl: "/images/huemul.jpg" },
    { slug: "monito-del-monte", imageUrl: "/images/monito-del-monte.jpg" },
    { slug: "zorro-de-darwin", imageUrl: "/images/zorro-de-darwin.jpg" },
  ];

  for (const item of updates) {
    const res = await prisma.sticker.updateMany({
      where: { slug: item.slug },
      data: { imageUrl: item.imageUrl },
    });
    console.log(`Updated ${item.slug}:`, res);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
