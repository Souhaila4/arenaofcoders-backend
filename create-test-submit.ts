import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  
  // Hackathon: 00:12 -> 00:32
  const startDate = new Date(year, month, day, 0, 12, 0);
  const endDate = new Date(year, month, day, 0, 32, 0);
  
  // Checkpoint 1: 00:15 -> 00:25
  const cp1Start = new Date(year, month, day, 0, 15, 0);
  const cp1End = new Date(year, month, day, 0, 25, 0);
  
  // Checkpoint 2: 00:18 -> 00:30
  const cp2Start = new Date(year, month, day, 0, 18, 0);
  const cp2End = new Date(year, month, day, 0, 30, 0);

  const hackathonId = '6a0000000000000000000100';
  const cp1Id = '6a0000000000000000000101';
  const cp2Id = '6a0000000000000000000102';

  // Delete old test if exists
  try {
    await prisma.checkpointSubmission.deleteMany({ where: { checkpoint: { competitionId: hackathonId } } });
    await prisma.competitionCheckpoint.deleteMany({ where: { competitionId: hackathonId } });
    await prisma.competitionParticipant.deleteMany({ where: { competitionId: hackathonId } });
    await prisma.equipeMember.deleteMany({ where: { equipe: { competitionId: hackathonId } } });
    await prisma.equipe.deleteMany({ where: { competitionId: hackathonId } });
    await prisma.competition.deleteMany({ where: { id: hackathonId } });
  } catch (e) {}

  const localTimeStr = startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  
  await prisma.competition.create({
    data: {
      id: hackathonId,
      title: `Admin Hackathon Test (${localTimeStr})`,
      description: 'Test complet créé par admin@test.com. Anti-cheat désactivé.',
      difficulty: 'HARD',
      startDate,
      endDate,
      status: 'RUNNING',
      antiCheatEnabled: false,
      antiCheatThreshold: 70,
      maxParticipants: 100,
      rewardPool: 1000,
      creator: { connect: { id: '69a0d59c3bfb0cadedabb6cb' } },
      checkpoints: {
        create: [
          {
            id: cp1Id,
            title: 'Analyse & Design',
            description: 'Architecture et maquettes',
            dueDate: cp1End,
            order: 1,
          },
          {
            id: cp2Id,
            title: 'MVP Backend',
            description: 'API et base de données',
            dueDate: cp2End,
            order: 2,
          },
        ],
      },
    },
  });

  console.log('✅ Hackathon Admin créé !');
  console.log(`   Titre: Admin Hackathon Test (${localTimeStr})`);
  console.log(`   ID: ${hackathonId}`);
  console.log(`   Créateur: admin@test.com`);
  console.log(`   Début: ${startDate.toLocaleTimeString('fr-FR')}`);
  console.log(`   Fin: ${endDate.toLocaleTimeString('fr-FR')}`);
  console.log(`   CP1: ${cp1Start.toLocaleTimeString('fr-FR')} → ${cp1End.toLocaleTimeString('fr-FR')}`);
  console.log(`   CP2: ${cp2Start.toLocaleTimeString('fr-FR')} → ${cp2End.toLocaleTimeString('fr-FR')}`);

  await prisma.$disconnect();
}

main();
