import { PrismaClient, CompetitionStatus, CompetitionDifficulty, Specialty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const year = 2026;
  const month = 4; // May is month 4 (0-indexed)
  const day = 12;

  const startDate = new Date(year, month, day, 0, 22);
  const endDate = new Date(year, month, day, 0, 52);

  // Checkpoints
  const cp1End = new Date(year, month, day, 0, 43); // Opens at 00:28
  const cp2End = new Date(year, month, day, 0, 45); // Opens at 00:30

  // Find the specific admin user
  let creator = await prisma.user.findFirst({
    where: { email: 'admin@test.com' }
  });

  if (!creator) {
    console.log('Admin user not found, using first available admin/company...');
    creator = await prisma.user.findFirst({
        where: { role: { in: ['ADMIN', 'COMPANY'] } }
    });
  }

  if (!creator) {
    console.error('No admin or company user found to create the hackathon.');
    return;
  }

  const competition = await prisma.competition.create({
    data: {
      title: 'Hackathon Test Application',
      description: 'Sujet : Créer une application pour hackathon. Test de flux avec checkpoints.',
      startDate,
      endDate,
      difficulty: CompetitionDifficulty.EASY,
      rewardPool: 0,
      maxParticipants: 100,
      status: CompetitionStatus.OPEN_FOR_ENTRY, // Changed from SCHEDULED to OPEN_FOR_ENTRY so users can join immediately
      specialty: Specialty.FULLSTACK, // 'FULLSTACK' or similar, user said 'tout specialite' so we could use a general one or handle it in logic
      antiCheatEnabled: false,
      createdBy: creator.id,
      checkpoints: {
        create: [
          {
            title: 'Checkpoint 1 - Setup',
            description: 'Configuration initiale et structure de l\'application.',
            dueDate: cp1End,
            order: 1,
          },
          {
            title: 'Checkpoint 2 - Core',
            description: 'Fonctionnalités principales implémentées.',
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
  console.log('Start:', startDate.toLocaleString());
  console.log('End:', endDate.toLocaleString());
  console.log('CP1 Due:', cp1End.toLocaleString(), '(Opens at 00:28)');
  console.log('CP2 Due:', cp2End.toLocaleString(), '(Opens at 00:30)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
