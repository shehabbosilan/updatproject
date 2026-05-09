import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = "owner@admin.com";
  const password = "ownerpassword"; // Default password, can be changed later

  const existingOwner = await prisma.tenant.findUnique({
    where: { email }
  });

  if (existingOwner) {
    console.log("Owner already exists. Skipping seed.");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const owner = await prisma.tenant.create({
    data: {
      email,
      password: hashedPassword,
      role: "owner",
      status: "active",
      plan: "pro",
      deleted: false
    }
  });

  console.log(`Initial owner account created:
Email: ${owner.email}
Password: ${password}
Please login and change your password immediately.
  `);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
