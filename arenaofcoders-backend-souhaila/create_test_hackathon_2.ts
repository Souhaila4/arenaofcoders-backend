import { PrismaClient, CompetitionStatus, CompetitionDifficulty, Specialty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const startDate = new Date(year, month, day, 14, 39);
  const endDate = new Date(year, month, day, 14, 59);

  // Checkpoints (Frontend opens 15 mins before due date)
  const cp1End = new Date(year, month, day, 14, 55); // Opens 14:40
  const cp2End = new Date(year, month, day, 14, 56); // Opens 14:41

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
      title: 'Hackathon Final Test (Arena of Coders)',
      description: 'Hackathon pour tester la ré-soumission et le partage du score.',
      startDate,
      endDate,
      difficulty: CompetitionDifficulty.MEDIUM,
      rewardPool: 1000,
      maxParticipants: 100,
      status: CompetitionStatus.OPEN_FOR_ENTRY,
      specialty: Specialty.FULLSTACK,
      antiCheatEnabled: false,
      createdBy: creator.id,
      checkpoints: {
        create: [
          {
            title: 'Checkpoint 1 - Setup',
            description: 'Validation du repository.',
            dueDate: cp1End,
            order: 1,
          },
          {
            title: 'Checkpoint 2 - Alpha',
            description: 'Validation de la première version.',
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
