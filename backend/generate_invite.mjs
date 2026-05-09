import { prisma } from './prismaClient.mjs';

async function main() {
  const code = "WELCOME2026";
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const invite = await prisma.inviteCode.upsert({
    where: { code },
    update: { used: false, expiresAt },
    create: { code, expiresAt }
  });

  console.log("Invite code created/reset:", invite.code);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
