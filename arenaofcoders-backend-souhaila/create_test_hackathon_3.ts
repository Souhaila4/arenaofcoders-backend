import { PrismaClient, CompetitionStatus, CompetitionDifficulty, Specialty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const startDate = new Date(year, month, day, 14, 57);
  const endDate = new Date(year, month, day, 15, 22);

  // Checkpoints
  const cp1End = new Date(year, month, day, 15, 13);
  const cp2End = new Date(year, month, day, 15, 15);

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
      title: 'Hackathon Express (Arena of Coders)',
      description: 'Test rapide des soumissions et des checkpoints collectifs.',
      startDate,
      endDate,
      difficulty: CompetitionDifficulty.MEDIUM,
      rewardPool: 750,
      maxParticipants: 80,
      status: CompetitionStatus.OPEN_FOR_ENTRY,
      specialty: Specialty.FULLSTACK,
      antiCheatEnabled: false,
      createdBy: creator.id,
      checkpoints: {
        create: [
          {
            title: 'CP1 - Repo Setup',
            description: 'Validation repository.',
            dueDate: cp1End,
            order: 1,
          },
          {
            title: 'CP2 - Logic Alpha',
            description: 'Validation de la logique métier.',
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
