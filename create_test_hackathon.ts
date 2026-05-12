import { PrismaClient, CompetitionStatus, CompetitionDifficulty, Specialty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const startDate = new Date(year, month, day, 14, 16);
  const endDate = new Date(year, month, day, 14, 35);

  // Checkpoints only need dueDate. Frontend calculates opensAt = dueDate - 15 mins.
  const cp1End = new Date(year, month, day, 14, 32); // Opens at 14:17
  const cp2End = new Date(year, month, day, 14, 34); // Opens at 14:19

  // Find an admin or company user to be the creator
  const creator = await prisma.user.findFirst({
    where: {
      role: { in: ['ADMIN', 'COMPANY'] }
    }
  });

  if (!creator) {
    console.error('No admin or company user found to create the hackathon.');
    return;
  }

  const competition = await prisma.competition.create({
    data: {
      title: 'Hackathon de Test (Arena of Coders)',
      description: 'Hackathon de test avec fenêtres de soumission courtes et anti-triche désactivé.',
      startDate,
      endDate,
      difficulty: CompetitionDifficulty.MEDIUM,
      rewardPool: 500,
      maxParticipants: 50,
      status: CompetitionStatus.OPEN_FOR_ENTRY,
      specialty: Specialty.FULLSTACK,
      antiCheatEnabled: false,
      createdBy: creator.id,
      checkpoints: {
        create: [
          {
            title: 'Checkpoint 1 - Initialisation',
            description: 'Validation de la structure du projet.',
            dueDate: cp1End,
            order: 1,
          },
          {
            title: 'Checkpoint 2 - Avancement',
            description: 'Validation des fonctionnalités de base.',
            dueDate: cp2End,
            order: 2,
          }
        ]
      }
    }
  });

  console.log('Hackathon created successfully:', competition.id);
  console.log('Title:', competition.title);
  console.log('Status:', competition.status);
  console.log('Start:', startDate.toLocaleTimeString());
  console.log('End:', endDate.toLocaleTimeString());
  console.log('CP1 Due:', cp1End.toLocaleTimeString(), '(Opens at 14:17)');
  console.log('CP2 Due:', cp2End.toLocaleTimeString(), '(Opens at 14:19)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
