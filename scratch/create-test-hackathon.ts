import { PrismaClient, Specialty, CompetitionDifficulty, CompetitionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  
  // Chercher un utilisateur de type COMPANY ou ADMIN pour être le créateur
  const creator = await prisma.user.findFirst({
    where: { role: { in: ['COMPANY', 'ADMIN'] } }
  });

  if (!creator) {
    console.error("Erreur: Aucun utilisateur COMPANY ou ADMIN trouvé pour créer le hackathon.");
    return;
  }

  // Hackathon: 20:30 - 20:55
  const startDate = new Date(now);
  startDate.setHours(20, 30, 0, 0);
  
  const endDate = new Date(now);
  endDate.setHours(20, 55, 0, 0);

  // Checkpoints dates limites
  const cp1Due = new Date(now);
  cp1Due.setHours(20, 47, 0, 0);

  const cp2Due = new Date(now);
  cp2Due.setHours(20, 49, 0, 0);

  const competition = await prisma.competition.create({
    data: {
      title: "Hackathon de Test (Rapide)",
      description: "Hackathon créé pour tester le flux de matching et les checkpoints.",
      startDate,
      endDate,
      difficulty: CompetitionDifficulty.MEDIUM,
      status: CompetitionStatus.OPEN_FOR_ENTRY,
      isActive: true,
      antiCheatEnabled: false,
      createdBy: creator.id,
      checkpoints: {
        create: [
          {
            title: "Checkpoint 1",
            description: "Premier point de contrôle",
            order: 1,
            dueDate: cp1Due,
          },
          {
            title: "Checkpoint 2",
            description: "Second point de contrôle",
            order: 2,
            dueDate: cp2Due,
          }
        ]
      }
    }
  });

  console.log('Hackathon créé avec succès ! ID:', competition.id);
  console.log('Créé par:', creator.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
