import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'fortnitenessim@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.error("Utilisateur non trouvé :", email);
    return;
  }

  // Compter les participations réelles
  const actualChallenges = await prisma.competitionParticipant.count({
    where: { userId: user.id }
  });

  // Compter les victoires réelles
  const actualWins = await prisma.competitionParticipant.count({
    where: { 
      userId: user.id,
      isWinner: true
    }
  });

  // Mettre à jour l'utilisateur
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      totalChallenges: actualChallenges,
      totalWins: actualWins
    }
  });

  console.log(`Compte synchronisé pour ${user.firstName} ${user.lastName} (${email}) :`);
  console.log(`- Challenges : ${actualChallenges} (était ${user.totalChallenges})`);
  console.log(`- Wins : ${actualWins} (était ${user.totalWins})`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
