import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.log('No ADMIN found');
    return;
  }

  const now = new Date();
  
  // Set dates specifically to today's date
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 54, 0);
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 20, 0);
  
  const cp1Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 10, 0);
  const cp2Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 12, 0);

  const competition = await prisma.competition.create({
    data: {
      title: 'Hackathon Test Rapide (Anti-Cheat OFF)',
      description: 'Hackathon pour tester les checkpoints et la soumission finale.',
      difficulty: 'MEDIUM',
      specialty: null,
      startDate,
      endDate,
      status: 'OPEN_FOR_ENTRY',
      rewardPool: 500,
      maxParticipants: 100,
      antiCheatEnabled: false,
      createdBy: admin.id,
      checkpoints: {
        create: [
          {
            title: 'Checkpoint 1',
            description: 'Valider le repo',
            order: 1,
            dueDate: cp1Date,
          },
          {
            title: 'Checkpoint 2',
            description: 'Premier push',
            order: 2,
            dueDate: cp2Date,
          }
        ]
      }
    }
  });

  console.log('Hackathon created successfully!');
  console.log('ID:', competition.id);
  console.log('Start Date:', competition.startDate);
  console.log('End Date:', competition.endDate);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
