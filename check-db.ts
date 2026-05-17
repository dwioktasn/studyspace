import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users in DB:");
  users.forEach(u => {
    console.log(`- Username: ${u.username}`);
    console.log(`  Password (first 10 chars): ${u.password.substring(0, 10)}...`);
    console.log(`  Is bcrypt hash? ${u.password.startsWith('$2a$') || u.password.startsWith('$2b$') ? 'YES' : 'NO'}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
