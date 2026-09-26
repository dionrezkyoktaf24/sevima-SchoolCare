import "dotenv/config";
import { prisma } from "../src/lib/db/prisma";

async function main() {
  console.log("Seeding development schools data...");

  const schools = [
    {
      id: "SMKN1-SBY",
      name: "SMK Negeri 1 Surabaya",
      city: "Surabaya",
    },
    {
      id: "SMK-TELKOM-SBY",
      name: "SMK Telkom Surabaya",
      city: "Surabaya",
    },
  ];

  for (const school of schools) {
    const record = await prisma.school.upsert({
      where: { id: school.id },
      update: {
        name: school.name,
        city: school.city,
      },
      create: {
        id: school.id,
        name: school.name,
        city: school.city,
      },
    });
    console.log(`Seeded school: ${record.id} - ${record.name}`);
  }

  console.log("Database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
