import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const competitionId = '6a01d85b4e5cb4be61866abe';

  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      participants: true,
      equipes: {
        include: {
          members: true
        }
      }
    }
  });

  if (!competition) {
    console.log('Competition not found');
    return;
  }

  console.log('--- Competition ---');
  console.log('Title:', competition.title);
  console.log('Participants Count:', competition.participants.length);
  
  console.log('\n--- Equipes ---');
  for (const equipe of competition.equipes) {
    console.log(`Equipe: ${equipe.name} (ID: ${equipe.id})`);
    console.log(`  SubmittedAt: ${equipe.submittedAt}`);
    console.log(`  Members: ${equipe.members.length}`);
    for (const member of equipe.members) {
      const p = competition.participants.find(part => part.userId === member.userId);
      console.log(`    - UserID: ${member.userId} | Role: ${member.role} | Status: ${p?.status}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
