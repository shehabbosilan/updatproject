import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  for (const tenant of tenants) {
    if (!tenant.email) {
      const tempEmail = `${tenant.username}@local.com`;
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { email: tempEmail }
      });
      console.log(`Migrated tenant ${tenant.username} -> ${tempEmail}`);
    }
  }
  console.log("Migration complete.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
