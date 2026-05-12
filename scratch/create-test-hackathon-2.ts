import { PrismaClient, Specialty, CompetitionDifficulty, CompetitionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  
  const creator = await prisma.user.findFirst({
    where: { role: { in: ['COMPANY', 'ADMIN'] } }
  });

  if (!creator) {
    console.error("Erreur: Aucun utilisateur COMPANY ou ADMIN trouvé.");
    return;
  }

  // Hackathon: 20:40 - 21:00
  const startDate = new Date(now);
  startDate.setHours(20, 40, 0, 0);
  
  const endDate = new Date(now);
  endDate.setHours(21, 0, 0, 0);

  const competition = await prisma.competition.create({
    data: {
      title: "Hackathon de Test (Niveau 2)",
      description: "Nouveau hackathon avec 3 checkpoints et un prix de 750 AC.",
      startDate,
      endDate,
      difficulty: CompetitionDifficulty.MEDIUM,
      status: CompetitionStatus.OPEN_FOR_ENTRY,
      isActive: true,
      rewardPool: 750,
      antiCheatEnabled: false,
      createdBy: creator.id,
      checkpoints: {
        create: [
          { title: "Checkpoint 1", description: "Alpha phase", order: 1, dueDate: new Date(new Date(now).setHours(20, 56, 0, 0)) },
          { title: "Checkpoint 2", description: "Beta phase", order: 2, dueDate: new Date(new Date(now).setHours(20, 57, 0, 0)) },
          { title: "Checkpoint 3", description: "Final polish", order: 3, dueDate: new Date(new Date(now).setHours(20, 58, 0, 0)) }
        ]
      }
    }
  });

  console.log('Hackathon créé avec succès ! ID:', competition.id);
  console.log('Prix:', competition.rewardPool, 'AC');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
