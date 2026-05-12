import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { firstName: { contains: 'Amin', mode: 'insensitive' } },
        { firstName: { contains: 'Amine', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      totalChallenges: true,
      totalWins: true
    }
  });

  console.log("Utilisateurs trouvés :");
  users.forEach(u => {
    console.log(`- ID: ${u.id} | Nom: ${u.firstName} ${u.lastName} | Email: ${u.email} | Ch: ${u.totalChallenges} | Wins: ${u.totalWins}`);
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
